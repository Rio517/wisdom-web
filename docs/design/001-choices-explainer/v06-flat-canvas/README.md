# v06 — Flat Canvas

Created: 2026-09-07. Status: three visibility treatments implemented and locally verified; owner visual selection pending.

## Review question

Does the accepted [v06 artwork composition](../v05-reference-and-modern/dimensional-v06.png) work as an entirely flat, interactive opening map? This round includes refinements of the same code-native diagram, not new top-level design studies.

The current drawing is **not visually accepted**. The approved retained/fading/hybrid comparison in [product 010](../../../product/010-procedural-choice-network.md#current-visual-refinement) is implemented with heavier strokes, at least 2× Canvas backing resolution and a larger opening burst. An additional collapsible tuning panel is proposed, not built; the existing three-button selector and internal settings/URL layer work now.

## Source and contract

- [Network generation and scenario projection](../../../../prototype/path-network.js), [model adapter](../../../../prototype/model.js), [Canvas renderer](../../../../prototype/map-view.js), [Tailwind styles](../../../../prototype/styles.css), [semantic interface](../../../../prototype/index.html).
- [Procedural mechanism](../../../product/010-procedural-choice-network.md), [short-lesson scope](../../../product/001-choices-experience.md), [comparison contract](../../../product/008-choices-and-consequences.md), [prior implementation plan](../../../product/009-layered-choices-implementation.md).
- [Network tests](../../../../tests/path-network.test.js), [adapter tests](../../../../tests/model.test.js), [canonical browser checks](../../../../tests/browser-checks.js).

Routes use independent branch clocks with shared crowding awareness. The graph supplies connectivity, Today and route state. Dark green is completed history, light green is a reachable future, and faint gray is untaken in this fictional scenario—not permanently impossible in real life. Routes move forward, and vertical position is not a score.

Preserve the compact upper-right key, bottom Today label, plain unnumbered dots, semantic controls and flat rendering. No shadows, highlights, bevels or shaded dots. Boundary and per-branch opacity masks change visibility, never graph state or scenario history.

## Current comparison capture series

The approved visibility comparison uses `retained-desktop-vNN.png`, `fading-desktop-vNN.png` and `hybrid-desktop-vNN.png` within this round. Each revision shares its seed, example age and network settings. Opening captures continue the existing `opening-desktop-vNN.png` series. Tablet captures continue their existing named series. These are original Canvas browser captures; do not overwrite a reviewed revision.

| Current view | Browser capture | What to compare |
| --- | --- | --- |
| Opening | [Opening v06](opening-desktop-v06.png) | More branching near birth; no selected history. |
| Full context | [Retained v04](retained-desktop-v04.png) | Every untaken gray alternative remains; the densest treatment. |
| Fading alternatives | [Fading v04](fading-desktop-v04.png) | Untaken subtrees disappear over a distance from the missed fork. |
| Quiet context | [Hybrid v04](hybrid-desktop-v04.png) | Most alternatives fade; four selected context routes and their ancestry remain faintly visible. |
| Tablet portrait | [Portrait v04](today-tablet-portrait-v04.png) | Quiet context at 744 × 1133. |
| Tablet landscape | [Landscape v04](today-tablet-landscape-v04.png) | Fading alternatives at 1133 × 744. |

All three desktop v04 captures use network seed `choices-network-1`, choice seed `mika-example-14`, age 40, opening burst 0.8, split rate 0.78, curvature 4.8, congestion 1.15, line width 2.2 CSS pixels and fade distance 400 drawing units. The configured tip budget is 151; it is a drawing cap, never a count of life opportunities. See [settings source](../../../../prototype/map-settings.js) and [presentation source](../../../../prototype/path-presentation.js). The map remains illustrative; this seeded example's downward history does not represent declining success.

## Earlier intermediate evidence

These superseded captures preserve earlier feedback, not the current comparison:

| View | Image | Interpretation |
| --- | --- | --- |
| Procedural opening | [Opening v04](opening-desktop-v04.png) | Post-technical-review engine; the opening burst still needs to be stronger. |
| Procedural Today | [Today v09](today-desktop-v09.png) | Independent sibling departures and unique shared geometry; thin/pixelated strokes remain review feedback. |
| Procedural tablet portrait | [Portrait v03](today-tablet-portrait-v03.png) | Current intermediate diagram at 744 × 1133. |
| Procedural tablet landscape | [Landscape v03](today-tablet-landscape-v03.png) | Current intermediate diagram at 1133 × 744. |
| Previous fixed-geometry desktop | [Today v04](today-desktop-v04.png) | Superseded geometry, retained for comparison. |
| Previous tablet portrait | [Portrait v02](today-tablet-portrait-v02.png) | Historical flat layout; not a capture of the current network. |
| Previous tablet landscape | [Landscape v02](today-tablet-landscape-v02.png) | Historical flat layout; not a capture of the current network. |
| Previous comparison captures | [Gap v01](gap-desktop-v01.png), [Build v01](build-tablet-landscape-v01.png), [Repair v01](repair-tablet-portrait-v01.png) | Historical named-callout evidence, not current procedural overlay geometry. |

Open the [local prototype](http://127.0.0.1:4600/prototype/) to inspect motion. Screenshots do not establish animation quality. The Canvas is original code-native geometry, not a shipped reference bitmap. Its probabilities and resource caps are drawing controls, not counts or forecasts of life opportunities.

## Visual review and improvement loops

The three-view pass completed two additional browser review/improvement loops:

1. [Fading v02](fading-desktop-v02.png) exposed an example route with only two terminal futures at age 40. Selecting a different deterministic fictional route, without altering network geometry, preserves eight terminal futures in [fading v03](fading-desktop-v03.png). A regression protects this default illustrative fan. The counts validate the drawing fixture; they are not teaching claims.
2. [Fading v03](fading-desktop-v03.png) and [hybrid v03](hybrid-desktop-v03.png) erased the early alternatives too quickly. Extending the fade from 240 to 400 drawing units preserves a more readable opening fan in [fading v04](fading-desktop-v04.png) and [hybrid v04](hybrid-desktop-v04.png). The final retained, opening and both tablet captures were also visually inspected. Full context remains dense; the hybrid retains a quieter silhouette. The owner can compare these materially different treatments before visual acceptance.

The v01 captures and [opening v05](opening-desktop-v05.png) are integration intermediates. v02 records the stable integrated renderer before the two refinements above. Earlier versions remain unchanged.

The earlier flat pass retains [desktop v01](today-desktop-v01.png), [v02](today-desktop-v02.png) and [v03](today-desktop-v03.png), plus [opening v01](opening-desktop-v01.png) and [v02](opening-desktop-v02.png). Those iterations addressed delayed spread, dense crossings, control chrome, blank intermediate lanes and a premature biography. Their synchronized curve structure is superseded by the network engine.

The procedural pass completed two additional actual browser review/improvement loops:

1. [Desktop v05](today-desktop-v05.png) showed tangled diagonals and only three reachable future segments at age 40. Longer independent split intervals, a larger drawing budget and a different seeded example route preserved substantial branching beyond Today. [Desktop v06](today-desktop-v06.png) records that improvement.
2. [Desktop v06](today-desktop-v06.png) still spread too late. Gentler joins, stronger fork divergence, normalized crowding pressure and an early root split broadened the field in [desktop v07](today-desktop-v07.png). A reduced overall tip budget removed excess gray density while retaining the green future in [desktop v08](today-desktop-v08.png). The opening was separately inspected in [v03](opening-desktop-v03.png).

Those earlier reviews did not resolve the stroke and opening feedback; the current comparison above addresses that next pass. No new variation is approved merely because it passes technical checks.

[Today v09](today-desktop-v09.png), [opening v04](opening-desktop-v04.png) and both tablet v03 captures record the post-review engine. They were visually inspected after removing mirrored sibling divergence and duplicated departure chords. They are not the proposed heavier-stroke, larger-burst or fading variants. The technical recheck has no remaining findings.

## Verification and limits

The current verification status is maintained in [NEXT_STEP](../../../../NEXT_STEP.md#run-and-verify). Node coverage includes topology, deterministic generation, exact age boundaries, scenario overrides, annotations, resource limits and cache behavior. The canonical browser suite covers desktop and both iPad-mini viewport sizes, actual Canvas stroke properties/counts, unnumbered controls, arrival timing, named callout collisions, history/focus, reduced motion and reading fallbacks.

If callouts cannot fit, unplaceable visual labels and leaders are hidden while the complete semantic outcome list remains available below. Browser viewport checks do not establish physical-iPad or Safari behavior, reader comprehension or complete accessibility certification. Phone design remains deferred. The prototype is local and unpublished.

The later teaching pass is a roughly 2–3 minute reader-controlled [four-beat lesson](../../../product/001-choices-experience.md#chapter-sequence), with optional depth. A scenario editor, quizzes, relationships and happiness research remain outside this engine/visual pass.
