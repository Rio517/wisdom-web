# 003 — Visual language and navigation

Status: Proposed. Created: 2026-09-06. Updated: 2026-09-06.

The requirements are a beautiful, very clean, content-focused interface with occasional expressive illustrations, plus a collapsible left navigation panel. The proposed treatment takes its cues from a botanical or natural-history field guide. The central map adds quick, functional, slightly futuristic animation: inviting to younger readers and satisfying to older readers. Watercolor is a candidate medium; the exact rendering style, palette, and typography remain open for visual review.

This document defines the shared reading shell around [001 — Choices experience](001-choices-experience.md). [002 — Delivery architecture](002-delivery-architecture.md) covers routes and implementation boundaries. No interface is implemented yet.

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
| Painted rose | `#DBADB0` | Illustration wash; not a text color |

These are proposed tokens, not a tested contrast system. Meaningful graphics and controls need sufficient contrast independently of decorative rules.

Test Source Serif 4 for headings and longer reading passages, paired with Source Sans 3 for navigation, buttons, and diagram labels. The families are designed as companions; their official sources are [Source Serif](https://github.com/adobe-fonts/source-serif) and [Source Sans](https://github.com/adobe-fonts/source-sans). Compare the prose in both families with actual readers before settling the body face.

Start with 20px body text, approximately 1.6 line height, and a 55–65-character reading measure. Meaningful labels and navigation should normally be at least 16px. Use sentence case, moderate heading sizes, and left-aligned prose. Font sizes and line lengths must remain comfortable on phones and when zoomed.

## Layout and navigation

The desktop composition is a quiet left index and an open reading area. The diagram can use more width than the prose. A small illustration sits near the idea it explains; it does not need to occupy every scene.

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

On phones, the panel becomes a drawer opened by a persistent navigation button. It closes after selecting a destination; Escape and a close button dismiss it, and keyboard focus returns predictably. The open drawer keeps focus within its controls. On desktop, collapsing the panel gives space back to the content without resetting the scene. The current chapter and navigation opener remain discoverable when the panel is closed.

## Illustrations, callouts, and animation

Generate painted specimen artwork as raster images with transparent backgrounds. Keep labels, leader lines, diagram routes, and controls in HTML/SVG. An SVG wrapper around a bitmap does not make the underlying artwork vector; preserve that distinction in asset records.

A callout must identify a real depicted element or explain an action in the diagram. Give leader lines clear endpoints and avoid crossings. On small screens, labels can move below the illustration with matching markers. Do not point abstract abilities at arbitrary brain locations; a general brain illustration can accompany a general explanation without implying anatomical localization.

Animate the explanatory layer: reveal the relevant line, focus a callout, trace a chosen path, and let the composition settle. Keep decorative specimen art still while readers study it. Navigation expansion and drawer motion should be brief and unobtrusive. Reduced-motion mode retains the content and diagram states described in product document 001.

## Signature map interaction

The opening map should be the first concrete test of the site's beauty and responsiveness. A reader activates a visible starting point on the large path map; a dot arrives softly and a finely drawn line traces into place. The effect should confirm the action and explain the connection while feeling unusually well made.

Use the quiet field-guide surface as the resting state. During interaction, test a soft translucent halo around the marker, a restrained highlight following the line, and slight depth that disappears as the drawing settles. This is a candidate treatment for an atmospheric, subtly futuristic feel, not a fantasy theme. No sparkles, confetti, theatrical camera flights, ambient particle clouds, or permanently glowing text.

Proposed motion beats and initial timing targets, to test rather than treat as approved values:

| Beat | Purpose | Initial target |
| --- | --- | --- |
| Immediate marker response | Confirm the tap/click/keyboard action | Visible feedback within 100 ms |
| Small arrival and settling | Identify the selected point | About 140–220 ms; no large bounce |
| Path trace with restrained moving highlight | Show what connects to this point | About 350–550 ms, overlapping the marker arrival |
| Highlight resolves into ordinary ink | Leave a crisp reading state | Settle the whole interaction in roughly 600–750 ms |

Do not add these durations into a long sequential introduction. The full explanation and navigation remain available while motion runs. A second selection cancels or retargets the old transition; it never queues performances. On replay, use the same short timing. Reduced motion places the marker and shows the final connected path immediately, with an optional nonmoving emphasis.

Use authored, labeled anchors with generous hit areas rather than turning arbitrary coordinates into a personal life prediction. The starting-age selector chooses the scenario; the map interaction makes that scenario's “today” location visible. Provide an equivalent visible button and keyboard focus target. Do not silently change the age because a reader taps empty space. Pointer previews cannot be the only way to discover an action, and dragging is not required.

The line's motion must have semantic direction: a past segment traces toward today; future segments extend away from today; a new learning connection grows from the relevant earlier skill. A marker pulse acknowledges selection, not a “good life choice” score. Labels remain still and readable while the line moves.

Beauty is an acceptance requirement, but the interaction earns its place by making selection, continuity, and cause easier to perceive. Ask readers what changed before asking whether it looked impressive. Test whether the effect feels inspiring near age eight and polished rather than childish to older readers; these are design goals, not assumed reactions.

## Acceptance criteria and next visual check

- The title, explanation, active scene, and next action are apparent before decorative detail.
- The sidebar collapses without losing place; Choices expands independently; About and Source code remain easy to find.
- The mobile drawer supports touch and keyboard operation, including dismissal and focus restoration.
- Text and callout labels stay readable at phone width and with zoom. The design does not rely on fine artwork to carry essential meaning.
- At least one representative scene works with the painted illustration removed: the visual enriches the explanation while the text and diagram remain coherent.
- A motion study demonstrates the life-path transition, one callout, and an optional deeper example with a clear return.
- The marker-and-line interaction feels immediate, resolves quickly, and can be interrupted without queued or conflicting traces. Touch, keyboard, and reduced-motion paths communicate the same selection.
- The first animation never delays access to content or requires a cinematic introduction. Essential labels do not move, blur, or depend on a glow for contrast.

The next visual comparison should use real chapter copy and this shell. Review the watercolor strength, body font, sidebar width, and illustration scale together. A specimen illustration alone is an art-direction sample, not proof that the full interface works.
