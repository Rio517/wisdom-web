# Current state and next steps

## Current state

[008 — Choices and consequences](docs/product/008-choices-and-consequences.md) is implemented as a narrow local prototype under the approved [009 implementation plan](docs/product/009-layered-choices-implementation.md). Node/build checks, the final development browser suite, built-preview smoke tests and two visual refinement loops pass; independent review remains in progress. The prototype is not the complete chapter, has not been merged or pushed, and is not published.

The rewrite uses locally installed Tailwind and Vite, Canvas 2D routes, plain JavaScript modules and semantic HTML. It provides:

- one fictional Mika comparison at age 12 with gap, foundation-building and supported-repair views;
- distinct selected-today and inspected-moment state for ages 8, 12, 16, 25, 40 and 60;
- named route consequences, repeated-choice and next-start layers, always-visible circumstances and an optional research note;
- an abundant forward-moving route field, beginning-to-today travel, modest focus motion and collision-aware outcome annotations;
- direct URL/history restoration, pointer/focus and click/touch/keyboard access, reduced motion, dialogs and the collapsible index;
- one authored static explanation shared by the reading dialog, Canvas fallback and JavaScript-disabled page; and
- the second learning scene and related-sport example, now using Mika consistently.

The audience remains ages 8+, with the core explanation approachable from age eight and useful depth for older readers. The example illustrates mechanisms rather than predicting a reader’s life. Preparation, qualifications, support, circumstances and chance all matter. Habits/daily practice remain a separate linked chapter with only a short bridge here; relationships remain outside the first release.

The public repository is [Rio517/wisdom-web](https://github.com/Rio517/wisdom-web). Current work is on local branch `prototype/choices-map`. The complete chapter, production Astro site, approved production artwork and publication remain outstanding.

## Immediate next work

1. Complete the independent acceptance/code review against 008. Resolve important findings before changing 009’s status from in progress.
2. Obtain owner judgment on whether the fictional comparison clearly communicates action, repeated pattern, circumstances, deadline and supported recovery. Run a short comprehension check near age eight and with older readers.
3. Decide how to integrate the local prototype branch. It is not pushed, merged into `main` or published.
4. Extend the two-scene study into the complete choices chapter: later child/adult examples, the enjoyment/learning feedback loop, recovery, the habits bridge and an ending.
5. Write the production implementation plan after prototype review. Select and package production fonts, test Safari and a physical tablet, perform a complete accessibility review and configure hosting before publication.

When preparing the later habits chapter, extend research on children/families, changing established habits, interruptions and differing support needs. These gaps do not block the lifetime chapter. The existing Markdown research library remains the canonical source; no separate research UI exists.

## Run and verify

Use Node 22.12 or newer. Install dependencies, then run development on <http://127.0.0.1:4600/prototype/>:

```sh
npm ci
npm run dev
```

Build and inspect static output on <http://127.0.0.1:4601/prototype/>:

```sh
npm test
npm run build
npm run preview
git diff --check
```

All project development, preview and test servers must use ports **4600–4699**, bind to `127.0.0.1`, and fail on conflicts. Development defaults to **4600** and preview to **4601**. [tests/browser-checks.js](tests/browser-checks.js) is the single supported Playwright page-function suite; invocation guidance is in [prototype/README.md](prototype/README.md).

All 37 Node tests pass. They cover state normalization, finite and bounded geometry, authored story/readout parity, project port guards and the guided document’s semantic order. The saved development browser suite passes all ten interaction groups at 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels, including Canvas failure and JavaScript-disabled reading.

## Review limits

Browser viewport checks do not establish behavior on a physical iPad or Safari. They are not reader-comprehension evidence or complete accessibility certification. Phone design is deferred. The generated brain image is exploratory and decorative, not approved production art or an anatomically validated diagram. No live site is configured.

## Documentation rules

Keep this file about current state and next actions. Put concise history in `COMPLETED.md`. Keep research claims and limits in the canonical topic findings and ledgers. Specific proposals use stable numbered files under `docs/product/`; do not mark 009 complete until its browser and independent review gates pass.
