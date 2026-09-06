# 008 — Choices and consequences

Status: Proposed (teaching direction and Tailwind/Canvas approach approved; written specification awaiting review). Created: 2026-09-06. Updated: 2026-09-06.

## Purpose and boundary

Make the opening explain how choices change later opportunities, rather than only showing where someone is in time. The reader follows a fictional learner, Mika, revisits named decisions, and compares their consequences. This is an illustrated explanation, not a life simulator, prediction, or score.

This replaces the next-iteration requirements of [007 — Interactive map prototype](007-interactive-map-prototype.md). Retain the existing two-scene prototype, learning example, navigation, reading alternative and motion preferences while rewriting its layout in Tailwind and its map in Canvas 2D. The complete chapter, production Astro site, publication, habits chapter, videos and phone layout remain outside this revision.

The broad approach is approved. Prioritize four ideas: preparation opens options; repeated avoidance can create gaps; learning builds on earlier learning; and recovery takes work and support. Show each within circumstances the person does not wholly choose. A simulator may be considered later, after this explanation works. The concrete example and interaction contract below are the written design for review, not implemented behavior.

## A layered explanation, not a single decisive fork

The same worked example carries three layers, revealed on request without forcing a detour into a separate habits lesson:

1. **The situation and the choice:** the school assigns the work and Mika finds it confusing; Mika did not choose either fact. Mika can try a response, such as asking for a different explanation. Available help, time, health and decisions made by adults also affect what is possible. Include a visible “Not all of this is Mika's choice” sentence in the core explanation, not only in adult notes.
2. **The pattern over time:** use “See how it adds up” to reveal a few labeled practice occasions within the same decision. Returning to homework, checking understanding and getting feedback can build a foundation across nights. Repeatedly avoiding the confusing part can leave the gap in place. These are illustrative occasions, not a streak, required daily dose, or measured growth curve. One missed night does not erase what was learned.
3. **What makes the next choice easier:** separate three mechanisms: knowing more can help with the next task; arranging materials and help can make starting more practical; and repeating an action in a familiar context may make that particular start more automatic. No general “good choices” meter is warranted. Becoming used to opening a notebook is not the same as understanding its problems, and a practiced routine still needs judgment.

The map's fork summarizes a pattern; it must not imply that one click or one homework assignment determines a lifetime. Pattern view adds small forward-moving segments and short callouts, not new life branches after every night. Circumstances have their own labeled callouts, not a failed-choice color. Hold the available support constant when comparing Mika's two responses; discuss unavailable support explicitly rather than treating it as refusal to ask.

Suggested child-facing bridge: “You don't choose everything that happens. But some choices are yours to practice. What you learn—and how you make room to begin—can help with the next try.” The [habits findings](../research/habits/README.md#repeated-choices-and-the-next-choice) distinguish the supported mechanisms from untested broad transfer. The full habit-change lesson remains separate.

## Reader experience

1. **An open future.** Keep “Your future has more than one path” above a rich, original landscape of wandering routes. Opening copy: “What you learn and choose today can change what you can do later. Some choices open opportunities. Some make the next step harder. Let's follow one example.” Label the diagram “Mika's example life — not a prediction.”
2. **Choose a moment.** Retain starting ages 8, 12, 16, 25, 40 and 60; default to 8. The dot travels from the left to that moment and then the view gently focuses. The explanation and controls are available immediately, not after the animation. Age chooses context; getting older does not itself close a fixed number of paths.
3. **See a moment and its context.** Explain the selected life stage beneath the map. Earlier named decisions remain discoverable on the traveled path and in a compact text list labeled “Earlier decisions.” Offer the same worked comparison from every starting age, labeled as looking ahead, the current decision or looking back as appropriate.
4. **Compare the consequence.** The age-12 decision has one fully worked comparison. “Compare another choice” switches to the authored alternative. Trace the affected route and label the concrete difference: a foundation gained, a gap that needs repair, or time needed before proceeding. Changing a few colors on the same unlabeled branches is insufficient.
5. **See the work of recovery.** Where the alternative leaves a gap, offer “What could help next?” Show a forward-moving route through a named repair step. It is neither a reset button nor a promise that every missed opportunity returns.

Use the current Next/Back controls to continue to or return from the learning scene. The initial map should teach a complete choice-and-consequence idea without requiring that second scene.

## Authored moments

All situations and outcomes below are fictional illustrations of mechanisms, not research findings about these exact ages. There is one interactive comparison, not six mini-lessons. Other moments supply concise lifetime context and meaningful points to revisit. Keep prose readable from age eight even in adult examples.

| Age and moment | Context on the reference life |
| --- | --- |
| 8 — Ask when something is confusing | Mika asks for a drawing of equal parts and practices connecting the picture to a fraction. This early understanding is a starting point, not mastery of everything that follows. |
| 12 — Return to a difficult idea | Equivalent fractions are confusing. Mika repeatedly avoids the difficult problems; when ratios appear, that missing understanding adds another difficulty. This is the worked comparison described below. |
| 16 — Repair a gap before the next step | Mika wants an imagined design course that requires using ratios. Mika seeks support and catches up before a later intake. Preparation creates eligibility, not a guaranteed place. The earlier intake remains missed; the course and its rules are explicitly invented. |
| 25 — Use learning in a new setting | Mika learns a spreadsheet to help budget a community event. Earlier number skills help; the tool itself still needs learning. New abilities can create new options. |
| 40 — Make room for new learning | Mika considers a course alongside work and family responsibilities. Time, support and cost affect what is practical now; forty is not a learning cutoff. |
| 60 — Combine experience with something new | Mika brings practical experience to a shared project and learns an unfamiliar planning tool. Experience can help, while old methods sometimes need adapting. Future routes continue beyond this moment. |

The reference life includes preparation, a setback and supported catch-up. Do not depict a flawless achiever or make university the single destination. Adult moments are context, not additional branching simulations.

### The single worked comparison

At age 12, show three reader-controlled views:

1. **Leave the gap:** repeatedly avoid the confusing fraction problems. Completing easier work does not resolve the misunderstanding. Later, using a ratio requires learning both the missing foundation and the new idea.
2. **Build the foundation:** ask for a useful explanation and practice with feedback. Connect equivalent fractions to a ratio, then use the ratio to adapt a recipe. The imagined course's prerequisite is within reach; this does not guarantee admission or every future opportunity.
3. **Work back toward the opportunity:** after avoiding the idea, revisit equal parts, learn equivalent fractions with support, and practice ratios. Show the extra learning before a later course intake becomes available. Do not reopen the intake already missed.

Only these routes carry named consequences. The surrounding abundant field preserves the sense of wider possibilities; it is not a numerical model. This comparison concerns a repeated pattern, not one missed exercise, a need for rest, or choosing a different worthwhile interest.

The age-12 close-up explicitly connects **equal parts → equivalent fractions → a ratio in a recipe**. With the missing-foundation version, annotate the extra learning required before the ratio makes sense. With the supported-practice version, illuminate the connection between the existing foundation and the next idea. Name this “learning that builds on learning,” and introduce “compounding” as the useful term, not an exponential formula.

## Selection, revisiting and comparison

- **Starting age** remains the selected “today.” Clicking an earlier decision inspects it without silently moving today or changing the reader's starting age. Show “Looking back: age 12” and a separate “Return to age 40” control when those are the respective ages.
- **Hover or keyboard focus** on a marked decision or its nearby traveled segment previews its title and one sentence. Only segments associated with an authored decision have this behavior; decorative routes do not pretend to contain hidden life events. Preview never changes the URL or committed selection.
- **Click, tap, Enter or Space** opens the same decision explanation. No double-tap or hover is required. A visible text list offers the same earlier decisions, including any outside the focused map view.
- **Inspection** may reframe to include the earlier decision and its outcomes. It does not animate the dot backward through a loop. Today remains named in the surrounding HTML. Returning to today restores its camera framing and the committed story state.
- **Comparison** is available at the age-12 decision only. Other moment panels link to it instead of inventing separate comparisons. From age 8, label it “Looking ahead: age 12”; from ages 16 and above, label it “Looking back: age 12.” Label the alternative “Another possible choice.” It does not rewrite the fixed example biography or simulate every later decision. The affected routes and outcomes must actually differ; unchanged background paths remain context.
- **Recovery** is a third explanatory view reached from the relevant harder outcome. Show the work before the reopened route. The missed course intake itself stays missed.
- **Layers** are inline disclosures, “See how it adds up” and “What makes the next start easier?” They preserve the current comparison and return focus to their trigger when closed. The core sentence about outside circumstances is always visible. Preserve open layer state across scene/deep-dive returns and reloads as part of the URL state; unknown layer IDs close safely.
- **Whole map** changes framing, not age or the selected comparison. Selecting a different starting age closes inspection and resets comparison to that age's reference example.
- Persist the starting age, scene, selected/overview state, inspected decision and comparison in the URL. Direct links and browser Back/Forward restore the settled state without entrance animation. Unsupported values normalize to a valid authored state; future decisions cannot be labeled as memories of an earlier today.
- Opening an optional example, the reading view, About or the index preserves the committed story state. Closing returns predictably to its trigger. Existing history/dialog and manual/system reduced-motion regressions remain covered.

This is one authored comparison with three views, not a branching game. There is no saved profile, input of personal history, numerical opportunity count, generated advice or simulated lifetime outcome. A later simulator requires a separate proposal; do not add simulation infrastructure in anticipation of it.

## Visual and motion contract

Keep the clean field-guide composition and collapsible index from [003](003-visual-language-and-navigation.md). Use real Tailwind layout, spacing, type and responsive utilities, with a small named project theme; do not translate every existing pixel value into an arbitrary-value utility. Diagram coordinates are a separate illustration concern, not a page-layout scale.

The opening stays abundant and nonlinear in height. All route segments progress left to right: remove loops, backward curls and near-loops caused by reversing horizontal control points. More angular bends are acceptable. Avoid new crossing ambiguity around selected decisions; extensive cosmetic branch-splitting work is secondary.

Keep the traveled route dark green. Make untaken gray routes and the dotted today divider clearly visible at all test viewports; do not reuse the existing nearly invisible untaken color. Possible routes remain lighter gray-green. Distinguish states using solid/dashed treatments and labels as well as color. Essential outcome routes and the divider must remain legible without relying on the contextual field. Final colors and stroke widths require rendered review, not approval by hex value alone.

Use vertical placement for composition, not as a score for success or human worth. Name favorable and unfavorable consequences explicitly. Background branch counts and spacing do not encode probability, wealth, lifespan or an evidence-based quantity of freedom.

Retain feedback within 100 ms, approximately 500 ms of travel and 250 ms of post-arrival focus. Comparison emphasis should settle within about 250 ms and must not replay the entire lifetime. A brief local halo may follow the dot, disappearing at rest. Every input interrupts prior motion; never queue animations. Reduced motion shows the identical settled content without travel or camera animation. Hover does not move the camera or delay reading.

## Implementation boundaries

Use Canvas 2D for routes, route tracing and the dot; keep meaningful text, labels, buttons, focus indicators and the reading alternative in HTML. Canvas pixels do not expose the drawn objects as semantic content, so the HTML explanation must carry the full meaning independently. [Canvas API and accessibility](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API#accessibility_concerns).

Build Tailwind locally with its Vite integration. Retain plain JavaScript modules and static output; no React, Three.js, runtime CSS CDN or backend is needed for this revision. Tailwind theme variables supply shared typography and color tokens; read those same tokens for Canvas rendering rather than maintaining a competing palette. Pin compatible installed versions in a lockfile during implementation. [Tailwind theme variables](https://tailwindcss.com/docs/theme), [official Vite integration](https://tailwindcss.com/docs/installation/using-vite).

Separate responsibilities:

- **Authored story data:** stable moment IDs, ages, context, and one comparison with reference/alternative/repair views, consequences and canonical research links. The map and HTML explanation consume the same records.
- **Pure state and route model:** URL normalization, today versus inspected decision, comparison selection, explicit route-to-outcome relationships, deterministic forward-moving geometry and camera bounds. No dependency on Canvas or DOM.
- **Canvas view:** drawing, coordinate transforms, device-pixel-ratio sizing, one cancelable animation loop, resize and pointer proximity detection. It does not decide narrative consequences.
- **HTML/app layer:** Tailwind reading shell, scene navigation, previews, semantic decision controls, comparison copy, dialogs, history and focus. Canvas labels and HTML targets share one camera transform to avoid drift.

If Canvas initialization fails, retain the complete readable comparison and working HTML controls. If JavaScript is unavailable, static HTML still presents the opening explanation and a full worked comparison. Rebuild the reading alternative from the same authored material at build time to avoid a separate evolving version of the lesson.

No production routing or deployment is introduced. Preserve the currently working prototype through Git history and verify its replacement before handing it over. Document the changed install, development, test and build commands; do not continue claiming the rewritten prototype is dependency-free.

## Evidence and editorial limits

The [learning findings](../research/learning/README.md) support distinguishing useful foundations from copying, repeated avoidance and gaps, and explain why prior knowledge sometimes needs adapting. The [lifetime findings](../research/lifetime/README.md) distinguish preparation, eligibility, real timing constraints and supported recovery. The [development findings](../research/decision-making/README.md) support age-sensitive help without treating timeline age as a measure of an individual reader's capacity.

These sources support mechanisms, not Mika's exact biography or the ages attached to it. Mark the examples as fictional near their first use, and expose a short “Why this example?” note linking to the relevant research bucket. Keep the habits bridge short and link to the separate [habits proposal](004-habits-and-daily-practice.md); do not imply that child habit-change research is complete.

## Acceptance and review

- A reader can name a decision, explain what it changed, and distinguish the immediate action from a repeated pattern and a deadline.
- Age 12 demonstrates both a foundation supporting later learning and a gap requiring extra work; the visible routes and named outcomes change with the comparison.
- The same comparison shows repeated occasions, not a one-off lifetime verdict. Readers can name something Mika controls, something Mika does not, and a specific way that an earlier action can help the next attempt. Starting a routine and learning effectively remain distinct; no general virtue habit, shame labels or streak penalties appear.
- Ages 25, 40 and 60 show new opportunities and practical constraints rather than a mechanically shrinking future. No biography is implied to describe the reader.
- Earlier points remain accessible after zooming through map targets and visible HTML controls. Hover/focus previews, click/touch selection, return to today, direct links and history agree.
- Layout uses Tailwind's shared system. At 1440 × 1000, 1133 × 744 and 744 × 1133 CSS pixels, text remains readable, controls have at least 44 × 44 CSS-pixel targets, and the page has no accidental horizontal overflow. Phone support remains deferred.
- The opening retains abundance; selected paths and the today divider are legible; no route curls backward or produces a visible loop. Essential labels remain at least 16 CSS pixels during zoom/resize.
- Test state transitions and named route consequences independently of Canvas; test sampled geometry for finite coordinates and nondecreasing horizontal progress. Browser checks cover rapid input, coordinate alignment after resize, keyboard/touch equivalents, reduced motion, dialogs/history and static fallback.
- Run at least two actual visual review/improvement loops on the rewritten prototype before presenting it. Save before/after screenshots and record what changed. Inspect motion as well as settled captures; do not equate screenshots with tested animation or physical-iPad compatibility.
- Run the build and model/browser suites, obtain an independent code review, and address important findings before handoff. Claim only the browsers and viewports actually checked.

The written design is the current review artifact. After approval, write the implementation plan against this specification; the existing application has not yet been rewritten.
