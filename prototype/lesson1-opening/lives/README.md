# Lives: the store behind the Lesson 1 opening

Status: mockup data (design 001, round v13, round 4), English only. Created 2026-10-10.

The opening tells one person's life on the map, one fork at a time, and then
lets the reader change one of that person's choices and watch a different life
grow from the fork. This folder holds everything those lives are made of:

- `nodes/*.yaml`: the **nodes**, one file per area of life (music, sport,
  science, …). A node is one thing that can happen in a life: a choice, a lucky
  break, a setback or an event. Every life, written or grown, is a path through
  these nodes.
- `baselines/*.yaml`: the **baselines**, one file per person. A baseline is a
  written life: the nodes it passes through, at which ages, and which other
  choices the reader may try at each fork.

The tree page (`/prototype/lesson1-opening/lives/` on the prototype server)
shows the store as a nested tree, the baselines, sample lives grown from any
fork, and every problem the checker finds. It reloads when a file changes.

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
  within: 0                   # if set, one `after` match must be among the last N steps (help right after a setback)
  move: 0                     # events only: how this changes how things are going, -3 … +3 (up is better)
  by: family                  # optional: someone else chose it (children under about 8)
  weight: 1                   # optional: how often it comes up when a life grows (default 1)
```

**Names and tags share one namespace.** `after: [guitar, instrument]` matches a
life that took the `guitar` node or any node that gives the `instrument` tag. A
tag may not have the same name as a node unless it is that node's own id.

**Heights.** A life starts at the middle. Each step moves it by `move` × 0.1
(up is better), except that a `move` of 3 or -3 is a big jump of 0.42. Choices
wobble a little but don't move it. A grown life also drifts a tenth of the way
back to the middle at each step, so no life gets stuck at the top or bottom.

**Kinds and how they draw.** A `choice` is a plain dot where lines split, and
never moves the path up or down by itself: choices are not ranked. A `lucky`
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
```

Every step must be possible where it stands: its node's rules hold for the
steps before it, and its age is inside the node's `ages`. The same goes for
each alternative. Only `choice` steps have alternatives. When a step names no
`echoes`, the steps that satisfied its `after` pulse.

## What a written life needs

- 12 to 15 steps, from `born` to `end`, then "Many paths still ahead."
- One family choice before 8, and at least six of the person's own choices,
  most of them with two or three alternatives.
- At least three steps that build on earlier ones, at least one lucky break and
  at least one setback, and at least one moment of asking for help, being
  helped or changing course.
- A shape of its own: not every life rises, falls and recovers like Sam's. Some
  start hard, some peak early, some go steadily and meet one big surprise late.
- Hard things are real but fit for an 8-year-old reading with a grown-up: a lost
  job, a lost home, an injury, an illness, a failed exam, a business that
  closes, a parent who needs care. No deaths, violence, abuse, drugs by name or
  self-harm. Sam's "bad habits, money gone" is the darkest level.
- Respect for every job and every path. Fame and money are never the point, and
  no life ends as a lesson about the "right" choice.

## How a different life grows from a fork

When the reader picks an alternative, the life keeps every step before the
fork, takes the alternative, and then grows to the person's `end` age: at each
fork the engine lists the nodes whose rules hold at that age, prefers ones that
build on the last few steps, now and then brings a lucky break or a setback
(they take turns), and picks at random. The same pick grows a different life
each time. The gray lines at each new dot are other nodes that were possible
there.

A node happens at most once in a life. A step comes at least a year after the
one before it.

## Check it

```sh
npm run lives:check                       # the whole store; exit 1 on any error
npm run lives:check -- --samples 10       # and ten random grown lives as text
npm run lives:check -- --quiet            # errors and the report, warnings counted only
npm run lives:check -- --store tests/fixtures/lives --lives 20 --random 1000
```

**Errors** (fix them all): a file that doesn't parse; duplicate ids; an id
that isn't camelCase; an unknown name in `after`, `needs`, `unless`, `drops` or
`echoes`; a tag named like another node; bad `ages`; a kind's `move` out of its
range (choice 0, lucky 1 to 3, setback -1 to -3, event -3 to 3); a choice
without `if`; a label over 22 characters; a line over 12 words; an unknown
`{token}`; a line that starts with `{name}'s`; words that say "you"; a
baseline step or alternative that isn't possible where it stands (the message
says which rule fails); alternatives on a step that isn't a choice, or an
alternative that isn't one; ages that don't go up; `end` outside 38 to 45; a
written life with fewer than 12 or more than 15 steps, or one that doesn't
start with `born` at 0 and finish at `end`.

**Warnings:** nodes no life can reach (nothing they need can come before them
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
fork's others is flagged: no choice may reliably end higher. Then, across
5,000 random lives (`--random`), how many nodes of each file are ever used,
and which are not.
