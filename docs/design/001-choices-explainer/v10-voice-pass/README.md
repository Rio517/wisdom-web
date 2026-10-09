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

## Part two — the explorer

Design note: [notes/explorer-chains.md](../../../../notes/explorer-chains.md). Code: `src/lessons/choices/journey-choices.js` (the chains) and `journey-explore.js` (the tree and drawing).

What changed:
- Eight chains of steps build over a life. Earlier choices unlock later ones: maths club → tournament → a teacher spots your talent → science → a scholarship → university → a PhD → a discovery. There are branches for an unkind supervisor or a parent's illness.
- Surprises happen at some forks instead of a choice:
  - A "Lucky break" (sun) or a "Roadblock" (clay) chip names the event, and the reader presses it to go on.
  - Lucky breaks and roadblocks take turns, so a life meets both.
  - Every roadblock is followed by real choices.
- Big steps and big surprises swing the path far up or down the map. Small steps keep the gentle bends. A flat star marks a lucky break on the lived path, and a flat diamond marks a roadblock. The side panel tags each one in words.
- The end card counts the lucky breaks and roadblocks along the way.
- The text version writes out two example lives, one with a big lucky break and one with a big roadblock.
- Fixed: the side panel used to re-render over its live region, so screen readers never heard a choice. The live region now stays put.

Captures (all v01):
- A life with big surprises, 1440 × 900:
  - [the discovery appears](explore-lucky-discovery-en-1440x900-v01.png)
  - [the whole life: a parent's illness at 27, then a PhD and a discovery](explore-lucky-life-end-en-1440x900-v01.png)
- A life with a big setback, 1440 × 900:
  - [a bad knee injury at 20](explore-roadblock-knee-en-1440x900-v01.png)
  - [the whole life](explore-roadblock-life-end-en-1440x900-v01.png)
- Other languages:
  - [German surprise, 744 × 1133](explore-surprise-de-744x1133-v01.png)
  - [Spanish surprise, 768 × 1024](explore-surprise-es-768x1024-v01.png)
  - [French end, 1024 × 768](explore-end-fr-1024x768-v01.png)

Checks:
- Lives played to 70 in all four languages at all four sizes, with no console errors.
- Keyboard only: Tab to a chip, then Enter at every fork through a whole life. Focus moves to the next chip and then to the end card. Announcements include "Age 18. Roadblock: You hurt your hand for a year."
- The sort board also works with arrow keys alone.
- Reduced motion is on for every capture.

## Limits

- Browser emulation only: no physical iPad, screen reader session or child reading test.
- The readable copy (`docs/content/choices-journey.md`) lists the explorer's age-band examples but not the chains, because its generator sits outside this round's files; the chains are in the design note and the text version.
- The life map still shows only closed ways (reasons such as "The team was full"); showing a door opening on the map needs a change to the path-field code, which this round does not touch.
