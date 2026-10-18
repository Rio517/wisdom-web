# v04 — Lesson 1 fit

Created: 2026-10-17. Updated: 2026-10-17. Status: built on branch `agents/lesson1-fit`; owner review pending; not published.

Question: on a laptop or an iPad, in any of the four languages, does every step of Lesson 1 fit the screen: no story column that scrolls, Back and Next always in view, no label on another label, no text under 15 px?

Related: [013 — Guided journey](../../../product/013-choices-guided-journey.md), [016 — Lessons two to four](../../../product/016-lessons-two-to-four.md) (Maya's steps fork, builds and never-late move to Lesson 2, so this round skips them). Sources: `src/lessons/choices/journey.css`, `journey.js`, `journey-hike.js`; the measuring scripts `tooling/fit-sweep.mjs` and `tooling/fit-sum.mjs` (`npm run fit:sweep`).

## Stills (WebKit, before on `main` a455440, after on the branch)

| Step | 1133×744, French | 744×1133, Spanish |
| --- | --- | --- |
| Takeaways | [before](fit-takeaways-1133x744-fr-before-v01.png) · [after](fit-takeaways-1133x744-fr-v01.png) | [before](fit-takeaways-744x1133-es-before-v01.png) · [after](fit-takeaways-744x1133-es-v01.png) |
| Closed trail | [before](fit-closed-1133x744-fr-before-v01.png) · [after](fit-closed-1133x744-fr-v01.png) | [before](fit-closed-744x1133-es-before-v01.png) · [after](fit-closed-744x1133-es-v01.png) |
| Halfway | [before](fit-halfway-1133x744-fr-before-v01.png) · [after](fit-halfway-1133x744-fr-v01.png) | [before](fit-halfway-744x1133-es-before-v01.png) · [after](fit-halfway-744x1133-es-v01.png) |

Takeaways at 1440×900, English: [before](fit-takeaways-1440x900-en-before-v01.png) · [after](fit-takeaways-1440x900-en-v01.png).

## Changes

- **Any step beside the map** (990 px wide and up) tightens one notch at a time until its words fit, and stops at the first that does: no kicker and smaller gaps, then a smaller heading and choice padding, then body text at 17 px (never under 16). The hike's practice cards used this alone before. The column refits after a choice, so the answer shows too.
- **The hike** has a wider column on laptops and landscape iPads (420–440 px; 370 px from 990 to 1100 px), the same on all its steps so the map keeps one size. A choice and its answer now fit in French and Spanish at 1133×744 and 1024×768.
- **Takeaways**: the three cards sit in a band across the foot of the page, under the map and the column, instead of in the column (255–319 px too long at 1133×744). The map keeps most of its height; the cards keep their words and sizes; the reading order is unchanged.
- **Upright tablets**: Back and Next hold to the foot of the window, with the step dots beside them in one row; the words scroll under them and the bar settles in place at the end of the page. The key hint is hidden there (no keyboard).
- **The hike map's flag** ("Turned back here last time") keeps at least 4 px from the ranger's and the trailhead's names: it slides left as far as the trailhead allows, and the ranger's name moves right for the rest.
- **Age axis** ticks at 15 px (were 12), every five years: no crowding at 1133×744 or 1440×900.
- **The life step's 3 px**: the Pause link's 44 px target reached 3 px past the column's padding. Beside the map it now reaches up over the list's last 10 px and down 4 px, so the list keeps the room the opening fitted it to; on upright tablets the column's padding is 7 px, since a button sits just above the link there.
- **Reduced motion**: the story column and the hike's labels no longer take the 0.001 ms transitions, so WebKit measures them in the frame they change (before, the hike's trailhead name was cut at its map's edge at most sizes, and its labels were too small at 1920×1080).

## Numbers (`fit-sweep.mjs`, WebKit, 13 steps × 8 sizes × 4 languages = 416 cells)

| Check | Before | After | After, `?stress=wide` | After, reduced motion |
| --- | --- | --- | --- | --- |
| Story column scrolls (landscape) | 57 cells, up to 319 px | 0 | 0 | 0 |
| Back or Next off screen or covered | 47 | 0 | 0 | 0 |
| Labels on labels | 6 | 0 | 0 | 0 |
| Labels cut | 0 (84 with reduced motion) | 0 | 0 | 0 |
| Axis ticks under 15 px | 96 | 0 | 0 | 0 |
| Other text under 15 px, outside the life step | 0 (32 with reduced motion) | 2 | 3 | 2 |
| Console errors, unsettled | 0 | 0 | 0 | 0 |

After any choice on halfway and the closed trail (5 landscape sizes × 4 languages), the column fits, with and without `?stress=wide`. `?stress=wide` adds 0.036 em letter-spacing to every word: about 8% wider.

## Known issues

- **Takeaways at 990×800 and 1024×768**: one route label on the map ("Sieht die Tochter singen" in German; with `?stress=wide` also one in French and Spanish at 1024×768) takes the life map's 13 px last resort (design 001 v13), because the band leaves the map shorter. The placer's result flips with a few px of map height either way; on `main`, with the full-height map, these were 15 px.
- **The life step** keeps text under 15 px in every cell, by the opening's design (001 v13): the gray choices' labels (13 px), the story's ages (13–13.5 px) and, for long lives on short screens, 14 px rows. The brief's first count missed these, since the summary lists only six small texts a cell and the ticks came first. Left as they are: they are the opening's reviewed type scale.
- **Closed trail, after "Ask the ranger"**: the ranger's speech bubble covers part of "Waterfall" at 1133×744 (on `main` too; the sweep doesn't pick choices).
- **The opening's own sweep** (`v13-lesson1-opening/sweep.mjs --site`, WebKit) is clean in English. Its German, French and Spanish failures are the same cells on `main`: at 1366×657 the story list and some what-if notes don't fit (German 4 and 8, French 0 and 23, Spanish 20 and 13).
- **Upright tablets** still scroll the page below the map on most steps, as allowed; the bar covers the last lines until the reader scrolls.
