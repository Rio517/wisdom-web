# Interactive map: browser review

Status: local prototype ready for owner visual review; not a production release. Reviewed: 2026-09-06.

[Run the prototype](../../../prototype/README.md) · [Product scope](../../product/007-interactive-map-prototype.md) · [Visual requirements](../../product/003-visual-language-and-navigation.md)

## Current rendered views

- [Opening, desktop](opening-desktop.png): the full field of winding possibilities before selecting a moment.
- [Selected age 40, desktop](settled-desktop.png): dark-green traveled route, faint untaken alternatives and light gray-green futures.
- [Selected age 16, tablet landscape](settled-tablet-landscape.png).
- [Selected age 40, tablet portrait](settled-tablet-portrait.png).
- [Learning scene, tablet portrait](learning-tablet.png): one fictional foundation-to-application example with the existing illustration study.

These are full-page browser captures. Pages scroll vertically; the images do not imply all content fits within one viewport. The SVG is original code-native geometry, not a tracing or rasterization of the supplied reference.

## Verification surface

The two-scene study has been inspected at 1440 × 1000, 1133 × 744, and 744 × 1133 CSS-pixel viewports. These are browser viewport tests, not physical iPad or Safari tests. Phone design is deferred.

The browser checks in [tests/browser-checks.js](../../../tests/browser-checks.js) exercise selection, rapid retargeting, map-keyboard activation, full-map return, scene/deep-example return, history/reload, skip navigation, tablet index focus, manual/system reduced motion, live resize and viewport overflow. [Model tests](../../../tests/model.test.js) cover state normalization, share URLs, path connectivity/classification, deterministic geometry, framing and travel-before-zoom sequencing.

A browser animation trace observed the dot partway along the route at approximately 162 ms and 328 ms, at its destination around 500 ms, camera focusing at approximately 662 ms, and a quiet settled state afterward. The authored duration is 750 ms. These observations establish sequence in this browser, not a universal frame-rate or device-performance guarantee.

The settled marker has no lingering halo. The active age label maintains approximately 16 CSS pixels through map zoom and viewport resizing. The meaningful copy and legend remain readable independently of the intentionally faint contextual routes. A separate JavaScript-disabled browser context displayed the static map explanation.

Independent code review and a scoped re-review found no remaining Critical or Important issues after the history/dialog and manual-motion preference corrections. This is a prototype-review gate, not production certification.

## Review inputs

The [first desktop overview](reviews/choices-desktop-review-1.png), [first desktop interaction capture](reviews/choices-desktop-settled-1.png), and [first tablet capture](reviews/choices-tablet-review-1.png) are earlier review inputs. The first interaction capture can include in-flight motion; its filename is not evidence of a settled frame.

The [second desktop overview](reviews/choices-desktop-review-2.png), [second tablet capture](reviews/choices-tablet-review-2.png), and [learning input](reviews/choices-learning-tablet.png) retain the next review inputs. Concise review/improvement history belongs in [COMPLETED.md](../../../COMPLETED.md).

## Remaining judgments

Owner review must establish whether the map communicates freedom and the arriving-at-today transition as intended. Reader comprehension near age eight has not been tested. Production work still needs self-hosted type selection, Safari/physical-tablet checks, a complete accessibility and contrast review, the rest of the narrative, and hosting integration. The early whole-life map illustrates possibilities; it does not yet animate how a particular learning choice creates a new option.
