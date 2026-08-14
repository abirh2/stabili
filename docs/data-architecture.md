# Stabili data architecture

## Overview

Stabili V1 is a static application. Official NYC and NYS source material is
processed by local or CI Python scripts, normalized and enriched, validated,
and written as compact JSON under `public/data/`. Vite then includes those files
in the static site deployed to GitHub Pages. There is no production database,
backend server, Redis instance, authentication layer, or browser-time NYC API
request.

```text
Official NYC/NYS sources
  -> Python ingestion scripts
  -> normalization and enrichment
  -> generated frontend JSON
  -> static frontend
```

This keeps hosting simple and inexpensive, makes deployments reproducible, and
prevents upstream availability or rate limits from affecting a user's browsing
session. A database or API can be introduced later without changing the public
JSON model consumed by the frontend.

## Data lifecycle

- `data/source/dhcr/` contains the original DHCR rent-stabilized building PDFs.
  These immutable source files are inputs, not frontend assets.
- `data/intermediate/` contains disposable extraction, matching, and enrichment
  outputs. It is generated locally, can be recreated, and is gitignored.
- `data/reports/` contains compact human-reviewable summaries such as parse
  coverage, match ambiguity, validation errors, and source freshness reports.
- `scripts/data/` contains build-time ingestion and validation tooling.
- `public/data/` contains only small, validated production JSON artifacts needed
  by Stabili. Building records will live under `public/data/buildings/`.

The NYC Open Data application token is a local/build-time concern. Ingestion
scripts may read `NYC_OPEN_DATA_APP_TOKEN` from the environment, but the token is
never embedded in Vite variables, generated JSON, or browser JavaScript. The
browser reads only generated static files.

## Record identity and normalization

For V1, one row in a DHCR PDF remains one `StabiliRecord`. Rows are not collapsed
when several source addresses match the same HPD building. This preserves source
provenance, makes parse results auditable, and avoids silently changing the
meaning or count of DHCR registrations. Related rows can be connected through
`relatedStabiliRecordIds`, while shared BBL, BIN, or HPD Building ID values expose
their relationship without merging their identities.

The normalized TypeScript contract is in `src/data/schema.ts`. Address data is
modeled as one primary address plus zero or more alternate addresses. Property
matching has an explicit `matched`, `ambiguous`, or `unmatched` state, so an HPD
identifier is never implied. Management is nullable because not every building
has a usable contact record. Counts, detail collections, building attributes,
coordinates, and source freshness are separate concerns instead of fields on one
flat display model.

## Missing and unknown values

Unknown scalar values are represented by `null`, never by a guessed value, an
empty string, or zero. This is particularly important for counts: `0` means a
source was checked and reported none, while `null` means the value is unknown or
was not retrieved. A detail collection follows the same rule: `[]` means checked
with no records, while `null` means details are unavailable. Optional real-world
relationships, such as management information or a matched HPD building, are
also nullable.

`public/data/metadata.json` carries dataset-level version and freshness fields.
Until an ingestion run supplies real values, production timestamps and source
years remain `null`; they must not be fabricated.

## Validation and future evolution

`npm run validate:data` validates dataset metadata and every JSON file under
`public/data/buildings/` against the centralized TypeScript contract. The normal
production build runs this check first. Validation is implemented with small
runtime type guards because the project does not currently depend on a schema
library; this avoids adding browser or build dependencies for a narrow need.

The schema is versioned independently of storage. A future database-backed
pipeline can serialize the same `StabiliRecord` and metadata shapes, allowing the
frontend to keep its public data model even if the generation infrastructure
changes.
