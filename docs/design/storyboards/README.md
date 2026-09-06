# Storyboards for visual review

Status: proposed visual direction, internally reviewed and ready for owner review. Created: 2026-09-06. These are generated still images, not a built website or a working animation.

[Design studies](../README.md) · [Storyboard and prototype proposal](../../product/006-storyboards-and-motion-study.md) · [Exact generation prompts](prompts.md)

## Selected boards

| Board | Image | What to review |
| --- | --- | --- |
| Reading experience | [Desktop and phone, v3](reading-v3.png) | Quiet field-guide treatment, map prominence, navigation, body copy, and responsive composition |
| Marker and path | [Four-frame motion storyboard, v3](motion-v3.png) | Immediate acknowledgment, incoming line trace, stable Today marker, and clear settled state |

Both selected images are 1536 × 1024 PNGs generated with built-in ImageGen; dimensions were checked from image metadata. Each received two image-inspection-and-refinement cycles, followed by inspection of the selected version. Exact initial and refinement prompts are recorded for reproducibility; input images were edit targets. The stored PNGs are unchanged copies of the generated output, not manually edited composites.

The earlier [reading v1](iterations/reading-v1.png), [reading v2](iterations/reading-v2.png), [motion v1](iterations/motion-v1.png), and [motion v2](iterations/motion-v2.png) remain as review inputs, not competing final recommendations. Concise review history belongs in [COMPLETED.md](../../../COMPLETED.md).

## Reading experience

The board shows the settled opening, not every interaction state. Desktop time runs left to right; phone time runs top to bottom. The solid lived path reaches Today, dashed alternatives end before Today, and future possibilities branch more than once. The six future endpoints are a schematic sample, not a count of remaining life options. Exact geometric coordinates are not an implementation specification.

The surrounding shell includes an expandable Choices index, separate About and Source code links, example-age selection, scene position, replay, continuous reading, optional depth, and Next. The small ink-and-wash brain is an illustration treatment, not an anatomical explanation. Main text and map do not depend on it.

The static phone composition shows a reflowed layout, but it does not prove that a real viewport will fit all content without scrolling. Natural vertical scrolling is acceptable; shrinking text to match this contact sheet is not. The sidebar outline is a visual sample; the actual site must derive its entries from authored scenes.

## Motion sequence

| Frame | Proposed state | Essential behavior |
| --- | --- | --- |
| Ready | Before activation | Readable map guides and a hollow Today target; equivalent Start here control |
| Acknowledge | Around 100 ms | Today fills and a small local halo acknowledges input |
| Connect | Around 350 ms | The incoming path is traced toward Today; Today remains selected |
| Settle | Around 700 ms | Connected path and possible branches are clear; transient effects are gone |

The timestamps are design targets, not measurements. Panel titles and captions are reviewer annotations, not additional text that must appear in the child-facing experience. The snapshot sequence illustrates one map with stable topology; production must use a shared SVG/data model so nodes cannot drift between states.

Reduced motion shows the settled state immediately. Next and the explanation remain available throughout. Repeated input must interrupt or retarget the current transition rather than queue it.

## Current review assessment and limits

- The selected reading board has a coherent phone time direction, explicitly labels dashed alternatives, and includes phone replay and continuous-reading controls.
- The selected motion board preserves a filled Today marker during the trace and keeps the final state free of a halo.
- Typography, color values, line widths, alignment, focus styles, and hit areas must be specified and checked in the browser. No contrast or accessibility conformance is claimed from the images.
- Build actual text, controls, and SVG geometry; do not ship screenshots or crop diagram fragments into the interface. Use a deliberate illustration asset rather than treating every painted detail in the mockup as production-ready.
- This study covers the opening look and its microinteraction. The learning close-up, optional example and return, adult starting point, recovery scene, and ending still need development. The full chapter is not storyboarded by these two images.

## Next decision

Review whether this is the right visual character and whether the map is sufficiently inviting. The next test is a narrow HTML/SVG prototype, including one learning example and return, with responsive layout, real timing, repeated input, keyboard controls, and reduced motion. Keep [product document 003](../../product/003-visual-language-and-navigation.md) as the visual requirements source of truth.
