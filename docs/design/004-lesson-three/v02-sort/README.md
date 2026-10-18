# v02 — Sort

Created: 2026-10-18. Status: in review; a copy pass the same day changed the words, so every frame it touched is captured again as `-v02` (v01 kept). Static frames only: nothing here is playable, and nothing is in `src/`.

## Question

After v01: do the new examples for steps 04 and 05 (a friend at the park who keeps changing the rules), the new step 03b (Now or later, the rider noticing what matters right now) and the hero without leader lines read as one idea? And does activity B, Elephant or rider, work as a plain sort on Lesson 1's drag-to-sort board?

## Related documents

- [v01 — On paper](../v01-paper/README.md): the round this one changes.
- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 3 · The elephant and the rider".
- Lesson 1's sort board: `src/lessons/choices/journey-sort.js` and `journey-sort.css` (the hike's packing sort), the mechanism the activity reuses.
- [`copy.md`](copy.md): every word on the frames, step by step. The frames read this file.

## Files and how to open them

- Frames: [`prototype/lesson3-elephant/`](../../../../prototype/lesson3-elephant/): `storyboard.html`, `activities.html`, `lesson3.css`, `shell.js`, `scenes.js`, `storyboard.js`, `activities.js` and `copy.js`, which now reads this round's `copy.md` (v01's frames are kept as captures in [v01](../v01-paper/README.md)).
- The elephant and its rider are `src/lessons/shared/elephant.js` (asset-studio's `elephant-b.js`), imported unchanged. The activity's side icons are its `elephant()` and `rider()`, scaled down.
- Serve: `npm run dev:prototype -- --host 127.0.0.1 --port 4648 --strictPort`, then open
  - <http://127.0.0.1:4648/prototype/lesson3-elephant/storyboard.html>
  - <http://127.0.0.1:4648/prototype/lesson3-elephant/activities.html>
- Every frame is one viewport tall. Back, Next and the arrow keys move between frames; `#story-04` or `#activity-B-2` opens one frame.

## Review images

Contact sheets: [storyboard](storyboard-sheet-v02.png) and [activity](activities-sheet-v02.png) (before the copy pass: [storyboard v01](storyboard-sheet-v01.png), [activity v01](activities-sheet-v01.png)).

Bake-off, lane A (minimalist, clean lines, the same simplicity as v01), at 1440×900: [hero](bakeoff-A-hero-1440-v01.png), [step 04](bakeoff-A-step04-1440-v01.png) and [activity mid-sort](bakeoff-A-activity-1440-v01.png). Their text predates the copy pass (step 04 still says "bite your tongue", and the mid-sort cards and story text are the earlier ones).

| Step | 1440×900 |
| --- | --- |
| 01 Rider and elephant (hero) | [story-01-pair](story-01-pair-1440-v01.png) ([1133×744](story-01-pair-1133-v01.png)) |
| 02 Strong and quick | [story-02-quick](story-02-quick-1440-v01.png) |
| 03 Slow and careful | [story-03-slow](story-03-slow-1440-v01.png) |
| 03b Now or later (new) | [story-03b-now](story-03b-now-1440-v02.png) |
| 04 Pulling the reins | [story-04-reins](story-04-reins-1440-v02.png) |
| 05 Easier paths | [story-05-path](story-05-path-1440-v02.png) |
| 06 One team | [story-06-team](story-06-team-1440-v02.png) |
| 07 Reasons afterwards (optional) | [story-07-first](story-07-first-1440-v01.png) |
| 08 Three ideas to keep | [story-08-keep](story-08-keep-1440-v02.png) |
| 09 Coming next | [story-09-next](story-09-next-1440-v01.png) |

| Activity | Start | Mid-sort | End |
| --- | --- | --- | --- |
| Elephant or rider | [B-1](activity-B-1-1440-v02.png) | [B-2](activity-B-2-1440-v02.png) ([1133×744](activity-B-2-1133-v02.png)) | [B-3](activity-B-3-1440-v02.png) |

B-2 is the busiest frame, so it is the second one shot at 1133×744.

## Changes from v01

| Step | Change |
| --- | --- |
| 01 pair | The leader lines are gone. "Rider" sits just above the rider's head and "Elephant" just behind the elephant's rump, as plain labels. Words unchanged. |
| 03b now (new) | Now or later, in the Two strengths chapter after 03: the family waits in the car, the jacket zip is stuck, and the rider sees that it can wait. The step id keeps v01's numbers, so step 04 is still Pulling the reins. "What matters now" fails the copy check's question rule as a heading (it starts with "what"), so the heading is "Now or later." and the body says "what matters now and what can wait". |
| 04 reins | At the park, a friend keeps changing the rules. The friend has the ball and a new line in yellow chalk runs across the old game; the rider holds the reins. The friend is having fun, not being mean. |
| 05 path | The same park. The pair stands calm a few steps away by a tree, at the end of a short side path, and the friend waits at the game. Labels: A breath first, Rules agreed. |
| 07 first | The reason is a chip just above the rider, with no line. |
| Activity | Only B, Elephant or rider, as a plain sort on Lesson 1's board. A and C are gone. |

## Activity

Elephant or rider, on Lesson 1's drag-to-sort board: the pile in the middle, the elephant's side on the left and the rider's on the right, each with its small picture and name. The elephant and its rider stand big and calm above the board, in the middle. Six moments, three for each partner:

- Elephant: Mad at the tower, Sad after losing (the two first feelings), Catching a ball.
- Rider: Planning a birthday, Saving for a bike, Solving a puzzle.

There is no score, count or right-or-wrong mark. When a card lands, its quiet line shows under the story text (B-2: "The elephant feels the sting before any thought."). A card dropped on the other side slides across to its own, with the same quiet line. At the end both sides are full and each gets its strength, Strong and quick and Slow and careful, with Start again in the middle.

## Word count

Counted from `copy.md` as `copy.js`'s `countWords` counts (heading, paragraphs and takeaways; picture labels excluded).

| Step | 01 | 02 | 03 | 03b | 04 | 05 | 06 | 07 | 08 | 09 | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Words | 50 | 44 | 48 | 49 | 45 | 42 | 39 | 36 | 49 | 17 | 419 |

Limits: 50 a step, 450 in total. Step 01 is at the limit. Without the optional step 07 the main path is 383 words.

## Checks

- WebKit (Playwright 1.62.1), every frame at 1440×900 and 1133×744: no console errors, no text under 15 px, no story column overflow.
- `copy.mjs --url` on both pages, with and without `--phone`: 0 failures. The warnings left are "negative" on lines that are meant ("Neither one is the real you", "Not hungry") and "command" on the Start buttons.

## Simplified

- Poses: the elephant still only has `stand`, `walk1` and `walk2`, facing right. 04 uses `stand` with reins (a pose leaning toward the friend would carry "wants to yell" better); 03b uses `walk1` toward the car; 05 uses `stand`.
- The friend is Maya's figure (`person()`) in a lake shirt with clay hair, flipped, in her dribbling pose. A standing friend holding the ball, or one drawing with chalk, would fit 04 better.
- The car is a flat side view with its back door open and two grown-ups as plain shapes in the front.
- The activity frames are static; dragging, the slide-across and Start again do nothing.

## Known issues

- The delivered rider still shares Alfredo's look (v01's issue). In the "your elephant" steps it could read as Alfredo.
- In 04 the elephant is calm in a stand pose; only the words say it wants to yell.
- The two side icons in the activity are small (about 30 px); the rider alone reads as a figure, not clearly as the rider.
- The pile's longer cards ("Planning a birthday", "Saving for a bike") can wrap to two lines.
- Copy pass: with the new zip lines step 03b came to 52 words, so its last sentence is shortened to "You fix it in the car." (49).

## Quote to check

As in v01: step 06's "We are the rider, and we are the elephant," writes Jonathan Haidt (*The Happiness Hypothesis*, 2006, reported as page 22) is **to check** in the book before it ships. Plain-words version: "You are the rider, and you are the elephant too."
