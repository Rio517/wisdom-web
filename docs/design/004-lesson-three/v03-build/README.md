# v03 — Build

Created: 2026-10-19. Status: in review. Lesson 3 built on the site from the v02 frames (lane A, minimal) and v02's `copy.md`, in English, Spanish, German and French.

## Question

Does the built Lesson 3, the ten steps and the Elephant or rider activity, match the approved v02 frames and words, and does it fit every screen size in every language?

## Related documents

- [v02 — Sort](../v02-sort/README.md): the approved frames and [`copy.md`](../v02-sort/copy.md) this round builds.
- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 3 · The elephant and the rider".
- [`docs/content/elephant-journey.md`](../../../content/elephant-journey.md): the lesson's words, generated from the catalogs (`npm run copy:lesson`).

## Files and how to open them

- Lesson code: `src/lessons/elephant/` (`elephant-story.js` steps and moments, `elephant-draw.js` and `elephant-pictures.js` the pictures, `elephant-sort.js` the activity, `elephant.js` the page, `elephant.css`). Pages: `src/pages/[...locale]/deciding/elephant-and-rider/index.astro` and `read.astro`. Words: `elephant.*` in `src/i18n/messages/*.json`.
- Reused: Lesson 2's journey frame and controls, Lesson 1's sort board (`src/lessons/choices/journey-sort.js`, now with a lesson's own sides and a quiet mode with no verdicts), and the shared elephant and rider (`src/lessons/shared/elephant.js`).
- Serve: `npm run build`, then `npm run preview` (port 4601), and open
  - <http://127.0.0.1:4601/deciding/elephant-and-rider/> (`#pair-pair` … `#keep-next` opens one step)
  - <http://127.0.0.1:4601/deciding/elephant-and-rider/read/> (the text version)

## Review images

Every step and the activity at 1440×900 (English):
[01](story-01-pair-1440-v01.png), [02](story-02-quick-1440-v01.png), [03](story-03-slow-1440-v01.png), [03b](story-03b-now-1440-v01.png), [04](story-04-reins-1440-v01.png), [05](story-05-path-1440-v01.png), [06](story-06-team-1440-v01.png), [07](story-07-first-1440-v01.png), [08](story-08-keep-1440-v01.png), [09](story-09-next-1440-v01.png); activity [start](activity-start-1440-v01.png), [mid-sort](activity-mid-1440-v01.png) and [end](activity-end-1440-v01.png).

iPad sizes: step 01 at [1133×744](story-01-pair-1133-v01.png) and [744×1133](story-01-pair-744-v01.png); mid-sort at [1133×744](activity-mid-1133-v01.png) and [744×1133](activity-mid-744-v01.png). German at 744×1133: [step 01](story-01-pair-744-de-v01.png) and [mid-sort](activity-mid-744-de-v01.png).

The mid-sort shots hold "Catching a ball" mid-drag over the elephant's side.

## Changes from the frames and `copy.md`

- Step 09 ends with "Start from the beginning" and no "Start Lesson 4" button: Lesson 4 isn't written, and only written lessons get links.
- No `/deciding/` overview page: the roadmap and menu link straight to the journey and its text version.
- Picture labels are HTML over the drawing, as in Lessons 1 and 2, so they never drop under 15 px.
- The activity's step is `#activity-partners` (Lesson 1's sort styles answer to `sort`).
- The text version is titled "Lesson 3 · Text version": the longer title failed the copy check's heading length.
- Picture descriptions (alt text) and the text version's words are new; they follow the copy rules.
- At the end of the activity the story keeps its first line and adds "Together, the two cover both kinds of strength." under it, in the place each card's line takes while sorting.
- The card being dragged is not tilted (Lesson 1's board doesn't tilt it).
- The activity reuses Lesson 1's board words for the instruction, the tap hint, the keyboard hint and the pile's name.
- The sort board now accepts a tap right after a drag that ended outside the board; before, that tap was lost (Lessons 1 and 3).

## Checks

- Fit sweep (`tooling/fit-sweep.mjs --lesson elephant`, WebKit, Playwright 1.62.1): 416 cells, 8 sizes × 4 languages × 13 states (11 steps plus mid-sort and end). Landscape: 0 failing. Portrait 744×1133: the page is 15 to 36 px taller than the screen on step 08 (all languages) and 16 px on step 03 (German, French), the shared frame's portrait overflow that Lesson 2 also has on main; the story text itself never scrolls. 0 buttons off screen or covered, 0 label overlaps, 0 text under 15 px, 0 console errors. Reduced motion: the same.
- Keyboard only (Alt+Tab, Enter, arrow keys), English and French at 1133×744, Spanish at 744×1133: every step, all six cards sorted with one on the wrong side, Start again, sorted again, to the end; Lesson 2's last step opens Lesson 3.
- Frame times at 1440×900 in WebKit, every step change and five slide-across moves: worst frame 22 ms.
- Copy check (`copy.mjs --url`, with and without `--phone`) on every step and the text version: 0 failures.
- `npm test`, `npm run lives:check` and `npm run build` pass.

## Known issues

- Poses still to come from asset-studio: the elephant pulled by the reins, head and trunk turned toward the friend (04); the pair seen from a little above, on the side path (05), walking up the path (06) and along the trail (09); the elephant facing left with its back to the plate and a rider who explains, one hand raised (07). Each step uses the nearest pose there is; the list sits in `POSES` in `elephant-pictures.js`.
- The neutral rider isn't delivered yet; the rider still reads as Alfredo, and step 02 shows the elephant without its rider.
- The side icons on the activity are small at 1133×744.

## Quote to check

Step 06's "We are the rider, and we are the elephant" ships as written: Jonathan Haidt, *The Happiness Hypothesis* (2006), ch. 1, p. 22. Checked 2026-10-18 against stafforini.com/quotes/?p=2955, which quotes the surrounding passage; the edition itself was not seen.
