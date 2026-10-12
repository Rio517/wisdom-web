# Round 6 audit: do the lives make sense, step by step?

Created: 2026-10-11. Status: final for round 6. Part of [v13 — Lesson 1 opening](README.md), round 6.

An independent reader (a fresh model that wrote none of the lives) read every life whole, as plain text, against nine criteria, and returned a table per life: the step, the criterion it fails and a fix. The lead applied the fixes (or sent them to a writer), turned the mechanical ones into checker or engine rules, and had the same reader read the lives again. Five passes.

## What was read

- **The ten written lives**, each step with its kind, its run marks, its map label and the alternatives the reader may pick there.
- **40 grown lives**: four per written life, from four different forks spread over the life (early to late), one alternative at each, seeded `audit-<person>-<n>`. Five of the ten people are she-lives (Amara, Ana, Lena, Nora, Zoe). Each pass grew the same forks and seeds again from the store as it then stood, so a fixed store gives new grown lives: later passes read fresh lives, not only the ones that failed.

The text was made by the engine's own `lifeText` and `writtenLife` (`npm run lives:check -- --samples` prints the same form).

## The criteria

1. Cause before effect. 2. No leaps (a bridge step, or written as a fresh start). 3. Choices are actions, never verdicts. 4. Plausible ages. 5. Each alternative is a real option at that moment (written lives). 6. Each line reads on its own; two lines in a row don't repeat a word or an idea. 7. No event happens twice. 8. The run is a run. 9. After a what-if, the next two steps build on the new choice.

From pass 1 the lead added four checks for grown lives: **9s** (strict: the next two steps build on the pick whenever anything could), **2g** (generic work steps with no job before them), **1h** (help or luck with no need) and **10** (a field the life built for years vanishes right after its run). "Dark" and "respect" were checked throughout.

From pass 4 a grown life counts as failing only for a **real stop**: something a parent or an editor would stop on. Thinner stories that no reader would stop on are counted as editor's notes.

## Counts

| | Pass 1 | Pass 2 | Pass 3 | Pass 4 | Pass 5 |
| --- | --- | --- | --- | --- | --- |
| Written lives failing | 8 | 5 | 0 | 0 | **0** |
| Written items | 19 | 11 | 1 (polish) | 1 (polish) | 1 (polish) |
| Grown lives failing (real stops) | — | — | 5 | 6 | **1** |
| Grown lives with any item | 39 | 30 | 14 | 31 | 29 |
| Grown items | 100 | 48 | 23 | 40 | 35 (1 real stop, 34 notes) |

Problems per criterion, pass 1 and pass 5 (pass 5 in brackets: real stops):

| Criterion | Written, pass 1 → 5 | Grown, pass 1 → 5 |
| --- | --- | --- |
| 1 cause before effect | 1 → 0 | 22 → 5 (1) |
| 1h help or luck with no need | 0 → 0 | 1 → 0 |
| 2 leaps | 2 → 0 | 6 → 7 (0) |
| 2g generic work steps | 0 → 0 | 11 → 2 |
| 3 choices are actions | 2 → 0 | 0 → 0 |
| 4 plausible ages | 0 → 0 | 0 → 0 |
| 5 real alternatives | 7 → 0 | — |
| 6 lines read alone, no repeats | 5 → 0 | 4 → 0 |
| 7 no event twice | 0 → 0 | 2 → 1 (0) |
| 8 the run is a run | 1 → 0 | 3 → 0 |
| 9s next two steps build on the pick | — | 24 → 6 (0) |
| 10 main thread after the run | — | 17 → 7 (0) |
| dark, respect | 0 → 0 | 0 → 0 |
| vague | 1 → 1 (polish) | 10 → 7 (0) |

The lead's 40-life samples before the engine fixes (pass 1's grown lives) and after them (pass 2) are the rows above: grown items fell from 100 to 48 and lives failing criterion 9s from 24 to 10 in one round of engine rules.

## Fixed

**Written lives** (all 19 items): real alternatives at every fork (Lena's subject choices are subjects; no bare "Starts working" anywhere; Nora's, Theo's and Amara's alternatives name something); Leo's dancing has a bridge before the dance company at 18; Kai's outdoor teaching is a fresh start; Omar's business fails for a reason ("The big orders stop…"); no choice tells its outcome (Leo at 33, Sam's tour: "He goes on a world tour."); no line points back to the one before or repeats its words; Nora's run ends on its own try ("She plays a whole game for the squad…"); Sam's label signs the band and drops the band.

**Mechanical problems, now rules** (so they can't come back in any life):

| Problem | Rule |
| --- | --- |
| The steps after a pick wander off (9s) | Engine: the next two steps build on the pick (or on a step that did) whenever a plain step can; one through a narrow name weighs ×3; a lucky break or a setback is never forced; the step right after the pick comes 1–3 years later when one follows it, so a follow-up with `within` can come. |
| A field vanishes after its run (10) | Engine: the step after a grown run builds on the run whenever one can. |
| A pick inside a run leaves it with no outcome (8) | Engine: a pick that is a middle step of another run carries that run on to its outcome. Checker: an alternative at a run's middle step must be such a step (error). |
| A run's first step taken alone, a loose one-off | `inRun: true` on nodes written only for runs; the engine never takes them alone. Checker: an `inRun` node must be a run's step, and a written life may use it only inside a run. |
| Help with no need (1h) | `helpfulNeighbour` and similar answers have `after: [setback]` with `within`. |
| Generic work steps (2g) | `workMove` tag: leading a team, a big project, a second job, changing careers and the like need a recent job and come at most once a life. |
| An old interest wakes up decades later (2) | Engine: an `after` match only through an area untouched for 10 years weighs a tenth (was 12 years and a quarter). Many setbacks and first steps now need a recent match (`within`). |
| Seven-year jumps at the end of a life | Engine: a grown step comes at most 6 years after the one before. |
| Two lines in a row repeat a word (6) | Checker: a warning for written lives (a short list of small words may repeat). |
| A choice that judges itself (3) | Checker: an error for a choice with a negative `move`; a warning for verdict words (`VERDICT_WORDS`). |
| Drinking or drugs too vague or too dark | Checker: a named drug is an error; a `substance` setback needs its own cause and a help node with `within` 1–2; a written life must reach help within 2 years. |
| Parent at 21 (4) | `becomesParent` is ages 22 to 44. |
| Land, a shop or a qualification twice (7) | `unless` on each, so it happens once. |

**Node-level fixes** (about 60 nodes), for example: a cake contest only after a baking contest (its own tag, not any `contest`); an ankle or knee injury only after recent dancing or sport; a scout only for a current team player; the art school says no only after an application; teaching music at a school only after teaching or studying music; leaving the lab drops it (no team discovery after); a book seller never has "a big customer"; picks that nothing built on (time with grandparents, singing, school lunches, exams, dens, a smaller business, delivery work, reporting for a paper) have plain follow-ups.

## Left, with the reason

- **G-leo-2 (pass 5's one real stop, borderline):** an online book seller met "A big customer never pays the bill." Fixed after pass 5 (`customerNeverPays` follows an owner only; "asks customers to pay first"); not read again, so it is counted as left here.
- **Lena at 8, "She joins a club to solve problems together"** (written, polish): the map label says "Joins the maths club" beside it; the line avoids repeating "maths" from the next line.
- **34 editor's notes on grown lives**, none a real stop: thinner stretches where a pick has a plain follow-up only some of the time (a drama club, a smaller shop, an art-school place), filler steps late in a life ("helps someone new at work find their feet", now weight 0.15), and unnamed jobs in three general nodes (`oldFriendJob`, `changesCareers`, `takesJobNearFamily`). Each would need more nodes rather than a rule; they are the next writing round's list.

## Sources

The audit's working files (each pass's input text and tables) were kept outside the repository; this page is the record. The engine rules are in `src/lessons/choices/lives/engine.js` (moved from `prototype/lesson1-opening/lives/` in the integration round) (`GROW`, `grow`, `runAfter`, `check`), described in [the store's README](../../../../src/lessons/choices/lives/README.md).
