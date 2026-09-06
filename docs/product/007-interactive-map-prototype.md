# 007 — Interactive map prototype implementation plan

> **For agentic workers:** Use superpowers:executing-plans or superpowers:subagent-driven-development when appropriate to the task boundaries. Track the steps below; visual review remains a separate gate from automated tests.

Status: Implemented historical study (superseded locally by revisions 008–009). Created: 2026-09-06. Updated: 2026-09-06.

This document records the first implemented SVG study and its original constraints. [008 — Choices and consequences](008-choices-and-consequences.md) subsequently replaced its looping geometry, barely visible untaken paths and age-only explanation; the current Tailwind/Canvas implementation is recorded in [009 — Layered choices implementation](009-layered-choices-implementation.md). The details below remain useful implementation history, not the current prototype architecture.

**Historical goal:** Test a beautiful, abundant life-path map in which a dot travels from the beginning to a selected example age, then the view gently moves closer to that moment.

**Historical architecture:** A dependency-free HTML/CSS/JavaScript study with a native SVG map, separate pure geometry/state functions, and a small interruptible animation controller. This architecture has been superseded in the local prototype; it was never the complete chapter or production website.

**Historical tech stack:** Browser-native SVG, requestAnimationFrame, ES modules, Node's built-in test runner, and a local Python static server. The current prototype instead uses Vite/Tailwind and Canvas 2D while retaining ES modules and Node tests. Neither version includes analytics, accounts, runtime AI, or deployment.

**Spec:** [006 — Motion study](006-storyboards-and-motion-study.md), amended by the interaction and viewport requirements below; [003 — Visual language](003-visual-language-and-navigation.md) supplies the reading shell.

## Historical global constraints

- Desktop and iPad mini are the initial targets. Check 1440 × 1000, 1133 × 744 and 744 × 1133 CSS-pixel viewports; phone design is deferred. These are test viewports, not claims of physical-device testing.
- Begin with a rich field of possibilities, not the six-ended tree in the generated storyboards. Branches wander, cross and occasionally curl. Draw original geometry rather than reproducing the supplied image.
- A selected point is an example age, not the reader's actual age or a personal prediction. Use 8, 12, 16, 25, 40 and 60; no birth date collection.
- After selection, the dot travels from the left along the example's lived route to its selected moment. A gentle zoom follows arrival. Past alternatives become barely visible gray; the traveled route stays dark green; still-possible paths remain light gray-green. These are diagram states, not a process-stepper interface.
- Start with visible feedback within 100 ms; target travel around 500 ms and a modest zoom around 250 ms. Exact values are subject to rendered review. Nothing blocks reading or navigation.
- Repeated input cancels the previous animation. Reduced motion immediately shows the same settled state, without travel or camera motion. A visible motion toggle also permits this.
- Color is supplemented by labels, line treatment and a text explanation. Very faint untaken paths are contextual, not the only carrier of information.
- Vertical position is not success or human worth. Curls can represent trying again or returning to an interest; the drawing is not a literal calendar or opportunity count. No deterministic shrinkage with age.
- Page #FCFCFA; ink #23302D; quiet text #596860; active path #2F604D; future paths #A8BCAF; untaken paths #E5E8E3. Use readable serif prose and sans-serif controls. The map is the one expressive centerpiece; no decorative cards or particles.
- A collapsible index, two honest prototype scenes, one optional learning example and clear return are sufficient. Preserve example age and selected state across navigation/history. Do not imply the seven-scene chapter exists.
- No GitHub Pages publication or shared-branch push in this task.

## Task 1: Deterministic map and navigation state

Files: `prototype/model.js`, `tests/model.test.js`, `package.json`.

Interfaces: `AGES`, `makeMap(age)` returns `{spine, branches, anchor, focus}`; `readState(url)` returns `{age, scene, selected}`; `stateURL(state, url)` returns a URL; `motionFrame(elapsed, reduced)` returns `{travel, zoom, settled}`. Each spine/branch uses a native SVG path string. A branch carries its earliest divergence age so alternatives can be distinguished from paths still reachable from today. Age is normalized to the authored list.

- [x] Write and run failing tests for invalid/shared URL state, age round trips, branch reachability classification, finite bounded geometry, and the motion sequence (no zoom before arrival; immediate reduced-motion completion).

```js
assert.deepEqual(readState('https://example.test/?age=999#unknown'),
  { age: 8, scene: 'possibilities', selected: false });
assert.equal(motionFrame(200, false).zoom, 0);
assert.deepEqual(motionFrame(0, true), { travel: 1, zoom: 1, settled: true });
```

- [x] Implement the pure functions. Use authored anchor positions and deterministic cubic curves; never treat random route counts as researched life probabilities. Categorize a branch as untaken only when its divergence precedes the selected moment.
- [x] Run `node --test tests/model.test.js`; all tests must pass before browser integration.

## Task 2: Reading shell, interaction and example

Files: `prototype/index.html`, `prototype/styles.css`, `prototype/app.js`, `prototype/map-view.js`, `prototype/README.md`. Update the current product requirements and handoff documents.

Interfaces: `createMapView(svg)` returns `{show(age, selected, animate), cancel()}`. `show` owns SVG geometry and one cancelable requestAnimationFrame chain. The app owns URL/history, the two scenes and controls. A selection records `selected: true`; loading an explicit selected URL restores the settled view without an entrance animation.

- [x] Add browser acceptance checks before implementation: the page exposes a labeled age selector and “Explore this moment”; choosing an age changes the marker/URL; changing it during travel settles at the last selection; scene return preserves selection; the sidebar can collapse and reopen; the optional example has an explicit return; reduced motion leaves no running transition. Initial absence checks ran against the served directory before UI implementation; the reusable multi-interaction script was assembled during browser integration and caught later regressions.

```js
await page.getByLabel('Example age').selectOption('40');
await page.getByRole('button', { name: 'Explore this moment' }).click();
await page.waitForFunction(() => document.querySelector('#life-map').dataset.motion === 'settled');
// The selected moment is restored from the URL, not inferred from a screenshot.
```

- [x] Build the shared shell with real copy. Opening: “Your future has more than one path.” Explain preparation, support, circumstances and chance. Second scene: learning equal parts → equivalent fractions → adapting a recipe; identify this as a fictional example, not a forecast. Optional related-sport example states that some skills may help and others need adapting, with links to the canonical research.
- [x] Implement dot travel with native path length/point sampling, fade untaken paths, then modest focus transform. Region labels sit outside the camera transform; the age label follows its anchor with constant readable screen-space sizing. Enable click/tap on authored anchors and an equivalent button; dragging is unnecessary.
- [x] Inspect screenshots and interactions at desktop and iPad-sized viewports. Complete two review/improvement cycles, checking the initial abundance, settled meaning, readability, touch targets, animation interruption, keyboard, browser history and reduced motion.
- [x] Request independent code review, resolve important findings, rerun automated and browser checks, and update `NEXT_STEP.md` with exact launch commands and remaining scope. Record completed work only after verification.

## Design review against the brief

The distinctive element is the wandering map, not a general-purpose hero graphic. The left index and quiet serif reading area frame it; there are no metric cards, score axes, achievement ladders or decorative floral borders. The original reference informs abundance and topology, while the original drawing and the three visual states provide this project's own treatment. The camera move is deliberately small so it does not erase the sense of future freedom.

The latest desktop/tablet scope and traveling-dot sequence supersede the phone acceptance target and stationary-marker sequence in the saved image boards. The boards remain composition references and review provenance, not the executable motion contract.
