# 001 — Choices experience

Status: Proposed. Created: 2026-09-06. Updated: 2026-09-14.

Guided progression, high-quality animation, optional deeper explanations, a selectable example age, and an audience of 8+ are product requirements. The short first lesson described below is the current bounded editorial direction; the complete chapter remains proposed for later review. [011 — Choices hiking storyboard](011-choices-hiking-storyboard.md) now holds the canonical 321-word, four-scene reader story and optional fictional map exploration. The owner accepted the v04 storyboard for prototyping, with the character renamed Alfredo. The [v05 name-only update](../design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html) preserves that design; the broader chapter remains proposed. A narrow implementation study exists under `prototype/`; it is not the production site and has not been published. Owner feedback informed [008 — Choices and consequences](008-choices-and-consequences.md), the implemented earlier study with a single layered comparison, repeated choices, outside circumstances and revisitable moments. The [brief](../brief.md) records requirements; [research findings](../research/report-source.md) explain the evidence behind the editorial direction. [006](006-storyboards-and-motion-study.md) and [007](007-interactive-map-prototype.md) record earlier prototype slices.

## Recommended approach

Create a guided, animated explanation called **Your future has more than one path**. A branching lifetime map anchors the story as the reader advances through four short scenes. Follow fictional child Alfredo across several hikes to distinguish steps accumulating within one day from learning, preparation and a specific routine carrying into later hikes. Weather and adult or ranger help show that choices do not act alone. Offer optional depth and map exploration with a clear return to the main sequence.

The emotional destination is capable, curious agency: “What could I do next that helps?” The intellectual destination is understanding how learning, choices, preparation, uncertainty, and course correction interact. Learning that compounds is a central explanation, not a passing motivational phrase.

The main interaction decision is how readers control the pace:

| Approach | Strength | Main cost |
| --- | --- | --- |
| Reader-controlled steps with Next, Back, and replay | Recommended: each explanation has a clear beginning and endpoint, and the child sets the pace | Needs careful scene transitions and orientation |
| Scroll-triggered scenes | Can feel fluid within a continuous page | Scroll position can become difficult to coordinate with examples and revisiting a scene |
| A narrated, automatically advancing presentation | Gives an authored viewing rhythm | Less room for discussion and different reading speeds; better suited to optional future clips |

Use reader-controlled chapter scenes, normal scrolling within a scene, and a separate continuous reading view. Optional branches deepen a particular idea without changing the order of the core explanation. Scene navigation may show position, but the life map itself is not a literal process stepper: its lines represent illustrative routes, not a prescribed sequence of stages.

The first entry should be a short click-through explainer, roughly 2–3 minutes for one takeaway. Keep the main path light enough to finish quickly; examples and optional deep dives can add depth without making them prerequisites. A possible second entry may let a reader choose an example age and show relevant fictional examples. Looking back to age eight is allowed only as a clearly labeled part of an older fictional example, and the interface must never imply that the reader personally did those things. Age-range routing and a complete redesigned short lesson are next-stage scope unless the existing controls can express them.

## Visual reference and central metaphor

The [supplied life-paths image](https://i.redd.it/0ica4htbtm671.jpg) shows a single lived path, alternative paths in the past, a vertical “today” boundary, and many branching possibilities ahead. The image carries a Wait But Why mark; [this attribution reference](https://dariawilliamson.com/navigating-your-life-path/) credits Tim Urban. The original publication has not been independently established. It is a design reference, not empirical evidence or an asset included in this repository.

Build the storytelling around its past/present/future structure. The opening shows that there is still a future to shape from today. Then the explanation moves the boundary through a fictional example to show how preparation changes the next reachable steps.

Use an original diagram and visual language. Label the lived path, past alternatives, possible future paths, and routes needing preparation. A path not taken in the past does not imply that every similar future opportunity is permanently unavailable. Branches illustrate possibilities, not equal likelihood, exhaustive options, or promised outcomes.

The approved v06-style composition is a code reference, not a raster asset to ship as the UI. The map must be completely flat: no dimensionality, shadows, highlights, bevels, volume-implying gradients, or shaded dots, including on gray and green lines. Gray and green routes use uniform stroke color and width; only a page-edge opacity mask may soften their visibility at the boundary. Preserve the numbered design-study/version conventions and historical captures while refining the code implementation.

## Learning outcomes

After the chapter, a reader should be able to:

1. Explain how something learned earlier can support a new role or later understanding.
2. Distinguish being prepared for an opportunity from being guaranteed an outcome.
3. Explain how many small actions can add up, while one repeated practical check may become familiar.
4. Identify a way to respond when a route becomes difficult, including help or a different strategy.
5. Distinguish a person's action from weather, available help and other conditions that also change what happens next.

These are proposed comprehension goals. They do not claim changes in lifelong behavior.

## Central explanation: learning and choices can carry forward

Use “compounding” to mean that earlier learning can help the next learning, and choices about practice and help can sustain that process. The [learning research](../research/learning/README.md) distinguishes three mechanisms and their limits. Keep the word if it is useful; explain it through visible actions before naming it.

| Role in the proposal | Example | What the visual must show |
| --- | --- | --- |
| Current core | Alfredo learns to match map landmarks, then helps an adult plan and check an unfamiliar route on a later hike | Highlight the earlier understanding being used in a new section; time and packing, not map learning alone, make the lake practical |
| Possible future optional example | Ari understands equal parts, then equivalent fractions, then uses a ratio in a model | Highlight the earlier idea being reused in the next step |
| Possible future optional example | A tennis learner tries another racket sport | Show a possible familiar element alongside something that needs fresh practice; no instant mastery |
| Possible future optional example | A maths explanation leads to a satisfying discovery, and Ari chooses another puzzle | Show a possible feedback loop, with help or a different approach available |

These are fictional teaching examples, not individual predictions. The hiking series is the proposed core; maths, tennis and a progress–enjoyment loop remain possible later examples or optional depth, not first-path mandates. A head start is not a guarantee, and a reinforcing loop is not a fixed rate of growth.

Choices belong inside the mechanism: learn from an experience, return to a specific practice, prepare and decide what to attempt next. Give teaching, time, access, weather and help visible roles. The diagram must not divide readers into natural enthusiasts and permanent outsiders.

The first chapter includes only a brief habits bridge: across hikes, packing sunscreen becomes a familiar part of Alfredo's check. The [dedicated habits proposal](004-habits-and-daily-practice.md) covers the fuller explanation and practical experiments. That lesson is separate, not additional first-release scope.

## Choose where “today” begins

Let readers choose a starting age or life stage for the explanation. The starting point refers to the map's “today” marker, not video playback time or the reader's comprehension level. A child can explore an adult starting point, and an adult can explore childhood.

Use a default example age of eight and authored choices of 8, 12, 16, 25, 40, and 60 in the narrow prototype. These are navigation conveniences, not developmental boundaries. Choosing a moment sends a dot from the beginning at the left along the lived route to that example's “today,” then the view moves modestly closer. The selector remains available after the opening; behavior across the complete chapter remains to be settled.

Preserve the core teaching sequence while adapting the situation: learning foundations in childhood, choosing preparation routes in the teens, or developing/rebuilding skills in adulthood. Where a younger-child backstory is useful, label it as a look back within the fictional example. Do not invent a personal history from the selected age or imply that an age automatically removes a branch. The earlier map can be schematic and explicitly illustrative.

No birth date, account, or personal history is required. Allow the selected example age to travel with a shared scene link. Choose an age to explore, not a life score to receive.

## Decision-making development belongs later

Do not add “How do we get better at making choices?” or executive-function teaching as a deep dive in this lesson. Those questions belong to the separate later **How we make choices** lesson. The [developmental research](../research/decision-making/README.md#developmental-context-for-the-8-audience) can inform age-appropriate delivery without becoming extra Choices–Paths content.

## Chapter sequence

The current canonical proposal is the 321-word first path in [011](011-choices-hiking-storyboard.md), organized as four small beats. This remains a proposed roughly 2–3 minute experience to test with readers, not a reading-speed promise or a guarantee of comprehension. Optional examples, map exploration, deeper questions and adult notes sit outside that first-path budget.

| Beat | Visible action | Explanation or optional branch |
| --- | --- | --- |
| 1. Many possible life paths | Settle on the abundant lifetime field, then introduce fictional Alfredo | The map shows possibilities, not a prediction, score or success axis |
| 2. Small actions add up on one hike | Move into a literal trail map; many footsteps carry Alfredo and an adult to a stream | Physical steps add distance within the day; map learning can carry to a later hike |
| 3. Earlier learning changes later possibilities | Compare first and later hikes; Alfredo helps plan and check an unfamiliar lake route | Learning changes Alfredo's role; time and packing make the lake practical; one sunscreen check becomes familiar |
| 4. Other things change the plan | Show rain, ranger information and adult help, then pull back while retaining the trail inset | Choices matter without controlling weather; another route and a worthwhile next action remain visible |

Use this single understandable hiking chain in the first path. Do not require a second interest or life-stage montage to complete the core explanation.

### Optional depth and later lessons

The earlier seven-scene outline is retained as optional depth or material for later lessons, not as a required first path. Maths foundations, related-sport transfer and a possible progress → enjoyment → learning loop remain candidate future examples rather than core acceptance requirements. Decision psychology and developmental explanation belong to the later **How we make choices** lesson. Each optional example remains subject to reader testing and the evidence limits above.

## The branching map

The diagram is an illustration of possible mechanisms, not a simulation of actual life outcomes.

Read time from left to right in the approved desktop and iPad mini prototype. Phone direction and reflow are deferred. Use childhood, teenage years, early adulthood, and later adulthood as broad stages. Avoid age-number deadlines and a vertical “success” axis.

The opening starts with an abundant field of original nonlinear routes inspired by the reference's density and topology, not its exact drawing. Paths may rise, fall, cross and wander, but must progress left to right without loops or backward curls. Vertical position is not success or worth, and route count is not a measured number of opportunities. The proposed hiking comparison in 011 labels specific changes in Alfredo's role and the group's practical destination, then keeps rain, ranger information and adult help visible when the route changes.

Keep the full overview legible without panning. In the selected state, the traveled path is dark green, past alternatives are clearly visible gray, and still-possible routes are lighter gray-green; the dotted today divider remains legible. A modest zoom follows the dot's arrival without erasing the wider meaning. Labels, line treatment, and adjacent prose supplement color. Every state needs a static reading/print equivalent, and no essential information depends only on color, hover, or animation.

The optional exploration proposed in 011 is fictional and preserves the reader's lesson state. It previews paths without committing, permits only connected branch choices, and distinguishes story Back/Next from map choice navigation. Its storyboard direction is accepted for prototyping; it is not implemented behavior.

Do not use a success score, salary totals, probability percentages, a fixed number of remaining life options, or a green-versus-red ranking of occupations. Illustrate specific reachable activities and what they require.

## Guided progression and depth

Each core scene has a short title, a clear explanation, one principal visual event, and visible Back/Next controls. Show current position, such as “3 of 4,” and provide a chapter overview for revisiting earlier ideas. A reader can replay a transition or move on immediately; progression does not require waiting for an animation or passing a quiz. An end quiz is a future idea, not part of this experience.

Offer clearly labeled actions where useful: “Show me an example,” “Why does that happen?”, and “Go deeper.” Deeper material is for curious children as well as adults; research citations and methodological detail live in the adult/source notes. Use inline expansion or a dedicated subscene that retains the parent scene and an explicit “Back to the explanation” action. Closing it restores the same map state and position.

Use a stable chapter URL plus named scene fragments and a selected-age parameter for sharing and returning. Browser Back/Forward must follow scene and age navigation predictably. Keep a “Read the whole chapter” view for scanning, printing, and readers who prefer continuous prose. Avoid accounts or tracking as prerequisites to progress.

## Animation quality

Motion carries the explanation: settle the lifetime map, move into one literal hike, compare first and later hikes, show a weather-changed route, and pull back while retaining the trail inset. Preserve object identity between scenes so the reader can follow what changed. Each transition ends in a clear, readable composition.

Use a consistent motion language and pacing. Brief transitions should feel responsive; longer explanatory sequences need replay and skip controls. Pause visual activity while the reader considers a question or opens a deeper explanation. Avoid continuous decorative motion competing with the text.

The opening map is the signature interaction described in [003](003-visual-language-and-navigation.md#signature-map-interaction). Motion should be quick, functional, and quietly impressive: immediate feedback, a dot traveling from the beginning along the lived route to today, and a modest zoom after arrival, not a mandatory cinematic introduction. Repeated input interrupts the active sequence. The first working study must establish through rendered review whether this improves orientation and feels satisfying across the audience.

Reduced-motion mode preserves every explanation and final diagram state using immediate changes or restrained transitions. All controls work by keyboard and touch, focus remains predictable, and no information relies on timing or sound.

## Future video explainers

AI-generated video is a possible later medium for selected examples or short explanations. Keep each scene's written explanation and storyboard independent of a particular rendering tool so an approved clip can complement it later.

If introduced, clips should be optional, user-started, captioned, and accompanied by a transcript and an equivalent text/diagram explanation. Returning from a clip preserves the current scene. Review factual content, character continuity, and relevance before publication. Video production is outside the first-release scope; no provider or generation workflow is selected yet.

## Voice and depth

The [sample opening](../content/choices-opening.md) is a prose voice reference. It will need to be divided into scenes and reframed around the opening “today” view for the guided experience. The main narration speaks directly and warmly, offers reasons, and invites disagreement supported by reasoning. It avoids baby talk, motivational slogans, and adult admissions anxiety.

Introduce useful terms in context: an **option** is something you could choose; a **prerequisite** is something needed before another step; a **trade-off** is what choosing one thing means giving up elsewhere. Start with the experience and use the word when it helps.

Offer one core text for the whole audience. A younger reader can discuss or draw an answer. A reader ready for more complexity can consider a second possible outcome, an unknown fact, or competing priorities. Adult notes explain evidence limits and ways to ask follow-up questions without supplying the “correct” personal ambition.

## Visual direction

Use the clean natural-history field-guide treatment described in [003 — Visual language and navigation](003-visual-language-and-navigation.md): an open reading surface, precise diagram and callout lines, and occasional ink-and-wash specimen illustrations. The shared shell includes a collapsible left panel, expandable Choices navigation, and separate About and Source code links. Product document 003 is the source of truth for the palette, typography, illustration treatment, and panel behavior.

The accepted v04 storyboard and its v05 name-only update cover the four-scene hiking story and map-exploration states; neither implements them. The viewport targets remain desktop and iPad mini, with phone design deferred. Review still needs to assess illustration consistency, reading comfort, visual hierarchy, touch targets, reduced motion, and whether the two map scales explain the mechanism without a spoken rescue explanation. An HTML review artifact does not establish behavior or production readiness.

## Experience acceptance criteria

- A reader can complete the explanation, move backward, replay a scene, and resume after an optional example without losing orientation.
- The main click-through can communicate one takeaway in roughly 2–3 minutes, while optional examples and deep dives remain clearly optional.
- Every core scene communicates one central idea and settles into a readable visual state.
- A shared scene link opens the intended scene; browser navigation is predictable.
- A reader can choose a starting age, switch it later, and share the same example without entering a birth date. Examples remain understandable from age eight even when depicting adult choices.
- Continuous reading and reduced-motion modes retain the same core teaching content.
- The hiking series distinguishes footsteps adding distance within one day from map understanding carrying into a later hike.
- A reader can distinguish Alfredo's new ability to help plan and check the route from the time and packing that make the lake practical for the group.
- Rain changes the route, and ranger information plus adult help remain visible without implying a guaranteed life outcome or lone recovery.
- Optional fictional map exploration preserves story state and follows the interaction and accessibility contract in [011](011-choices-hiking-storyboard.md#explorable-lifetime-map-contract).
- Choosing the example moment is available by keyboard and touch as well as pointer. The dot travels along the lived path, the modest zoom follows arrival, the visual settles quickly, and no reader must wait for its flourish to navigate.
- Desktop and iPad mini layouts keep controls and meaningful labels readable. Phone support is deferred and can be reconsidered later; it is not a requirement for this initial experience.
- Optional videos are not required for the first release or for understanding any existing explanation.

## Reader check

Use the [current hiking prompts in 011](011-choices-hiking-storyboard.md#acceptance-reader-prompts) to test the proposed core, with permission from the supervising adult and without collecting identifying information. The prompts below are retained for possible future optional examples; they are not acceptance requirements for the hiking story.

| Prompt | Useful evidence of understanding | Signal to revise |
| --- | --- | --- |
| “A child does not yet know what job they want. Why might learning to explain an idea still help?” | Names more than one possible use or a later learning step | Thinks the child must pick a career now |
| “Someone plays tennis and tries a different racket sport. What might help, and what might they still need to learn?” | Distinguishes a possible head start from new practice | Assumes every technique carries across unchanged |
| “Ari enjoys solving a maths problem and chooses another. Where could help enter this pattern if Ari gets stuck?” | Identifies an explanation, support, or changed challenge | Thinks the loop only works for children who already love maths |
| “A well-prepared team loses when the event is interrupted. Was preparing a mistake?” | Separates useful preparation from the uncontrollable result | Treats every poor outcome as a poor decision |
| “Someone is behind in a skill they now need. What could they try?” | Gives a concrete learning, help, or alternative-route response | Says the future is already ruined |
| “Two interesting clubs meet at the same time. How could you choose?” | Considers interests, commitments, information, or a trial | Thinks keeping options open means doing everything |

Include readers near the eight-year-old entry target and older readers. Also test a child exploring an adult starting age: can they tell that this is an illustrative scenario? Revise if a central misunderstanding appears; ask about it again with a different example. A small family check supplies product feedback, not a validated educational efficacy claim. Broader sharing should eventually include feedback from another household.

## First release and follow-up

The first release contains the topic orientation, this complete chapter, adult/source notes, and a short About page within the shared navigation shell. It should have a satisfying ending and one usable reflection even before another chapter exists.

The proposed follow-up, **The choices we repeat**, connects daily decisions with habits and practical review. [Product document 004](004-habits-and-daily-practice.md) defines its scope, evidence needs, and placement. It remains a separate content task; do not expand the first release to write an entire habit curriculum.

Relationships remain a separate subject. Do not add placeholders or menu entries for unwritten sections.

Conflict and de-escalation remain part of that future relationships subject, not this choices/learning lesson. “What makes a happy life?” is a possible future deep-research topic; do not research it or add unsupported evidence here.

## Next work

Implement the bounded local lesson and map exploration from [011](011-choices-hiking-storyboard.md), using the [Alfredo storyboard](../design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html) and preserving the accepted v04 design. The older prototype and superseded storyboards remain historical inputs, not a reason to reopen the accepted v04 design. Refine the proposal and test it with readers before production implementation; [002 — Delivery architecture](002-delivery-architecture.md) covers the eventual hosting and route requirements.
