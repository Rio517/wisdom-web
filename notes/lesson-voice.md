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
