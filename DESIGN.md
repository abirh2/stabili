---
name: Stabili
description: A quiet, trustworthy visual foundation for researching New York City public building records.
colors:
  canvas-warm: "#f5f5f2"
  surface-elevated: "#fdfdfc"
  surface-muted: "#efefec"
  surface-glass: "rgb(250 250 248 / 82%)"
  graphite-primary: "#1b1d1c"
  graphite-secondary: "#5d625f"
  graphite-tertiary: "#777d79"
  separator-soft: "rgb(27 29 28 / 10%)"
  separator-strong: "rgb(27 29 28 / 17%)"
  stabili-teal: "#0b6b5c"
  stabili-teal-hover: "#075b4e"
  stabili-teal-pressed: "#064a40"
  stabili-teal-subtle: "#e3f0ec"
  positive: "#28764d"
  positive-subtle: "#e7f2eb"
  caution: "#91600f"
  caution-subtle: "#f7eedb"
  negative: "#ae3f3b"
  negative-subtle: "#f8e9e7"
  focus-teal: "rgb(11 107 92 / 38%)"
  scrim: "rgb(17 20 18 / 32%)"
  on-accent: "#ffffff"
typography:
  page-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.032em"
  section-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 620
    lineHeight: 1.25
    letterSpacing: "-0.022em"
  building-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 620
    lineHeight: 1.35
    letterSpacing: "-0.014em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.005em"
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 450
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.01em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.012em"
rounded:
  page: "1.5rem"
  card: "1rem"
  control: "0.75rem"
  compact: "0.5rem"
  chip: "999px"
spacing:
  compact: "0.5rem"
  control: "0.75rem"
  standard: "1rem"
  comfortable: "1.25rem"
  section: "1.5rem"
  spacious: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.stabili-teal}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.55rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.stabili-teal-hover}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.graphite-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.55rem 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.55rem 1rem"
    height: "2.5rem"
  input:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.graphite-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.625rem 0.875rem"
    height: "2.75rem"
  filter-chip:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.graphite-secondary}"
    typography: "{typography.metadata}"
    rounded: "{rounded.chip}"
    padding: "0.45rem 0.75rem"
    height: "2.25rem"
  filter-chip-active:
    backgroundColor: "{colors.stabili-teal-subtle}"
    textColor: "{colors.stabili-teal}"
    rounded: "{rounded.chip}"
  card:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.graphite-primary}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
---

# Design System: Stabili

## Overview

**Creative North Star: "The Quiet Record Plane"**

Stabili is a polished, Apple-inspired consumer research product whose interface recedes so addresses, evidence, provenance, and uncertainty can lead. Warm neutral surfaces and graphite system typography create a calm record plane; one deep-teal accent gives actions and selected states a clear, consistent voice.

The system is restrained rather than austere: careful spacing and strong hierarchy replace dashboard chrome, while subtle translucency and layered depth identify genuinely floating navigation, sheets, dialogs, and popovers. Components feel refined, restrained, and immediately responsive, with soft separation, intentional corners, and physical feedback that never becomes decorative travel.

**Key Characteristics:**

- Warm neutral surfaces with a single calm Stabili teal interaction accent.
- High-quality system typography with compact, size-specific tracking and leading.
- Flat-by-default grouping through alignment, whitespace, and soft separators.
- Translucency and stronger depth reserved for objects that genuinely float.
- Clear hover, focus, press, selected, disabled, and reduced-preference behavior.
- Public-record status and interpretation communicated with text, not color alone.

## Colors

The palette pairs warm paper-like neutrals with graphite text, a restrained deep teal, and muted semantic colors that support public-record interpretation without competing with it.

### Primary

- **Stabili Teal:** The sole interaction accent for primary actions, links, focus-adjacent cues, active navigation, selected filters, and saved states. Darker hover and pressed steps make state changes legible without introducing another brand hue.
- **Quiet Teal Wash:** A low-intensity selection and emphasis surface for active chips, subtle buttons, text selection, and verified accents.

### Neutral

- **Warm Record Canvas:** The persistent page background; its slight warmth prevents the product from feeling clinical or dashboard-like.
- **Elevated Paper:** The near-white surface for independent controls and raised cards.
- **Muted Paper:** A quiet grouping and hover surface for secondary regions.
- **Graphite:** Primary, secondary, and tertiary text roles form a deliberate contrast ladder for records, explanations, and metadata.
- **Soft Separators:** Low-alpha graphite dividers establish structure only where spacing and alignment need reinforcement.
- **Translucent Paper:** Used only by floating navigation, sheets, dialogs, popovers, and explicitly glass variants.

### Semantic

- **Public-Record Green:** Positive or low-concern status, always accompanied by a label or icon.
- **Evidence Amber:** Ambiguity and caution states that require attention without implying failure.
- **Record Red:** Errors, invalid fields, and higher-concern states.

### Named Rules

**The One Calm Accent Rule.** Stabili teal is the only interaction accent; semantic green, amber, and red communicate record state, never brand hierarchy.

**The Evidence Beyond Color Rule.** No consequential record status may depend on hue alone; pair it with plain language and, where useful, an icon.

## Typography

**Display Font:** Apple system sans, preferring SF Pro Text and SF Pro Display when available.

**Body Font:** Apple system sans, with `system-ui` and generic sans-serif fallbacks.

**Character:** The typography is precise, compact, and consumer-facing. Moderate weights, tuned tracking, tabular numerals for record facts, and a restrained maximum title size create hierarchy without oversized headings or excessive bold.

### Hierarchy

- **Page Title** (650, fluid compact display, 1.1 line height): Names a page or primary research task; keep it concise and balanced.
- **Section Title** (620, compact headline, 1.25 line height): Introduces durable groups within a page.
- **Building Title** (620, body-scale title, 1.35 line height): Gives an address or record name prominence inside dense results.
- **Body** (400, comfortable reading size, 1.55 line height): Explanations, guidance, and product copy; keep long passages to a readable measure.
- **Metadata** (450, compact supporting size, 1.45 line height): Secondary facts, availability context, helper text, and record provenance.
- **Label** (600, compact label size, slight positive tracking): Controls, short fact values, and concise hierarchy markers.
- **Caption** (500, smallest supporting size, slight positive tracking): Sources, locations, timestamps, and tertiary context.

### Named Rules

**The Address Leads Rule.** In record summaries, the address or record name receives the title role; badges and metadata remain subordinate.

**The Quiet Weight Rule.** Use spacing, scale, and contrast before adding bold weight; reserve the strongest weight for the Stabili wordmark.

## Layout

Shared pages use a centered content plane capped at 1200px, with a 1240px option for the exploration surface. Horizontal page gutters step from 16px on compact screens to 24px and then 32px; the fixed navigation is 64px high, and content normally clears it with 80px to 96px of top space.

The spacing rhythm is based on recurring 8px, 12px, 16px, 20px, 24px, and 32px intervals. Dense record facts may use smaller local gaps, but primary groups should be separated by alignment and whitespace before adding a container. Responsive layouts collapse to one column first; multi-column organization begins where the content remains readable, and coarse-pointer controls grow to a 44px minimum height.

**The Continuous Plane Rule.** Treat the page as one coherent research surface. Add a card only when its content behaves as an independent object, not merely to wrap another section.

## Elevation & Depth

The system is layered but flat by default. Tonal surfaces, whitespace, and separators carry ordinary structure; a soft raised shadow identifies independent cards and map controls, while stronger floating depth belongs to popovers, sheets, dialogs, and overlays. Translucency is structural material for those floating layers, not ambient decoration, and it falls back to an opaque elevated surface when reduced transparency or increased contrast is requested.

### Shadow Vocabulary

- **Raised:** Two quiet ambient layers for independent cards and controls; present but deliberately low contrast.
- **Floating:** A broader shadow for popovers, sheets, dialogs, and map popups that must visibly clear the record plane.
- **Pressed:** A compact shadow paired with a 0.98 scale response for immediate physical feedback.
- **Interactive Hover:** A one-pixel lift and slightly wider ambient shadow for actionable cards only.

### Named Rules

**The Flat-by-Default Rule.** Ordinary grouping is flat; elevation signals independence, interactivity, or true spatial overlap.

**The Material Has a Job Rule.** Blur and translucent paper appear only on floating navigation, sheets, dialogs, popovers, and explicit glass objects.

## Shapes

Geometry communicates role. Page-scale sheets and dialogs use the broadest 24px corners, cards use 16px corners, controls use 12px corners, and compact badges use 8px corners. Full pills are reserved for filter chips and compact circular icon actions. Borders are minimal and low contrast, with stronger separators used for controls that need a clear boundary.

**The Radius Has Meaning Rule.** Do not introduce arbitrary corner values: choose the established page, card, control, compact, or chip role.

**The Pill Is an Action Rule.** Pill geometry belongs to filters and compact icon actions, not every label, card, or container.

## Components

Shared components are refined, restrained, and immediately responsive. Their default state is visually quiet; hover, focus, press, selection, error, and disabled states add only the feedback needed to preserve confidence.

### Buttons

- **Shape:** Gently curved control corners with a 40px default minimum height; compact and large sizes preserve the same form language.
- **Primary:** Stabili teal with white text, compact semibold type, and balanced horizontal padding.
- **Hover / Focus:** Hover deepens the teal; focus uses a visible three-pixel teal ring with offset; press scales to 0.98 and uses the pressed shadow. Disabled buttons retain their structure at reduced opacity.
- **Secondary / Outline / Ghost:** Secondary buttons use elevated paper and a strong separator, outline buttons use a teal boundary, and ghost buttons rely on muted-paper hover feedback. Danger and subtle-teal variants use their semantic surfaces without adding new geometry.

### Chips

- **Style:** Full-pill filters use elevated paper, a strong separator, compact metadata type, and a 36px minimum height.
- **State:** Hover shifts to muted paper; active filters use the quiet teal wash, a restrained teal border, and teal text. Press uses the same 0.98 physical response as buttons.

### Cards / Containers

- **Corner Style:** Cards use the established card corner; dialogs and large sheets may use the page corner.
- **Background:** Independent cards use elevated paper; flat cards remain transparent and begin with a soft separator.
- **Shadow Strategy:** Raised and interactive variants follow the elevation vocabulary; glass is reserved for genuinely floating content.
- **Border:** Cards generally avoid full outlines. Use separators within a record when facts need structure.
- **Internal Padding:** Shared card padding progresses from 16px through 20–24px to 24–32px for spacious content.

### Inputs / Fields

- **Style:** Elevated paper, a strong one-pixel separator, control corners, compact body type, and a subtle inset shadow.
- **Focus:** The border becomes Stabili teal and gains a three-pixel focus ring; native outlines are replaced only by this clearly visible treatment.
- **Error / Disabled:** Invalid fields use record red. Placeholder text stays tertiary; surrounding helper or error copy explains the state.

### Navigation

The fixed 64px navigation uses translucent paper and a single bottom separator. Desktop routes are compact ghost buttons with a quiet teal active state; search is represented as a secondary control. Mobile retains 44px circular icon actions and opens an opaque-or-translucent sheet using the same navigation hierarchy.

### Building Result

The building result is the signature shared record object: an interactive elevated card with the address as its visual anchor, public-record and complex context beneath it, a restrained three-column fact row, a plainly labeled Stabili interpretation, and management availability at the end. Hover may tint the address and lift the card by one pixel; selection uses a quiet teal wash and focus-colored ring. Save remains a single compact icon action, and status color is always paired with visible text.

## Do's and Don'ts

### Do:

- **Do** let addresses, evidence, provenance, and the next useful action establish hierarchy.
- **Do** use warm neutral surfaces, graphite type, and Stabili teal as the recognizable visual foundation.
- **Do** prefer alignment, whitespace, and soft separators before introducing another card or shadow.
- **Do** reserve raised depth for independent objects and floating depth for true overlays.
- **Do** preserve visible keyboard focus, comfortable touch targets, reduced motion, reduced transparency, and increased contrast behavior.
- **Do** make hover, focus, selected, disabled, loading, empty, and error states clear without changing the product's factual meaning.

### Don't:

- **Don't** drift into generic SaaS dashboard composition, nested mini-cards, or excessive white card stacking.
- **Don't** use neon gradients, decorative blur or glass, stacked shadows, or generic AI-generated visual patterns.
- **Don't** create huge headings, excessive bold, decorative icon boxes, kicker APIs, or fake account state.
- **Don't** turn every label into a pill or introduce arbitrary corner radii.
- **Don't** scatter literal palette values through shared components; use the semantic foundation tokens.
- **Don't** promote a current page-specific arrangement into system guidance until that surface is deliberately migrated.
