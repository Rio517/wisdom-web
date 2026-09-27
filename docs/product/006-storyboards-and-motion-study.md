# 006 — Storyboards and the first motion study

Status: Approved for prototyping. Created: 2026-09-06. Updated: 2026-09-06.

## Decision

Use generated stills as historical visual inputs and a working browser prototype to test the actual interaction. The first implementation used HTML/SVG; the current revision uses Tailwind layout, Canvas 2D routes and semantic HTML. A still can establish composition and visual ambition; only a working prototype can expose timing, interruption, responsive layout, readable text, and accessible behavior. This is an approval for the narrow prototype, not approval of the complete chapter, production architecture, visual finish, or publication.

This is a project recommendation, consistent with guidance to choose prototype fidelity for the question being tested and use code for realistic interactions. [GOV.UK: Making prototypes](https://www.gov.uk/service-manual/design/making-prototypes).

## Storyboard status and limits

The [stored boards and review history](../design/001-choices-explainer/v01-reading-and-motion/README.md) remain useful records of the field-guide composition, map prominence, navigation, and desired immediacy. They are generated 1536 × 1024 PNGs, not website assets, responsive-layout evidence, a typography or contrast audit, or a demonstration of motion quality.

Their six future endpoints and stationary-marker sequence were first superseded by the SVG prototype in [007](007-interactive-map-prototype.md). That study established abundant wandering geometry, a traveling dot and post-arrival focus. The current Canvas revision removes its curls, strengthens untaken-path/divider contrast, and adds the meaningful layered choice comparison defined in [008](008-choices-and-consequences.md) and implemented through [009](009-layered-choices-implementation.md). [003](003-visual-language-and-navigation.md#signature-map-interaction) remains the detailed visual-requirements source.

The original PNGs remain unchanged historical inputs. In the first study, labels were real text and geometry was SVG rather than content cropped from screenshots; the current study keeps labels in HTML and draws route geometry on Canvas.

## Review questions

1. Is the abundant wandering map the memorable object while the page stays quiet and readable?
2. Can someone find the example-age control, understand the selected today, and reach the learning scene?
3. Do the three route treatments communicate their meanings without reading as success scores or a literal stepper?
4. Does the dot clearly travel from the left-hand beginning before the modest zoom begins?
5. Do interruption, keyboard activation, touch, browser history, reduced motion, and the optional-example return preserve coherent state?
6. Is the shell readable and usable at all three desktop/iPad target viewports with the system fallback fonts actually rendered?

## Narrow working prototype

The local `prototype/` study covers one reading shell, the opening Canvas map and worked comparison, a second learning scene, one optional related-sport example, continuous-reading copy, and returns between those states. It is not the complete seven-scene chapter, a production website, or a published artifact. The approved 008 revision is now incorporated in the prototype; production integration and additional chapter scenes remain separate work.

Desktop and iPad mini are the minimum prototype targets: 1440 × 1000, 1133 × 744, and 744 × 1133 CSS pixels. Phone design is deferred; the phone storyboard remains historical composition research rather than an acceptance target.

The intended motion starts responding within 100 ms, travels for about 500 ms, then focuses for about 250 ms. Repeated input cancels the previous sequence. Reduced motion shows the same settled state immediately without travel or camera motion. Controls and explanations remain available throughout. These timings and qualities require rendered browser review; their presence in code is not verification. Nonessential interaction animation must be suppressible; the W3C explanation of SC 2.3.3 is useful guidance, not a claim that the prototype meets WCAG. [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

Use rendered and owner review to decide exact geometry, type packaging, font sizes, motion curves, and whether a specialized animation library is warranted. The full chapter, phone design, production integration, and later habits material remain separate work.
