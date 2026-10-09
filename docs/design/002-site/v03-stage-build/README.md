# v03 — Stage, built

Created: 2026-10-09. Updated: 2026-10-09. Status: built on the working branch; design review pending; not published.

Question: does the site's home page and the lesson cover, built from the picked direction ([v02](../v02-directions/README.md) · A, "Stage"), match the approved prototype at desktop, iPad and large-monitor sizes, in all four languages?

The approved spec is `prototype/directions/a.html`. Sources: `src/pages/[...locale]/index.astro`, `src/layouts/SiteLayout.astro` (the `stage` layout), `src/components/stage-field.js`, `src/styles/site.css`, `src/lessons/choices/journey.js` and `journey.css` (cover step), `src/lessons/choices/journey-map.js`, `src/engine/lab-renderer.js`.

## What was built

- **Home.** No sidebar: a top bar with the Index button (it opens the existing drawer), the brand and About. One sentence in the middle of a faint path field. "Watch the paths grow" lifts the words away (690 ms), the paths grow out of the Beginning as a widening circle (2.2 s), and one life travels to Today. Then a short line and "Start lesson 1" appear, and focus moves there. Below the stage: the lesson, the roadmap (planned lessons keep their popovers) and one line for grown-ups. The old hero, lesson card, chapter stops and "Made to be read together" band are gone, and so are their 16 unused message keys.
- **Lesson cover** (the first step, "Where can a life go?"). The stage takes the full width, and the narration panel waits. The question sits in the middle of the faint field. Begin (or →) lifts the words away and grows the paths, and then the narration panel arrives for the next step, with focus on Next. Back (or ←) returns to the cover.
- **Words** (all four catalogs, in the narrator's voice): `home.title`, `home.lede` (the summary), `home.watch`, `home.settled`, `home.lesson.lede`, `home.grownups`, and the kicker. The cover uses `lesson.beat.cover.kicker`, `map.coverQuestion`, `map.coverHint` and `lesson.beat.cover.next`.
- **Reduced motion:** the click (or →) shows the settled state at once.

## Deviations from prototype A

1. **Cover narration.** After the paths grow, the narration arrives in the lesson's right-hand panel, not as A's bottom-centred card. Every later step uses that panel, so doing it once here avoids a second layout change on the next step. The cost is one repaint of the map as it narrows (see the numbers).
2. **Edge fade.** The home stage uses A's softer right-hand fade (0.16). The lesson map keeps the owner's tuned 0.04, because the cover leaves its full width within about three seconds.
3. **Roadmap.** The home roadmap keeps each lesson's one-line summary (A showed titles only), and the page keeps the site footer.
4. **The → key** also plays the cover animation, since → moves through the lesson elsewhere.
5. **Cover kicker.** The cover's kicker uses the lesson's kicker style.

## Fixes found while building

- The paper veil behind the words now fades with them. It had cut an empty band through the growing paths on the cover.
- The scene, renderer and stage helper measure layout size, not the on-screen box. During the lesson's 98.5% fade-in a resize measured the transformed size, and the first click then repainted both canvases: a 900 ms frame.
- The lesson map paints its Today canvas only once a step shows it.

## Frame budget

Production build (preview, port 4601), headless Chromium at 1440 × 900 with 4× CPU throttling. A Performance trace plus requestAnimationFrame intervals, from the click until the paths are fully grown, three runs each:

| | Home | Lesson cover |
| --- | --- | --- |
| Frames | 157–162 | 162–164 |
| 95th percentile | 16.8–33.3 ms | 16.8 ms |
| Frames over 33.4 ms | 1–4 (33–67 ms, around the click) | 2–3 |
| Longest frame | 34–67 ms | 383–417 ms |

The longest main-thread task during the grow was under 5 ms on the home page.

The cover's grow itself holds 16.8 ms frames. Its one long frame is the map repainting at its narrower width as the narration arrives, which happens as the grow ends. The budget is therefore not fully met. The cause, as in v02: this headless Chromium composites in software, and a full-size canvas repaint is slow at 4× throttling.

## Review images

Home:
- en: 1440x900: [before](home-en-1440x900-before-v01.png) · [mid](home-en-1440x900-mid-v01.png) · [settled](home-en-1440x900-settled-v01.png); 2560x1440: [before](home-en-2560x1440-before-v01.png) · [mid](home-en-2560x1440-mid-v01.png) · [settled](home-en-2560x1440-settled-v01.png); 1024x768: [before](home-en-1024x768-before-v01.png) · [settled](home-en-1024x768-settled-v01.png); 768x1024: [before](home-en-768x1024-before-v01.png) · [settled](home-en-768x1024-settled-v01.png); 744x1133: [before](home-en-744x1133-before-v01.png) · [settled](home-en-744x1133-settled-v01.png)
- de: 1440x900: [before](home-de-1440x900-before-v01.png) · [settled](home-de-1440x900-settled-v01.png); 768x1024: [before](home-de-768x1024-before-v01.png) · [settled](home-de-768x1024-settled-v01.png)
- es: 1440x900: [before](home-es-1440x900-before-v01.png)
- fr: 1440x900: [before](home-fr-1440x900-before-v01.png)

Lesson cover:
- en: 1440x900: [before](cover-en-1440x900-before-v01.png) · [mid](cover-en-1440x900-mid-v01.png) · [settled](cover-en-1440x900-settled-v01.png); 2560x1440: [before](cover-en-2560x1440-before-v01.png) · [mid](cover-en-2560x1440-mid-v01.png) · [settled](cover-en-2560x1440-settled-v01.png); 1024x768: [before](cover-en-1024x768-before-v01.png) · [settled](cover-en-1024x768-settled-v01.png); 768x1024: [before](cover-en-768x1024-before-v01.png) · [settled](cover-en-768x1024-settled-v01.png); 744x1133: [before](cover-en-744x1133-before-v01.png) · [settled](cover-en-744x1133-settled-v01.png)
- de: 1440x900: [before](cover-de-1440x900-before-v01.png) · [settled](cover-de-1440x900-settled-v01.png); 768x1024: [before](cover-de-768x1024-before-v01.png) · [settled](cover-de-768x1024-settled-v01.png)
- es: 1440x900: [before](cover-es-1440x900-before-v01.png)
- fr: 1440x900: [before](cover-fr-1440x900-before-v01.png)
