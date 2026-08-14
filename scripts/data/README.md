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

## NYC Open Data client

`nyc_open_data.py` is the reusable build-time Socrata client for future NYC
enrichment stages. It supports SoQL selection/filtering/ordering, pagination,
retry and rate-limit handling, provenance, and a disposable local cache at
`data/intermediate/api-cache/`. It is not imported by the frontend and does not
perform property matching on its own.

Put `NYC_OPEN_DATA_APP_TOKEN` in the repository-root `.env` (see
`.env.example`). Network requests fail clearly when it is missing. Cached
responses can be bypassed per client/command or by setting
`NYC_OPEN_DATA_CACHE_REFRESH=1`.

Run the small connectivity diagnostic with:

```bash
python3 scripts/data/diagnose_nyc_open_data.py
python3 scripts/data/diagnose_nyc_open_data.py --refresh-cache
```

The diagnostic prints only success, dataset ID, and record count; it never
prints the application token.
