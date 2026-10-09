# v12 — Maya figure

Created: 2026-10-09. Status: implemented on a branch; owner review pending. Not published.

Question: does the new Maya match the picked concept?

The picked concept (A · Garden) was chosen for the character only: the same girl, kicking her soccer ball, drawn the same way in both of her lanes. Everything else on the screen (lanes, calendars, skill boxes, chips, bars and words) stays as it was.

Related: [product 013](../../../product/013-choices-guided-journey.md), [v10 — Maya fixes](../v10-maya-fixes/README.md) (the shared soccer ball). Source: `person()` and `soccerBall()` in `src/lessons/choices/journey-icons.js`; the figure's box in `src/lessons/choices/journey.css` (`.lane-who svg`).

## Review images

- [The picked concept (A · Garden), Path A](concept-maya-path-a-v01.png) and [Path B](concept-maya-path-b-v01.png): the reference crops.
- [Size strip](size-strip-v01.png): the picked concept beside the code drawing at 48, 64 and 96 px tall, Path A and Path B, at the same height (shown at 2× pixel density, as on an iPad or a high-density laptop screen).
- [Slot strip](slot-strip-v01.png): the old and new figure in the lane's own box at each of its three sizes.

Maya's chapter, before and after:

| Screen | Beat 1, before | Beat 1, after | Beat 2, before | Beat 2, after |
| --- | --- | --- | --- | --- |
| 1440×900 | [before](before/maya-beat1-1440x900-v01.png) | [after](after/maya-beat1-1440x900-v01.png) | [before](before/maya-beat2-1440x900-v01.png) | [after](after/maya-beat2-1440x900-v01.png) |
| 1920×1080 | [before](before/maya-beat1-1920x1080-v01.png) | [after](after/maya-beat1-1920x1080-v01.png) | [before](before/maya-beat2-1920x1080-v01.png) | [after](after/maya-beat2-1920x1080-v01.png) |
| 744×1133 | [before](before/maya-beat1-744x1133-v01.png) | [after](after/maya-beat1-744x1133-v01.png) | [before](before/maya-beat2-744x1133-v01.png) | [after](after/maya-beat2-744x1133-v01.png) |

## The drawing

Six flat shapes plus the shared ball, in one inline SVG (viewBox 60×64, 14 elements, about 2.2 KB). Decorative, `aria-hidden` as before.

- **Head.** One skin circle, 38.5% of her height (the picked concept measures about 38%). Its outline matches the concept's to within half a unit at every row measured.
- **Face.** Two small ink dots set a little below the middle of the face and toward the ball. No mouth or nose, as in the concept.
- **Hair.** One shape: a fringe sweeping down across the forehead from a point above the right eye, and a ponytail swinging out behind, with a thin gap where it leaves the head.
- **Shirt.** A T-shirt with short sleeves and a small V at the neck, in the lane's colour.
- **Limbs.** Four round-capped skin strokes: the back arm swinging behind, the front arm forward, the back leg bent at the knee, the front leg reaching the ball. The torso stays upright and her weight is over the back foot.
- **Shoes.** Two dark rounded shoes.
- **Ball and ground.** The site's shared soccer ball at her front foot, and two flat ground ellipses (under her and under the ball).

Colours: skin `#ab7648`, sampled from the face in the picked concept (the median of the face area; the same value in both crops); hair `#3a2a1f`; eyes and shoes ink `#23302d`; shirt forest `#285442` in Path A and lake `#5f8fa3` in Path B; ground rule `#dbe2da`. Both lanes use the same shapes; only the shirt colour changes.

Without a ball (the Lesson 2 prototypes that show her with cello or books), the same girl is drawn in a narrower 47×64 box with no ball and no ball shadow.

## Size

The new figure is wider than the old one, so each lane box widens to fit her and keeps its height. She is now as tall as the old figure's box, about 20% larger than she would be in the old box, and no lane, calendar, skill box or label moves.

| Screen | Old box | New box |
| --- | --- | --- |
| Over 1280 px wide | 64×82 | 77×82 |
| 1280 px wide or less | 40×52 | 49×52 |
| Over 900 px wide and 800 px tall or less | 34×44 | 41×44 |

## Differences from the picked concept

- **Ball.** The ball is the site's one soccer ball (round v10), with a darker rim and seams than the concept's white ball. At 48–64 px it reads as a ball but looks more like a wheel than the concept's. Changing it would change every ball on the site, so it is left for a separate decision.
- **Limbs.** Arms and legs are 4 units thick, about a third thicker than the concept's, so they stay visible at the smallest lane size (44 px tall).
- **Colours.** The shirts use the site's forest and lake, a little darker than the concept's softer greens and blues. The ground is the site's rule colour, a little stronger than the concept's faint grey.
- **Detail.** No soft edges, texture or shading. Shapes are placed to within about half a unit of the concept's at a 64-unit height, which is under a pixel at the lane's size.

## Checks

- Every lane, calendar, skill box and label is in the same place before and after (same position and size to 0.1 px) in Maya's chapter: beats 1–3, every season step, and with "Trying something new" open and closed, at 744×1133, 1024×768, 1133×744, 1440×900, 1920×1080 and 2560×1440, in Chromium and WebKit. In every state the figure stays inside its lane and clear of the calendar.
- The three Lesson 2 prototypes (`prototype/lesson2/a.html`, `b.html`, `c.html`) still draw her, in both engines.
- `npm test` and `npm run build` pass. No console errors on any page checked.

Shots of the chapter were taken with reduced motion at 1× pixel density, so every state is settled.
