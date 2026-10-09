# v10 — Hike fixes

Created: 2026-10-09. Status: local implementation; owner review pending. Not published.

Question: after the owner's review of the hike (chapter 2 of Lesson 1), does the map now show at a glance a trail that leads from the trailhead to Mirror Lake, a blue stream that clearly is water, and a waterfall that pours into a pool?

Related: [product 013](../../../product/013-choices-guided-journey.md). Source: `src/lessons/choices/journey-hike.js`, `journey.css`, `journey-sort.css`, `journey-play.css`.

## Fixes

- **Trail.** A tan footpath with a darker edge and a dashed centre line, running from the trailhead to the lake shore. The walked part stays green on top of it.
- **Stream.** A wide lake-blue band with a darker bank line and short animated flow strokes. It starts at the pool, passes under the bridge and leaves the map. It no longer runs beside the trail.
- **Waterfall.** The fall drops from a flat rock ledge into a pool, with foam at the foot. The pool feeds the stream. The Waterfall Trail now follows the stream's west bank to the pool.
- **Big rock.** A clearer silhouette with a light top facet and a darker side facet, flat colours only. It sits below the trail so no label or panel hides it.
- **Labels.** Ink text on a paper-coloured plate, at least 16px (places) and 15px (small notes) on screen at every stage size; the size follows the map scale. The turn-flag note wraps to two lines. The ranger's speech bubble fits its text.
- **Trees.** The cone trees stay as they were. Trees are now kept off the trail, the stream and the drawn features, and drawn back to front, so none sits under a walker or a label.
- **Odd circles.** The practice walks were three bare ovals, and the walkers jumped to each oval's start and flipped left and right all the way round. Each walk now goes out along a path from the trailhead, once round its loop and back, with the walkers facing the way they move. The ovals fade out after the practice step instead of staying as faint rings.
- **Backpack panel.** About a third of the stage wide (36%, 250 to 400px), a solid sage border, 16px text, 46px rows, larger bottles.
- **Sorting step.** On tablets the cards now sit across the top and the two groups side by side below; before, the groups were about 95px wide.
- **Font floor.** No lesson text under 15px in `journey.css`, `journey-sort.css` and `journey-play.css`; story text is 19px at every width. Skill rows stack name above meter on tablets so German still fits.

## Images

Before (unchanged code): `before-<step>-<size>-v01.png`. After: `after-<step>-<size>-v01.png`. Steps: plan, halfway, turnback, practice, retry, closed, respond, sort. Sizes: 1440x900, 1024x768 (before and after), 768x1024 (after only).

- Stream and waterfall, before: [plan 1440x900](before-plan-1440x900-v01.png). After: [plan 1440x900](after-plan-1440x900-v01.png), [respond 1440x900](after-respond-1440x900-v01.png).
- Backpack panel, before: [practice 1440x900](before-practice-1440x900-v01.png). After: [practice 1440x900](after-practice-1440x900-v01.png).
- Sorting step: [before 1024x768](before-sort-1024x768-v01.png), [after 1024x768](after-sort-1024x768-v01.png).
- Extra: [ranger bubble](after-closed-ask-1024x768-v01.png), [what-if note](after-halfway-continue-1024x768-v01.png).
