# 015 — Lesson 2: where Maya belongs, and a longer habits game

Status: Proposed; owner decision pending. Created: 2026-10-09. Updated: 2026-10-09.

Related: [lesson roadmap](../README.md#lesson-roadmap) · [004 — Habits](004-habits-and-daily-practice.md) · [013 — Lesson 1](013-choices-guided-journey.md) · [Lesson 1 copy](../content/choices-journey.md#skills-grow) · [habits research](../research/habits/README.md)

## The question

Maya's two paths is about practice and persistence, and the owner wants Lesson 2 to show how small good choices, such as practising and doing homework, build up.
Should Maya and a longer ten-afternoon game, which a child tester enjoyed, move from Lesson 1 into Lesson 2, *Habits and daily practice*?

## Where the lessons divide

Lesson 1 shows *that* repeated choices add up; Lesson 2 can show *how* to keep making them. Maya's beats sit on the Lesson 1 side: learning builds on learning and carries across to basketball ([learning findings](../research/learning/README.md#learning-builds-carries-across-and-can-encourage-more-learning)). The habit research is narrower: starting can get easier, which differs from doing the hard part well ([B4](../research/habits/sources.md#b4--context-and-study-habits)). The game sits in between. Neither lesson may claim a general habit of good judgment ([findings](../research/habits/README.md#repeated-choices-and-the-next-choice)).

## Three structures

Lesson 1's takeaway (choices and their effects add up, alongside circumstances and chance) is complete after the map chapter, in 2–3 minutes, under every option. The full journey runs about 15 minutes ([013](013-choices-guided-journey.md#changes-to-current-rules-that-need-owner-approval)), so the question is what the later chapters still show.

### A. Maya and a longer game anchor Lesson 2

- **Lesson 1:** map, hike, explorer, takeaways. The takeaway still lands, but only the hike's [practice beat](../content/choices-journey.md#practice-builds-on-practice) shows growth over time, and "Learning builds on learning" loses its example.
- **Lesson 2:** Maya retold to show how Path A Maya keeps starting, the two-week game, making your own plan, coming back after a break.
- **Moves:** Maya and the game. **New:** habit beats, game mechanics, a plan card.
- **Risks:** Lesson 2 drifts into "practise more, get better" instead of how routines form. The live lesson changes in four languages; its `#skills-…` and `#play-game` links break.
- **Size:** large: a Lesson 1 restructure plus all of Lesson 2.

### B. Maya stays; Lesson 2 gets its own story

- **Lesson 1:** unchanged, and so is its takeaway.
- **Lesson 2:** a new character builds one routine (reading, or starting homework), with a cue, a set-up, a missed day, a routine changed, and a new game.
- **Moves:** nothing. **New:** the story, its art and the game.
- **Risks:** two practise-and-grow stories and two afternoon games in a row feel like one lesson twice.
- **Size:** the most new art and copy; no risk to Lesson 1.

### C. A short Maya in Lesson 1, her habit story in Lesson 2

- **Lesson 1:** map, hike, Maya cut to three beats (two paths and a slow start; learning builds, basketball optional; never too late, with its real-life caveat), explorer, takeaways. The takeaway still lands, Maya still shows things adding up, and the lesson gets shorter.
- **Lesson 2:** "Remember Maya?" (one beat, so it stands alone) → wanting versus starting → her cue and set-up (ball by the door, after school) → starting gets easier; playing well still takes thought → a homework start (notebook open after a snack, a grown-up to ask) → a missed week, and coming back → changing a routine that isn't helping → the two-week game → your own plan, on paper ([004](004-habits-and-daily-practice.md#a-small-practical-experiment)) → takeaways.
- **Moves:** the game, made longer. **New:** Maya's habit beats, game mechanics, a plan card.
- **Risks:** Lesson 1 still changes in four languages, so both lessons ship together. Her habit beats must not repeat her skill beats.
- **Size:** medium. It reuses Maya's art and scene and the game's replay model (`journey-game.js`); it adds a "Starting" track, day data, a route, a text version, notes for grown-ups and four catalogs.

## A longer game: two weeks, one routine

You play soccer and are learning the cello. A coach and a lift make soccer happen; practising cello at home is up to you. Choose a moment (after a snack, after dinner) and one thing to get ready (cello out of its case), then play 14 day cards, weekends included.

| Mechanic | What the reader sees | Basis |
| --- | --- | --- |
| Cue and set-up | Choose a moment; get something ready | **Editorial**, from 004. **Evidence** in adults: consistent contexts go with stronger habits; the links are small ([B2](../research/habits/sources.md#b2--recent-context-consistency-synthesis), [B4](../research/habits/sources.md#b4--context-and-study-habits)) |
| Starting gets easier | A "Starting" track moves from *takes a push* to *feels normal*; the skill bars grow separately | **Evidence** in adults: starting differs from doing the work ([B4](../research/habits/sources.md#b4--context-and-study-habits)), and the pace varies by person ([B3](../research/habits/sources.md#b3--within-person-habit-trajectories-and-prompts)). The end card says it "can take many weeks, and it's different for everyone": adult studies found no single timetable ([B1](../research/habits/sources.md#b1--formation-time-varies)) |
| Weekends | "After school" doesn't happen on Saturday: pick another moment or rest | **Editorial**, following the context findings |
| A missed day | Skill stays, Starting dips a little at most, and the next card says "Next chance: Monday after your snack". No streaks | **Editorial.** Lapses and restarting are not yet reviewed ([open questions](../research/habits/README.md#open-questions-and-next-evidence)) |
| A bad-luck day | A broken string, visitors, practice cancelled | **Fiction**, keeping circumstances visible |
| Rest | Planned rest doesn't set Starting back; tired practice builds less | **Editorial**: Lesson 1's model is an illustration, not a real rate ([013](013-choices-guided-journey.md#evidence-and-boundaries)) |
| Check the plan | After week one: "Is your moment working?" Change it if not | **Editorial** ([004](004-habits-and-daily-practice.md#proposed-guided-explanation)) |

No numbers, streaks or "habit formed" badges. The two weeks are compressed time; the game is an illustration, not a programme.

## Recommendation

C. Maya's skill growth stays in the lesson whose takeaway it supports, and Lesson 2 keeps the character and game the child tester enjoyed while asking a new question: how does Path A Maya keep starting? C reuses the most art and code, shortens a Lesson 1 that runs well past its 2–3 minute aim, and avoids B's repetition. Its cost is a four-language edit of Lesson 1, shipped with Lesson 2. Before writing copy, research children's routines, lapses and restarting, and changing habits; until then the missed-day and change-your-plan beats stay labelled editorial.

## Decisions for the owner

1. Structure: A, B or C (recommended), with any Lesson 1 change released together with Lesson 2.
2. Does the game leave Lesson 1 entirely, or does a five-afternoon version stay?
3. The game's routine: home cello practice (recommended: nobody schedules it for you), reading, or homework.
4. Game length: two weeks or ten school days.
5. Approve the habits research pass before any copy is written.
