# 005 — Research library and navigation

Status: Proposed. Created: 2026-09-06. Updated: 2026-09-06.

The linked Markdown library exists. The additional web reading interface described here is a proposal, not an implemented feature or a first-release requirement.

## Purpose

Make it easy for an author, interested reader, or future agent to find what the project knows, what supports it, and what remains uncertain. Research must have a useful architecture without depending on conversation history or a custom application.

## Current information architecture

The [research index](../research/README.md) is the entry point. It links learning/transfer, lifetime opportunities, decision-making/development, and habits as distinct educational buckets, plus supporting delivery references. Each has an overview and a nearby source ledger. The cross-topic synthesis explains how the findings connect without reproducing each topic's full analysis.

Source records have stable identifiers, publication/access dates, relevant findings, confidence, and access or inference limits. Related topics link to the existing record rather than copying it. A bucket can gain a specific subpage when a question has enough material; its overview remains the map of that topic. Research gaps are explicit, especially where initial adult habit-formation findings do not yet cover habit change in children.

This structure is the canonical content. Product decisions belong in numbered proposals; child-facing narrative belongs in content files; design samples belong in design studies. No research claim is established by a generated image or fictional example.

## Possible reading layer

Use static pages generated from the same Markdown library, with a collapsible topic tree on the left and the selected document in a comfortable reading column. Provide breadcrumbs, a short on-page heading outline for long documents, direct section links, and a visible link to the source Markdown on GitHub. On phones, use the shared accessible drawer behavior from [003](003-visual-language-and-navigation.md).

Show document purpose and evidence status near the top: findings, source ledger, or open question. Preserve study dates and evidence limitations in the rendered page. A “Related research” link can connect topics; no knowledge graph visualization is required.

An interested adult or older reader can reach the library through Sources/About. The child-facing chapter keeps its concise explanation and optional deep dives; it does not inherit an academic folder tree as its main learning sequence.

Implementation should transform repository-relative links into correct deployed URLs at build time, retain meaningful heading anchors, and respect the site's base path. Render ordinary links and semantic HTML so browsing does not require a client-side application. A small explicit navigation manifest can establish topic order if filesystem order is inadequate.

Search is optional. Start with good hierarchy and links; add lightweight local search only if finding an actual answer proves difficult. No database, accounts, analytics, external search service, or duplicated CMS copy is required.

## Scope and acceptance

- The Markdown library must be navigable in the repository before any UI exists.
- A new contributor can find the learning-compounding evidence, habit-formation limits, and current open questions from the index.
- Each substantive finding links to provenance; each source record links back to its topic.
- Local links and meaningful anchors are checked after moves or reorganizations.
- If built, the UI renders canonical files and preserves citations, evidence labels, direct URLs, keyboard access, mobile navigation, and readable no-animation behavior.
- Building the research UI does not delay the first complete Choices explanation. The first release still needs supporting source notes, but not this entire navigation layer.

## Next decision

Use the linked Markdown library during content review. If a specific navigation problem emerges, record it and test a small static research-page layout. Choose public route names and any navigation manifest when that implementation is scheduled, in coordination with [002 — Delivery architecture](002-delivery-architecture.md).
