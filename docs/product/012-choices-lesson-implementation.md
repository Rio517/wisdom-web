# 012 — Alfredo lesson implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the delegated interface task and scoped reviews. Steps use checkbox syntax.

Status: Implemented locally; verification and independent review complete; owner review pending. Created: 2026-09-14. Updated: 2026-09-14.

**Goal:** Turn the accepted Alfredo storyboard into a four-scene lesson with optional connected-path exploration.

**Architecture:** Add a dedicated `prototype/choices.html` entry alongside the existing lesson and path lab. The new lesson consumes a small map controller, while a pure exploration session owns choices over frozen generated geometry. Existing generators and the tuning page remain unchanged.

**Tech Stack:** Existing Vite, compiled Tailwind, plain JavaScript, Canvas 2D and inline SVG.

**Spec:** [011 — Choices hiking storyboard](011-choices-hiking-storyboard.md); [accepted design with Alfredo](../design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html).

## Global constraints

- Use Alfredo and the exact four-scene reader text in 011. Ages 8+; desktop and iPad mini (1440 × 1000, 1133 × 744, 744 × 1133).
- Use Tailwind by default for layout and UI styling. Development CDN is permitted, but the existing compiler is available.
- All servers: 4600–4699, localhost only; existing development 4600, preview 4601.
- Preserve the existing laminar geometry generator, lab renderer and tuning page. No publication, commits, dependency changes, new curriculum, scores or simulator.
- Blue previews never commit. Gray paths cannot be chosen directly. Selected lineage remains connected. Revisiting alone preserves prior choices; a confirmed alternative discards only dependent choices.
- Mouse click chooses; touch first previews then Use this path. Provide adjacent keyboard choice buttons, Escape dismissal, and Previous/Next choice separate from lesson Back/Next.
- Motion is brief and interruptible; reduced-motion and static reading retain all essential information. No numbered path dots.

## Task 1: Frozen map exploration and controller

**Files:** create `prototype/choices-exploration.js`, `prototype/choices-map.js`, `tests/choices-exploration.test.js`; no changes to existing generator/lab files.

**Interfaces:** `createChoicesMap({ canvas, overlay, onChange })` returns `showOverview()`, `showToday(age)`, `explore(age)`, `preview(edgeId)`, `choose(edgeId)`, `previous()`, `next()`, `revisit(pointId)`, `getState()`, `destroy()`.

State supplied to `onChange(state)`: `age`, `choices: [{ id, label, description, selected }]`, `preview: null | { id, label, description, available, revisitPointId }`, `canPrevious`, `canNext`, `status`. The controller owns pointer events, painting and resize observation. The shell owns choice buttons and their focus. Calling `explore(age)` resumes its cached exploration when age is unchanged; changing the confirmed starting age creates another frozen session. Story views do not mutate that session.

- [x] Write and run failing behavior tests for non-mutating preview, connected commits, earlier-fork alternates, unchanged graph coordinates, unavailable branches, end-of-route traversal and deterministic age sessions.
- [x] Build an adapter using existing generation/projection exports. Preserve the selected-age visual by freezing the already-generated background and Today fan for the session; connect the fan with namespaced IDs and recomputed reachability. Do not regenerate on pointer movement or route changes.
- [x] Implement an overlay above the unchanged lab renderer for blue preview and clickable earlier forks. Hit testing uses displayed coordinates and tolerance, not canvas backing pixels; ambiguous near-crossing hits are previewed and disambiguated through the adjacent list.
- [x] Run focused tests and exercise the controller through the actual lesson page.

Example behavioral contract:

```js
const before = JSON.stringify(session.network);
const original = session.snapshot();
session.preview(original.choices[0].id);
assert.deepEqual(session.snapshot().selections, original.selections);
session.choose(original.choices[0].id);
assert.equal(JSON.stringify(session.network), before);
session.previous();
assert.equal(JSON.stringify(session.network), before);
```

## Task 2: Tailwind lesson, trail illustrations and static parity

**Files:** create `prototype/choices.html`, `prototype/choices.css`, `prototype/choices.js`, `prototype/choices-story.js`, `prototype/choices-markup.js`, `tests/choices-story.test.js`. Coordinator adds the Vite input and HTML injection plugin in Task 3.

**Consumes:** Task 1 map-controller API exactly as above.

**Produces:** `CHOICES_SCENES` and `CHOICES_DEEP_DIVES` in choices-story.js; `renderChoicesReading({idPrefix='choices-reading'}={})` in choices-markup.js; entry markup with `<!-- CHOICES_READING -->` for static injection. Trail diagrams may be exported from choices-markup.js for live/static reuse.

- [x] Write focused failing tests for four-scene navigation bounds, restoring First/Later on return, preserving the lesson scene while exploring, and static rendering of the same authored paragraphs and meaningful diagram labels.
- [x] Implement the approved quiet two-column reading/map layout, collapsing to stacked content on portrait iPad. Keep the abundant map dominant; no redesign, paper textures, shadows or dimensional dots. Use the approved font and palette tokens.
- [x] Render the exact core copy from one data source. Back/Next and four-item topic navigation use named URL fragments and restore the settled scene. First/Later defaults to Later in scene 3; optional deep dives preserve its value.
- [x] Add optional Explore map and Resume story, distinct map Previous/Next choice, adjacent keyboard choices with preview/commit controls, and a confirmed example-age input from 0 to 70. No automatic regeneration while editing the age field.
- [x] Animate route emphasis/first-to-later comparison and scene transitions in 250–400 ms (final pullback at most 600 ms), cancel on new input, keep controls available, and respect reduced motion. Keep the rain/help inset visible in scene 4.
- [x] Make Read whole lesson and no-JavaScript reading available from the shared renderer, with diagrams, source links and unique IDs. Keep reflection private and unrecorded. Include collapsible navigation, About and source links without empty lesson placeholders.
- [x] Run focused tests; report red/green evidence, exact files changed and any integration concerns. Do not alter Task 1 files or Vite.

Example behavioral contract:

```js
const model = createLessonState({ scene: 'later' });
model.setComparison('first');
model.enterExploration();
model.resumeStory();
assert.equal(model.getState().scene, 'later');
assert.equal(model.getState().comparison, 'first');
```

## Task 3: Integration, browser checks and review

**Files:** modify `vite.config.js`, `tests/build.test.js`, `README.md`, `prototype/README.md`, `NEXT_STEP.md`, `COMPLETED.md`; add `tests/choices.browser.js`. Keep screenshot evidence in registered study 001 round v08.

- [x] Add a failing build test requiring `prototype/choices.html` in the build inputs and a static HTML-transform test for `<!-- CHOICES_READING -->`.
- [x] Add the entry and transform without changing existing inputs or port guards.
- [x] Run the complete Node suite, build, and browser checks on the dev and compiled pages. Check pointer hover/click, earlier fork and alternate future, keyboard choices/Escape, touch preview/confirm, age confirmation, story restoration, browser history, deep dives, no-JavaScript, reduced motion and absence of console errors.
- [x] Visually inspect desktop and both tablet layouts; perform two review/improvement loops and retain versioned captures. Keep the working path lab and existing renderer/generator hashes unchanged.
- [x] Obtain an independent scoped review for spec compliance and code quality; fix important findings and recheck the changes. Update current handoff and direct review links.

## Preflight and decisions

| Boundary | Producer / consumer check | Result |
| --- | --- | --- |
| Task 1 → Task 2 | Controller methods and state fields listed above; shell supplies its canvases and onChange | Fixed interface; no shared file writes |
| Task 2 → Task 3 | Static renderer and CHOICES_READING marker; Vite owns injection | Single copy source, separate integration ownership |
| Task 1 self-check | Frozen geometry tests versus session adapter and pointer renderer | Geometry generation remains outside interaction loop |
| Task 2 self-check | Four scenes and static copy tests versus live and reading surfaces | Scene and exploration state remain separate |
| Task 3 self-check | Existing inputs preserved; new build and browser behavior exercised | No replacement of the dirty older prototype |

The user has already approved the storyboard and asked to proceed. This plan does not reopen design approval. The current checkout contains the working uncommitted implementation; preserve it and do not use HEAD as if it contained that baseline. No commit is part of this execution.

## Verification and handoff

193 Node tests pass. Build, development browser checks and compiled-preview browser checks pass. Two visual review/improvement loops and final static-reading verification are recorded in [round v08](../design/001-choices-explainer/v08-alfredo-lesson/README.md). Independent review findings were corrected and rechecked. Existing lab/generator/renderer code remains unchanged. Owner review, physical iPad/Safari checks, reader comprehension, production integration and publication are not completed by this implementation.
