from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import export_stabili_data as exporter  # noqa: E402


def normalized(identifier: str = "stabili-one") -> dict:
    return {
        "id": identifier,
        "sourceRecordId": "bronx-2024-p1-r1",
        "primaryAddress": {"addressLine": "10 Main Street", "borough": "Bronx", "zip": "10451"},
        "alternateAddresses": [],
        "classifications": ["Multiple Dwelling A"],
        "parcel": {"block": "1", "lot": "2"},
        "sourceMetadata": {
            "agency": "NYS Homes and Community Renewal",
            "dataset": "2024 Building Registration File",
            "sourceYear": 2024,
            "sourceFile": "bronx.pdf",
            "sourcePage": 1,
            "sourceRow": 1,
        },
    }


def derived(identifier: str = "stabili-one") -> dict:
    return {
        "stabiliId": identifier,
        "matchStatus": "matched",
        "bbl": "2000010002",
        "bin": None,
        "hpdBuildingId": "123",
        "latitude": 40.8,
        "longitude": -73.9,
        "buildingAttributes": {
            "yearBuilt": None,
            "stories": None,
            "residentialUnits": None,
            "totalUnits": None,
            "buildingClass": None,
            "ownershipType": None,
            "provenance": [{"datasetId": "kj4p-ruqc", "retrievedAt": "2026-08-14T12:00:00+00:00"}],
        },
        "management": None,
        "conditions": {
            "violations": {"availability": "lookup_failed"},
            "complaints": {"availability": "available", "complaintCountLast36Months": 0, "openProblemCount": 0, "recentDetails": []},
            "bedbugs": {"availability": "unavailable"},
            "vacateRepairOrders": {"availability": "available", "activeCount": 0, "activeDetails": []},
        },
        "health": {"state": "insufficient_data", "algorithmVersion": "building-health-v1.0.0", "evaluatedAsOf": "2026-08-14"},
        "relatedRecordIds": [],
    }


class ExportTests(unittest.TestCase):
    def test_unknown_counts_remain_null_and_diagnostics_are_removed(self) -> None:
        value = exporter.production_record(
            {**derived(), "matchMetadata": {"reasonCodes": ["internal"]}},
            normalized(),
            "2026-08-14T20:00:00Z",
        )
        self.assertIsNone(value["building"]["yearBuilt"])
        self.assertIsNone(value["violations"]["openCount"])
        self.assertIsNone(value["violations"]["details"])
        self.assertIsNone(value["propertyMatch"]["method"])
        self.assertNotIn("matchMetadata", json.dumps(value))
        exporter.validate_record(value, {"stabili-one"})

    def test_export_writes_compact_validated_artifacts_and_report(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "derived.json"
            normalized_path = root / "normalized.json"
            output = root / "public" / "data"
            report = root / "reports" / "export.json"
            source.write_text(json.dumps([derived()]), encoding="utf-8")
            normalized_path.write_text(json.dumps([normalized()]), encoding="utf-8")
            result = exporter.export(source, normalized_path, output, report)
            metadata = json.loads((output / "metadata.json").read_text())
            index = json.loads((output / "index.json").read_text())
            detailed = json.loads((output / index[0]["detailFile"]).read_text())
            self.assertEqual(metadata["recordCounts"]["total"], 1)
            self.assertEqual(metadata["recordCounts"]["byBorough"]["bronx"], 1)
            self.assertEqual(index[0]["detailFile"], "buildings/bronx.json")
            self.assertEqual(detailed[0]["id"], "stabili-one")
            self.assertEqual(result, json.loads(report.read_text()))
            self.assertGreater(result["totalProductionDataBytes"], 0)

    def test_mock_contact_content_is_rejected(self) -> None:
        value = exporter.production_record(derived(), normalized(), "2026-08-14T20:00:00Z")
        value["management"] = {
            "managingAgentName": "Example Agent", "managingAgentId": "1",
            "registeredOwnerName": None, "businessAddress": None,
            "phone": "212-555-0100", "email": None, "website": None,
        }
        with self.assertRaisesRegex(ValueError, "mock/sample"):
            exporter.validate_record(value, {"stabili-one"})


if __name__ == "__main__":
    unittest.main()
