# v02 — Directions

Created: 2026-10-09. Updated: 2026-10-09. Status: path field implemented on the working branch; home and cover directions in preparation; owner review pending.

Question: after the owner's feedback on the launched home page and lesson cover, (1) does the path field keep splitting and fan out toward the top and bottom instead of running level, and (2) which of three centred, animated directions should the home page and the lesson cover take?

Related: [003 — Visual language and navigation](../../../product/003-visual-language-and-navigation.md), [010 — Procedural choice network](../../../product/010-procedural-choice-network.md), [v01 — Launch](../v01-launch/README.md). These are code-rendered captures (headless Chromium), not generated images.

## 1. The path field

The owner asked for paths that keep splitting and fan out, fade as they go up and down instead of ending in a straight line at the bottom, show more divisions in the middle, and have some bigger branches start later. The owner's hand-tuned lab settings stay the base; four controls are new, and one fade is split in two:

| Control (lab group) | Default | What it does |
| --- | --- | --- |
| Fan-out (Growth) | 0.85 | The field keeps widening after it opens, past the top and bottom. Lines that leave keep their lanes but stop forking and give their place back, so forks go on landing inside the drawing all life long. 0 is the old level field. |
| Middle forks (Growth) | 0.5 | Favours forks near the middle band, where readers look. |
| Big later forks · Big forks from (Forks) | 0.25 · 8 years | From age 8, a quarter of later forks open wide, with one or two more branches than usual. |
| Top and bottom fade (Style) | 0.16 | An eased fade at the top and bottom, separate from the right-hand Edge fade (still 0.04). |

The network stays seeded and connected; lines still never cross or curl back (lane order holds), and the states are unchanged: dark-green lived route, light-green futures, faint gray untaken. The generator also writes a point per line per yearly sample rather than one per fork event, which cuts generation from about 450 ms to about 150 ms and makes every paint lighter.

The circles in the opening animation are fixed. The cover's pulsing ring could get a negative radius on its first frame, which threw an error and froze the ring in place. The travelling dot lost its blotchy halo and now grows from the Beginning dot's size to Today's, so neither end pops.

Before and after, settled. Home hero: [before, 1440](field-home-before-1440-v01.png) · [after, 1440](field-home-after-1440-v01.png) · [before, 2560](field-home-before-2560-v01.png) · [after, 2560](field-home-after-2560-v01.png). Lesson cover after Begin: [before, 1440](field-cover-before-1440-v01.png) · [after, 1440](field-cover-after-1440-v01.png) · [before, 2560](field-cover-before-2560-v01.png) · [after, 2560](field-cover-after-2560-v01.png).

Sources: `src/engine/path-laminar.js`, `src/engine/lab-settings.js`, `src/engine/lab-renderer.js`, `src/lessons/choices/journey-map.js`; tune in `prototype/path-lab.html`.
