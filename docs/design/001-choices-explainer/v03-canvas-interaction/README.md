# v03 — Canvas interaction captures

Status: existing local implementation, technically reviewed; visual direction not approved. Not a production release. Reviewed: 2026-09-06. Updated: 2026-09-07.

Question: does the Tailwind/Canvas implementation explain choices and consequences with repeated practice, circumstances and revisitable moments? These are browser captures, not ImageGen artwork. [Study index](../README.md) · [Current artwork review](../v05-reference-and-modern/README.md).

[Run the prototype](../../../../prototype/README.md) · [Revision contract](../../../product/008-choices-and-consequences.md) · [Implementation plan](../../../product/009-layered-choices-implementation.md)

## Current rendered views

- [Opening field, desktop](opening-desktop.png): unselected path abundance and opening hierarchy at 1440 × 1000.
- [Selected age 40, desktop](today-desktop.png): traveled, untaken and possible routes with the Today divider at 1440 × 1000.
- [Build the foundation, desktop](build-desktop.png): comparison controls beside the map and named consequences below it at 1440 × 1000.
- [Expanded repeated-pattern layer, desktop](pattern-desktop.png).
- [Leave the gap, tablet landscape](gap-landscape.png) at 1133 × 744.
- [Supported repair, tablet portrait](repair-tablet.png) at 744 × 1133.
- [Learning scene, tablet portrait](learning-tablet.png) at 744 × 1133.
- [Learning scene, tablet landscape](learning-landscape.png) at 1133 × 744 and [desktop](learning-desktop.png) at 1440 × 1000.
- Viewport-only details: [comparison entry, landscape](comparison-entry-landscape.png); practice occasions for [gap](pattern-gap-final.png), [building](pattern-build-final.png), [repair](pattern-repair-final.png) and [repair on tablet](pattern-repair-tablet-final.png); [JavaScript-disabled tablet reading](nojs-tablet.png).

Except for the explicitly labeled viewport-only details, these are full-page browser captures: their height includes scrolling content and does not imply that every explanation fits above the fold. The learning desktop and landscape captures retain the legitimate heading focus outline immediately after scene navigation; it is not a permanent decorative border. Canvas routes are original code-native geometry; text, controls, outcome annotations and leaders are semantic HTML/CSS over the shared camera transform.

## Two refinement loops

The first review inspected [the initial overview](overview-review-1.png) and [initial portrait repair view](repair-tablet-review-1.png). It found stale age-eight context while looking back from age 40, future moments presented as earlier decisions, a weak Today divider, oversized map controls and missing consequence markers. The first improvement derived the visible moment and earlier-decision list from state, strengthened the divider and added numbered outcome annotations. [Repair landscape](repair-landscape-review-2.png) and [repair portrait](repair-tablet-review-2.png) record the result.

The second review expanded across [overview](overview-review-2.png), [selected Today](today-desktop-review-2.png), [foundation plus pattern](build-pattern-review-2.png), [gap landscape](gap-landscape-review-2.png) and [learning portrait](learning-tablet-review-2.png). It found the comparison controls and explanation far below the routes they changed, small narrative type, circular outcome keys that resembled age markers, an outcome hidden by age 40, a contradictory reference biography during alternate comparisons and inconsistent learner naming.

The second improvement moved comparison controls immediately above the Canvas and named outcomes immediately below, followed by the action, consequence, work, circumstances and optional research note before the earlier-moment list. Narrative copy now uses a 20px reading size and secondary/control text 16px within a shared Tailwind spacing system. Outcome keys are square, use short leader lines and avoid age/Today labels deterministically; numerals remain dark while status is carried by route, border and leader. The reference biography is hidden only during comparison, while live preview feedback remains beside the map. Mika is used throughout the learning scene. The current rendered views above record this direction; [the first post-layout foundation capture](build-desktop-review-3.png) remains as evidence of the final collision/preview correction prompted by inspection.

## Verification surface

The required browser viewports are 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels. [tests/browser-checks.js](../../../../tests/browser-checks.js) is the single current Playwright page-function suite. All ten groups pass: direct and historical state, rapid age/comparison retargeting, keyboard and pointer previews after scrolling, non-12 inspection, layer/scene/dialog/history restoration, skip and index focus, manual/system reduced motion, live resize and both-scene overflow, minimum control/label sizes, Canvas failure and JavaScript-disabled reading. The run reported no console errors.

All 39 Node tests pass, covering state normalization, mixed valid/invalid fallback, shared practice occasions and compounding text, story/static-reading parity, finite bounded forward geometry including comparison routes, marker collision layout, project port guards and generated document order. The static build uses relative assets. Smoke testing on the strict 4601 preview covered a direct repair URL with four steps and both layers, current shared occasions and compounding text, the learning asset, JavaScript-disabled reading and null/throw Canvas failure, with no page errors or failed requests.

Final-review checks cover all nine combinations of gap/build/repair and required viewport sizes: outcome rectangles remain inside the map and avoid one another, age controls and the Today label. Enter on Return to today preserves the selected age and restores visible focus at ages 12 and 40. Hover/focus previews include an authored explanatory sentence. The practice disclosure contains three labeled, forward-linked occasions for the selected comparison; the same authored records appear in static reading. These are illustrative occasions within one decision, not a streak or extra lifetime branches.

The [pre-fix JavaScript-disabled tablet capture](nojs-tablet-review.png) records the fixed index obscuring reading text. The current reading-only shell hides inactive controls and provides 20px prose with clear heading and paragraph spacing. Browser hit-testing confirms that the reading heading is unobscured. The explicit comparison entry keeps the full Canvas within the 1133 × 744 viewport after adding the short compounding explanation.

The browser evidence is CSS-viewport testing, not testing on a physical iPad or Safari. It is not reader-comprehension evidence or complete accessibility certification. Phone design remains deferred. The complete chapter, production font packaging, approved artwork, hosting and publication remain outside this prototype.

## Historical views

The earlier SVG opening, settled and learning captures are grouped in [round v02](../v02-svg-interaction/README.md). They are superseded by the rewrite contract and should not be read as the current implementation. The [round v01 storyboards](../v01-reading-and-motion/README.md) remain composition references rather than screenshots of working behavior. Screenshot filenames in this frozen round retain their original review labels; new artwork uses explicit revisions in round v05.
