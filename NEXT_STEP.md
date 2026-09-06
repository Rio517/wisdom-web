# Current state and next steps

## Current state

The repository contains the project brief, a linked research library, five numbered product proposals, a sample opening, and one generated ink-and-wash illustration study with provenance. The public repository is [Rio517/wisdom-web](https://github.com/Rio517/wisdom-web), with `origin` configured and local work on `main`. The website, motion study, approved production artwork, and complete chapter do not yet exist.

The audience is ages 8+, with a core explanation approachable from age eight and depth for older readers. The first chapter covers choices across a lifetime, explicitly including learning that builds, carries into related activities, and can reinforce further learning. Habits/daily practice deserve a dedicated follow-up, with a short bridge in the first chapter. Relationships remain outside this release.

Start with [001 — Choices experience](docs/product/001-choices-experience.md), [003 — Visual language and navigation](docs/product/003-visual-language-and-navigation.md), and [the sample opening](docs/content/choices-opening.md). The sample remains a prose voice reference needing scene adaptation. The visual direction is a clean natural-history field guide, a collapsible left panel, and a signature quick marker-and-line interaction with restrained atmospheric emphasis. The [brain plate](docs/design/README.md) is exploratory, not approved or anatomically validated.

The [research index](docs/research/README.md) links separate learning, lifetime, decision-making/development, habits, and supporting delivery buckets. Detailed source records live with their topic. Habits includes an initial evidence base with a 2024 review, a 2025-issue trial, an August 2026 synthesis, and a learning-specific 2022 study; it is not a completed review of child habit change. See [004 — Habits](docs/product/004-habits-and-daily-practice.md). The [research reading UI](docs/product/005-research-library.md) is an optional future layer over the same Markdown; no UI exists yet.

## Immediate next work

1. Review product documents 001 and 003 with the sample voice. Settle the core maths/learning chain, qualified tennis example, starting-age examples, and opening marker behavior.
2. Create a real-copy storyboard and short motion study in the shared reading shell. Prioritize dot placement and path tracing: quick, beautiful, informative, interruptible, and never a wait before reading. Include one example/return, the ending, phone and desktop layouts, child/adult starting points, and reduced motion.
3. Draft the brief developmental explanation and habits bridge, then adapt the prose into guided scenes. Keep the reinforcing loop understandable, with help and recovery visible. Keep evidence in the linked research buckets and adult notes.
4. Use a short reader check near age eight and with older readers to identify misunderstandings and tune the text and map.
5. Write the detailed implementation plan from the selected storyboard, then build and verify the first complete chapter. Pages is not enabled yet.

When preparing the later habits chapter, extend the research on children/families, changing established habits, interruptions, and differing support needs. These gaps do not block the lifetime chapter. Test the existing Markdown library before deciding to build its optional web navigator.

## Proposed technical direction

Astro-generated pages on GitHub Pages, with an interactive guided chapter and a continuous reading view. Chapter URLs support named scenes and a selected example age. Exact versions, package manager, and diagram implementation are unsettled. See [002 — Delivery architecture](docs/product/002-delivery-architecture.md).

## Tooling and references

Verified in this workspace on 2026-09-06:

- Git repository and GitHub CLI 2.97.0; GitHub account `Rio517` authenticated through the system keyring when run outside the sandbox.
- Node v26.7.0 and Bun 1.3.14 installed. No project dependencies or application scripts exist yet.
- Local starter kit at `~/code/starter-kit`. Use selected conventions described in the delivery proposal.
- Current session has web research, image generation, and browser-control capabilities. Future sessions must discover their own available tools and read applicable skill instructions before use.
- Built-in ImageGen produced the saved PNG style study; image metadata verifies 1254 × 1254 pixels and an alpha channel. Precise labels, lines, and interactive geometry remain proposed HTML/SVG, not generated bitmap text.

The GitHub remote is configured; no live site is configured. A local GitHub authentication check inside the sandbox can report a false failure; the check outside the sandbox succeeded.

## Documentation rules

Keep this file about current state and next actions. Put concise history in `COMPLETED.md`. Keep research claims and their limits in the canonical report and source ledger. Specific proposals use stable numbered files under `docs/product/`, with status and dates; maintain [the product index](docs/product/README.md). Proposals must not be described as approved or implemented until that is true.
