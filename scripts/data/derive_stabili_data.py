#!/usr/bin/env python3
"""Derive related-record links and Stabili Building Health from ingested data."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable, Iterator, Mapping, Sequence, TextIO


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = (
    REPOSITORY_ROOT / "data" / "intermediate" / "nyc_condition_enriched.json"
)
DEFAULT_OUTPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "stabili_derived.json"
DEFAULT_REPORT_PATH = REPOSITORY_ROOT / "data" / "reports" / "derived-data-report.json"

HEALTH_ALGORITHM_VERSION = "building-health-v1.0.0"
HEALTH_STATES = (
    "low_concern",
    "some_concerns",
    "higher_concern",
    "insufficient_data",
)
BBL_PATTERN = re.compile(r"^[1-5]\d{9}$")
READ_CHUNK_SIZE = 1024 * 1024
MAX_REPORTED_RELATED_GROUPS = 20
MAX_REPORTED_RELATED_EXAMPLES = 20

REQUIRED_HEALTH_FIELDS = (
    "conditions.violations.openClassCCount",
    "conditions.violations.openClassBCount",
    "conditions.violations.openCount",
    "conditions.complaints.complaintCountLast12Months",
    "conditions.vacateRepairOrders.activeCount",
)


def iter_json_array(path: Path) -> Iterator[dict[str, Any]]:
    """Stream objects from a top-level JSON array using only the standard library."""

    decoder = json.JSONDecoder()
    with path.open(encoding="utf-8") as handle:
        buffer = ""
        position = 0
        ended = False

        def fill() -> bool:
            nonlocal buffer, position
            chunk = handle.read(READ_CHUNK_SIZE)
            if not chunk:
                return False
            buffer = buffer[position:] + chunk
            position = 0
            return True

        while not buffer and fill():
            pass
        position = _skip_whitespace(buffer, position)
        if position >= len(buffer) or buffer[position] != "[":
            raise ValueError("Derived-data input must be a top-level JSON array")
        position += 1

        while True:
            while True:
                position = _skip_whitespace(buffer, position)
                if position < len(buffer):
                    break
                if not fill():
                    raise ValueError(
                        "Derived-data input ended before the JSON array closed"
                    )

            if buffer[position] == "]":
                position += 1
                ended = True
                break

            while True:
                try:
                    value, position = decoder.raw_decode(buffer, position)
                    break
                except json.JSONDecodeError:
                    if not fill():
                        raise
            if not isinstance(value, dict):
                raise ValueError("Every derived-data input row must be a JSON object")
            yield value

            while True:
                position = _skip_whitespace(buffer, position)
                if position < len(buffer):
                    break
                if not fill():
                    raise ValueError(
                        "Derived-data input ended before the JSON array closed"
                    )
            delimiter = buffer[position]
            if delimiter == ",":
                position += 1
                continue
            if delimiter == "]":
                position += 1
                ended = True
                break
            raise ValueError(f"Expected ',' or ']' in input array, found {delimiter!r}")

        if not ended:
            raise ValueError("Derived-data input did not contain a complete JSON array")
        trailing = buffer[position:] + handle.read()
        if trailing.strip():
            raise ValueError("Derived-data input contains content after the JSON array")


def _skip_whitespace(value: str, position: int) -> int:
    while position < len(value) and value[position].isspace():
        position += 1
    return position


def record_id(record: Mapping[str, Any]) -> str | None:
    value = record.get("stabiliId")
    return value if isinstance(value, str) and value.strip() else None


def reliable_bbl(record: Mapping[str, Any]) -> str | None:
    """Return a BBL only when the property-match evidence supports parcel identity."""

    bbl = record.get("bbl")
    if not isinstance(bbl, str) or BBL_PATTERN.fullmatch(bbl) is None:
        return None
    status = record.get("matchStatus")
    if status == "matched":
        return bbl
    reasons = (record.get("matchMetadata") or {}).get("reasonCodes") or []
    if status == "ambiguous" and "source_bbl_found_in_official_nyc_data" in reasons:
        return bbl
    return None


def build_related_groups(
    records: Iterable[Mapping[str, Any]],
) -> tuple[dict[str, tuple[str, ...]], dict[str, tuple[str, ...]], int]:
    ids_by_bbl: dict[str, list[str]] = defaultdict(list)
    seen_ids: set[str] = set()
    record_count = 0
    for record in records:
        record_count += 1
        identifier = record_id(record)
        if identifier is None:
            raise ValueError(f"Input record {record_count - 1} has no stabiliId")
        if identifier in seen_ids:
            raise ValueError(f"Duplicate stabiliId in derived-data input: {identifier}")
        seen_ids.add(identifier)
        bbl = reliable_bbl(record)
        if bbl is not None:
            ids_by_bbl[bbl].append(identifier)

    groups = {bbl: tuple(ids) for bbl, ids in ids_by_bbl.items() if len(ids) > 1}
    related_by_id = {
        identifier: tuple(other for other in ids if other != identifier)
        for ids in groups.values()
        for identifier in ids
    }
    return related_by_id, groups, record_count


def _available_section(
    conditions: Mapping[str, Any], section_name: str
) -> Mapping[str, Any] | None:
    section = conditions.get(section_name)
    if not isinstance(section, Mapping) or section.get("availability") != "available":
        return None
    return section


def _count(section: Mapping[str, Any] | None, field: str) -> int | None:
    if section is None:
        return None
    value = section.get(field)
    return (
        value
        if isinstance(value, int) and not isinstance(value, bool) and value >= 0
        else None
    )


def latest_bedbug_infestation(conditions: Mapping[str, Any]) -> int | None:
    bedbugs = _available_section(conditions, "bedbugs")
    if bedbugs is None:
        return None
    history = bedbugs.get("recentHistory")
    if (
        not isinstance(history, list)
        or not history
        or not isinstance(history[0], Mapping)
    ):
        return None
    return _count(history[0], "infestedUnits")


def _tier_points(value: int, first: int, second: int, low: int, high: int) -> int:
    if value >= second:
        return high
    if value >= first:
        return low
    return 0


def classify_health(record: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    conditions_value = record.get("conditions")
    conditions = conditions_value if isinstance(conditions_value, Mapping) else {}
    violations = _available_section(conditions, "violations")
    complaints = _available_section(conditions, "complaints")
    orders = _available_section(conditions, "vacateRepairOrders")

    inputs = {
        "openClassCViolations": _count(violations, "openClassCCount"),
        "openClassBViolations": _count(violations, "openClassBCount"),
        "totalOpenViolations": _count(violations, "openCount"),
        "complaintsLast12Months": _count(complaints, "complaintCountLast12Months"),
        "activeVacateOrders": _count(orders, "activeCount"),
        "latestBedbugReportInfestedUnits": latest_bedbug_infestation(conditions),
    }
    required = {
        REQUIRED_HEALTH_FIELDS[0]: inputs["openClassCViolations"],
        REQUIRED_HEALTH_FIELDS[1]: inputs["openClassBViolations"],
        REQUIRED_HEALTH_FIELDS[2]: inputs["totalOpenViolations"],
        REQUIRED_HEALTH_FIELDS[3]: inputs["complaintsLast12Months"],
        REQUIRED_HEALTH_FIELDS[4]: inputs["activeVacateOrders"],
    }
    unavailable = [field for field, value in required.items() if value is None]
    summary = {
        "conditionsAsOf": (
            conditions.get("asOf") if isinstance(conditions.get("asOf"), str) else None
        ),
        **inputs,
        "hasActiveVacateOrder": (
            inputs["activeVacateOrders"] > 0
            if inputs["activeVacateOrders"] is not None
            else None
        ),
    }
    if unavailable:
        return (
            {
                "state": "insufficient_data",
                "algorithmVersion": HEALTH_ALGORITHM_VERSION,
                "evaluatedAsOf": summary["conditionsAsOf"],
                "score": None,
                "factorPoints": None,
                "inputs": inputs,
                "unavailableRequiredFields": unavailable,
            },
            summary,
        )

    class_c = inputs["openClassCViolations"]
    class_b = inputs["openClassBViolations"]
    total_open = inputs["totalOpenViolations"]
    complaints_12 = inputs["complaintsLast12Months"]
    active_orders = inputs["activeVacateOrders"]
    assert all(
        isinstance(value, int)
        for value in (class_c, class_b, total_open, complaints_12, active_orders)
    )
    bedbugs = inputs["latestBedbugReportInfestedUnits"]
    factor_points = {
        "openClassCViolations": _tier_points(class_c, 1, 3, 2, 4),
        "openClassBViolations": _tier_points(class_b, 1, 6, 1, 2),
        "totalOpenViolations": _tier_points(total_open, 10, 25, 1, 2),
        "complaintsLast12Months": _tier_points(complaints_12, 5, 15, 1, 2),
        "activeVacateOrders": 4 if active_orders > 0 else 0,
        "latestBedbugReportInfestedUnits": (
            1 if isinstance(bedbugs, int) and bedbugs > 0 else 0
        ),
    }
    score = sum(factor_points.values())
    state = (
        "higher_concern"
        if score >= 4
        else "some_concerns" if score >= 1 else "low_concern"
    )
    return (
        {
            "state": state,
            "algorithmVersion": HEALTH_ALGORITHM_VERSION,
            "evaluatedAsOf": summary["conditionsAsOf"],
            "score": score,
            "factorPoints": factor_points,
            "inputs": inputs,
            "unavailableRequiredFields": [],
        },
        summary,
    )


def derive_record(
    record: Mapping[str, Any], related_by_id: Mapping[str, Sequence[str]]
) -> dict[str, Any]:
    derived = dict(record)
    identifier = record_id(record)
    if identifier is None:
        raise ValueError("Cannot derive a record without stabiliId")
    health, summary = classify_health(record)
    derived["relatedRecordIds"] = list(related_by_id.get(identifier, ()))
    derived["health"] = health
    derived["renterSummary"] = summary
    return derived


def _write_record(handle: TextIO, record: Mapping[str, Any], first: bool) -> None:
    if not first:
        handle.write(",\n")
    serialized = json.dumps(record, indent=2, ensure_ascii=False)
    handle.write("  " + serialized.replace("\n", "\n  "))


def derive_to_file(
    input_path: Path,
    output_path: Path,
    related_by_id: Mapping[str, Sequence[str]],
) -> tuple[Counter[str], list[dict[str, Any]], int]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    distribution: Counter[str] = Counter()
    could_not_evaluate: list[dict[str, Any]] = []
    count = 0
    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=output_path.parent,
            prefix=f".{output_path.name}.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temp_name = handle.name
            handle.write("[\n")
            for record in iter_json_array(input_path):
                derived = derive_record(record, related_by_id)
                _write_record(handle, derived, count == 0)
                count += 1
                health = derived["health"]
                distribution[health["state"]] += 1
                if health["state"] == "insufficient_data":
                    could_not_evaluate.append(
                        {
                            "stabiliId": derived["stabiliId"],
                            "unavailableRequiredFields": health[
                                "unavailableRequiredFields"
                            ],
                        }
                    )
            handle.write("\n]\n")
        os.chmod(temp_name, 0o644)
        os.replace(temp_name, output_path)
        temp_name = None
    finally:
        if temp_name is not None:
            Path(temp_name).unlink(missing_ok=True)
    return distribution, could_not_evaluate, count


def build_report(
    *,
    record_count: int,
    distribution: Mapping[str, int],
    related_groups: Mapping[str, Sequence[str]],
    could_not_evaluate: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    ordered_groups = sorted(
        related_groups.items(), key=lambda item: (-len(item[1]), item[0])
    )
    records_with_related = sum(len(ids) for ids in related_groups.values())
    return {
        "algorithmVersion": HEALTH_ALGORITHM_VERSION,
        "recordSemantics": (
            "One derived record per DHCR PDF row; related records remain independent."
        ),
        "totalRecords": record_count,
        "countByHealthState": {
            state: int(distribution.get(state, 0)) for state in HEALTH_STATES
        },
        "insufficientDataCount": int(distribution.get("insufficient_data", 0)),
        "recordsWithRelatedRecords": {
            "count": records_with_related,
            "groupCount": len(related_groups),
            "exampleRecordIds": [
                identifier for _, ids in ordered_groups for identifier in ids
            ][:MAX_REPORTED_RELATED_EXAMPLES],
        },
        "largestRelatedRecordGroups": [
            {"bbl": bbl, "recordCount": len(ids), "recordIds": list(ids)}
            for bbl, ids in ordered_groups[:MAX_REPORTED_RELATED_GROUPS]
        ],
        "recordsThatCouldNotBeEvaluated": list(could_not_evaluate),
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def run(input_path: Path, output_path: Path, report_path: Path) -> dict[str, Any]:
    related_by_id, related_groups, input_count = build_related_groups(
        iter_json_array(input_path)
    )
    distribution, could_not_evaluate, output_count = derive_to_file(
        input_path, output_path, related_by_id
    )
    if input_count != output_count:
        raise AssertionError(
            "Derived-data stage must retain every input record: "
            f"{input_count} input, {output_count} output"
        )
    report = build_report(
        record_count=output_count,
        distribution=distribution,
        related_groups=related_groups,
        could_not_evaluate=could_not_evaluate,
    )
    write_json(report_path, report)
    return report


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        report = run(args.input, args.output, args.report)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(report["countByHealthState"], indent=2))
    print(
        json.dumps(
            {
                "recordsWithRelatedRecords": report["recordsWithRelatedRecords"][
                    "count"
                ],
                "relatedRecordGroups": report["recordsWithRelatedRecords"][
                    "groupCount"
                ],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
