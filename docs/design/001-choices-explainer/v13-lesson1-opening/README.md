# v13 — Lesson 1 opening

Created: 2026-10-09. Status: playable mockup on a branch; owner review pending. Not published.

Question: does the opening tell one life clearly?

The mockup plays the new start of Lesson 1 from beginning to end. First the cover. Then Sam's life grows point by point on the real path field, from birth to thirty. Then "Choices add up". Then the stage fades into the first beat of Alfredo's hike. It uses the lesson's own header, chapter trail, stage, narration column and styles, and the same seed and path engine, so it looks like the lesson. Only the opening plays: the chapters after the hike are shown but can't be opened.

Related: [product 013](../../../product/013-choices-guided-journey.md) (the guided journey), [product 003](../../../product/003-visual-language-and-navigation.md) (visual language), [002 v03 — Stage build](../../002-site/v03-stage-build/README.md) (the cover this opening starts from), [v12 — Maya figure](../v12-maya-figure/README.md) (the round before this one).

## Run it

```sh
npm run dev:prototype -- --host 127.0.0.1 --port 4638 --strictPort
```

Open <http://127.0.0.1:4638/prototype/lesson1-opening/>.

- Press **Watch the paths grow** on the cover. Then Sam's story plays by itself.
- **Space** or **Pause** holds the story. **→**, or a click on the map or the lines, plays the next step (while paused, one step plays and holds). **Next** lands the whole story at once (300 ms), then moves on. **Back** and **←** go back a beat.
- The **Mockup** bar under the stage switches the dark example (**B · gentle**, the default, or **A · darker**) and the pace (**Normal**: 900 ms pauses, 1300 ms after events; **Quicker**: 700 and 1000 ms). It also replays the story.
- The address keeps the settings: `?dark=a`, `?pace=quick`. `#paths-life` opens the finished story, `#paths-adds` the next beat and `#hike-plan` the hike.

## Review images

Held moments, at 1440×900 and 744×1133 (the iPad mini, portrait), plus 1280×800 where the narration is tightest:

| Moment | 1440×900 | 744×1133 | 1280×800 |
| --- | --- | --- | --- |
| Cover | [cover](opening-cover-1440-v01.png) | [cover](opening-cover-744-v01.png) | |
| Step 1, Sam is born: the traveller appears on the Beginning dot | [01](opening-01-1440-v01.png) | [01](opening-01-744-v01.png) | |
| Step 6, the radio DJ: the luck marker blooms, the song pulses | [06 v02](opening-06-1440-v02.png) ([v01](opening-06-1440-v01.png)) | [06](opening-06-744-v01.png) | |
| Step 9, the band splits: the drop | [09 v02](opening-09-1440-v02.png) ([v01](opening-09-1440-v01.png)) | [09](opening-09-744-v01.png) | [09](opening-09-1280-v01.png) |
| Step 11, the whole story: the route's end breathes | [11 v02](opening-11-1440-v02.png) ([v01](opening-11-1440-v01.png)) | [11 v02](opening-11-744-v02.png) ([v01](opening-11-744-v01.png)) | [11](opening-11-1280-v01.png) |
| Choices add up | [adds v02](opening-adds-1440-v02.png) ([v01](opening-adds-1440-v01.png)) | [adds](opening-adds-744-v01.png) | |
| Into the hike, 820 ms after Next | [fade](opening-fade-1440-v01.png) | [fade](opening-fade-744-v01.png) | |

[Life strip v02](opening-life-strip-1440-v02.png): six frames of the story at 1440×900 (steps 1, 3, 5, 6, 9 and the finished story). [v01](opening-life-strip-1440-v01.png) shows the earlier route.

v02 redraws Sam's route as one smooth curve; v01 images show the earlier route, which read like a line chart (straight runs, a flat stretch from 20 to 23, a V at the drop). Everything else in the frames is unchanged.

The held moments use the page's review hook (`opening.player.seek(step, ms)`), which pauses the story at that moment. In these images, the Pause link reads as it does while the story plays.

## How it plays

Each line has the same rhythm. In the first 420 ms the line rises 14 px and fades in. As it lands (260 ms), its point blooms on the map, with a slight overshoot. Then the traveller walks there, from 300 to 1000 ms, starting softly and arriving slowly. The steps this one builds on pulse once as the traveller arrives: a ring that widens and fades over 600 ms, 140 ms apart. Then the pause. One clock drives the words and the route, so they can't drift apart, whether the reader pauses, steps or taps quickly.

- The route grows from the Beginning dot as one smooth curve through Sam's points, with no corners. Its x positions come from the network's age scale. At each point the curve follows the direction of the field's own lines there, unless that would fight a rise or a drop. Climbs and falls ease in and out. The years from the record deal to the split arc gently over. The drop is an S from 23 to 25 that bottoms out just before the setback marker, and the climb after it leaves gently. Two shaping points just outside the marker (not stops) make that bottom a U rather than a V.
- Choices keep the route level. The radio play lifts it (a white dot in a green ring, with a plus). The split drops it (a clay ring, with a minus). Asking for help lifts it again.
- Builds-on pulses: choir → guitar → band → song → radio and record deal. In example B, asking for help pulses the guitar. In example A, the last step pulses it.
- Lines older than the last four step back to the quiet colour. The age sits in a narrow left column.
- In "Choices add up", three labels mark the guitar (His choice), the radio play (Luck) and the split (Not his choice).
- Into the hike: the field and the labels fade first (320 ms). Sam's route stays alone. At 700 ms the hike scene and its words come in, as the route fades.
- With reduced motion, the finished story shows at once, and the beats change without travel.

## Checks

Both browser engines (Chrome's and Safari's) at 1280×800, 1440×900, 1920×1080, 744×1133 and 1133×744:

- The whole flow plays with both paces and both dark examples. It takes 22.4 s at the normal pace and 19.8 s at the quicker one.
- The words and the map never drift apart while playing or under fast taps.
- Space pauses, → steps one and holds, Next lands the story, Back returns to the finished story, Replay plays again, and arrow keys reach the hike and back.
- Reduced motion shows the final state from the cover, on Replay and on every beat.
- No console errors or warnings. `npm test` and `npm run build` pass.

Narration fit at the end of the story (the whole list, Pause and Next in view without scrolling), the same in both engines:

| Screen | Fits | Detail |
| --- | --- | --- |
| 1280×800 | Yes | The list uses its full 408 px; Next ends at 780 of 800 |
| 1440×900 | Yes | Next ends at 846 |
| 1920×1080 | Yes | Next ends at 1026 |
| 744×1133 | Yes | Next ends at 1086 (example A: 1113) of 1133 |
| 1133×744 | No | The list (452 px) scrolls in 367 px of the column, keeping the newest line in view, with the top edge faded |

Frame cost at 1440×900 with the processor slowed 4×, measured from a browser trace. The browser ran headless, with software compositing:

- **Story (Replay, 25 s):** the longest main-thread task was 15.5 ms; none was over 16.7 ms. The story's own drawing took at most 2.0 ms a frame. Frame latency: median 7.7 ms, 95th percentile 20.2 ms, worst 37.2 ms, with 7 dropped frames. The software compositor is the slowest part. An idle page on the same setup has a median of 1.6 ms and no dropped frames.
- **Fast tapping (14 taps, 140 ms apart):** no task over 16.7 ms; frame latency 95th percentile 7.8 ms, worst 34 ms; 1 dropped frame.
- **Cover to story:** one 145 ms task (roughly 36 ms at full speed) when the stage narrows after the paths grow and the field repaints at its new size. It falls between the grow and the first line, while nothing else moves.

## Simplified or changed

- **The route's heights** are half the first sketch's numbers, with a slight sag after the record deal. At full size the route read as a chart, and the drop as a cliff.
- **The narration** is a compact list. In a column narrower than 330 px (1280 wide and below), lines are 17 px with 3 px between them, so most fit on one row. On desktop screens 820 px tall or less, the key hint hides during the story.
- **Below 990 px wide**, the list runs in two columns under the map. The stage is shorter during the story and "Choices add up", at max(420 px, the screen height minus 560 px). In the hike it returns to the lesson's height, so it grows by about 60 px as the hike arrives.
- **The Mockup bar** takes about 46 px from the stage's height. It is not part of the lesson.
- **Into the hike:** the old words fade out over 300 ms, while the field goes.
- **Sam's route** draws on its own canvas, the size of the route, rather than one the size of the stage. With a full-stage canvas redrawn every frame, frame latency was higher: median 12.9 ms, worst 54 ms, 13 dropped frames.
- **Navigation:** the menu's links go to the live site. The hike's first beat is the last one here, so Next is hidden there.
- **English only.** The words are in `prototype/lesson1-opening/copy.json`, merged over the lesson's English catalog.

## Sources

`prototype/lesson1-opening/`:

- `index.html`, `boot.js`: the page, and the English words.
- `page.js`: the lesson controller for the opening, with the trail, beats, keys and the Mockup bar.
- `life.js`: Sam's steps, the timing and the player.
- `map.js`: a study copy of `src/lessons/choices/journey-map.js` with Sam's route, the markers and the labels.
- `opening.css`: the few rules added to `src/lessons/choices/journey.css`.
- `copy.json`: the words.

It imports `src/engine/` (the path network and renderer) and `src/lessons/choices/` (the hike, the motion helpers and the styles) without changing them.
