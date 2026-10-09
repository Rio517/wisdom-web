# Design library

## Start here — the site

The first complete website is [002 — Site shell and home, v01 — Launch](002-site/v01-launch/README.md): home page, lesson overview, text version, notes, about and the shared index, built in Astro with the approved field-guide look.

## Choices

Newest implementation for review: [v09 — Guided journey](001-choices-explainer/v09-guided-journey/README.md) ([013](../product/013-choices-guided-journey.md)). The previous live implementation is [v08 — Alfredo lesson](001-choices-explainer/v08-alfredo-lesson/README.md). The older rounds below remain design history.

Maya, redrawn from the picked concept (A · Garden) for review: [v12 — Maya figure](001-choices-explainer/v12-maya-figure/README.md), with a [size strip](001-choices-explainer/v12-maya-figure/size-strip-v01.png) beside the concept.

All Choices design work belongs to [001 — Choices explainer](001-choices-explainer/README.md). That stable study contains the numbered review rounds, their questions, dates, status and relationship to the product documents.

Accepted storyboard direction is [v07 — Hiking lesson storyboard](001-choices-explainer/v07-hiking-storyboard/README.md): four reader-facing scenes, their visual states and proposed transitions. The owner accepted v04 for prototyping; v05 changes only the character name to Alfredo. This round preserves the current path algorithm and does not implement the lesson. Earlier interactive review is [v06 — Flat Canvas](001-choices-explainer/v06-flat-canvas/README.md). The [v06 artwork](001-choices-explainer/v05-reference-and-modern/dimensional-v06.png) remains a composition reference, not dimensional styling to copy. See [NEXT_STEP.md](../../NEXT_STEP.md) for the current standalone path lab; the captures below predate that tuning surface.

**Earlier comparison (2026-09-07):** [opening](001-choices-explainer/v06-flat-canvas/opening-desktop-v06.png), [full context](001-choices-explainer/v06-flat-canvas/retained-desktop-v04.png), [fading alternatives](001-choices-explainer/v06-flat-canvas/fading-desktop-v04.png) and [quiet context](001-choices-explainer/v06-flat-canvas/hybrid-desktop-v04.png). These actual browser captures show heavier, higher-resolution strokes and stronger early branching, with the same network/scenario across the three visibility treatments. Two review/improvement loops are recorded in the round README. At that review, owner selection and a tuning UI were pending. A standalone tuning page now exists; those captures are historical. Tablet evidence: [portrait](001-choices-explainer/v06-flat-canvas/today-tablet-portrait-v04.png) and [landscape](001-choices-explainer/v06-flat-canvas/today-tablet-landscape-v04.png).

## Lesson 2 — Habits

[003 — Lesson 2](003-lesson-two/README.md): [v01 — Game directions](003-lesson-two/v01-game-directions/README.md), three playable ways to live the two-week soccer, cello and reading game, in review.

## Naming and versioning

Current implementation review: [study 001, v08 — Alfredo lesson](001-choices-explainer/v08-alfredo-lesson/README.md), the accepted hiking storyboard as a Tailwind lesson with optional map exploration.

Registered code review: [study 001, v06 — Flat Canvas](001-choices-explainer/v06-flat-canvas/README.md). This round tests the accepted v06 composition as flat interactive code, not another artwork treatment. Browser captures use explicit artifact revisions.

- A study has a permanent ID and subject: `001-choices-explainer`, `002-site`. Register a genuinely new subject here before creating its folder.
- A numbered round records a distinct review question: `v05-reference-and-modern`. A refinement stays in that round; it does not create a sibling folder with another informal name.
- An artifact has an explicit revision: `dimensional-v03.png`, followed by `dimensional-v04.png`. Keep reviewed versions unchanged. Do not use `final`, `latest` or unversioned new image filenames.
- Each round's README identifies its purpose, related product documents, dates, status, direct image links, review limits and prompt/source files. The study index says what to review now and what is superseded.
- Historical browser captures retain their original names inside frozen numbered rounds. Dates belong in the indexes; Git records reference-document edits. The existing versioned brain asset remains at its stable path because the local prototype uses it.

## Brain — ink and restrained watercolor

Status: exploratory style sample, not an approved production asset or anatomical teaching diagram. Created: 2026-09-06.

Asset: [brain-ink-wash-v1.png](brain-ink-wash-v1.png). PNG, 1254 × 1254 pixels, with an alpha channel verified using image metadata. Generated with the built-in ImageGen tool; no input image, reference artwork, or manual image edit was used. The file is an unchanged copy of the generated output. It is raster artwork, not SVG.

The sample explores the [visual-language proposal](../product/003-visual-language-and-navigation.md). Its muted rose wash and fine dark contours fit the proposed specimen treatment. It has been visually inspected as a small, decorative illustration in the prototype's learning scene. It has not been anatomically validated or approved as the final illustration style; it does not carry essential content or identify brain functions.

Use HTML/SVG for any future labels and leader lines. Do not attach abstract learning functions to arbitrary folds. Meaningful text and diagrams must remain usable without this illustration.

### Final generation prompt

```text
Use case: scientific-educational. Asset type: a single exploratory spot illustration for a very clean digital life manual for readers aged eight and older. Primary request: one human brain drawn like a beautifully observed specimen in a modern natural-history or botanical field guide, using fine ink outlines and a very restrained watercolor wash. Subject: a recognizable human brain in a clean lateral three-quarter view, with softly rounded cerebral folds and a small visible cerebellum and brainstem; gentle and inviting, simplified enough to read as a small illustration, not grotesque and not a cartoon character. Style: delicate graphite-grey pen contours, selective fine interior linework, quiet translucent muted rose and warm grey watercolor contained within the silhouette; visible handmade pigment variation inside the painted area, clean outer edges. Composition: isolated centered specimen, all parts visible, generous transparent margin on every side, square canvas. Background: genuinely transparent alpha, no paper background, no ground shadow. Constraints: illustration only; no words, labels, leader lines, arrows, numbers, eyes, face, smile, limbs, flowers, foliage, props, frame, watermark, colored brain-region overlays, glow, decorative splashes, or busy hatching. This is an illustrative style sample, not a map of localized brain functions. Keep the watercolor understated and the silhouette crisp.
```
