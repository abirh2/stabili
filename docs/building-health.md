# Stabili Building Health V1 methodology

## Scope and version

Stabili Building Health is a Stabili-generated, renter-oriented interpretation
of current and recent records already collected by the ingestion pipeline. It is
not an official New York City or New York State government score. The algorithm
version is `building-health-v1.0.0`; every generated record and the derived-data
report store that version.

The four possible states are `low_concern`, `some_concerns`,
`higher_concern`, and `insufficient_data`. The labels describe the concern
signals in the source records listed below. They do not rate physical building
safety, construction quality, habitability, management quality, or the
likelihood that a tenant will experience a problem.

## Required data

A record can be scored only when all five of these fields contain confirmed,
non-negative counts from successful source lookups:

- `conditions.violations.openClassCCount`
- `conditions.violations.openClassBCount`
- `conditions.violations.openCount`
- `conditions.complaints.complaintCountLast12Months`
- `conditions.vacateRepairOrders.activeCount`

If any required count is missing, invalid, unavailable, or from a failed
lookup, the state is `insufficient_data`. Missing values are never replaced
with zero.

The optional field
`conditions.bedbugs.recentHistory[0].infestedUnits` is the infested-unit count
in the latest retained bedbug filing. It affects the score only when a recent
filing and a valid count are available. No filing, an unavailable lookup, or a
missing count contributes no points but remains `null` in the generated health
inputs and renter summary; it is not represented as a confirmed zero.

## Factors and thresholds

Each available factor contributes the following points:

| Source field | Value | Points | Why it is included |
| --- | ---: | ---: | --- |
| Open Class C violations | 0 | 0 | Class C is HPD's immediately hazardous violation class and is directly relevant to renters. |
| | 1–2 | 2 | |
| | 3 or more | 4 | |
| Open Class B violations | 0 | 0 | Class B is HPD's hazardous violation class and provides a current renter-relevant signal. |
| | 1–5 | 1 | |
| | 6 or more | 2 | |
| Total open violations | 0–9 | 0 | The total captures broader unresolved housing-maintenance volume, including Class A records. |
| | 10–24 | 1 | |
| | 25 or more | 2 | |
| Complaints received in the last 12 months | 0–4 | 0 | Recent complaint volume reflects recent tenant-reported issues without treating a complaint as a confirmed violation. |
| | 5–14 | 1 | |
| | 15 or more | 2 | |
| Active vacate/repair orders | 0 | 0 | An active official order is an important current renter-facing condition and therefore receives a direct higher-concern weight. |
| | 1 or more | 4 | |
| Infested units in the latest available bedbug filing | 0 | 0 | A recent filing reporting infestation is relevant to renters, while the filing remains self-reported and is weighted modestly. |
| | 1 or more | 1 | |
| | unavailable | 0, retained as `null` | Missing reporting is not evidence of zero infestation. |

The points are added without normalization:

- `low_concern`: 0 points
- `some_concerns`: 1–3 points
- `higher_concern`: 4 or more points
- `insufficient_data`: one or more required fields cannot be evaluated

The generated `health.inputs` and `health.factorPoints` objects preserve the
exact values and point contributions behind each result. The precomputed
`renterSummary` repeats only clearly derived current/recent counts and the
active-vacate-order flag to simplify later rendering.

## Interpretation limits

The classification does not establish that a building is safe or unsafe, good
or bad, code-compliant or noncompliant overall, or appropriate for any
particular renter. A `low_concern` result means only that the available fields
did not cross this V1 algorithm's thresholds. It is not an assurance that no
problems exist. A `higher_concern` result is a prompt to review the underlying
records, not a finding about physical building safety or quality.

Counts can reflect reporting practices, inspection activity, building size,
source update timing, amendments, and the limited windows retained by the
ingestion pipeline. V1 does not adjust for the number of units, compare a
building to its neighborhood, infer unreported conditions, or use management,
ownership, marketing, demographic, financial, or external data.

## Related records

The same derived stage adds `relatedRecordIds` when two or more independent
Stabili records share a validated BBL. A matched record's BBL is accepted. An
ambiguous building match is accepted only when its match evidence explicitly
says the source BBL was found in official NYC data. Unmatched, malformed, or
otherwise unsupported parcel identifiers are not used.

Related records remain separate because one DHCR PDF row always remains one
Stabili record. Sharing a parcel identity does not mean that the records are
the same physical building.
