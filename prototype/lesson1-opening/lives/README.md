# Lives: the store behind the Lesson 1 opening

Status: mockup data (design 001, round v13, rounds 4 to 6), English only. Created 2026-10-10. Updated 2026-10-11 (round 6: runs, choices are not verdicts, drinking and drugs).

The opening tells one person's life on the map, one fork at a time, and then
lets the reader change one of that person's choices and watch a different life
grow from the fork. This folder holds everything those lives are made of:

- `nodes/*.yaml`: the **nodes**, one file per area of life (music, sport,
  science, …). A node is one thing that can happen in a life: a choice, a lucky
  break, a setback or an event. Every life, written or grown, is a path through
  these nodes.
- `runs/*.yaml`: the **runs**, one file per area like `nodes/`. A run is a
  short burst of trying again: a few nodes in a row, close together.
- `baselines/*.yaml`: the **baselines**, one file per person. A baseline is a
  written life: the nodes it passes through, at which ages, and which other
  choices the reader may try at each fork.

The tree page (`/prototype/lesson1-opening/lives/` on the prototype server)
shows the store as a nested tree, the baselines, sample lives grown from any
fork, and every problem the checker finds. It reloads when a file changes.
With `?store=fixture` it shows the small test store in `tests/fixtures/lives`
instead; the opening takes the same address option (and `&scale=6` copies the
fixture's nodes six times, to measure it with about 400).

## Why nodes and not one big tree

The same thing can follow many others. Starting a band can follow guitar,
drums, piano or choir; a record deal follows a band whose song got played,
whatever instrument came first. Written as one nested tree, every shared step
would be copied under each parent, and the copies would drift apart. So each
node is written once and says what must already be on the path before it can
happen (`after`, `needs`, `unless`). The tree page draws the nested tree from
those rules.

A life never signs a record deal without having been in a band, because the
record deal's `after` asks for a song on the radio, which asks for a band, which
asks for an instrument or singing.

## A node

```yaml
- id: startsBand              # unique across all files, camelCase, never renamed once used
  label: Starts a band        # the map label: a whole phrase that reads on its own, at most 22 characters
  line: "{name} starts a band with two friends."   # the narration line: one idea, at most 12 words
  if: "{name} had started a band"                  # choices only: completes "What if …?"
  kind: choice                # choice | lucky | setback | event (`start` is only for `born`)
  ages: [12, 19]              # when it can happen, inclusive
  after: [instrument, sings]  # any ONE of these must already be on the path (node ids or tags); omit for a fresh start
  needs: []                   # ALL of these must be on the path (rare)
  unless: [band]              # NONE of these may be on the path
  tags: [music, band]         # what this gives the life (a node's own id always counts too)
  drops: []                   # tags this takes away (a band that splits drops `band`)
  within: 0                   # if set, one `after` match must be among the last N steps and at most 4 years before (help soon after a setback)
  move: 0                     # events only: how this changes how things are going, -3 … +3 (up is better)
  by: family                  # optional: someone else chose it (children under about 8)
  weight: 1                   # optional: how often it comes up when a life grows (default 1)
  inRun: true                 # optional: it happens only as a step of a run, never on its own in a grown life
```

**Names and tags share one namespace.** `after: [guitar, instrument]` matches a
life that took the `guitar` node or any node that gives the `instrument` tag. A
tag may not have the same name as a node unless it is that node's own id.

**Heights.** A life starts at the middle. Each step moves it by `move` × 0.1
(up is better), except that a `move` of 3 or -3 is a big jump of 0.42. Choices
wobble a little but don't move it. A grown life also drifts a tenth of the way
back to the middle at each step, so no life gets stuck at the top or bottom.

**Kinds and how they draw.** A `choice` is a plain dot where lines split, and
never moves the path up or down by itself: choices are not ranked.
**Choices are not verdicts.** A choice's label, line and `if` tell what the
person does, never how it turns out or whether it was bad ("Goes on a world
tour", not "Parties every night"). Anything that goes wrong comes in a later
step: a setback or an event with its own cause, in its own words. A written
life may give a choice a positive `move` (asking for help can start the climb
back) but never a negative one. A `lucky`
break is a sun star and lifts the path (`move` 1 to 3). A `setback` is a clay
diamond and drops it (`move` -1 to -3). An `event` is something that happens
that is neither a choice nor plain luck (a record deal after a song is played,
becoming a parent); it is a plain dot and may move the path either way or not
at all. Every lucky break also gives the tag `lucky`, every setback `setback`,
so a node can say `after: [setback]` with `within: 1` for "right after a hard
time".

**Words.** Third person, present tense, the narrator's voice (the
`wisdom-voice` skill). Tokens: `{name}`, `{his}` (his/her), `{him}` (him/her),
`{himself}`. The subject of a line is `{name}` or someone or something else
("A radio DJ plays {his} song."). A `{name}` that starts a line becomes He or
She after the first line of a story; anywhere else it stays the name, so write
`{his}`, not `{name}'s`, at the start of a line. The first letter of a line is
capitalized for you. Quote every line and `if` (they start with `{`). Never
"you". A line must make sense on its own, right after any node that can come
before it: no "it" or "they" pointing at the previous line.

## A run

A **run** is a short burst of 3 to 5 steps over at most 2 years. The person
tries something, meets a no (a rejection, a split, a failed try, an injury),
changes something (a new band, a new approach, more practice, someone's help)
and tries again. It ends in a success, a partial success or a change of
course: persistence isn't always winning.

```yaml
- id: newBand                # camelCase, unique among runs
  label: New band             # the tree page's name for it: a noun phrase, 1 to 4 words, at most 30 characters
  steps: [ownSong, bandSplits, formsNewBand, radioPlay]   # 3–5 node ids, in order
  span: 2                    # years from its first step to its last, 1 or 2
```

- Each step is an ordinary node, and its rules (`after`, `needs`, `unless`,
  `ages`) hold in sequence: the run is a path, not a special case. Write the
  nodes a run needs with `within: 1`, so they read as "right after".
- The first step is a try (a choice or an event); a setback comes after it and
  before the last step; the last step is not a setback.
- Inside a run, two steps in a row may share an age; the whole run takes 1 to
  `span` years. Outside a run a step still comes at least a year after the one
  before it.
- Mark the nodes written only for a run `inRun: true` (at least its first
  step), so a grown life never takes one on its own, as a loose one-off.
- Vary the shapes: some runs end in a win, some in a partial win (a small
  press, a market stall), some in a change of course (a new position, a new
  field). Two or more runs per area, so a grown life nearly always finds one
  that follows its story.

## A baseline

```yaml
id: sam
name: Sam
pronoun: he          # he | she
end: 41              # the last age, 38 to 45
steps:
  - { node: born, age: 0 }
  - node: choir
    age: 6
    alts: [footballClub, learnsToSwim]   # choices the reader may try instead; each must be possible here
  - node: radioPlay
    age: 18
    line: "A radio DJ plays it. Luck!"   # optional: this life's own words for the step
    label: …                             # optional: this life's own map label
    move: …                              # optional: this life's own rise or fall at the step
    y: …                                 # optional: the exact height, 0 (top) to 1 (bottom), to fine-tune a shape
    echoes: [choir]                      # optional: earlier steps that pulse when this one lands
    run: newBand                         # this step is part of the life's run (mark each of its steps)
```

Every step must be possible where it stands: its node's rules hold for the
steps before it, and its age is inside the node's `ages`. The same goes for
each alternative. Only `choice` steps have alternatives, and only at least six
years before `end`, so a different life has room to grow. When a step names no
`echoes`, the steps that satisfied its `after` pulse.

## What a written life needs

- 12 to 17 steps, from `born` to `end`, then "Many paths still ahead." The
  run's steps count.
- **Exactly one run**, its steps marked `run: <id>`, in the run's order, one
  after another, within its span.
- One family choice before 8, and at least six of the person's own choices,
  most of them with two or three alternatives.
- At least three steps that build on earlier ones, at least one lucky break and
  at least one setback, and at least one moment of asking for help, being
  helped or changing course.
- A shape of its own: not every life rises, falls and recovers like Sam's. Some
  start hard, some peak early, some go steadily and meet one big surprise late.
- Hard things are real but fit for an 8-year-old reading with a grown-up: a lost
  job, a lost home, an injury, an illness, a failed exam, a business that
  closes, a parent who needs care. No deaths, violence, abuse or self-harm.
- **Drinking and drugs** may be named as a setback, in the general words a
  child reads with a grown-up: "{name} starts drinking too much." or "Drinking
  and drugs take over, and {his} shows fall apart." That is the darkest level.
  Never name a particular drug, and never describe how it is used or what it
  does to the body. Such a node is a setback tagged `substance`, and:
  - it always has a cause on the path before it (fame, a loss, stress): its
    `after` names it, not just any setback;
  - it is always answered by asking for help or being helped (a step that
    gives `helped`) within 1–2 years, in the life and in the node rules: a
    help node with `within` 1 or 2 names it or `substance` in its `after`
    (`getsHelpToStop`); a grown life always takes help next;
  - it is used sparingly: Sam's is the only written life with it, and at most
    one or two nodes in the pool lead to it, only after fame or a big loss.
- Respect for every job and every path. Fame and money are never the point, and
  no life ends as a lesson about the "right" choice.

## How a different life grows from a fork

When the reader picks an alternative, the life keeps every step before the
fork, takes the alternative, and then grows to the person's `end` age: at each
fork the engine lists the nodes whose rules hold at that age and picks at
random, weighted by `weight`. The same pick grows a different life each time.
The gray lines at each new dot are other nodes that were possible there.

- **Lives build.** When some node builds on one of the last two steps (its
  `after` matches one of them), one of those is taken about two times in
  three.
- **Surprises.** From age 8 until four years before `end`, about one fork in
  three is a lucky break or a setback (they mostly take turns). The last four
  years have none, so no life ends on one. A surprise that follows the life's
  own story comes first, and comes more often: its `after` matches a step
  through a narrow name (one that at most 1 node in 20 gives, so not `job`).
  So give surprises an `after` in their area; the generic ones in `life.yaml`
  fill in when the story has none waiting.
- **Answers come soon.** Right after a setback, about seven times in ten, a
  node that answers it comes 1–2 years later (3–4 at most): a node with
  `within` whose `after` names that setback or one of its tags (one naming
  the setback itself is three times as likely as `after: [setback]`).
  Otherwise the next step still comes sooner (about half the usual gap), and a
  `within` match is never more than four years back.
- **Old interests fade.** An `after` match only through steps the life left
  more than 10 years ago (no later step shares a tag with them or builds on
  them) counts a tenth as much. A dance class at 4 rarely leads to
  something at 18 unless dancing carried on in between.

- **One run.** A grown life with no run yet (none before the fork) starts one
  at a fork, about half the time, when a run's first step's rules hold there
  and the whole run fits before `end` − 4; when fewer than eight years are left
  before then, it starts one wherever one fits. It does this once. The run's
  steps are added together: the same age as the step before or a year later,
  using the run's whole span where they can. A pick inside a written run (not
  at its first step) stays part of that run.
- **The next steps follow the pick.** After the reader's pick, the next two
  steps build on it (or on a step that built on it) whenever a plain step can;
  one that follows through a narrow name ("journalism", not "job") weighs ×3. A
  lucky break or a setback is never forced this way. A run started then must
  build on the pick too, unless time is running out.
- **The thread goes on after a run.** The step after a grown run builds on the
  run's steps whenever one can.
- **Drinking or drugs** is always followed by help, 1–2 years later.

A node happens at most once in a life. A step comes at least a year after the
one before it, except inside a run.

## Check it

```sh
npm run lives:check                       # the whole store; exit 1 on any error
npm run lives:check -- --samples 10       # and ten random grown lives as text
npm run lives:check -- --quiet            # errors and the report, warnings counted only
npm run lives:check -- --store tests/fixtures/lives --lives 20 --random 1000
```

**Errors** (fix them all): a file that doesn't parse; duplicate ids (nodes or
runs); an id
that isn't camelCase; an unknown name in `after`, `needs`, `unless`, `drops` or
`echoes`; a tag named like another node; bad `ages`; a kind's `move` out of its
range (choice 0, lucky 1 to 3, setback -1 to -3, event -3 to 3); a choice
without `if`; a label over 22 characters; a line over 12 words; an unknown
`{token}`; a line that starts with `{name}'s`; a sentence that starts with
`{his}` or `{him}` (it stays lower case); words that say "you"; a
baseline step or alternative that isn't possible where it stands (the message
says which rule fails); alternatives on a step that isn't a choice, or an
alternative that isn't one; alternatives less than six years before `end`;
ages that don't go up (inside a run two steps may share one); `end` outside 38
to 45; a written life with fewer than 12 or more than 17 steps, or one that
doesn't start with `born` at 0 and finish at `end`; a choice step with a
negative `move`. **Runs:** a label over 4 words or 30 characters; a `span` other than 1 or
2; fewer than 3 or more than 5 steps, an unknown or repeated one; a run that
doesn't start with a try, meets no setback in its middle or ends on one; a
step that can't follow the run's earlier steps (their tags are in its
`unless`, or it has `within` and none of them gives its `after`); no ages that
fit in order within the span. A written life with more than one run, or whose
run's steps aren't together, in order and within the span. **Drinking and
drugs:** a particular drug named, or how it's used (`NAMED_DRUGS` in
`engine.js`); a `substance` node that isn't a setback, has no cause of its own
in `after`, or that no help node names (`within` 1–2); a written life
where help doesn't follow it within 2 years.

**Warnings:** a choice whose label, line or `if` uses a verdict word ("bad",
"wastes", "too much", "gone", "lazy", "wrong" and a few more: `VERDICT_WORDS`
in `engine.js`); a written life with no run; more than two nodes leading to a
drinking or drug setback, or more than one written life with one; nodes no life can reach (nothing they need can come before them
in time), duplicate labels, nodes where every grown life through them stops
more than three years before its end, and a written life without a lucky
break, a setback, a family choice before 8 or six of the person's own choices.

**The variety report:** for every alternative of every baseline, 50 grown
lives (`--lives`): how many reach `end` − 3 (`reach`), the mean number of
steps, the distinct nodes used after the fork, the mean overlap of any two of
those lives after the fork (0 nothing shared, 1 the same; lower is more
varied), and the mean end height (`end`, above the middle is +) against the
fork's other options (`others`: the step as written, grown again, and the
other alternatives). A pick whose lives end more than 0.12 apart from its
fork's others is flagged: no choice may reliably end higher. `luck` is the
share of grown forks from 8 to `end` − 4 that were a lucky break or a setback
(aim: about a third), `build` the share of steps that built on one of the last
two, `run` the share of grown lives that have a run (kept from before the
fork or grown after it). The `runs:` line gives that share for the forks at
least 10 years before `end` that come before the written run (aim: 80% or
more). Then, across 5,000 random lives (`--random`): how many end on a lucky
break or a setback (aim: none), how many of the surprises follow the life's
own story (aim: half or more), how many setbacks are answered within four
years (aim: 60% or more), and how many nodes of each file are ever used, and
which are not, and which runs are ever grown.
