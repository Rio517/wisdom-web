> **Note (2026-09-27):** the production site now lives in `src/` (Astro). The shared path engine moved to `src/engine/`, and these studies import it from there. Run them with `npm run dev:prototype` on port 4602 (preview 4603).

# Choices prototypes

The current entry is [choices.html](choices.html): a short lesson about life’s possibilities, accumulated choices and circumstances, with an optional Alfredo hiking example. [011](../docs/product/011-choices-hiking-storyboard.md) and [012](../docs/product/012-choices-lesson-implementation.md) retain the earlier hike-led implementation context. Compiled Tailwind supplies layout and styling, Canvas draws the life map, and shared SVG diagrams support the guided and continuous reading views. This is local, unpublished work, not a production release.

The separate [path lab](path-lab.html) retains the working algorithm and tuning controls. [index.html](index.html) preserves the earlier Mika study specified by product 008; it is not the current lesson.

The [editable lesson draft](../docs/content/choices-story.md) separates the three-part main explanation from the optional four-scene hike. The life map spans the page, with compact hideable text on the right. The hike preserves its two setbacks and return to the main lesson; it is not required to complete the explanation.

## Install and run

Use Node 22.12 or newer. The verified workspace version is Node 26.7.0. From the repository root:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4600/prototype/choices.html>. Development defaults to port **4600** and build preview to **4601**. Both bind only to `127.0.0.1`, reject conflicts, and reject explicit ports outside the project-wide **4600–4699** range.

To build and inspect the static output:

```sh
npm run build
npm run preview
```

Then open <http://127.0.0.1:4601/prototype/choices.html>. The build uses relative asset paths so it can remain under a hosting subpath. No publication or production routing is included.

## Choices lesson

- Three main scenes, an optional four-scene hike with two setbacks, and two deeper readings within the example. Main navigation never automatically enters the hike.
- Explore map / Resume story preserves the scene. Mouse hover previews in blue; an unambiguous click chooses. Touch previews before explicit confirmation. Keyboard choices and Previous/Next choice provide alternatives to the drawing.
- Earlier-fork revisits retain the existing future until a different branch is confirmed. Gray alternatives explain their earlier divergence and cannot be chosen directly.
- Confirm an example age from 0 to 70 to create a new drawing. Editing the field alone does nothing. Generation occurs once per confirmed age; exploration reuses that frozen graph, including its initial Today fan. The graph is an illustration, not a prediction or measurement of opportunities.
- Shared authored content and diagrams appear in the reading dialog, no-JavaScript page, print and Canvas-failure fallback. Reduced motion settles immediately.

Run [tests/choices.browser.js](../tests/choices.browser.js) through the session's Playwright page-function runner after opening the dev or preview entry. This browser suite is separate from `npm test`; it chooses port 4601 when the current page is on preview, otherwise 4600. The real-controller pointer fixture runs on development, where source modules are available. [Current versioned screenshots and review limits](../docs/design/001-choices-explainer/v08-alfredo-lesson/README.md).

## Earlier Mika study (preserved)

- One fictional Mika comparison at age 12: leave a learning gap, build a foundation, or work back toward a later opportunity with support. Each view includes three illustrative practice occasions in the optional pattern layer.
- Authored context at ages 8, 12, 16, 25, 40 and 60, while keeping selected “today” separate from the moment being inspected.
- An abundant, deterministic, forward-moving route field from birth, with dark-green traveled, solid gray untaken and gray-green possible routes. The map is entirely flat; the Path view buttons offer full context, fading alternatives and quiet context while preserving the same graph and scenario. Branch alpha fades are presentation only; the page-edge mask remains an additional boundary fade. Plain dots retain 44px accessible hit areas without visible numbers. Compact named callouts connect comparison routes to the same consequences listed below.
- A reusable [procedural network API](../docs/product/010-procedural-choice-network.md): frozen version/config/seed metadata, independent branch growth with shared crowding, graph-derived Today and reachability, explicit or seeded route assumptions, earliest missed-fork metadata, and stable choice-point annotations. See [path-network.js](path-network.js) and [map-settings.js](map-settings.js) for controls. The API supports arbitrary ages; the current UI retains its six authored moments. No scenario editor is implemented.
- A collapsible index, direct URL/history restoration, earlier-moment pointer/focus previews, keyboard controls, interruptible motion and a persistent manual less-motion choice.
- Inline explanations for repeated occasions, accumulated learning, practical setup, a behavior-specific routine and circumstances outside Mika’s control. The optional “Why this example?” note links to the canonical research and the separate habits proposal.
- A second learning scene using Mika consistently, plus the related-racket-sport detour.
- One generated static reading explanation shared by the reading dialog, Canvas-failure fallback and JavaScript-disabled page.

## Verify

Run the Node model/build/story tests and build:

```sh
npm test
npm run build
git diff --check
```

With development running on 4600, execute [tests/browser-checks.js](../tests/browser-checks.js) through the session’s Playwright page-function runner. It is an async function accepting a Playwright `page`, not an `@playwright/test` file and not part of `npm test`. The saved suite covers flat Canvas strokes and higher-resolution backing, unnumbered controls, stable/restorable visibility variants, direct/history state, rapid retargeting and arrival, focus/pointer previews after scroll, comparison/layer restoration, dialogs and navigation, tablet index focus, reduced motion, resize/overflow, Canvas failure and JavaScript-disabled reading. Current verified counts are in [NEXT_STEP](../NEXT_STEP.md#run-and-verify). Browser tool names are session-specific; future sessions should discover the available runner. Use a fresh page for each suite invocation so diagnostic Canvas hooks do not accumulate.

Earlier Mika evidence is in [design study 001, round v06](../docs/design/001-choices-explainer/v06-flat-canvas/README.md). Its browser suite does not verify the newer Alfredo lesson. The tuning UI now exists separately in path-lab.html; the current lesson evidence is in round v08.

The minimum study viewports are 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels. These browser checks are not physical-iPad or Safari testing, reader-comprehension evidence or complete accessibility certification. Phone design remains deferred.
