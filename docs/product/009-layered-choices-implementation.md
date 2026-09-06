# 009 — Layered choices rewrite implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Status: Approved for prototyping (in progress). Created: 2026-09-06. Updated: 2026-09-06.

**Goal:** Replace the age-only SVG study with a beautiful Tailwind/Canvas explanation of choices, repeated practice, learning and recovery, retaining the existing reading shell's working behavior.

**Architecture:** Plain JavaScript authored story data and a pure state/geometry model feed both a Canvas 2D view and semantic HTML. Vite builds Tailwind and inserts a reading alternative from the same story records. The app owns navigation/focus; the renderer owns one interruptible animation and shares its camera with HTML targets.

**Tech Stack:** JavaScript ES modules, Tailwind CSS with its Vite plugin, Canvas 2D, Node's built-in test runner, existing session Playwright tooling. No React, Three.js or backend.

**Spec:** [008 — Choices and consequences](008-choices-and-consequences.md), including its layered-story and port requirements. Read the brief and relevant research before implementation.

## Global constraints

- All project servers use ports 4600–4699: development defaults to 4600 and build preview to 4601, bound to 127.0.0.1 with strict port handling. A conflict fails clearly instead of silently selecting another port.
- Desktop and iPad mini: verify 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels. Phone design is deferred.
- One fictional worked comparison at age 12, with gap/build/repair views, and authored context at ages 8, 12, 16, 25, 40 and 60. No simulator, opportunity score, prediction, tracking, account or runtime AI.
- Preparation, accumulated gaps, learning that builds and supported recovery are the core. Repeated choices and circumstances outside the person's control are visible; a particular routine is not a universal habit of good judgment.
- Tailwind supplies layout/spacing/type rules; Canvas supplies routes/dot, and HTML supplies semantic text/controls. Preserve a complete static reading alternative from the same authored records.
- Page #FCFCFA, ink #23302D, dark-green active route #2F604D. Start untaken routes at #87918B and future routes at #7F9C8B; adjust only through shared tokens following rendered review. No decorative cards or particles.
- Main body 20px, secondary text and meaningful diagram labels at least 16px; control targets at least 44 × 44 CSS pixels. Serif Iowan Old Style/Palatino/Georgia prose and Avenir Next/Segoe UI sans-serif controls retain the existing field-guide voice.
- Geometry remains abundant, original and left-to-right without loops or backward curls. Vertical placement is not a success axis; outcome labels explain the consequence. The today divider and untaken routes are clearly visible.
- Arrival responds within 100 ms, travels about 500 ms, then focuses about 250 ms; comparison settles within about 250 ms. Motion never blocks reading, queues or runs at rest. Reduced motion renders the identical settled state immediately.
- Today and inspected moment are separate state. Earlier decisions remain accessible after zoom, and every hover preview has click/touch/keyboard equivalents. URL reload/history restores settled state, comparisons and layers.
- No push, merge, deployment or publication in this task. Work continues on the existing local prototype branch.

## Design review before building

The abundant map is the expressive centerpiece; the layout is a quiet index and open reading surface. Use Tailwind's spacing scale, a prose measure around 60 characters, left alignment and a wider map. Meaningful layers use disclosures beneath the comparison, not a dashboard of cards. A selected age is a point in an example life, not a progress-stepper stage. Preserve this distinction in the visual hierarchy.

At desktop, the header and short introduction lead to the map, with a compact explanation beneath. At tablet portrait, the index becomes the existing overlay and the toolbar wraps without shrinking controls or labels. No artwork generation is required: the map must be precise code and the existing decorative brain plate can remain in the learning scene.

## Task 1: Authored story, state and forward-moving route model

**Files:** Create `prototype/story.js`, `prototype/story-markup.js`, `tests/story.test.js`; modify `prototype/model.js`, `tests/model.test.js`.

**Interfaces:**

- `story.js` exports `MOMENTS` (records `{age,title,summary}`), `COMPARISONS` (keys `gap`, `build`, `repair`; each `{title,action,consequence,steps,outcomes}`), `LAYERS` (keys `pattern`, `starting`; each `{title,paragraphs}`), and `CIRCUMSTANCES` (plain text). Each outcome is `{id,label,status}` with status `available`, `needs-work`, or `missed`. No HTML strings in content records.
- `story-markup.js` exports `renderReading()` returning escaped semantic HTML generated from those same records, including all three comparisons, circumstances, layers and the equivalent-fractions learning explanation. This is consumed by the build plugin in Task 2; HTML escaping must protect text with `&`, `<`, `>`, quotes.
- `model.js` exports `AGES`, `OVERVIEW`, `readState(input)`, `stateURL(state,input)`, `transition(state,change)`, `motionFrame(elapsed,reduced)`, `makeMap(age)`, `comparisonRoutes(mode)`, `pointOnRoute(points,progress)`.
- State is `{age,scene,selected,overview,inspect,comparison,layers}`. Defaults: `{age:8,scene:'possibilities',selected:false,overview:false,inspect:null,comparison:'gap',layers:[]}`. `inspect` is null or an authored age. `layers` is a canonical ordered subset of `['pattern','starting']`. The age-12 comparison may be inspected from age 8 as looking ahead. Other future inspections normalize to null.
- Query keys are `age`, `selected=1`, `overview=1`, `inspect`, `choice` (build/repair; omit gap), `layers` (comma-separated); hash is `#possibilities` or `#learning`. Unknown parameters are removed while retaining the hosting pathname.
- `transition` merges a change then normalizes it. Explicit age changes clear inspection, comparison, layers and overview. Setting `inspect:12` enables `selected:true`. Setting another inspect clears comparison/layers; changing scene preserves them. Returning (`inspect:null`) resets comparison/layers but preserves today. Whole-map toggles only framing.
- `makeMap(age)` returns `{anchor,anchors,spine,past,future,branches,focus}`. Geometry is arrays of sampled `{x,y}` points, not SVG path strings. Spine/past/future join exactly at the authored age anchor; every route's x is nondecreasing. Preserve original anchor positions and overall 1260 × 540 drawing bounds. Branch records retain `originAge` and `state` plus `points`; richer backgrounds are contextual, not statistical.
- `comparisonRoutes(mode)` returns authored `{id,points,label,status}` routes whose IDs correspond to outcomes in `COMPARISONS`. Gap identifies foundations requiring work and the missed first course intake. Build shows the recipe-ratio route and course readiness; repair adds named intermediate work and a later intake without reopening the missed one. Curves progress rightward; the graph differs semantically and geometrically across modes.
- `pointOnRoute(points,progress)` clamps progress to [0,1], samples by cumulative segment length and returns a finite coordinate; zero-length/single-point routes return that point.

- [x] Write behavioral tests before model changes, run them and record RED. Catch a forgotten age reset, lost layer state, future-as-memory normalization, collapsed outcome sets, premature repair eligibility, backward geometry and incorrect length sampling. Retain existing motion tests; update obsolete SVG-string expectations to equivalent geometric behavior.

```js
assert.equal(readState('https://example.test/?age=40&selected=1&inspect=12&choice=repair&layers=pattern#learning').inspect, 12);
assert.deepEqual(transition(readState('https://example.test/?age=40&selected=1&inspect=12&choice=repair'), {age:16}),
  {age:16,scene:'possibilities',selected:true,overview:false,inspect:null,comparison:'gap',layers:[]});
assert.deepEqual(pointOnRoute([{x:0,y:0},{x:3,y:0},{x:3,y:4}], 0.5), {x:3,y:0.5});
assert.equal(comparisonRoutes('repair').find(r => r.id === 'first-intake').status, 'missed');
```

- [x] Implement content and pure functions. Use the exact fictional sequence in 008; summarize sentences naturally without changing mechanisms. Use monotone-x interpolated geometry (piecewise cubic easing or sampled smooth lines) with no horizontal reversal. Implement state normalization through one shared path used by parser, serializer and transition.

```js
const fields = new URLSearchParams({age: String(state.age)});
if (state.selected) fields.set('selected', '1');
if (state.overview) fields.set('overview', '1');
if (state.inspect !== null) fields.set('inspect', String(state.inspect));
if (state.comparison !== 'gap') fields.set('choice', state.comparison);
if (state.layers.length) fields.set('layers', state.layers.join(','));
const url = new URL(input);
url.search = fields.toString();
url.hash = state.scene === 'learning' ? 'learning' : 'possibilities';
```

Apply this serialization to normalized state. Every field above must round-trip and each invalid field must fall back independently. Valid inspection implies selected state during URL normalization as well as transition.

- [x] Run `node --test tests/model.test.js tests/story.test.js`; verify finite bounded routes, deterministic replay, all ages, three distinct consequence views, reading generation and escaping. Self-review and commit this task only. Implemented in fe5a3ca with 26 passing tests; support-availability clarification ee81831 passed scoped re-review. Browser integration remains Task 2.

## Task 2: Tailwind build, Canvas interaction and layered reading shell

**Files:** Create `vite.config.js`, `tests/build.test.js`, `tests/rewrite-browser-checks.js`, `prototype/decision-view.js`; modify `package.json`, `.gitignore`, `prototype/index.html`, `prototype/styles.css`, `prototype/app.js`, `prototype/map-view.js`. Commit the package lockfile. Remove no unrelated assets.

**Consumes:** Task 1 interfaces above. **Produces:** `npm run dev` at 4600, `npm run build` producing static `dist/`, `npm run preview` at 4601; `/prototype/` remains the entry. `createMapView({canvas,overlay,onInspect,onPreview,lessMotion})` returns `{show(state,animate),cancel()}`. `renderDecision(state)` updates the existing semantic decision panel without replacing focused controls.

- [ ] Write acceptance checks before implementation. Browser suite is the existing tool-compatible async `(page) => {}` expression; use `http://127.0.0.1:4600/prototype/` and accessible controls. Start a temporary view of the old app on 4600 if needed to observe expected missing-comparison assertions. Stop only verified project listeners, not unrelated processes.

```js
await page.goto('http://127.0.0.1:4600/prototype/');
await page.getByLabel('Example age').selectOption('40');
await page.getByRole('button', {name:'Explore this moment', exact:true}).click();
await page.getByRole('button', {name:'Compare a choice at age 12', exact:true}).click();
await page.getByRole('button', {name:'Build the foundation', exact:true}).click();
if (!(await page.getByText('Another possible choice', {exact:true}).isVisible())) throw new Error('Missing comparison explanation');
```

- [ ] Install locally built Tailwind/Vite with compatible pinned versions. Add a local plugin that replaces `<!-- READING_CONTENT -->` in HTML with `renderReading()` during dev and build. Include the result in the reading dialog and the no-script alternative without maintaining separately authored copies. Preserve root-relative asset resolution under a hosting subpath by using Vite's relative build base.

```js
server: { host: '127.0.0.1', port: 4600, strictPort: true },
preview: { host: '127.0.0.1', port: 4601, strictPort: true }
```

In addition to strict defaults, reject explicit CLI/config port overrides outside 4600–4699. Test this project-specific guard without opening forbidden listening sockets. Use Node's test runner for the guard and rendered static reading output; never test config by grepping source strings.

- [ ] Rewrite the reading shell using Tailwind utilities and `@theme` tokens. Use `hidden` consistently, visible focus rings, native buttons/details/dialogs, and the existing collapsible index. Keep the learned-fractions scene and tennis detour, use Mika consistently, and preserve the About/source utilities. Opening controls retain `#example-age`, `#explore`, `#reduce-motion`; Canvas is `#life-map` with `data-motion`, HTML overlay is `#map-overlay`. Comparison buttons: “Leave the gap”, “Build the foundation”, “What could help next?”. The primary entry to comparison is “Compare a choice at age 12”.
- [ ] Draw Canvas at device-pixel-ratio resolution with CSS-pixel coordinate transforms. Read palette from CSS custom properties. Render original background routes, dark traveled route, clear dashed untaken routes, lighter futures, a dotted today divider and localized traveling dot. Overlay native age/moment buttons transformed by the same camera; maintain readable label size and at least 44px hit areas. Hide offscreen map targets from focus, but retain the full visible earlier-moments text list.
- [ ] Implement one requestAnimationFrame chain. New selection cancels it; scene changes, resize and reduced-motion changes cancel safely. Arrival travels then zooms; comparison traces only the affected local routes. At rest there is no animation. Pointer proximity on authored traveled segments previews the corresponding moment, with no URL mutation. Native overlay/text controls open it on click/tap/keyboard.
- [ ] Add the authored decision panel, three comparison views, named HTML route outcomes and two inline layers. Render “Looking ahead: age 12” or “Looking back: age 12” correctly. Today remains the selected age. Gap/build/repair alter both the route geometry and labeled availability. Pattern layer shows successive practice occasions; circumstances remain visible, not relegated to an optional note. Return-to-today, overview, scene navigation and deep dives preserve the state contract.
- [ ] Keep URL/history, modal focus restoration, skip link, manual/system motion preference behavior and tablet index trapping. Handle Canvas null/failure by retaining working HTML comparisons. No JavaScript still supplies the whole worked reading explanation. Error paths must not hide all teaching content.
- [ ] Run model/build tests, build the static output, and the rewritten browser checks. Before handing off, verify keyboard focus retention, rapid selection, return to today, comparisons/layers/history/reload, resizing, index/dialog edge cases and reduced motion. Self-review and commit only this task.

## Task 3: Two visual refinement loops, regression checks and handoff

**Files:** Modify the Task 2 UI/test files only as justified by observed issues; update `prototype/README.md`, `NEXT_STEP.md`, `COMPLETED.md`, `AGENTS.md`, `docs/product/README.md`, documents 008/009 and `docs/design/prototype/README.md`. Save new screenshots under `docs/design/prototype/rewrite/`. Update the old browser suite to the current entry/interaction contract or replace its invocation with the new suite; leave no supported launch/test path on port 4173.

**Consumes:** The running Task 2 prototype and browser checks. **Produces:** a visually inspected working local rewrite with precise test evidence and clear remaining release limits.

- [ ] Review before refining: capture overview, selected older age, age-12 gap/build/repair, expanded pattern layer and learning scene at the three target viewports. Inspect images and live motion. Record actual issues, then make targeted improvements. This is visual loop 1; retain before/after captures.
- [ ] Inspect the improved result again, including label/route alignment after resize, gray-route/divider contrast, first-screen hierarchy and reading length. Make a second real improvement based on those observations; retain the second before/after capture set. New behavioral bugs require a reproducing failing check before fixing.
- [ ] Run all Node tests and the build; run the saved Playwright suite on the development port and smoke-test built output on 4601. Test direct navigation, Canvas failure and JavaScript-disabled reading. Check console errors and overflow, and confirm the old project listener on 4173 is gone.

```sh
npm test
npm run build
git diff --check
```

- [ ] Update documentation to current implementation facts: installation is now required, ports are bounded, the fictional comparison/layers exist, two actual visual loops are recorded, and browser checks are not physical-iPad or full accessibility certification. Keep source research canonical. Mark completed work only after evidence is available. Commit the verified revision and provide a local review URL without publishing.

## Review gates

Each task has an independent specification/code review. After Task 3, review the complete revision against 008, especially semantic consequences, port guard behavior, static reading parity and state restoration. Resolve important findings and verify their fixes before handoff.
