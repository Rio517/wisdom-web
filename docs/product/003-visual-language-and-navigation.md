# 003 — Visual language and navigation

Status: Proposed. Created: 2026-09-06. Updated: 2026-09-06.

The requirements are a beautiful, very clean, content-focused interface with occasional expressive illustrations, plus a collapsible left navigation panel. The proposed treatment takes its cues from a botanical or natural-history field guide. The central map adds quick, functional, slightly futuristic animation: inviting to younger readers and satisfying to older readers. Watercolor is a candidate medium; the exact illustration treatment and production typography remain open for visual review.

This document is the detailed visual-requirements source for the shared reading shell around [001 — Choices experience](001-choices-experience.md). [002 — Delivery architecture](002-delivery-architecture.md) covers routes and production boundaries. A narrow local implementation study exists under `prototype/`; it is not the complete chapter or production interface and has not been published. The prototype now implements [008 — Choices and consequences](008-choices-and-consequences.md) through the work recorded in [009](009-layered-choices-implementation.md). [006](006-storyboards-and-motion-study.md) and [007](007-interactive-map-prototype.md) preserve the earlier study history.

## Visual idea

Use the clarity of a well-designed specimen plate: an open, near-white page, readable text, carefully observed illustrations, and fine lines that identify something worth noticing. The content and explanatory diagram carry the page. Small painted objects provide warmth and interest where the explanation benefits from them.

The initial illustration candidate is fine ink drawing with a restrained watercolor wash. Crisp contours make the subject readable; subtle pigment variation supplies the handmade quality. A brain can feel gentle and inviting through shape and color without eyes or a mascot face. Botanical styling describes the editorial treatment; unrelated leaves and flowers do not need to decorate a chapter about decisions.

An [exploratory brain plate and generation notes](../design/README.md) provide a concrete sample of this treatment. The sample is not an approved style or a substitute for reviewing a complete scene at its intended display size.

Reserve borders for navigation separation, a specimen inset, or a meaningful grouping. Keep the page background quiet. Avoid distressed paper, ornamental frames, full-page watercolor washes, and grids of decorative cards. Generous spacing, aligned text, and a few useful rules should do most of the work.

## Proposed palette and type

| Token | Initial value | Role |
| --- | --- | --- |
| Page | `#FCFCFA` | Clean reading surface |
| Ink | `#23302D` | Main text and explanatory linework |
| Quiet text | `#596860` | Secondary labels that remain readable |
| Rule | `#D5DDD5` | Nonessential separators |
| Active | `#2F604D` | Current selection, links, and focus treatment |
| Possible future | `#7F9C8B` in the current prototype | Still-possible paths in the selected map state |
| Untaken | `#87918B` in the current prototype | Clearly visible gray paths that diverged before today |
| Painted rose | `#DBADB0` | Illustration wash; not a text color |

These are proposed tokens, not a tested contrast system. Meaningful graphics and controls need sufficient contrast independently of decorative rules.

Source Serif 4 and Source Sans 3 remain production candidates; their official sources are [Source Serif](https://github.com/adobe-fonts/source-serif) and [Source Sans](https://github.com/adobe-fonts/source-sans). The local prototype does not contain self-hosted font assets or load web fonts. It currently declares Iowan Old Style/Palatino/Georgia for field-guide text and Avenir Next/Segoe UI/sans-serif for guide text, using whichever listed fonts are installed. Compare production candidates and actual rendered fallbacks with readers before settling or packaging the typefaces.

Start with 20px body text, approximately 1.6 line height, and a 55–65-character reading measure. Meaningful labels and navigation should normally be at least 16px. Use sentence case, moderate heading sizes, and left-aligned prose. For the narrow prototype, judge sizes and line lengths at the desktop and iPad mini targets in [007](007-interactive-map-prototype.md); phone typography remains a later production check.

## Layout and navigation

The desktop composition is a quiet left index and an open reading area. The diagram can use more width than the prose. A small illustration sits near the idea it explains; it does not need to occupy every scene.

The current prototype uses Tailwind's shared spacing, type, responsive layout and named project tokens. The utility system constrains layout decisions while Canvas geometry remains separate from page layout.

```text
Navigation, collapsible          Guided explanation

Wisdom                          Scene title               Starting age

Choices, expandable             Short explanation
  Your future has               Diagram or annotated specimen
  more than one path            Optional example / deeper explanation
    Current chapter scenes
                                Back       3 of 7       Next

About
Source code
```

The diagram above describes hierarchy, not final dimensions or copy. Begin with a sidebar around 240px on a wide screen; judge it against the actual chapter title and available reading width.

The site panel and its topic groups collapse independently. A visible, labeled control opens or closes the panel. “Choices” is an expandable group containing the current chapter; its scene outline can expand within that chapter. Highlight the active chapter and scene. Clicking a scene uses the same navigation state as the chapter's Next/Back controls and retains the selected example age.

Only authored content appears in the initial navigation. Additional Choices chapters and future subjects join the hierarchy when ready. Deep examples are reached from the relevant scene; the sidebar does not need to list every optional detour.

Place About and Source code in a visually separate utility area below the content navigation. About opens a short page explaining the project's purpose, intended readers, use of research, and how to find the evidence. Source code links to the public [wisdom-web repository](https://github.com/Rio517/wisdom-web). Use the clear text label even if an icon is added.

At a narrow tablet viewport, the index opens as an overlay with a persistent navigation opener. Escape and a close button dismiss it, keyboard focus remains inside while open, and closing returns focus predictably. On wider screens, collapsing the panel gives space back to the content without resetting the scene. The current chapter and navigation opener remain discoverable when the panel is closed. Phone behavior is deferred; a drawer is a possible later approach, not a current release requirement.

## Illustrations, callouts, and animation

Generate painted specimen artwork as raster images with transparent backgrounds. Keep meaningful labels and controls in HTML, and precise leader lines in code. The current map uses Canvas 2D for routes and tracing, with semantic HTML carrying the same meaning; [007](007-interactive-map-prototype.md) records the earlier SVG version. An SVG wrapper around a bitmap does not make the underlying artwork vector; preserve that distinction in asset records.

A callout must identify a real depicted element or explain an action in the diagram. Give leader lines clear endpoints and avoid crossings. On small screens, labels can move below the illustration with matching markers. Do not point abstract abilities at arbitrary brain locations; a general brain illustration can accompany a general explanation without implying anatomical localization.

Animate the explanatory layer: reveal the relevant line, focus a callout, trace a chosen path, and let the composition settle. Keep decorative specimen art still while readers study it. Navigation expansion and drawer motion should be brief and unobtrusive. Reduced-motion mode retains the content and diagram states described in product document 001.

## Signature map interaction

The opening map is the first concrete test of the site's beauty and responsiveness. Its overview presents an abundant field of original nonlinear paths: branches rise, fall, cross and wander while progressing left to right. Remove loops and backward curls; some sharper bends are acceptable. The topology may take inspiration from the supplied reference, but the geometry must be original; it must not reproduce the old six-endpoint storyboard tree. Vertical position is not success or worth. Show recovery as forward-moving work, not a loop through time.

A reader chooses an authored example age. A dot then travels from the beginning at the left along the example's lived route to the selected “today” moment. That route becomes dark green; alternatives that diverged before today settle into clearly visible gray; routes still possible from today remain lighter gray-green. The dotted today divider must remain legible. After arrival, the view moves modestly closer while preserving enough context to understand future possibility. This is one semantic map transition, not a series of literal process steps. The named decision/comparison and layered explanation in [008](008-choices-and-consequences.md) supply its teaching purpose; age-only coloring is insufficient.

Use the quiet field-guide surface as the resting state. A short-lived local halo may make the traveling dot easier to follow, but it disappears in the settled state. The route and camera motion provide the emphasis; avoid sparkles, confetti, theatrical camera flights, ambient particle clouds, permanently glowing text, or a strong zoom that hides the wider map.

Proposed motion beats and initial timing targets, to test rather than treat as approved values:

| Beat | Purpose | Initial target |
| --- | --- | --- |
| Immediate response | Confirm the tap/click/keyboard action | Visible feedback within 100 ms |
| Dot travels along the lived route | Connect the beginning to the example's today | Around 500 ms |
| Modest focus move after arrival | Bring the selected moment closer without losing context | Around 250 ms |
| Settled semantic state | Leave dark-green lived, visible-gray untaken, and lighter gray-green possible paths readable | Roughly 750 ms total |

These are prototype targets for rendered review, not measured quality claims. The full explanation and navigation remain available while motion runs. A second selection cancels or retargets the old transition; it never queues performances. On replay, use the same short timing. Reduced motion shows the identical settled route colors and focus immediately, without travel or camera motion.

Use authored, labeled anchors with generous hit areas rather than turning arbitrary coordinates into a personal life prediction. The starting-age selector chooses the scenario; the map interaction makes that scenario's “today” location visible. Provide an equivalent visible button and keyboard focus target. Do not silently change the age because a reader taps empty space. Pointer previews cannot be the only way to discover an action, and dragging is not required.

The line's motion has semantic direction: the dot and dark-green past segment progress from the left-hand beginning toward today. Possible futures extend away from today; the worked comparison makes relevant learning connections explicit. Region labels stay outside the camera; the age label follows its anchor and retains readable screen-space sizing through zoom and resize. Color is supplemented by labels, line treatment and a text explanation. Earlier decisions remain accessible after zoom through map targets and an equivalent text list; inspecting one does not silently move today.

Beauty is an acceptance requirement, but the interaction earns its place by making selection, continuity, and cause easier to perceive. Ask readers what changed before asking whether it looked impressive. Test whether the effect feels inspiring near age eight and polished rather than childish to older readers; these are design goals, not assumed reactions.

## Acceptance criteria and next visual check

- The title, explanation, active scene, and next action are apparent before decorative detail.
- The sidebar collapses without losing place; Choices expands independently; About and Source code remain easy to find.
- At desktop and iPad mini target sizes, the panel supports pointer, touch, and keyboard operation, including dismissal and focus restoration where it overlays content. Phone behavior is deferred for the prototype.
- Text and callout labels stay readable at the required desktop and iPad mini viewports and with browser zoom. The design does not rely on fine artwork to carry essential meaning.
- At least one representative scene works with the painted illustration removed: the visual enriches the explanation while the text and diagram remain coherent.
- The narrow motion study demonstrates the abundant life-path transition, one learning scene, and an optional deeper example with a clear return. It does not imply the seven-scene chapter exists.
- The traveling-dot interaction feels immediate, resolves quickly, applies only a modest post-arrival zoom, and can be interrupted without queued or conflicting traces. Touch, keyboard, and reduced-motion paths communicate the same selected state.
- The first animation never delays access to content or requires a cinematic introduction. Essential labels remain legible and attached to their meaning; no label blurs, spins, or depends on a glow for contrast.

Further reviews should inspect the local prototype with real copy at the desktop and iPad mini viewports recorded in [007](007-interactive-map-prototype.md). Review the path abundance and meaning, comparison annotations and practice occasions, motion interruption, focus move, system-rendered type, sidebar width, illustration scale, and guided/static reading comfort together. Code inspection and a specimen illustration are not proof that the rendered interface works.
