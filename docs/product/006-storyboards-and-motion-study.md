# 006 — Storyboards and the first motion study

Status: Proposed. Created: 2026-09-06. Updated: 2026-09-06.

## Decision

Use ImageGen to develop and review the visual direction, then HTML/SVG to test the selected interaction. These are different tests: a still can establish composition and visual ambition; a working prototype must establish timing, responsiveness, readable text, and accessible behavior.

This is a project recommendation, consistent with guidance to choose prototype fidelity for the question being tested and use code for realistic interactions. [GOV.UK: Making prototypes](https://www.gov.uk/service-manual/design/making-prototypes).

## Image study

The [selected boards and review limits](../design/storyboards/README.md) are ready for owner review. Their existence does not imply approval of the visual direction or measured motion quality.

Create two complementary review boards using the existing [Choices explanation](001-choices-experience.md) and [visual/motion direction](003-visual-language-and-navigation.md):

- **Reading experience:** a desktop opening with the collapsible topic index and a phone opening with reflowed content. The path map is the focal point; the small illustrated detail remains subordinate.
- **Marker and path:** four snapshots of one unchanged map, showing ready, acknowledgment, connection tracing, and a quiet settled state. Timing labels are design targets, not measured performance.

Use real short copy, a starting example age, readable labels, scene position, and Next. Make the map's past/present/future distinction explicit. It illustrates possibilities, not a count of opportunities, equal probabilities, or a success scale.

Each board receives an initial visual review and revision, then a second visual review and revision, before the selected version is presented. Check the actual outputs for defects; do not count repeated generation without inspection as a review cycle. Record reproducible prompts and final image paths in design assets, with concise review history in `COMPLETED.md`.

The image study is not website implementation, a responsive-layout test, a typography/contrast audit, or a demonstration of motion quality. Labels and geometry in an image must be rebuilt as real text and SVG rather than shipping screenshots as the interface.

## Review questions

1. Is the map the memorable object while the page stays quiet and readable?
2. Can someone find the current place, starting-age control, and next action?
3. Is the phone composition a genuine reflow rather than a reduced desktop?
4. Does the line reveal preserve the same underlying path and present marker?
5. Is the acknowledgment effect localized and absent from the settled state?
6. Do the labels avoid implying personal prediction, fixed probabilities, or ranked lives?

## Next: a narrow working prototype

After visual review, implement one responsive reading shell, dot placement/path tracing, and one learning example with a return. Include the same final state without animation, keyboard activation, repeated quick input, and basic history/scene behavior. Do not build the complete site or a general animation engine to test this interaction.

Measure and inspect the proposed 600–750 ms settling window in the browser rather than trusting the storyboard timestamps. Controls and explanations remain available throughout. Test on phone and desktop and with reduced-motion preferences. Nonessential interaction animation must be suppressible; the W3C explanation of SC 2.3.3 is useful guidance, not a claim that the mockup meets WCAG. [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

Use the prototype to decide exact geometry, font sizes, motion curves, and whether a specialized animation library is warranted. The full seven-scene narrative and later habits material remain separate authoring work.
