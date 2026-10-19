# v04 — Poses

Created: 2026-10-19. Status: in review. Lesson 3's pictures take asset-studio's Lesson 3 poses and the neutral rider (look `n3`, Bob, picked by the owner), in place of Lesson 2's side-view poses and its Alfredo-like rider.

## Question

Does each step's elephant now take the pose its story needs, and does every rider read as the neutral child, not Alfredo, without changing Lesson 2?

## Related documents

- [v03 — Build](../v03-build/README.md): the built lesson this round changes.
- [016 — Lessons 2 to 4](../../../product/016-lessons-two-to-four.md), section "Lesson 3 · The elephant and the rider".
- Asset request: `asset-factory/requests/wisdom/2026-10-17-elephant.md`, delivery of 2026-10-19; notes in `asset-factory/wisdom/elephant/NOTES.md`, section "Lesson 3".

## Files

- `src/lessons/shared/elephant.js`: asset-factory's `wisdom/elephant/src/elephant-b.js`, copied unchanged.
- `src/lessons/elephant/elephant-pictures.js` (`POSES`, one entry a step), `elephant-draw.js` (`pair()` passes `look` and `riderPose`; `RIDER_LOOK = 'n3'`), `elephant-sort.js` (the side minis), `elephant.css` (the trunk edge on a path).

## Changes by step

| Step | Pose | Rider |
| --- | --- | --- |
| 01 pair | stand (as before) | n3 |
| 02 quick | walk1 (as before) | n3, back on the elephant |
| 03 slow, 03b now | stand, walk1 (as before) | n3 |
| 04 reins | `pulled` with a taut rein | n3, pulling |
| 05 path | `toward1`, seen from the front | n3, front |
| 06 team | `away1`, walking up the path | n3, back |
| 07 first | `left`, its back to the plate; the plate moves behind it | n3, explaining |
| Activity | stand (as before) | n3, and in the side minis |
| 08 keep | walk1 (as before) | n3, and in the takeaway icon |
| 09 next | `toward1` | n3, front |

- Steps 06 and 09 use one pose each (`away1`, `toward1`); Lesson 3 stays still.
- Step 09's trunk tip rests on the path, so its edge takes the path's colour (`trunkOnPath`); the leg gaps sit above the path and keep the stage colour.

## Review images

Before and after at 1440×900, steps 04, 05, 06, 07 and 09: [compare-1440-v01.png](compare-1440-v01.png). Its labels use the page order: 05-reins is step 04, 06-path 05, 07-team 06, 08-first 07, 11-next 09.

At 1440×900: [01](story-01-pair-1440-v01.png), [02](story-02-quick-1440-v01.png), [03](story-03-slow-1440-v01.png), [03b](story-03b-now-1440-v01.png), [04](story-04-reins-1440-v01.png), [05](story-05-path-1440-v01.png), [06](story-06-team-1440-v01.png), [07](story-07-first-1440-v01.png), [activity](activity-start-1440-v01.png), [08](story-08-keep-1440-v01.png), [09](story-09-next-1440-v01.png).

At 744×1133: [01](story-01-pair-744-v01.png), [02](story-02-quick-744-v01.png), [03](story-03-slow-744-v01.png), [03b](story-03b-now-744-v01.png), [04](story-04-reins-744-v01.png), [05](story-05-path-744-v01.png), [06](story-06-team-744-v01.png), [07](story-07-first-744-v01.png), [activity](activity-start-744-v01.png), [08](story-08-keep-744-v01.png), [09](story-09-next-744-v01.png).

At 390×844: [01](story-01-pair-390-v01.png), [02](story-02-quick-390-v01.png), [03](story-03-slow-390-v01.png), [03b](story-03b-now-390-v01.png), [04](story-04-reins-390-v01.png), [05](story-05-path-390-v01.png), [06](story-06-team-390-v01.png), [07](story-07-first-390-v01.png), [activity](activity-start-390-v01.png), [08](story-08-keep-390-v01.png), [09](story-09-next-390-v01.png).

All in WebKit, English, light, reduced motion. The site has no dark mode.

## Checks

- Lesson 2 at 1440×900: all twelve steps match main pixel for pixel.
- `npm test`, `npm run lives:check` and `npm run build` pass. `tooling/fit-sweep.mjs --lesson elephant` gives the same results as main; the only findings are the known ones (744×1133, steps 03 and 08, 15 to 36 px tall).

## Open points

- 390×844: the page is 700 px wide, as on main (phone layout is deferred). Step 07's plate now sits to the right of the elephant, so on a phone it is off screen until the reader scrolls sideways.
- Step 07: the explaining hand is raised behind the rider's head, so it can read as a head scratch.
- Step 06: the tail's stage-coloured edge is the one outline-like line on the back view (asset-studio's note).
- Step 04's elephant is 142 px tall at 390×844, 185 px at 744×1133 and 240 px at 1440×900, all above the 100 px the taut rein needs.
