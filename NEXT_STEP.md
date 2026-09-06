# Current state and next steps

## Current state

The repository contains the project brief, research synthesis and source ledger, a choices-chapter proposal, a sample opening, and a static delivery proposal. The research phase provides a foundation for design; the website, artwork, and complete chapter are not implemented or published.

Primary readers are capable children aged 7–11. The project is intended for general sharing. The first chapter covers choices across a lifetime; daily decisions are the next linked chapter. Relationships remain outside this release.

Start with [the sample opening](docs/content/choices-opening.md) and [the chapter proposal](docs/choices-proposal.md). Use [the research report](docs/research/report-source.md) for evidence and [the source ledger](docs/research/sources.md) for confidence, limitations, and search coverage.

## Immediate next work

1. Resolve GitHub repository visibility. The proposed target is `Rio517/wisdom-web`; authentication works and that name was available when checked. A public/private question is pending. Recheck the target before creation, connect `origin`, and push the reviewed documentation. Do not enable Pages before there is an approved site to publish.
2. Review the sample voice and proposed seven-scene chapter. Confirm that the balance of preparation, trade-offs, uncertainty, and recovery captures the intended lesson.
3. Create the opening/map/ending storyboard at phone and desktop widths. Use the proposed illustrated-atlas direction as the first concrete visual candidate.
4. Use a short reader check to identify misunderstandings and tune the text and map.
5. Write the detailed implementation plan from the selected storyboard, then build and verify the first complete chapter.

## Proposed technical direction

Astro-generated static pages on GitHub Pages, with authored chapter content and selected browser interactions. Each chapter has its own URL. Exact versions, package manager, and diagram implementation are unsettled. See [delivery details and starter-kit findings](docs/delivery.md).

## Tooling and references

Verified in this workspace on 2026-09-06:

- Git repository and GitHub CLI 2.97.0; GitHub account `Rio517` authenticated through the system keyring when run outside the sandbox.
- Node v26.7.0 and Bun 1.3.14 installed. No project dependencies or application scripts exist yet.
- Local starter kit at `~/code/starter-kit`. Use selected conventions described in the delivery proposal.
- Current session has web research, image generation, and browser-control capabilities. Future sessions must discover their own available tools and read applicable skill instructions before use.

No GitHub remote or live site is configured. A local GitHub authentication check inside the sandbox can report a false failure; the check outside the sandbox succeeded.

## Documentation rules

Keep this file about current state and next actions. Put concise history in `COMPLETED.md`. Keep research claims and their limits in the canonical report and source ledger. Proposals must not be described as approved or implemented until that is true.
