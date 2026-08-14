#!/usr/bin/env python3
"""Resolve normalized DHCR rows to official NYC parcel and building identifiers."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from nyc_open_data import FetchResult, NycOpenDataClient


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_normalized.json"
DEFAULT_OUTPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "property_matches.json"
DEFAULT_REPORT_PATH = REPOSITORY_ROOT / "data" / "reports" / "property-match-report.json"
DEFAULT_REVIEW_PATH = (
    REPOSITORY_ROOT / "data" / "reports" / "property-match-manual-review.csv"
)

HPD_BUILDINGS_DATASET = "kj4p-ruqc"
PLUTO_DATASET = "64uk-42ks"
HPD_FIELDS = (
    "buildingid",
    "boroid",
    "boro",
    "housenumber",
    "lowhousenumber",
    "highhousenumber",
    "streetname",
    "zip",
    "block",
    "lot",
    "bin",
)
PLUTO_FIELDS = (
    "bbl",
    "address",
    "borocode",
    "block",
    "lot",
    "zipcode",
    "latitude",
    "longitude",
)
BOROUGH_NAMES = {
    "1": "Manhattan",
    "2": "Bronx",
    "3": "Brooklyn",
    "4": "Queens",
    "5": "Staten Island",
}
STREET_WORDS = {
    "AV": "AVENUE",
    "AVE": "AVENUE",
    "BLVD": "BOULEVARD",
    "CT": "COURT",
    "DR": "DRIVE",
    "EXPY": "EXPRESSWAY",
    "HWY": "HIGHWAY",
    "LN": "LANE",
    "PKWY": "PARKWAY",
    "PL": "PLACE",
    "PLZ": "PLAZA",
    "RD": "ROAD",
    "SQ": "SQUARE",
    "ST": "STREET",
    "TER": "TERRACE",
    "TPKE": "TURNPIKE",
}
ORDINAL = re.compile(r"^(\d+)(?:ST|ND|RD|TH)$")
HOUSE_PART = re.compile(r"\d+|[A-Z]+")


@dataclass(frozen=True)
class AddressKey:
    borough_code: str
    street: str
    house_number: str
    zip_code: str | None


def clean_numeric(value: Any) -> str | None:
    """Return Socrata numeric values without decimal padding or invalid sentinels."""

    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r"\d+\.0+", text):
        text = text.split(".", 1)[0]
    return text if text.isdigit() else None


def bbl_from_parts(borough: Any, block: Any, lot: Any) -> str | None:
    borough_text = clean_numeric(borough)
    block_text = clean_numeric(block)
    lot_text = clean_numeric(lot)
    if (
        borough_text not in BOROUGH_NAMES
        or block_text is None
        or lot_text is None
        or len(block_text) > 5
        or len(lot_text) > 4
    ):
        return None
    return f"{borough_text}{block_text.zfill(5)}{lot_text.zfill(4)}"


def normalize_bbl(value: Any) -> str | None:
    text = clean_numeric(value)
    return text.zfill(10) if text is not None and len(text) <= 10 else None


def normalize_bin(value: Any, borough_code: str | None = None) -> str | None:
    text = clean_numeric(value)
    if text is None or re.fullmatch(r"[1-5]\d{6}", text) is None:
        return None
    if text[1:] == "000000" or (borough_code and text[0] != borough_code):
        return None
    return text


def normalize_building_id(value: Any) -> str | None:
    text = clean_numeric(value)
    return text if text and text != "0" else None


def normalize_street(value: Any) -> str:
    text = re.sub(r"[^A-Z0-9]+", " ", str(value or "").upper()).strip()
    words: list[str] = []
    for word in text.split():
        ordinal = ORDINAL.fullmatch(word)
        if ordinal:
            word = ordinal.group(1)
        words.append(STREET_WORDS.get(word, word))
    return " ".join(words)


def normalize_house(value: Any) -> str:
    return re.sub(r"\s+", "", str(value or "").upper().strip())


def house_sort_key(value: Any) -> tuple[tuple[int, Any], ...]:
    parts = HOUSE_PART.findall(normalize_house(value))
    return tuple((0, int(part)) if part.isdigit() else (1, part) for part in parts)


def house_in_range(value: Any, low: Any, high: Any) -> bool:
    value_key = house_sort_key(value)
    low_key = house_sort_key(low)
    high_key = house_sort_key(high)
    return bool(value_key and low_key and high_key and low_key <= value_key <= high_key)


def source_address_parts(address: Mapping[str, Any] | None) -> tuple[str, str, str] | None:
    if not address:
        return None
    house = address.get("houseNumber") or {}
    street = " ".join(
        part
        for part in (
            (address.get("streetName") or {}).get("normalized"),
            (address.get("streetSuffix") or {}).get("normalized"),
        )
        if part
    )
    number = house.get("normalized") or house.get("raw")
    if not number or not street:
        return None
    return normalize_house(number), normalize_street(street), str(address.get("zip") or "")


def source_address_matches(address: Mapping[str, Any], candidate: Mapping[str, Any]) -> bool:
    source = source_address_parts(address)
    if source is None or source[1] != normalize_street(candidate.get("streetname")):
        return False
    source_house, _, source_zip = source
    candidate_zip = str(candidate.get("zip") or "")
    if source_zip and candidate_zip and source_zip != candidate_zip:
        return False
    source_number = address.get("houseNumber") or {}
    candidate_house = normalize_house(candidate.get("housenumber"))
    candidate_low = normalize_house(candidate.get("lowhousenumber") or candidate_house)
    candidate_high = normalize_house(candidate.get("highhousenumber") or candidate_house)
    if source_number.get("type") == "range":
        source_low = source_number.get("rangeStart")
        source_high = source_number.get("rangeEnd")
        return (
            house_in_range(candidate_house, source_low, source_high)
            or house_in_range(source_low, candidate_low, candidate_high)
            or house_in_range(source_high, candidate_low, candidate_high)
        )
    return candidate_house == source_house or house_in_range(
        source_house, candidate_low, candidate_high
    )


def candidate_address_keys(candidate: Mapping[str, Any]) -> set[AddressKey]:
    borough = clean_numeric(candidate.get("boroid")) or ""
    street = normalize_street(candidate.get("streetname"))
    zip_code = str(candidate.get("zip") or "") or None
    values = {
        normalize_house(candidate.get("housenumber")),
        normalize_house(candidate.get("lowhousenumber")),
        normalize_house(candidate.get("highhousenumber")),
    }
    return {
        AddressKey(borough, street, value, zip_code)
        for value in values
        if borough and street and value
    }


def source_address_keys(
    record: Mapping[str, Any], address: Mapping[str, Any] | None
) -> set[AddressKey]:
    parts = source_address_parts(address)
    borough = str((record.get("parcel") or {}).get("boroughCode") or "")
    if parts is None or not borough:
        return set()
    house, street, zip_code = parts
    house_info = (address or {}).get("houseNumber") or {}
    values = {house}
    if house_info.get("type") == "range":
        values.update(
            normalize_house(house_info.get(field))
            for field in ("rangeStart", "rangeEnd")
        )
    return {
        AddressKey(borough, street, value, zip_code or None)
        for value in values
        if value
    }


def unique_rows(rows: Iterable[Mapping[str, Any]], identity_fields: Sequence[str]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, ...]] = set()
    for row in rows:
        identity = tuple(str(row.get(field) or "") for field in identity_fields)
        if identity not in seen:
            seen.add(identity)
            result.append(dict(row))
    return result


def hpd_bbl(row: Mapping[str, Any]) -> str | None:
    return bbl_from_parts(row.get("boroid"), row.get("block"), row.get("lot"))


def canonical_hpd_address(row: Mapping[str, Any]) -> str | None:
    house = str(row.get("housenumber") or "").strip()
    street = str(row.get("streetname") or "").strip().title()
    borough_code = clean_numeric(row.get("boroid"))
    borough = BOROUGH_NAMES.get(borough_code or "")
    zip_code = str(row.get("zip") or "").strip()
    if not house or not street or not borough:
        return None
    return f"{house} {street}, {borough}, NY{f' {zip_code}' if zip_code else ''}"


def canonical_pluto_address(row: Mapping[str, Any], source_zip: str | None = None) -> str | None:
    address = str(row.get("address") or "").strip().title()
    borough_code = clean_numeric(row.get("borocode"))
    borough = BOROUGH_NAMES.get(borough_code or "")
    zip_code = str(row.get("zipcode") or source_zip or "").strip()
    if not address or not borough:
        return None
    return f"{address}, {borough}, NY{f' {zip_code}' if zip_code else ''}"


class PropertyMatcher:
    def __init__(
        self,
        hpd_rows: Sequence[Mapping[str, Any]],
        pluto_rows: Sequence[Mapping[str, Any]],
    ) -> None:
        self.hpd_by_bbl: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.hpd_by_address: dict[AddressKey, list[dict[str, Any]]] = defaultdict(list)
        for row in unique_rows(hpd_rows, ("buildingid",)):
            bbl = hpd_bbl(row)
            if bbl:
                self.hpd_by_bbl[bbl].append(row)
            for key in candidate_address_keys(row):
                self.hpd_by_address[key].append(row)

        self.pluto_by_bbl: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in unique_rows(
            pluto_rows, ("bbl", "address", "latitude", "longitude")
        ):
            bbl = normalize_bbl(row.get("bbl")) or bbl_from_parts(
                row.get("borocode"), row.get("block"), row.get("lot")
            )
            if bbl:
                self.pluto_by_bbl[bbl].append(row)

    def _address_candidates(
        self, record: Mapping[str, Any], address: Mapping[str, Any] | None
    ) -> list[dict[str, Any]]:
        rows: list[Mapping[str, Any]] = []
        keys = source_address_keys(record, address)
        for key in keys:
            rows.extend(self.hpd_by_address.get(key, ()))
            if key.zip_code:
                rows.extend(
                    self.hpd_by_address.get(
                        AddressKey(key.borough_code, key.street, key.house_number, None),
                        (),
                    )
                )
        return unique_rows(rows, ("buildingid",))

    @staticmethod
    def _matching_on_address(
        address: Mapping[str, Any] | None, candidates: Sequence[Mapping[str, Any]]
    ) -> list[dict[str, Any]]:
        if not address:
            return []
        return [dict(row) for row in candidates if source_address_matches(address, row)]

    def match(self, record: Mapping[str, Any]) -> dict[str, Any]:
        source_bbl = normalize_bbl((record.get("parcel") or {}).get("bbl"))
        pluto_candidates = self.pluto_by_bbl.get(source_bbl or "", [])
        hpd_candidates = self.hpd_by_bbl.get(source_bbl or "", [])
        selected_hpd: dict[str, Any] | None = None
        status = "unmatched"
        method = "manual_review"
        reasons: list[str] = []
        address_validation = "not_available"

        if source_bbl and (pluto_candidates or hpd_candidates):
            status = "matched"
            method = "borough_block_lot"
            reasons.append("source_bbl_found_in_official_nyc_data")
            if len(hpd_candidates) == 1:
                selected_hpd = hpd_candidates[0]
                reasons.append("parcel_has_one_hpd_building")
            elif len(hpd_candidates) > 1:
                primary_matches = self._matching_on_address(
                    record.get("primaryAddress"), hpd_candidates
                )
                alternate_matches: list[dict[str, Any]] = []
                if len(primary_matches) == 1:
                    selected_hpd = primary_matches[0]
                    address_validation = "primary_address"
                    reasons.append("primary_address_selected_one_hpd_building_on_parcel")
                elif not primary_matches:
                    for alternate in record.get("alternateAddresses") or ():
                        alternate_matches.extend(
                            self._matching_on_address(alternate, hpd_candidates)
                        )
                    alternate_matches = unique_rows(alternate_matches, ("buildingid",))
                    if len(alternate_matches) == 1:
                        selected_hpd = alternate_matches[0]
                        address_validation = "alternate_address"
                        reasons.append(
                            "alternate_address_selected_one_hpd_building_on_parcel"
                        )
                if selected_hpd is None:
                    status = "ambiguous"
                    method = "manual_review"
                    reasons.append("parcel_has_multiple_unresolved_hpd_buildings")
                    if primary_matches:
                        reasons.append(
                            f"primary_address_matches_{len(primary_matches)}_hpd_buildings"
                        )
            else:
                reasons.append("official_parcel_has_no_hpd_building")

            if selected_hpd and address_validation == "not_available":
                if self._matching_on_address(record.get("primaryAddress"), [selected_hpd]):
                    address_validation = "primary_address"
                    reasons.append("primary_address_validates_parcel_match")
                elif any(
                    self._matching_on_address(alternate, [selected_hpd])
                    for alternate in record.get("alternateAddresses") or ()
                ):
                    address_validation = "alternate_address"
                    reasons.append("alternate_address_validates_parcel_match")
                else:
                    address_validation = "mismatch"
                    reasons.append("source_address_does_not_validate_hpd_address")
        else:
            fallback_groups = [
                (
                    "primary_address",
                    self._address_candidates(record, record.get("primaryAddress")),
                )
            ]
            for alternate in record.get("alternateAddresses") or ():
                fallback_groups.append(
                    ("alternate_address", self._address_candidates(record, alternate))
                )
            for fallback_method, candidates in fallback_groups:
                if len(candidates) == 1:
                    selected_hpd = candidates[0]
                    status = "matched"
                    method = fallback_method
                    reasons.append(f"unique_{fallback_method}_match_in_hpd_data")
                    if source_bbl:
                        reasons.append("source_bbl_not_found_in_official_nyc_data")
                    break
                if len(candidates) > 1:
                    status = "ambiguous"
                    method = "manual_review"
                    reasons.append(f"{fallback_method}_has_multiple_hpd_candidates")
                    hpd_candidates = candidates
                    break
            if status == "unmatched":
                reasons.append("no_official_parcel_or_unique_address_match")

        resolved_bbl = hpd_bbl(selected_hpd) if selected_hpd else source_bbl
        resolved_pluto = self.pluto_by_bbl.get(resolved_bbl or "", [])
        pluto = resolved_pluto[0] if len(resolved_pluto) == 1 else None
        if len(resolved_pluto) > 1:
            reasons.append("multiple_pluto_rows_for_resolved_bbl")
        borough_code = resolved_bbl[0] if resolved_bbl else None
        source_zip = str((record.get("primaryAddress") or {}).get("zip") or "") or None
        canonical_address = (
            canonical_hpd_address(selected_hpd)
            if selected_hpd
            else canonical_pluto_address(pluto, source_zip) if pluto else None
        )

        return {
            "stabiliId": record.get("id"),
            "sourceRecordId": record.get("sourceRecordId"),
            "matchStatus": status,
            "matchMethod": method,
            "bbl": resolved_bbl,
            "bin": normalize_bin(selected_hpd.get("bin"), borough_code)
            if selected_hpd
            else None,
            "hpdBuildingId": normalize_building_id(selected_hpd.get("buildingid"))
            if selected_hpd
            else None,
            "canonicalAddress": canonical_address,
            "latitude": float(pluto["latitude"])
            if pluto and clean_coordinate(pluto.get("latitude"), latitude=True)
            else None,
            "longitude": float(pluto["longitude"])
            if pluto and clean_coordinate(pluto.get("longitude"), latitude=False)
            else None,
            "matchMetadata": {
                "confidence": "high"
                if status == "matched" and method == "borough_block_lot"
                else "medium" if status == "matched" else "none",
                "reasonCodes": reasons,
                "sourceBbl": source_bbl,
                "sourcePrimaryAddress": (record.get("primaryAddress") or {}).get(
                    "displayAddress"
                ),
                "addressValidation": address_validation,
                "candidateCounts": {
                    "hpdBuildingsOnSourceParcel": len(hpd_candidates),
                    "plutoRowsOnSourceParcel": len(pluto_candidates),
                },
                "candidateHpdBuildingIds": [
                    normalize_building_id(row.get("buildingid"))
                    for row in hpd_candidates[:20]
                    if normalize_building_id(row.get("buildingid"))
                ],
            },
        }


def clean_coordinate(value: Any, *, latitude: bool) -> float | None:
    try:
        coordinate = float(value)
    except (TypeError, ValueError):
        return None
    low, high = ((40.0, 41.0) if latitude else (-75.0, -72.0))
    return coordinate if low <= coordinate <= high else None


def provenance_dict(result: FetchResult) -> dict[str, Any]:
    return result.provenance.to_dict()


def fetch_reference_data(client: NycOpenDataClient) -> tuple[FetchResult, FetchResult]:
    """Download each bounded official reference projection once, using cached pages."""

    hpd = client.fetch_all(
        HPD_BUILDINGS_DATASET,
        select=HPD_FIELDS,
        order="buildingid",
        page_size=50000,
    )
    pluto = client.fetch_all(
        PLUTO_DATASET,
        select=PLUTO_FIELDS,
        order="bbl",
        page_size=50000,
    )
    return hpd, pluto


def build_report(
    matches: Sequence[Mapping[str, Any]],
    *,
    provenance: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    statuses = Counter(str(row["matchStatus"]) for row in matches)
    methods = Counter(str(row["matchMethod"]) for row in matches)
    hpd_records: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for row in matches:
        if row.get("hpdBuildingId"):
            hpd_records[str(row["hpdBuildingId"])].append(row)
    duplicate_hpd = [
        {
            "hpdBuildingId": building_id,
            "recordCount": len(rows),
            "stabiliIds": [row.get("stabiliId") for row in rows],
            "sourceRecordIds": [row.get("sourceRecordId") for row in rows],
        }
        for building_id, rows in sorted(hpd_records.items())
        if len(rows) > 1
    ]
    bbl_no_bin = [row for row in matches if row.get("bbl") and not row.get("bin")]
    bbl_no_hpd = [
        row for row in matches if row.get("bbl") and not row.get("hpdBuildingId")
    ]
    return {
        "recordSemantics": "One property-match result per normalized DHCR source row; rows are never merged.",
        "datasets": provenance or {},
        "totals": {
            "totalRecords": len(matches),
            "matched": statuses["matched"],
            "ambiguous": statuses["ambiguous"],
            "unmatched": statuses["unmatched"],
            "recordsWithBblButNoBin": len(bbl_no_bin),
            "recordsWithBblButNoHpdBuildingId": len(bbl_no_hpd),
            "duplicateHpdBuildingIdsAcrossStabiliRecords": len(duplicate_hpd),
        },
        "percentages": {
            status: round(statuses[status] * 100 / len(matches), 4) if matches else 0.0
            for status in ("matched", "ambiguous", "unmatched")
        },
        "matchCountsByMethod": dict(sorted(methods.items())),
        "recordsWithBblButNoBin": [review_summary(row) for row in bbl_no_bin],
        "recordsWithBblButNoHpdBuildingId": [review_summary(row) for row in bbl_no_hpd],
        "duplicateHpdBuildingIdsAcrossStabiliRecords": duplicate_hpd,
        "examplesOfAmbiguousMatches": [
            review_summary(row)
            for row in matches
            if row["matchStatus"] == "ambiguous"
        ][:20],
        "examplesOfUnmatchedRecords": [
            review_summary(row)
            for row in matches
            if row["matchStatus"] == "unmatched"
        ][:20],
    }


def review_summary(row: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "stabiliId": row.get("stabiliId"),
        "sourceRecordId": row.get("sourceRecordId"),
        "matchStatus": row.get("matchStatus"),
        "matchMethod": row.get("matchMethod"),
        "sourceAddress": (row.get("matchMetadata") or {}).get("sourcePrimaryAddress"),
        "bbl": row.get("bbl"),
        "bin": row.get("bin"),
        "hpdBuildingId": row.get("hpdBuildingId"),
        "canonicalAddress": row.get("canonicalAddress"),
        "reasonCodes": (row.get("matchMetadata") or {}).get("reasonCodes", []),
        "candidateHpdBuildingIds": (row.get("matchMetadata") or {}).get(
            "candidateHpdBuildingIds", []
        ),
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_manual_review(path: Path, matches: Sequence[Mapping[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = (
        "stabiliId",
        "sourceRecordId",
        "matchStatus",
        "matchMethod",
        "sourceAddress",
        "bbl",
        "bin",
        "hpdBuildingId",
        "canonicalAddress",
        "reasonCodes",
        "candidateHpdBuildingIds",
    )
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for match in matches:
            if match["matchStatus"] not in {"ambiguous", "unmatched"}:
                continue
            row = review_summary(match)
            row["reasonCodes"] = "|".join(row["reasonCodes"])
            row["candidateHpdBuildingIds"] = "|".join(
                row["candidateHpdBuildingIds"]
            )
            writer.writerow(row)


def run(
    input_path: Path,
    output_path: Path,
    report_path: Path,
    review_path: Path,
    *,
    client: NycOpenDataClient | None = None,
    hpd_rows: Sequence[Mapping[str, Any]] | None = None,
    pluto_rows: Sequence[Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    normalized = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(normalized, list) or not all(
        isinstance(row, dict) for row in normalized
    ):
        raise ValueError("Normalized DHCR input must be a JSON array of objects")

    provenance: dict[str, Any] = {}
    if hpd_rows is None or pluto_rows is None:
        hpd_result, pluto_result = fetch_reference_data(client or NycOpenDataClient())
        hpd_rows = hpd_result.records
        pluto_rows = pluto_result.records
        provenance = {
            HPD_BUILDINGS_DATASET: provenance_dict(hpd_result),
            PLUTO_DATASET: provenance_dict(pluto_result),
        }

    matcher = PropertyMatcher(hpd_rows, pluto_rows)
    matches = [matcher.match(record) for record in normalized]
    if len(matches) != len(normalized):
        raise AssertionError("Property matching must retain one result per DHCR row")
    report = build_report(matches, provenance=provenance)
    write_json(output_path, matches)
    write_json(report_path, report)
    write_manual_review(review_path, matches)
    return report


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--manual-review", type=Path, default=DEFAULT_REVIEW_PATH)
    parser.add_argument(
        "--refresh-cache", action="store_true", help="Bypass reusable Socrata cache"
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    report = run(
        args.input,
        args.output,
        args.report,
        args.manual_review,
        client=NycOpenDataClient(refresh_cache=args.refresh_cache),
    )
    print(json.dumps(report["totals"], indent=2))
    print(json.dumps(report["percentages"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
