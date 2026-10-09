# v10 — Voice pass

Created: 2026-10-09. Status: implemented on a branch; owner review pending. Not published.

Question: does Lesson 1 read in one warm narrator's voice at an 8–12 reading level, with outside forces that bring good luck as well as bad? And (part two) does a chain-based life-path explorer show earlier choices unlocking later ones, with big surprises moving the path further than small steps?

Sources: the voice rules in [`.claude/skills/wisdom-voice/SKILL.md`](../../../../.claude/skills/wisdom-voice/SKILL.md); the live words in `src/i18n/messages/*.json`; the readable copy [choices-journey.md](../../../content/choices-journey.md); lesson structure [013](../../../product/013-choices-guided-journey.md). These are code-rendered browser captures (headless Chromium, reduced motion) from the built preview; no image prompt is involved.

The hike drawing, Maya's chapter and the path field are unchanged in this round; other work covers them.

## Part one — the copy

What changed:
- Every kid-facing line of Lesson 1 rewritten in the narrator's voice: short sentences (about 15 words at most in story steps), everyday words, active voice, a little humor.
- Outside forces now cut both ways: "Sometimes a door opens that you never knocked on", the ranger's lucky tip, a coach who believes in you, a lucky last afternoon in the game, and a takeaway that names storms and lucky breaks.
- The sort board swaps "The trail closing" for a good-luck card, "A friendly ranger at the bridge", so the outside-their-control side holds one bad and one good surprise.
- The 20 life-map story sets use simpler words ("Learn electronics on the job" instead of "Electronics apprenticeship").
- Spanish, German and French follow as AI drafts.

Captures (all v01):
- English, 1440 × 900: [cover](copy-paths-cover-en-1440x900-v01.png) · [outside your control](copy-paths-outside-en-1440x900-v01.png) · [hike plan](copy-hike-plan-en-1440x900-v01.png) · [trail closed](copy-hike-closed-en-1440x900-v01.png) · [respond](copy-hike-respond-en-1440x900-v01.png) · [sort](copy-hike-sort-en-1440x900-v01.png) · [never too late](copy-skills-never-late-en-1440x900-v01.png) · [takeaways](copy-wrap-takeaways-en-1440x900-v01.png)
- English, 1024 × 768: [game](copy-play-game-en-1024x768-v01.png)
- German: [outside, 744 × 1133](copy-paths-outside-de-744x1133-v01.png) · [never too late, 1024 × 768](copy-skills-never-late-de-1024x768-v01.png)
- French, 744 × 1133: [practice](copy-hike-practice-fr-744x1133-v01.png)
- Spanish, 768 × 1024: [cover](copy-paths-cover-es-768x1024-v01.png)

Review: one fresh-context design review; its should-fix items are applied.

Checks: all 20 steps in all four languages at 1440 × 900, 1024 × 768, 768 × 1024 and 744 × 1133 (320 screens) with no raw message keys, sideways scrolling, clipped narration or console errors. The only overflow hits were visually hidden screen-reader labels and the game heading that portrait layouts hide by design.

## Limits

- Browser emulation only: no physical iPad, screen reader session or child reading test.
- The life map still shows only closed ways (reasons such as "The team was full"); showing a door opening on the map needs a change to the path-field code, which this round does not touch.
