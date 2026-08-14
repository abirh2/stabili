from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import enrich_nyc_conditions as enrichment  # noqa: E402
from nyc_open_data import FetchResult, Provenance  # noqa: E402


AS_OF = datetime(2026, 8, 14, 12, 0, tzinfo=timezone.utc)
RETRIEVED_AT = "2026-08-14T12:00:00+00:00"


def result(dataset_id: str, records: list[dict]) -> FetchResult:
    return FetchResult(
        records=records,
        provenance=Provenance(
            dataset_id=dataset_id,
            retrieved_at=RETRIEVED_AT,
            query={"$select": "test"},
        ),
    )


class ConditionEnrichmentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.records = [
            {"stabiliId": "one", "hpdBuildingId": "100", "matchStatus": "matched"},
            {
                "stabiliId": "duplicate",
                "hpdBuildingId": "100",
                "matchStatus": "matched",
            },
            {"stabiliId": "two", "hpdBuildingId": "200", "matchStatus": "matched"},
            {"stabiliId": "unmatched", "hpdBuildingId": None, "matchStatus": "unmatched"},
        ]
        self.results = {
            enrichment.HPD_VIOLATIONS_DATASET: result(
                enrichment.HPD_VIOLATIONS_DATASET,
                [
                    {
                        "violationid": "1",
                        "buildingid": "100",
                        "class": "C",
                        "violationstatus": "Open",
                        "novdescription": "Repair the dangerous ceiling.",
                        "inspectiondate": "2026-01-05T00:00:00.000",
                        "novissueddate": "2026-01-07T00:00:00.000",
                        "currentstatus": "VIOLATION OPEN",
                    },
                    {
                        "violationid": "2",
                        "buildingid": "100",
                        "class": "B",
                        "violationstatus": "Close",
                        "novissueddate": "2024-12-01T00:00:00.000",
                        "currentstatus": "VIOLATION CLOSED",
                        "certifieddate": "2025-01-10T00:00:00.000",
                    },
                ],
            ),
            enrichment.HPD_COMPLAINT_PROBLEMS_DATASET: result(
                enrichment.HPD_COMPLAINT_PROBLEMS_DATASET,
                [
                    {
                        "received_date": "2026-02-01T00:00:00.000",
                        "problem_id": "11",
                        "complaint_id": "10",
                        "building_id": "100",
                        "type": "HEAT/HOT WATER",
                        "major_category": "HEAT OR HOT WATER",
                        "minor_category": "NO HEAT",
                        "problem_status": "OPEN",
                        "status_description": "The condition is still open.",
                    },
                    {
                        "received_date": "2025-02-01T00:00:00.000",
                        "problem_id": "12",
                        "complaint_id": "10",
                        "building_id": "100",
                        "type": "PLUMBING",
                        "problem_status": "CLOSE",
                    },
                ],
            ),
            enrichment.BEDBUG_REPORTING_DATASET: result(
                enrichment.BEDBUG_REPORTING_DATASET,
                [
                    {
                        "building_id": "100",
                        "filing_period_start_date": "2024-11-01T00:00:00.000",
                        "filling_period_end_date": "2025-10-31T00:00:00.000",
                        "filing_date": "2026-01-01T00:00:00.000",
                        "of_dwelling_units": "20",
                        "infested_dwelling_unit_count": "0",
                        "eradicated_unit_count": "0",
                        "re_infested_dwelling_unit": "0",
                    },
                    # A later amended filing for the same reporting year wins.
                    {
                        "building_id": "100",
                        "filing_period_start_date": "2024-11-01T00:00:00.000",
                        "filling_period_end_date": "2025-10-31T00:00:00.000",
                        "filing_date": "2026-02-01T00:00:00.000",
                        "of_dwelling_units": "20",
                        "infested_dwelling_unit_count": "2",
                        "eradicated_unit_count": "1",
                        "re_infested_dwelling_unit": "0",
                    },
                    {
                        "building_id": "200",
                        "filing_period_start_date": "2024-11-01T00:00:00.000",
                        "filling_period_end_date": "2025-10-31T00:00:00.000",
                        "filing_date": "2026-02-01T00:00:00.000",
                        "infested_dwelling_unit_count": "0",
                        "eradicated_unit_count": "0",
                        "re_infested_dwelling_unit": "0",
                    },
                ],
            ),
            enrichment.VACATE_REPAIR_ORDERS_DATASET: result(
                enrichment.VACATE_REPAIR_ORDERS_DATASET,
                [
                    {
                        "building_id": "100",
                        "vacate_order_number": "500",
                        "primary_vacate_reason": "Fire Damage",
                        "vacate_type": "Partial",
                        "vacate_effective_date": "2026-03-01T00:00:00.000",
                        "number_of_vacated_units": "2",
                    },
                    {
                        "building_id": "100",
                        "vacate_order_number": "400",
                        "vacate_type": "Entire Building",
                        "vacate_effective_date": "2020-01-01T00:00:00.000",
                        "actual_rescind_date": "2020-02-01T00:00:00.000",
                    },
                    {
                        "building_id": "100",
                        "vacate_order_number": "600",
                        "vacate_type": "Partial",
                        "vacate_effective_date": "2026-08-17T00:00:00.000",
                    },
                ],
            ),
        }

    def run_fixture(self, failures: dict[str, str] | None = None):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            source = temp / "source.json"
            output = temp / "output.json"
            report_path = temp / "report.json"
            source.write_text(json.dumps(self.records), encoding="utf-8")
            report = enrichment.run(
                source,
                output,
                report_path,
                results=self.results,
                failures=failures,
                as_of=AS_OF,
            )
            records = json.loads(output.read_text(encoding="utf-8"))
            report_on_disk = json.loads(report_path.read_text(encoding="utf-8"))
        return records, report, report_on_disk

    def test_current_recent_counts_and_compact_details(self) -> None:
        records, _, _ = self.run_fixture()
        conditions = records[0]["conditions"]
        violations = conditions["violations"]
        complaints = conditions["complaints"]
        orders = conditions["vacateRepairOrders"]

        self.assertEqual(violations["openCount"], 1)
        self.assertEqual(violations["openClassCCount"], 1)
        self.assertEqual(violations["openClassBCount"], 0)
        self.assertEqual(violations["issuedLast12Months"], 1)
        self.assertEqual([row["violationId"] for row in violations["details"]], ["1", "2"])
        self.assertEqual(complaints["complaintCountLast12Months"], 1)
        self.assertEqual(complaints["problemCountLast12Months"], 1)
        self.assertEqual(complaints["complaintCountLast36Months"], 1)
        self.assertEqual(complaints["problemCountLast36Months"], 2)
        self.assertEqual(complaints["openProblemCount"], 1)
        self.assertEqual(orders["activeCount"], 1)
        self.assertEqual(orders["activeDetails"][0]["orderNumber"], "500")
        self.assertEqual(orders["mostRecentHistoricalOrder"]["orderNumber"], "400")
        self.assertIn("sourceUrl", violations["provenance"])

    def test_bedbug_zero_is_distinct_from_no_recent_filing(self) -> None:
        records, report, _ = self.run_fixture()
        first = records[0]["conditions"]["bedbugs"]
        second = records[2]["conditions"]["bedbugs"]

        self.assertEqual(first["availability"], "available")
        self.assertEqual(first["recentHistory"][0]["infestedUnits"], 2)
        self.assertEqual(second["availability"], "available")
        self.assertEqual(second["recentHistory"][0]["infestedUnits"], 0)
        self.assertIn(
            "200",
            report["zeroConfirmedBuildingIds"][enrichment.BEDBUG_REPORTING_DATASET],
        )
        # A building with no recent filing is unavailable, never an inferred zero.
        no_report = enrichment.build_bedbugs([], {}, "available", None)
        self.assertEqual(no_report["availability"], "unavailable")
        self.assertEqual(no_report["recentHistory"], [])

    def test_report_is_unique_building_level_and_tracks_zero_and_unavailable(self) -> None:
        records, report, report_on_disk = self.run_fixture()
        self.assertEqual(len(records), len(self.records))
        self.assertEqual(report, report_on_disk)
        self.assertEqual(report["totalMatchedBuildings"], 2)
        self.assertEqual(report["counts"]["buildingsWithOpenViolations"], 1)
        self.assertEqual(report["counts"]["buildingsWithClassCViolations"], 1)
        self.assertEqual(report["counts"]["buildingsWithRecentComplaints"], 1)
        self.assertEqual(report["counts"]["buildingsWithBedbugReports"], 2)
        self.assertEqual(report["counts"]["buildingsWithActiveVacateOrders"], 1)
        self.assertIn(
            "200",
            report["zeroConfirmedBuildingIds"][enrichment.HPD_VIOLATIONS_DATASET],
        )
        self.assertIn("unmatched", report["recordsWithoutHpdBuildingId"])
        self.assertEqual(
            records[-1]["conditions"]["violations"]["availability"], "unavailable"
        )
        self.assertIsNone(records[-1]["conditions"]["violations"]["openCount"])

    def test_dataset_failure_is_not_conflated_with_zero(self) -> None:
        failed_results = dict(self.results)
        failed_results.pop(enrichment.HPD_COMPLAINT_PROBLEMS_DATASET)
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            source = temp / "source.json"
            source.write_text(json.dumps(self.records), encoding="utf-8")
            report = enrichment.run(
                source,
                temp / "output.json",
                temp / "report.json",
                results=failed_results,
                failures={enrichment.HPD_COMPLAINT_PROBLEMS_DATASET: "timeout"},
                as_of=AS_OF,
            )
            output = json.loads((temp / "output.json").read_text(encoding="utf-8"))

        complaints = output[0]["conditions"]["complaints"]
        self.assertEqual(complaints["availability"], "lookup_failed")
        self.assertIsNone(complaints["problemCountLast12Months"])
        self.assertEqual(
            report["datasetLookupFailedBuildingIds"]
            [enrichment.HPD_COMPLAINT_PROBLEMS_DATASET],
            ["100", "200"],
        )
        self.assertEqual(
            report["coverageByDataset"]
            [enrichment.HPD_COMPLAINT_PROBLEMS_DATASET]["lookupFailedBuildings"],
            2,
        )

    def test_detail_caps_keep_exact_counts(self) -> None:
        rows = [
            {
                "violationid": str(index),
                "buildingid": "100",
                "class": "A",
                "violationstatus": "Open",
                "novissueddate": f"2026-01-{(index % 28) + 1:02d}T00:00:00.000",
            }
            for index in range(enrichment.MAX_OPEN_VIOLATION_DETAILS + 5)
        ]
        built = enrichment.build_violations(rows, "2025-08-14", {}, "available", None)
        self.assertEqual(built["openCount"], enrichment.MAX_OPEN_VIOLATION_DETAILS + 5)
        self.assertEqual(len(built["details"]), enrichment.MAX_OPEN_VIOLATION_DETAILS)
        self.assertTrue(built["detailTruncated"])


if __name__ == "__main__":
    unittest.main()
