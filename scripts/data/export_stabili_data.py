#!/usr/bin/env python3
"""Export validated, compact Stabili records for static GitHub Pages hosting."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from derive_stabili_data import HEALTH_ALGORITHM_VERSION, iter_json_array


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "stabili_derived.json"
DEFAULT_NORMALIZED_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_normalized.json"
DEFAULT_OUTPUT_DIRECTORY = REPOSITORY_ROOT / "public" / "data"
DEFAULT_REPORT_PATH = REPOSITORY_ROOT / "data" / "reports" / "export-report.json"
SCHEMA_VERSION = "1.0.0"
MAX_SHARD_BYTES = 40 * 1024 * 1024
MAX_PRODUCTION_VIOLATION_DETAILS = 10
MAX_PRODUCTION_COMPLAINT_DETAILS = 5

BOROUGH_SLUGS = {
    "Bronx": "bronx",
    "Brooklyn": "brooklyn",
    "Manhattan": "manhattan",
    "Queens": "queens",
    "Staten Island": "staten_island",
}
FILE_SLUGS = {**{value: value for value in BOROUGH_SLUGS.values()}, "staten_island": "staten-island"}
HEALTH_STATES = {"low_concern", "some_concerns", "higher_concern", "insufficient_data"}
MATCH_STATUSES = {"matched", "ambiguous", "unmatched"}
SECRET_KEY = re.compile(r"(?:api[_-]?key|authorization|password|secret|token)", re.I)
FORBIDDEN_CONTENT = re.compile(
    r"(?:\.example\b|unsplash(?:\.com)?|\b(?:\+?1[ .-])?\(?\d{3}\)?[ .-]+555[ .-]+\d{4}\b|\b555[ .-]+\d{4}\b)",
    re.I,
)

DATASET_SPECS = {
    "dhcr-2024": (
        "NYS HCR 2024 Building Registration File",
        "Rent-stabilized building rows published by New York State Homes and Community Renewal.",
        None,
    ),
    "kj4p-ruqc": (
        "Buildings Subject to HPD Jurisdiction",
        "HPD building identifiers and attributes.",
        "https://data.cityofnewyork.us/d/kj4p-ruqc",
    ),
    "64uk-42ks": (
        "Primary Land Use Tax Lot Output (PLUTO)",
        "NYC parcel identifiers, attributes, and coordinates.",
        "https://data.cityofnewyork.us/d/64uk-42ks",
    ),
    "tesw-yqqr": (
        "Multiple Dwelling Registrations",
        "Latest HPD multiple-dwelling registration records.",
        "https://data.cityofnewyork.us/d/tesw-yqqr",
    ),
    "feu5-w2e2": (
        "HPD Registration Contacts",
        "Official owner, agent, and responsible-party registration contacts.",
        "https://data.cityofnewyork.us/d/feu5-w2e2",
    ),
    "wvxf-dwi5": (
        "Housing Maintenance Code Violations",
        "Open and recent HPD housing-maintenance violations.",
        "https://data.cityofnewyork.us/d/wvxf-dwi5",
    ),
    "ygpa-z7cr": (
        "Housing Maintenance Complaints and Problems",
        "Recent HPD complaint and problem records.",
        "https://data.cityofnewyork.us/d/ygpa-z7cr",
    ),
    "wz6d-d3jb": (
        "Bedbug Reporting",
        "Recent HPD annual bedbug filings.",
        "https://data.cityofnewyork.us/d/wz6d-d3jb",
    ),
    "tb8q-a3ar": (
        "Orders to Repair or Vacate",
        "Active and most recent HPD repair or vacate orders.",
        "https://data.cityofnewyork.us/d/tb8q-a3ar",
    ),
}


def compact_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def read_object(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return value


def normalized_utc(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def nullable_nonnegative_int(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) and value >= 0 else None


def address(source: Any) -> dict[str, Any]:
    value = source if isinstance(source, Mapping) else {}
    borough = BOROUGH_SLUGS.get(value.get("borough"))
    return {
        "addressLine1": value.get("addressLine") if isinstance(value.get("addressLine"), str) else None,
        "addressLine2": None,
        "borough": borough,
        "zipCode": value.get("zip") if isinstance(value.get("zip"), str) else None,
    }


def business_address(source: Any) -> dict[str, Any] | None:
    if not isinstance(source, Mapping):
        return None
    line1 = " ".join(
        str(part).strip() for part in (source.get("houseNumber"), source.get("street")) if part
    ) or None
    line2 = source.get("apartment") if isinstance(source.get("apartment"), str) else None
    if line1 is None and line2 is None and not source.get("zip"):
        return None
    return {
        "addressLine1": line1,
        "addressLine2": line2,
        "borough": None,
        "zipCode": source.get("zip") if isinstance(source.get("zip"), str) else None,
    }


def available(section: Any) -> Mapping[str, Any] | None:
    return section if isinstance(section, Mapping) and section.get("availability") == "available" else None


def management_record(source: Any) -> dict[str, Any] | None:
    if not isinstance(source, Mapping):
        return None
    agent = source.get("primaryContact") if isinstance(source.get("primaryContact"), Mapping) else None
    owners = source.get("owners") if isinstance(source.get("owners"), list) else []
    owner = next((item for item in owners if isinstance(item, Mapping)), None)
    if agent is None and owner is None:
        return None
    contact = agent or owner or {}
    return {
        "managingAgentName": agent.get("displayName") if agent else None,
        "managingAgentId": agent.get("registrationContactId") if agent else None,
        "registeredOwnerName": owner.get("displayName") if owner else None,
        "businessAddress": business_address(contact.get("businessAddress")),
        "phone": None,
        "email": None,
        "website": None,
    }


def health_explanation(state: str) -> str:
    return {
        "low_concern": "Available HPD condition indicators are below the Building Health V1 concern thresholds.",
        "some_concerns": "One or more HPD condition indicators cross a Building Health V1 concern threshold.",
        "higher_concern": "HPD condition indicators cross the Building Health V1 higher-concern threshold.",
        "insufficient_data": "Required HPD condition indicators were unavailable, so no rating was assigned.",
    }[state]


def violation_data(conditions: Mapping[str, Any]) -> dict[str, Any]:
    section = available(conditions.get("violations"))
    if section is None:
        return {"totalCount": None, "openCount": None, "hazardousCount": None, "immediatelyHazardousCount": None, "details": None}
    details = []
    source_details = section.get("details") or []
    for item in source_details[:MAX_PRODUCTION_VIOLATION_DETAILS]:
        if not isinstance(item, Mapping) or not item.get("violationId"):
            continue
        details.append({
            "id": str(item["violationId"]),
            "sourceAgency": "NYC HPD",
            "class": item.get("class") if isinstance(item.get("class"), str) else None,
            "status": item.get("status") if isinstance(item.get("status"), str) else None,
            "description": item.get("description") if isinstance(item.get("description"), str) else None,
            "location": None,
            "issuedAt": normalized_utc(item.get("issuedDate")),
            "correctedAt": normalized_utc(item.get("certifiedDate")),
        })
    total = len(source_details) if section.get("detailTruncated") is False else None
    return {
        "totalCount": total,
        "openCount": nullable_nonnegative_int(section.get("openCount")),
        "hazardousCount": nullable_nonnegative_int(section.get("openClassBCount")),
        "immediatelyHazardousCount": nullable_nonnegative_int(section.get("openClassCCount")),
        "details": details,
    }


def complaint_data(conditions: Mapping[str, Any]) -> dict[str, Any]:
    section = available(conditions.get("complaints"))
    if section is None:
        return {"totalCount": None, "openCount": None, "details": None}
    details = []
    for item in (section.get("recentDetails") or [])[:MAX_PRODUCTION_COMPLAINT_DETAILS]:
        if not isinstance(item, Mapping) or not (item.get("problemId") or item.get("complaintId")):
            continue
        status = item.get("status") if isinstance(item.get("status"), str) else None
        details.append({
            "id": str(item.get("problemId") or item.get("complaintId")),
            "sourceAgency": "NYC HPD",
            "category": item.get("category") if isinstance(item.get("category"), str) else None,
            "status": status,
            "description": item.get("description") if isinstance(item.get("description"), str) else None,
            "receivedAt": normalized_utc(item.get("date")),
            "closedAt": normalized_utc(item.get("statusDate")) if status and status.upper().startswith("CLOSE") else None,
        })
    return {
        "totalCount": nullable_nonnegative_int(section.get("complaintCountLast36Months")),
        "openCount": nullable_nonnegative_int(section.get("openProblemCount")),
        "details": details,
    }


def bedbug_data(conditions: Mapping[str, Any]) -> list[dict[str, Any]] | None:
    section = available(conditions.get("bedbugs"))
    if section is None:
        return None
    result = []
    for item in section.get("recentHistory") or []:
        if not isinstance(item, Mapping):
            continue
        start, end = item.get("reportingPeriodStart"), item.get("reportingPeriodEnd")
        period = f"{start} to {end}" if start and end else str(start or end or "").strip()
        if not period:
            continue
        result.append({
            "reportingPeriod": period,
            "infestationCount": nullable_nonnegative_int(item.get("infestedUnits")),
            "eradicationCount": nullable_nonnegative_int(item.get("eradicatedUnits")),
            "reinfestationCount": nullable_nonnegative_int(item.get("reInfestedUnits")),
            "filingStatus": "filed" if item.get("filingDate") else None,
        })
    return result


def vacate_data(conditions: Mapping[str, Any]) -> dict[str, Any]:
    section = available(conditions.get("vacateRepairOrders"))
    if section is None:
        return {"totalCount": None, "activeCount": None, "details": None}
    details = []
    for item in section.get("activeDetails") or []:
        if not isinstance(item, Mapping) or not item.get("orderNumber"):
            continue
        description = " — ".join(str(part) for part in (item.get("type"), item.get("reason")) if part) or None
        details.append({
            "id": str(item["orderNumber"]),
            "sourceAgency": "NYC HPD",
            "status": "active",
            "description": description,
            "issuedAt": normalized_utc(item.get("effectiveDate")),
            "rescindedAt": normalized_utc(item.get("rescindedDate")),
        })
    active_count = nullable_nonnegative_int(section.get("activeCount"))
    return {"totalCount": active_count, "activeCount": active_count, "details": details}


def production_record(derived: Mapping[str, Any], normalized: Mapping[str, Any], generated_at: str) -> dict[str, Any]:
    identifier = derived.get("stabiliId")
    source = normalized.get("sourceMetadata") if isinstance(normalized.get("sourceMetadata"), Mapping) else {}
    parcel = normalized.get("parcel") if isinstance(normalized.get("parcel"), Mapping) else {}
    conditions = derived.get("conditions") if isinstance(derived.get("conditions"), Mapping) else {}
    health = derived.get("health") if isinstance(derived.get("health"), Mapping) else {}
    health_state = health.get("state")
    attributes = derived.get("buildingAttributes") if isinstance(derived.get("buildingAttributes"), Mapping) else None
    match_status = derived.get("matchStatus")
    if health_state not in HEALTH_STATES or match_status not in MATCH_STATUSES:
        raise ValueError(f"{identifier}: invalid health or property-match status")
    building = None if attributes is None else {
        "buildingClass": attributes.get("buildingClass") if isinstance(attributes.get("buildingClass"), str) else None,
        "yearBuilt": nullable_nonnegative_int(attributes.get("yearBuilt")),
        "stories": attributes.get("stories") if isinstance(attributes.get("stories"), (int, float)) and not isinstance(attributes.get("stories"), bool) else None,
        "residentialUnits": nullable_nonnegative_int(attributes.get("residentialUnits")),
        "totalUnits": nullable_nonnegative_int(attributes.get("totalUnits")),
        "ownershipType": attributes.get("ownershipType") if isinstance(attributes.get("ownershipType"), str) else None,
    }
    retrieved = source_retrieval_dates(derived)
    return {
        "id": identifier,
        "source": {
            "agency": source.get("agency"),
            "datasetName": source.get("dataset"),
            "sourceYear": nullable_nonnegative_int(source.get("sourceYear")),
            "sourceFile": source.get("sourceFile"),
            "sourcePage": nullable_nonnegative_int(source.get("sourcePage")),
            "sourceRow": nullable_nonnegative_int(source.get("sourceRow")),
            "sourceRecordId": normalized.get("sourceRecordId"),
            "sourceUrl": None,
        },
        "primaryAddress": address(normalized.get("primaryAddress")),
        "alternateAddresses": [address(item) for item in normalized.get("alternateAddresses") or []],
        "identifiers": {
            "block": parcel.get("block") if isinstance(parcel.get("block"), str) else None,
            "lot": parcel.get("lot") if isinstance(parcel.get("lot"), str) else None,
            "bbl": derived.get("bbl") if isinstance(derived.get("bbl"), str) else None,
            "bin": derived.get("bin") if isinstance(derived.get("bin"), str) else None,
            "hpdBuildingId": derived.get("hpdBuildingId") if isinstance(derived.get("hpdBuildingId"), str) else None,
        },
        "stabilizationStatus": "Listed in the 2024 DHCR Building Registration File",
        "classifications": [item for item in normalized.get("classifications") or [] if isinstance(item, str)],
        "propertyMatch": {"status": match_status, "method": None, "confidence": None, "reviewNote": None},
        "building": building,
        "management": management_record(derived.get("management")),
        "health": {
            "state": health_state,
            "explanation": health_explanation(health_state),
            "evaluatedAt": normalized_utc(health.get("evaluatedAsOf")),
            "algorithmVersion": health.get("algorithmVersion") if isinstance(health.get("algorithmVersion"), str) else None,
        },
        "violations": violation_data(conditions),
        "complaints": complaint_data(conditions),
        "bedbugHistory": bedbug_data(conditions),
        "vacateOrders": vacate_data(conditions),
        "relatedStabiliRecordIds": [item for item in derived.get("relatedRecordIds") or [] if isinstance(item, str)],
        "coordinates": {
            "latitude": derived.get("latitude") if isinstance(derived.get("latitude"), (int, float)) and not isinstance(derived.get("latitude"), bool) else None,
            "longitude": derived.get("longitude") if isinstance(derived.get("longitude"), (int, float)) and not isinstance(derived.get("longitude"), bool) else None,
        },
        "freshness": {
            "generatedAt": generated_at,
            "dhcrSourceAsOf": None,
            "hpdRetrievedAt": max(retrieved.values(), default=None),
            "otherSourcesRetrievedAt": retrieved,
        },
    }


def source_retrieval_dates(record: Mapping[str, Any]) -> dict[str, str | None]:
    found: dict[str, str | None] = {}
    attributes = record.get("buildingAttributes")
    if isinstance(attributes, Mapping):
        for item in attributes.get("provenance") or []:
            if isinstance(item, Mapping) and isinstance(item.get("datasetId"), str):
                found[item["datasetId"]] = normalized_utc(item.get("retrievedAt"))
    for key in ("hpdRegistration", "management"):
        value = record.get(key)
        provenance = value.get("provenance") if isinstance(value, Mapping) else None
        if isinstance(provenance, Mapping) and isinstance(provenance.get("datasetId"), str):
            found[provenance["datasetId"]] = normalized_utc(provenance.get("retrievedAt"))
    conditions = record.get("conditions")
    if isinstance(conditions, Mapping):
        for key in ("violations", "complaints", "bedbugs", "vacateRepairOrders"):
            section = conditions.get(key)
            provenance = section.get("provenance") if isinstance(section, Mapping) else None
            if isinstance(provenance, Mapping) and isinstance(provenance.get("datasetId"), str):
                found[provenance["datasetId"]] = normalized_utc(provenance.get("retrievedAt"))
    return found


def index_record(record: Mapping[str, Any], detail_file: str) -> dict[str, Any]:
    management = record.get("management") or {}
    building = record.get("building") or {}
    return {
        "id": record["id"],
        "address": record["primaryAddress"]["addressLine1"],
        "borough": record["primaryAddress"]["borough"],
        "zipCode": record["primaryAddress"]["zipCode"],
        "managementName": management.get("managingAgentName"),
        "ownerName": management.get("registeredOwnerName"),
        "latitude": record["coordinates"]["latitude"],
        "longitude": record["coordinates"]["longitude"],
        "healthState": record["health"]["state"],
        "openViolationCount": record["violations"]["openCount"],
        "complaintsLast36Months": record["complaints"]["totalCount"],
        "residentialUnits": building.get("residentialUnits"),
        "yearBuilt": building.get("yearBuilt"),
        "propertyMatchStatus": record["propertyMatch"]["status"],
        "detailFile": detail_file,
    }


def walk(value: Any, path: str = "$") -> Iterable[tuple[str, Any]]:
    yield path, value
    if isinstance(value, Mapping):
        for key, child in value.items():
            if SECRET_KEY.search(str(key)):
                raise ValueError(f"{path}.{key}: secret-like key is forbidden")
            yield from walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, f"{path}[{index}]")


def validate_record(record: Mapping[str, Any], known_ids: set[str]) -> None:
    required = {
        "id", "source", "primaryAddress", "alternateAddresses", "identifiers",
        "stabilizationStatus", "classifications", "propertyMatch", "building",
        "management", "health", "violations", "complaints", "bedbugHistory",
        "vacateOrders", "relatedStabiliRecordIds", "coordinates", "freshness",
    }
    if set(record) != required:
        raise ValueError(f"{record.get('id')}: production schema keys do not match the established contract")
    identifier = record.get("id")
    if not isinstance(identifier, str) or not identifier:
        raise ValueError("Production record has no ID")
    if record.get("health", {}).get("state") not in HEALTH_STATES:
        raise ValueError(f"{identifier}: invalid health state")
    if record.get("propertyMatch", {}).get("status") not in MATCH_STATUSES:
        raise ValueError(f"{identifier}: invalid match status")
    if not isinstance(record.get("primaryAddress", {}).get("borough"), str):
        raise ValueError(f"{identifier}: missing borough")
    related = record.get("relatedStabiliRecordIds")
    if not isinstance(related, list) or identifier in related or any(item not in known_ids for item in related):
        raise ValueError(f"{identifier}: invalid relatedStabiliRecordIds")
    for path, value in walk(record):
        if isinstance(value, str) and FORBIDDEN_CONTENT.search(value):
            raise ValueError(f"{identifier} {path}: mock/sample content is forbidden")


class ArrayShardWriter:
    def __init__(self, directory: Path, borough: str) -> None:
        self.directory = directory
        self.borough = borough
        self.file_slug = FILE_SLUGS[borough]
        self.part = 0
        self.handle: Any = None
        self.size = 0
        self.count = 0
        self.files: list[Path] = []

    def _open(self) -> None:
        self.part += 1
        path = self.directory / f"{self.file_slug}-{self.part:03d}.json"
        self.handle = path.open("wb")
        self.handle.write(b"[")
        self.size = 1
        self.count = 0
        self.files.append(path)

    def write(self, payload: bytes) -> str:
        extra = len(payload) + (1 if self.count else 0) + 1
        if self.handle is None or (self.count and self.size + extra > MAX_SHARD_BYTES):
            self.close_part()
            self._open()
        assert self.handle is not None
        if self.count:
            self.handle.write(b",")
            self.size += 1
        self.handle.write(payload)
        self.size += len(payload)
        self.count += 1
        return f"buildings/{self.files[-1].name}"

    def close_part(self) -> None:
        if self.handle is not None:
            self.handle.write(b"]\n")
            self.handle.close()
            self.handle = None

    def finish(self) -> dict[str, str]:
        self.close_part()
        if len(self.files) != 1:
            return {}
        old = self.files[0]
        new = old.with_name(f"{self.file_slug}.json")
        old.rename(new)
        self.files[0] = new
        return {f"buildings/{old.name}": f"buildings/{new.name}"}


def report_provenance() -> dict[str, str | None]:
    dates: dict[str, str | None] = {"dhcr-2024": None}
    management_path = REPOSITORY_ROOT / "data" / "reports" / "management-enrichment-report.json"
    condition_path = REPOSITORY_ROOT / "data" / "reports" / "condition-enrichment-report.json"
    if management_path.exists():
        for dataset_id, item in (read_object(management_path).get("datasets") or {}).items():
            if isinstance(item, Mapping):
                dates[dataset_id] = normalized_utc(item.get("retrieved_at"))
    if condition_path.exists():
        for dataset_id, item in (read_object(condition_path).get("coverageByDataset") or {}).items():
            fetch = item.get("fetch") if isinstance(item, Mapping) else None
            if isinstance(fetch, Mapping):
                dates[dataset_id] = normalized_utc(fetch.get("retrieved_at"))
    return dates


def build_metadata(
    generated_at: str,
    counts: Mapping[str, int],
    match_counts: Mapping[str, int],
    files_by_borough: Mapping[str, list[str]],
) -> dict[str, Any]:
    retrieval_dates = report_provenance()
    hpd_dates = [value for key, value in retrieval_dates.items() if key != "dhcr-2024" and value]
    latest_date = max(hpd_dates, default=None)
    dataset_version = f"2024.{latest_date[:10].replace('-', '') if latest_date else generated_at[:10].replace('-', '')}"
    sources = []
    for dataset_id, (name, description, source_url) in DATASET_SPECS.items():
        sources.append({
            "id": dataset_id,
            "name": name,
            "description": description,
            "sourceUrl": source_url,
            "sourceDataAsOf": None,
            "retrievedAt": retrieval_dates.get(dataset_id),
        })
    return {
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": dataset_version,
        "stabilizationSourceYear": 2024,
        "generatedAt": generated_at,
        "hpdRetrievedAt": latest_date,
        "healthAlgorithmVersion": HEALTH_ALGORITHM_VERSION,
        "recordCounts": {"total": sum(counts.values()), "byBorough": dict(counts)},
        "propertyMatchCounts": {status: int(match_counts.get(status, 0)) for status in ("matched", "ambiguous", "unmatched")},
        "buildingFilesByBorough": dict(files_by_borough),
        "sources": sources,
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(compact_json(value) + b"\n")


def export(input_path: Path, normalized_path: Path, output_directory: Path, report_path: Path) -> dict[str, Any]:
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    normalized_rows = json.loads(normalized_path.read_text(encoding="utf-8"))
    if not isinstance(normalized_rows, list):
        raise ValueError("Normalized input must be a JSON array")
    normalized_by_id = {row.get("id"): row for row in normalized_rows if isinstance(row, Mapping)}
    if len(normalized_by_id) != len(normalized_rows):
        raise ValueError("Normalized input contains a missing or duplicate ID")

    all_ids: set[str] = set()
    for row in iter_json_array(input_path):
        identifier = row.get("stabiliId")
        if not isinstance(identifier, str) or identifier in all_ids:
            raise ValueError(f"Derived input contains a missing or duplicate ID: {identifier}")
        all_ids.add(identifier)
    if all_ids != set(normalized_by_id):
        raise ValueError("Derived and normalized inputs do not contain the same record IDs")

    output_directory.parent.mkdir(parents=True, exist_ok=True)
    temp_root = Path(tempfile.mkdtemp(prefix=".stabili-export-", dir=output_directory.parent))
    try:
        temp_data = temp_root / "data"
        building_dir = temp_data / "buildings"
        building_dir.mkdir(parents=True)
        writers = {borough: ArrayShardWriter(building_dir, borough) for borough in FILE_SLUGS}
        counts: Counter[str] = Counter()
        match_counts: Counter[str] = Counter()
        index_rows: list[dict[str, Any]] = []
        field_bytes: Counter[str] = Counter()
        largest = {"id": None, "bytes": 0, "borough": None, "topLevelFieldBytes": {}}
        total_record_bytes = 0

        for derived in iter_json_array(input_path):
            identifier = derived["stabiliId"]
            record = production_record(derived, normalized_by_id[identifier], generated_at)
            validate_record(record, all_ids)
            borough = record["primaryAddress"]["borough"]
            payload = compact_json(record)
            detail_file = writers[borough].write(payload)
            index_rows.append(index_record(record, detail_file))
            counts[borough] += 1
            match_counts[record["propertyMatch"]["status"]] += 1
            total_record_bytes += len(payload)
            record_fields = {key: len(compact_json(value)) for key, value in record.items()}
            field_bytes.update(record_fields)
            if len(payload) > largest["bytes"]:
                largest = {
                    "id": identifier,
                    "bytes": len(payload),
                    "borough": borough,
                    "topLevelFieldBytes": dict(sorted(record_fields.items(), key=lambda item: -item[1])),
                }

        replacements: dict[str, str] = {}
        for writer in writers.values():
            replacements.update(writer.finish())
        for row in index_rows:
            row["detailFile"] = replacements.get(row["detailFile"], row["detailFile"])

        files_by_borough = {
            borough: [f"buildings/{path.name}" for path in writers[borough].files]
            for borough in FILE_SLUGS
        }
        metadata = build_metadata(generated_at, counts, match_counts, files_by_borough)
        for path, value in ((temp_data / "index.json", index_rows), (temp_data / "metadata.json", metadata)):
            for item_path, item in walk(value):
                if isinstance(item, str) and FORBIDDEN_CONTENT.search(item):
                    raise ValueError(f"{path.name} {item_path}: mock/sample content is forbidden")
            write_json(path, value)

        production_files = sorted(temp_data.rglob("*.json"))
        file_rows = []
        for path in production_files:
            parsed = json.loads(path.read_text(encoding="utf-8"))
            count = len(parsed) if isinstance(parsed, list) else 1
            file_rows.append({
                "path": f"public/data/{path.relative_to(temp_data)}",
                "bytes": path.stat().st_size,
                "recordCount": count if path.parent.name == "buildings" or path.name == "index.json" else None,
            })
        total_size = sum(item["bytes"] for item in file_rows)
        report = {
            "generatedAt": generated_at,
            "schemaVersion": SCHEMA_VERSION,
            "files": file_rows,
            "recordCounts": {"total": sum(counts.values()), "byBorough": dict(counts)},
            "propertyMatchCounts": {
                status: int(match_counts.get(status, 0))
                for status in ("matched", "ambiguous", "unmatched")
            },
            "totalProductionDataBytes": total_size,
            "largestRecord": largest,
            "averageDetailedRecordBytes": round(total_record_bytes / max(sum(counts.values()), 1), 2),
            "topLevelFieldBytes": dict(sorted(field_bytes.items(), key=lambda item: -item[1])),
            "shardLimitBytes": MAX_SHARD_BYTES,
            "detailLimitsPerRecord": {
                "violations": MAX_PRODUCTION_VIOLATION_DETAILS,
                "complaints": MAX_PRODUCTION_COMPLAINT_DETAILS,
            },
        }

        output_directory.mkdir(parents=True, exist_ok=True)
        destination_buildings = output_directory / "buildings"
        destination_buildings.mkdir(parents=True, exist_ok=True)
        for stale in destination_buildings.glob("*.json"):
            stale.unlink()
        for source_path in production_files:
            relative = source_path.relative_to(temp_data)
            destination = output_directory / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            os.replace(source_path, destination)
        write_json(report_path, report)
        return report
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--normalized", type=Path, default=DEFAULT_NORMALIZED_PATH)
    parser.add_argument("--output-directory", type=Path, default=DEFAULT_OUTPUT_DIRECTORY)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        report = export(args.input, args.normalized, args.output_directory, args.report)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps({
        "recordCounts": report["recordCounts"],
        "totalProductionDataBytes": report["totalProductionDataBytes"],
        "averageDetailedRecordBytes": report["averageDetailedRecordBytes"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
