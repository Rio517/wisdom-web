# Project instructions

## Purpose and scope

Wisdom is a working title for a selective, guided life manual for ages 8+ and for general sharing. The core explanation must be approachable from age eight, with depth for older readers. Treat readers as capable of substantial ideas. The first subject is choices across a lifetime; daily decisions are the next linked chapter. Relationships and other life subjects are outside the first release.

Read `NEXT_STEP.md`, `docs/brief.md`, and the relevant research and proposal before working. Use `docs/research/report-source.md` for research conclusions and `docs/research/sources.md` for provenance when those files are present.

## Content

- Preserve the central idea that preparation and choices influence future options.
- Distinguish evidence, editorial inference, fictional illustration, and open questions. Cite research claims near the claim and retain source details in the research ledger.
- Explain mechanisms and trade-offs. Avoid guaranteed success, invented probabilities, fixed life trajectories, and unsupported age cutoffs.
- Skills, qualifications, support, circumstances, and chance all matter. Academic performance is not a measure of human worth. Describe occupations respectfully.
- Use clear language with substantive reasoning; introduce useful vocabulary in context. Include recovery, asking for help, and changing strategy.
- Keep family names, private anecdotes, and the originating conversation out of public material.

## Documentation

- Keep research and plans in this repository under `docs/`.
- Specific proposals belong in `docs/product/NNN-short-name.md`, with status, created date, and updated date. Maintain the product index. Keep IDs and filenames stable; use Git for revision history.
- Write reference documents as current statements. Clearly label proposals and unapproved decisions.
- `NEXT_STEP.md` is the current handoff: state, immediate work, unresolved decisions, and verified tooling. Replace stale status instead of appending a diary.
- `COMPLETED.md` is the concise chronological log. Update it only for work actually done.
- Keep one canonical source for each substantive topic and link to it from summaries.

## Delivery and quality

- The current phase is research and design. Do not describe a proposed website as implemented or published.
- Favor a static multipage site with real page URLs; the proposed stack is documented in `docs/product/002-delivery-architecture.md`.
- Guided progression, explanatory animation, optional examples/deep dives, and a selectable starting age on the life map are product requirements. The selected age describes an example, not a diagnosis or prediction of the reader's life. Video is a possible later medium.
- Visuals must explain an idea accurately. Interactive diagrams need keyboard operation, a readable static alternative, and reduced-motion support.
- Use project-specific design tokens and readable type. Verify rendered pages at phone and desktop sizes before claiming visual quality.
- Preserve user changes. Keep Git add, commit, and push as separate operations. Avoid unnecessary workflow or infrastructure copied from other projects.
- Run checks proportionate to the change. Research documents need citation, link, consistency, and scope checks; interactive features need behavioral verification.
