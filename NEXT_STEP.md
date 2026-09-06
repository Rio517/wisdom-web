# Current state and next steps

## Current state

The repository contains the project brief, research synthesis and source ledger, numbered product documents, a sample opening, and a static delivery proposal. The public repository is [Rio517/wisdom-web](https://github.com/Rio517/wisdom-web), with `origin` configured and local work on `main`. The website, artwork, and complete chapter are not implemented or published.

The audience is ages 8+, with a core explanation approachable from age eight and depth for older readers. The first chapter covers choices across a lifetime; daily decisions are the next linked chapter. Relationships remain outside this release.

Start with [001 — Choices experience](docs/product/001-choices-experience.md) and [the sample opening](docs/content/choices-opening.md). The product document covers the life-paths reference, guided animation, a selectable starting age, optional examples/developmental context, and possible later video. The sample is a prose voice reference that still needs adaptation into scenes. Use [the research report](docs/research/report-source.md) for evidence and [the source ledger](docs/research/sources.md) for confidence, limitations, and search coverage.

## Immediate next work

1. Review product document 001 and the sample voice. Settle the scene sequence and how changing the starting age changes the worked example.
2. Create a storyboard and short motion study: “today” and possible futures, one animated fork, an optional example and return, and the ending. Include phone and desktop layouts plus a child and adult starting point.
3. Draft the brief developmental explanation and adapt the prose into the guided scenes, keeping supporting evidence in adult notes.
4. Use a short reader check near age eight and with older readers to identify misunderstandings and tune the text and map.
5. Write the detailed implementation plan from the selected storyboard, then build and verify the first complete chapter. Pages is not enabled yet.

## Proposed technical direction

Astro-generated pages on GitHub Pages, with an interactive guided chapter and a continuous reading view. Chapter URLs support named scenes and a selected example age. Exact versions, package manager, and diagram implementation are unsettled. See [002 — Delivery architecture](docs/product/002-delivery-architecture.md).

## Tooling and references

Verified in this workspace on 2026-09-06:

- Git repository and GitHub CLI 2.97.0; GitHub account `Rio517` authenticated through the system keyring when run outside the sandbox.
- Node v26.7.0 and Bun 1.3.14 installed. No project dependencies or application scripts exist yet.
- Local starter kit at `~/code/starter-kit`. Use selected conventions described in the delivery proposal.
- Current session has web research, image generation, and browser-control capabilities. Future sessions must discover their own available tools and read applicable skill instructions before use.

The GitHub remote is configured; no live site is configured. A local GitHub authentication check inside the sandbox can report a false failure; the check outside the sandbox succeeded.

## Documentation rules

Keep this file about current state and next actions. Put concise history in `COMPLETED.md`. Keep research claims and their limits in the canonical report and source ledger. Specific proposals use stable numbered files under `docs/product/`, with status and dates; maintain [the product index](docs/product/README.md). Proposals must not be described as approved or implemented until that is true.
