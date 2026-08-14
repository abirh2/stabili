from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import enrich_nyc_management as enrichment  # noqa: E402
from nyc_open_data import FetchResult, Provenance  # noqa: E402


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


class ManagementEnrichmentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.results = {
            enrichment.HPD_BUILDINGS_DATASET: result(
                enrichment.HPD_BUILDINGS_DATASET,
                [
                    {
                        "buildingid": "100",
                        "bin": "1000001",
                        "managementprogram": "PVT",
                        "dobbuildingclass": "NEW LAW TENEMENT",
                        "lifecycle": "Building",
                        "recordstatus": "Active",
                    },
                    {"buildingid": "200", "bin": "2000002"},
                ],
            ),
            enrichment.PLUTO_DATASET: result(
                enrichment.PLUTO_DATASET,
                [
                    {
                        "bbl": "1000010001.00000000",
                        "yearbuilt": "1910",
                        "numfloors": "6.00000000",
                        "unitsres": "0",
                        "unitstotal": "24",
                        "bldgclass": "D1",
                        "ownertype": "P",
                    },
                    {"bbl": "2000020002", "unitsres": "12"},
                ],
            ),
            enrichment.HPD_REGISTRATIONS_DATASET: result(
                enrichment.HPD_REGISTRATIONS_DATASET,
                [
                    {
                        "registrationid": "10",
                        "buildingid": "100",
                        "lastregistrationdate": "2024-08-01T00:00:00.000",
                        "registrationenddate": "2025-09-01T00:00:00.000",
                    },
                    {
                        "registrationid": "11",
                        "buildingid": "100",
                        "lastregistrationdate": "2026-07-01T00:00:00.000",
                        "registrationenddate": "2027-09-01T00:00:00.000",
                    },
                    {
                        "registrationid": "20",
                        "buildingid": "200",
                        "lastregistrationdate": "2026-06-01T00:00:00.000",
                        "registrationenddate": "2027-09-01T00:00:00.000",
                    },
                ],
            ),
            enrichment.HPD_CONTACTS_DATASET: result(
                enrichment.HPD_CONTACTS_DATASET,
                [
                    {
                        "registrationcontactid": "1101",
                        "registrationid": "11",
                        "type": "Agent",
                        "corporationname": "Acme Management, LLC",
                        "firstname": "ALICE",
                        "lastname": "AGENT",
                        "businesshousenumber": "10",
                        "businessstreetname": "MAIN STREET",
                        "businesscity": "New York",
                        "businessstate": "NY",
                        "businesszip": "10001",
                    },
                    {
                        "registrationcontactid": "1102",
                        "registrationid": "11",
                        "type": "CorporateOwner",
                        "corporationname": "100 Example Owner LLC",
                    },
                    # Historical registration contacts must not leak into the latest one.
                    {
                        "registrationcontactid": "1001",
                        "registrationid": "10",
                        "type": "Agent",
                        "corporationname": "Former Manager LLC",
                    },
                ],
            ),
        }

    def test_latest_registration_contacts_and_narrow_attributes(self) -> None:
        records = enrichment.enrich_records(
            [
                {
                    "stabiliId": "one",
                    "matchStatus": "matched",
                    "hpdBuildingId": "100",
                    "bin": "1000001",
                    "bbl": "1000010001",
                }
            ],
            hpd_buildings=self.results[enrichment.HPD_BUILDINGS_DATASET].records,
            pluto_rows=self.results[enrichment.PLUTO_DATASET].records,
            registrations=self.results[enrichment.HPD_REGISTRATIONS_DATASET].records,
            contacts=self.results[enrichment.HPD_CONTACTS_DATASET].records,
            retrieved_at={key: RETRIEVED_AT for key in self.results},
        )
        record = records[0]

        self.assertEqual(record["buildingAttributes"]["yearBuilt"], 1910)
        self.assertEqual(record["buildingAttributes"]["stories"], 6)
        self.assertEqual(record["buildingAttributes"]["residentialUnits"], 0)
        self.assertEqual(record["buildingAttributes"]["totalUnits"], 24)
        self.assertEqual(record["hpdRegistration"]["registrationId"], "11")
        self.assertEqual(record["hpdRegistration"]["status"], "current")
        self.assertEqual(
            record["management"]["primaryContact"]["displayName"],
            "Acme Management, LLC",
        )
        self.assertEqual(len(record["management"]["owners"]), 1)
        self.assertTrue(record["management"]["hasUsableBusinessAddress"])
        self.assertIsNone(record["management"]["primaryContact"]["phone"])
        self.assertEqual(
            record["buildingAttributes"]["provenance"][0]["datasetId"],
            enrichment.HPD_BUILDINGS_DATASET,
        )

    def test_unknown_values_remain_null_while_source_zero_is_preserved(self) -> None:
        self.assertEqual(enrichment.clean_integer("0"), 0)
        self.assertEqual(enrichment.clean_number("0.0"), 0)
        self.assertIsNone(enrichment.clean_integer(None))
        self.assertIsNone(enrichment.clean_number(""))
        self.assertIsNone(enrichment.source_value("NOT AVAILABLE"))

    def test_report_is_unique_building_level_and_flags_unresolved_registration(self) -> None:
        matches = [
            {
                "stabiliId": "one",
                "matchStatus": "matched",
                "hpdBuildingId": "100",
                "bbl": "1000010001",
            },
            {
                "stabiliId": "duplicate-source-row",
                "matchStatus": "matched",
                "hpdBuildingId": "100",
                "bbl": "1000010001",
            },
            {
                "stabiliId": "two",
                "matchStatus": "matched",
                "hpdBuildingId": "200",
                "bbl": "2000020002",
            },
            {
                "stabiliId": "unmatched",
                "matchStatus": "unmatched",
                "hpdBuildingId": None,
                "bbl": None,
            },
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            input_path = temp / "matches.json"
            input_path.write_text(json.dumps(matches), encoding="utf-8")
            report = enrichment.run(
                input_path,
                temp / "enriched.json",
                temp / "report.json",
                results=self.results,
            )
            output = json.loads((temp / "enriched.json").read_text(encoding="utf-8"))

        self.assertEqual(len(output), len(matches))
        self.assertEqual(report["totalMatchedBuildings"], 2)
        self.assertEqual(report["counts"]["buildingsWithManagingAgents"], 1)
        self.assertEqual(report["counts"]["buildingsWithOwners"], 1)
        self.assertEqual(report["counts"]["buildingsMissingManagementInformation"], 1)
        self.assertEqual(report["percentages"]["latestRegistrationCoverage"], 100.0)
        self.assertEqual(report["unresolvedRegistrationIds"], ["20"])
        self.assertIsNone(output[-1]["hpdRegistration"]["registrationId"])
        self.assertEqual(
            output[-1]["hpdRegistration"]["provenance"]["datasetId"],
            enrichment.HPD_REGISTRATIONS_DATASET,
        )
        self.assertEqual(output[-1]["management"]["managingAgents"], [])
        self.assertEqual(
            output[-1]["management"]["provenance"]["datasetId"],
            enrichment.HPD_CONTACTS_DATASET,
        )

    def test_name_normalization_is_conservative_and_reports_shared_names(self) -> None:
        self.assertEqual(
            enrichment.normalize_management_name("Acme Management, LLC"),
            enrichment.normalize_management_name("ACME MANAGEMENT LLC."),
        )
        self.assertNotEqual(
            enrichment.normalize_management_name("Acme Management LLC"),
            enrichment.normalize_management_name("Acme Management Inc"),
        )
        base_contact = {
            "registrationContactId": "1",
            "officialType": "Agent",
            "role": "managingAgent",
            "displayName": "Acme Management, LLC",
            "normalizedName": "ACME MANAGEMENT LLC",
            "businessAddress": None,
        }
        records = []
        for building_id, display_name in (("100", "Acme Management, LLC"), ("200", "ACME MANAGEMENT LLC.")):
            contact = dict(base_contact, displayName=display_name)
            records.append(
                {
                    "hpdBuildingId": building_id,
                    "hpdRegistration": {"registrationId": building_id},
                    "management": {
                        "managingAgents": [contact],
                        "owners": [],
                        "responsibleParties": [],
                        "hasUsableBusinessAddress": False,
                    },
                }
            )

        report = enrichment.build_report(records)

        duplicate = report["duplicatedManagementNamesByNormalizedForm"][0]
        self.assertEqual(duplicate["normalizedName"], "ACME MANAGEMENT LLC")
        self.assertEqual(duplicate["buildingCount"], 2)
        self.assertEqual(len(duplicate["observedNames"]), 2)


if __name__ == "__main__":
    unittest.main()
