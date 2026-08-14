# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People researching New York City buildings that appear in official rent-stabilized building records, especially renters and prospective renters who need public building and management information in one understandable place.

## Product Purpose

Stabili helps people find buildings in official New York City rent-stabilized building records, review related public building information, and find registered owner or management information when those records include it. Success means helping users understand the available public record without overstating what the data proves.

## Positioning

Stabili combines a static, reproducible snapshot of official DHCR building records with NYC public property, management, and building-condition data in a consumer research interface.

## Operating Context

Users search and filter buildings, inspect building details, follow management-group records, and save building identifiers locally in their browser. The product is deployed as a static React application and reads committed generated JSON rather than calling public-data services from the browser.

## Capabilities and Constraints

- A building record does not confirm that a specific apartment is available or rent-stabilized.
- Public-source availability, freshness, matching ambiguity, and missing fields must remain visible rather than being replaced with invented values.
- Saved building identifiers are browser-local and persistent when local storage is available.
- The current project does not provide user accounts, membership, or a backend application server.
- This visual-foundation work must preserve existing page information architecture, content, functionality, routes, and data behavior.

## Brand Commitments

The product name is Stabili. Its voice is calm, plainspoken, trustworthy, and public-interest oriented. Its visual identity uses one restrained teal accent within an otherwise neutral interface.

## Evidence on Hand

- Official DHCR source PDFs in `data/source/dhcr/`.
- Generated production records in `public/data/`.
- Data methodology and building-health documentation in `docs/`.
- Existing source metadata, ambiguity, freshness, unavailable, loading, and error states in the React interface.
- No testimonials, inventory claims, membership claims, or apartment-availability evidence are present and none should be fabricated.

## Product Principles

- Make public records understandable without making them appear more certain than they are.
- Preserve provenance, limitations, ambiguity, and freshness near consequential interpretations.
- Keep search and comparison direct, familiar, and responsive across pointer, keyboard, and touch use.
- Treat user attention and trust as scarce: emphasize the record and the next useful action, not interface decoration.
- Keep the static application resilient and truthful when data or browser storage is unavailable.

## Accessibility & Inclusion

The web interface should support keyboard navigation, visible focus, comfortable touch targets, readable text, sufficient contrast, responsive layouts, and reduced-motion, reduced-transparency, and increased-contrast preferences where supported.
