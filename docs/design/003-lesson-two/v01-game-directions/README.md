# 003 · v01 — Game directions

Created: 2026-10-09. Updated: 2026-10-09. Status: A, B and C had a second pass after a fresh-context review of the first (it ranked C, then A, then B). The owner then found all three too complicated and too wordy; D (below) is the direction now being prototyped. These are studies under `prototype/`, not the website.

## The question

Lesson 2's game runs two weeks of a ten-year-old's afternoons with soccer, cello and reading for fun (a story the reader chose). Which way of playing it best leaves the reader feeling that starting got easier once a routine had a time and a place, and that a missed day was just a missed day?

Related: [015 — Lesson 2 proposal](../../../product/015-lesson-two-proposal.md) (the owner chose structure C, the three routines and two weeks; its table lists the mechanics and their evidence), [004 — Habits and the choices we repeat](../../../product/004-habits-and-daily-practice.md), [013 — Choices guided journey](../../../product/013-choices-guided-journey.md) (Lesson 1's game, whose look, skill boxes and replay model these reuse) and the [habits research](../../../research/habits/README.md).

## Run it

`npm run dev:prototype`, then open `/prototype/lesson2/index.html` on the prototype port. Each direction has a header link to the others, **Start again**, and **Deutsch** (`?lang=de`), which swaps in German words for the layout check.

## D · Three things, two weeks

**Why.** The owner found A, B and C too complicated and too wordy for a ten-year-old. He asked for Lesson 1's game back (three picture choices a day, skills visibly growing on the right) and for "starting gets easier" to stay, but simply. Where fewer words and completeness pulled apart, fewer words won.

**What changed** (`d.html`):
- A pick screen of nine picture cards replaces the plan board: an instrument, a quiet thing and a sport (cello, reading and soccer are pre-selected). The panel rebuilds as the reader taps.
- Fourteen days in Lesson 1's feed, day rail and look. Each day is one short situation and three picture options; the two home options carry a small time caption (*after snack*, *before bed*) and there is no time to choose.
- The instrument's and the quiet thing's boxes each gain one row, **Starting**: a dotted footpath that wears in solid each time the reader does that activity, more at its usual time. The sport box has no path. A chip says *started* or *easier*, like Lesson 1's *grew*.
- Gone from A–C: times to choose and things to get ready, the week-one check, the Starting track cards and their stage words, result sentences, the coach, auto-played days. Rest, bad luck and other choices move nothing; a missed day is a path that simply doesn't move.
- The end card: *Starting got easier.*, *A missed day was just a missed day.*, *Real life takes longer. It's different for everyone.*, the two paths, **Make your own plan** (the own-plan card) and **Play again** (Lesson 1's replay with ghost bars).

**The two looks**, switched by **Glow | Lines** at the top right:
- *Lines*: a tap draws a line from the chosen option to its box; the box icon pops as it lands, then the bars and the path grow and the chips show. Starting is the path.
- *Glow*: the box that changed lights up with a soft ring and tint, with no line. Starting is the activity's icon going from grey to full colour over a soft disc, with no Starting row.
- The cross pairs exist only as URLs: `d.html?look=lines&starting=light`, `?look=glow&starting=path`.

**Model** (`model-d.js`). It counts, so order never matters: Starting = min(1, 0.07 × (2 × starts at the usual time + other starts)); skills follow Lesson 1's curve with steps of 0.12 and 0.10 for an activity's two skills, ×1.6 on the lucky day. `tests/lesson2-d-model.test.js` shuffles the days 2,000 times (all end equal) and plays 42,000 random days (rest, bad luck and other choices move Starting zero times; nothing ever goes down).

**Numbers.**
- Words a child sees, counted by script over the page after a full play with the default picks: 265 on screen plus 4 that come and go (*Start*, the chips) ≈ **269**. Prose 95, labels 170; the longest situation is 7 words, the longest label 4. German ≈ 285.
- Play time ≈ **1.8 minutes**: prose at 180 words a minute, labels at 300, 15 taps at a second each, the measured settle after each tap (about 15 s in all) and 10 s on the pick screen. A slow reader (120 and 200 words a minute) ≈ 2.3 minutes. With reduced motion the days themselves take 12.6 s.
- Worst frame at 4× CPU throttle, 1440×900, a full play: 16.8 ms in both looks, none over 33 ms, no long animation frames.

**Checks.** Twelve scripted headless play-throughs (1440×900, 1024×768 and 744×1133; keyboard and mouse; both looks; with and without reduced motion; the default picks and gymnastics, piano and drawing) each pick, play 14 days and reach *Make your own plan* with focus on its heading: no problems, no console errors, no digits on screen, no panel or page scroll, 34 Tab presses for the whole game, no animations under reduced motion.

**Simplified beyond the spec.**
- Starting is a row under the box title, lined up with the bars, rather than a header path leading into the icon; it keeps three boxes inside the panel at 1024×768.
- No coach anywhere: the cancelled Thursday reads *Soccer is cancelled today.*; the lucky one *A new trick at soccer today.*
- Pick rows run instrument, quiet thing, sport, matching the panel.
- Situations no longer repeat the weekday the card already shows.
- An activity's two skills grow at slightly different steps so the bars don't move as one.
- No soup icon: the sick day's options are *Sleep*, *A film* and *Read*.

**Known issues.**
- The round's index heading and text still describe A–C ("Three ways…", "same model underneath").
- The quiet thing's sage bars are low in contrast on white, and the Light signal is faint at its first steps.
- At 1440×900 the panel has empty space below the three boxes.
- Chips sit over the right end of the bar or path while they show.
- The bars' screen-reader values still use Lesson 1's level words.
- No fresh-context design review yet.

**After the owner's notes on the pick screen.** Nothing is pre-selected: the panel shows three empty dashed cards, and the days appear once each row has a pick. The heading reads *Pick three things you want to get better at.* with *One from each row.* under it; another card in a row swaps the pick. **Start** sits at the card's right edge, faded until every row has a pick, with a white **Random** button to its left that picks one per row (never the current one) and can still be changed. Panel cards no longer pop their icon when they change: the card grows a little (scale 1.04, 420 ms) and settles, with no rotation and no motion under reduced motion. The twelve play-throughs were run again (keyboard and mouse, Random and tapped picks, a row swap, the faded Start ignored): no problems or console errors. Work on D stopped here.

**Shots** (headless, after a scripted play):

| Moment | 1440×900 | 744×1133 |
| --- | --- | --- |
| Pick screen | [1440](d-1-pick-1440-v01.png) | [744](d-1-pick-744-v01.png) · [German](d-1-pick-744-de-v01.png) |
| Pick screen after the owner's notes (v02) | [1440](d-1-pick-1440-v02.png) | [744](d-1-pick-744-v02.png) · [German](d-1-pick-744-de-v02.png) |
| A day just after a tap, Lines (the line landing) | [1440](d-2-day-lines-1440-v01.png) | [744](d-2-day-lines-744-v01.png) |
| The same moment, Glow | [1440](d-2-day-glow-1440-v01.png) | [744](d-2-day-glow-744-v01.png) · [German, Lines](d-2-day-744-de-v01.png) |
| The party chosen: nothing grows, nothing drops | [1440](d-3-party-1440-v01.png) | [744](d-3-party-744-v01.png) |
| The sick day, reading anyway | [1440](d-4-sick-1440-v01.png) | [744](d-4-sick-744-v01.png) |
| End card | [1440](d-5-end-1440-v01.png) | [744](d-5-end-744-v01.png) |
| Three boxes fit, no panel scroll | [1024×768](d-6-fit-1024-v01.png) | |

**Files:** [`d.html`](../../../../prototype/lesson2/d.html), [`direction-d.js`](../../../../prototype/lesson2/direction-d.js), [`direction-d.css`](../../../../prototype/lesson2/direction-d.css), [`model-d.js`](../../../../prototype/lesson2/model-d.js), [`icons-d.js`](../../../../prototype/lesson2/icons-d.js), the `l2.d.*` keys in `copy.json` and `copy.de.json`, and [`tests/lesson2-d-model.test.js`](../../../../tests/lesson2-d-model.test.js). From Lesson 1, unchanged: `journey-play.css`, `journey-skills.js` (skill boxes) and `journey-motion.js`; `direction-d.js` adapts `journey-play.js`'s feed, rail and focus handling.

The sections below describe A, B and C.

## What all three share

- **The same fourteen days** (`model.js`): soccer practice on Tuesdays and Thursdays and a Saturday match, set by the coach; rain cancels the first Thursday; a tag game, a birthday party and cousins for dinner tempt the reader; a string breaks (or the book is left at school) on the second Wednesday; a lucky passing trick on the second Thursday; Friday of week one is tiring.
- **A Starting track per home routine**, from *takes a push* to *feels normal*, separate from Lesson 1's skill bars. It depends on counts alone, never on runs of days: each time at the planned moment moves it clearly, another time moves it a little, the first two misses cost nothing, later misses slip it back a little but never below the stage already reached. Rest, bad luck and days when the moment never came leave it where it was. A moment moved at the week-one check is new: its first two starts move the track only a little, like another time. Its pace is an illustration, not a measured rate.
- **A Starting chip on each result** says the move in words: *A first start*, *Easier today*, *A tiny bit easier*, *Stayed where it was*, *Slipped back a little*. Result sentences don't repeat it.
- **Weekends:** the weekday moment doesn't happen; the reader does it after breakfast or rests, and rest is not a miss.
- **A missed day:** the result says it is just a missed day and the skills stay, and the next card names the next chance ("Next chance: today, after dinner").
- **The week-one check** on Sunday evening, then the **end card** (starting got easier, it can take many weeks and differs for everyone, a missed day isn't starting over) and the **printable own plan** (what, a moment, one thing to get ready, what to do after a missed day; nothing is stored or sent).
- No numbers, streaks, badges or scores anywhere a reader can see. Options carry no captions, so none reads as the answer. Words live in `copy.json` and `copy.de.json`.

## The three directions

**A · One routine, two backdrops.** The reader picks cello or reading, a moment and one thing to get ready, then makes one choice each afternoon while soccer runs by itself ("set up for you": a coach and a lift start it). A day whose moment can't come (the snack is eaten in the car on a soccer day) plays by itself. *Trade-off:* the clearest cause and effect and the plainest contrast between "set up for you" and "up to you", but a dozen similar two-option cards, and with one routine there is no side-by-side comparison.
- Teaches best: cue and set-up (the moment either comes or doesn't, and the card says why) and the soccer contrast.
- Teaches worst: that the routine with a fixed moment gets easy first, because there is only one.

**B · Juggling the afternoon.** Every day has two spots (after school and evening) and soccer takes some of them. The reader fills the rest with cello, reading, rest or whatever is on. Nobody sets a moment: a routine's usual spot is where it has happened most, and a day that starts with everything in its usual spot reads as one sentence ("Cello after school and reading in the evening.") with a **Change** button; the spots open only on demand. The weekend is one card with two ways to spend it, and the week-one check can pin a spot. *Trade-off:* consistency is discovered rather than told, and planning visibly gets quicker as spots settle, but it is still the most reading, and the thing got ready at the start barely appears again.
- Teaches best: that keeping the same spot makes starting easier, and outside forces (soccer, rain, a party that takes the after-school spot) cutting both ways.
- Teaches worst: the set-up, and the shrug of a missed day, which is one quiet line among many.

**C · Plan, then live it.** On a Sunday board the reader picks one thing to start (cello or a story), its moment and one thing to get ready; **Add reading too** (or cello) brings in the other. The days then play by themselves, one card per quiet stretch ("Monday to Thursday · Cello after dinner. Easier each day."), and stop only when something happens: the weekend, the party, the broken string, a tired Friday, the check. After an answer the days play on by themselves; **Pause** stops them. The second weekend repeats the first weekend's answer unless the reader presses **Change**. *Trade-off:* the fewest decisions, and quiet stretches show the point directly (when the moment comes, you don't decide again), but the reader watches more than acts.
- Teaches best: planning, the week-one check and the "you didn't have to decide all over again" idea.
- Teaches worst: the feel of choosing each day; a gain on a quiet stretch can feel unearned.
## Recommendation

**C**, and the fresh-context review agreed (C, then A, then B). It is the only direction whose structure enacts the lesson: planned days happen without a decision, and the reader acts only when the plan meets the week. That also answers "fourteen cards drag" without cutting days, and the Sunday check fits a board the reader already built. The second pass took A's focus into it (one routine by default); B's "usual spot" badge on the board after week one is still an option. B is the weakest fit for a first-time ten-year-old: the most reading, and the risk of solving a puzzle instead of noticing that starting got easier.

## Second pass

A fresh-context review played all three at 1440×900 and 744×1133. It found the lesson lands in A and C and partly in B, no streak state and no numbers, and the end card the best writing. This pass fixes what it raised and cuts play time.

**Fixed**
- *Portrait tablet:* the feed's 70vh bottom padding made it taller than its stage, which clipped it, so on C's two-row Wednesday **Keep going** sat 59 px below the screen at 744×1133. A spacer after the cards now does that job inside the feed. Every card's last button scrolls fully into view at 744×1133 and 768×1024 in all three (scripted check, below).
- *Options:* "At your moment" marked one option, so it read as the right answer. No option has a caption now (the labels say what each afternoon is), and "Watch videos" lost its "instead".
- *A moved moment* got the full step on its first day while the copy said a new moment can take a few tries. In A and C its first two starts now count like another time ("Your new moment still takes a push."); the check keeps "Starting stays where it is. A new moment can take a few tries."
- *The very first start* said "Easier today." It now says "A first start."
- *C's quiet days* went by every 1.5 s. A quiet stretch is now one card, and any card that plays by itself stays about a third of a second a word (at least 3 s), with **Pause** and **Next day** above.
- *C's check* named only the day ("On Tuesday, it didn't come at all."). It now names the cause from the real days: "On Tuesday, soccer ran into it."
- *B's party day* had no bite. The party now takes the after-school spot, so the day opens as "The party after school and reading in the evening." and cello is missed unless the reader changes it.
- *Own-plan examples* used #8a968f (2.96:1); they now use the `quiet` token.
- *Also:* the option hover lift flickered every frame under reduced motion when the pointer sat on an option's edge, so options no longer lift; weekend results say "after breakfast" rather than "later"; the week shows only on the day it starts ("Monday · Second week"); a day at another time said "Still a push." under a chip saying "A tiny bit easier." and now says "Your moment helps more."

**Cut for time** (the target is 3–4 minutes for a ten-year-old reading every word)
- *A:* result sentences no longer repeat the chip ("…and so does Starting" is gone); lines are ten words or fewer; the days the moment can't come play by themselves; the soccer line speaks on the first practice, then the calendar tile says it.
- *B:* ready-made days as one sentence with **Change**, and **Live this day** takes the focus; the weekend as one card; shorter soccer and missed-day lines ("Soccer took cello's spot. Nothing lost."); matching chips merge.
- *C:* one card per quiet stretch; one routine by default; no "What do you do today?" line; twin chips merge into one; the second weekend repeats the first; and, beyond the review's list, no **Keep going** after an answer: the days play on after time to read the result (this took the last 0.16 min).

## Checks

Second pass first, the first pass after the arrow where it changed. The measured runs follow one scripted path per direction (C with one routine unless it says otherwise).

| Check | Result |
| --- | --- |
| Full journey (plan, 14 days with a weekend, a bad-luck day and a deliberate miss, the check, end card, own plan) | All three, headless, with no console errors at 1440×900, 768×1024 and 744×1133; German at 744×1133; C also with both routines |
| Every card's last button reachable (scrolled into view, inside the feed, the stage and the screen) | All cards in all three at 744×1133 and 768×1024, C with one routine and with both: 0 failures (A 15 cards, B 14, C 10) |
| Play time, estimated from the visible words (prose at 180 words a minute, labels at 300, one second a tap) | A 3.9 min ← 4.9, B 4.1 ← 5.6, C 3.3 ← 5.2 (C with both routines: 4.0) for a ten-year-old reading every word. Visible words, prose + labels, and taps: A 478 + 265, 19 taps ← 612 + 348, 20 taps; B 534 + 245, 20 ← 634 + 496, 26; C 440 + 194, 12 (with both routines 531 + 250, 15) ← 659 + 354, 24 |
| Worst frame at 4× CPU throttle, headless Chromium, 1440×900, whole play-through after the plan | 16.8 ms in all three, as before (A 2,234 frames, B 1,226, C 5,226, C with both routines 7,188); none over 33 ms and no long animation frames |
| Keyboard only (Tab and Enter) | All three complete; Tab presses for the whole game: A 31 ← 31, B 35 ← 121, C 24 ← 31 (C now with one routine) |
| Screen reader | Each day or stretch is announced in a polite live region: A 15, B 13, C 13 announcements a game ← 15 each (B's weekend and C's quiet stretches are now one card) |
| Reduced motion | No element keeps a transition or animation; the feed jumps instead of scrolling; options no longer lift on hover (A rerun at reduced motion this pass) |
| Visible numbers | None in the feed or panel during full keyboard runs |
| Risky behaviours (script against `model.js`) | One more miss moves Starting by 0.035 of the track at most, never on the first or second miss, and never changes the stage word; rest, bad luck and a moment that never came set it back 0 times in 42,000 random days; the same days in shuffled order end at the same level in 2,000 of 2,000 trials, so nothing counts runs of days |
| `npm test`, `npm run build` | Pass (240 tests); nothing under `src/` changed |

## Defaults taken without the owner

- Soccer is on Tuesday, Thursday and Saturday; the first Thursday is rained off, so a bad-luck day frees an afternoon as well as taking one.
- Moments: after the snack, after dinner, before bed. Set-ups: cello out of its case or music on the stand; the book on the pillow or on the kitchen table.
- After two free misses, later misses slip Starting a little but never below a stage already reached. Two weeks can't show a long break, which [015](../../../product/015-lesson-two-proposal.md) notes weakens Starting gradually.
- Moving the moment at the check keeps Starting where it is; the new moment's first two starts count like another time.
- B's usual spot is the most-used one (ties go to the earlier spot); weekend spots never count against it. B's weekend card: "Both, where there's room" puts cello in Saturday morning (the match has the afternoon) and both on Sunday; "A weekend off" rests both.
- C starts with cello picked, like A. With one routine, the bad-luck day hits whichever routine is in the plan (the string, or the book left at school).
- Options got no captions rather than captions on every option: the review allowed either, and captions cost about 14 s of reading in A.
- A card that plays by itself stays about 330 ms a visible word, at least 3 s, rather than a flat 3 s; a single quiet card of 15 words stays 5 s, which is the review's own estimate for a ten-year-old.
- The reader can't change a day once lived (C's repeated weekend can be changed while it shows).

## Simplified or left out

- Lesson 1's energy meter: tiredness is a property of a day (Friday, an evening after soccer) that makes practice build less.
- No per-day illustration: Maya's person art appears on the plan cards, with the chosen set-up beside her.
- The German file covers every prototype key for the layout check; it is a quick translation, not reviewed copy.
- B stays above 4 minutes (4.1): two routines and two spots a day leave two result lines on most days. Dropping the result line for a routine that kept its usual spot would get it under, at the cost of saying why it got easier; not done.

## Known issues

- At 1024×768 the two-routine panel scrolls (the skill boxes sit below the fold), and the calendar's two-icon tiles get small.
- C's plan card needs a scroll at 744×1133 to reach **Start the week** when both routines are on the board.
- The panel's last line reads "Stayed where it was." on the end card, because the end shows no day's move.

## Later (from the review, not done in this pass)

- Show "usual" only from a routine's second use in a spot (B).
- "A tiny bit easier." near the top of the panel reads like the tired penalty.
- Raw hex values and forest alphas in `lesson2.css` to tokens.
- The panel scroll at 1024×768.

## Shots

Second pass, each direction at 1440×900 and 744×1133 (iPad mini portrait), captured headless after a scripted play-through. C is shown with one routine.

| Moment | A | B | C |
| --- | --- | --- | --- |
| Plan | [1440](a-1-plan-1440-v02.png) · [744](a-1-plan-744-v02.png) | [1440](b-1-plan-1440-v02.png) · [744](b-1-plan-744-v02.png) | [1440](c-1-plan-1440-v02.png) · [744](c-1-plan-744-v02.png) |
| A normal day (C: a quiet stretch) | [1440](a-2-normal-day-1440-v02.png) · [744](a-2-normal-day-744-v02.png) | [arranging](b-2a-arrange-1440-v02.png) · [1440](b-2-normal-day-1440-v02.png) · [744](b-2-normal-day-744-v02.png) · [744 arranging](b-2a-arrange-744-v02.png) | [1440](c-2-normal-day-1440-v02.png) · [744](c-2-normal-day-744-v02.png) |
| A day that plays itself (A) | [1440](a-2b-gone-day-1440-v02.png) · [744](a-2b-gone-day-744-v02.png) | — | — |
| The missed day (B: the party, before and after) | [1440](a-3-missed-day-1440-v02.png) · [744](a-3-missed-day-744-v02.png) | [before](b-3-party-before-1440-v02.png) · [1440](b-3-missed-day-1440-v02.png) · [744 before](b-3-party-before-744-v02.png) · [744](b-3-missed-day-744-v02.png) | [1440](c-3-missed-day-1440-v02.png) · [744](c-3-missed-day-744-v02.png) |
| The card after it | [1440](a-4-after-missed-1440-v02.png) · [744](a-4-after-missed-744-v02.png) | [1440](b-4-after-missed-1440-v02.png) · [744](b-4-after-missed-744-v02.png) | [1440](c-4-after-missed-1440-v02.png) · [744](c-4-after-missed-744-v02.png) |
| Week-one check | [1440](a-5-check-1440-v02.png) · [744](a-5-check-744-v02.png) | [1440](b-5-check-1440-v02.png) · [744](b-5-check-744-v02.png) | [1440](c-5-check-1440-v02.png) · [744](c-5-check-744-v02.png) |
| End card | [1440](a-6-end-1440-v02.png) · [744](a-6-end-744-v02.png) | [1440](b-6-end-1440-v02.png) · [744](b-6-end-744-v02.png) | [1440](c-6-end-1440-v02.png) · [744](c-6-end-744-v02.png) |
| Own plan | [1440](a-7-own-plan-1440-v02.png) · [744](a-7-own-plan-744-v02.png) | [1440](b-7-own-plan-1440-v02.png) · [744](b-7-own-plan-744-v02.png) | [1440](c-7-own-plan-1440-v02.png) · [744](c-7-own-plan-744-v02.png) |
| Bad luck, weekend (C: the repeated weekend) | [luck](a-3b-bad-luck-1440-v02.png) · [weekend](a-3c-weekend-1440-v02.png) · [weekend 744](a-3c-weekend-744-v02.png) | [luck](b-3b-bad-luck-1440-v02.png) · [weekend](b-3c-weekend-1440-v02.png) · [weekend, before](b-3c-weekend-before-1440-v02.png) · [weekend 744](b-3c-weekend-744-v02.png) | [luck](c-3b-bad-luck-1440-v02.png) · [weekend](c-3c-weekend-1440-v02.png) · [weekend 744](c-3c-weekend-744-v02.png) · [repeated](c-3d-again-1440-v02.png) · [repeated 744](c-3d-again-744-v02.png) |
| German, 744 | [plan](a-1-plan-744-de-v02.png) · [day](a-2-normal-day-744-de-v02.png) · [check](a-5-check-744-de-v02.png) | [plan](b-1-plan-744-de-v02.png) · [day](b-2-normal-day-744-de-v02.png) · [check](b-5-check-744-de-v02.png) | [plan](c-1-plan-744-de-v02.png) · [day](c-2-normal-day-744-de-v02.png) · [check](c-5-check-744-de-v02.png) |

The round's front page: [1440](index-1440-v02.png) · [744, German](index-744-de-v02.png).

### First-pass shots (v01)

The images the review judged, kept as they were.

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
- Directions: [`direction-a.js`](../../../../prototype/lesson2/direction-a.js), [`direction-b.js`](../../../../prototype/lesson2/direction-b.js), [`direction-c.js`](../../../../prototype/lesson2/direction-c.js). D has its own model, icons and styles, listed in its section.
- Words: [`copy.json`](../../../../prototype/lesson2/copy.json), [`copy.de.json`](../../../../prototype/lesson2/copy.de.json).
- Reused from Lesson 1 unchanged: `src/lessons/choices/journey-game.js` (skill growth), `journey-skills.js` (skill boxes), `journey-icons.js` (icons and Maya's person art), `journey.css` (tokens and components), `src/i18n/runtime.js` and the site catalogs.
