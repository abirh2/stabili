#!/usr/bin/env python3
"""Enrich matched Stabili buildings with current and recent HPD conditions."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

from nyc_open_data import (
    FetchResult,
    NycOpenDataClient,
    NycOpenDataError,
    Provenance,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = (
    REPOSITORY_ROOT / "data" / "intermediate" / "nyc_management_enriched.json"
)
DEFAULT_OUTPUT_PATH = (
    REPOSITORY_ROOT / "data" / "intermediate" / "nyc_condition_enriched.json"
)
DEFAULT_REPORT_PATH = (
    REPOSITORY_ROOT / "data" / "reports" / "condition-enrichment-report.json"
)

HPD_VIOLATIONS_DATASET = "wvxf-dwi5"
HPD_COMPLAINT_PROBLEMS_DATASET = "ygpa-z7cr"
BEDBUG_REPORTING_DATASET = "wz6d-d3jb"
VACATE_REPAIR_ORDERS_DATASET = "tb8q-a3ar"
DATASET_IDS = (
    HPD_VIOLATIONS_DATASET,
    HPD_COMPLAINT_PROBLEMS_DATASET,
    BEDBUG_REPORTING_DATASET,
    VACATE_REPAIR_ORDERS_DATASET,
)

VIOLATION_FIELDS = (
    "violationid",
    "buildingid",
    "class",
    "inspectiondate",
    "approveddate",
    "newcertifybydate",
    "originalcertifybydate",
    "newcorrectbydate",
    "originalcorrectbydate",
    "certifieddate",
    "novdescription",
    "novissueddate",
    "currentstatus",
    "currentstatusdate",
    "violationstatus",
)
COMPLAINT_FIELDS = (
    "received_date",
    "problem_id",
    "complaint_id",
    "building_id",
    "type",
    "major_category",
    "minor_category",
    "complaint_status",
    "problem_status",
    "problem_status_date",
    "status_description",
)
BEDBUG_FIELDS = (
    "building_id",
    "of_dwelling_units",
    "infested_dwelling_unit_count",
    "eradicated_unit_count",
    "re_infested_dwelling_unit",
    "filing_date",
    "filing_period_start_date",
    "filling_period_end_date",
)
ORDER_FIELDS = (
    "building_id",
    "vacate_order_number",
    "primary_vacate_reason",
    "vacate_type",
    "vacate_effective_date",
    "actual_rescind_date",
    "number_of_vacated_units",
)

BUILDING_BATCH_SIZE = 500
MAX_OPEN_VIOLATION_DETAILS = 100
MAX_RECENT_CLOSED_VIOLATION_DETAILS = 10
MAX_RECENT_COMPLAINT_DETAILS = 15
BEDBUG_REPORTING_YEARS = 3


@dataclass(frozen=True)
class DatasetSpec:
    dataset_id: str
    building_field: str
    fields: tuple[str, ...]
    where: str | None
    order: str


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = " ".join(str(value).split()).strip()
    return text or None


def clean_integer(value: Any) -> int | None:
    text = clean_text(value)
    if text is None:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return int(number) if number.is_integer() else None


def clean_identifier(value: Any) -> str | None:
    number = clean_integer(value)
    return str(number) if number is not None and number >= 0 else None


def iso_day(value: str | None) -> str | None:
    return value[:10] if value else None


def years_before(value: datetime, years: int) -> str:
    try:
        shifted = value.replace(year=value.year - years)
    except ValueError:
        shifted = value.replace(year=value.year - years, day=28)
    return shifted.date().isoformat()


def source_url(dataset_id: str) -> str:
    return f"https://data.cityofnewyork.us/d/{dataset_id}"


def provenance(dataset_id: str, result: FetchResult) -> dict[str, Any]:
    return {
        "datasetId": dataset_id,
        "sourceUrl": source_url(dataset_id),
        "retrievedAt": result.provenance.retrieved_at,
        "query": result.provenance.query,
    }


def empty_result(dataset_id: str, query: Mapping[str, str]) -> FetchResult:
    return FetchResult(
        records=[],
        provenance=Provenance(
            dataset_id=dataset_id,
            retrieved_at=datetime.now(timezone.utc).isoformat(),
            query=dict(query),
            from_cache=True,
        ),
    )


def fetch_batched(
    client: NycOpenDataClient,
    spec: DatasetSpec,
    building_ids: Sequence[str],
) -> FetchResult:
    """Fetch one dataset in bounded Building ID batches through the shared cache."""

    if not building_ids:
        return empty_result(spec.dataset_id, {"building_batches": "0"})
    records: list[dict[str, Any]] = []
    pages: list[Provenance] = []
    for start in range(0, len(building_ids), BUILDING_BATCH_SIZE):
        batch = building_ids[start : start + BUILDING_BATCH_SIZE]
        building_filter = f"{spec.building_field} in ({','.join(batch)})"
        where = (
            f"({building_filter}) AND ({spec.where})" if spec.where else building_filter
        )
        fetched = client.fetch_all(
            spec.dataset_id,
            select=spec.fields,
            where=where,
            order=spec.order,
            page_size=50000,
        )
        records.extend(fetched.records)
        pages.append(fetched.provenance)
    return FetchResult(
        records=records,
        provenance=Provenance(
            dataset_id=spec.dataset_id,
            retrieved_at=pages[-1].retrieved_at,
            query={
                "$select": ",".join(spec.fields),
                "$where": spec.where or "matched Building IDs",
                "$order": spec.order,
                "building_batch_size": str(BUILDING_BATCH_SIZE),
                "building_batches": str(len(pages)),
            },
            from_cache=all(page.from_cache for page in pages),
        ),
    )


def fetch_reference_data(
    client: NycOpenDataClient,
    building_ids: Sequence[str],
    as_of: datetime,
) -> tuple[dict[str, FetchResult], dict[str, str]]:
    """Fetch compact time windows, allowing one failed source to remain explicit."""

    twelve_month_cutoff = years_before(as_of, 1)
    thirty_six_month_cutoff = years_before(as_of, 3)
    bedbug_cutoff = years_before(as_of, 4)
    specs = (
        DatasetSpec(
            HPD_VIOLATIONS_DATASET,
            "buildingid",
            VIOLATION_FIELDS,
            (
                "violationstatus='Open' OR "
                f"novissueddate >= '{thirty_six_month_cutoff}T00:00:00.000'"
            ),
            "buildingid,novissueddate DESC,violationid DESC",
        ),
        DatasetSpec(
            HPD_COMPLAINT_PROBLEMS_DATASET,
            "building_id",
            COMPLAINT_FIELDS,
            (
                "problem_status='OPEN' OR "
                f"received_date >= '{thirty_six_month_cutoff}T00:00:00.000'"
            ),
            "building_id,received_date DESC,problem_id DESC",
        ),
    )
    fetched: dict[str, FetchResult] = {}
    failures: dict[str, str] = {}
    for spec in specs:
        try:
            fetched[spec.dataset_id] = fetch_batched(client, spec, building_ids)
        except NycOpenDataError as error:
            failures[spec.dataset_id] = str(error)

    # Bedbug Reporting declares Building ID as text. A single four-year bulk
    # fetch is smaller and more reliable than constructing 96 quoted-ID queries.
    try:
        fetched[BEDBUG_REPORTING_DATASET] = client.fetch_all(
            BEDBUG_REPORTING_DATASET,
            select=BEDBUG_FIELDS,
            where=(
                "filing_period_start_date >= "
                f"'{bedbug_cutoff}T00:00:00.000'"
            ),
            order="building_id,filing_period_start_date DESC,filing_date DESC",
            page_size=50000,
        )
    except NycOpenDataError as error:
        failures[BEDBUG_REPORTING_DATASET] = str(error)

    # The official order table is only about 9,000 rows; one bulk request is both
    # cheaper and more complete than Building ID batches, and preserves every active order.
    try:
        fetched[VACATE_REPAIR_ORDERS_DATASET] = client.fetch_all(
            VACATE_REPAIR_ORDERS_DATASET,
            select=ORDER_FIELDS,
            order="building_id,vacate_effective_date DESC,vacate_order_number DESC",
            page_size=50000,
        )
    except NycOpenDataError as error:
        failures[VACATE_REPAIR_ORDERS_DATASET] = str(error)

    # Make the summary cutoff discoverable even though each source has its own query.
    if HPD_VIOLATIONS_DATASET in fetched:
        fetched[HPD_VIOLATIONS_DATASET].provenance.query[  # type: ignore[misc]
            "issued_last_12_months_cutoff"
        ] = twelve_month_cutoff
    return fetched, failures


def index_rows(
    rows: Sequence[Mapping[str, Any]], field: str
) -> dict[str, list[Mapping[str, Any]]]:
    indexed: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for row in rows:
        building_id = clean_identifier(row.get(field))
        if building_id is not None:
            indexed[building_id].append(row)
    return indexed


def dataset_state(
    building_id: str | None,
    dataset_id: str,
    results: Mapping[str, FetchResult],
    failures: Mapping[str, str],
) -> tuple[str, str | None]:
    if building_id is None:
        return "unavailable", "no_hpd_building_id"
    if dataset_id in failures:
        return "lookup_failed", failures[dataset_id]
    if dataset_id not in results:
        return "lookup_failed", "dataset result was not provided"
    return "available", None


def normalize_violation(row: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "violationId": clean_identifier(row.get("violationid")),
        "class": clean_text(row.get("class")),
        "status": clean_text(row.get("violationstatus")),
        "description": clean_text(row.get("novdescription")),
        "inspectionDate": iso_day(clean_text(row.get("inspectiondate"))),
        "issuedDate": iso_day(clean_text(row.get("novissueddate"))),
        "currentStatus": clean_text(row.get("currentstatus")),
        "currentStatusDate": iso_day(clean_text(row.get("currentstatusdate"))),
        "certifiedDate": iso_day(clean_text(row.get("certifieddate"))),
        "certifyByDate": iso_day(
            clean_text(row.get("newcertifybydate"))
            or clean_text(row.get("originalcertifybydate"))
        ),
        "correctByDate": iso_day(
            clean_text(row.get("newcorrectbydate"))
            or clean_text(row.get("originalcorrectbydate"))
        ),
    }


def violation_date(row: Mapping[str, Any]) -> str:
    return clean_text(row.get("novissueddate")) or clean_text(
        row.get("inspectiondate")
    ) or ""


def build_violations(
    rows: Sequence[Mapping[str, Any]],
    cutoff: str,
    source: dict[str, Any] | None,
    state: str,
    reason: str | None,
) -> dict[str, Any]:
    if state != "available":
        return {
            "availability": state,
            "unavailableReason": reason,
            "openCount": None,
            "openClassACount": None,
            "openClassBCount": None,
            "openClassCCount": None,
            "issuedLast12Months": None,
            "details": [],
            "detailTruncated": False,
            "provenance": source,
        }
    ordered = sorted(rows, key=violation_date, reverse=True)
    open_rows = [row for row in ordered if clean_text(row.get("violationstatus")) == "Open"]
    recent_closed = [
        row for row in ordered if clean_text(row.get("violationstatus")) != "Open"
    ][:MAX_RECENT_CLOSED_VIOLATION_DETAILS]
    retained_open = open_rows[:MAX_OPEN_VIOLATION_DETAILS]
    classes = defaultdict(int)
    for row in open_rows:
        classes[(clean_text(row.get("class")) or "").upper()] += 1
    return {
        "availability": "available",
        "unavailableReason": None,
        "openCount": len(open_rows),
        "openClassACount": classes["A"],
        "openClassBCount": classes["B"],
        "openClassCCount": classes["C"],
        "issuedLast12Months": sum(violation_date(row)[:10] >= cutoff for row in rows),
        "details": [normalize_violation(row) for row in retained_open + recent_closed],
        "detailTruncated": len(retained_open) < len(open_rows),
        "provenance": source,
    }


def normalize_problem(row: Mapping[str, Any]) -> dict[str, Any]:
    problem_type = clean_text(row.get("type")) or clean_text(row.get("major_category"))
    category_parts = [
        clean_text(row.get("major_category")),
        clean_text(row.get("minor_category")),
    ]
    return {
        "problemId": clean_identifier(row.get("problem_id")),
        "complaintId": clean_identifier(row.get("complaint_id")),
        "type": problem_type,
        "category": " — ".join(part for part in category_parts if part) or None,
        "date": iso_day(clean_text(row.get("received_date"))),
        "status": clean_text(row.get("problem_status"))
        or clean_text(row.get("complaint_status")),
        "statusDate": iso_day(clean_text(row.get("problem_status_date"))),
        "description": clean_text(row.get("status_description")),
    }


def build_complaints(
    rows: Sequence[Mapping[str, Any]],
    cutoff_12: str,
    cutoff_36: str,
    source: dict[str, Any] | None,
    state: str,
    reason: str | None,
) -> dict[str, Any]:
    if state != "available":
        return {
            "availability": state,
            "unavailableReason": reason,
            "complaintCountLast12Months": None,
            "problemCountLast12Months": None,
            "complaintCountLast36Months": None,
            "problemCountLast36Months": None,
            "openProblemCount": None,
            "recentDetails": [],
            "provenance": source,
        }
    recent_12 = [row for row in rows if str(row.get("received_date") or "")[:10] >= cutoff_12]
    recent_36 = [row for row in rows if str(row.get("received_date") or "")[:10] >= cutoff_36]

    def complaints(items: Sequence[Mapping[str, Any]]) -> int:
        return len(
            {
                complaint_id
                for row in items
                if (complaint_id := clean_identifier(row.get("complaint_id"))) is not None
            }
        )

    ordered = sorted(
        recent_36,
        key=lambda row: str(row.get("received_date") or ""),
        reverse=True,
    )
    return {
        "availability": "available",
        "unavailableReason": None,
        "complaintCountLast12Months": complaints(recent_12),
        "problemCountLast12Months": len(recent_12),
        "complaintCountLast36Months": complaints(recent_36),
        "problemCountLast36Months": len(recent_36),
        "openProblemCount": sum(
            clean_text(row.get("problem_status")) == "OPEN" for row in rows
        ),
        "recentDetails": [
            normalize_problem(row) for row in ordered[:MAX_RECENT_COMPLAINT_DETAILS]
        ],
        "provenance": source,
    }


def normalize_bedbug_report(row: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "reportingPeriodStart": iso_day(clean_text(row.get("filing_period_start_date"))),
        "reportingPeriodEnd": iso_day(clean_text(row.get("filling_period_end_date"))),
        "filingDate": iso_day(clean_text(row.get("filing_date"))),
        "dwellingUnits": clean_integer(row.get("of_dwelling_units")),
        "infestedUnits": clean_integer(row.get("infested_dwelling_unit_count")),
        "eradicatedUnits": clean_integer(row.get("eradicated_unit_count")),
        "reInfestedUnits": clean_integer(row.get("re_infested_dwelling_unit")),
    }


def build_bedbugs(
    rows: Sequence[Mapping[str, Any]],
    source: dict[str, Any] | None,
    state: str,
    reason: str | None,
) -> dict[str, Any]:
    if state != "available":
        return {
            "availability": state,
            "unavailableReason": reason,
            "recentHistory": [],
            "provenance": source,
        }
    latest_by_period: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        period = clean_text(row.get("filing_period_start_date"))
        if not period:
            continue
        current = latest_by_period.get(period)
        if current is None or str(row.get("filing_date") or "") > str(
            current.get("filing_date") or ""
        ):
            latest_by_period[period] = row
    selected = [
        latest_by_period[key]
        for key in sorted(latest_by_period, reverse=True)[:BEDBUG_REPORTING_YEARS]
    ]
    if not selected:
        return {
            "availability": "unavailable",
            "unavailableReason": "no_recent_bedbug_filing",
            "recentHistory": [],
            "provenance": source,
        }
    return {
        "availability": "available",
        "unavailableReason": None,
        "recentHistory": [normalize_bedbug_report(row) for row in selected],
        "provenance": source,
    }


def normalize_order(row: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "orderNumber": clean_identifier(row.get("vacate_order_number")),
        "type": clean_text(row.get("vacate_type")),
        "reason": clean_text(row.get("primary_vacate_reason")),
        "effectiveDate": iso_day(clean_text(row.get("vacate_effective_date"))),
        "rescindedDate": iso_day(clean_text(row.get("actual_rescind_date"))),
        "vacatedUnits": clean_integer(row.get("number_of_vacated_units")),
    }


def build_orders(
    rows: Sequence[Mapping[str, Any]],
    as_of_day: str,
    source: dict[str, Any] | None,
    state: str,
    reason: str | None,
) -> dict[str, Any]:
    if state != "available":
        return {
            "availability": state,
            "unavailableReason": reason,
            "activeCount": None,
            "activeDetails": [],
            "mostRecentHistoricalOrder": None,
            "provenance": source,
        }
    active = [
        row
        for row in rows
        if clean_text(row.get("actual_rescind_date")) is None
        and (
            clean_text(row.get("vacate_effective_date")) is None
            or str(row.get("vacate_effective_date"))[:10] <= as_of_day
        )
    ]
    active.sort(key=lambda row: str(row.get("vacate_effective_date") or ""), reverse=True)
    historical = [row for row in rows if clean_text(row.get("actual_rescind_date"))]
    historical.sort(
        key=lambda row: str(row.get("vacate_effective_date") or ""), reverse=True
    )
    return {
        "availability": "available",
        "unavailableReason": None,
        "activeCount": len(active),
        "activeDetails": [normalize_order(row) for row in active],
        "mostRecentHistoricalOrder": normalize_order(historical[0]) if historical else None,
        "provenance": source,
    }


def enrich_records(
    records: Sequence[Mapping[str, Any]],
    *,
    results: Mapping[str, FetchResult],
    failures: Mapping[str, str],
    as_of: datetime,
) -> list[dict[str, Any]]:
    indexes = {
        HPD_VIOLATIONS_DATASET: index_rows(
            results.get(HPD_VIOLATIONS_DATASET, empty_result(HPD_VIOLATIONS_DATASET, {})).records,
            "buildingid",
        ),
        HPD_COMPLAINT_PROBLEMS_DATASET: index_rows(
            results.get(
                HPD_COMPLAINT_PROBLEMS_DATASET,
                empty_result(HPD_COMPLAINT_PROBLEMS_DATASET, {}),
            ).records,
            "building_id",
        ),
        BEDBUG_REPORTING_DATASET: index_rows(
            results.get(BEDBUG_REPORTING_DATASET, empty_result(BEDBUG_REPORTING_DATASET, {})).records,
            "building_id",
        ),
        VACATE_REPAIR_ORDERS_DATASET: index_rows(
            results.get(
                VACATE_REPAIR_ORDERS_DATASET,
                empty_result(VACATE_REPAIR_ORDERS_DATASET, {}),
            ).records,
            "building_id",
        ),
    }
    sources = {
        dataset_id: provenance(dataset_id, result)
        for dataset_id, result in results.items()
        if dataset_id in DATASET_IDS
    }
    cutoff_12 = years_before(as_of, 1)
    cutoff_36 = years_before(as_of, 3)
    enriched: list[dict[str, Any]] = []
    for original in records:
        record = dict(original)
        building_id = clean_identifier(record.get("hpdBuildingId"))
        state = {
            dataset_id: dataset_state(building_id, dataset_id, results, failures)
            for dataset_id in DATASET_IDS
        }
        record["conditions"] = {
            "asOf": as_of.date().isoformat(),
            "violations": build_violations(
                indexes[HPD_VIOLATIONS_DATASET].get(building_id or "", ()),
                cutoff_12,
                sources.get(HPD_VIOLATIONS_DATASET),
                *state[HPD_VIOLATIONS_DATASET],
            ),
            "complaints": build_complaints(
                indexes[HPD_COMPLAINT_PROBLEMS_DATASET].get(building_id or "", ()),
                cutoff_12,
                cutoff_36,
                sources.get(HPD_COMPLAINT_PROBLEMS_DATASET),
                *state[HPD_COMPLAINT_PROBLEMS_DATASET],
            ),
            "bedbugs": build_bedbugs(
                indexes[BEDBUG_REPORTING_DATASET].get(building_id or "", ()),
                sources.get(BEDBUG_REPORTING_DATASET),
                *state[BEDBUG_REPORTING_DATASET],
            ),
            "vacateRepairOrders": build_orders(
                indexes[VACATE_REPAIR_ORDERS_DATASET].get(building_id or "", ()),
                as_of.date().isoformat(),
                sources.get(VACATE_REPAIR_ORDERS_DATASET),
                *state[VACATE_REPAIR_ORDERS_DATASET],
            ),
        }
        enriched.append(record)
    return enriched


def build_report(
    records: Sequence[Mapping[str, Any]],
    results: Mapping[str, FetchResult],
    failures: Mapping[str, str],
    as_of: datetime,
) -> dict[str, Any]:
    by_building: dict[str, Mapping[str, Any]] = {}
    without_building_id: list[str] = []
    for record in records:
        building_id = clean_identifier(record.get("hpdBuildingId"))
        if building_id is None:
            identifier = clean_text(record.get("stabiliId")) or clean_text(
                record.get("sourceRecordId")
            )
            if identifier:
                without_building_id.append(identifier)
        else:
            by_building[building_id] = record

    feature_lists = {
        "buildingsWithOpenViolations": [],
        "buildingsWithClassCViolations": [],
        "buildingsWithRecentComplaints": [],
        "buildingsWithBedbugReports": [],
        "buildingsWithActiveVacateOrders": [],
    }
    zero_confirmed = {
        dataset_id: [] for dataset_id in DATASET_IDS
    }
    unavailable = {dataset_id: [] for dataset_id in DATASET_IDS}
    lookup_failed = {dataset_id: [] for dataset_id in DATASET_IDS}
    section_for_dataset = {
        HPD_VIOLATIONS_DATASET: "violations",
        HPD_COMPLAINT_PROBLEMS_DATASET: "complaints",
        BEDBUG_REPORTING_DATASET: "bedbugs",
        VACATE_REPAIR_ORDERS_DATASET: "vacateRepairOrders",
    }

    for building_id, record in sorted(by_building.items(), key=lambda item: int(item[0])):
        conditions = record["conditions"]
        violations = conditions["violations"]
        complaints = conditions["complaints"]
        bedbugs = conditions["bedbugs"]
        orders = conditions["vacateRepairOrders"]
        if violations.get("openCount", 0):
            feature_lists["buildingsWithOpenViolations"].append(building_id)
        if violations.get("openClassCCount", 0):
            feature_lists["buildingsWithClassCViolations"].append(building_id)
        if complaints.get("problemCountLast12Months", 0):
            feature_lists["buildingsWithRecentComplaints"].append(building_id)
        if bedbugs.get("recentHistory"):
            feature_lists["buildingsWithBedbugReports"].append(building_id)
        if orders.get("activeCount", 0):
            feature_lists["buildingsWithActiveVacateOrders"].append(building_id)

        for dataset_id, section_name in section_for_dataset.items():
            section = conditions[section_name]
            state = section["availability"]
            if state == "lookup_failed":
                lookup_failed[dataset_id].append(building_id)
            elif state == "unavailable":
                unavailable[dataset_id].append(building_id)
            elif dataset_id == HPD_VIOLATIONS_DATASET and section["openCount"] == 0:
                zero_confirmed[dataset_id].append(building_id)
            elif (
                dataset_id == HPD_COMPLAINT_PROBLEMS_DATASET
                and section["problemCountLast12Months"] == 0
            ):
                zero_confirmed[dataset_id].append(building_id)
            elif dataset_id == BEDBUG_REPORTING_DATASET and all(
                row.get("infestedUnits") == 0 for row in section["recentHistory"]
            ):
                zero_confirmed[dataset_id].append(building_id)
            elif dataset_id == VACATE_REPAIR_ORDERS_DATASET and section["activeCount"] == 0:
                zero_confirmed[dataset_id].append(building_id)

    coverage = {}
    total = len(by_building)
    for dataset_id in DATASET_IDS:
        coverage[dataset_id] = {
            "sourceUrl": source_url(dataset_id),
            "eligibleBuildings": total,
            "availableBuildings": total
            - len(unavailable[dataset_id])
            - len(lookup_failed[dataset_id]),
            "zeroConfirmedBuildings": len(zero_confirmed[dataset_id]),
            "unavailableBuildings": len(unavailable[dataset_id]),
            "lookupFailedBuildings": len(lookup_failed[dataset_id]),
            "fetch": (
                results[dataset_id].provenance.to_dict()
                if dataset_id in results
                else None
            ),
            "failure": failures.get(dataset_id),
        }

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "asOf": as_of.date().isoformat(),
        "coverageSemantics": (
            "Unique matched HPD buildings; duplicate Stabili source rows are counted once. "
            "A confirmed zero requires a successful filtered dataset lookup."
        ),
        "timeWindows": {
            "violationsIssuedSince": years_before(as_of, 1),
            "complaintsRecentSince": years_before(as_of, 1),
            "complaintsExtendedSince": years_before(as_of, 3),
            "bedbugReportingYearsRetained": BEDBUG_REPORTING_YEARS,
        },
        "totalMatchedBuildings": total,
        "coverageByDataset": coverage,
        "counts": {name: len(values) for name, values in feature_lists.items()},
        **feature_lists,
        "datasetLookupFailedBuildingIds": lookup_failed,
        "zeroConfirmedBuildingIds": zero_confirmed,
        "dataUnavailableBuildingIds": unavailable,
        "recordsWithoutHpdBuildingId": sorted(set(without_building_id)),
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
    failures: Mapping[str, str] | None = None,
    as_of: datetime | None = None,
) -> dict[str, Any]:
    source_records = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(source_records, list) or not all(
        isinstance(row, dict) for row in source_records
    ):
        raise ValueError("Condition-enrichment input must be a JSON array of objects")
    effective_as_of = as_of or datetime.now(timezone.utc)
    building_ids = sorted(
        {
            building_id
            for row in source_records
            if (building_id := clean_identifier(row.get("hpdBuildingId"))) is not None
        },
        key=int,
    )
    if results is None:
        fetched, fetch_failures = fetch_reference_data(
            client or NycOpenDataClient(), building_ids, effective_as_of
        )
    else:
        fetched = dict(results)
        fetch_failures = dict(failures or {})
    enriched = enrich_records(
        source_records,
        results=fetched,
        failures=fetch_failures,
        as_of=effective_as_of,
    )
    if len(enriched) != len(source_records):
        raise AssertionError("Condition enrichment must retain every input record")
    report = build_report(enriched, fetched, fetch_failures, effective_as_of)
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
        client=NycOpenDataClient(
            refresh_cache=args.refresh_cache,
            timeout=120.0,
            max_retries=5,
        ),
    )
    print(json.dumps(report["counts"], indent=2))
    print(json.dumps(report["coverageByDataset"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
