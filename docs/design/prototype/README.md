# Layered choices prototype: browser review

Status: local prototype ready for independent Task 3 review; not a production release. Reviewed: 2026-09-06.

[Run the prototype](../../../prototype/README.md) · [Revision contract](../../product/008-choices-and-consequences.md) · [Implementation plan](../../product/009-layered-choices-implementation.md)

## Current rendered views

- [Opening field, desktop](rewrite/opening-desktop.png): unselected path abundance and opening hierarchy at 1440 × 1000.
- [Selected age 40, desktop](rewrite/today-desktop.png): traveled, untaken and possible routes with the Today divider at 1440 × 1000.
- [Build the foundation, desktop](rewrite/build-desktop.png): comparison controls beside the map and named consequences below it at 1440 × 1000.
- [Expanded repeated-pattern layer, desktop](rewrite/pattern-desktop.png).
- [Leave the gap, tablet landscape](rewrite/gap-landscape.png) at 1133 × 744.
- [Supported repair, tablet portrait](rewrite/repair-tablet.png) at 744 × 1133.
- [Learning scene, tablet portrait](rewrite/learning-tablet.png) at 744 × 1133.
- [Learning scene, tablet landscape](rewrite/learning-landscape.png) at 1133 × 744 and [desktop](rewrite/learning-desktop.png) at 1440 × 1000.

These are full-page browser captures, so their height includes scrolling content and does not imply that every explanation fits above the fold. The learning desktop and landscape captures retain the legitimate heading focus outline immediately after scene navigation; it is not a permanent decorative border. Canvas routes are original code-native geometry; text, controls, outcome annotations and leaders are semantic HTML/CSS over the shared camera transform.

## Two refinement loops

The first review inspected [the initial overview](rewrite/overview-review-1.png) and [initial portrait repair view](rewrite/repair-tablet-review-1.png). It found stale age-eight context while looking back from age 40, future moments presented as earlier decisions, a weak Today divider, oversized map controls and missing consequence markers. The first improvement derived the visible moment and earlier-decision list from state, strengthened the divider and added numbered outcome annotations. [Repair landscape](rewrite/repair-landscape-review-2.png) and [repair portrait](rewrite/repair-tablet-review-2.png) record the result.

The second review expanded across [overview](rewrite/overview-review-2.png), [selected Today](rewrite/today-desktop-review-2.png), [foundation plus pattern](rewrite/build-pattern-review-2.png), [gap landscape](rewrite/gap-landscape-review-2.png) and [learning portrait](rewrite/learning-tablet-review-2.png). It found the comparison controls and explanation far below the routes they changed, small narrative type, circular outcome keys that resembled age markers, an outcome hidden by age 40, a contradictory reference biography during alternate comparisons and inconsistent learner naming.

The second improvement moved comparison controls immediately above the Canvas and named outcomes immediately below, followed by the action, consequence, work, circumstances and optional research note before the earlier-moment list. Narrative copy now uses a 20px reading size and secondary/control text 16px within a shared Tailwind spacing system. Outcome keys are square, use short leader lines and avoid age/Today labels deterministically; numerals remain dark while status is carried by route, border and leader. The reference biography is hidden only during comparison, while live preview feedback remains beside the map. Mika is used throughout the learning scene. The current rendered views above record this direction; [the first post-layout foundation capture](rewrite/build-desktop-review-3.png) remains as evidence of the final collision/preview correction prompted by inspection.

## Verification surface

The required browser viewports are 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels. [tests/browser-checks.js](../../../tests/browser-checks.js) is the single current Playwright page-function suite. All ten groups pass: direct and historical state, rapid age/comparison retargeting, keyboard and pointer previews after scrolling, non-12 inspection, layer/scene/dialog/history restoration, skip and index focus, manual/system reduced motion, live resize and both-scene overflow, minimum control/label sizes, Canvas failure and JavaScript-disabled reading. The run reported no console errors.

All 37 Node tests pass, covering state normalization, mixed valid/invalid fallback, story/static-reading parity, finite bounded forward geometry including comparison routes, marker collision layout, project port guards and generated document order. The static build uses relative assets. Smoke testing on the strict 4601 preview covered a direct repair URL with four steps and both layers, the learning asset, JavaScript-disabled reading and null/throw Canvas failure, with no page errors or failed requests.

The browser evidence is CSS-viewport testing, not testing on a physical iPad or Safari. It is not reader-comprehension evidence or complete accessibility certification. Phone design remains deferred. The complete chapter, production font packaging, approved artwork, hosting and publication remain outside this prototype.

## Historical views

The earlier SVG study’s opening, settled and learning captures remain in this directory and its `reviews/` subdirectory as historical evidence. They are superseded by the rewrite contract and should not be read as the current implementation. The separate [storyboard boards](../storyboards/README.md) remain composition references rather than screenshots of working behavior.
