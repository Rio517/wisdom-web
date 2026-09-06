# Delivery reference notes

[Research library](../README.md) · [Cross-topic synthesis](../report-source.md) · [Sources for this topic](sources.md)

Reviewed: 2026-09-06. This supporting bucket concerns the publishing platform, not evidence for life lessons.

GitHub Pages supports static HTML, CSS, and JavaScript, including multiple generated page URLs. Astro is the proposed generator. The [source notes](sources.md) link the official hosting, routing, and deployment documentation; the [delivery proposal](../../product/002-delivery-architecture.md) is the source of truth for the proposed implementation.

Framework versions, build tooling, and workflow versions must be checked when production implementation starts. The production site is not built or published. The narrow local prototype does have a pinned Vite/Tailwind build, but that study does not settle the production stack. Do not place implementation choices in the educational research buckets.

The source ledger also includes prototype-fidelity guidance and interaction-animation accessibility guidance. [Product document 006](../../product/006-storyboards-and-motion-study.md) applies those principles to image storyboards, the first HTML/SVG motion study and its current Canvas successor.

The current local prototype uses Tailwind for shared layout rules and Canvas 2D for the diagram, with semantic HTML alternatives. [008 — Choices and consequences](../../product/008-choices-and-consequences.md) defines that boundary and [009 — Layered choices implementation](../../product/009-layered-choices-implementation.md) records the implementation; H7–H8 in the [source ledger](sources.md) record the supporting official documentation. This is an installed and tested local prototype, not the production site or a publication.
