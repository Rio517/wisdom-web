# hike-r4 notes

## Hello

hello from hike-r4. Branch `agents/hike-r4` from ff15c4e. Relay unreachable from this environment (403), so notes live here.

## Deliverable 1 pushed: the trail over the hill

Near stretch ends at the hill crest (about x 1060 px at 1920); far stretch comes out right of the falls rock and climbs two switchbacks to a clearing (tiny table, three trees) on the lake's right shore. Walked/closed/Keep-going lines follow it; the pair hides over the crest and is 40% size on the far stretch. No step actually walks them to the lake, so that rule is only exercised by a check hook (`#scene-hike`.hikeCheck.place).

Note: in headless Chromium with SwiftShader GL, choosing "Keep going" shows tile-shifted ghost copies of the map; the base branch does the same, and it disappears with `--disable-gpu`, so it is a renderer artifact, not the page.

## Deliverable 2 pushed: the pool on the hilltop

The ground in front of the falls rises to a level edge at map y 526 (hides about 31% of the fall rock), pool fully on it; checked with WebGL and the no-WebGL still.

## Closing report

**Built.** (1) Trail over the hill: near stretch from the bridge to the green hill's crest (about x 1060 px at 1920), cut by the crest. Hidden behind the hill. Far stretch drawn behind the hill and rock, from x about 1170 up two switchbacks to the lake's right shore, about 30% width, lighter, no dashes. Clearing about 71 x 12 px at 1920 with a 10 px table and three small trees. Walked, closed and Keep going lines are masked to the visible stretches; the pair hides near the crest and is 40% size on the far stretch. (2) Ground raised in front of the falls, level at map y 526 (hides 31% of the rock), sloping left into the ground; the pool lies on it with WebGL and in the fallback. (3) v02 shots and a Round 4 section in the v11 README.

**Simplified.** No step walks the pair past the bridge, so the crest and lake rules are only exercised through a check hook (`#scene-hike`'s `hikeCheck.place(distance)`), which I added for the screenshots. Lake not moved. No i18n changes.

**Checks.** All 8 steps, Next and Back, at 1920, 1440, 1280, 744x1133 and 1133x744, DE 744, reduced motion and no WebGL: no console errors. `npm test` (243) and `npm run build` pass. Water module unchanged at 6.2 KB gz, no three in the build.

**Numbers (cloud container, 4x CPU, production builds, base vs this round).** WebGL entry is 2.3 s in both builds (SwiftShader compiling shaders on the CPU, meaningless here). With WebGL stubbed: hike entry 95-102 ms vs base 96-134 ms; per-step worst 31-130 vs 20-139 ms, overlapping. This machine is several times slower than the M4, so the 13-20 ms budget can't be checked here; there is no regression versus the base. Heap over 5 visits is +55 KB in both builds (4133 to 4188 KB vs 4104 to 4157 KB); nodes are flat at 1653, listeners at 73.

**Known issues.** SwiftShader ghosting after Keep going (also on base; correct with --disable-gpu). No fresh design review yet. The relay returned 403 from this environment, so all notes are here.
