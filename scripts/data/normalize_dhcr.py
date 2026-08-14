#!/usr/bin/env python3
"""Normalize extracted DHCR rows without enriching or merging them."""

from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
from collections import Counter
from pathlib import Path
from typing import Any, Sequence


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_raw.json"
DEFAULT_OUTPUT_PATH = (
    REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_normalized.json"
)
DEFAULT_REPORT_PATH = (
    REPOSITORY_ROOT / "data" / "reports" / "dhcr-normalization-report.json"
)

AGENCY = "NYS Homes and Community Renewal"
DATASET = "2024 Building Registration File"
SOURCE_YEAR = 2024

BOROUGH_CODES = {
    "Manhattan": "1",
    "Bronx": "2",
    "Brooklyn": "3",
    "Queens": "4",
    "Staten Island": "5",
}

SUFFIXES = {
    "ALY": "Alley",
    "AVE": "Avenue",
    "BLVD": "Boulevard",
    "CIR": "Circle",
    "CRES": "Crescent",
    "CT": "Court",
    "DR": "Drive",
    "EXPY": "Expressway",
    "EXT": "Extension",
    "HTS": "Heights",
    "HWY": "Highway",
    "LN": "Lane",
    "LOOP": "Loop",
    "OVAL": "Oval",
    "PARK": "Park",
    "PKWY": "Parkway",
    "PL": "Place",
    "PLZ": "Plaza",
    "PT": "Point",
    "RD": "Road",
    "SLIP": "Slip",
    "SQ": "Square",
    "ST": "Street",
    "TER": "Terrace",
    "TPKE": "Turnpike",
    "VLG": "Village",
    "WALK": "Walk",
}
DIRECTIONS = {
    "N": "North",
    "S": "South",
    "E": "East",
    "W": "West",
    "NE": "Northeast",
    "NW": "Northwest",
    "SE": "Southeast",
    "SW": "Southwest",
}
RAW_FIELD_NAMES = (
    "zip",
    "bldgNo1",
    "street1",
    "streetSuffix1",
    "bldgNo2",
    "street2",
    "streetSuffix2",
    "city",
    "county",
    "status1",
    "status2",
    "status3",
    "block",
    "lot",
)
RANGE_PATTERN = re.compile(r"^(.+?)\s+TO\s+(.+?)$", re.IGNORECASE)
QUEENS_HYPHEN_PATTERN = re.compile(r"^\d+-\d+[A-Z]?$", re.IGNORECASE)
ORDINAL_PATTERN = re.compile(r"^(\d+)(ST|ND|RD|TH)$", re.IGNORECASE)


def stable_stabili_id(record: dict[str, Any]) -> str:
    """Build a UUIDv5 from source identity, never from array position."""

    source_record_id = require_text(record, "sourceRecordId")
    source_file = require_text(record, "sourceFile")
    identity = f"https://stabili.app/source/dhcr/{source_file}#{source_record_id}"
    return f"stabili-{uuid.uuid5(uuid.NAMESPACE_URL, identity)}"


def require_text(record: dict[str, Any], field: str) -> str:
    value = record.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} is missing or is not a non-empty string")
    return value


def normalize_word(value: str) -> str:
    ordinal = ORDINAL_PATTERN.fullmatch(value)
    if ordinal:
        return f"{ordinal.group(1)}{ordinal.group(2).lower()}"
    if value in DIRECTIONS:
        return DIRECTIONS[value]
    return value.title()


def normalize_street_name(raw_name: str | None) -> str | None:
    if raw_name is None:
        return None
    return " ".join(normalize_word(word) for word in raw_name.split())


def normalize_street_suffix(raw_suffix: str | None) -> str | None:
    if raw_suffix is None:
        return None
    return " ".join(
        SUFFIXES.get(word, DIRECTIONS.get(word, normalize_word(word)))
        for word in raw_suffix.split()
    )


def normalize_house_number(raw_number: str | None) -> dict[str, Any] | None:
    if raw_number is None:
        return None
    range_match = RANGE_PATTERN.fullmatch(raw_number.strip())
    if range_match:
        start, end = (part.strip() for part in range_match.groups())
        return {
            "raw": raw_number,
            "normalized": f"{start}\u2013{end}",
            "type": "range",
            "rangeStart": start,
            "rangeEnd": end,
        }
    return {
        "raw": raw_number,
        "normalized": raw_number.strip(),
        "type": (
            "hyphenated" if QUEENS_HYPHEN_PATTERN.fullmatch(raw_number.strip()) else "exact"
        ),
        "rangeStart": None,
        "rangeEnd": None,
    }


def title_with_acronyms(value: str) -> str:
    if re.match(r"^\d", value) or value in {"J-51", "N/A"}:
        return value
    normalized = value.title()
    normalized = re.sub(r"\bOf\b", "of", normalized)
    replacements = {
        "Coop/Condo": "Co-op/Condo",
        "Dhcr": "DHCR",
        "Hpd/Hdc": "HPD/HDC",
        "Hpd": "HPD",
        "Hud": "HUD",
        "Nychh": "NYCHH",
        "Phfl": "PHFL",
        "Pilot": "PILOT",
        "Scrie": "SCRIE",
        "Sro": "SRO",
    }
    for source, replacement in replacements.items():
        normalized = normalized.replace(source, replacement)
    return normalized


def normalized_classifications(record: dict[str, Any]) -> list[str]:
    result: list[str] = []
    for field in ("status1", "status2", "status3"):
        raw_value = record.get(field)
        if raw_value is None:
            continue
        value = title_with_acronyms(raw_value)
        if value not in result:
            result.append(value)
    return result


def address_line(house: dict[str, Any] | None, street: str | None, suffix: str | None) -> str | None:
    parts = [house["normalized"] if house else None, street, suffix]
    line = " ".join(part for part in parts if part)
    return line or None


def normalize_address(
    record: dict[str, Any],
    *,
    number_field: str,
    street_field: str,
    suffix_field: str,
) -> dict[str, Any] | None:
    raw_number = record.get(number_field)
    raw_street = record.get(street_field)
    raw_suffix = record.get(suffix_field)
    if raw_number is None and raw_street is None and raw_suffix is None:
        return None

    house = normalize_house_number(raw_number)
    street = normalize_street_name(raw_street)
    suffix = normalize_street_suffix(raw_suffix)
    line = address_line(house, street, suffix)
    borough = record.get("sourceBorough")
    zip_code = record.get("zip")
    display_parts = [line, borough, f"NY {zip_code}" if zip_code else "NY"]
    return {
        "houseNumber": house,
        "streetName": {"raw": raw_street, "normalized": street},
        "streetSuffix": {"raw": raw_suffix, "normalized": suffix},
        "addressLine": line,
        "borough": borough,
        "zip": zip_code,
        "displayAddress": ", ".join(part for part in display_parts if part),
        "raw": {
            "buildingNumber": raw_number,
            "street": raw_street,
            "streetSuffix": raw_suffix,
            "city": record.get("city"),
            "borough": record.get("sourceBorough"),
            "zip": record.get("zip"),
        },
    }


def parcel_identifiers(record: dict[str, Any]) -> dict[str, str | None]:
    borough = record.get("sourceBorough")
    borough_code = BOROUGH_CODES.get(borough)
    block = record.get("block")
    lot = record.get("lot")
    bbl = None
    parcel_key = None
    if (
        borough_code
        and isinstance(block, str)
        and block.isdigit()
        and len(block) <= 5
        and isinstance(lot, str)
        and lot.isdigit()
        and len(lot) <= 4
    ):
        padded_block = block.zfill(5)
        padded_lot = lot.zfill(4)
        bbl = f"{borough_code}{padded_block}{padded_lot}"
        parcel_key = f"{borough_code}-{padded_block}-{padded_lot}"
    return {
        "borough": borough,
        "boroughCode": borough_code,
        "block": block,
        "lot": lot,
        "bbl": bbl,
        "parcelKey": parcel_key,
    }


def source_metadata(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "agency": AGENCY,
        "dataset": DATASET,
        "sourceYear": SOURCE_YEAR,
        "sourceFile": record.get("sourceFile"),
        "sourceBorough": record.get("sourceBorough"),
        "sourcePage": record.get("sourcePage"),
        "sourceRow": record.get("sourceRowIndex"),
        "rawStatusValues": {
            "status1": record.get("status1"),
            "status2": record.get("status2"),
            "status3": record.get("status3"),
        },
        "rawFields": {field: record.get(field) for field in RAW_FIELD_NAMES},
    }


def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    primary = normalize_address(
        record,
        number_field="bldgNo1",
        street_field="street1",
        suffix_field="streetSuffix1",
    )
    alternate = normalize_address(
        record,
        number_field="bldgNo2",
        street_field="street2",
        suffix_field="streetSuffix2",
    )
    return {
        "id": stable_stabili_id(record),
        "sourceRecordId": require_text(record, "sourceRecordId"),
        "displayAddress": primary["displayAddress"] if primary else None,
        "primaryAddress": primary,
        "alternateAddresses": [alternate] if alternate else [],
        "classifications": normalized_classifications(record),
        "parcel": parcel_identifiers(record),
        "sourceMetadata": source_metadata(record),
    }


def validation_errors(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in ("sourceRecordId", "sourceFile"):
        if not isinstance(record.get(field), str) or not record[field].strip():
            errors.append(f"missing {field}")
    if not any(record.get(field) for field in ("bldgNo1", "street1", "streetSuffix1")):
        errors.append("missing primary address")
    if record.get("sourceBorough") not in BOROUGH_CODES:
        errors.append("unknown borough")
    zip_code = record.get("zip")
    if not isinstance(zip_code, str) or re.fullmatch(r"\d{5}", zip_code) is None:
        errors.append("invalid ZIP")
    for field, width in (("block", 5), ("lot", 4)):
        value = record.get(field)
        if value is not None and (
            not isinstance(value, str) or not value.isdigit() or len(value) > width
        ):
            errors.append(f"invalid {field}")
    return errors


def duplicate_values(values: Sequence[str]) -> list[str]:
    counts = Counter(values)
    return sorted(value for value, count in counts.items() if count > 1)


def build_report(
    raw_records: Sequence[dict[str, Any]],
    normalized_records: Sequence[dict[str, Any]],
    failures: Sequence[dict[str, Any]],
) -> dict[str, Any]:
    parcel_counts = Counter(
        record["parcel"]["parcelKey"]
        for record in normalized_records
        if record["parcel"]["parcelKey"] is not None
    )
    shared_keys = sorted(key for key, count in parcel_counts.items() if count > 1)
    ids = [record["id"] for record in normalized_records]
    source_ids = [record["sourceRecordId"] for record in normalized_records]
    return {
        "source": f"{AGENCY} {DATASET}",
        "recordSemantics": (
            "One normalized record per raw DHCR row; records sharing parcels remain independent."
        ),
        "totals": {
            "totalNormalizedRecords": len(normalized_records),
            "recordsWithPrimaryAddress": sum(
                record["primaryAddress"] is not None for record in normalized_records
            ),
            "recordsWithAlternateAddress": sum(
                bool(record["alternateAddresses"]) for record in normalized_records
            ),
            "addressRanges": sum(
                address is not None
                and address["houseNumber"] is not None
                and address["houseNumber"]["type"] == "range"
                for record in normalized_records
                for address in [
                    record["primaryAddress"],
                    *record["alternateAddresses"],
                ]
            ),
            "recordsWithAddressRanges": sum(
                any(
                    address is not None
                    and address["houseNumber"] is not None
                    and address["houseNumber"]["type"] == "range"
                    for address in [
                        record["primaryAddress"],
                        *record["alternateAddresses"],
                    ]
                )
                for record in normalized_records
            ),
            "sharedParcelKeys": len(shared_keys),
            "recordsSharingParcelKey": sum(
                count for count in parcel_counts.values() if count > 1
            ),
            "missingBlock": sum(record.get("block") is None for record in raw_records),
            "missingLot": sum(record.get("lot") is None for record in raw_records),
            "missingBlockOrLot": sum(
                record.get("block") is None or record.get("lot") is None
                for record in raw_records
            ),
            "normalizationFailures": len(failures),
            "duplicateStabiliIds": len(duplicate_values(ids)),
            "duplicateSourceRecordIds": len(duplicate_values(source_ids)),
        },
        "sharedParcelKeyExamples": [
            {"parcelKey": key, "recordCount": parcel_counts[key]}
            for key in shared_keys[:20]
        ],
        "normalizationFailures": list(failures),
        "assumptions": [
            "Only the explicit word TO denotes an address range; hyphens remain part of NYC house numbers.",
            "The source PDF borough determines the official borough digit used in BBL and parcelKey.",
            "BBL is derived only from numeric block/lot values that fit the official five/four digit components.",
            "Unknown abbreviations are title-cased rather than guessed; raw values remain in sourceMetadata.",
            "No NYC API enrichment, record merging, BIN, or HPD Building ID is performed.",
        ],
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(input_path: Path, output_path: Path, report_path: Path) -> dict[str, Any]:
    raw_value = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(raw_value, list):
        raise ValueError("DHCR raw input must be a JSON array")

    normalized_records: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for index, raw_record in enumerate(raw_value):
        if not isinstance(raw_record, dict):
            failures.append(
                {"inputIndex": index, "sourceRecordId": None, "errors": ["row is not an object"]}
            )
            continue
        errors = validation_errors(raw_record)
        if errors:
            failures.append(
                {
                    "inputIndex": index,
                    "sourceRecordId": raw_record.get("sourceRecordId"),
                    "errors": errors,
                }
            )
        try:
            normalized_records.append(normalize_record(raw_record))
        except ValueError as exc:
            if not errors:
                failures.append(
                    {
                        "inputIndex": index,
                        "sourceRecordId": raw_record.get("sourceRecordId"),
                        "errors": [str(exc)],
                    }
                )

    if len(normalized_records) != len(raw_value):
        raise ValueError(
            "Normalization would violate one-record-per-source-row semantics: "
            f"{len(raw_value)} input rows, {len(normalized_records)} output rows"
        )
    report = build_report(raw_value, normalized_records, failures)
    totals = report["totals"]
    if totals["duplicateStabiliIds"] or totals["duplicateSourceRecordIds"]:
        raise ValueError("Stable IDs and source record IDs must be unique")
    write_json(output_path, normalized_records)
    write_json(report_path, report)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize DHCR raw rows without merging or NYC API enrichment."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = run(args.input, args.output, args.report)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    totals = report["totals"]
    print(
        f"Normalized {totals['totalNormalizedRecords']:,} records; "
        f"{totals['normalizationFailures']:,} validation failures."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
