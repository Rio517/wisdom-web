# v05 — The elephant in Lesson 2

Created: 2026-10-18. Status: built on branch `lesson2/elephant`; the owner's review pending.

## Question

Does the grown elephant (take B), placed in the empty slots the [v03 frames](../v03-practice-paper/README.md) left for it, sit quietly in the background of Maya's pictures, never covering her, a label or the ball, and stand a little larger beside her on the last step, without a word about it?

## Related documents

- [v03 — Practice on paper](../v03-practice-paper/README.md): the approved placement (steps 01, 02, 03, 06, 08 and 11).
- [v04 — Practice build](../v04-practice-build/README.md): the lesson these pictures belong to.
- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md): Lesson 3 says who the elephant is.

## Review images

WebKit, English, the preview build.

- 1440 × 900: [01](story-01-want-1440-v01.png) · [03](story-03-quiet-1440-v01.png) · [06](story-06-builds-1440-v01.png) · [11](story-11-next-1440-v01.png)
- 744 × 1133: [01](story-01-want-744-v01.png) · [11](story-11-next-744-v01.png)

## Placement

| Step | Place | Height |
| --- | --- | --- |
| 01 | On the ground past the bench, where the path starts to climb; on narrower stages it steps right so the bench keeps clear | 44 px |
| 02 | Between the third and fourth Maya; shown only where it keeps clear of the third Maya and the cone (1280 × 800 and wider) | 40 px |
| 03 | Under the lane card's right corner, hung from the card so it follows the card's height | 40 px |
| 06 | On the ground before the first block, among the lead footprints | 40 px |
| 08 | Left of the hoop's pole | 40 px |
| 11 | Beside Maya, behind her, at the end of her footprints | 74 px |

- The pose is `stand` everywhere, with no animation and no rider.
- `--elephant-gap` is `paper-deep` on `.scene-practice`, the stage colour, so the leg gap shows no rim.
- No words changed. The elephant is not named, and the pictures' alt text is unchanged.

## Sources

- Module: `src/lessons/shared/elephant.js`, copied unchanged from the asset source with a header line.
- Placement: `elephantSlot()` and `mayaSpan()` in `src/lessons/practice/practice-draw.js`; the six calls in `src/lessons/practice/practice-pictures.js`; `.pl-elephant` and `--elephant-gap` in `src/lessons/practice/practice.css`.
- Shots: `tooling/fit-sweep.mjs --lesson practice --lang en --size <size> --step <id> --shot <dir> --wait 900`.

## Checks

- Fit sweep (`tooling/fit-sweep.mjs --lesson practice`, WebKit, Playwright 1.62.1, 8 sizes × 4 languages, walk order): 448 cells, landscape 0 failures, no console errors; the same with reduced motion. Upright tablets show 37 page-scroll cells on steps without an elephant at those sizes (02, 07, 09, 10 and the activity), the same 37 as `main`.
- Elephant overlap (a scratch WebKit pass over the six steps, 8 sizes × 4 languages): nothing overlaps it (Maya, labels, the lane card, the skill box) and it stays inside the stage wherever it shows.
- `npm test` (288 pass), `npm run lives:check` and `npm run build` pass. The page's JavaScript grows by about 1.1 KB gzipped.
