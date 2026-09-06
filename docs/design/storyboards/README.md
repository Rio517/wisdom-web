# Storyboards for visual review

Status: historical visual inputs; not the current prototype contract and not owner-approved. Created: 2026-09-06. These are generated still images, not a built website or a working animation.

[Design studies](../README.md) · [Storyboard and prototype proposal](../../product/006-storyboards-and-motion-study.md) · [Exact generation prompts](prompts.md)

## Stored boards

| Board | Image | What to review |
| --- | --- | --- |
| Reading experience | [Desktop and phone, v3](reading-v3.png) | Historical input for the quiet field-guide treatment, map prominence, navigation, and body copy |
| Marker and path | [Four-frame motion storyboard, v3](motion-v3.png) | Historical input for immediacy and settled-state restraint; its motion sequence is superseded |

Both images are 1536 × 1024 PNGs generated with built-in ImageGen; dimensions were checked from image metadata. Each received two image-inspection-and-refinement cycles, followed by inspection of the stored version. Exact initial and refinement prompts are recorded for reproducibility; input images were edit targets. The stored PNGs are unchanged copies of the generated output, not manually edited composites.

The earlier [reading v1](iterations/reading-v1.png), [reading v2](iterations/reading-v2.png), [motion v1](iterations/motion-v1.png), and [motion v2](iterations/motion-v2.png) remain as review inputs, not competing final recommendations. Concise review history belongs in [COMPLETED.md](../../../COMPLETED.md).

## Reading experience

The board shows a historical settled-opening concept, not every interaction state. Its six future endpoints are a schematic sample, not a count of remaining life options, and are superseded for the working prototype by an abundant field of original nonlinear paths with rises, falls, crossings, and occasional curls. Exact geometric coordinates are not an implementation specification.

The surrounding shell includes an expandable Choices index, separate About and Source code links, example-age selection, scene position, replay, continuous reading, optional depth, and Next. The small ink-and-wash brain is an illustration treatment, not an anatomical explanation. Main text and map do not depend on it.

The static phone composition remains historical layout research. It does not prove that a real viewport will fit or work, and phone design is deferred from the narrow prototype. The prototype's minimum targets are desktop and iPad mini. The sidebar outline is a visual sample; an eventual site must derive its entries from authored scenes.

## Historical motion sequence

| Frame | Proposed state | Essential behavior |
| --- | --- | --- |
| Ready | Before activation | Readable map guides and a hollow Today target; equivalent Start here control |
| Acknowledge | Around 100 ms | Today fills and a small local halo acknowledges input |
| Connect | Around 350 ms | The incoming path is traced toward Today; Today remains selected |
| Settle | Around 700 ms | Connected path and possible branches are clear; transient effects are gone |

These timestamps were design targets, not measurements. The stationary-marker storyboard is superseded by the approved working sequence: after an example age is chosen, a dot travels from the beginning at the left along the dark-green lived route to today, then the camera zooms modestly. Untaken alternatives become barely visible gray and possible futures remain light gray-green. The map state is not a literal process stepper. [Product document 003](../../product/003-visual-language-and-navigation.md#signature-map-interaction) holds the detailed visual requirements; [007](../../product/007-interactive-map-prototype.md) holds the implementation plan.

Reduced motion shows the settled state immediately. Next and the explanation remain available throughout. Repeated input must interrupt or retarget the current transition rather than queue it.

## Current review assessment and limits

- The reading board remains useful for reviewing the field-guide shell, hierarchy, and map prominence; its phone composition is not current acceptance evidence.
- The motion board remains useful for reviewing a restrained settled state, but its six-endpoint geometry and stationary Today-marker sequence are no longer requirements.
- Typography, color values, line widths, alignment, focus styles, and hit areas must be specified and checked in the browser. No contrast or accessibility conformance is claimed from the images.
- Build actual text, controls, and SVG geometry; do not ship screenshots or crop diagram fragments into the interface. Use a deliberate illustration asset rather than treating every painted detail in the mockup as production-ready.
- These images cover the opening look and an obsolete microinteraction. The local code study includes an opening map, a learning scene, and an optional example with return, but no browser verification or owner review is implied. The recovery scene, ending, phone design, production integration, and complete chapter still need development.

## Next decision

Review the local HTML/SVG prototype, not these PNGs, to judge the current geometry and motion. The review targets desktop and iPad mini and must cover real timing, repeated input, keyboard and touch controls, history, reduced motion, type rendering, and the learning-example return. Keep [product document 003](../../product/003-visual-language-and-navigation.md) as the visual requirements source of truth.
