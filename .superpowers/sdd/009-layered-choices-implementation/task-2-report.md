# Task 2 report — Tailwind build, Canvas interaction and reading shell

## Scope and TDD

- Started from `ee81831`; preserved the controller's unrelated delivery-document work.
- Added `tests/build.test.js` before `vite.config.js`. The first RED run failed because the configuration module did not exist; after implementation, three build/guard tests pass.
- Added `tests/rewrite-browser-checks.js` before the UI replacement. The required old-app browser RED capture was attempted through `mcp__playwright__browser_run_code_unsafe` against a temporary Python server on `127.0.0.1:4600`; the call could not run because the shared MCP browser profile was already locked (`Browser is already in use for .../mcp-chrome-3782347`). No browser process or user tab was touched.
- The main session's first run of the saved suite reached the page and exposed selector/tool-harness issues only: the Canvas description matched the non-exact age label, and the tool VM has no global `URL`. The suite now uses an exact label, evaluates `URL` in page context, and scopes comparison copy to the visible decision panel; the final rerun passed as recorded below.

## Delivered

- Vite 8.2.2 and Tailwind 4.3.3 with a local reading-content transform, relative build base, strict local dev/preview defaults and a resolved-config port guard.
- Canvas 2D map with DPR sizing, one cancelable animation chain, CSS-token palette, shared transformed native map targets, comparison traces, pointer previews and static HTML fallback.
- Semantic Mika comparison panel with gap/build/repair outcomes, pattern and starting layers, circumstances, return to today, visible revisitable moments, existing dialogs/index/history/motion behavior retained.

## Fresh verification

- `npm test` — 30 passed, 0 failed.
- `npm run build` — succeeded; emits `dist/prototype/index.html` and static assets.
- `git diff --check` — clean.
- `npm run dev -- --port 4599` and `npm run preview -- --port 4700` — reject before binding with the required 4600–4699 error.
- Current Vite development server: `http://127.0.0.1:4600/prototype/` (PID 70442, bound to `127.0.0.1`).

## Follow-up: browser and visual-review corrections

- Restored the approved open-future opening and its specification copy.
- Derived selected/inspected moment text and the earlier-decision list from authored state. Earlier non-12 moments now serialize as inspections without changing today; the age-12 comparison remains the explicit look-ahead case.
- Restored replay arrival, increased the today-divider contrast and added a visible “Today · age” label.
- Added shared numbered endpoint markers and matching numbered semantic outcome items, so comparison lines can be related to their consequences without cluttering each endpoint with prose.
- Map age targets retain their DOM identity across animation and resize, preserve focus, and preview on focus without changing the URL. Their visual dot is smaller than its 44px hit target.
- If Canvas 2D returns null or throws, the page now reveals the complete generated reading alternative. The fallback uses the same `renderReading()` build transform, not another authored copy.

## Final browser evidence

The main-session Playwright run of `tests/rewrite-browser-checks.js` against `http://127.0.0.1:4600/prototype/` passed all ten groups:

1. Derived moment context, earlier decisions and route markers
2. Replay arrival
3. Comparison and named outcomes
4. Layers and circumstances
5. Return to today
6. Comparison reload
7. Shared reading output
8. Desktop and tablet layout at 1440 × 1000, 1133 × 744 and 744 × 1133
9. Reduced motion
10. Canvas null/throw reading fallback

The target-size assertion uses a 43.9px epsilon for browser floating-point geometry while CSS continues to declare 44px targets. Resize checks wait for two animation frames so Canvas’s ResizeObserver and overlay transform have settled.

## Remaining Task 3 review scope

- The field-guide CSS is still a pragmatic mixed Tailwind/custom layer: Tailwind owns build integration, tokens and some shell utilities, but a broader shared-scale cleanup remains for Task 3.
- The main session retains the independent visual review work, screenshots and broader regression review. This task does not claim physical-tablet/Safari verification or reader comprehension testing.

## Independent-review follow-up

- The resolved Vite guard now rejects non-loopback `server.host` and `preview.host` overrides as well as bad ports or disabled strict-port behavior, without opening a listener during its Node test.
- Guided comparison now renders the shared authored `steps` list, including the equal-parts → equivalent-fractions → recipe-ratio sequence and repair work.
- Comparison language now distinguishes looking ahead, the current age-12 decision and looking back. Return controls carry the retained today age in their accessible names.
- Each reading instance gets a prefix-specific set of heading IDs through the build plugin. Dialog, Canvas fallback and no-JavaScript markup use local `aria-labelledby` references.
- Hover preview clears when a pointer leaves a traveled route while staying inside the Canvas.

Main-session verification after this follow-up: the saved browser suite passed all 11 groups. Main also inspected real JavaScript-enabled and JavaScript-disabled page DOMs: both had zero duplicate IDs and zero missing `aria-labelledby` references.
