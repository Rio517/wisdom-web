# Wisdom

A selective, guided and animated life manual for ages 8+, starting with how choices shape future possibilities.

The current local prototype explains life’s possibilities, how choices add up, and what we cannot control. Alfredo’s hikes are an optional example; map exploration is optional too. Open the [lesson on port 4600](http://127.0.0.1:4600/prototype/choices.html), or see [run instructions](prototype/README.md). It uses compiled Tailwind, Canvas and SVG. It is not the production website and has not been published.

All project servers use ports **4600–4699** only: **4600** for development and **4601** for build preview, bound to `127.0.0.1` with strict port handling. Install with `npm ci`; see the [launch and verification instructions](prototype/README.md).

## Coding agents (Claude Code, Codex)

The agent setup is in the repo, so it works for anyone who clones it:

- **Instructions:** `AGENTS.md` is the whole setup: scope, content rules,
  documentation layout and how to verify work. Read it and `NEXT_STEP.md`
  before changing anything. Codex reads `AGENTS.md`; Claude Code reads
  `CLAUDE.md`, which imports it.
- **Agents:** `.claude/agents/design-reviewer.md` judges rendered pages
  against the design records after a visual change, in a fresh context.
- **Skills:** `.claude/skills/wisdom-design/SKILL.md` condenses the design
  system (tokens, motifs, hard rules, what to avoid) and loads on any UI work.
- **Permissions:** `.claude/settings.json` allows the project's npm scripts
  and `git add`, and asks before a force push or a push to `main`.
- **Deploys:** a release tag (`v2026.10.09`, then `v2026.10.09.2`, …) on a
  commit in `main` deploys the site; pushes deploy nothing. Tests and the build
  run nightly (`.github/workflows/ci.yml`) and before each deploy.
- **No MCP servers or hooks are committed.** The site is a static Astro
  build, so there is no running app for an agent to query.
- **Browsers:** bring your own headless Playwright or Chrome DevTools MCP to
  check pages at desktop and tablet size.

What you bring yourself: Claude Code and/or Codex, signed in; Node and npm
(Node 22.12 or later, see `engines` in `package.json`). The site and the
prototypes use ports 4600 to 4603 on `127.0.0.1`. Nothing here depends on a
particular machine or a parent folder.

## Start here

- [Current state and next steps](NEXT_STEP.md)
- [Lesson roadmap and documentation index](docs/README.md#lesson-roadmap)
- [Project brief](docs/brief.md)
- [Research library — topics and navigation](docs/research/README.md)
- [Research findings](docs/research/report-source.md)
- [Sources and evidence limits](docs/research/sources.md)
- [Product documents](docs/product/README.md)
- [001 — Choices experience](docs/product/001-choices-experience.md)
- [Sample opening](docs/content/choices-opening.md)
- [002 — Delivery architecture](docs/product/002-delivery-architecture.md)
- [003 — Visual language, navigation, and signature map motion](docs/product/003-visual-language-and-navigation.md)
- [004 — Habits and the choices we repeat](docs/product/004-habits-and-daily-practice.md)
- [005 — Research library and possible reading UI](docs/product/005-research-library.md)
- [Design library — numbered studies and image versions](docs/design/README.md)
- [001 — Choices explainer: flat code review and earlier artwork](docs/design/001-choices-explainer/README.md)
- [006 — Storyboards and the first motion study](docs/product/006-storyboards-and-motion-study.md)
- [007 — Interactive map prototype implementation plan](docs/product/007-interactive-map-prototype.md)
- [008 — Choices and consequences](docs/product/008-choices-and-consequences.md)
- [009 — Layered choices rewrite implementation plan](docs/product/009-layered-choices-implementation.md)
- [Run the local prototype](prototype/README.md)
- [Completed work](COMPLETED.md)

The [editable lesson draft](docs/content/choices-story.md) separates the main explanation from the optional hike. The full-width life map has a compact, hideable text overlay on the right, leaving its origin clear. Map exploration supports blue previews, connected choices and earlier-fork revisits without redrawing the network. [Implementation and limits](docs/product/012-choices-lesson-implementation.md) · [Current screenshots](docs/design/001-choices-explainer/v08-alfredo-lesson/README.md). The older Mika study and standalone algorithm lab remain available separately. Habits is the next lesson, after reader review of this one.
