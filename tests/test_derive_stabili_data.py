from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import derive_stabili_data as derived  # noqa: E402


def conditions(
    *,
    class_c: int = 0,
    class_b: int = 0,
    total_open: int = 0,
    complaints: int = 0,
    active_orders: int = 0,
    bedbugs: int | None = 0,
) -> dict:
    bedbug_section = (
        {
            "availability": "available",
            "recentHistory": [{"infestedUnits": bedbugs}],
        }
        if bedbugs is not None
        else {
            "availability": "unavailable",
            "recentHistory": [],
        }
    )
    return {
        "asOf": "2026-08-14",
        "violations": {
            "availability": "available",
            "openClassCCount": class_c,
            "openClassBCount": class_b,
            "openCount": total_open,
        },
        "complaints": {
            "availability": "available",
            "complaintCountLast12Months": complaints,
        },
        "bedbugs": bedbug_section,
        "vacateRepairOrders": {
            "availability": "available",
            "activeCount": active_orders,
        },
    }


def record(identifier: str, bbl: str | None, condition_data: dict, **extra) -> dict:
    value = {
        "stabiliId": identifier,
        "bbl": bbl,
        "matchStatus": "matched" if bbl else "unmatched",
        "matchMetadata": {"reasonCodes": []},
        "conditions": condition_data,
    }
    value.update(extra)
    return value


class DerivedDataTests(unittest.TestCase):
    def test_health_thresholds_are_explainable(self) -> None:
        low, _ = derived.classify_health(record("low", None, conditions()))
        some, _ = derived.classify_health(
            record("some", None, conditions(class_b=1, total_open=1))
        )
        high, _ = derived.classify_health(
            record("high", None, conditions(class_c=3, total_open=3))
        )
        vacate, _ = derived.classify_health(
            record("vacate", None, conditions(active_orders=1))
        )

        self.assertEqual(low["state"], "low_concern")
        self.assertEqual(low["score"], 0)
        self.assertEqual(some["state"], "some_concerns")
        self.assertEqual(some["factorPoints"]["openClassBViolations"], 1)
        self.assertEqual(high["state"], "higher_concern")
        self.assertEqual(high["factorPoints"]["openClassCViolations"], 4)
        self.assertEqual(vacate["state"], "higher_concern")
        self.assertEqual(vacate["factorPoints"]["activeVacateOrders"], 4)

    def test_required_missing_data_is_not_zero(self) -> None:
        missing = conditions()
        missing["complaints"] = {
            "availability": "lookup_failed",
            "complaintCountLast12Months": None,
        }
        health, summary = derived.classify_health(record("missing", None, missing))

        self.assertEqual(health["state"], "insufficient_data")
        self.assertIsNone(health["score"])
        self.assertIsNone(summary["complaintsLast12Months"])
        self.assertIn(
            "conditions.complaints.complaintCountLast12Months",
            health["unavailableRequiredFields"],
        )

    def test_missing_bedbug_filing_does_not_become_zero_or_block_rating(self) -> None:
        health, summary = derived.classify_health(
            record("no-filing", None, conditions(bedbugs=None))
        )

        self.assertEqual(health["state"], "low_concern")
        self.assertIsNone(health["inputs"]["latestBedbugReportInfestedUnits"])
        self.assertIsNone(summary["latestBedbugReportInfestedUnits"])

    def test_related_records_require_reliable_bbl_and_are_not_merged(self) -> None:
        records = [
            record("one", "1000010001", conditions()),
            record("two", "1000010001", conditions()),
            record(
                "ambiguous-reliable",
                "2000020002",
                conditions(),
                matchStatus="ambiguous",
                matchMetadata={
                    "reasonCodes": ["source_bbl_found_in_official_nyc_data"]
                },
            ),
            record(
                "ambiguous-reliable-two",
                "2000020002",
                conditions(),
                matchStatus="ambiguous",
                matchMetadata={
                    "reasonCodes": ["source_bbl_found_in_official_nyc_data"]
                },
            ),
            record(
                "ambiguous-unreliable",
                "2000020002",
                conditions(),
                matchStatus="ambiguous",
                matchMetadata={"reasonCodes": []},
            ),
        ]
        related, groups, count = derived.build_related_groups(records)

        self.assertEqual(count, 5)
        self.assertEqual(
            groups,
            {
                "1000010001": ("one", "two"),
                "2000020002": (
                    "ambiguous-reliable",
                    "ambiguous-reliable-two",
                ),
            },
        )
        self.assertEqual(related["one"], ("two",))
        self.assertEqual(related["ambiguous-reliable"], ("ambiguous-reliable-two",))
        self.assertNotIn("ambiguous-unreliable", related)

    def test_run_retains_rows_and_writes_required_report(self) -> None:
        records = [
            record("one", "1000010001", conditions()),
            record("two", "1000010001", conditions(class_c=1)),
            record("three", None, conditions(active_orders=1)),
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            source = temp / "source.json"
            output = temp / "output.json"
            report_path = temp / "report.json"
            source.write_text(json.dumps(records), encoding="utf-8")

            report = derived.run(source, output, report_path)
            output_records = json.loads(output.read_text(encoding="utf-8"))
            on_disk_report = json.loads(report_path.read_text(encoding="utf-8"))

        self.assertEqual(len(output_records), len(records))
        self.assertEqual(output_records[0]["relatedRecordIds"], ["two"])
        self.assertEqual(output_records[1]["relatedRecordIds"], ["one"])
        self.assertEqual(report, on_disk_report)
        self.assertEqual(report["totalRecords"], 3)
        self.assertEqual(report["countByHealthState"]["low_concern"], 1)
        self.assertEqual(report["countByHealthState"]["some_concerns"], 1)
        self.assertEqual(report["countByHealthState"]["higher_concern"], 1)
        self.assertEqual(report["recordsWithRelatedRecords"]["count"], 2)
        self.assertEqual(report["insufficientDataCount"], 0)
        self.assertEqual(report["recordsThatCouldNotBeEvaluated"], [])


if __name__ == "__main__":
    unittest.main()
