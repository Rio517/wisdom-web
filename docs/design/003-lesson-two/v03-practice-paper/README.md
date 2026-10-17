# v03 — Practice on paper

Created: 2026-10-17. Status: proposal for review. Static frames only: nothing here is playable, and nothing is in `src/`.

## Question

Does Lesson 2 · Practice read as one idea, told in pictures: Maya doesn't choose to be good at soccer, she chooses to go to practice, again and again, and those small choices add up? And which of three activity ideas (or none) should be built?

## Related documents

- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 2 · Practice": the plan these frames draw.
- [015 — Lesson 2 proposal](../../../product/015-lesson-two-proposal.md): the earlier habits plan, now Lesson 4's.
- [Lesson 1 copy](../../../content/choices-journey.md), section "Skills grow": the two-paths calendar, skill boxes and basketball carry-over this lesson retells.
- [Study 001](../../001-choices-explainer/README.md): Lesson 1's look, map and components, reused here.
- [`copy.md`](copy.md): every word on the frames, step by step. The frames read this file.

## Files and how to open them

- Frames: [`prototype/lesson2-practice/`](../../../../prototype/lesson2-practice/): `storyboard.html`, `activities.html`, `practice.css`, and the drawing modules (`draw.js` for the map, footprints and figures; `parts.js` for skill boxes and the lens; `shell.js` for Lesson 1's frame; `copy.js` for reading `copy.md`).
- Serve: `npm run dev:prototype -- --host 127.0.0.1 --port 4648 --strictPort`, then open
  - <http://127.0.0.1:4648/prototype/lesson2-practice/storyboard.html>
  - <http://127.0.0.1:4648/prototype/lesson2-practice/activities.html>
- Every frame is one viewport tall, stacked top to bottom. Back, Next and the arrow keys move between frames; `#story-05` or `#activity-B-2` opens one frame.
- The look is Lesson 1's: its header, chapter trail, stage, story column, tokens and Maya (`person()` from `journey-icons.js`). Lesson 1's interface words come from `src/i18n/messages/en.json`. Flat throughout.

## Review images

Contact sheets: [storyboard](storyboard-sheet-v01.png) and [activities](activities-sheet-v01.png).

Hero frame: [story 05 at 1440×900](story-05-steps-1440-v01.png) and [at 1133×744](story-05-steps-1133-v01.png).

| Step | 1440×900 |
| --- | --- |
| 01 Wanting and choosing | [story-01-want](story-01-want-1440-v01.png) |
| 02 Again and again | [story-02-again](story-02-again-1440-v01.png) |
| 03 A long, quiet time | [story-03-quiet](story-03-quiet-1440-v01.png) |
| 04 One season, then three | [story-04-map](story-04-map-1440-v01.png) |
| 05 Step by step (hero) | [story-05-steps](story-05-steps-1440-v01.png) |
| 06 Skills on skills | [story-06-builds](story-06-builds-1440-v01.png) |
| 07 Maths too | [story-07-maths](story-07-maths-1440-v01.png) |
| 08 A new ball | [story-08-basketball](story-08-basketball-1440-v01.png) |
| 09 Never too late | [story-09-late](story-09-late-1440-v01.png) |
| 10 Three ideas to keep | [story-10-keep](story-10-keep-1440-v01.png) |
| 11 Coming next | [story-11-next](story-11-next-1440-v01.png) |

| Activity | Start | Moment | End |
| --- | --- | --- | --- |
| A · Ten afternoons | [A-1](activity-A-1-1440-v01.png) | [A-2](activity-A-2-1440-v01.png) ([1133×744](activity-A-2-1133-v01.png)) | [A-3](activity-A-3-1440-v01.png) |
| B · Footprints | [B-1](activity-B-1-1440-v01.png) | [B-2](activity-B-2-1440-v01.png) | [B-3](activity-B-3-1440-v01.png) |
| C · No activity | [C-1](activity-C-1-1440-v01.png) | [C-2](activity-C-2-1440-v01.png) | [C-3](activity-C-3-1440-v01.png) |

A-2 is the busiest frame, so it is the second one shot at 1133×744.

## Beats

The plan's ten beats became eleven steps in four chapters (Small choices, Adding up, Something new, Takeaways), with an Activity stop between Something new and Takeaways.

| Step | Plan beat | Change |
| --- | --- | --- |
| 01 want | 1 | |
| 02 again | 2 | |
| 03 quiet | 3 | |
| 04 map | 4 | Split: beat 4 is three pictures. 04 is the before of the hero zoom (the whole map, a box on the soccer years). |
| 05 steps | 4 | The hero's after: the boxed stretch, magnified, is footprints with their choices. |
| 06 builds | 4 | Skills on skills (looking up, passing, knowing where to stand) gets its own frame, so the zoom isn't crowded. |
| 07 maths | 5 | |
| 08 basketball | 6 | |
| 09 late | 8 | |
| 10 keep | 9 | |
| 11 next | 7 and 10 | Merged: the one line on practice getting easier leads straight into Lesson 3's question, so it says it once and hands off. |

The elephant is a pale mist-gray placeholder shape in Maya's pictures from step 01 on (by the bench, by the wall, at the foot of the blocks, beside the hoop), never mentioned. In step 11 it is right behind her. The real art goes to asset-studio later.

## Activity hypotheses

Each is drawn in three frames: the start, the moment that teaches, and the end.

- **A · Ten afternoons.** Lesson 1's old activity, redrawn from a playthrough of commit `869884b`. Each afternoon offers three picture choices, and the soccer and cello boxes grow from what was picked. On afternoon 7 basketball opens with knowing where to stand and passing partly filled (striped, from soccer). Hypothesis: choosing, again and again, and seeing the bars grow teaches the core better than reading it.
- **B · Footprints.** The reader's own picks lay Maya's footprints along the ground; rest leaves a gap. A skill tag appears beside the trail now and then. The end zooms out to Lesson 1's map, where the reader's footprints are the green line. Hypothesis: making the hero picture yourself, with almost no words, lands it harder than seeing it.
- **C · No activity.** The story alone. Its one interactive moment is the hero: "Look closer" on the map opens the footprint lens, and "Back to the map" closes it. Hypothesis: the story is enough, and an activity adds reading and time without adding the idea.

B and C felt most alike once drawn, because both are about the footprint path. B was changed to stay at ground level with Maya, the reader's choices and skill tags, and to show the map only at the end; C keeps the story's map and lens unchanged and adds one tap.

## Word count

Counted from `copy.md` by `copy.js`'s `countWords` (heading, paragraphs and takeaways; picture labels excluded).

| Step | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Words | 36 | 42 | 37 | 26 | 35 | 41 | 45 | 39 | 50 | 47 | 24 | 422 |

Limits: 50 a step, 450 in total. Step 09 is at the limit.

## Checks

- WebKit (Playwright 1.62.1), every frame at 1440×900 and the two at 1133×744: no console errors, no text under 15 px, no story column overflow.
- `copy.mjs --url` on both pages, with and without `--phone`: 0 failures. Warnings left: "negative" on sentences such as "She can't choose it today" and "Never too late", and "question-sentence" on the hand-off line, which is story text by design.

## Simplified

- A drops the old activity's energy meter and intro card, and opens basketball on afternoon 7 inside that afternoon's card rather than as a separate step.
- B's frames show fourteen footprints over twenty afternoons as a fixed example, not a counted playthrough.
- The skill boxes reuse Lesson 1's markup and classes. At heights of 800 px or less, the panel's skill rows put the name and the word on one line so both boxes fit beside the story.
- The elephant is a placeholder shape, as planned.
- The third skill has one name everywhere, "Knowing where to stand". The shorter "Where to stand" fails the copy check as a question-shaped label, and "Kick a ball at the wall" fails it at six words, so the option reads "Kick balls at the wall".
- In the hero, each footprint label sits on a paper chip, so the gray branches pass behind the words.

## Known issues

- Frames are static: the activities' buttons and the C lens toggle do nothing yet.
- At 1133×744 the skill name "Knowing where to stand" wraps to two lines in the activity A panel. It still fits beside the story.
- The chapter trail's Activity stop shows on the storyboard, so story 09's Next reads "Next: Activity". With C, that stop would go.
- English only; no catalog keys yet.
