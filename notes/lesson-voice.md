# Lesson-voice notes

The relay returned HTTP 403 from this container, so notes are kept here instead.

## 1. Hello

hello from lesson-voice

## 2. Deliverable 1 pushed

The voice skill is at `.claude/skills/wisdom-voice/SKILL.md`, with one README bullet under "Coding agents".

## 3. Change of plan received

The hike (3), Maya (4) and the Lesson 2 proposal (6) are done elsewhere. This branch delivers 1, 2, 5 and 7, and leaves `journey-hike.js`, `journey-skills.js`, the soccer-ball drawing, the font floors and `docs/product/015-*` alone.

## 4. Deliverable 2 done: Lesson 1 in the voice

Every kid-facing line of Lesson 1 is rewritten in English, then Spanish, German and French (AI drafts). `docs/content/choices-journey.md` is regenerated. Screens: `docs/design/001-choices-explainer/v10-voice-pass/README.md`.

Five before and after lines:
1. Plan. Before: "No single step will get them there. Lots of steps, with rests along the way, can." After: "Mirror Lake is a long way up. Nobody gets there in one jump. It's one small step after another."
2. Outside forces. Before: "Other people, the help you have, and luck shape the path too. Some ways close for reasons nobody chose." After: "Other people and luck shape your path too. Sometimes a way closes, and nobody chose that. Sometimes a door opens that you never knocked on."
3. The ranger. Before: "The ranger points to the Waterfall Trail. It's shorter, and it's open." After: "The ranger smiles. "Have you seen the Waterfall Trail? It's shorter, and it's open." A lucky tip they never planned for."
4. Maya. Before: "Once Path A Maya can control the ball without staring at it, she can look up and see her teammates. That makes passing and positioning easier to learn." After: "Path A Maya stops staring at the ball. Now she can look up and see her teammates. So passing gets easier to learn."
5. Takeaway. Before: "When plans change, you can pause, ask for help and find another way forward." After: "Some surprises are storms. Some are lucky breaks. Either way, you can pause, ask for help and choose your next step."

Other changes:
- The sort board swaps "The trail closing" for a good-luck card, "A friendly ranger at the bridge" (outside their control).
- The game's last afternoon is now a lucky break, and the bad-luck days are tagged "Unlucky" instead of "Chance".
- The map story sets use plainer words.

Defaults I chose (the owner can overrule):
- Day 10 says "the coach is a player short on Saturday and asks you", so it reads as luck rather than a reward for practising.
- "Go home grumpy" became "Go home".

Checks:
- `npm test`: 240 pass. `npm run build`: 25 pages.
- 320 screens: 20 steps × 4 languages × 4 sizes, reduced motion. No raw keys, sideways scroll, clipped narration or console errors.
- One design-reviewer round. Its blocker (explorer copy promising lucky surprises the explorer didn't have yet) is resolved by deliverable 5, which adds them. Its should-fix items are applied.

Seen but not mine:
- de 1024×768 never-late breaks "Handdribbling" mid-word.
- fr 744 hike clips "Départ du sentier" at the map's left edge.
- The life map still shows only closed ways. Showing a door opening there needs `journey-map.js` (the home-page session's file).

## 5. Deliverable 5 done: the explorer

Design note: `notes/explorer-chains.md`. Captures: v10 README, part two.

## 6. Closing report (CLOSE wisdom-39ngep)

Built:
- **Voice skill** (`.claude/skills/wisdom-voice/SKILL.md`, about 500 words) and one README bullet.
- **Lesson 1 rewritten in the voice**, in English and as Spanish, German and French AI drafts. Outside forces cut both ways throughout: the ranger's lucky tip, a good-luck sort card, a lucky last afternoon and the takeaways.
- **Explorer chains**:
  - Eight chains where earlier choices unlock later ones.
  - Lucky breaks and setbacks that take turns; every setback is followed by real choices.
  - Big steps swing the path far up or down the map.
  - The end summary counts choices, lucky breaks, setbacks and closed doors.
  - The text version writes out two example lives.
- **Bug fix:** explorer announcements were wiped by a panel re-render, so screen readers heard nothing. They work now.

Simplified or skipped:
- Deliverables 3, 4 and 6 are not done here, as the lead instructed.
- The readable copy doesn't list the chains: its generator (`tooling/lesson-copy.mjs`) is outside my files.
- "Leave the PhD" is shown as "Leave the research job" and "Start a PhD" as "Do research in a lab", per the reviewer's plain-word note. The owner may prefer "PhD".

Known issues:
- The life map shows only closed ways; a door opening there needs `journey-map.js`.
- `NEXT_STEP.md`, `COMPLETED.md` and product 013 need updating; they are outside my edit list.
- Overview labels sometimes overlap at big swings.
- The German game skill labels break mid-word in portrait.
- fr 744 clips "Départ du sentier" in the hike.
- The relay returned 403 (network policy), so every note is in this file.

Checks:
- `npm test`: 240 pass, 0 fail. `npm run build`: 25 pages.
- Copy: 320 screens (20 steps × 4 languages × 4 sizes, reduced motion). No raw keys, sideways scroll, clipped narration or console errors.
- Explorer: lives played to 70 in 4 languages × 4 sizes with no console errors.
- Keyboard only: the sort board (6 of 6 cards placed by arrow keys) and a whole explorer life by Tab and Enter, ending with focus on the end card. Announcements are heard.
- Text version: two chains present.
- Design reviews: 2 rounds (copy; explorer). No blockers remain, and the should-fix items are applied except the label overlap.
