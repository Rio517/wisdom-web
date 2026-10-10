# v11 — Hike water

Created: 2026-10-09. Updated: 2026-10-10 (round 4). Status: C is the lesson's hike, rebuilt on plain WebGL, with A's still drawing as its no-WebGL fallback; B is retired. The integration is on a branch for the owner's review; not published.

**Question: which water does the hike keep?**

Related: [product 013](../../../product/013-choices-guided-journey.md) (the guided journey, chapter 2: Alfredo's hike) and [v10 — Hike fixes](../v10-hike-fixes/README.md), whose [before](../v10-hike-fixes/before-halfway-1440x900-v01.png) and [after](../v10-hike-fixes/after-halfway-1440x900-v01.png) pictures this round answers.

## The owner's review, summarised

After v10, the owner found the hike's graphics worse than before, the water most of all. The flat, simple background is liked and stays; the rock can stay flat too. The requests were:

- the stream should come over the mountain;
- the waterfall should go back into its rock, where it was before v10;
- the stream on the right should merge into the first stream;
- Three.js should be tried for the water, in a few versions to compare.

## Fix round 1

The owner found the water much better than before, but could see no difference between the versions except in the stream. The notes:

- the fall should start at the top of its rock;
- a second rock should stand to its right, for decoration;
- the fall should land in the pool, without the odd line behind its foot;
- Mirror Lake looked like a strange circle sitting on top of the mountain;
- the trail should get narrower;
- the bridge looked as if seen from straight above, and should have a little perspective;
- the trailhead house should be a little bigger and look like a cabin, with a small picnic table next to it.

The design lead's calls: go forward with C only, keep A's still drawing in step because it is C's fallback, and retire B. C's shaders stay self-contained for a later port to plain WebGL. What changed:

- **The fall.** A notch is cut in the rock's top lip. The sheet pours over it, a little wider at the lip, and runs the full height of the rock.
- **The fall's foot.** The sheet is drawn last and above the pool, so nothing shows behind its foot. It turns white near the bottom and ends inside the pool's surface, and the foam spreads out over the water around it.
- **The second rock.** It is smaller (about 60% of the fall rock's height), flat, in the same rock colours, and stands partly behind the fall rock on the right, clear of the water.
- **Mirror Lake.**
  - It now sits in the land on the shelf below the dip in the skyline.
  - Its shore is uneven and about 5:1 wide, as seen at a low angle, with a thin flat shore band.
  - A strip of the hillside covers its far edge, with a waterline, and small trees stand at both ends of the far shore.
  - The trail ends at its near shore.
- **The trail.** It narrows smoothly with distance: full width at the trailhead and half width at the lake. The walked lines and the Waterfall Trail narrow with it.
- **The bridge.** A small wooden footbridge seen from the side spans the stream, with a gently arched deck, plank ends along its edge, three posts and a handrail. The trail meets both ends, and the water shows under it.
- **The trailhead.**
  - A cabin about 1.5 times the old house's size: plank walls in the clay and cello colours, a pitched roof with an overhang, a door, a window and a small stone chimney.
  - A picnic table seen from the side stands to its right, between the cabin and the trail's start, at least 24px from the map's edge.
  - The table has no label: the story's picnic spot is by the falls, and it is not labelled either.

## Round 3

The owner's notes on fix round 1:

- a small round patch of bare ground at the trailhead, drawn for the map's low viewing angle so it doesn't look oddly shaped;
- the waterfall and the rock behind it did not line up;
- the bridge needed a second rail, perhaps with some depth;
- the stream should come up the hill and stop at its top, not climb the mountains;
- Alfredo and his dad should be drawn in the style of Maya's new figure.

What changed (C, and A as its fallback):

- **The trailhead clearing.** A flat patch of bare ground lies under the cabin, the picnic table and the trail's start. It is an ellipse about 4:1 wide, as seen at a low angle, with a gently uneven edge and no outline. Its colour, #e8d8c3, is halfway between the trail's sand (#dfcfae) and `clay-soft` (#f1e2d8), so it is lighter than the trail. The cabin moved down onto it.
- **The falls.**
  - The rock's notch, the sheet and the darker channel behind the sheet are now built from the same numbers (`FALL` in `geometry.js`).
  - The sheet's top sits on the notch floor, centred in it, and the channel shows an equal margin on each side all the way down.
  - The second rock is its own shape, standing partly behind the fall rock on the right with a clear overlap.
  - The rocks and the water share one mapping, so they stay aligned at every size and after a resize.
- **The bridge.** It is drawn in three-quarter view, still flat and in SVG:
  - a plank deck running in the trail's direction, with a darker front edge;
  - a near rail and a far rail, the far one a little higher on screen and shorter;
  - three posts per rail, standing on the deck's edges.

  The trail meets the deck at both ends.
- **The stream's source.** The main stream now starts at the crest of the green hill and appears from behind it; nothing of it shows on the mountains. It keeps its taper, narrow at the crest and wider below. In C the shader hides the water above the crest; in A the same hill shape clips it. Three trees on the hill that had been cleared for the stream's old course are back.
- **Alfredo and his dad.** Both are drawn in the style of Maya's figure:
  - a big round head, two ink dot eyes and one hair shape;
  - a T-shirt torso, round-capped limbs in skin colour and dark rounded shoes;
  - a flat shadow on the ground.

  They keep their clothes and colours, and the dad keeps his beard and backpack. Alfredo's head is about 39% of his height. His dad is about 1.45 times as tall, with a head about 28% of his height. At 1440x900 they are about 41 and 60 px tall. While they walk, their legs and arms swing and the pair bobs slightly; with reduced motion they stand still.
- **The Halfway flag.** It stands about 30 units further up the trail, on the far edge, so the pair no longer hides it. Its label stays where it was.

## In the lesson

C is now the lesson's hike map, with A's still drawing as its fallback. The owner's notes on round 3:

- move the whole falls group (both rocks, the notch, the sheet and the pool) down about 15 px at 1920x1080, so the rocks' bases sit below the ground line with no background showing under them, and the side stream starts from the moved pool;
- make the trail and the cabin's patch of ground one shape: the trail widens smoothly into the clearing, in the trail's own colour and edge, with no seam and no second colour, and the walked line still starts at the trail's start dot;
- show close-ups of the falls and the trailhead next to round 3's.

What changed:

- **The falls.** The rocks, the notch, the sheet and the pool moved down 12.5 map units (15.3 px at 1920x1080). The rocks' bases now follow the near ground's edge 3 units below it, so the rocks stand on the ground. The side stream leaves the moved pool, and the Waterfall label moved down with the falls.
- **The trailhead.** The clearing and the trail's first stretch are one shape: a smooth union of the clearing's uneven ellipse and the trail's band, in the trail's sand with the trail's darker edge around it. The trail's centre dashes start where it leaves the clearing. The clearing's own colour (#e8d8c3) is gone.
- **The pair at the trailhead.** At the first step, the turn-back step and the practice walks, Alfredo and his dad wait 22 map units up the trail, clear of the cabin's corner. The walked line still grows from the start dot behind them.
- **The figures.** `alfredo()` and `dad()` sit next to `person()` in `src/lessons/choices/journey-icons.js`. Their legs and near arms swing only while they walk, and never under reduced motion.
- **The water.** C's shaders run on plain WebGL2 in `src/lessons/choices/journey-hike-water.js`:
  - one canvas and five draw calls (the lake, the pool, the side stream, the main stream and the sheet), with no textures and no Three.js;
  - the module loads the first time the hike is shown;
  - without WebGL2, or after a lost context, the canvas is replaced by A's still drawing;
  - it pauses when the map is off-screen, behind the sorting board or in a hidden tab, and caps the pixel ratio at 2.

  The shapes it shares with the two SVG layers are in `src/lessons/choices/journey-hike-geometry.js`, and all three layers use the same 1200 x 800 mapping.
- **Colours.** The six water mixes are tokens in `src/styles/tokens.css`: `--color-water-bank`, `--color-water-body`, `--color-water-deep`, `--color-water-light`, `--color-water-fall` and `--color-water-ring`. They are declared `@theme static`, because the water reads them at runtime rather than through a class. The lake's waterline uses `water-bank`.
- **Played and opened steps agree.** Playing into a step now ends on the same picture as opening it directly: the second walk's line ends at the pair's feet by the bridge, and the ranger leaves as they set off on the Waterfall Trail.

## Round 4 (owner's notes on the integrated hike)

The owner found the integrated hike much better. The notes:

- the trail from the bridge ran straight up the hill and into the mountain to Mirror Lake, which looked strange. It should go over the hill: the near stretch ends at the hill's top, and the trail comes back into view on the far right and climbs to the lake;
- at the lake, a small brown clearing like the trailhead's yard, sized for the distance: a very small picnic table and a couple of trees;
- the pool at the foot of the waterfall still looked as if it floated. The hill in front should rise to cover more of the rock, so the pool lies on flat ground on top of the hill with the rock behind it.

What changed (in `src/lessons/choices/journey-hike.js`, the water untouched):

- **The near stretch.** From the bridge the trail climbs the green hill and reaches its crest at about (850, 394) map units, about x 1060 px at 1920x1080, clear of the trees. The crest line cuts it, so it seems to carry on behind the hill. It keeps its taper and centre dashes up to the crest.
- **Behind the hill.** The trail's path carries on behind the hill but nothing of it is drawn there: the trail, the walked lines and every other line on it are masked to the near stretch below the crest and to the far stretch above it.
- **The far stretch.** It comes out from behind the hill at x about 1170, between the falls' rock and the right edge, and climbs in two switchbacks to the lake's right-hand shore. It is drawn in the background, behind the hill and the rock, at about 30% of the trailhead's width, in the trail's sand mixed lighter, with a faint edge and no centre dashes.
- **The lake's clearing.** A flat patch of the yard's sand, lighter for distance, about 6:1 (58 x 10 map units, about 71 x 12 px at 1920), with a softly uneven edge. Its left tip meets the water. On it stand a picnic table in the trailhead table's shape, about 10 px wide at 1920, and three small trees the size of the far shore's.
- **Everything on the trail.** The walked lines, the closed stretch and the Keep going line follow the new route. The Halfway flag, its label and the second walk's stop short of the bridge keep their old distances along the trail. The Trail closed sign now stands on the near stretch, halfway between the bridge and the crest.
- **The pair.** No step walks them past the bridge, so the eight steps look as before. If they are placed further along the trail, they go out of sight within 6 map units of the crest and stay hidden until the far stretch. There they are drawn at 40% of their size. A check hook (`#scene-hike`'s `hikeCheck.place(distance)`) stands them anywhere on the trail for screenshots.
- **The pool on the hilltop.** The near ground rises in front of the falls in the ground's own colour. Its edge runs level at about 526 map units round the pool and slopes down to the left into the ground's edge near x 820. It hides the bottom 31% of the fall rock and the second rock's foot. The pool lies wholly on this flat ground, with the rock behind its edge. The fall and the side stream are drawn on the water layer above it, so the fall still lands in the pool and the stream still runs from the pool's front lip down the hill. This holds with WebGL and in the still fallback.

### Checks (round 4)

- **Every step.** All eight steps were played forward with Next (the arrow key) and back with Back at 1920x1080, 1440x900, 1280x800, 744x1133 and 1133x744, in German at 744x1133, with reduced motion, and without WebGL. There were no console errors, and the pair was visible at every step.
- **Tests and build.** `npm test` (243 tests) and `npm run build` pass. The water module is unchanged at 14.7 KB (6.2 KB gzipped), and the build has no Three.js.
- **Performance.** This was measured in a cloud Linux container on the production builds of the base commit and this round, with the CPU throttled 4x. The container is several times slower than the M4 the earlier numbers came from, so the absolute numbers do not compare with them.
  - With WebGL, the first entry to the hike takes about 2.3 s in both builds, because SwiftShader compiles the shaders on the CPU. That number says nothing about the page.
  - With WebGL stubbed out, the longest task on entering the hike was 95–102 ms here against 96–134 ms for the base. The longest task per step ranged 31–130 ms against 20–139 ms for the base, overlapping in every step.
  - The far stretch adds 43 SVG nodes.
- **Memory.** Over 5 visits to the hike, the heap after garbage collection went from 4,133 to 4,188 KB, the same +55 KB drift as the base (4,104 to 4,157 KB). Nodes stayed at 1,653 and event listeners at 73.
- **Headless rendering.** With SwiftShader GL, choosing Keep going showed tile-shifted ghost copies of the map. The base commit does the same, and Chromium with `--disable-gpu` draws it correctly, so the shots were taken that way.

### Images (round 4, v02)

Halfway step unless noted. Each v02 sits beside its v01 in the [In the lesson](#in-the-lesson-site-hike-v01) list:

- English: [1920x1080](site-hike-1920-v02.png) (v01: [1920](site-hike-1920-v01.png)), [1440x900](site-hike-1440-v02.png) (v01: [1440](site-hike-1440-v01.png)), [744x1133](site-hike-744-v02.png) (v01: [744](site-hike-744-v01.png)).
- German: [744x1133](site-hike-de-744-v02.png) (v01: [744](site-hike-de-744-v01.png)).
- Close-ups at 1440x900, pixel ratio 2:
  - [Mirror Lake and its clearing](site-hike-lake-v02.png), with the far stretch's switchbacks;
  - [the falls](site-hike-falls-v02.png): the pool on the hilltop, beside v01's [floating pool](site-hike-falls-v01.png).
- [The pair at the crest and at the lake](site-hike-walkers-v02.png), at pixel ratio 3, placed with the check hook: at the crest, just before they go out of sight, and at 40% in the clearing. v01: [the pair at Halfway](site-hike-walkers-v01.png).
- [Without WebGL](site-hike-nowebgl-1440-v02.png): A's still drawing with the raised ground (v01: [without WebGL](site-hike-nowebgl-1440-v01.png)).

## One geography for every version

The water's shapes live in one module (`geometry.js`), so A, B and C differ only in how the water looks.

- **Main stream.** It appears from behind the crest of the green hill below the mountains. It narrows with distance, winds down through the notch in the second ridge, passes under the bridge where the trail crosses, and leaves at the bottom edge.
- **Waterfall.** The fall pours from a notch at the top of its tall rock on the right, as in the before picture, into a small pool at its foot. A smaller second rock stands behind it to the right.
- **Side stream.** It is narrower than the main stream and runs from the pool leftwards in slow meanders. It joins the main stream below the bridge in a clean Y.
- **Width and motion follow depth.** Width and the flow pattern both follow depth: the water is narrow and slow far away and wider and faster close up, and both streams share the same scale.
- **Mirror Lake.** It sits in the land below the dip in the skyline: an uneven shore about 5:1 wide, a thin shore band, the hillside over its far edge. Since round 4 the trail goes over the green hill and reaches the lake at a small clearing on its right-hand shore.
- **What moved.** The trail, the trailhead, the big rock, Alfredo and the labels stay where the lesson has them, with these exceptions:
  - The Waterfall Trail used to run up the stream's west bank to v10's waterfall in the middle of the map. It now leaves the bridge eastwards, above the side stream, to a lookout beside the falls.
  - The picnic spot moved to that lookout.
  - In fix round 1, Mirror Lake moved down into the land, and the trail's last stretch now ends at the lake's near shore. The trailhead became a cabin with a picnic table, and its label moved to sit over the cabin.
  - In round 3, the stream's source moved down from the far ridges to the green hill's crest, the cabin moved down onto the clearing, and the Halfway flag moved up the trail.
  - In round 4, the trail went over the green hill to a clearing on the lake's right-hand shore, and the ground in front of the falls rose so the pool lies on it.
  - Trees keep clear of all the water.

## The three versions

| Version | What it is | Trade-off |
| --- | --- | --- |
| **A · Flat** (`a.html`) | Canvas 2D, no Three.js. Flat layered fills: a darker bank and a lighter body. Every bank is drawn first, then every body, so the junction and the pool join without a seam. The motion is slow and flat: thin light dashes drift downstream in three lanes, streaks fall down the sheet, foam sits at the foot, and ripple rings spread on the pool and the lake. | The lightest (3.5 KB gzipped) and the closest to the flat background. The motion is readable but mechanical: dashes, not water. |
| **B · Three.js, flat** (`b.html`), retired after the first review | One orthographic Three.js layer between the background and the trail, still in flat colours. Soft bands drift down the streams in two layers at different speeds, so the pattern keeps changing. The fall is a sheet of long soft streaks sliding down from a lighter lip, with churning foam where it lands. Gentle rings spread on the pool and the lake. The edges are anti-aliased in the shader. | It reads more like moving water than A while staying flat. It costs 131.6 KB gzipped. |
| **C · Three.js with light** (`c.html`) | B plus light: small glints that ride the flow and fade in and out, a lighter shimmer travelling down the fall, and a slightly deeper middle in the streams. | The liveliest. The light is subtle at a glance, most visible on the lake and the fall; it stays flat colour, with no gradients that imply volume. It costs the same as B. |

After the first review, C goes forward and B is retired. Its page still runs, because it shares C's module. B and C use the same module; C turns on its extra shader code with a `LIGHT` define. Without WebGL, or if the context is lost, B and C show A's still drawing with a one-line note in the reading panel.

## Colours

The water uses the tokens `lake`, `lake-soft` and `paper` from `src/styles/tokens.css`, read at runtime from the page's CSS custom properties. The prototype names six mixes of them and uses no other water colours:

| Name | Mix | Hex | Used for |
| --- | --- | --- | --- |
| `water-bank` | `lake-soft` → `lake`, 55% | #95b6c3 | the darker edge |
| `water-body` | `lake-soft` → `lake`, 10% | #cadde3 | the stream body |
| `water-deep` | `lake-soft` → `lake`, 26% | #b7cfd8 | the middle of the stream (C) |
| `water-light` | `lake-soft` → `paper`, 72% | #f1f5f4 | dashes, bands, streaks |
| `water-fall` | `lake-soft` → `paper`, 22% | #deebed | the falling sheet |
| `water-ring` | `lake-soft` → `lake`, 40% | #a6c3ce | ripple rings |

Foam and glints use `paper`. In the lesson these mixes are tokens in `tokens.css` (see [In the lesson](#in-the-lesson)).

## How to run it

```sh
npm run dev:prototype -- --host 127.0.0.1 --port 4632 --strictPort
```

Open <http://127.0.0.1:4632/prototype/hike-water/>, which links to [A](http://127.0.0.1:4632/prototype/hike-water/a.html), [B](http://127.0.0.1:4632/prototype/hike-water/b.html) and [C](http://127.0.0.1:4632/prototype/hike-water/c.html). Each page shows the Halfway step at the lesson's layout. Its choice buttons work, and the pills switch between versions.

`?beat=plan|turnback|practice|retry|closed|respond` shows another step's map. `globalThis.hikeWater` in the console exposes the frame stats, timings, the renderer's counts and an alignment check.

## The numbers

### In the lesson

Measured on 2026-10-09 in headless Chrome (ANGLE on Metal, Apple M4) on the production build, at 1440x900 with the CPU throttled 4x. The machine was not quiet (a load average of 4 to 10 from other work), so the ranges are wider than they would be on an idle machine. "Before" is the lesson as it was, built the same way.

- **The water module.** `journey-hike-water.js` is 14.7 KB, 6.2 KB gzipped. The shapes it shares with the map (`journey-hike-geometry.js`, loaded with the lesson) are 5.9 KB, 2.8 KB gzipped. The build contains no Three.js.
- **Walking and steady water.** The longest main-thread task was 10.4–15.1 ms during the walk to Halfway and 3.5–7.3 ms with only the water moving.
- **Frame intervals say nothing here.** In this headless browser a blank page has a median frame interval of 11.6 ms and a worst of 27.6 ms. The hike measures the same with its water moving (11.6 and 28.8 ms) or still (11.9 and 29.6 ms), so the task lengths stand in for frame intervals.
- **The load frame.** Opened straight at the hike, the lesson's longest task is 126–141 ms, against 124–133 ms before. That task builds every chapter's scene; the hike's own share is about 5.5 ms unthrottled. The water then sets itself up in a separate task of 16–19 ms. Two runs under heavier load reached 253 and 319 ms.
- **Entering the hike for the first time.** From the step before it, the longest task is 13–20 ms in most runs and up to 38 ms under load, against 11–15 ms before. Most of the difference is the browser creating the page's first WebGL context, which takes 8–21 ms at 4x on its own.
- **Memory.** Over 60 s of moving water, the JS heap stayed at 2.65 MB at every 10 s sample, with 1,600 DOM nodes and 87 event listeners.

### The prototype rounds

Measured on 2026-10-09 in headless Chrome (ANGLE on Metal, Apple M4), at 1440x900 with the CPU throttled 4x and 12 to 15 s of steady animation per run. The dev server was serving unbundled modules.

#### After round 3 (C)

Fix round 1's code was measured alongside, on the same machine, for comparison.

| | C, round 3 | C, fix round 1 |
| --- | --- | --- |
| Longest main-thread task, from a Chrome trace, in 8 s of steady animation | 3.3–9.1 ms | 3.7–5.7 ms |
| Longest main-thread task during the walk to Halfway | 5.7–11.1 ms | 6.5–8.8 ms |
| Tasks over 16.7 ms | none | none |
| Water work per frame (JS), median / 95th percentile / worst | 0.1 / 0.6–0.8 / 1.0–4.1 ms | not measured |
| Long animation frames (over 50 ms) while animating | none | none |
| Load, at 4x | one 199–231 ms frame building the scene, then 55–77 ms setting up WebGL (38–57 ms to create the layer, 10.5–12.5 ms waiting for shaders, 22–37 ms for the first frame) | 197–254 ms, then 51–85 ms |
| Renderer | 5 draw calls, 3 programs, 5 geometries, 2,766 triangles, 0 textures | the same, with 3,222 triangles |
| JS heap over 60 s, after garbage collection | 9,285 → 9,302 KB and 9,277 → 8,787 KB in two runs; the renderer's counts never changed | not measured |
| The walk from the start to Halfway | 3.2 s | not measured |

How to read these:

- **Frame intervals are left out.** Other heavy work was running on the machine (load average 10 to 17), and headless Chrome's frame intervals were irregular for both versions alike: a median of about 12.6 ms and a worst of about 27 ms. They say nothing about this page here, so the trace's task lengths stand in for them: no task, steady or walking, came near 16.7 ms.
- **Fewer triangles.** The stream no longer runs over the far ridges. The clearing, the bridge and the figures are a few more SVG shapes, and the walk's leg swing is CSS.

#### After fix round 1 (C, and A as its fallback)

| | C | A (C's fallback) |
| --- | --- | --- |
| Frame interval, median / worst (C at pixel ratio 1 and 2, three runs; A at 2) | 16.7 / 16.8 ms | 16.7 / 16.8 ms |
| Water work per frame (JS), median / 95th percentile / worst | 0.1 / 0.7 / 1.2 ms | 0.1 / 0.8 / 1.6 ms |
| Long frames while animating | none | none |
| Alfredo's walk from the start to Halfway, at pixel ratio 2 | worst interval 16.8 ms, no long frames | not measured |
| Load, at 4x | one 205–223 ms frame building the scene, then 57–62 ms setting up WebGL (38–44 ms to create the layer, 11 ms waiting for shaders, 25–28 ms for the first frame) | one 217 ms frame building the scene |
| Renderer | one WebGL2 renderer: 5 draw calls, 3 programs, 5 geometries, 3,222 triangles, 0 textures, pixel ratio at most 2 | one 2D canvas |
| JS heap over 60 s, after garbage collection | 9,228 → 9,349 KB | not measured |
| Extra code, gzipped (minified) | 132.1 KB (533.9 KB) | 4.1 KB (8.6 KB) |

The scene build frame grew from about 165 ms to about 210 ms at 4x, because the trail is now sampled into tapered ribbons when the page loads.

#### First round

| | A | B | C |
| --- | --- | --- | --- |
| Frame interval, median / worst (pixel ratio 1 and 2) | 16.7 / 16.8 ms | 16.7 / 16.8 ms | 16.7 / 16.8 ms |
| Water work per frame (JS), median / 95th percentile / worst | 0.1–0.4 / 0.9 / 5.3 ms | 0.1–0.2 / 0.8 / 1.1 ms | 0.1–0.2 / 0.8 / 4.9 ms |
| Long frames while animating | none | none | one 77 ms frame in 1 of 5 runs (see below) |
| Load, at 4x | one 150–180 ms frame building the scene | the same, plus 30–37 ms to create the layer, 10–11 ms waiting for compiled shaders, 19–36 ms for the first frame | the same as B |
| Draw calls | (Canvas 2D) | 5, one per piece | 5, one per piece |
| Renderer | one 2D canvas | one WebGL2 renderer: 3 programs, 5 geometries, 2,420 triangles, 0 textures | the same as B |
| Pixel ratio | at most 2 | at most 2 | at most 2 |
| JS heap over 60 s, after garbage collection | 3,135 → 3,151 KB | 9,051 → 9,169 KB | 9,048 → 9,170 KB |
| Extra code, gzipped (minified) | 3.5 KB (7.3 KB) | 131.6 KB (532.8 KB): Three.js plus the water module, loaded only on B and C | the same as B |

All three versions share the page's own code: page 11.9 KB, i18n runtime 10.1 KB, messages 15.6 KB and CSS 14.2 KB gzipped.

How to read the frame numbers:

- The **interval** is the time between animation frames. At 60 Hz the worst, 16.8 ms, is timer jitter around 16.67 ms; no frame was dropped.
- The **water work** is the time spent in the water's own frame callback.
- **C's one long frame.** In one run, C at pixel ratio 2 had a single 77 ms long frame, during which the water's own work stayed under 1.5 ms. Three reruns of the same case (2,700 frames) had none, so that stall is not attributed to the water code.
- **Memory** is flat: the counts of geometries, programs and textures never changed. B and C carry about 6 MB more heap than A, for Three.js.

## Checks done

- **Alignment.** The water sits on the map's SVG layers to within 0.001 px at 1440x900, 1024x768, 744x1133 and 1133x744, and stays aligned after live resizes between those sizes.
- **Console.** No console errors or warnings in A, B or C, nor on the fallback.
- **Reduced motion.** Each version shows one still frame and does not animate.
- **Pausing.** The animation stops when the map is scrolled off-screen or the tab is hidden, and resumes when it comes back.
- **Without WebGL.** B and C fall back to A's still drawing with the note, both when WebGL is missing at load and when the context is lost mid-animation.
- **Other steps.** The other steps (respond, closed, practice) work with the new geography.
- **Tests and build.** `npm test` and `npm run build` pass.
- **Fix round 1.** On C, the checks above were run again:
  - alignment at the four sizes, and after resizing through them;
  - the console;
  - reduced motion;
  - the fallback without WebGL;
  - pausing for a hidden tab and when the map is off-screen.

  The respond, closed and practice steps were checked too, with the tapered Waterfall Trail, the walked lines and the closed stretch.
- **Round 3.** On C, in Chromium and WebKit:
  - **Alignment.** The water sits on the map's SVG layers to within 0.001 px at 744x1133, 1024x768, 1133x744, 1440x900, 1920x1080 and 2560x1440, on load and after resizing live through them. This holds at pixel ratio 1 and 2, and for A's drawing without WebGL.
  - **The falls, by pixel.** At four heights on the fall, the channel shows 3.2–3.6 map units on each side of the sheet (3.5 drawn; the spread is within one device pixel). The sheet's top is at 390.2–392.6, against the notch floor at 391.
  - **The source, by pixel.** The stream's first water pixel is at a height of 421.4–422.8 map units, where the crest is at 422.2. No water shows above the crest at any size.
  - **Motion.** On the walk to Halfway (3.2 s), the legs and arms swing and the pair moves along the trail. With reduced motion the map is one still frame, unchanged over 1.5 s, and the legs don't swing.
  - **Every step.** Plan, turn back, practice, retry, closed and respond all draw without errors.
  - **Console.** No errors or warnings, with or without WebGL.
  - **Tests and build.** `npm test` and `npm run build` pass.
- **In the lesson.** In Chromium and WebKit:
  - **Every step, every language, every size.** The hike was played step by step, with both choices at Halfway and all three at the closed trail, in English, German, Spanish and French at 744x1133, 1024x768, 1133x744, 1440x900, 1920x1080 and 2560x1440, then resized live to another of those sizes. Each played step ends on the same picture as opening that step directly.
  - **Alignment.** The water canvas and both SVG layers share one mapping to within 0.01 px at every size, before and after the resize.
  - **Inside the map.** The labels, the pair and the ranger's bubble stay inside the map at every size and in every language.
  - **The falls, by pixel** (1920x1080 at pixel ratio 2, and 2560x1440). The channel shows 3.3–3.7 map units on each side of the sheet (3.5 drawn). The sheet's top is at 403.5–404.4, against the moved notch floor at 403.5. The rocks' lowest edges are 1.6–12.4 units below the ground line, with no background showing under them.
  - **The source, by pixel.** The first water is at 421.2, under the crest at 421.5.
  - **The pair and the cabin.** At the first step, the turn-back step and the practice walks, the pair stands 20.6 map units clear of the cabin.
  - **Reduced motion.** The water is one still frame, unchanged over 1.2 s; the pair moves to each step without walking, and their legs don't swing.
  - **Without WebGL, and after a lost context.** A fresh canvas shows A's still drawing.
  - **Pausing.** The water draws nothing while the tab is hidden, while the sorting board covers the map, or after the reader leaves the hike, and resumes when the map shows again.
  - **Loading.** The water module is requested only when the hike is first shown.
  - **Console.** No errors in any run.
  - **The text version.** The built reading pages in all four languages are unchanged.

## Known issues and limits

- **Three.js stays for the study pages only.** The lesson's water is plain WebGL. This round's B and C pages still run on Three.js, so `three` stays a devDependency; the site's build contains none of it.
- **A first frame for B and C.** On some loads B and C have one extra frame of about 50 ms at 4x, while WebGL is set up.
- **B and C looked alike.** The owner saw no difference between the versions except in the stream, so B is retired and C goes forward.
- **The first WebGL context.** Entering the hike for the first time costs a task of about 13–20 ms at 4x, against 11–15 ms before, because the browser creates the page's first WebGL context then. It happens once, as the hike's scene fades in.
- **The far bank's colour.** The strip of hillside over the lake's far edge uses the second hill band's own colour (#d2ddd3), so it has to change with that band.
- **The study copy.** `prototype/hike-water/scene.js` stays as this round's record. The lesson's scene (`src/lessons/choices/journey-hike.js`) now carries everything in it, plus the moved falls and the trailhead's one shape, so the two have drifted apart on purpose.
- **No fresh-context design review.** The design reviewer has not looked at round 3, the lesson's version or round 4 yet.
- **The pair never reaches the lake.** No step walks them past the bridge, so the crest and far-stretch rules for the pair are seen only through the check hook.

## Images

### First round (v01)

At 1440x900 and 744x1133, Halfway step:

| Version | 1440x900 | 744x1133 |
| --- | --- | --- |
| A · Flat | [A at 1440](hike-water-a-1440-v01.png) | [A at 744](hike-water-a-744-v01.png) |
| B · Three.js, flat | [B at 1440](hike-water-b-1440-v01.png) | [B at 744](hike-water-b-744-v01.png) |
| C · Three.js with light | [C at 1440](hike-water-c-1440-v01.png) | [C at 744](hike-water-c-744-v01.png) |

**Motion strips.** Each strip has three frames, 0.45 s apart, at pixel ratio 2, showing the bridge, the junction, the side stream, the pool and the fall:

- [A's motion](hike-water-a-motion-v01.png)
- [B's motion](hike-water-b-motion-v01.png)
- [C's motion](hike-water-c-motion-v01.png)

**Fallback.** [B without WebGL](hike-water-b-nowebgl-1440-v01.png) shows A's still drawing and the note.

### Fix round 1 (v02, C only)

- Full page: [C at 1440](hike-water-c-1440-v02.png), [C at 744](hike-water-c-744-v02.png).
- Close-ups at pixel ratio 2:
  - [the falls](hike-water-c-falls-v02.png): the notch, the second rock and the foot in the pool;
  - [Mirror Lake](hike-water-c-lake-v02.png);
  - [the bridge](hike-water-c-bridge-v02.png);
  - [the cabin and table](hike-water-c-cabin-v02.png).
- [C's motion](hike-water-c-motion-v02.png): three frames 0.45 s apart.
- [C without WebGL](hike-water-c-nowebgl-1440-v02.png): A's still drawing, in step with C.
- **v03.** The picnic table moved to the right of the cabin, away from the map's edge: [C at 1440](hike-water-c-1440-v03.png), [C at 744](hike-water-c-744-v03.png), [the cabin and table](hike-water-c-cabin-v03.png).

### Round 3 (v04, C only)

- Full page, Halfway step: [C at 1440](hike-water-c-1440-v04.png), [C at 1920](hike-water-c-1920-v04.png), [C at 744](hike-water-c-744-v04.png).
- Close-ups at pixel ratio 2, framed like the v02 and v03 ones:
  - [the falls](hike-water-c-falls-v04.png): the notch, the sheet on its floor, the channel's equal margins and the second rock;
  - [the bridge](hike-water-c-bridge-v04.png): the three-quarter deck and both rails;
  - [the trailhead clearing](hike-water-c-cabin-v04.png), with the cabin and the table;
  - [the stream's source](hike-water-c-source-v04.png) at the hill's crest.
- [The pair at Halfway](hike-water-c-walkers-v04.png), at pixel ratio 3.
- [The walk](hike-water-c-motion-v04.png): four frames of the pair walking to Halfway, taken in quick succession, at pixel ratio 3.
- [C without WebGL](hike-water-c-nowebgl-1440-v04.png): A's still drawing, in step with C.

### In the lesson (site-hike v01)

The lesson's own page at the Halfway step, taken from the site:

- English: [1440x900](site-hike-1440-v01.png), [1920x1080](site-hike-1920-v01.png), [744x1133](site-hike-744-v01.png).
- German: [1440x900](site-hike-de-1440-v01.png), [1920x1080](site-hike-de-1920-v01.png), [744x1133](site-hike-de-744-v01.png).
- Close-ups at 1440x900, framed like round 3's:
  - [the falls](site-hike-falls-v01.png), moved down onto the ground, next to [round 3's](hike-water-c-falls-v04.png), at pixel ratio 2;
  - [the trailhead](site-hike-trailhead-v01.png), the trail and the clearing as one shape, next to [round 3's](hike-water-c-cabin-v04.png), at pixel ratio 2;
  - [the pair at Halfway](site-hike-walkers-v01.png), at pixel ratio 3.
- [Without WebGL](site-hike-nowebgl-1440-v01.png): A's still drawing.

## Source files

All files are in `prototype/hike-water/`:

| File | What it holds |
| --- | --- |
| `index.html`, `a.html`, `b.html`, `c.html`, `boot.js`, `copy.json` | the pages and their words |
| `index-page.js` | the version list |
| `page.js` | the lesson-like layout and the water set-up and fallback |
| `scene.js` | the study copy of the hike scene: the rocks and the falls' notch and channel, the lake's shore and far bank, the tapered trail, the bridge, the trailhead clearing, the cabin and the table, and the figures of Alfredo and his dad |
| `geometry.js` | the shared water shapes, the green hill and its crest, and the falls' measurements |
| `water-colors.js` | the token mixes |
| `water-flat.js` | version A and the fallback |
| `water-three.js` | versions B and C |
| `water-layer.js` | sizing, the frame loop, pausing, reduced motion and stats |
| `hike-water.css` | the page's styles, the props' colours (trail, clearing, bridge, cabin, table, lake shore) and the figures' walking motion |

`three` 0.186.1 is an exact devDependency. The lesson does not use it.

The lesson's version is in `src/lessons/choices/`: `journey-hike.js` (the scene and the story's steps), `journey-hike-geometry.js` (the shared shapes), `journey-hike-water.js` (the WebGL water and its still fallback) and `journey-icons.js` (the figures).
