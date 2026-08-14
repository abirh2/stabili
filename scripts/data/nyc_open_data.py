#!/usr/bin/env python3
"""Small Socrata client for Stabili's build-time NYC data ingestion."""

from __future__ import annotations

import hashlib
import json
import os
import random
import time
from dataclasses import asdict, dataclass, replace
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any, Callable, Mapping, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ENV_PATH = REPOSITORY_ROOT / ".env"
DEFAULT_CACHE_DIR = REPOSITORY_ROOT / "data" / "intermediate" / "api-cache"
DEFAULT_BASE_URL = "https://data.cityofnewyork.us/resource"
TOKEN_ENV_VAR = "NYC_OPEN_DATA_APP_TOKEN"
CACHE_REFRESH_ENV_VAR = "NYC_OPEN_DATA_CACHE_REFRESH"
TRANSIENT_HTTP_STATUSES = frozenset({408, 425, 429, 500, 502, 503, 504})


class NycOpenDataError(RuntimeError):
    """Base exception for NYC Open Data ingestion failures."""


class MissingAppTokenError(NycOpenDataError):
    """Raised when a network request is attempted without an app token."""


class NycOpenDataRequestError(NycOpenDataError):
    """Raised when Socrata rejects a request or cannot be reached."""


class NycOpenDataResponseError(NycOpenDataError):
    """Raised when Socrata returns malformed or unexpected JSON."""


@dataclass(frozen=True)
class Provenance:
    dataset_id: str
    retrieved_at: str
    query: dict[str, str]
    from_cache: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class FetchResult:
    records: list[dict[str, Any]]
    provenance: Provenance


def _truthy(value: str | None) -> bool:
    return bool(value and value.strip().lower() in {"1", "true", "yes", "on"})


def load_local_env(path: Path = DEFAULT_ENV_PATH) -> None:
    """Load simple KEY=VALUE entries without overriding the process environment."""

    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value[:1] in {"'", '"'}:
            value = value[1:-1]
        if key:
            os.environ.setdefault(key, value)


def query_parameters(
    *,
    select: Sequence[str] | None = None,
    where: str | None = None,
    order: str | None = None,
    limit: int | None = None,
    offset: int | None = None,
) -> dict[str, str]:
    """Create validated Socrata query parameters in a stable order."""

    if limit is not None and limit <= 0:
        raise ValueError("limit must be greater than zero")
    if offset is not None and offset < 0:
        raise ValueError("offset cannot be negative")
    params: dict[str, str] = {}
    if select:
        params["$select"] = ",".join(select)
    if where:
        params["$where"] = where
    if order:
        params["$order"] = order
    if limit is not None:
        params["$limit"] = str(limit)
    if offset is not None:
        params["$offset"] = str(offset)
    return params


def build_url(
    dataset_id: str,
    params: Mapping[str, str] | None = None,
    *,
    base_url: str = DEFAULT_BASE_URL,
) -> str:
    """Build a Socrata resource URL without making a request."""

    dataset_id = dataset_id.strip()
    allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
    if not dataset_id or any(
        character not in allowed for character in dataset_id.lower()
    ):
        raise ValueError(f"invalid Socrata dataset ID: {dataset_id!r}")
    url = f"{base_url.rstrip('/')}/{dataset_id}.json"
    return f"{url}?{urlencode(list((params or {}).items()))}" if params else url


class NycOpenDataClient:
    """Build-time client for the subset of Socrata used by Stabili."""

    def __init__(
        self,
        *,
        app_token: str | None = None,
        env_path: Path = DEFAULT_ENV_PATH,
        cache_dir: Path = DEFAULT_CACHE_DIR,
        refresh_cache: bool | None = None,
        timeout: float = 20.0,
        max_retries: int = 3,
        backoff_seconds: float = 0.5,
        base_url: str = DEFAULT_BASE_URL,
        opener: Callable[..., Any] = urlopen,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        load_local_env(env_path)
        configured_token = (
            app_token if app_token is not None else os.getenv(TOKEN_ENV_VAR, "")
        )
        self.app_token = configured_token.strip()
        self.cache_dir = Path(cache_dir)
        self.refresh_cache = (
            _truthy(os.getenv(CACHE_REFRESH_ENV_VAR))
            if refresh_cache is None
            else refresh_cache
        )
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_seconds = backoff_seconds
        self.base_url = base_url
        self.opener = opener
        self.sleep = sleep

    def fetch(
        self,
        dataset_id: str,
        *,
        select: Sequence[str] | None = None,
        where: str | None = None,
        order: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> FetchResult:
        """Fetch one page, reading/writing the local build cache when enabled."""

        params = query_parameters(
            select=select, where=where, order=order, limit=limit, offset=offset
        )
        url = build_url(dataset_id, params, base_url=self.base_url)
        cache_path = self._cache_path(dataset_id, params)
        if not self.refresh_cache and cache_path.exists():
            return self._read_cache(cache_path)
        if not self.app_token:
            raise MissingAppTokenError(
                f"{TOKEN_ENV_VAR} is required for NYC Open Data network requests. "
                f"Add it to {DEFAULT_ENV_PATH} or export it in the environment."
            )

        records = self._request_json(url, dataset_id)
        provenance = Provenance(
            dataset_id=dataset_id,
            retrieved_at=datetime.now(timezone.utc).isoformat(),
            query=dict(params),
        )
        result = FetchResult(records=records, provenance=provenance)
        self._write_cache(cache_path, result)
        return result

    def fetch_all(
        self,
        dataset_id: str,
        *,
        select: Sequence[str] | None = None,
        where: str | None = None,
        order: str | None = None,
        limit: int | None = None,
        offset: int = 0,
        page_size: int = 1000,
    ) -> FetchResult:
        """Fetch pages until exhausted or the optional overall limit is reached."""

        if page_size <= 0:
            raise ValueError("page_size must be greater than zero")
        if limit is not None and limit <= 0:
            raise ValueError("limit must be greater than zero")
        records: list[dict[str, Any]] = []
        current_offset = offset
        page_provenance: list[Provenance] = []
        while limit is None or len(records) < limit:
            requested = (
                page_size if limit is None else min(page_size, limit - len(records))
            )
            page = self.fetch(
                dataset_id,
                select=select,
                where=where,
                order=order,
                limit=requested,
                offset=current_offset,
            )
            records.extend(page.records)
            page_provenance.append(page.provenance)
            if len(page.records) < requested:
                break
            current_offset += len(page.records)

        aggregate_query = query_parameters(
            select=select, where=where, order=order, limit=limit, offset=offset
        )
        aggregate_query["page_size"] = str(page_size)
        aggregate_query["pages_fetched"] = str(len(page_provenance))
        retrieved_at = (
            page_provenance[-1].retrieved_at
            if page_provenance
            else datetime.now(timezone.utc).isoformat()
        )
        return FetchResult(
            records=records,
            provenance=Provenance(
                dataset_id=dataset_id,
                retrieved_at=retrieved_at,
                query=aggregate_query,
                from_cache=bool(page_provenance)
                and all(item.from_cache for item in page_provenance),
            ),
        )

    def _request_json(self, url: str, dataset_id: str) -> list[dict[str, Any]]:
        request = Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "Stabili data ingestion/1.0",
                "X-App-Token": self.app_token,
            },
        )
        for attempt in range(self.max_retries + 1):
            try:
                with self.opener(request, timeout=self.timeout) as response:
                    status = getattr(response, "status", None)
                    if status is None:
                        status = response.getcode()
                    if not 200 <= status < 300:
                        raise NycOpenDataRequestError(
                            f"NYC Open Data returned HTTP {status} for dataset "
                            f"{dataset_id}"
                        )
                    payload = json.loads(response.read().decode("utf-8"))
                if not isinstance(payload, list) or not all(
                    isinstance(row, dict) for row in payload
                ):
                    raise NycOpenDataResponseError(
                        f"Expected a JSON array of objects from dataset {dataset_id}"
                    )
                return payload
            except HTTPError as error:
                if (
                    error.code in TRANSIENT_HTTP_STATUSES
                    and attempt < self.max_retries
                ):
                    retry_after = (
                        error.headers.get("Retry-After") if error.headers else None
                    )
                    self.sleep(self._retry_delay(attempt, retry_after))
                    continue
                detail = self._http_error_detail(error)
                raise NycOpenDataRequestError(
                    f"NYC Open Data request for dataset {dataset_id} failed with HTTP "
                    f"{error.code}{detail}"
                ) from error
            except (URLError, TimeoutError) as error:
                if attempt < self.max_retries:
                    self.sleep(self._retry_delay(attempt))
                    continue
                raise NycOpenDataRequestError(
                    f"Could not reach NYC Open Data for dataset {dataset_id}: {error}"
                ) from error
            except json.JSONDecodeError as error:
                raise NycOpenDataResponseError(
                    f"NYC Open Data returned invalid JSON for dataset {dataset_id}: {error.msg}"
                ) from error
        raise AssertionError("retry loop exited unexpectedly")

    def _retry_delay(self, attempt: int, retry_after: str | None = None) -> float:
        if retry_after:
            try:
                return max(0.0, float(retry_after))
            except ValueError:
                try:
                    retry_at = parsedate_to_datetime(retry_after)
                    elapsed = retry_at - datetime.now(timezone.utc)
                    return max(0.0, elapsed.total_seconds())
                except (TypeError, ValueError, OverflowError):
                    pass
        jitter = random.uniform(0, self.backoff_seconds / 4)
        return self.backoff_seconds * (2**attempt) + jitter

    @staticmethod
    def _http_error_detail(error: HTTPError) -> str:
        try:
            body = error.read().decode("utf-8", errors="replace")
            payload = json.loads(body)
            message = payload.get("message") or payload.get("error")
            return f": {message}" if message else ""
        except (OSError, UnicodeError, json.JSONDecodeError, AttributeError):
            return ""

    def _cache_path(self, dataset_id: str, params: Mapping[str, str]) -> Path:
        identity = json.dumps(
            {"dataset_id": dataset_id, "query": dict(params)},
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        digest = hashlib.sha256(identity).hexdigest()
        return self.cache_dir / dataset_id / f"{digest}.json"

    @staticmethod
    def _read_cache(path: Path) -> FetchResult:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            provenance = Provenance(**payload["provenance"])
            records = payload["records"]
            if not isinstance(records, list) or not all(
                isinstance(row, dict) for row in records
            ):
                raise ValueError("records must be an array of objects")
            cached_provenance = replace(provenance, from_cache=True)
            return FetchResult(records=records, provenance=cached_provenance)
        except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise NycOpenDataResponseError(
                f"Invalid NYC Open Data cache file {path}: {error}"
            ) from error

    @staticmethod
    def _write_cache(path: Path, result: FetchResult) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(
                {"records": result.records, "provenance": result.provenance.to_dict()},
                indent=2,
                sort_keys=True,
            ),
            encoding="utf-8",
        )
        temporary.replace(path)
