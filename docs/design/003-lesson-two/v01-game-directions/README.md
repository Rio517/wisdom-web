# 003 · v01 — Game directions

Created: 2026-10-09. Status: three playable prototypes for review; no direction chosen. These are studies under `prototype/`, not the website.

## The question

Lesson 2's game runs two weeks of a ten-year-old's afternoons with soccer, cello and reading for fun (a story the reader chose). Which way of playing it best leaves the reader feeling that starting got easier once a routine had a time and a place, and that a missed day was just a missed day?

Related: [015 — Lesson 2 proposal](../../../product/015-lesson-two-proposal.md) (the owner chose structure C, the three routines and two weeks; its table lists the mechanics and their evidence), [004 — Habits and the choices we repeat](../../../product/004-habits-and-daily-practice.md), [013 — Choices guided journey](../../../product/013-choices-guided-journey.md) (Lesson 1's game, whose look, skill boxes and replay model these reuse) and the [habits research](../../../research/habits/README.md).

## Run it

`npm run dev:prototype`, then open `/prototype/lesson2/index.html` on the prototype port. Each direction has a header link to the other two, **Start again**, and **Deutsch** (`?lang=de`), which swaps in German words for the layout check.

## What all three share

- **The same fourteen days** (`model.js`): soccer practice on Tuesdays and Thursdays and a Saturday match, set by the coach; rain cancels the first Thursday; a tag game, a birthday party and cousins for dinner tempt the reader; a string breaks (or the book is left at school) on the second Wednesday; a lucky passing trick on the second Thursday; Friday of week one is tiring.
- **A Starting track per home routine**, from *takes a push* to *feels normal*, separate from Lesson 1's skill bars. It depends on counts alone, never on runs of days: each time at the planned moment moves it clearly, another time moves it a little, the first two misses cost nothing, later misses slip it back a little but never below the stage already reached. Rest, bad luck and days when the moment never came leave it where it was. Its pace is an illustration, not a measured rate.
- **Weekends:** the weekday moment doesn't happen; the reader picks another time or rests, and rest is not a miss.
- **A missed day:** the result says it is just a missed day, the skills stay, and the next card names the next chance ("Next chance: today, after dinner").
- **The week-one check** on Sunday evening, then the **end card** (starting got easier, it can take many weeks and differs for everyone, a missed day isn't starting over) and the **printable own plan** (what, a moment, one thing to get ready, what to do after a missed day; nothing is stored or sent).
- No numbers, streaks, badges or scores anywhere a reader can see. Words live in `copy.json` and `copy.de.json`.

## The three directions

**A · One routine, two backdrops.** The reader picks cello or reading, a moment and one thing to get ready, then makes one choice each afternoon while soccer runs by itself ("set up for you": a coach and a lift start it). *Trade-off:* the clearest cause and effect and the plainest contrast between "set up for you" and "up to you", but fourteen similar two-option cards, the "At your moment" option can read as the right answer, and with one routine there is no side-by-side comparison.
- Teaches best: cue and set-up (the moment either comes or doesn't, and the card says why) and the soccer contrast.
- Teaches worst: that the routine with a fixed moment gets easy first, because there is only one.

**B · Juggling the afternoon.** Every day has two spots (after school and evening; morning and afternoon at weekends) and soccer takes some of them. The reader fills the rest with cello, reading, rest or whatever is on. Nobody sets a moment: a routine's usual spot is where it has happened most, each day starts with the routines in their usual spots, and the week-one check can pin a spot. *Trade-off:* consistency is discovered rather than told, and planning visibly gets quicker as spots settle, but it is the most tapping and reading, it can turn into a placement puzzle, and the thing got ready at the start barely appears again.
- Teaches best: that keeping the same spot makes starting easier, and outside forces (soccer, rain, a party) cutting both ways.
- Teaches worst: the set-up, and the shrug of a missed day, which is one quiet line among many.

**C · Plan, then live it.** On a Sunday board the reader gives cello and reading a moment and one thing to get ready each. The days then play by themselves and stop only when something happens: the weekend, the party, the broken string, a tired Friday, the check. *Trade-off:* the fewest decisions, and quiet days show the point directly (when the moment comes, you don't decide again), but the reader watches more than acts, and every event card asks about both routines.
- Teaches best: planning, the week-one check and the "you didn't have to decide all over again" idea.
- Teaches worst: the feel of choosing each day; a gain on a quiet day can feel unearned.

## Recommendation

**C**, with two changes taken from the others. It is the only direction whose structure enacts the lesson: planned days happen without a decision, and the reader acts only when the plan meets the week. That also answers "fourteen cards drag" without cutting days, and the Sunday check fits a board the reader already built. A and B each teach one mechanic more vividly, and C can borrow both: let the reader start with one routine or two (A's focus halves the text on event cards), and show the "usual spot" badge from B on the board after week one. B is the weakest fit for a first-time ten-year-old: the most reading, and the risk of solving a puzzle instead of noticing that starting got easier.

## Checks

| Check | Result |
| --- | --- |
| Full journey (plan, 14 days with a weekend, a bad-luck day and a deliberate miss, the check, end card, own plan) | All three, headless, with no console errors at 1440×900, 1024×768, 768×1024, 744×1133 and 2560×1440; German at 744×1133 |
| Play time, estimated from the visible words (prose at 180 words a minute, labels at 300, one second a tap) | A 4.9 min, B 5.6 min, C 5.2 min for a ten-year-old reading every word; A 3.6, B 4.1, C 3.8 min at an adult's skimming pace (250 and 400 words a minute, 0.7 s a tap). Visible words: A 612 prose + 348 labels, B 634 + 496, C 659 + 354 |
| Worst frame at 4× CPU throttle, headless Chromium, 1440×900, whole play-through after the plan | 16.8 ms in all three (A 1,931 frames, B 1,372, C 821); no long animation frames. A day card's script takes 8 ms at 4× |
| Keyboard only (Tab and Enter) | All three complete; Tab presses for the whole game: A 31, B 121, C 31 |
| Screen reader | Each day's result is announced in a polite live region: 15 announcements a game (14 days and the end) |
| Reduced motion | No element keeps a transition or animation; the feed jumps instead of scrolling |
| Visible numbers | None in the feed or panel during full keyboard runs |
| Risky behaviours (script against `model.js`) | One more miss moves Starting by 0.035 of the track at most, never on the first or second miss, and never changes the stage word; rest, bad luck and a moment that never came set it back 0 times in 42,000 random days; the same days in shuffled order end at the same level in 2,000 of 2,000 trials, so nothing counts runs of days |
| `npm test`, `npm run build` | Pass; nothing under `src/` changed |

## Defaults taken without the owner

- Soccer is on Tuesday, Thursday and Saturday; the first Thursday is rained off, so a bad-luck day frees an afternoon as well as taking one.
- Moments: after the snack, after dinner, before bed. Set-ups: cello out of its case or music on the stand; the book on the pillow or on the kitchen table.
- After two free misses, later misses slip Starting a little but never below a stage already reached. Two weeks can't show a long break, which [015](../../../product/015-lesson-two-proposal.md) notes weakens Starting gradually.
- Moving the moment at the check keeps Starting where it is; a new moment begins with the same counts.
- B's usual spot is the most-used one (ties go to the earlier spot); weekend spots never count against it.
- The reader can't change a day once lived.

## Simplified or left out

- Lesson 1's energy meter: tiredness is a property of a day (Friday, an evening after soccer) that makes practice build less.
- No per-day illustration: Maya's person art appears on the plan cards, with the chosen set-up beside her.
- The German file covers every prototype key for the layout check; it is a quick translation, not reviewed copy.

## Known issues

- Play time is over the 3–4 minute target for a child reading every word in all three. The next cuts: group quiet days into one card per stretch (C), shorten the day results, and let the reader play one routine.
- At 1024×768 the two-routine panel scrolls (the skill boxes sit below the fold), and the calendar's two-icon tiles get small.
- In B a full keyboard run takes 121 Tab presses, because each spot lists four choices before **Live this day**.
- C's plan card needs a scroll at 744×1133 to reach **Start the week**.

## Shots

Each direction at 1440×900 and 744×1133 (iPad mini portrait). Captured headless after a scripted play-through.

| Moment | A | B | C |
| --- | --- | --- | --- |
| Plan | [1440](a-1-plan-1440-v01.png) · [744](a-1-plan-744-v01.png) | [1440](b-1-plan-1440-v01.png) · [744](b-1-plan-744-v01.png) | [1440](c-1-plan-1440-v01.png) · [744](c-1-plan-744-v01.png) |
| A normal day | [1440](a-2-normal-day-1440-v01.png) · [744](a-2-normal-day-744-v01.png) | [arranging](b-2a-arrange-1440-v01.png) · [lived](b-2-normal-day-1440-v01.png) · [744](b-2-normal-day-744-v01.png) · [744 arranging](b-2a-arrange-744-v01.png) | [1440](c-2-normal-day-1440-v01.png) · [744](c-2-normal-day-744-v01.png) |
| The missed day | [1440](a-3-missed-day-1440-v01.png) · [744](a-3-missed-day-744-v01.png) | [1440](b-3-missed-day-1440-v01.png) · [744](b-3-missed-day-744-v01.png) | [1440](c-3-missed-day-1440-v01.png) · [744](c-3-missed-day-744-v01.png) |
| The card after it | [1440](a-4-after-missed-1440-v01.png) · [744](a-4-after-missed-744-v01.png) | [1440](b-4-after-missed-1440-v01.png) · [744](b-4-after-missed-744-v01.png) | [1440](c-4-after-missed-1440-v01.png) · [744](c-4-after-missed-744-v01.png) |
| Week-one check | [1440](a-5-check-1440-v01.png) · [744](a-5-check-744-v01.png) | [1440](b-5-check-1440-v01.png) · [744](b-5-check-744-v01.png) | [1440](c-5-check-1440-v01.png) · [744](c-5-check-744-v01.png) |
| End card | [1440](a-6-end-1440-v01.png) · [744](a-6-end-744-v01.png) | [1440](b-6-end-1440-v01.png) · [744](b-6-end-744-v01.png) | [1440](c-6-end-1440-v01.png) · [744](c-6-end-744-v01.png) |
| Own plan | [1440](a-7-own-plan-1440-v01.png) · [744](a-7-own-plan-744-v01.png) | [1440](b-7-own-plan-1440-v01.png) · [744](b-7-own-plan-744-v01.png) | [1440](c-7-own-plan-1440-v01.png) · [744](c-7-own-plan-744-v01.png) |
| Bad luck, weekend | [luck](a-3b-bad-luck-1440-v01.png) · [weekend](a-3c-weekend-1440-v01.png) | [luck](b-3b-bad-luck-1440-v01.png) · [weekend](b-3c-weekend-1440-v01.png) | [luck](c-3b-bad-luck-1440-v01.png) · [weekend](c-3c-weekend-1440-v01.png) |
| German, 744 | [plan](a-1-plan-744-de-v01.png) · [day](a-2-normal-day-744-de-v01.png) · [check](a-5-check-744-de-v01.png) | [plan](b-1-plan-744-de-v01.png) · [day](b-2-normal-day-744-de-v01.png) · [check](b-5-check-744-de-v01.png) | [plan](c-1-plan-744-de-v01.png) · [day](c-2-normal-day-744-de-v01.png) · [check](c-5-check-744-de-v01.png) |

The round's front page: [1440](index-1440-v01.png) · [744, German](index-744-de-v01.png).

## Source files

- Pages: [`prototype/lesson2/index.html`](../../../../prototype/lesson2/index.html), [`a.html`](../../../../prototype/lesson2/a.html), [`b.html`](../../../../prototype/lesson2/b.html), [`c.html`](../../../../prototype/lesson2/c.html); start-up and catalogs: [`boot.js`](../../../../prototype/lesson2/boot.js), [`index-page.js`](../../../../prototype/lesson2/index-page.js).
- Shared: [`model.js`](../../../../prototype/lesson2/model.js) (days, moments, the Starting track, skills, replay), [`story.js`](../../../../prototype/lesson2/story.js) (each day's options and result lines), [`ui.js`](../../../../prototype/lesson2/ui.js) (frame, cards, panel, end card, own plan), [`icons.js`](../../../../prototype/lesson2/icons.js), [`lesson2.css`](../../../../prototype/lesson2/lesson2.css).
- Directions: [`direction-a.js`](../../../../prototype/lesson2/direction-a.js), [`direction-b.js`](../../../../prototype/lesson2/direction-b.js), [`direction-c.js`](../../../../prototype/lesson2/direction-c.js).
- Words: [`copy.json`](../../../../prototype/lesson2/copy.json), [`copy.de.json`](../../../../prototype/lesson2/copy.de.json).
- Reused from Lesson 1 unchanged: `src/lessons/choices/journey-game.js` (skill growth), `journey-skills.js` (skill boxes), `journey-icons.js` (icons and Maya's person art), `journey.css` (tokens and components), `src/i18n/runtime.js` and the site catalogs.
