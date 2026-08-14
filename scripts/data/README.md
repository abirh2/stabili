# DHCR data pipeline

## Raw extraction

This stage reads the five official 2024 borough PDFs in `data/source/dhcr/`
and emits one raw JSON object for every PDF table row. It intentionally does
not normalize, merge, deduplicate, or match records to another data source.

The PDFs contain embedded text in a consistent fixed-column layout, so the
extractor uses `pdfplumber` character coordinates rather than OCR. The only
Python dependency is pinned in `scripts/data/requirements.txt`.

From the repository root:

```bash
python3 -m pip install -r scripts/data/requirements.txt
python3 scripts/data/extract_dhcr.py
```

Outputs:

- `data/intermediate/dhcr_raw.json` (reproducible working data, gitignored)
- `data/reports/dhcr-extraction-report.json` (committed validation summary)

Run the extraction tests with:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

## Normalization

The normalization stage reads the raw JSON without changing or rerunning the
extractor. It keeps one Stabili record per source row, preserves source values,
formats addresses, derives source-based UUIDv5 IDs and deterministic BBL/parcel
keys, and prepares classifications for display. It does not call NYC APIs,
merge related rows, or create BIN/HPD identifiers.

```bash
python3 scripts/data/normalize_dhcr.py
```

Outputs:

- `data/intermediate/dhcr_normalized.json` (reproducible working data, gitignored)
- `data/reports/dhcr-normalization-report.json` (committed validation summary)
