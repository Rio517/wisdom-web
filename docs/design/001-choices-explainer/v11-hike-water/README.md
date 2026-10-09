# v11 — Hike water

Created: 2026-10-09. Status: three prototype versions on a branch; the owner's pick is pending. Not in the lesson; not published.

**Question: which water does the hike keep?**

Related: [product 013](../../../product/013-choices-guided-journey.md) (the guided journey, chapter 2: Alfredo's hike) and [v10 — Hike fixes](../v10-hike-fixes/README.md), whose [before](../v10-hike-fixes/before-halfway-1440x900-v01.png) and [after](../v10-hike-fixes/after-halfway-1440x900-v01.png) pictures this round answers.

## The owner's review, summarised

After v10, the owner found the hike's graphics worse than before, the water most of all. The flat, simple background is liked and stays; the rock can stay flat too. The requests were:

- the stream should come over the mountain;
- the waterfall should go back into its rock, where it was before v10;
- the stream on the right should merge into the first stream;
- Three.js should be tried for the water, in a few versions to compare.

## One geography for every version

The water's shapes live in one module (`geometry.js`), so A, B and C differ only in how the water looks.

- **Main stream.** It rises behind the far ridge and shows where it crosses the ridge line at a saddle. It narrows with distance, winds down through the notch in the second ridge, passes under the bridge where the trail crosses, and leaves at the bottom edge.
- **Waterfall.** The fall sits in its tall rock on the right again, as in the before picture, with a small pool at its foot.
- **Side stream.** It is narrower than the main stream and runs from the pool leftwards in slow meanders. It joins the main stream below the bridge in a clean Y.
- **Width and motion follow depth.** Width and the flow pattern both follow depth: the water is narrow and slow far away and wider and faster close up, and both streams share the same scale.
- **What moved.** Mirror Lake, the trail, the trailhead, the big rock, Alfredo and the labels stay where the lesson has them, with two exceptions that the water forced:
  - The Waterfall Trail used to run up the stream's west bank to v10's waterfall in the middle of the map. It now leaves the bridge eastwards, above the side stream, to a lookout beside the falls.
  - The picnic spot moved to that lookout.
  - Trees keep clear of all the water.

## The three versions

| Version | What it is | Trade-off |
| --- | --- | --- |
| **A · Flat** (`a.html`) | Canvas 2D, no Three.js. Flat layered fills: a darker bank and a lighter body. Every bank is drawn first, then every body, so the junction and the pool join without a seam. The motion is slow and flat: thin light dashes drift downstream in three lanes, streaks fall down the sheet, foam sits at the foot, and ripple rings spread on the pool and the lake. | The lightest (3.5 KB gzipped) and the closest to the flat background. The motion is readable but mechanical: dashes, not water. |
| **B · Three.js, flat** (`b.html`) | One orthographic Three.js layer between the background and the trail, still in flat colours. Soft bands drift down the streams in two layers at different speeds, so the pattern keeps changing. The fall is a sheet of long soft streaks sliding down from a lighter lip, with churning foam where it lands. Gentle rings spread on the pool and the lake. The edges are anti-aliased in the shader. | It reads more like moving water than A while staying flat. It costs 131.6 KB gzipped. |
| **C · Three.js with light** (`c.html`) | B plus light: small glints that ride the flow and fade in and out, a lighter shimmer travelling down the fall, and a slightly deeper middle in the streams. | The liveliest. The light is subtle at a glance, most visible on the lake and the fall; it stays flat colour, with no gradients that imply volume. It costs the same as B. |

B and C use the same module; C turns on its extra shader code with a `LIGHT` define. Without WebGL, or if the context is lost, B and C show A's still drawing with a one-line note in the reading panel.

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

## Known issues and limits

- **The Three.js cost.** B and C cost 131.6 KB gzipped, almost all of it Three.js; its renderer barely tree-shakes. The same shaders on raw WebGL would be a few KB (an estimate, not built). That is worth weighing if B or C wins.
- **A first frame for B and C.** On some loads B and C have one extra frame of about 50 ms at 4x, while WebGL is set up.
- **The stream's source can be hidden.** At 1024x768 the backpack panel, which is taller at later steps, can cover where the stream comes over the ridge. Halfway is clear.
- **B and C look alike.** The difference between them is small at a glance.
- **This is a study copy.** `scene.js` is a study copy of the lesson's hike scene (`src/lessons/choices/journey-hike.js`), and the lesson is unchanged. Keeping a version means:
  - porting `geometry.js`, the water module and the moved trail into `src/`;
  - adding the colour tokens;
  - moving the prototype's English-only strings (`copy.json`) into all four catalogs.
- **No fresh-context design review.** The design reviewer has not looked at this round yet.

## Images

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

## Source files

All files are in `prototype/hike-water/`:

| File | What it holds |
| --- | --- |
| `index.html`, `a.html`, `b.html`, `c.html`, `boot.js`, `copy.json` | the pages and their words |
| `index-page.js` | the version list |
| `page.js` | the lesson-like layout and the water set-up and fallback |
| `scene.js` | the study copy of the hike scene, with the rock and the moved trail |
| `geometry.js` | the shared water shapes |
| `water-colors.js` | the token mixes |
| `water-flat.js` | version A and the fallback |
| `water-three.js` | versions B and C |
| `water-layer.js` | sizing, the frame loop, pausing, reduced motion and stats |
| `hike-water.css` | the page's styles |

`three` 0.186.1 is an exact devDependency.
