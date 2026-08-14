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

## Property matching

The property-matching stage reads `dhcr_normalized.json` and resolves each row
against two official NYC Open Data datasets through the reusable cached
Socrata client:

- `kj4p-ruqc`, Buildings Subject to HPD Jurisdiction, for HPD Building IDs,
  BINs, building addresses, and parcel components
- `64uk-42ks`, Primary Land Use Tax Lot Output (PLUTO), for official BBLs,
  parcel addresses, and coordinates

The stage downloads only the required field projections in large paginated
batches, then indexes them locally. Matching starts with borough/block/lot and
uses primary or alternate addresses only to disambiguate multiple buildings on
one parcel or as a fallback when the source BBL is not present. Ambiguous
building assignments retain certain parcel data but never receive an invented
BIN or HPD Building ID. Source rows are never merged.

```bash
python3 scripts/data/match_properties.py
```

Outputs:

- `data/intermediate/property_matches.json` (reproducible working data,
  gitignored)
- `data/reports/property-match-report.json` (machine-readable validation)
- `data/reports/property-match-manual-review.csv` (ambiguous and unmatched
  records)

Use `--refresh-cache` only when intentionally replacing the local NYC API
snapshot. This stage does not fetch violations, complaints, registrations,
contacts, or any other HPD enrichment.

## NYC building and management enrichment

The first enrichment stage reads `property_matches.json` and adds only compact
building attributes, the latest Multiple Dwelling Registration, and useful
contacts from that registration. It uses these official NYC Open Data datasets:

- `kj4p-ruqc`, Buildings Subject to HPD Jurisdiction
- `64uk-42ks`, Primary Land Use Tax Lot Output (PLUTO)
- `tesw-yqqr`, Multiple Dwelling Registrations
- `feu5-w2e2`, HPD Registration Contacts

Each source is fetched with an explicit narrow field projection through the
existing cached Socrata client. Contacts retain official roles and names;
normalization only handles casing and punctuation. Phone, email, and website are
explicitly null because the official contacts dataset does not provide them.

```bash
python3 scripts/data/enrich_nyc_management.py
```

Outputs:

- `data/intermediate/nyc_management_enriched.json` (reproducible working data,
  gitignored)
- `data/reports/management-enrichment-report.json` (building-level coverage,
  unresolved registrations, and normalized duplicate names)

This stage deliberately does not fetch violations, complaints, bedbug reports,
litigation, or vacate orders, and it does not generate frontend data.

## NYC building-condition enrichment

The condition stage reads `nyc_management_enriched.json` and adds current and
recent renter-relevant HPD records. It uses only official NYC Open Data:

- `wvxf-dwi5`, Housing Maintenance Code Violations
- `ygpa-z7cr`, Housing Maintenance Code Complaints and Problems
- `wz6d-d3jb`, Bedbug Reporting
- `tb8q-a3ar`, Order to Repair/Vacate Orders

Violation and complaint/problem lookups use bounded Building ID batches and
narrow field projections through the shared API cache. The stage fetches open
records plus compact recent windows instead of decades of raw history. The
small repair/vacate table is fetched once so every active order is represented.
It retains exact summary counts, limited recent details, source provenance, and
explicit availability states so a confirmed zero is never confused with a
failed lookup or a missing bedbug filing.

```bash
python3 scripts/data/enrich_nyc_conditions.py
```

Outputs:

- `data/intermediate/nyc_condition_enriched.json` (reproducible working data,
  gitignored)
- `data/reports/condition-enrichment-report.json` (dataset coverage, relevant
  condition cohorts, lookup failures, confirmed zeros, and unavailable data)

This stage does not calculate a health score and does not generate or modify
frontend data.
