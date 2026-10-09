# Explorer chains — design note

Status: working note for the life-path explorer (Lesson 1, chapter 5). Created: 2026-10-09.

The owner asked for choices, opportunities and roadblocks that build on each other over a life, with big moves and big surprises showing as large movements of the path. Today every fork draws unrelated labels from an age band, so nothing builds.

## Model

Each **step** has an id, a kind, an age window and the steps that unlock it:

- `choice`: the reader picks it at a fork.
- `lucky`: a good surprise (an opportunity that opens).
- `roadblock`: a bad surprise, shown to readers as a "Setback".

A step is available when any one of its `after` steps is on the path (starters have none) and the fork's age is inside its window. **Big** steps (a scholarship, university, moving abroad, a serious illness, a discovery) are marked `big`.

At each fork:

1. **Surprise check.** If a surprise is available, it may happen instead of a fork (seeded, about one fork in three, more often when the reader's own chain has one waiting). The path then has a single way on, shown as a "Lucky break" or "Setback" chip that the reader presses to continue. Lucky breaks and roadblocks alternate when both are possible, so a life meets both.
2. **Otherwise two or three choices:** the newest unlocked chain steps first, then a chain starter or a plain example from the age band, so every fork has something that builds and something new.
3. **Closed ways** stay as they are: sometimes one option is closed by circumstances, never all of them.

Big steps travel further: their branch swings well up or down the map, and the age gap is longer. Surprises arrive quickly (a short age gap) but swing just as far when big. Small steps keep the current gentle bends.

Labels are made-up examples. Options are never ranked; a roadblock is never the reader's fault, and every roadblock is followed by real choices.

## The chains

Arrows mean "unlocks". **Bold** steps are big. (L) lucky, (R) roadblock.

1. **Maths and science.** Join the maths club (7–12) → Enter a maths tournament → (L) A teacher spots your talent → Take the science subjects → (L) **You win a scholarship** → **Study science at university** → **Start a PhD** (shown as "Do research in a lab") → (L) **Your team makes a discovery**. Branches: (R) Your supervisor is unkind → **Leave the PhD** / Ask for a new supervisor; (R) **A parent gets very ill** → **Take a year off to help at home** / Keep studying part-time. After leaving: Teach science / Work with data.
2. **Music.** Start piano (7–11) → Join the school band → (L) An older band asks you to join → Play gigs at weekends → (L) **A radio station plays your song** → **Record an album**. Branch: (R) **You hurt your hand and can't play for a year** → Write songs for others / Teach music.
3. **Sport.** Join a soccer team (6–10) → Try out for the school team → (L) **A scout watches you play** → **Join a youth academy** → **Play for a professional club**. Branch: (R) **A bad knee injury** → Train as a physiotherapist / Coach a kids' team.
4. **Caring.** Do a first-aid course (11–16) → Volunteer at a clinic → **Train as a nurse** → (L) An experienced nurse becomes your mentor → Train as a midwife. Branch: (R) **Your hospital closes** → **Move to a new city for work**.
5. **Making things.** Join the robotics club (10–15) → Enter a robot contest → (L) Your robot wins a prize → **Study engineering** / **Train as an electrician** → **Start your own business** → (L) **A big company becomes your customer** or (R) **The business runs out of money** → Try again with a new idea / Take a job and save up.
6. **Words and languages.** Read every night (6–10) → Write for the school paper → (L) A free place on an exchange trip opens up → Study languages → **Move abroad** / Work as an interpreter. Writing branch: (R) Ten publishers say no → Keep writing anyway → (L) **A publisher wants your book**.
7. **Food.** Help to bake (family, 3–7) → Run a bake sale table → Get a weekend job in a café → (L) A chef offers to train you → **Train as a chef** → **Open a small bakery**. Branch: (R) The rent doubles → Sell at markets instead.
8. **Anyone, any time** (no chain needed). Lucky: A friend invites you to a new club (child) · You meet a friend for life · An old friend offers you a job (adult). Setback: You are ill for a few months · **Your job ends suddenly** (adult).

## Where it lives

- Structure (ids, kinds, windows, unlocks, big): `src/lessons/choices/journey-choices.js`.
- Words: `explore.step.*`, `explore.kind.*` and new UI keys in all four catalogs.
- Drawing and interaction: `src/lessons/choices/journey-explore.js`. The shared engine (`choices-exploration.js`) drives the life map, not this tree, so it does not change.
- Static reading: two example chains written out as text, one with a big lucky break and one with a big roadblock.

Keyboard use, announcements, the static alternative and reduced motion keep working as before; a surprise chip is a normal button.
