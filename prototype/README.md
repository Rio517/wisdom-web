# Narrow interactive map prototype

This directory contains a local, dependency-free HTML/CSS/JavaScript study for the approved scope in [product document 007](../docs/product/007-interactive-map-prototype.md). It is not the complete choices chapter, the production website, or a published build. It has not yet been owner-reviewed.

## Run locally

From the repository root:

```sh
npm run dev
```

Open <http://127.0.0.1:4173/prototype/>. The command uses the local Python 3 static server and installs no packages.

Run the pure model checks with Node 22 or newer:

```sh
npm test
```

## Implemented study surface

Code inspection shows a two-scene reading shell with:

- a collapsible Choices index, About dialog, Source code link, and continuous-reading dialog;
- authored example ages 8, 12, 16, 25, 40, and 60, preserved with selected state and scene in the URL;
- an SVG map with abundant deterministic branches, nonlinear movement, crossings, and occasional curls;
- a selected-state sequence in which a dot travels from the beginning at the left along the dark-green lived route to today, followed by a modest focus move;
- barely visible gray untaken alternatives and light gray-green still-possible routes, with a legend and prose explaining that height is not a score and the map is not a prediction;
- interruption on a new selection, replay and whole-map controls, a visible less-motion control, and immediate settled rendering when reduced motion applies;
- keyboard-operable authored map anchors and an equivalent age selector plus “Explore this moment” button;
- a fictional equal-parts → equivalent-fractions → recipe example, plus an optional related-racket-sport explanation with a clear return.

The [browser review record](../docs/design/prototype/README.md) documents rendered inspection and behavioral checks. The inventory is not a claim of accessibility conformance, owner visual approval, or a complete chapter.

## Browser checks

With the local server running, the session's Playwright browser tool can execute the saved page function:

```js
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "tests/browser-checks.js"
});
```

Run the tool with the repository root as its working directory, or supply the file's absolute path in that checkout. This tool name is session-specific. The file is an async function expression accepting a Playwright `page`; it is not an `@playwright/test` spec and does not run under `npm test`. A future agent should discover available browser tooling before invoking it. No browser test dependencies have been added to this prototype.

## Review boundary

The minimum prototype targets are desktop and iPad mini at 1440 × 1000, 1133 × 744, and 744 × 1133 CSS pixels. Phone design is deferred. Review should cover initial path abundance, settled visual meaning, reading comfort, touch targets, keyboard behavior, repeated-input interruption, history restoration, dialogs and returns, and reduced motion.

The CSS lists Source Serif 4 and Source Sans 3 as preferred family names but includes no self-hosted font files and loads no web-font service. Rendering currently uses whichever named fonts are installed, falling back to system serif and sans-serif families.

The saved PNG storyboards under `docs/design/storyboards/` remain historical composition and style inputs. Their six-endpoint tree and stationary-marker motion do not define this prototype; [003](../docs/product/003-visual-language-and-navigation.md#signature-map-interaction) is the detailed visual-requirements source.
