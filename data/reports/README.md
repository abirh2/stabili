# Data pipeline reports

Committed JSON reports summarize reproducible pipeline validation. The
property-matching stage also writes
`property-match-manual-review.csv`, containing only ambiguous and unmatched
DHCR rows with source addresses, certain identifiers, reason codes, and
candidate HPD Building IDs for human review.

Human-reviewable ingestion, matching, validation, and coverage reports belong
here and may be committed. Machine-generated working datasets belong in
`data/intermediate/` and are intentionally ignored.
