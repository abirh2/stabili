from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import normalize_dhcr  # noqa: E402


class DhcrNormalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        raw_path = REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_raw.json"
        cls.raw_records = json.loads(raw_path.read_text(encoding="utf-8"))
        cls.by_id = {record["sourceRecordId"]: record for record in cls.raw_records}

    def normalized(self, source_record_id: str) -> dict:
        return normalize_dhcr.normalize_record(self.by_id[source_record_id])

    def test_brooklyn_square_and_bbl_use_real_pdf_row(self) -> None:
        record = self.normalized("brooklyn-2024-p1-r1")
        self.assertEqual(record["displayAddress"], "436 Albee Square, Brooklyn, NY 11201")
        self.assertEqual(record["parcel"]["bbl"], "3001467501")
        self.assertEqual(record["parcel"]["parcelKey"], "3-00146-7501")

    def test_bronx_range_and_alternate_address_use_real_pdf_row(self) -> None:
        record = self.normalized("bronx-2024-p1-r3")
        house = record["primaryAddress"]["houseNumber"]
        self.assertEqual((house["type"], house["normalized"]), ("range", "2455–2457"))
        self.assertEqual(
            record["alternateAddresses"][0]["displayAddress"],
            "240 East 135th Street, Bronx, NY 10451",
        )
        self.assertEqual(record["classifications"][1], "421-A (16)")

    def test_manhattan_ordinal_and_avenue_use_real_pdf_row(self) -> None:
        record = self.normalized("manhattan-2024-p1-r1")
        self.assertEqual(record["displayAddress"], "246 10th Avenue, Manhattan, NY 10001")
        self.assertEqual(record["parcel"]["boroughCode"], "1")

    def test_queens_hyphen_is_not_misread_as_range(self) -> None:
        record = self.normalized("queens-2024-p1-r3")
        house = record["primaryAddress"]["houseNumber"]
        self.assertEqual(house["type"], "hyphenated")
        self.assertEqual(house["normalized"], "73-21")
        self.assertIsNone(house["rangeStart"])
        self.assertEqual(
            record["classifications"],
            ["Multiple Dwelling A", "Garden Complex", "Non-Evict Co-op/Condo"],
        )

    def test_queens_range_keeps_hyphens_in_both_endpoints(self) -> None:
        record = self.normalized("queens-2024-p1-r1")
        house = record["primaryAddress"]["houseNumber"]
        self.assertEqual(house["type"], "range")
        self.assertEqual(house["normalized"], "87-15–87-45")
        self.assertEqual((house["rangeStart"], house["rangeEnd"]), ("87-15", "87-45"))

    def test_staten_island_range_and_road_use_real_pdf_row(self) -> None:
        record = self.normalized("staten-island-2024-p1-r1")
        self.assertEqual(record["displayAddress"], "6–14 Arlo Road, Staten Island, NY 10301")
        self.assertEqual(record["parcel"]["bbl"], "5005950015")

    def test_raw_status_values_are_preserved_exactly(self) -> None:
        source = self.by_id["queens-2024-p1-r3"]
        normalized = self.normalized(source["sourceRecordId"])
        self.assertEqual(
            normalized["sourceMetadata"]["rawStatusValues"],
            {field: source[field] for field in ("status1", "status2", "status3")},
        )

    def test_stabili_id_is_source_based_and_stable_across_ordering(self) -> None:
        source = self.by_id["bronx-2024-p1-r3"]
        first = normalize_dhcr.stable_stabili_id(source)
        reordered = dict(reversed(list(source.items())))
        self.assertEqual(first, normalize_dhcr.stable_stabili_id(reordered))
        self.assertTrue(first.startswith("stabili-"))

    def test_full_run_retains_every_row_and_reports_shared_parcels(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            report = normalize_dhcr.run(
                REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_raw.json",
                temp / "normalized.json",
                temp / "report.json",
            )
            normalized = json.loads((temp / "normalized.json").read_text(encoding="utf-8"))
        totals = report["totals"]
        self.assertEqual(len(normalized), len(self.raw_records))
        self.assertEqual(totals["totalNormalizedRecords"], len(self.raw_records))
        self.assertEqual(totals["normalizationFailures"], 0)
        self.assertGreater(totals["recordsSharingParcelKey"], 0)
        self.assertEqual(totals["duplicateStabiliIds"], 0)


if __name__ == "__main__":
    unittest.main()
