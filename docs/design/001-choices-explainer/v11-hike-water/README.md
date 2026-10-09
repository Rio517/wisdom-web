# v11 — Hike water

Created: 2026-10-09. Updated: 2026-10-09 (round 3). Status: C goes forward, with A's still drawing as its no-WebGL fallback; B is retired. Round 3 is on a branch for the owner's review. Not in the lesson; not published.

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

## One geography for every version

The water's shapes live in one module (`geometry.js`), so A, B and C differ only in how the water looks.

- **Main stream.** It appears from behind the crest of the green hill below the mountains. It narrows with distance, winds down through the notch in the second ridge, passes under the bridge where the trail crosses, and leaves at the bottom edge.
- **Waterfall.** The fall pours from a notch at the top of its tall rock on the right, as in the before picture, into a small pool at its foot. A smaller second rock stands behind it to the right.
- **Side stream.** It is narrower than the main stream and runs from the pool leftwards in slow meanders. It joins the main stream below the bridge in a clean Y.
- **Width and motion follow depth.** Width and the flow pattern both follow depth: the water is narrow and slow far away and wider and faster close up, and both streams share the same scale.
- **Mirror Lake.** It sits in the land below the dip in the skyline: an uneven shore about 5:1 wide, a thin shore band, the hillside over its far edge. The trail ends at its near shore.
- **What moved.** The trail, the trailhead, the big rock, Alfredo and the labels stay where the lesson has them, with these exceptions:
  - The Waterfall Trail used to run up the stream's west bank to v10's waterfall in the middle of the map. It now leaves the bridge eastwards, above the side stream, to a lookout beside the falls.
  - The picnic spot moved to that lookout.
  - In fix round 1, Mirror Lake moved down into the land, and the trail's last stretch now ends at the lake's near shore. The trailhead became a cabin with a picnic table, and its label moved to sit over the cabin.
  - In round 3, the stream's source moved down from the far ridges to the green hill's crest, the cabin moved down onto the clearing, and the Halfway flag moved up the trail.
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

Foam and glints use `paper`. If the hike keeps a version, these mixes become tokens in `tokens.css`.

## How to run it

```sh
npm run dev:prototype -- --host 127.0.0.1 --port 4632 --strictPort
```

Open <http://127.0.0.1:4632/prototype/hike-water/>, which links to [A](http://127.0.0.1:4632/prototype/hike-water/a.html), [B](http://127.0.0.1:4632/prototype/hike-water/b.html) and [C](http://127.0.0.1:4632/prototype/hike-water/c.html). Each page shows the Halfway step at the lesson's layout. Its choice buttons work, and the pills switch between versions.

`?beat=plan|turnback|practice|retry|closed|respond` shows another step's map. `globalThis.hikeWater` in the console exposes the frame stats, timings, the renderer's counts and an alignment check.

## The numbers

Measured on 2026-10-09 in headless Chrome (ANGLE on Metal, Apple M4), at 1440x900 with the CPU throttled 4x and 12 to 15 s of steady animation per run. The dev server was serving unbundled modules.

### After round 3 (C)

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

### After fix round 1 (C, and A as its fallback)

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

### First round

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

## Known issues and limits

- **The Three.js cost.** C costs 132.1 KB gzipped, almost all of it Three.js; its renderer barely tree-shakes. The same shaders on raw WebGL would be a few KB (an estimate, not built). The plan is to port C's shaders to plain WebGL at integration, so they use no Three.js chunks.
- **A first frame for B and C.** On some loads B and C have one extra frame of about 50 ms at 4x, while WebGL is set up.
- **B and C looked alike.** The owner saw no difference between the versions except in the stream, so B is retired and C goes forward.
- **A slower load frame.** Building the tapered trail adds about 45 ms at 4x to the one-time load frame. The ribbons could be computed ahead of time if that matters.
- **The far bank's colour.** The strip of hillside over the lake's far edge uses the second hill band's own colour (#d2ddd3), so it has to change with that band.
- **This is a study copy.** `scene.js` is a study copy of the lesson's hike scene (`src/lessons/choices/journey-hike.js`), and the lesson is unchanged. Keeping a version means:
  - porting `geometry.js`, the water module and the moved trail into `src/`;
  - adding the colour tokens;
  - moving the prototype's English-only strings (`copy.json`) into all four catalogs;
  - moving Alfredo's and his dad's figures next to Maya's figure code, so all the lesson's people come from one place.
- **The pair by the cabin.** At the first step and the turn-back step, the pair stands on the trail's start and slightly overlaps the cabin's right corner.
- **No fresh-context design review.** The design reviewer has not looked at round 3 yet.

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

`three` 0.186.1 is an exact devDependency.
