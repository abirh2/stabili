from __future__ import annotations

import json
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import nyc_open_data  # noqa: E402


class FakeResponse:
    def __init__(self, payload: list[dict], status: int = 200) -> None:
        self.payload = json.dumps(payload).encode("utf-8")
        self.status = status

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def getcode(self) -> int:
        return self.status

    def read(self) -> bytes:
        return self.payload


class NycOpenDataTests(unittest.TestCase):
    def client(
        self, cache_dir: Path, opener, **kwargs
    ) -> nyc_open_data.NycOpenDataClient:
        return nyc_open_data.NycOpenDataClient(
            app_token="test-token",
            cache_dir=cache_dir,
            opener=opener,
            backoff_seconds=0,
            **kwargs,
        )

    def test_url_and_query_creation(self) -> None:
        params = nyc_open_data.query_parameters(
            select=("bin", "house_number"),
            where="borough='MANHATTAN'",
            order="bin ASC",
            limit=50,
            offset=100,
        )
        self.assertEqual(
            nyc_open_data.build_url("abcd-1234", params),
            "https://data.cityofnewyork.us/resource/abcd-1234.json?"
            "%24select=bin%2Chouse_number&%24where=borough%3D%27MANHATTAN%27&"
            "%24order=bin+ASC&%24limit=50&%24offset=100",
        )

    def test_pagination_stops_after_short_page(self) -> None:
        requested_offsets: list[str] = []

        def opener(request, timeout):
            query = request.full_url.split("?", 1)[1]
            requested_offsets.append(query)
            payload = (
                [{"id": "1"}, {"id": "2"}]
                if "%24offset=0" in query
                else [{"id": "3"}]
            )
            return FakeResponse(payload)

        with tempfile.TemporaryDirectory() as temp_dir:
            result = self.client(Path(temp_dir), opener).fetch_all(
                "abcd-1234", page_size=2
            )
        self.assertEqual([row["id"] for row in result.records], ["1", "2", "3"])
        self.assertEqual(len(requested_offsets), 2)
        self.assertIn("%24offset=2", requested_offsets[1])
        self.assertEqual(result.provenance.query["pages_fetched"], "2")

    def test_identical_query_uses_cache_and_refresh_bypasses_it(self) -> None:
        calls = 0

        def opener(request, timeout):
            nonlocal calls
            calls += 1
            return FakeResponse([{"call": calls}])

        with tempfile.TemporaryDirectory() as temp_dir:
            cache_dir = Path(temp_dir)
            client = self.client(cache_dir, opener)
            first = client.fetch("abcd-1234", limit=1)
            cached = client.fetch("abcd-1234", limit=1)
            refreshed = self.client(cache_dir, opener, refresh_cache=True).fetch(
                "abcd-1234", limit=1
            )
        self.assertEqual(calls, 2)
        self.assertFalse(first.provenance.from_cache)
        self.assertTrue(cached.provenance.from_cache)
        self.assertEqual(refreshed.records, [{"call": 2}])

    def test_missing_token_fails_before_network_request(self) -> None:
        calls = 0

        def opener(request, timeout):
            nonlocal calls
            calls += 1
            return FakeResponse([])

        with tempfile.TemporaryDirectory() as temp_dir:
            env_path = Path(temp_dir) / "missing.env"
            client = nyc_open_data.NycOpenDataClient(
                app_token="", env_path=env_path, cache_dir=Path(temp_dir), opener=opener
            )
            with self.assertRaisesRegex(
                nyc_open_data.MissingAppTokenError, "NYC_OPEN_DATA_APP_TOKEN"
            ):
                client.fetch("abcd-1234", limit=1)
        self.assertEqual(calls, 0)

    def test_transient_rate_limit_retries_with_retry_after(self) -> None:
        attempts = 0
        delays: list[float] = []

        def opener(request, timeout):
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise HTTPError(
                    request.full_url,
                    429,
                    "Too Many Requests",
                    {"Retry-After": "2"},
                    BytesIO(b'{"message":"slow down"}'),
                )
            return FakeResponse([{"ok": True}])

        with tempfile.TemporaryDirectory() as temp_dir:
            result = self.client(
                Path(temp_dir), opener, max_retries=2, sleep=delays.append
            ).fetch("abcd-1234", limit=1)
        self.assertEqual(attempts, 2)
        self.assertEqual(delays, [2.0])
        self.assertEqual(result.records, [{"ok": True}])


if __name__ == "__main__":
    unittest.main()
