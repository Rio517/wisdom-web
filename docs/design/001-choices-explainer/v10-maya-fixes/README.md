# v10: Maya's two paths, alignment and iPad fixes

Shots at 1440x900, 1024x768, 768x1024 and 744x1133: `before/` and `after/`
(each Maya step, `skills-*`, plus one game afternoon, `play-game`).
`soccer-ball-before-after.png` shows every soccer drawing at its drawn sizes.

## Fixes
- Soccer ball: one shared drawing (`soccerBall` in `journey-icons.js`): dark centre pentagon, five patches cut by the rim, thin seams, flat. Used by the Maya figures, the skill-box headers, the game's activity buttons and rail, and the wall-ball icon. The old small ball looked like a radio button.
- Season bar: the line ran about 13px below the dots. Dots and line now share one centre line, the five steps are equal columns, and the bar sits on the same two columns as the lanes ("Time" over the fork, steps from the lane edge).
- Fork: the "Maya, 8" dot sat about 17px above the point where the two curves start. The dot, curves and label now share one origin, centred between the lanes.
- Skill rows: the "helped by" note is left-aligned under the level word instead of right-aligned, and the box title and note share a top edge.
- Responsive: the compact lane layout now starts at 1280px wide (it broke at 1180px, where the week squares overflowed their column), and on short landscape screens (about 690px tall, Safari on iPad) lanes tighten so the skill box stays inside its lane.
