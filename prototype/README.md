# Layered choices prototype

This directory contains the implemented local study specified by [008 — Choices and consequences](../docs/product/008-choices-and-consequences.md). Tailwind supplies the shared layout, spacing and type system; Canvas 2D draws the routes; semantic HTML supplies controls, labels and the complete reading alternative. It is not the complete choices chapter, the production website or a published build.

## Install and run

Use Node 22.12 or newer. The verified workspace version is Node 26.7.0. From the repository root:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4600/prototype/>. Development defaults to port **4600** and build preview to **4601**. Both bind only to `127.0.0.1`, reject conflicts, and reject explicit ports outside the project-wide **4600–4699** range.

To build and inspect the static output:

```sh
npm run build
npm run preview
```

Then open <http://127.0.0.1:4601/prototype/>. The build uses relative asset paths so it can remain under a hosting subpath. No publication or production routing is included.

## Implemented study surface

- One fictional Mika comparison at age 12: leave a learning gap, build a foundation, or work back toward a later opportunity with support.
- Authored context at ages 8, 12, 16, 25, 40 and 60, while keeping selected “today” separate from the moment being inspected.
- An abundant, deterministic, forward-moving route field with dark-green traveled, dashed gray untaken and gray-green possible routes; numbered square annotations connect named consequences to comparison routes.
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

With development running on 4600, execute [tests/browser-checks.js](../tests/browser-checks.js) through the session’s Playwright page-function runner. It is an async function accepting a Playwright `page`, not an `@playwright/test` file and not part of `npm test`. The saved suite covers ten groups: direct and historical state, rapid retargeting, focus/pointer previews after scroll, comparison/layer restoration, dialogs and navigation, tablet index focus, reduced motion, resize/overflow, Canvas failure and JavaScript-disabled reading. Browser tool names are session-specific; future sessions should discover the available runner.

The minimum study viewports are 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels. These browser checks are not physical-iPad or Safari testing, reader-comprehension evidence or complete accessibility certification. Phone design remains deferred.
