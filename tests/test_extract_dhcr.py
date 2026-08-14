from __future__ import annotations

import sys
import unittest
from pathlib import Path

import pdfplumber


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import extract_dhcr  # noqa: E402


def first_page_rows(filename: str) -> list[dict]:
    path = REPOSITORY_ROOT / "data" / "source" / "dhcr" / filename
    with pdfplumber.open(path) as pdf:
        records, rejected = extract_dhcr.extract_page_rows(
            pdf.pages[0], source_filename=filename, page_number=1
        )
    if rejected:
        raise AssertionError(f"Unexpected rejected rows: {rejected}")
    return records


class DhcrExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bronx = first_page_rows("2024-DHCR-Bldg-File-Bronx.pdf")
        cls.brooklyn = first_page_rows("2024-DHCR-Bldg-File-Brooklyn.pdf")
        cls.queens = first_page_rows("2024-DHCR-Bldg-File-Queens.pdf")
        cls.staten_island = first_page_rows(
            "2024-DHCR-Bldg-File-Staten-Island.pdf"
        )

    def test_normal_single_address_uses_real_brooklyn_row(self) -> None:
        record = self.brooklyn[0]
        self.assertEqual(record["sourceRecordId"], "brooklyn-2024-p1-r1")
        self.assertEqual(
            (record["zip"], record["bldgNo1"], record["street1"], record["streetSuffix1"]),
            ("11201", "436", "ALBEE", "SQ"),
        )

    def test_address_range_uses_real_staten_island_row(self) -> None:
        record = self.staten_island[0]
        self.assertEqual(record["bldgNo1"], "6 TO 14")
        self.assertEqual(record["street1"], "ARLO")
        self.assertTrue(extract_dhcr.has_address_range(record))

    def test_alternate_address_uses_real_bronx_row(self) -> None:
        record = self.bronx[2]
        self.assertEqual(
            (record["bldgNo2"], record["street2"], record["streetSuffix2"]),
            ("240", "E 135TH", "ST"),
        )
        self.assertTrue(extract_dhcr.has_alternate_address(record))

    def test_garden_complex_uses_real_source_classification(self) -> None:
        record = self.staten_island[0]
        self.assertEqual(record["status1"], "MULTIPLE DWELLING A")
        self.assertEqual(record["status2"], "GARDEN COMPLEX")

    def test_multiple_statuses_survive_touching_column_text(self) -> None:
        record = self.queens[1]
        self.assertEqual(record["status1"], "MULTIPLE DWELLING A")
        self.assertEqual(record["status2"], "GARDEN COMPLEX")
        self.assertEqual(record["status3"], "NON-EVICT COOP/CONDO")
        self.assertEqual(record["block"], "8443")

    def test_blank_optional_fields_are_null(self) -> None:
        record = self.brooklyn[1]
        for field in ("bldgNo2", "street2", "streetSuffix2", "status2", "status3"):
            self.assertIsNone(record[field])


if __name__ == "__main__":
    unittest.main()
