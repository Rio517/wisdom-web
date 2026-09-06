# Current state and next steps

## Current state

The repository contains the project brief, a linked research library, eight numbered product documents, a sample opening, an ink-and-wash illustration study, stored interface/motion storyboards, and a working two-scene HTML/SVG prototype. The public repository is [Rio517/wisdom-web](https://github.com/Rio517/wisdom-web), with `origin` configured. Current prototype work is on the local branch `prototype/choices-map`; it has not been merged or pushed. The complete chapter, production website, approved production artwork, and site publication remain outstanding.

The audience is ages 8+, with a core explanation approachable from age eight and depth for older readers. The first chapter covers choices across a lifetime, explicitly including learning that builds, carries into related activities, and can reinforce further learning. Habits/daily practice deserve a dedicated follow-up, with a short bridge in the first chapter. Relationships remain outside this release.

Start with [008 — Choices and consequences](docs/product/008-choices-and-consequences.md), then the [prototype launch instructions](prototype/README.md) and [browser-reviewed views and limits](docs/design/prototype/README.md). The implemented scope is recorded in [007](docs/product/007-interactive-map-prototype.md). The opening has abundant nonlinear paths, selectable example ages, a dot traveling from the beginning to today, a modest post-arrival zoom, and distinct lived/untaken/possible route treatments. It includes a second learning scene, a related-sport example, a reading alternative, history restoration, keyboard controls and reduced motion. The prototype underwent two visual-review/improvement loops; owner feedback now informs 008, while reader comprehension testing remains outstanding.

Desktop and iPad mini are the initial targets. Browser review covers 1440 × 1000, 1133 × 744 and 744 × 1133 CSS-pixel viewports; it does not establish physical-iPad or Safari behavior. Phone design is deferred. The [older image boards](docs/design/storyboards/README.md) remain composition references, but their sparse six-endpoint tree and stationary marker are superseded by the working study. [003](docs/product/003-visual-language-and-navigation.md) is the canonical visual-requirements document; [006](docs/product/006-storyboards-and-motion-study.md) records the medium and scope boundary.

The [sample opening](docs/content/choices-opening.md) remains a prose voice reference needing complete scene adaptation. The visual direction is a clean natural-history field guide, collapsible navigation, and quick purposeful map animation. The [brain plate](docs/design/README.md) is used decoratively in the prototype learning scene; it remains exploratory, not approved or anatomically validated.

The [research index](docs/research/README.md) links separate learning, lifetime, decision-making/development, habits, and supporting delivery buckets. Detailed source records live with their topic. Habits includes an initial evidence base with a 2024 review, a 2025-issue trial, an August 2026 synthesis, and a learning-specific 2022 study; it is not a completed review of child habit change. See [004 — Habits](docs/product/004-habits-and-daily-practice.md). The [research reading UI](docs/product/005-research-library.md) is an optional future layer over the same Markdown; no UI exists yet.

## Current review requirements

The next-revision direction is approved: Tailwind for consistent layout choices, Canvas 2D for the map, and semantic HTML for labels, controls and the explanation. Three.js is not needed for this revision. Increase contrast for untaken paths and the today divider. Remove loops and backward curls while retaining wandering routes and allowing more angular bends. Fine tuning branch separation is not a current priority.

The central teaching gap is substantive: `makeMap(age)` currently classifies the same authored branches by age, without a decision model. The approved direction is one worked fictional comparison that explains preparation, accumulating gaps, learning that builds and supported recovery, with other ages providing context. The story is layered: show circumstances and decisions outside the person's control, repeated homework/practice choices, and specific ways knowledge, setup and a familiar routine can help the next attempt. Do not claim a general habit of making all good choices. A simulator is a possible later project, not current scope. Earlier moments remain revisitable through hover/focus previews and click/touch/keyboard controls. [008](docs/product/008-choices-and-consequences.md) contains the written interaction and content specification awaiting review. No Tailwind migration, Canvas renderer, contrast change, or revised narrative has been implemented yet.

## Immediate next work

1. Review the written specification in [008](docs/product/008-choices-and-consequences.md), then write and execute its implementation plan. The teaching direction is approved; concrete wording and interaction details are in the written review. Preserve the working prototype until its replacement is verified. Run at least two visual review/improvement loops plus behavioral checks on the rewrite before handoff. These requirements supersede the earlier barely-visible routes and looping geometry.
2. Decide how to integrate the local prototype branch. It is not pushed, merged into `main`, or published. Preserve the current work until that choice is made.
3. Extend the narrative beyond the two prototype scenes: explicitly show how learning/choices open options, the reinforcing enjoyment loop, child/adult scenarios, recovery, and an ending. The current map does not yet animate a specific learning choice opening a new branch.
4. Draft the brief developmental explanation and habits bridge, then adapt the prose into guided scenes. Keep the reinforcing loop understandable, with help and recovery visible. Keep evidence in the linked research buckets and adult notes.
5. Use a short reader check near age eight and with older readers to identify misunderstandings and tune the text and map.
6. Write the complete-chapter implementation plan after prototype review, then build and verify the first release. Select and package production fonts, check Safari and a physical tablet, and conduct a full accessibility review before publication. Pages is not enabled yet.

When preparing the later habits chapter, extend the research on children/families, changing established habits, interruptions, and differing support needs. These gaps do not block the lifetime chapter. Test the existing Markdown library before deciding to build its optional web navigator.

## Proposed technical direction

The production proposal is Astro-generated pages on GitHub Pages, with an interactive guided chapter and a continuous reading view. The existing dependency-free prototype uses native HTML/CSS/ES modules and SVG; its URL retains the example age, selection and scene. The approved next direction introduces a local Tailwind/Vite build, Canvas 2D and authored comparison state without scaffolding Astro or publishing. Update the verified commands below only when that rewrite exists. See [002 — Delivery architecture](docs/product/002-delivery-architecture.md) and [008](docs/product/008-choices-and-consequences.md).

## Run and verify

From the repository root, `npm run dev` starts a local-only Python 3 static server. Open <http://127.0.0.1:4173/prototype/>. No package installation is needed. The preview can run on the existing branch without publishing anything.

`npm test` runs the ten pure-model tests. [tests/browser-checks.js](tests/browser-checks.js) is a reusable Playwright page-function suite; its invocation is documented in [prototype/README.md](prototype/README.md). It covers ten groups of interactions, including browser Back with a dialog open and preservation of a manual motion choice through OS preference changes. Both suites passed in this workspace. Review screenshots and scope limits are linked from the [browser-review index](docs/design/prototype/README.md).

## Tooling and references

Verified in this workspace on 2026-09-06:

- Git repository and GitHub CLI 2.97.0; GitHub account `Rio517` authenticated through the system keyring when run outside the sandbox.
- Node v26.7.0, Bun 1.3.14 and Python 3 available. `package.json` provides `dev` and `test`; no project dependencies are installed or needed for these commands. The browser suite uses the session's Playwright tooling separately.
- Local starter kit at `~/code/starter-kit`. Use selected conventions described in the delivery proposal.
- Current session has web research, image generation, and browser-control capabilities. Future sessions must discover their own available tools and read applicable skill instructions before use.
- Built-in ImageGen produced the saved PNG style study; image metadata verifies 1254 × 1254 pixels and an alpha channel. Precise labels and controls remain HTML; routes are currently SVG and will move to Canvas in the next revision, not generated bitmap text.
- The two selected storyboard boards are 1536 × 1024 PNGs from built-in ImageGen. Four earlier images and the exact prompt set are retained with them for review provenance. The newer working prototype has separate browser captures; neither kind of screenshot alone establishes accessibility conformance or physical-device behavior.
- The listed in-app Browser skill path was unavailable in this session; available Playwright browser tools performed the local checks. Future sessions should rediscover available tools rather than assume this exact tool name or plugin path.

The GitHub remote is configured; no live site is configured. A local GitHub authentication check inside the sandbox can report a false failure; the check outside the sandbox succeeded.

## Documentation rules

Keep this file about current state and next actions. Put concise history in `COMPLETED.md`. Keep research claims and their limits in the canonical report and source ledger. Specific proposals use stable numbered files under `docs/product/`, with status and dates; maintain [the product index](docs/product/README.md). Proposals must not be described as approved or implemented until that is true.
