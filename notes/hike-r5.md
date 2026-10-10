# hike-r5 notes

- hello from hike-r5 (the relay returned 403, so notes go here).
- Deliverable 1 pushed (2544ef8): option crops A–E in `docs/design/001-choices-explainer/v11-hike-water/`, pick E recorded in the README's Round 5 section.
- Deliverable 2 pushed: option E built in the scene. One pool outline (`POOL_SHORE`, `POOL_BANK`, `POOL_MOUTH` in the geometry module) feeds the WebGL pond, the Canvas bank and body, the foam clip and the trees' keep-clear. Fall shortened to land 7 units in front of the rock. Side stream starts just inside the pool's front-left lip; the pool's bank opens round the mouth and the stream's deeper middle is suppressed there, so the joint has no line (the lead's note).
- Deliverable 3 pushed: v03 shots, the alternative plan's end moved to (989, 530) so the pair stands clear of the rock, and the Round 5 build/checks/images in the round README.

## Closing report

- **Built:** option E. The pool has one outline (`POOL_SHORE`, 110 x 25 units) whose back lies 2.4 units over the rock's foot and curves down to its ends. The raised ground's edge stays level at about 526 and dips only within 14 units of the pool's ends. There is no bank along the rock, and the bank opens at the side stream's mouth (`POOL_MOUTH`). The fall is 31 units shorter and lands in the back third. WebGL and the Canvas fallback draw from the same outline.
- **Simplified:** no corner boulders (option A's read as caps stuck on the water), and no depth band along the cliff (too faint to read in option C).
- **Known issues:** the ALT end moved 13 units (more than "a few") so the dad no longer overlaps the rock's left flank. The joint keeps a slight change of texture where the stream's drifting bands meet the pool's still water; there is no line. The budget's absolute numbers can't be checked in this container: base and this round overlap (see the README).
- **Numbers:** 243 tests pass, and the build passes. The water chunk is 6.3 KB gzipped, with no Three.js. At 4x CPU, the longest task on entering the hike was 133–136 ms with WebGL (base 149–166 ms) and 91–97 ms without (base 82–83 ms); per step 11–49 ms (base 17–50 ms). Over 5 visits the heap went from 4,284 to 4,347 KB (base 4,280 to 4,340 KB), with nodes at 1,653 and listeners at 74.
- The relay returned 403 every time, so all notes are in this file.
