from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

import pdfplumber


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts" / "data"))
import extract_dhcr  # noqa: E402
import match_properties  # noqa: E402
import normalize_dhcr  # noqa: E402


class PropertyMatchingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        rows = []
        source_directory = REPOSITORY_ROOT / "data" / "source" / "dhcr"
        for filename in (
            "2024-DHCR-Bldg-File-Bronx.pdf",
            "2024-DHCR-Bldg-File-Brooklyn.pdf",
            "2024-DHCR-Bldg-File-Queens.pdf",
        ):
            source_path = source_directory / filename
            with pdfplumber.open(source_path) as pdf:
                raw_records, rejected = extract_dhcr.extract_page_rows(
                    pdf.pages[0],
                    source_filename=source_path.name,
                    page_number=1,
                )
            if rejected:
                raise AssertionError(f"Unexpected rejected rows in {source_path.name}: {rejected}")
            rows.extend(normalize_dhcr.normalize_record(record) for record in raw_records)
        cls.by_id = {row["sourceRecordId"]: row for row in rows}

    @staticmethod
    def hpd(
        building_id: str,
        *,
        block: str,
        lot: str,
        house: str,
        street: str,
        zip_code: str = "10451",
        bin_value: str | None = None,
        borough: str = "2",
    ) -> dict:
        return {
            "buildingid": building_id,
            "boroid": borough,
            "boro": "BRONX",
            "housenumber": house,
            "lowhousenumber": house,
            "highhousenumber": house,
            "streetname": street,
            "zip": zip_code,
            "block": block,
            "lot": lot,
            "bin": bin_value or f"{borough}123456",
        }

    @staticmethod
    def pluto(
        bbl: str,
        address: str,
        *,
        zip_code: str = "10451",
        latitude: str = "40.8201",
        longitude: str = "-73.9201",
    ) -> dict:
        return {
            "bbl": f"{bbl}.00000000",
            "address": address,
            "borocode": bbl[0],
            "block": str(int(bbl[1:6])),
            "lot": str(int(bbl[6:])),
            "zipcode": zip_code,
            "latitude": latitude,
            "longitude": longitude,
        }

    def test_condo_parcel_uses_addresses_to_select_distinct_buildings(self) -> None:
        records = [
            self.by_id["bronx-2024-p1-r18"],
            self.by_id["bronx-2024-p1-r19"],
        ]
        hpd_rows = [
            self.hpd(
                "7007",
                block="2458",
                lot="7501",
                house="707",
                street="CONCOURSE VILLAGE WEST",
                bin_value="2011111",
            ),
            self.hpd(
                "7047",
                block="2458",
                lot="7501",
                house="747",
                street="CONCOURSE VILLAGE WEST",
                bin_value="2022222",
            ),
        ]
        matcher = match_properties.PropertyMatcher(
            hpd_rows, [self.pluto("2024587501", "707 CONCOURSE VILLAGE WEST")]
        )

        matches = [matcher.match(record) for record in records]

        self.assertEqual([row["matchStatus"] for row in matches], ["matched", "matched"])
        self.assertEqual([row["hpdBuildingId"] for row in matches], ["7007", "7047"])
        self.assertEqual([row["sourceRecordId"] for row in matches], [
            "bronx-2024-p1-r18",
            "bronx-2024-p1-r19",
        ])

    def test_garden_complex_range_stays_ambiguous_across_two_buildings(self) -> None:
        record = self.by_id["bronx-2024-p1-r20"]
        hpd_rows = [
            self.hpd("4770", block="2329", lot="87", house="477", street="COURTLANDT AVENUE"),
            self.hpd("4790", block="2329", lot="87", house="479", street="COURTLANDT AVENUE"),
        ]
        matcher = match_properties.PropertyMatcher(
            hpd_rows, [self.pluto("2023290087", "477-479 COURTLANDT AVENUE")]
        )

        match = matcher.match(record)

        self.assertEqual(match["matchStatus"], "ambiguous")
        self.assertEqual(match["matchMethod"], "manual_review")
        self.assertEqual(match["bbl"], "2023290087")
        self.assertIsNone(match["bin"])
        self.assertIsNone(match["hpdBuildingId"])
        self.assertEqual(
            match["matchMetadata"]["candidateHpdBuildingIds"], ["4770", "4790"]
        )

    def test_alternate_address_can_disambiguate_a_multi_building_parcel(self) -> None:
        record = self.by_id["bronx-2024-p1-r3"]
        hpd_rows = [
            self.hpd(
                "135240",
                block="2319",
                lot="38",
                house="240",
                street="EAST 135 STREET",
            ),
            self.hpd(
                "999999",
                block="2319",
                lot="38",
                house="999",
                street="OTHER STREET",
            ),
        ]
        matcher = match_properties.PropertyMatcher(
            hpd_rows, [self.pluto("2023190038", "2455-2457 THIRD AVENUE")]
        )

        match = matcher.match(record)

        self.assertEqual(match["matchStatus"], "matched")
        self.assertEqual(match["hpdBuildingId"], "135240")
        self.assertEqual(
            match["matchMetadata"]["addressValidation"], "alternate_address"
        )

    def test_queens_hyphenated_address_validates_without_becoming_a_range(self) -> None:
        record = self.by_id["queens-2024-p1-r3"]
        hpd_row = self.hpd(
            "844601",
            borough="4",
            block="8446",
            lot="1",
            house="73-21",
            street="260 STREET",
            zip_code="11004",
            bin_value="4123456",
        )
        matcher = match_properties.PropertyMatcher(
            [hpd_row],
            [
                self.pluto(
                    "4084460001",
                    "73-21 260 STREET",
                    zip_code="11004",
                    latitude="40.7401",
                    longitude="-73.7101",
                )
            ],
        )

        match = matcher.match(record)

        self.assertEqual(match["matchStatus"], "matched")
        self.assertEqual(match["bin"], "4123456")
        self.assertEqual(
            match["matchMetadata"]["addressValidation"], "primary_address"
        )

    def test_unique_primary_address_is_a_fallback_when_source_bbl_is_not_found(self) -> None:
        record = dict(self.by_id["brooklyn-2024-p1-r1"])
        hpd_row = self.hpd(
            "436146",
            borough="3",
            block="146",
            lot="1",
            house="436",
            street="ALBEE SQUARE",
            zip_code="11201",
            bin_value="3123456",
        )
        matcher = match_properties.PropertyMatcher(
            [hpd_row], [self.pluto("3001460001", "436 ALBEE SQUARE", zip_code="11201")]
        )

        match = matcher.match(record)

        self.assertEqual(match["matchStatus"], "matched")
        self.assertEqual(match["matchMethod"], "primary_address")
        self.assertEqual(match["bbl"], "3001460001")

    def test_run_retains_rows_and_writes_manual_review_csv(self) -> None:
        records = [
            self.by_id["bronx-2024-p1-r20"],
            self.by_id["queens-2024-p1-r3"],
        ]
        hpd_rows = [
            self.hpd("4770", block="2329", lot="87", house="477", street="COURTLANDT AVENUE"),
            self.hpd("4790", block="2329", lot="87", house="479", street="COURTLANDT AVENUE"),
        ]
        pluto_rows = [self.pluto("2023290087", "477-479 COURTLANDT AVENUE")]
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            input_path = temp / "normalized.json"
            input_path.write_text(json.dumps(records), encoding="utf-8")
            report = match_properties.run(
                input_path,
                temp / "matches.json",
                temp / "report.json",
                temp / "review.csv",
                hpd_rows=hpd_rows,
                pluto_rows=pluto_rows,
            )
            matches = json.loads((temp / "matches.json").read_text(encoding="utf-8"))
            with (temp / "review.csv").open(encoding="utf-8", newline="") as handle:
                review_rows = list(csv.DictReader(handle))

        self.assertEqual(len(matches), len(records))
        self.assertEqual(report["totals"]["totalRecords"], len(records))
        self.assertEqual(report["totals"]["ambiguous"], 1)
        self.assertEqual(report["totals"]["unmatched"], 1)
        self.assertEqual(len(review_rows), 2)


if __name__ == "__main__":
    unittest.main()
