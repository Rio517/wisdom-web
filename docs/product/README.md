# Product documents

Specific proposals use stable identifiers: `NNN-short-name.md`. Number documents in creation order; the number is an identifier, not a priority or release order. Each document includes its status, created date, and updated date in `YYYY-MM-DD` format.

| ID | Document | Status | Updated |
| --- | --- | --- | --- |
| 001 | [Choices experience](001-choices-experience.md) | Proposed | 2026-09-14 |
| 002 | [Delivery architecture](002-delivery-architecture.md) | Implemented: Astro site under `src/`, deployed to GitHub Pages; domain DNS pending | 2026-09-30 |
| 003 | [Visual language and navigation](003-visual-language-and-navigation.md) | Proposed | 2026-09-06 |
| 004 | [Habits and the choices we repeat](004-habits-and-daily-practice.md) | Proposed explanation; separate lesson and next priority agreed | 2026-09-14 |
| 005 | [Research library and navigation](005-research-library.md) | Proposed | 2026-09-06 |
| 006 | [Storyboards and the first motion study](006-storyboards-and-motion-study.md) | Approved for prototyping | 2026-09-06 |
| 007 | [Interactive map prototype implementation plan](007-interactive-map-prototype.md) | Implemented: local study; revision specified in 008 | 2026-09-06 |
| 008 | [Choices and consequences](008-choices-and-consequences.md) | Implemented: independently reviewed local study; owner review pending | 2026-09-06 |
| 009 | [Layered choices rewrite implementation plan](009-layered-choices-implementation.md) | Implemented: local verification and independent review complete | 2026-09-06 |
| 010 | [Procedural choice network](010-procedural-choice-network.md) | Implemented: locally verified engine; visual refinement required | 2026-09-07 |
| 011 | [Choices hiking storyboard](011-choices-hiking-storyboard.md) | Approved for prototyping: v04 accepted; character Alfredo | 2026-09-14 |
| 012 | [Alfredo lesson implementation](012-choices-lesson-implementation.md) | Implemented locally; owner review pending | 2026-09-14 |
| 013 | [Choices guided journey](013-choices-guided-journey.md) | Approved as Lesson 1; implemented in the site; not published | 2026-09-27 |
| 014 | [Languages and localization](014-languages.md) | Implemented and published: English, Spanish, German and French (translations AI-drafted, no native review) | 2026-09-30 |
| 015 | [Lesson 2: where Maya belongs, and a longer habits game](015-lesson-two-proposal.md) | Proposed: three structures for Lessons 1 and 2; owner decision pending | 2026-10-09 |

Keep each document about one coherent product or delivery decision. Include the purpose, relevant requirements, proposed behavior, scope boundaries, acceptance criteria, and unresolved choices at the depth needed for review. Product requirements can be settled while the detailed solution remains proposed; make that distinction explicit.

Use `Proposed`, `Approved`, `Approved for prototyping`, `Implemented`, or `Superseded` as the base document status, with a short scope qualifier when needed. “Approved for prototyping” authorizes only the bounded study described in that document; it does not imply production approval, owner acceptance of the result, publication, or completion. Do not mark a proposal approved merely because it is committed or published. Update the same document as the proposal develops; Git preserves its history. Create a new numbered document for a distinct proposal or a substantial replacement, and link superseded documents to their successor. Avoid filename versions such as `-v2` or new dated copies of the same proposal.

The [project brief](../brief.md) contains durable project requirements. [Research](../research/report-source.md) and [content samples](../content/choices-opening.md) remain separate. [NEXT_STEP.md](../../NEXT_STEP.md) points to the active decision and immediate work; [COMPLETED.md](../../COMPLETED.md) records concise task history.

Current Choices guidance: the implemented current study uses the approved flat v06-style code composition with no dimensionality, shadows, highlights, bevels, or shaded dots. Treat v06 as a code reference rather than a raster UI asset and preserve numbered design-study/version conventions. [011](011-choices-hiking-storyboard.md) is the current canonical 321-word, four-scene hiking story, with optional fictional map exploration; v04 is accepted for prototyping, with the character renamed Alfredo in the [v05 name-only update](../design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html). Neither the code study nor storyboard is production approval. Relationships/conflict/de-escalation, an end quiz, and a future deep-research question about what makes a happy life remain outside current scope.
