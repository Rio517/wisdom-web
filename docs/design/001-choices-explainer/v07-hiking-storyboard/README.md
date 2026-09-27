# v07 — Hiking lesson storyboard

Created: 2026-09-14. Status: v04 accepted for prototyping, with Alfredo as the character; lesson and map interactions are not implemented by this round.

Question: do the four scenes make it clear how earlier actions and learning change later possibilities, while preserving circumstances, support and uncertainty?

[Study index](../README.md) · [Canonical storyboard](../../../product/011-choices-hiking-storyboard.md) · [Originating idea](../../../choices-paths/ideas/paths-worn-by-steps.md)

This round holds a static review board and browser captures, not a new path algorithm or an implemented lesson. The HTML is a review artifact derived from product 011. Scene transitions described in the storyboard are proposed, not implemented by the board. Path images are captured from the existing local path lab; the hiking diagrams are simple authored schematics, not geographic maps or forecasts.

## Current review

The owner accepted [revision 04](storyboard-v04.html) on 2026-09-14, with the character renamed Alfredo. The [current HTML, revision 05](storyboard-v05.html), is a name-only update, apart from its revision label; layout, illustrations and behavior are unchanged. [Open locally](http://127.0.0.1:4600/docs/design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html).

The accepted v04 images below remain unchanged and retain the former character name. They record the approved design, while product 011 and revision 05 use Alfredo. No further storyboard approval is needed for this name change.

Direct image links:

- [Scene 1 — Many possibilities](scene-01-v04.png)
- [Scene 2 — Small actions add up](scene-02-v04.png)
- [Scene 3 — Learning changes the next hike](scene-03-v04.png)
- [Scene 4 — Conditions and help matter](scene-04-v04.png)
- [Map exploration — hover, pick and revisit](exploration-v04.png)
- [Tablet portrait comparison](scene-03-tablet-v04.png) [tablet landscape comparison](scene-03-tablet-landscape-v04.png) and [tablet exploration](exploration-tablet-v04.png)

The 321-word main story, navigation labels, evidence boundaries and exploration contract are canonical in [product 011](../../../product/011-choices-hiking-storyboard.md). The board’s links move between review sections; its native disclosures open extra reading. Proposed map controls are labeled illustrations, not working controls. Layout CSS is local to this document artifact, not a replacement for the application’s Tailwind layout.

## Review and improvement loops

| Pass | Inspected evidence | Finding and resulting change |
| --- | --- | --- |
| 1 → 2 | [Scene 3 v01](scene-03-v01.png), [scene 4 v01](scene-04-v01.png), [exploration v01](exploration-v01.png) | Comparison-map labels were too small; removed secondary labels and enlarged the landmarks. The picked-route illustration colored future history incorrectly and let gray extend too far; split its colors at Today and ended gray before Today. Added an explicit blue Preview label and corrected inset grid sizing. |
| 2 → 3 | [Scene 3 v02](scene-03-v02.png), [exploration v02](exploration-v02.png), [tablet v02](scene-03-tablet-v02.png) | Two-column reading plus two miniature maps cramped portrait tablets. Stacked reading and diagrams at narrower tablet widths while retaining the two comparison states. Added visible unavailable-path and story-resume annotations. |
| Revision 03 review | Revision 03 desktop scenes, exploration and portrait-tablet captures retained in this folder | Reader copy, the full path field, visible weather/help inset and distinct interaction states reviewed. This establishes a reviewable storyboard, not reader comprehension, live motion or production visual approval. |

Revision 04 reserves a stable scrollbar gutter. Element screenshots in revision 03 changed layout width when the browser expanded the capture height, clipping some edge labels. The revision 04 desktop and both tablet orientations were visually rechecked; the main copy and diagrams are unchanged. [Revision 03 source](storyboard-v03.html) remains preserved.

A separate lower-cost editorial reviewer identified ambiguous learning causality and a weather event that could disappear too quickly. The story now separates Noor’s new planning role from the group’s time/packing, and the changed trail remains visible after the pullback. A brief sunscreen routine stays because it belongs to the requested series-of-hikes example; habit training remains a later lesson.

## Exact sources and capture settings

- Reader text: [product 011](../../../product/011-choices-hiking-storyboard.md). SVG trail and reduced-fork schematics, styles and review navigation: embedded in each HTML revision ([v01](storyboard-v01.html), [v02](storyboard-v02.html), [v03](storyboard-v03.html), [v04](storyboard-v04.html), [v05](storyboard-v05.html)). No ImageGen prompt or generated artwork was used.
- Life-map source: [existing path lab](../../../../prototype/path-lab.html), Canvas element `#path-canvas`. The [beginning capture](path-beginning-v01.png) uses age 0 and selected false; the [Today capture](path-today-v01.png) uses age 12 and selected true. These are local default laminar renderings, not a claim that the owner approved these exact parameter values.
- Capture viewport: 1440 × 1000. Canvas display: 1064 × 658 CSS pixels; backing resolution: 2128 × 1316. Stored PNGs capture the display region. Storyboard desktop viewport: 1440 × 1000; portrait-tablet viewport: 744 × 1133; landscape-tablet viewport: 1133 × 744.
- Captured settings below are drawing parameters, not estimates of real-life opportunities. The internal seed name is an existing engine fixture, not the story character’s identity.

```json
{
  "seed": "choices-network-1",
  "choiceSeed": "mika-example-14",
  "variant": "fading",
  "growthMode": "laminar",
  "openingBurst": 1,
  "todayBurst": 0.75,
  "burstSpan": 3.5,
  "ageTaper": 1,
  "splitProbability": 1,
  "splitSpacing": 1,
  "firstSplitAge": 0.1,
  "endingRate": 0.01,
  "firstChildrenMin": 3,
  "firstChildrenMax": 4,
  "laterChildrenMin": 2,
  "laterChildrenMax": 3,
  "forkSpread": 150,
  "wideForkLevels": 1,
  "laterBranchSpacing": 12,
  "maxTips": 67,
  "turnStrength": 4.8,
  "turnSpacing": 9,
  "crowdingStrength": 2.75,
  "crowdingRadius": 100,
  "lineWidth": 2.4,
  "grayOpacity": 0.75,
  "fadeDistance": 650,
  "fadeFloor": 0.6,
  "todayFade": 40,
  "edgeFade": 0.04
}
```

## Review limits

Browser checks cover the document layout, section navigation, disclosures, local assets and matching reader copy. They do not verify the proposed path hit-testing, keyboard map navigation, state restoration or animation; those require implementation and behavioral tests. Physical iPad/Safari and child comprehension remain untested. Static reading and proposed motion must retain the same essential information.

Keep all reviewed revisions unchanged. The current path algorithm and application files are outside this round’s edits.
