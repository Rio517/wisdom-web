# v04 — Practice build

Created: 2026-10-18. Status: built on branch `lesson2/practice`; the owner's review pending. The page is unlinked and `noindex`; its title (Practice) and address (`/practice/small-choices/`) are working names, held in `PRACTICE_PATH` (`src/lessons/practice/practice-story.js`).

## Question

Does Lesson 2 · Practice, built on the site from the approved [v03 frames](../v03-practice-paper/README.md) and their `copy.md`, keep their look and words, fit laptops and iPads in four languages, and play activity A, Ten afternoons?

## Related documents

- [v03 — Practice on paper](../v03-practice-paper/README.md): the approved frames and `copy.md` (activity A picked on 2026-10-17).
- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 2 · Practice".
- [Lesson 2 copy](../../../content/practice-journey.md): the live words, generated from the catalogs by `npm run copy:lesson`.
- [002 v04 — Lesson 1 fit](../../002-site/v04-lesson1-fit/README.md): the fit rules this page reuses.

## Review images

Every step and the activity at 1440 × 900 (English):
[01](story-01-want-1440-v01.png) · [02](story-02-again-1440-v01.png) · [03](story-03-quiet-1440-v01.png) · [04](story-04-map-1440-v01.png) · [05](story-05-steps-1440-v01.png) · [06](story-06-builds-1440-v01.png) · [07](story-07-maths-1440-v01.png) · [08](story-08-basketball-1440-v01.png) · [09](story-09-late-1440-v01.png) · [10](story-10-keep-1440-v01.png) · [11](story-11-next-1440-v01.png) · [A1](activity-A-1-1440-v01.png) · [A2](activity-A-2-1440-v01.png) · [A3](activity-A-3-1440-v01.png)

Step 05 and A2 on iPads: [05 at 1133 × 744](story-05-steps-1133-v01.png) · [05 at 744 × 1133](story-05-steps-744-v01.png) · [A2 at 1133 × 744](activity-A-2-1133-v01.png) · [A2 at 744 × 1133](activity-A-2-744-v01.png)

German at 744 × 1133:
[01](story-01-want-744-de-v01.png) · [02](story-02-again-744-de-v01.png) · [03](story-03-quiet-744-de-v01.png) · [04](story-04-map-744-de-v01.png) · [05](story-05-steps-744-de-v01.png) · [06](story-06-builds-744-de-v01.png) · [07](story-07-maths-744-de-v01.png) · [08](story-08-basketball-744-de-v01.png) · [09](story-09-late-744-de-v01.png) · [10](story-10-keep-744-de-v01.png) · [11](story-11-next-744-de-v01.png) · [A1](activity-A-1-744-de-v01.png) · [A2](activity-A-2-744-de-v01.png) · [A3](activity-A-3-744-de-v01.png)

A2 is afternoon 7 with Play basketball just picked; A3 is the end card after ten afternoons.

## Built and reused

- Lesson 1's frame, shared through `src/lessons/choices/journey-shell.js`: chapter trail, step dots, Back and Next, the story column that tightens until it fits, the takeaways band under the stage and the sticky Back/Next bar on upright tablets. Lesson 1 behaves as before.
- The activity model (`journey-game.js`, now taking its skills and activities as options), the skill boxes (`journey-skills.js`) and the activity styles (`journey-play.css`).
- New: `src/lessons/practice/` (story, pictures, the step 05 zoom, Ten afternoons, page script and styles) and the pages `src/pages/[...locale]/practice/small-choices/` (journey and `read/`).
- The 04 → 05 zoom: the map shrinks into the corner while its box opens into the lens; the lines and the lens's labels arrive last. 600 ms, stopped by any move, instant with reduced motion.

## Changes from the frames and copy.md

- The map is drawn from the v03 drawing code with Lesson 1's colours and strokes, not with Lesson 1's lives-store map, which is built for ages 0 to 45 and its what-ifs. Its edge fade is a flat veil of the stage colour (quicker to paint while the map moves).
- On step 05 the corner map is the full map scaled down, so its lines are thinner than the frame's.
- Words over pictures are HTML labels, not SVG text; the stair labels sit at each block's left, as in the frame.
- The takeaways sit in Lesson 1's band under the stage, not in the story column.
- The last step has no "Next: Lesson 3" (not written yet); it ends with Start from the beginning.
- The Activity chapter has one step, so it shows no step dot (Lesson 1's rule).
- `copy.md` gives afternoons 1, 2 and 7; afternoons 3–6 and 8–10 are new, in its voice. Afternoon 6 is a Monday and 10 a Saturday.
- Choice labels keep to four words: "Take the cello lesson" (was "Go to the cello lesson") and "Kick at the wall" (was "Kick balls at the wall").
- An afternoon's prompt is text, not a heading. The next afternoon waits under the card only where it fits whole, and without its captions.
- What a pick grew is announced to screen readers only; no result line shows, as in the frames.
- The elephant is not drawn: each place the frames show it holds an empty, named slot (`data-slot="elephant"`) on steps 01, 02, 03, 06, 08 and 11.
- German names the first chapter "Kleine Schritte".

## Checks (2026-10-18)

- Fit sweep, `BASE=http://127.0.0.1:4601 node tooling/fit-sweep.mjs --lesson practice` (WebKit, 8 sizes × 4 languages, the activity at afternoons 1 and 7 and the end card: 448 cells), also with `REDUCED=1` and `STRESS=wide`: in landscape no story column scrolls, no button is off screen or covered, no labels overlap, no text is under 15 px, and there are no console errors. Upright tablets scroll the page by up to 70 px under the sticky Back/Next bar, as Lesson 1 does.
- Lesson 1's sweep is unchanged from `main` (512 cells, the same 122 known failures).
- Keyboard and Next/Back through every step and the activity in English and French at 1133 × 744 and Spanish at 744 × 1133.
- The English story has 422 words. Each activity screen shows at most 116 words, and the activity takes 11 taps.
- Copy check with and without `--phone`: no failures in Lesson 2's words. The site menu's planned-lesson names fail on every page of the site.

## Sources

- Code: `src/lessons/practice/`, `src/pages/[...locale]/practice/small-choices/`, `src/lessons/choices/journey-shell.js`.
- Captures: the site build served on 127.0.0.1:4601, WebKit, one still per step with motion settled.
