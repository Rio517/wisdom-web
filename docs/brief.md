# Project brief

## Purpose

Create a small collection of excellent explanations of life lessons that children may not otherwise encounter clearly. The material begins as a parent's contribution to their children's understanding and is intended for general sharing. Completeness is not a goal.

## Audience

The audience is ages 8+, with a core explanation approachable from age eight and depth that remains worthwhile for older children and adults. Use concrete examples and clear sentences while retaining complexity, interesting vocabulary, and opportunities to reason. Younger readers may share the experience with an adult. Age eight is the product's entry target, not an upper limit on sophistication or a claim of identical comprehension across readers.

Audience assumptions need testing with actual readers. Reading level, attention, and prior knowledge vary within any age group; a readability score cannot substitute for observing comprehension.

## First subject: choices

The founding idea is that present choices affect the options available to a future self. Preparation can make later opportunities reachable. Repeated avoidance can leave gaps that take work to repair. Some opportunities are time-sensitive. Applying effort, seeking help, and responding constructively to difficulty deserve explicit treatment.

Learning and choices compounding are central: earlier understanding can support later learning, parts of skills can carry into related activities, and progress and enjoyment can encourage further practice. Explain the mechanisms and limits through maths and a related-sport example. Do not make compounding a promised growth rate. Layer the story to show repeated choices, such as returning to homework across nights, alongside decisions made by others and circumstances outside the learner's control. Distinguish accumulated knowledge, practical preparation and behavior-specific habits; a useful routine is not proof of universally better judgment.

The first lesson, Choices — The paths we make, explains the impact of choices and how their effects add up over time, alongside circumstances, support and chance. It does not explain the psychology of how people make decisions. Repeated daily actions belong here as examples of accumulation, not as a decision-making method or a full habits lesson.

The [lesson roadmap](README.md#lesson-roadmap) records six main areas in order: choices and their effects; habits and daily practice; how we make choices; what makes a happy life; relationships; and how to learn. Habits is lesson 02, the next priority, and must have its own lesson even if short. Relationships may become separate friendship and romance lessons; that split remains open. The roadmap preserves later decision-making research leads on principles, convenience, the rider-and-elephant and moral-matrix models, design thinking, creative option generation and constraints. These later subjects are not current research tasks.

A brief illustration of a familiar routine may appear in Choices–Paths, but it does not replace the separate habits lesson. A future end quiz is an idea only, not current scope.

The research must test the founding idea, including its limits. It must not convert broad tendencies into predictions about a particular child, a claim that options only shrink with age, or a ranking of lives by academic prestige and occupation.

## Product requirements

- High quality in both content and visual execution.
- A clean, content-focused natural-history field-guide aesthetic: readable type, open space, precise callouts, and occasional small painted illustrations. The exact watercolor/ink treatment remains a visual choice to test.
- A collapsible left navigation panel with expandable Choices content, plus separate About and Source code links. Additional subjects appear as their content becomes available.
- Guided, reader-controlled progression with quick, beautiful animation that explains what changes. In the approved opening prototype, choosing an example age sends a dot from the beginning at the left along the dark-green lived route to today, then modestly moves the view closer. It must not delay reading or add motion for its own sake.
- A selectable starting age or life stage for the map's “today” marker, with relevant fictional examples and optional context on child development.
- The first entry is a short click-through explainer, roughly 2–3 minutes for one takeaway, with examples and optional deep dives that preserve a clear main path. A possible second entry may select an example age and show relevant fictional examples; an older example may look back to age eight when clearly labeled. The selected age never claims the reader's own history. Age-range routing and a fully redesigned short lesson are next-stage scope unless the existing controls can express them.
- Optional examples and deeper explanations, with a clear return to the main sequence. AI-generated video may supplement later explainers.
- Distinct page URLs suitable for direct sharing.
- A coherent reading path across the eventual experience. The narrow prototype targets desktop and iPad mini first; phone design is deferred rather than accepted by this study.
- Research, references, and design decisions stored in a navigable, linked repository library, grouped by topic with findings, sources, evidence limits, and open questions. A future reading/navigation UI may expose the same Markdown; it must not create a second research source of truth.
- Current-state handoff in `NEXT_STEP.md`; concise completed-work history in `COMPLETED.md`.
- Static GitHub hosting is the initial preference; evaluate it against the actual experience required.

The opening map begins as an abundant field of original nonlinear routes inspired by the supplied reference's topology, with rises, falls and some crossings, but no loops or backward curls. Angular bends are acceptable. After an age is selected, the lived route is dark green, past alternatives are clearly visible gray, and still-possible futures are lighter gray-green; the dotted today divider must be legible. These are semantic map states, not steps in a literal process-stepper interface. The approved next direction uses Tailwind layout, Canvas 2D routes and semantic HTML, with one layered fictional choice-and-consequence comparison and revisitable earlier moments. [008](product/008-choices-and-consequences.md) records the implemented current study and its acceptance contract; the full short lesson remains future editorial work. A simulator is possible later scope, after the essential explanation works. The earlier PNG storyboards and [007](product/007-interactive-map-prototype.md) remain records of earlier studies, not the new revision's acceptance contract.

The approved v06-style map is flat: no dimensionality, shadows, highlights, bevels, or shaded dots, including on gray and green lines. Use uniform stroke color and width. Page-edge opacity masks and the approved retained/fading/hybrid comparison may soften route visibility without changing graph state or implying volume. Treat v06 as a code composition reference, not a raster image to ship in the interface. Current comparison behavior and the proposed drawing-control panel are scoped in [product 010](product/010-procedural-choice-network.md#current-visual-refinement).

## First-release boundary

Deliver one complete choices-impact chapter, its topic entry page, supporting adult/source notes, and a short About page within the shared navigation. “How we make choices” and the habits chapter are later work; the first chapter must stand on its own. Avoid empty subject pages and navigation that promises unwritten material.

Accounts, child profiles, tracking, a content-management service, a comprehensive curriculum, and a career/admissions advice product are not required by the brief.

## Decisions to make from concrete material

The [numbered product documents](product/README.md) and sample passage provide the basis for choosing the teaching emphasis, voice, and exact visual behavior. The working title is provisional. The GitHub repository is public. A reuse license requires an explicit owner decision before one is added.
