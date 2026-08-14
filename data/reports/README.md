# Data pipeline reports

Committed JSON reports summarize reproducible pipeline validation. The
property-matching stage also writes
`property-match-manual-review.csv`, containing only ambiguous and unmatched
DHCR rows with source addresses, certain identifiers, reason codes, and
candidate HPD Building IDs for human review.

Human-reviewable ingestion, matching, validation, and coverage reports belong
here and may be committed. Machine-generated working datasets belong in
`data/intermediate/` and are intentionally ignored.

`derived-data-report.json` summarizes the Stabili-generated Building Health
distribution and conservative BBL-based related-record groups. Its methodology
is documented in `docs/building-health.md`.

`export-report.json` is the final production audit. It lists every static JSON
artifact, byte sizes and record counts, total production size, the largest and
average detailed record sizes, and aggregate top-level field sizes for tracing
unexpected growth.
