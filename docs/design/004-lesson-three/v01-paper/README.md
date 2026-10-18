# v01 — The elephant and the rider on paper

Created: 2026-10-18. Status: in review. Static frames only: nothing here is playable, and nothing is in `src/`.

## Question

Does Lesson 3 · The elephant and the rider read as one idea, told in pictures: a small rider on a big, strong elephant, two parts of one person working as one team, where the rider's best tools are training the elephant and choosing its path rather than pulling the reins? And which of three activity ideas (or none) should be built?

## Related documents

- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 3 · The elephant and the rider": the idea, the boundary, the beats and the candidate activity these frames draw.
- [Study 003, v03 — Practice on paper](../../003-lesson-two/v03-practice-paper/README.md): the model for this round's files and fidelity. [v04](../../003-lesson-two/v04-practice-build/README.md) is the built look the frames follow, and [v05](../../003-lesson-two/v05-elephant/README.md) puts the same elephant in Lesson 2.
- [Lesson 1 copy](../../../content/choices-journey.md), sections on the hike: Alfredo's water and the what-if this lesson retells. [Lesson 2 copy](../../../content/practice-journey.md), last step: the hand-off this lesson answers.
- [`copy.md`](copy.md): every word on the frames, step by step. The frames read this file.

## Files and how to open them

- Frames: [`prototype/lesson3-elephant/`](../../../../prototype/lesson3-elephant/): `storyboard.html`, `activities.html`, `lesson3.css`, `shell.js` (the lessons' frame and the takeaways band), `scenes.js` (paths, props and the placed elephant), `storyboard.js`, `activities.js` and `copy.js` (reads `copy.md`). Drawing helpers and Maya come from `prototype/lesson2-practice/draw.js`.
- The elephant and its rider are `src/lessons/shared/elephant.js` (asset-studio's `elephant-b.js`, card 6637), imported unchanged: `elephant()` and `elephantWithRider({ pose, reins })`, scaled and placed, never redrawn.
- Serve: `npm run dev:prototype -- --host 127.0.0.1 --port 4648 --strictPort`, then open
  - <http://127.0.0.1:4648/prototype/lesson3-elephant/storyboard.html>
  - <http://127.0.0.1:4648/prototype/lesson3-elephant/activities.html>
- Every frame is one viewport tall, stacked top to bottom. Back, Next and the arrow keys move between frames; `#story-04` or `#activity-A-2` opens one frame.

## Look rules for this round

- Today's lesson UI: the header, chapter trail, stage, story column, Back/Next, and the takeaways band under the stage, as Lesson 2 is built.
- Tokens from `src/styles/tokens.css` only. Flat: no shadows, bevels or volume gradients. Text 15 px or larger.
- Maya is the Garden figure (`person()`); Alfredo and his dad are Lesson 1's hike figures (`alfredo()`, `dad()`).
- The elephant is the delivered art. Its leg gap is the stage colour, so paths under its feet stay low and narrow enough that the gap never falls on them.

## Review images

Contact sheets: [storyboard](storyboard-sheet-v01.png) and [activities](activities-sheet-v01.png).

Hero frame: [story 01 at 1440×900](story-01-pair-1440-v01.png) and [at 1133×744](story-01-pair-1133-v01.png).

| Step | 1440×900 |
| --- | --- |
| 01 Rider and elephant (hero) | [story-01-pair](story-01-pair-1440-v01.png) |
| 02 Strong and quick | [story-02-quick](story-02-quick-1440-v01.png) |
| 03 Slow and careful | [story-03-slow](story-03-slow-1440-v01.png) |
| 04 Pulling the reins | [story-04-reins](story-04-reins-1440-v01.png) |
| 05 Easier paths | [story-05-path](story-05-path-1440-v01.png) |
| 06 One team | [story-06-team](story-06-team-1440-v01.png) |
| 07 Reasons afterwards (optional) | [story-07-first](story-07-first-1440-v01.png) |
| 08 Three ideas to keep | [story-08-keep](story-08-keep-1440-v01.png) |
| 09 Coming next | [story-09-next](story-09-next-1440-v01.png) |

| Activity | Start | Moment | End |
| --- | --- | --- | --- |
| A · Steer the elephant | [A-1](activity-A-1-1440-v01.png) | [A-2](activity-A-2-1440-v01.png) ([1133×744](activity-A-2-1133-v01.png)) | [A-3](activity-A-3-1440-v01.png) |
| B · Who's faster? (on screen: Elephant or rider) | [B-1](activity-B-1-1440-v01.png) | [B-2](activity-B-2-1440-v01.png) | [B-3](activity-B-3-1440-v01.png) |
| C · No activity | [C-1](activity-C-1-1440-v01.png) | [C-2](activity-C-2-1440-v01.png) | [C-3](activity-C-3-1440-v01.png) |

A-2 is the busiest frame (day strip, two labels, a trace and three choices), so it is the second one shot at 1133×744.

## Beats

The plan's nine beats are nine steps in five chapters (The pair, Two strengths, Steering, One team, Takeaways), with an Activity stop between One team and Takeaways. Nothing was merged or split: each beat already carries one picture and fits the word limit.

| Step | Beat | Change |
| --- | --- | --- |
| 01 pair | 1 Meet the pair | The heading names the pair. The brain line is "Many people find it useful. The real brain works in other ways.", because "it isn't how the brain is built, but…" fails the copy check as a not-x-but-y line. |
| 02 quick | 2 Strong and quick | Lesson 2's last picture again, so its question ("So who is doing it?") gets its answer. Maya's elephant has no rider here (see Known issues). |
| 03 slow | 3 Good at what's slow | Alfredo's what-if and his backpack card, Water for there and back, from Lesson 1. His elephant and rider stand beside him and his dad. |
| 04 reins | 4 Different wants | The words say "your elephant" and "your rider", not Maya's, because the rider drawn is not Maya. |
| 05 path | 5 Train and choose the path | Same fork as 04, so the change of path is the only difference. |
| 06 team | 6 One team | The quote is marked to check (below). |
| 07 first | 7 Optional deep dive | In the One team chapter; its kicker reads "For older readers · optional" in place of the step count. |
| 08 keep | 8 Takeaways | The three takeaways sit in the band under the stage, as Lesson 2 is built. |
| 09 next | 9 Hand-off | "Next: habits." became "Those paths are habits, and they come next.", a whole sentence without a colon. The button is Next: Lesson 4. |

## Activity hypotheses

Each is drawn in three frames: the start, the moment that teaches, and the end. Per screen: at most three choices, labels of four words or fewer, at most one result line of ten words or fewer, no numbers, scores, streaks or red.

- **A · Steer the elephant.** Three evenings at the fork, Monday to Wednesday, with the same three ways each evening: Pull the reins, Put the game away, Set out the books. A day strip shows each evening's pick as an icon. A-2 is Tuesday after Monday's pull: the elephant is back at the fork facing the game, Monday's turn and drift in gray. A-3 is Wednesday after Tuesday's Put the game away: the box stayed shut, the side trail grows over, and the elephant walks home with no steering. Hypothesis: feeling that a pull lasts one moment while a changed path lasts days teaches the steering idea, and seeds Lesson 4.
- **B · Who's faster?** (on screen "Elephant or rider", since a question can't be a title). One everyday moment at a time (Catching a ball, Planning a birthday, A sudden fright, Choosing what to pack); the reader taps The elephant or The rider, and the moment joins that partner's column. At the end each column gets its strength, Quick and strong or Slow and careful. Hypothesis: sorting real moments teaches the two kinds of strength (steps 02 and 03) better than reading them. It does not teach steering.
- **C · No activity.** The story alone, with one tap in step 04: Pull the reins turns the elephant up the homework path (C-2), and it drifts back to the game (C-3, Pull again). Step 04's words arrive in three parts around the tap. Hypothesis: the story is enough, and one felt pull is all the interaction the idea needs.

A and C felt most alike once drawn: in the first draft A's moment was the same pull and drift as C's tap. A was changed to run over three evenings, so its moment is that a pull doesn't carry over to the next day while a path change does. C keeps the single pull inside the story.

## Word count

Counted from `copy.md` as `copy.js`'s `countWords` counts (heading, paragraphs and takeaways; picture labels excluded).

| Step | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Words | 48 | 44 | 45 | 46 | 44 | 38 | 40 | 49 | 17 | 371 |

Limits: 50 a step, 450 in total. Step 08 is closest, at 49. Without the optional step 07 the main path is 331 words.

## Checks

- WebKit (Playwright 1.62.1), every frame at 1440×900 and every frame at 1133×744: no console errors, no text under 15 px, no story column overflow.
- `copy.mjs --url` on both pages, with and without `--phone`: 0 failures. Warnings left are "negative" on lines such as "Neither one is the real you", "Not hungry" and "That's no way to travel every day", which are meant.

## Simplified

- Poses: the elephant only faces right and has `stand`, `walk1` and `walk2`. Each frame uses the nearest one, and the poses the story needs went to asset-studio as a note in the elephant request (`requests/wisdom/2026-10-17-elephant.md`):
  - pulled by the reins, head turned up the path (04, A, C): now `stand` with `reins: true`;
  - drifting to the side trail (04, A-2, C-3): now `walk1`, side on;
  - on a path seen from a little above (05, 06, 09): now side-view `walk1` or `walk2`;
  - facing away from something (07): now `stand`, with the plate placed behind it;
  - a rider who explains, one hand raised (07): now `rider()` with a label;
  - a rider who doesn't read as Alfredo (02, and every "your rider" frame).
- The fork is seen from a little above while the elephant stays side on, so every path runs left to right. Where it went is drawn as a dotted trace, not as a turned elephant.
- In the path scenes the ground is the stage colour and the paths are the lessons' ground colour (sage at 22%). On a sage ground the mist elephant had too little contrast.
- Step 03's trail map is a simple sketch of Lesson 1's hike (trailhead, big rock, stream, lake), not Lesson 1's map module.
- B's moments come in a fixed order, and the frames show the first, the second and the end.

## Known issues

- The delivered rider shares Alfredo's skin, hair and yellow shirt. It reads well beside Alfredo in step 03, but it could read as Alfredo on Maya's elephant. Step 02 shows Maya's elephant without a rider, and 04, 05 and the activities speak to the reader ("your rider"). A rider in Maya's look, or a neutral one, is an asset-studio question.
- Frames are static. The choices, Start again and the C pulls do nothing.
- The chapter trail has six stops, one more than Lesson 2's. With C the Activity stop goes.
- Step 08's takeaway icons are small drawings of the pair, its prints and a fork. At 44 px the pair is only a silhouette.
- English only. No catalog keys yet.

## Quote to check

- Step 06 quotes Jonathan Haidt: "We are the rider, and we are the elephant." It is reported as *The Happiness Hypothesis* (2006), page 22, from a secondary transcription. The wording and page are **to check** in the book before it ships.
- Plain-words version, if it can't be checked: "You are the rider, and you are the elephant too."
- Step 05's "people who seem good at this tend not to fight the elephant much" rests on adult, correlational research (Galla & Duckworth, 2015: people with good self-control lean on helpful habits more than on resisting temptation). The words keep "seem" and "tend" for that reason.
