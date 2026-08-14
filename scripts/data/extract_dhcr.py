#!/usr/bin/env python3
"""Extract DHCR rent-stabilized building PDF rows without normalizing them."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence

try:
    import pdfplumber
except ImportError as exc:  # pragma: no cover - exercised only without dependencies
    raise SystemExit(
        "pdfplumber is required. Install it with "
        "`python3 -m pip install -r scripts/data/requirements.txt`."
    ) from exc


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_DIR = REPOSITORY_ROOT / "data" / "source" / "dhcr"
DEFAULT_OUTPUT_PATH = REPOSITORY_ROOT / "data" / "intermediate" / "dhcr_raw.json"
DEFAULT_REPORT_PATH = (
    REPOSITORY_ROOT / "data" / "reports" / "dhcr-extraction-report.json"
)

EXPECTED_FILES = (
    "2024-DHCR-Bldg-File-Bronx.pdf",
    "2024-DHCR-Bldg-File-Brooklyn.pdf",
    "2024-DHCR-Bldg-File-Manhattan.pdf",
    "2024-DHCR-Bldg-File-Queens.pdf",
    "2024-DHCR-Bldg-File-Staten-Island.pdf",
)

# These are the observed left edges of the fixed-width data fields in all five
# official 2024 PDFs. Slicing characters at the next field's left edge avoids
# losing boundaries when long values visually touch (for example STATUS3/BLOCK).
@dataclass(frozen=True)
class Column:
    source_name: str
    output_name: str
    x_start: float


COLUMNS = (
    Column("ZIP", "zip", 15.84),
    Column("BLDGNO1", "bldgNo1", 41.04),
    Column("STREET1", "street1", 105.84),
    Column("STSUFX1", "streetSuffix1", 192.24),
    Column("BLDGNO2", "bldgNo2", 234.00),
    Column("STREET2", "street2", 276.48),
    Column("STSUFX2", "streetSuffix2", 344.16),
    Column("CITY", "city", 382.32),
    Column("COUNTY", "county", 459.36),
    Column("STATUS1", "status1", 486.72),
    Column("STATUS2", "status2", 558.72),
    Column("STATUS3", "status3", 640.80),
    Column("BLOCK", "block", 717.84),
    Column("LOT", "lot", 752.40),
)

BOROUGH_BY_FILENAME = {
    filename: filename.removeprefix("2024-DHCR-Bldg-File-")
    .removesuffix(".pdf")
    .replace("-", " ")
    for filename in EXPECTED_FILES
}
BOROUGH_SLUGS = {
    borough: borough.lower().replace(" ", "-")
    for borough in BOROUGH_BY_FILENAME.values()
}
ZIP_PATTERN = re.compile(r"\d{5}")
YEAR_PATTERN = re.compile(r"^(\d{4})-")
ADDRESS_RANGE_PATTERN = re.compile(r"\bTO\b", re.IGNORECASE)
ROW_TOP_TOLERANCE = 0.5
COLUMN_TOLERANCE = 0.25


def compact_whitespace(value: str) -> str | None:
    """Remove PDF layout whitespace while preserving the source wording."""

    compacted = re.sub(r"\s+", " ", value).strip()
    return compacted or None


def group_chars_into_lines(chars: Iterable[dict[str, Any]]) -> list[tuple[float, list]]:
    """Group characters by their baseline-like top coordinate."""

    groups: list[tuple[float, list[dict[str, Any]]]] = []
    for char in sorted(chars, key=lambda item: (float(item["top"]), float(item["x0"]))):
        top = float(char["top"])
        for group_top, group_chars in groups:
            if abs(group_top - top) <= ROW_TOP_TOLERANCE:
                group_chars.append(char)
                break
        else:
            groups.append((top, [char]))
    return groups


def line_text(chars: Sequence[dict[str, Any]]) -> str:
    return "".join(
        str(char["text"]) for char in sorted(chars, key=lambda item: float(item["x0"]))
    ).strip()


def extract_columns(
    chars: Sequence[dict[str, Any]],
    page_width: float,
    columns: Sequence[Column] = COLUMNS,
) -> dict[str, str | None]:
    """Slice one rendered line at the PDF's fixed data-column coordinates."""

    ordered = sorted(chars, key=lambda item: float(item["x0"]))
    values: dict[str, str | None] = {}
    for index, column in enumerate(columns):
        x_end = columns[index + 1].x_start if index + 1 < len(columns) else page_width
        text = "".join(
            str(char["text"])
            for char in ordered
            if column.x_start - COLUMN_TOLERANCE
            <= float(char["x0"])
            < x_end - COLUMN_TOLERANCE
        )
        values[column.output_name] = compact_whitespace(text)
    return values


def columns_from_header(chars: Sequence[dict[str, Any]]) -> tuple[Column, ...]:
    """Read the field left edges from a page header.

    Four PDFs share exactly the same geometry. The Brooklyn PDF has slightly
    shifted columns, so deriving these positions per page is safer than assuming
    that all official borough exports were produced with identical settings.
    """

    nonspace_chars = [
        char
        for char in sorted(chars, key=lambda item: float(item["x0"]))
        if not str(char["text"]).isspace()
    ]
    header_text = "".join(str(char["text"]) for char in nonspace_chars)
    columns: list[Column] = []
    search_start = 0
    for expected in COLUMNS:
        index = header_text.find(expected.source_name, search_start)
        if index < 0:
            raise ValueError(f"Missing {expected.source_name} in table header")
        columns.append(
            Column(
                expected.source_name,
                expected.output_name,
                float(nonspace_chars[index]["x0"]),
            )
        )
        search_start = index + len(expected.source_name)
    return tuple(columns)


def source_identity(filename: str) -> tuple[str, str, str]:
    try:
        borough = BOROUGH_BY_FILENAME[filename]
    except KeyError as exc:
        raise ValueError(f"Unexpected DHCR source filename: {filename}") from exc
    year_match = YEAR_PATTERN.match(filename)
    if year_match is None:
        raise ValueError(f"Source filename has no four-digit year: {filename}")
    return borough, BOROUGH_SLUGS[borough], year_match.group(1)


def extract_page_rows(
    page: Any,
    *,
    source_filename: str,
    page_number: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Extract data lines from one page and retain any uncertain line for review."""

    borough, borough_slug, year = source_identity(source_filename)
    lines = group_chars_into_lines(page.chars)
    header_line = next(
        (
            (top, chars)
            for top, chars in lines
            if "ZIP" in line_text(chars) and "BLDGNO1" in line_text(chars)
        ),
        None,
    )
    footer_top = next(
        (top for top, chars in lines if line_text(chars).startswith("Source:")),
        None,
    )
    if header_line is None or footer_top is None:
        raise ValueError(
            f"Could not locate table bounds in {source_filename} page {page_number}"
        )
    header_top, header_chars = header_line
    page_columns = columns_from_header(header_chars)

    records: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    candidate_lines = [
        (top, chars)
        for top, chars in lines
        if header_top + 1 < top < footer_top - 1 and line_text(chars)
    ]
    for candidate_index, (top, chars) in enumerate(candidate_lines, start=1):
        values = extract_columns(chars, float(page.width), page_columns)
        original_text = line_text(chars)
        if values["zip"] is None or ZIP_PATTERN.fullmatch(values["zip"]) is None:
            rejected.append(
                {
                    "sourceBorough": borough,
                    "sourceFile": source_filename,
                    "sourcePage": page_number,
                    "sourceRowIndex": candidate_index,
                    "pageTop": round(top, 3),
                    "reason": "ZIP column was not a five-digit ZIP code",
                    "originalExtractedText": original_text,
                    "extractedColumns": values,
                }
            )
            continue

        source_record_id = (
            f"{borough_slug}-{year}-p{page_number}-r{candidate_index}"
        )
        records.append(
            {
                "sourceRecordId": source_record_id,
                "sourceBorough": borough,
                "sourceFile": source_filename,
                "sourcePage": page_number,
                "sourceRowIndex": candidate_index,
                **values,
            }
        )
    return records, rejected


def extract_pdf(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    records: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    with pdfplumber.open(path) as pdf:
        page_count = len(pdf.pages)
        for page_number in range(1, page_count + 1):
            page = pdf.pages[page_number - 1]
            page_records, page_rejected = extract_page_rows(
                page,
                source_filename=path.name,
                page_number=page_number,
            )
            records.extend(page_records)
            rejected.extend(page_rejected)
            page.close()
    return records, rejected, page_count


def duplicate_ids(records: Sequence[dict[str, Any]]) -> list[str]:
    counts = Counter(record["sourceRecordId"] for record in records)
    return sorted(record_id for record_id, count in counts.items() if count > 1)


def has_alternate_address(record: dict[str, Any]) -> bool:
    return any(record[field] is not None for field in ("bldgNo2", "street2", "streetSuffix2"))


def has_address_range(record: dict[str, Any]) -> bool:
    return any(
        value is not None and ADDRESS_RANGE_PATTERN.search(value) is not None
        for value in (record["bldgNo1"], record["bldgNo2"])
    )


def report_metrics(
    filename: str,
    records: Sequence[dict[str, Any]],
    rejected: Sequence[dict[str, Any]],
    pages_processed: int,
) -> dict[str, Any]:
    duplicates = duplicate_ids(records)
    return {
        "pdfFilename": filename,
        "pagesProcessed": pages_processed,
        "recordsExtracted": len(records),
        "rowsRejected": len(rejected),
        "duplicateRawSourceIds": len(duplicates),
        "duplicateRawSourceIdValues": duplicates,
        "recordsMissingBlock": sum(record["block"] is None for record in records),
        "recordsMissingLot": sum(record["lot"] is None for record in records),
        "recordsWithAlternateAddresses": sum(
            has_alternate_address(record) for record in records
        ),
        "recordsWithAddressRanges": sum(has_address_range(record) for record in records),
    }


def validate_source_files(source_dir: Path) -> list[Path]:
    paths = [source_dir / filename for filename in EXPECTED_FILES]
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing expected DHCR PDFs: {', '.join(missing)}")
    unexpected = sorted(path.name for path in source_dir.glob("*.pdf") if path.name not in EXPECTED_FILES)
    if unexpected:
        raise ValueError(f"Unexpected PDF files in {source_dir}: {', '.join(unexpected)}")
    return paths


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(source_dir: Path, output_path: Path, report_path: Path) -> dict[str, Any]:
    all_records: list[dict[str, Any]] = []
    all_rejected: list[dict[str, Any]] = []
    borough_reports: dict[str, dict[str, Any]] = {}

    for path in validate_source_files(source_dir):
        borough, _, _ = source_identity(path.name)
        records, rejected, page_count = extract_pdf(path)
        all_records.extend(records)
        all_rejected.extend(rejected)
        borough_reports[borough] = report_metrics(
            path.name, records, rejected, page_count
        )
        print(
            f"{borough}: {len(records):,} records, "
            f"{len(rejected):,} rejected/needs review",
            file=sys.stderr,
        )

    all_duplicate_ids = duplicate_ids(all_records)
    report = {
        "source": "NYS Homes and Community Renewal 2024 Building Registration File",
        "recordSemantics": "One output record per source PDF table row; no merging or deduplication applied.",
        "sourceColumns": [column.source_name for column in COLUMNS],
        "boroughs": borough_reports,
        "totals": {
            "pdfFilesProcessed": len(EXPECTED_FILES),
            "pagesProcessed": sum(
                metrics["pagesProcessed"] for metrics in borough_reports.values()
            ),
            "recordsExtracted": len(all_records),
            "rowsRejected": len(all_rejected),
            "duplicateRawSourceIds": len(all_duplicate_ids),
            "recordsMissingBlock": sum(
                metrics["recordsMissingBlock"] for metrics in borough_reports.values()
            ),
            "recordsMissingLot": sum(
                metrics["recordsMissingLot"] for metrics in borough_reports.values()
            ),
            "recordsWithAlternateAddresses": sum(
                metrics["recordsWithAlternateAddresses"]
                for metrics in borough_reports.values()
            ),
            "recordsWithAddressRanges": sum(
                metrics["recordsWithAddressRanges"]
                for metrics in borough_reports.values()
            ),
        },
        "duplicateRawSourceIdValues": all_duplicate_ids,
        "rejectedNeedsReview": all_rejected,
    }
    write_json(output_path, all_records)
    write_json(report_path, report)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract one raw record per row from the five 2024 DHCR PDFs."
    )
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = run(args.source_dir, args.output, args.report)
    except (FileNotFoundError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    totals = report["totals"]
    print(
        f"Extracted {totals['recordsExtracted']:,} records from "
        f"{totals['pagesProcessed']:,} pages; "
        f"{totals['rowsRejected']:,} rows need review."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
