#!/usr/bin/env python3
"""Enrich matched Stabili records with NYC building and HPD management data."""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Mapping, Sequence

from nyc_open_data import FetchResult, NycOpenDataClient, Provenance


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "property_matches.json"
DEFAULT_OUTPUT_PATH = (
    REPOSITORY_ROOT / "data" / "intermediate" / "nyc_management_enriched.json"
)
DEFAULT_REPORT_PATH = (
    REPOSITORY_ROOT / "data" / "reports" / "management-enrichment-report.json"
)

HPD_BUILDINGS_DATASET = "kj4p-ruqc"
PLUTO_DATASET = "64uk-42ks"
HPD_REGISTRATIONS_DATASET = "tesw-yqqr"
HPD_CONTACTS_DATASET = "feu5-w2e2"

HPD_BUILDING_FIELDS = (
    "buildingid",
    "bin",
    "boroid",
    "block",
    "lot",
    "managementprogram",
    "dobbuildingclass",
    "lifecycle",
    "recordstatus",
)
PLUTO_FIELDS = (
    "bbl",
    "yearbuilt",
    "numfloors",
    "unitsres",
    "unitstotal",
    "bldgclass",
    "ownertype",
)
REGISTRATION_FIELDS = (
    "registrationid",
    "buildingid",
    "lastregistrationdate",
    "registrationenddate",
)
CONTACT_FIELDS = (
    "registrationcontactid",
    "registrationid",
    "type",
    "contactdescription",
    "corporationname",
    "title",
    "firstname",
    "middleinitial",
    "lastname",
    "businesshousenumber",
    "businessstreetname",
    "businessapartment",
    "businesscity",
    "businessstate",
    "businesszip",
)

OWNER_TYPES = frozenset({"CorporateOwner", "IndividualOwner", "JointOwner"})
MANAGING_AGENT_TYPES = frozenset({"Agent"})
RESPONSIBLE_PARTY_TYPES = frozenset({"HeadOfficer", "Officer", "SiteManager"})
ROLE_NAMES = {
    "Agent": "managingAgent",
    "CorporateOwner": "corporateOwner",
    "IndividualOwner": "individualOwner",
    "JointOwner": "jointOwner",
    "HeadOfficer": "headOfficer",
    "Officer": "officer",
    "SiteManager": "siteManager",
}


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value)).strip()
    return text or None


def clean_integer(value: Any) -> int | None:
    """Parse an integral source value without conflating zero and missing."""

    text = clean_text(value)
    if text is None or re.fullmatch(r"[+-]?\d+(?:\.0+)?", text) is None:
        return None
    return int(text.split(".", 1)[0])


def clean_number(value: Any) -> int | float | None:
    """Parse a numeric source value, preserving a real source zero."""

    text = clean_text(value)
    if text is None:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return int(number) if number.is_integer() else number


def clean_identifier(value: Any) -> str | None:
    number = clean_integer(value)
    return str(number) if number is not None and number >= 0 else None


def clean_bbl(value: Any) -> str | None:
    identifier = clean_identifier(value)
    return identifier.zfill(10) if identifier is not None and len(identifier) <= 10 else None


def source_value(value: Any) -> str | None:
    """Convert blank and obvious missing sentinels to null, without guessing."""

    text = clean_text(value)
    if text is None or text.upper() in {"N/A", "NA", "NONE", "NOT AVAILABLE"}:
        return None
    return text


def normalize_management_name(value: Any) -> str | None:
    text = source_value(value)
    if text is None:
        return None
    normalized = unicodedata.normalize("NFKC", text).upper().replace("&", " AND ")
    normalized = re.sub(r"[^A-Z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip() or None


def date_key(value: Any) -> str:
    return clean_text(value) or ""


def latest_registration(rows: Sequence[Mapping[str, Any]]) -> Mapping[str, Any] | None:
    if not rows:
        return None
    return max(
        rows,
        key=lambda row: (
            date_key(row.get("lastregistrationdate")),
            date_key(row.get("registrationenddate")),
            clean_integer(row.get("registrationid")) or -1,
        ),
    )


def registration_status(end_date: str | None, retrieved_at: str) -> str | None:
    if not end_date:
        return None
    # Socrata calendar dates and retrieval timestamps both sort correctly by YYYY-MM-DD.
    return "current" if end_date[:10] >= retrieved_at[:10] else "expired"


def provenance(dataset_id: str, retrieved_at: str) -> dict[str, str]:
    return {"datasetId": dataset_id, "retrievedAt": retrieved_at}


def full_name(row: Mapping[str, Any]) -> str | None:
    parts = [
        source_value(row.get("firstname")),
        source_value(row.get("middleinitial")),
        source_value(row.get("lastname")),
    ]
    return " ".join(part for part in parts if part) or None


def business_address(row: Mapping[str, Any]) -> dict[str, str | None] | None:
    address = {
        "houseNumber": source_value(row.get("businesshousenumber")),
        "street": source_value(row.get("businessstreetname")),
        "apartment": source_value(row.get("businessapartment")),
        "city": source_value(row.get("businesscity")),
        "state": source_value(row.get("businessstate")),
        "zip": source_value(row.get("businesszip")),
    }
    # A street and locality make the address actionable even when HPD omits a house number.
    return address if address["street"] and (address["city"] or address["zip"]) else None


def normalize_contact(row: Mapping[str, Any]) -> dict[str, Any] | None:
    official_type = clean_text(row.get("type"))
    if official_type not in ROLE_NAMES:
        return None
    organization = source_value(row.get("corporationname"))
    person = full_name(row)
    display_name = organization or person
    if display_name is None and business_address(row) is None:
        return None
    return {
        "registrationContactId": clean_identifier(row.get("registrationcontactid")),
        "officialType": official_type,
        "role": ROLE_NAMES[official_type],
        "displayName": display_name,
        "normalizedName": normalize_management_name(display_name),
        "organizationName": organization,
        "personName": person,
        "title": source_value(row.get("title")),
        "contactDescription": source_value(row.get("contactdescription")),
        "businessAddress": business_address(row),
        # The official Registration Contacts dataset has none of these fields.
        "phone": None,
        "email": None,
        "website": None,
    }


def contact_sort_key(contact: Mapping[str, Any]) -> tuple[int, str, str]:
    role_rank = {
        "managingAgent": 0,
        "corporateOwner": 1,
        "individualOwner": 2,
        "jointOwner": 3,
        "headOfficer": 4,
        "officer": 5,
        "siteManager": 6,
    }
    return (
        role_rank.get(str(contact.get("role")), 99),
        str(contact.get("normalizedName") or ""),
        str(contact.get("registrationContactId") or ""),
    )


def build_management(
    rows: Sequence[Mapping[str, Any]], retrieved_at: str
) -> dict[str, Any]:
    contacts = [contact for row in rows if (contact := normalize_contact(row))]
    contacts.sort(key=contact_sort_key)
    managing_agents = [
        contact for contact in contacts if contact["officialType"] in MANAGING_AGENT_TYPES
    ]
    owners = [contact for contact in contacts if contact["officialType"] in OWNER_TYPES]
    responsible = [
        contact for contact in contacts if contact["officialType"] in RESPONSIBLE_PARTY_TYPES
    ]
    primary = (managing_agents or owners or responsible or [None])[0]
    return {
        "primaryContact": primary,
        "managingAgents": managing_agents,
        "owners": owners,
        "responsibleParties": responsible,
        "hasUsableBusinessAddress": any(contact["businessAddress"] for contact in contacts),
        "provenance": provenance(HPD_CONTACTS_DATASET, retrieved_at),
    }


def index_unique(rows: Sequence[Mapping[str, Any]], field: str) -> dict[str, Mapping[str, Any]]:
    indexed: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        key = clean_identifier(row.get(field))
        if key is not None:
            indexed[key] = row
    return indexed


def enrich_records(
    matches: Sequence[Mapping[str, Any]],
    *,
    hpd_buildings: Sequence[Mapping[str, Any]],
    pluto_rows: Sequence[Mapping[str, Any]],
    registrations: Sequence[Mapping[str, Any]],
    contacts: Sequence[Mapping[str, Any]],
    retrieved_at: Mapping[str, str],
) -> list[dict[str, Any]]:
    hpd_by_id = index_unique(hpd_buildings, "buildingid")
    pluto_by_bbl = {
        bbl: row
        for row in pluto_rows
        if (bbl := clean_bbl(row.get("bbl"))) is not None
    }
    registrations_by_building: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for row in registrations:
        if (building_id := clean_identifier(row.get("buildingid"))) is not None:
            registrations_by_building[building_id].append(row)
    contacts_by_registration: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for row in contacts:
        if (registration_id := clean_identifier(row.get("registrationid"))) is not None:
            contacts_by_registration[registration_id].append(row)

    enriched: list[dict[str, Any]] = []
    for match in matches:
        record = dict(match)
        building_id = clean_identifier(match.get("hpdBuildingId"))
        bbl = clean_bbl(match.get("bbl"))
        hpd = hpd_by_id.get(building_id or "")
        pluto = pluto_by_bbl.get(bbl or "")
        record["buildingAttributes"] = {
            "hpdBuildingId": building_id,
            "bin": clean_identifier((hpd or {}).get("bin")) or clean_identifier(match.get("bin")),
            "bbl": bbl,
            "yearBuilt": clean_integer((pluto or {}).get("yearbuilt")),
            "stories": clean_number((pluto or {}).get("numfloors")),
            "residentialUnits": clean_integer((pluto or {}).get("unitsres")),
            "totalUnits": clean_integer((pluto or {}).get("unitstotal")),
            "buildingClass": source_value((pluto or {}).get("bldgclass")),
            "hpdBuildingClass": source_value((hpd or {}).get("dobbuildingclass")),
            "ownershipType": source_value((pluto or {}).get("ownertype")),
            "managementProgram": source_value((hpd or {}).get("managementprogram")),
            "hpdLifecycle": source_value((hpd or {}).get("lifecycle")),
            "hpdRecordStatus": source_value((hpd or {}).get("recordstatus")),
            "provenance": [
                provenance(HPD_BUILDINGS_DATASET, retrieved_at[HPD_BUILDINGS_DATASET]),
                provenance(PLUTO_DATASET, retrieved_at[PLUTO_DATASET]),
            ],
        }

        selected = latest_registration(registrations_by_building.get(building_id or "", ()))
        registration_id = clean_identifier((selected or {}).get("registrationid"))
        last_date = clean_text((selected or {}).get("lastregistrationdate"))
        end_date = clean_text((selected or {}).get("registrationenddate"))
        record["hpdRegistration"] = {
            "registrationId": registration_id,
            "lastRegistrationDate": last_date,
            "registrationEndDate": end_date,
            "status": registration_status(
                end_date, retrieved_at[HPD_REGISTRATIONS_DATASET]
            ),
            "statusAsOf": retrieved_at[HPD_REGISTRATIONS_DATASET],
            "selectionMethod": (
                "latest_by_registration_date_end_date_and_id"
                if selected is not None
                else None
            ),
            "provenance": provenance(
                HPD_REGISTRATIONS_DATASET,
                retrieved_at[HPD_REGISTRATIONS_DATASET],
            ),
        }
        record["management"] = build_management(
            contacts_by_registration.get(registration_id or "", ()),
            retrieved_at[HPD_CONTACTS_DATASET],
        )
        enriched.append(record)
    return enriched


def build_report(records: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    # Coverage is building-level. Several DHCR/Stabili records may share one HPD building.
    by_building: dict[str, Mapping[str, Any]] = {}
    for record in records:
        building_id = clean_identifier(record.get("hpdBuildingId"))
        if building_id is not None:
            by_building[building_id] = record

    total = len(by_building)
    with_agents = []
    with_owners = []
    with_addresses = []
    missing_management = []
    registrations = []
    unresolved_registration_ids: set[str] = set()
    names: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"observedNames": Counter(), "buildingIds": set(), "roles": Counter()}
    )

    for building_id, record in sorted(by_building.items()):
        management = record.get("management") or {}
        registration = record.get("hpdRegistration")
        if management.get("managingAgents"):
            with_agents.append(building_id)
        if management.get("owners"):
            with_owners.append(building_id)
        if management.get("hasUsableBusinessAddress"):
            with_addresses.append(building_id)
        useful_contacts = (
            list(management.get("managingAgents") or ())
            + list(management.get("owners") or ())
            + list(management.get("responsibleParties") or ())
        )
        if not useful_contacts:
            missing_management.append(building_id)
        if registration and registration.get("registrationId"):
            registrations.append(building_id)
            registration_id = registration.get("registrationId")
            if registration_id and not useful_contacts:
                unresolved_registration_ids.add(str(registration_id))
        for contact in useful_contacts:
            normalized = contact.get("normalizedName")
            if not normalized:
                continue
            names[normalized]["observedNames"][contact.get("displayName")] += 1
            names[normalized]["buildingIds"].add(building_id)
            names[normalized]["roles"][contact.get("role")] += 1

    def percentage(count: int) -> float:
        return round(count * 100 / total, 4) if total else 0.0

    duplicates = []
    for normalized, details in sorted(names.items()):
        building_ids = details["buildingIds"]
        if len(building_ids) <= 1:
            continue
        duplicates.append(
            {
                "normalizedName": normalized,
                "observedNames": sorted(details["observedNames"]),
                "buildingCount": len(building_ids),
                "contactOccurrences": sum(details["observedNames"].values()),
                "roles": dict(sorted(details["roles"].items())),
            }
        )
    duplicates.sort(key=lambda row: (-row["buildingCount"], row["normalizedName"]))

    return {
        "coverageSemantics": "Unique matched HPD buildings; duplicate Stabili source rows are counted once.",
        "totalMatchedBuildings": total,
        "counts": {
            "buildingsWithManagingAgents": len(with_agents),
            "buildingsWithOwners": len(with_owners),
            "buildingsWithUsableBusinessAddresses": len(with_addresses),
            "buildingsMissingManagementInformation": len(missing_management),
            "buildingsWithLatestRegistration": len(registrations),
        },
        "percentages": {
            "managingAgentCoverage": percentage(len(with_agents)),
            "ownerCoverage": percentage(len(with_owners)),
            "usableBusinessAddressCoverage": percentage(len(with_addresses)),
            "missingManagementInformation": percentage(len(missing_management)),
            "latestRegistrationCoverage": percentage(len(registrations)),
        },
        "buildingIdsMissingManagementInformation": missing_management,
        "unresolvedRegistrationIds": sorted(unresolved_registration_ids, key=int),
        "duplicatedManagementNamesByNormalizedForm": duplicates,
    }


def fetch_reference_data(client: NycOpenDataClient) -> dict[str, FetchResult]:
    """Fetch narrow projections; local Socrata caching makes reruns reproducible."""

    return {
        HPD_BUILDINGS_DATASET: client.fetch_all(
            HPD_BUILDINGS_DATASET,
            select=HPD_BUILDING_FIELDS,
            order="buildingid",
            page_size=50000,
        ),
        PLUTO_DATASET: client.fetch_all(
            PLUTO_DATASET, select=PLUTO_FIELDS, order="bbl", page_size=50000
        ),
        HPD_REGISTRATIONS_DATASET: client.fetch_all(
            HPD_REGISTRATIONS_DATASET,
            select=REGISTRATION_FIELDS,
            order="buildingid,lastregistrationdate,registrationenddate,registrationid",
            page_size=50000,
        ),
        HPD_CONTACTS_DATASET: client.fetch_all(
            HPD_CONTACTS_DATASET,
            select=CONTACT_FIELDS,
            order="registrationid,registrationcontactid",
            page_size=50000,
        ),
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(
    input_path: Path,
    output_path: Path,
    report_path: Path,
    *,
    client: NycOpenDataClient | None = None,
    results: Mapping[str, FetchResult] | None = None,
) -> dict[str, Any]:
    matches = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(matches, list) or not all(isinstance(row, dict) for row in matches):
        raise ValueError("Property-match input must be a JSON array of objects")

    fetched = dict(results or fetch_reference_data(client or NycOpenDataClient()))
    missing = {
        dataset_id
        for dataset_id in (
            HPD_BUILDINGS_DATASET,
            PLUTO_DATASET,
            HPD_REGISTRATIONS_DATASET,
            HPD_CONTACTS_DATASET,
        )
        if dataset_id not in fetched
    }
    if missing:
        raise ValueError(f"Missing NYC dataset results: {', '.join(sorted(missing))}")
    retrieved_at = {
        dataset_id: fetched[dataset_id].provenance.retrieved_at for dataset_id in fetched
    }
    enriched = enrich_records(
        matches,
        hpd_buildings=fetched[HPD_BUILDINGS_DATASET].records,
        pluto_rows=fetched[PLUTO_DATASET].records,
        registrations=fetched[HPD_REGISTRATIONS_DATASET].records,
        contacts=fetched[HPD_CONTACTS_DATASET].records,
        retrieved_at=retrieved_at,
    )
    if len(enriched) != len(matches):
        raise AssertionError("NYC enrichment must retain one result per property-match row")
    report = build_report(enriched)
    report["datasets"] = {
        dataset_id: fetched[dataset_id].provenance.to_dict()
        for dataset_id in (
            HPD_BUILDINGS_DATASET,
            PLUTO_DATASET,
            HPD_REGISTRATIONS_DATASET,
            HPD_CONTACTS_DATASET,
        )
    }
    write_json(output_path, enriched)
    write_json(report_path, report)
    return report


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--refresh-cache", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    report = run(
        args.input,
        args.output,
        args.report,
        client=NycOpenDataClient(refresh_cache=args.refresh_cache),
    )
    print(json.dumps(report["counts"], indent=2))
    print(json.dumps(report["percentages"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
