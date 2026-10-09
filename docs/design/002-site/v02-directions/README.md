# v02 — Directions

Created: 2026-10-09. Updated: 2026-10-09. Status: path field implemented on the working branch; three home and cover directions ready as playable prototypes; owner pick pending.

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

### Doors that open

The lead passed on the owner's ask that outside forces aren't only negative. On the lesson map's "not everything is yours to choose" step, each way that closes now has a door that opens beside it. Three closings (clay ×, dashed route) alternate with three openings: a small ring with a plus, the new way lit in a deeper version of the futures' green from that point on through later forks, and a light-green label ("A teacher noticed", "A new club opened", "A friend invited them"; `map.opened.*`). The closings sit in the top half, the openings in the bottom half and a little later in life, where the field is wide enough to tell them apart. Openings swing in a little more slowly than closings snap shut. Reduced motion shows all of them at once; the step's keyboard behaviour is unchanged. When a label can't fit (two of three at 1024 × 768), the map shows fewer marks rather than overlapping labels.

[1440 × 900](map-doors-1440-v01.png) · [1024 × 768](map-doors-1024-v01.png) · [reduced motion, 1440](map-doors-reduced-motion-1440-v01.png)

Sources: `src/engine/path-laminar.js`, `src/engine/lab-settings.js`, `src/engine/lab-renderer.js`, `src/lessons/choices/journey-map.js`; tune in `prototype/path-lab.html`.

## 2. Three directions for the home page and the lesson cover

The owner asked for more room and everything in the middle (no sidebar), much less text on the first screen, and a lot of animation: the words leave, then the paths grow. All three directions share the same words, the real path engine (`createPathsScene`), the real tokens and the site's own CSS. The menu is a button that opens the existing drawer. Below the stage, home keeps only the lesson, the roadmap (planned lessons with their popovers) and one line for grown-ups.

**Play them:** `npm run dev:prototype`, then <http://127.0.0.1:4602/prototype/directions/>. Each page has a Home and a Lesson cover view; the small toolbar at the bottom left switches between them, and Reset plays it again. That toolbar is review chrome, not part of a direction. Links go to the site on port 4600.

| Direction | The idea, in two lines | Trade-offs |
| --- | --- | --- |
| **A · Stage** ([a.html](../../../../prototype/directions/a.html)) | One big sentence in the middle of a faint field. On click the lines lift away one after another, and the paths grow out of the Beginning dot to fill the screen. | The calmest and clearest; it scales best to large monitors. The least surprising of the three. |
| **B · Left third** ([b.html](../../../../prototype/directions/b.html)) | The opening on the left, as the owner described, with the field waiting on the right. On click the words slide off to the left, the field glides to the middle, and the paths grow. | The strongest sense of moving into the map, and the cover's narration lands where the lesson already puts it (right). Before the click it looks most like today's page, and on tablets the field starts close to the words. |
| **C · Words into dots** ([c.html](../../../../prototype/directions/c.html)) | The sentence is the start: every word shrinks to a dot, the dots gather into the Beginning, and the paths grow out of it. | The most memorable, and it ties the words to the map ("what you read becomes where a life starts"). The busiest moment of the three (about 40 dots in flight for half a second), and it relies on motion more than the others. |

Shared choices:
- **New words** (prototype only, in `prototype/directions/copy.json` until a direction is picked; then they move into the four catalogs). Title: "A life can go many ways." Summary: "Your choices help pick the path. So do things nobody picks, like luck, good and bad. And the small things you do each day add up." Button: "Watch the paths grow". The settled line: "Every line is a way a life could go. The dark one is one life so far."
- **Timing.** Text leaves in 690 ms at most (A: 480 ms lifts, 70 ms apart; B: 420 ms slides, 60 ms apart; C: 520 ms dot flights, at most 160 ms of stagger). The paths start growing before the words are gone and are fully grown 2.5–2.8 s after the click. On the home page, the lived route then travels to Today (2.6 s), as it does on the live site.
- **The grow** is a circle widening from the Beginning dot (a CSS `clip-path` transition on the field canvas), so it runs on the compositor.
- **Reduced motion:** the click shows the settled state at once. **Keyboard:** Tab reaches every control; after the click, focus moves to the first new control (Start lesson 1 or Next), since the button that started it is gone. Escape closes the drawer and returns focus to the menu button.

### Frame budget

Headless Chromium 141 at 1440 × 900 with 4× CPU throttling (DevTools `Emulation.setCPUThrottlingRate`), with a Performance trace and requestAnimationFrame intervals from the click to the paths being fully grown:

| | A home | A cover | B home | B cover | C home | C cover |
| --- | --- | --- | --- | --- | --- | --- |
| Frames | 165 | 164 | 172 | 175 | 174 | 175 |
| 95th percentile | 16.7 ms | 16.8 ms | 16.8 ms | 16.8 ms | 16.8 ms | 16.8 ms |
| Frames over 33 ms | 3 | 2 | 4 | 4 | 4 | 5 |
| Longest frame | 67 ms | 50 ms | 67 ms | 50 ms | 83 ms | 67 ms |

The longest main-thread task in every run was under 5 ms.

The budget of no frame over 33 ms is **not fully met**. The grow itself holds 16.7 ms frames. The 2–5 slow frames fall in the first 600 ms: the click frame, and the grow's first frame, when the field canvas is first shown and uploaded. This headless Chromium rasterizes in software (SwiftShader), so compositor costs are higher than on a real GPU. On the same machine, a bare clip-path grow on one canvas holds 16.7 ms throughout. Getting here took four fixes:
- The scene no longer repaints both canvases on every step (a 1.1 s frame at the click).
- The pulse ring is now a small compositor-animated element instead of a full-canvas redraw each frame. An idle page went from 33 ms frames to 16.7 ms.
- The faint field is a still image rather than a third canvas.
- B slides the field rather than scaling it. Scaling made the canvases repaint (and would blur them).

### Review images

Before the click, mid-animation and settled, at 1440 × 900 and 2560 × 1440. Baseline (today's home, with the round's shell and field fixes): [1440](baseline-home-1440-v01.png) · [2560](baseline-home-2560-v01.png).

**A · Stage**

- Home: [before, 1440](dir-a-home-1-before-1440-v01.png) · [mid, 1440](dir-a-home-2-mid-1440-v01.png) · [settled, 1440](dir-a-home-3-settled-1440-v01.png) · [before, 2560](dir-a-home-1-before-2560-v01.png) · [mid, 2560](dir-a-home-2-mid-2560-v01.png) · [settled, 2560](dir-a-home-3-settled-2560-v01.png)
- Lesson cover: [before, 1440](dir-a-cover-1-before-1440-v01.png) · [mid, 1440](dir-a-cover-2-mid-1440-v01.png) · [settled, 1440](dir-a-cover-3-settled-1440-v01.png) · [before, 2560](dir-a-cover-1-before-2560-v01.png) · [mid, 2560](dir-a-cover-2-mid-2560-v01.png) · [settled, 2560](dir-a-cover-3-settled-2560-v01.png)

**B · Left third**

- Home: [before, 1440](dir-b-home-1-before-1440-v01.png) · [mid, 1440](dir-b-home-2-mid-1440-v01.png) · [settled, 1440](dir-b-home-3-settled-1440-v01.png) · [before, 2560](dir-b-home-1-before-2560-v01.png) · [mid, 2560](dir-b-home-2-mid-2560-v01.png) · [settled, 2560](dir-b-home-3-settled-2560-v01.png)
- Lesson cover: [before, 1440](dir-b-cover-1-before-1440-v01.png) · [mid, 1440](dir-b-cover-2-mid-1440-v01.png) · [settled, 1440](dir-b-cover-3-settled-1440-v01.png) · [before, 2560](dir-b-cover-1-before-2560-v01.png) · [mid, 2560](dir-b-cover-2-mid-2560-v01.png) · [settled, 2560](dir-b-cover-3-settled-2560-v01.png)

**C · Words into dots**

- Home: [before, 1440](dir-c-home-1-before-1440-v01.png) · [mid, 1440](dir-c-home-2-mid-1440-v01.png) · [settled, 1440](dir-c-home-3-settled-1440-v01.png) · [before, 2560](dir-c-home-1-before-2560-v01.png) · [mid, 2560](dir-c-home-2-mid-2560-v01.png) · [settled, 2560](dir-c-home-3-settled-2560-v01.png)
- Lesson cover: [before, 1440](dir-c-cover-1-before-1440-v01.png) · [mid, 1440](dir-c-cover-2-mid-1440-v01.png) · [settled, 1440](dir-c-cover-3-settled-1440-v01.png) · [before, 2560](dir-c-cover-1-before-2560-v01.png) · [mid, 2560](dir-c-cover-2-mid-2560-v01.png) · [settled, 2560](dir-c-cover-3-settled-2560-v01.png)

Sources: `prototype/directions/` (`index.html`, `a.html`, `b.html`, `c.html`, `common.js`, `direction-a.js`, `direction-b.js`, `direction-c.js`, `directions.css`, `copy.json`, `boot.js`).
