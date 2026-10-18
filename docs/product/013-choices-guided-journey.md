# 013 — Choices guided journey

Status: Approved by the owner as Lesson 1 (2026-09-27); implemented in the Astro site at `/choices/the-paths-we-make/`. Published. Since 2026-10-13 the lesson opens with one written life and its what-ifs ([v13](../design/001-choices-explainer/v13-lesson1-opening/README.md)), and the ten-afternoon game described below is held for Lesson 2. Since 2026-10-18 Maya's chapter and the ten-afternoon activity live in Lesson 2, Practice ([016](016-lessons-two-to-four.md)). Lesson 1 has four chapters: Many paths, The hike, Explore and Take it with you, and its ending links to Lesson 2. The rows and notes below that describe Maya and the game record the study; Lesson 2 now holds them. Created: 2026-09-26. Updated: 2026-10-18.

[Editable copy (Draft 05)](../content/choices-journey.md) · [Live study](http://127.0.0.1:4600/prototype/journey.html) · [Design round v09](../design/001-choices-explainer/v09-guided-journey/README.md) · Earlier lesson: [012](012-choices-lesson-implementation.md), [Draft 02](../content/choices-story.md)

## Why

The owner liked the path drawing but not the flow of the [v08 lesson](../design/001-choices-explainer/v08-alfredo-lesson/README.md). Its three main scenes showed the same map while only the text changed. The concrete story sat behind a secondary link, and the controls felt like a prototype, not a finished experience.

Owner direction (2026-09-26):

- Build a guided, reader-controlled journey with rich animation and polish.
- Show the big picture first, then dig into specific examples.
- Keep the hike: prepare, have a setback, try again, then face a closure you can't control, respond calmly and learn from it.
- Show compounding by contrasting two paths for one skill. Include carry-across to a related skill, such as soccer positioning helping with basketball.
- End with a small game. Choose how to spend afternoons, and watch soccer and cello skill boxes with three bars each.
- Make the structure a template for later lessons and for short AI-video explainers.

## Structure

| Chapter | Beats | What the picture does |
| --- | --- | --- |
| Many paths | Cover, many paths, one path at a time, outside your control | The approved path field grows from the beginning dot. A traveller walks to Today at age 12 and example choices appear as chips: dark for choices taken ("Joined a soccer team"), gray for choices not taken ("Chess club"), green for choices still possible ("Robotics club"). The labels come from 20 story sets in `prototype/journey-choices.js`, one per visit. The two future groups sit on connected branch families in the top and bottom halves and show progression: one builds on what was started (Make the school team → Captain the team / Coach younger kids), the other starts something new (Start cello → Get a cello tutor / Switch to piano). A small key replaces the earlier disclaimer line. A few future paths close, each with a reason chip ("The team was full"). The view then zooms into the traveller to open the hike. |
| The hike | Plan, halfway, turning back, practice, second try, closure, response, sort | A flat SVG trail map with walkers, water bottles and a backpack that collects what Alfredo learns. The two setbacks are water (their planning) and a storm closure (not their control), each with a choice and feedback. The chapter ends with a drag-to-sort board: drag cards from the middle to "Their choice" or "Outside their control". Tapping a card and then a side also works, as does the keyboard (← →) or Skip. A wrong drop shakes and returns the card for another try. |
| Explore | One interactive beat | A camera follows a traveller through a seeded tree of example choices from age 3 to 70. At each fork, two or three chips ("Get a tutor for maths", "Apply for the gifted programme", "Start an apprenticeship") sit above their branches. Hovering a branch previews in blue everything it could lead to. Some options are closed by circumstances, shown dashed with a reason ("No places left this year"). Gray not-taken branches keep their labels; clicking one goes back and takes it. The side panel lists "Your path so far" as steps you can return to. At 70 the camera zooms out to show the whole life path, with "Try a different life". |
| Take it with you | Takeaways | The life map returns at Today with two takeaways ("Choices add up" and "Not everything is yours to choose"). The text ends: "Alfredo got what he wanted by choosing to practise. Next: how practice works." Buttons lead to Lesson 2, back to the start, or to the explorer. |

Explorer tree rules (`prototype/journey-explore.js`): it is a separate illustrative structure, not the approved life-map network, which forks mostly before age five. Each node draws its own seeded number of options, fork spacing and bend, so forks never line up in synchronized columns. The branches ahead are laid out in nested bands so they don't cross, and a branch's height is fixed once passed. Labels come from age bands in `prototype/journey-choices.js`; choices before age seven are marked "chosen by family". Options are never ranked and closures only ever close some of the options at a fork.

## Interaction and delivery

- Controls: Next and Back, the ← and → keys, step dots, and a chapter trail in the header that fills as you progress. Each beat has a stable URL fragment, such as `#hike-closed`. Chapter jumps use browser history. Interactive boards that use arrow keys themselves mark their area `data-local-keys`, so the lesson doesn't move.
- Motion: the reader starts it and can interrupt it. Moving on cancels the running animation and sets the final state. Reduced motion jumps straight to each final state.
- Choices are optional. Next always continues with the story's own choice.
- Static alternative: *Read as text* opens the full lesson, built at compile time from the same story module. It covers choices, the sort answers, the game's days and options, and picture descriptions. Without JavaScript, the reading is shown instead of the guided view.
- Stack: Tailwind (compiled via Vite), Canvas 2D for the path field using the existing renderer and exploration engine unchanged, inline SVG for the hike, and semantic HTML for everything else.

## Evidence and boundaries

- The skill model, the related-skill head starts and Maya's comparison with herself belong to Lesson 2 ([016](016-lessons-two-to-four.md)). Their boundaries stay as written there and in the [learning findings](../research/learning/README.md): an illustration in words, not numbers, with partial head starts and no promised result.
- Circumstances stay visible: closed paths on the map, the storm, and the explorer's closed ways and lucky chances.

## Changes to current rules that need owner approval

1. The current AGENTS/BACKLOG wording makes Alfredo's hike an optional side example. In this study, the hike and Maya are part of the guided sequence, as requested. Every chapter can still be reached directly from the trail.
2. The docs call a simulator future scope. The game here is a small, authored ten-day illustration. The Explore chapter is a seeded example tree with made-up labels. Neither is a general simulator, editor or forecast.
3. The research names tennis as its carry-across example. This study uses soccer→basketball and cello→guitar, as the owner asked. The claims stay at "a head start that still needs adapting".
4. The first entry was meant to take about 2–3 minutes. The full journey is longer (about 15 minutes with the game and explorer), but the main idea is complete by the end of chapter 1. Decide whether to offer a short path.

## Template for later lessons and video

- Content lives in chapter and beat records (`kicker`, `heading`, `body`, optional `choice`, `sort`, `closer`, `learned`, `takeaways`, `alt`). The static reading and tests are built from those records.
- Round-two owner feedback (2026-09-26): remove the illustration disclaimer line, drag-to-sort with Skip, label real example choices on the map, no Next button in the game (vertical feed with day rail, past days editable), merge "travel" and "ahead", tighter Many-paths copy, and a fun, interactive life-path explorer with example choices.
- Each chapter's picture is a scene module with `show(beatId, { from, animate, token })` and optional `choose(beatId, optionId)`. Scenes must be able to reach any beat's final state directly, and may animate only when stepping forward one beat.
- Each beat's `alt` text doubles as a shot description for a future video storyboard. Hike beats 1–7 map one-to-one to short clips.

## Acceptance for this study

- The whole journey works at desktop 1440×900 and iPad-mini landscape and portrait sizes.
- Keyboard-only operation, reduced motion and the static reading work.
- No console errors in development or the compiled preview. The Node suite and build pass.
- Owner review of flow, tone and visuals. Reader testing with children near eight and older is still to be done.

## Open questions

- Ages: is 12 the right example age for the map?
- Should the earlier `choices.html` page remain as "Explore the life map", or be retired once this is accepted?
- Illustration style for the video pass: keep this flat SVG vocabulary, or commission a matching painted set?
