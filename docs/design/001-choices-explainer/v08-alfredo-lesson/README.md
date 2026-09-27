# v08 — Choices lesson and optional hike

Created: 2026-09-14. Status: local implementation; owner review pending. Not published.

Current revision: [The paths we make — Draft 02](../../../content/choices-story.md). The main explanation covers possibilities, accumulated effects, and circumstances plus resilience. It uses the full-width life map with a right-side hideable story card, leaving the origin clear. Alfredo’s four-scene hike is a separate optional example. On portrait tablets, the full-width diagram comes before the text so neither covers the other.

Question: does the general explanation stand on its own, with an unobscured life-map origin and the hike clearly subordinate? Optional map exploration must still preserve geometry and permit earlier choices to be revisited.

Sources: [current editable story](../../../content/choices-story.md), [earlier storyboard and evidence](../../../product/011-choices-hiking-storyboard.md), [implementation plan](../../../product/012-choices-lesson-implementation.md), [live source](../../../../prototype/choices.html). These are code-rendered captures, not generated images; no image prompt is involved.

This is a new entry beside the older prototype. The path lab and its algorithm remain unchanged. Captures use numbered revisions; browser emulation is not physical iPad or child usability testing.

## Current review images

- [Main opening, desktop v12](core-opening-desktop-v12.png)
- [Choices adding up, desktop v12](core-accumulation-desktop-v12.png)
- [Circumstances and optional example entry, desktop v12](core-control-desktop-v12.png)
- [Main opening, landscape v11](core-opening-landscape-v11.png)
- [Main opening, portrait v11](core-opening-portrait-v11.png)
- [Optional hike and return control, desktop v11](example-resilience-desktop-v11.png)
- [Optional hike and return control, landscape v11](example-resilience-landscape-v11.png)

Live entry: <http://127.0.0.1:4600/prototype/choices.html>. Compiled preview uses the same path on port 4601.

## Main-first revision review

Reviewed v11 at desktop, landscape and portrait sizes: the life-map origin and early fan remain clear, the three core scenes keep the overview, and the hike is a separate labeled detour with a return control. Corrected the static introduction’s stale “one fictional example” wording and made disabled Back controls visibly inactive. Rechecked all three core views in compiled preview v12.

Model and runtime reviews found no remaining actionable defects. Browser checks verify that the core can finish without the hike, the example restores the reader’s core scene and completion, exploration preserves either track, and the example starts collapsed in static reading. The chart algorithm is unchanged.

## Earlier hike-led review images

- [Opening, desktop v07](opening-desktop-v07.png)
- [Map with text hidden, desktop v07](map-only-desktop-v07.png)
- [Turning back, desktop v07](turnback-desktop-v07.png)
- [Preparing another try, desktop v10](retry-desktop-v10.png)
- [Resilience, desktop v07](resilience-desktop-v07.png)
- [Opening, landscape v08](opening-landscape-v08.png)
- [Preparing another try, landscape v09](retry-landscape-v09.png)
- [Resilience, landscape v09](resilience-landscape-v09.png)
- [Resilience, portrait v07](resilience-portrait-v07.png)

## Earlier full-width revision review

1. Reviewed v05 at desktop and portrait sizes. The overlay covered the life-map root and some hike landmarks. Shortened duplicated interface text, tightened the card, reserved clear space in wide hike diagrams and put the portrait diagram first. Rechecked v06.
2. Reviewed v06–v08. Removed the scene label underneath Hide text, added a bridge where the open trail crosses the stream, and corrected landscape control/heading and Start-label overlaps. The final landscape controls occupy their own grid row. Revisions 09–10 correct the retry diagram to show a planned route, not an already completed hike, and clear its preparation label and the landscape life-map thumbnail. The desktop v09 capture retained an older loaded page; v10 is the verified fresh-build capture.

Independent review caught an obsolete extra closing question in continuous reading and stale index topics; both are corrected. Browser regressions cover root and label obstruction, text visibility, finishing with text hidden and closing the index after topic selection. The path-generation and exploration engines are unchanged.

## Earlier implementation review

Revisions v01–v04 preserve the earlier two-column story. Revisions v05–v08 are intermediate full-width checks; they are not all current recommendations.

Two visual review/improvement loops preceded these captures:

1. Reviewed opening and first-hike desktop/portrait v01. Corrected the tablet sidebar covering content, landscape grid overflow and unnecessary empty space before the stacked diagram. Also corrected scene navigation from exploration, comparison focus and Canvas-failure reading placement.
2. Reviewed later-hike, world and exploration desktop v02. Balanced the desktop text/map columns so the third scene fits the review height; enlarged weather-inset labels with a full-width diagram; shortened repeated choice metadata; corrected the exploration caption and fragment navigation; added a visible completion state. Revision 03 confirms these changes at desktop and tablet sizes.

The historical `steps-portrait-v02.png` capture actually shows exploration: its attempted scene fragment was ignored while exploring. It is retained as evidence of that bug, not presented as a first-hike review image. The corrected first-hike capture is v03.

The browser suite checks actual behavior, not just screenshots: preview without base-map repaint, connected commit and revisit, persistent story state, input confirmation, keyboard, pointer/touch gestures, reduced motion and static reading. A frozen initial Today fan preserves the entry drawing; revisited alternatives use the existing graph instead of generating a fresh fan. Independent review prompted an actual generated static-map SVG, native choice-button semantics and post-commit/revisit focus restoration. Those findings were corrected and independently rechecked; v04 also verifies settled footsteps and the no-JavaScript diagram.

Verification results for the current pass are in [NEXT_STEP.md](../../../../NEXT_STEP.md#run-and-verify). The older full browser suite was not rerun for this bounded revision.

Limits: no physical iPad/Safari testing, child comprehension testing, complete accessibility audit, publication or production approval. The map is not evidence about how many choices a person has.
