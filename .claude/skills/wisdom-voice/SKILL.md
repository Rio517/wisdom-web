---
name: wisdom-voice
description: Use when writing or changing ANY Wisdom words: lesson steps, labels, buttons, choices, feedback, alt text, takeaways, page copy. The narrator's voice, reading level, and how words move through the four catalogs.
---

# Wisdom voice

## The narrator

A wise older man who has seen a lot of life and liked most of it. Warm, calm, unhurried, a little funny: a dry aside, never a joke at anyone's expense. He tells you what happened and trusts you to notice what it means. He is on the reader's side, even when things go badly.

## Reading level

The main readers are about 8 to 12. A 10-year-old should read every line aloud without stumbling.

- Short sentences. In story steps, about 15 words at most; one idea each.
- Everyday words. A harder word (resilience, landmark) needs a reason and a plain explanation right beside it.
- Active voice, real subjects: "A storm washed out the trail", not "The trail was closed".
- Concrete before abstract: what Alfredo did, then what it shows.

## Tone

- Warm, not sugary. Setbacks feel real; nobody is told to cheer up.
- No lecturing, no "should", no morals tacked on. Show it; let the takeaway say it once.
- Humor is light and kind (a cello that waits patiently). Never mock a reader's choice.
- Never promise results. Say "can help", "often", "a head start", not "will".

## Outside forces cut both ways

Things you don't choose bring good luck too: a teacher who notices you, an invitation, a scholarship, a surprise chance. Whenever the lesson talks about what is outside your control, name both.

## Mechanics

- Words live only in `src/i18n/messages/<locale>.json`: flat keys, whole sentences, ICU MessageFormat, no HTML. Never put prose in code.
- English is the source. en, es, de and fr change in the same commit; `npm test` checks keys and arguments. Keep German short enough for its layout and look at it.
- Keep keys stable unless a step really changes. After lesson changes, run `npm run copy:lesson`.

## Before and after (from Lesson 1)

1. Before: "Last night's storm washed out part of the lake trail. A ranger at the bridge says it's closed. All their planning couldn't stop the rain."
   After: "Last night, a storm washed part of the lake trail away. A ranger at the bridge says it's closed. No plan can stop the rain."

2. Before: "Other people, the help you have, and luck shape the path too. Some ways close for reasons nobody chose."
   After: "Other people and luck shape your path too. Sometimes a way closes. Sometimes a door opens that you never knocked on."

3. Before: "Once Path A Maya can control the ball without staring at it, she can look up and see her teammates. That makes passing and positioning easier to learn."
   After: "Path A Maya stops staring at the ball. Now she can look up and see her teammates. So passing gets easier to learn."

4. Before: "Partway up, Alfredo checks his bottle. Half the water is gone, and the lake is still far away."
   After: "Alfredo checks his bottle. Half the water is gone already. The lake is still far away."
