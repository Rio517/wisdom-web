# Project instructions

## Purpose and scope

Wisdom is a working title for a selective, guided life manual for ages 8+ and for general sharing. The core explanation must be approachable from age eight, with depth for older readers. Treat readers as capable of substantial ideas. The first subject is choices across a lifetime; daily decisions are the next linked chapter. Relationships and other life subjects are outside the first release.

Read `NEXT_STEP.md`, `docs/brief.md`, and the relevant research and proposal before working. Start research navigation at `docs/research/README.md`. The cross-topic synthesis and source index link to canonical topic findings and ledgers; do not duplicate them into one growing omnibus document.

## Content

- Preserve the central idea that learning and choices can compound and influence future options. Distinguish building on knowledge, related-skill transfer, and possible learning/enjoyment feedback; do not promise a growth rate or universal transfer.
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
- Research is grouped into learning, lifetime opportunities, decision-making/development, and habits, with delivery references separate. Each bucket needs findings, linked sources, evidence limits, and open questions. Habits currently has an initial formation evidence base, not a completed child habit-change review.

## Delivery and quality

- All project development, preview and test servers must use ports 4600–4699. Default to 4600 for development and 4601 for build preview, bound to 127.0.0.1. Fail clearly on a port conflict; never silently fall back outside the allowed range.
- Delegate bounded work to simpler, lower-cost models where appropriate. Use a capable mid-tier model for multi-file implementation and reviews; reserve higher-capability models for design judgment or genuinely difficult findings. Do not lower quality or duplicate reviews merely to parallelize.

- The current phase is research, design, and iteration on a narrow local prototype. The code under `prototype/` is an implementation study, not the production website. The Tailwind/Canvas rewrite implements the approved fictional choice-and-consequence comparison and remains subject to owner review, reader testing and later production work. The prototype is not published.
- Favor a static multipage site with real page URLs; the proposed stack is documented in `docs/product/002-delivery-architecture.md`.
- Guided progression, explanatory animation, optional examples/deep dives, and a selectable starting age on the life map are product requirements. The selected age describes an example, not a diagnosis or prediction of the reader's life. Video is a possible later medium.
- Visuals must explain an idea accurately. Interactive diagrams need keyboard operation, a readable static alternative, and reduced-motion support.
- Use project-specific design tokens and readable type. The prototype's minimum viewport targets are desktop and iPad mini; phone design is deferred. Verify rendered pages at the required desktop and tablet sizes before claiming visual quality.
- Use the clean field-guide direction and collapsible navigation in product document 003. Keep the implemented abundant path field and the beginning-to-today travel followed by a modest zoom. Routes move forward without loops or backward curls; untaken gray routes and the today divider stay visible. Preserve a dark-green traveled route and lighter gray-green futures. Tailwind supplies layout, Canvas 2D supplies routes, and semantic HTML supplies labels and controls; Three.js is not needed. This diagram is not a literal process stepper. Motion must be quick, interruptible and readable when settled, without delaying content.
- The opening explains how decisions can change later opportunities through one worked fictional comparison with favorable and unfavorable consequences, supported recovery and meaningful earlier moments. Preserve hover/focus previews and click/touch/keyboard controls. Product document 008 is the revision acceptance contract; 007 records the superseded SVG study.
- Layer the story to show repeated choices, accumulated understanding, and circumstances or decisions outside the person's control. Distinguish learning, practical setup and behavior-specific habits; do not claim a universal habit of good judgment. A simulator is possible future scope, not infrastructure to build now. The core explanation must work before expanding it.
- Preserve user changes. Keep Git add, commit, and push as separate operations. Avoid unnecessary workflow or infrastructure copied from other projects.
- Run checks proportionate to the change. Research documents need citation, link, consistency, and scope checks; interactive features need behavioral verification.
