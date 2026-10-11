# v13 — Lesson 1 opening

Created: 2026-10-09. Updated: 2026-10-11 (round 6: stories that make sense step by step, and one run of trying again in every life, as v07). Status: playable mockup on a branch; owner review pending. Not published.

Question: does the opening tell one life clearly? Since round 3, also: does Sam's story read like the Explore chapter, and does changing one of his choices show that every gray line is a life he could have lived? Since round 4, also: can a reader play the opening five or six times and meet a really different life each time, where every step makes sense?

The mockup plays the new start of Lesson 1 from beginning to end. First the cover. Then Sam's life grows fork by fork along an age line, from birth to 41, drawn the way the Explore chapter draws a life. At the end the reader can change one of his choices and watch a different life grow from that fork. Then "Choices add up". Then the stage fades into the first beat of Alfredo's hike. It uses the lesson's own header, chapter trail, stage, narration column and styles, the same seed and path engine for the cover, and the Explore chapter's drawing and tree, so it looks like the lesson. Only the opening plays: the chapters after the hike are shown but can't be opened.

Related: [product 013](../../../product/013-choices-guided-journey.md) (the guided journey), [product 003](../../../product/003-visual-language-and-navigation.md) (visual language), [002 v03 — Stage build](../../002-site/v03-stage-build/README.md) (the cover this opening starts from), [v12 — Maya figure](../v12-maya-figure/README.md) (the round before this one).

## Run it

```sh
npm run dev:prototype -- --host 127.0.0.1 --port 4638 --strictPort
```

Open <http://127.0.0.1:4638/prototype/lesson1-opening/>. The lives store and its tree page: <http://127.0.0.1:4638/prototype/lesson1-opening/lives/> (see [its README](../../../../prototype/lesson1-opening/lives/README.md)).

- Press **Watch the paths grow** on the cover. Then a life plays by itself: Sam's on the first visit, then each **Replay** or **Watch another life** plays one of the ten people not seen yet (remembered in the browser), until all have played.
- **Space** or **Pause** holds the story. **→**, or a click on the map or the lines, plays the next step (while paused, one step plays and holds). **Next** lands the whole story at once (300 ms), then moves on. **Back** and **←** go back a beat.
- At the end, the card on the map offers **Change one of his choices** (or hers) and **Watch another life**. Every fork with other choices gets a ring; a ring is a button that opens the choices there, and a gray choice on the map can also be tapped straight away. A picked choice grows a new life from that fork, a different one each time. **Try again** grows another from the same choice, **Try another choice** goes back to the rings, and **Back to Sam's life** or **Escape** puts the life back as it was.
- The **Mockup** bar under the stage switches the pace (**Normal**: 900 ms pauses, 1300 ms after events; **Quicker**: 700 and 1000 ms) and the **Life** (any of the ten, or Random), and replays the story.
- The address keeps the pace and the life: `?pace=quick&life=zoe`. After a pick it also holds the fork, the choice and the seed, so the same new life opens again. `?store=fixture` plays the test store (two lives); `#paths-life` opens the finished story, `#paths-adds` the next beat and `#hike-plan` the hike.

## Round 6: stories that make sense, and one run of trying again in every life (v07)

The owner's notes, paraphrased: the visuals look good; now the story steps need to be more logical. Partying is not in itself a bad thing, so "Parties every night" should not be what brings Sam down: he becomes a rock star, and substance abuse is what brings him down. Every story should have one moment of persistence, a few small steps close together (a song, the band splits, a new band, a record deal). And check every story's steps for logic.

Question: does every life, written or grown, read as cause and effect, one step at a time, with one quick burst of trying again, and does that burst read as one on the map?

### The rules, as built

1. **Choices are not verdicts.** A choice's label, line and `if` tell what the person does; what goes wrong is a later step with its own cause. The checker errors on a choice with a negative `move` (Sam's old `partiesEveryNight` had `move: -1`; the node is gone) and warns on verdict words in choices (`VERDICT_WORDS` in `engine.js`: bad, waste, too much, gone (not "had gone"), lazy, wrong and a few more).
2. **Runs.** `lives/runs/*.yaml`, one file per area: 3 to 5 steps over 1 or 2 years, a try, a no (a setback in the middle), a change, another try, and an outcome that is not a setback. Each step is an ordinary node; inside a run two steps may share an age. The checker validates every run (shape, ages that fit, each step able to follow the ones before) and every written life's run (exactly one; its steps together, in order, within the span). The engine starts one run in a grown life with none yet, at a fork chosen with the usual weights, when its first step's rules hold and it fits before `end` − 4 (about half the time at a fork, always when fewer than eight years are left). The tree page lists the runs as chains and marks their steps.
3. **Drinking and drugs** may be named as a setback, in general words only. The checker errors on a named drug or on how one is used (`NAMED_DRUGS`); a `substance` setback needs its own cause in `after` and a help node with `within` 1–2 that names it (`getsHelpToStop`); a written life must reach help within 2 years; more than one written life with it, or more than two nodes leading to it, is a warning. A grown life always takes help next.
4. **Sam** (17 steps): born, choir, guitar, starts a band; the run `newBand`, 16–18 (the three bandmates record a first song; both friends quit; he forms a new band; a radio DJ plays one of his songs); the label signs the band at 20; he goes on a world tour at 22 (its alternatives: stays home to write, saves the money); drinking and drugs take over at 24; the label drops the band and he loses his flat at 25; a friend takes him in and he asks for help at **26** (was 27: rule 3's "help within 1–2 years"); then teaching guitar, two kids, school music and his daughter on stage, unchanged. The band splits once. His heights keep round 3's shape: the record deal peaks at 0.29, the fall reaches 0.82, the end is at 0.32.
5. **The logic check** is the audit below.

**Changed from the brief, and why:**

- **"No run" was a warning while the other nine lives had none** (deliverable 1 asked for 0 errors then); it became an error once every life had its run.
- **`inRun: true`** (new): a node written only for a run is never taken alone in a grown life, where a run's first step read as a loose one-off ("makes a batch of things to sell", then nothing). A writer found it.
- **A pick inside a run carries a run on.** A pick at a run's middle step left the run with no outcome (the audit's criterion 8); such a pick must itself be a middle step of some run, which the engine then finishes. A pick at a run's first or last step is allowed as before.
- **The engine's own logic rules** (from the lead's review of four sample lives and the audit): the two steps after a pick build on it whenever a plain step can (a narrow name weighs ×3; luck or a setback is never forced), and the first comes 1–3 years later when one follows it; the step after a grown run builds on the run; a grown step comes at most 6 years after the one before; an interest untouched for 10 years weighs a tenth. To keep about a third of forks lucky or hard with these plain steps, the base surprise rate is 0.45 (27% measured).
- **Words in written lives:** two lines in a row may not repeat a content word (a checker warning); the general work steps (`workMove`) need a recent job and come at most once a life.

### The pool

42 runs: art 3, caring 3, community 3, food 3, life 3, making 3, money 3, music 4, nature 2, science 4, sport 3, stage 3, tech 2, words 3. Shapes vary: wins (a retaken exam, a passed driving test, a second art-school try), partial wins (a small press, a market stall, a reserve-team place, a chorus place) and changes of course (a new position, a testing job instead of coding, a classroom job, a stall that becomes a repair service, dance to teaching). Written by seven Sonnet writers, two areas each; the store now has 660 nodes. Every written life has one run:

| Life | Run | Ages | Shape |
| --- | --- | --- | --- |
| Amara | bookSmallPress: sends the book out, publishers say no, a writing group, a rewrite, a small press | 28–30 | partial win |
| Ana | sourdough: tries sourdough, flat loaves, asks an old baker, a café buys loaves | 19–20 | partial win |
| Kai | earlyFrostSwitch: an early crop, a late frost, hardy greens, a café buys them | 21–22 | change of course |
| Lena | examNewCourse: an advanced maths course, a failed exam, a tutor, statistics | 17–19 | change of course |
| Leo | danceToTeaching: tries for a dance company, an ankle injury, a gentle class, teaching | 18–20 | change of course |
| Nora | backFromInjury: squad trials, a knee injury, rebuilding, a whole game again | 17–19 | win |
| Omar | tradeTest: sits the trade test, fails, practises with a pro, passes | 19–20 | win |
| Sam | newBand: a first song, the band splits, a new band, a radio DJ | 16–18 | win |
| Theo | busyWard: a busy ward, too few staff, asks a senior nurse, moves ward | 21–22 | change of course |
| Zoe | artSchoolNewRoute: applies to art school, a no, an evening print class, a print shop | 18–20 | change of course |

`npm run lives:check` (50 grown lives for each of 173 alternatives, then 5,000 random lives): 0 errors, 0 warnings; reach 100%; **runs: 100% of the lives grown from the 104 forks at least 10 years before `end` that come before the written run got one (least 96%, Amara at 23)**; all 42 runs grown; 0 forks flagged (no choice reliably ends higher); 27% of forks from 8 to `end` − 4 lucky or hard; 0% of lives end on one; 62% of surprises follow the life's own story; 94% of setbacks answered within four years. `npm test`: 273 pass.

### The audit

A fresh Opus reader read the ten written lives and 40 seeded grown lives (four per person, from four forks, five she-lives) as plain text, five times, against the nine criteria, plus four checks the lead added for grown lives. Written lives failing: 8 → 5 → **0** (from pass 3 on). Grown lives failing on a real stop: 5 (pass 3) → 6 → **1** of 40 (pass 5: an online book seller with an unpaid "big customer"; fixed after pass 5, not re-read). Grown items 100 → 35, of which 34 are editor's notes on thin stretches. Every mechanical problem became an engine or checker rule. The record, with the counts per criterion, what was fixed and what was left: [audit-r6.md](audit-r6.md).

### The map and the pace

**Options** (Sam's run at 1440×900 and 1133×744, 2× crops, [1440](opening-run-options-1440-v07.png), [1133×744](opening-run-options-1133x744-v07.png)):

| Option | Judged |
| --- | --- |
| A, even: the run's steps spread evenly over its years | Close together, as asked, but the explorer's curves leave and reach every dot level, so each one-year step with a fall or a rise draws as a vertical S; gray branches at every step crowd it. |
| B, quiet: A, and no gray branches at the run's middle steps | Calmer; the S curves remain. |
| C, ages: each step at its own age, a shared age nudged 0.45 years | Uneven gaps; two dots almost on top of each other before the nudge. |
| **D, direct (built): B, and the run's own strokes lean straight (75%)** | **One quick zigzag on the line: down to the no, up through the try again. Reads as a burst, distinct from the slow curves around it.** |

**What was built** (`life-map.js`, `life.js`): a run's steps sit evenly over its years (`placeAges`); a run's middle steps carry no gray branches; its edges lean straight (`controls`, `edge.direct`); a run dot closer than 16 px to an earlier one moves up or down until clear (`spaceRun`, the drawing only; the life's heights don't change); only the run's first and last steps get map labels, and only where they fit (Sam's "Records a song" has no room; the list tells it). A run's steps play at **0.6×** the usual time (walk, pause, line and pulses; `RUN_PACE`), at both paces and in a changed life. Changed lives use the same layout and pace.

**Measured** (Chromium):

- **Dots:** at 1440×900 every life's dots are at least 16.3 px apart (all ten); at 1920×1080 at least 16.3 px; at 1133×744 at least 13.6 px and at 744×1133 at least 12.5 px, where two ordinary steps a year apart sit one year apart (12.5 px a year at 744 wide), as before this round; every run's dots are 16 px or more apart at every size. Every dot sits on the line.
- **Labels:** no map label overlaps another label or a dot, for all ten lives at 1440×900, 1920×1080, 1133×744 and 744×1133, and under reduced motion (1440×900 and 744×1133).
- **Story time at Normal pace:** Sam 30.7 s → **33.0 s** (+2.3 s; 17 steps, was 14); Quicker 27.1 → 29.2 s. The others: 27.8 s (Leo, Zoe) to 32.6 s (Omar).
- **The story list** (17-step lives): option E still holds; when nothing fits with the four newest rows whole, the three (then two) newest stay whole and the rows close to the short screens' 3 px gap (`is-packed`), and as the very last resort older rows go to 13 px. 13 px is used only at 1366×657 (Amara, Ana, Nora and Omar), a laptop window below the project's targets; at 1440×900 the sizes are 15/14 or 14 px.
- **The sweep** (`sweep.mjs`, all ten lives × 1133×744, 1440×900, 1366×657, 1280×800, 1920×1080, 744×1133 and 2560×1440 × both paces): **140 story runs, 0 with scroll, overflow or rows out of view; "Choices add up" 3/3 and clear in all 70; 0 console errors.**
- **WebKit** could not be installed here again (Playwright's download host is blocked). On a Mac: `npx playwright install webkit`, then `node sweep.mjs --engine webkit --sizes 1133x744,1440x900,1366x657,1280x800,1920x1080,744x1133,2560x1440`.

### Review images (v07)

| Moment | Image |
| --- | --- |
| Sam's whole story: the run at 16–18 and the fall (drinking and drugs, the label drops the band, asking for help), 1440×900 | [sam 1440 v07](opening-run-sam-1440-v07.png) |
| The same, 1133×744 | [sam 1133×744 v07](opening-run-sam-1133x744-v07.png) |
| Sam's run and fall, 2× crops | [1440](opening-run-sam-crop-1440-v07.png), [1133×744](opening-run-sam-crop-1133x744-v07.png) |
| Nora's run (a she-life: squad trials, a knee injury, rebuilding, back at full strength), 1440×900 | [nora v07](opening-run-nora-1440-v07.png) |
| Omar's run (the trade test, failed, practice with a pro, passed), 1440×900 | [omar v07](opening-run-omar-1440-v07.png) |
| A grown life with a run: Sam with a football club at 6 (seed `r6b`; a comeback run at 17–19), 1440×900 | [grown v07](opening-run-grown-1440-v07.png) |
| The four map options | [1440](opening-run-options-1440-v07.png), [1133×744](opening-run-options-1133x744-v07.png) |

### Known issues

- **Grown lives are thinner than written ones.** The audit's 34 editor's notes: some picks have a plain follow-up only some of the time (a drama club, a smaller shop), a few late steps recur ("helps someone new at work find their feet", now weight 0.15), and three general work steps name no job. None is a mistake a reader would stop on; each needs more nodes.
- **A run's first map label** is often left out where the run sits tight against the step before (Sam's "Records a song"): the list tells it, and the run's last label shows.
- **At 744×1133 and 1133×744** two ordinary steps a year apart can sit 12.5–13.7 px apart (one year's width there); runs are spaced 16 px.
- **13 px older rows** at 1366×657 for four of the longest lives (last resort).
- **The story pace** grows with the number of steps: a 17-step life takes up to 33 s at Normal pace.
- **The test fixture's Sam** follows the real Sam's round-6 shape but not every word (its alternatives are fewer).

## Round 5: the story list and the "Choices add up" labels (v06)

The notes on v05, paraphrased: fix the story list and the missing labels, then show the result. The open issues from round 4:

1. On an iPad held sideways (1133×744) the story list scrolls while a life plays, and at the end a long life's first rows sit cut off under the top fade (Theo is the worst).
2. On long lives at other sizes the older rows look much smaller than the newest (Nora at 1440×900: old rows 14 px, the four newest 18 px), and the gaps between rows vary.
3. "Choices add up" shows two of its three labels on some lives and sizes.

The goal: at every size the list tells the whole life in one calm column. Every line arrives in place, nothing scrolls while the life plays, every row is in view and whole at the end, and the list uses at most two type sizes. "Choices add up" shows all three labels on every life at every size.

### Measured before this round (72d8ffe)

[`sweep.mjs`](sweep.mjs) drives the dev server with Playwright (`npm i --no-save playwright`; no change to `package.json`). It plays every life from the cover at both paces, samples the list's scroll every 100 ms, measures the list at the end, and checks the three labels of "Choices add up"; `--budget` adds layouts per arriving line and the longest main-thread tasks at 4× slowdown. Run it against a dev server on 4644 (`--url` for another), `--engine chromium|webkit`, `--sizes 1133x744,1440x900`.

The room the story beat's column gives the list (px, top to bottom; the list's box runs from the heading to the Pause row):

| Screen | Kicker | Heading | List box | Pause | Beat dots | Back/Next | Controls (rule to foot) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1133×744 | 23 (+12 margin) | 64, two lines | 220–587: **367** | 30 | 26 | 48 | 103 |
| 1366×657 | 23 (+12) | 75, two lines | 232–500: **268** | 30 | 26 | 48 | 103 |
| 1440×900 | 23 (+12) | 79, two lines | 236–705: 469 | 30 | 26 | 48 | 138 (with the key hint) |

Each life, both paces (the same at both): most the list scrolled while playing / px too long at the end / rows not whole and in view at the end (line sizes at the end):

| Life | 1133×744 | 1366×657 | 1440×900 |
| --- | --- | --- | --- |
| Amara | 18 / 16 / 3 (17, 13) | 71 / 70 / 6 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Ana | 0 / 0 / 0 (17, 13) | 16 / 8 / 3 (17, 13) | 0 / 0 / 0 (15) |
| Kai | 0 / 0 / 0 (17, 14, 13) | 26 / 24 / 4 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Lena | 8 / 0 / 0 (17, 13) | 11 / 9 / 3 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Leo | 32 / 30 / 4 (17, 13) | 17 / 9 / 3 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Nora | 0 / 1 / 0 (17, 13) | 56 / 55 / 5 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Omar | 76 / 60 / 4 (17, 13) | 87 / 85 / 6 (17, 13) | 0 / 0 / 0 (18, 15, 14) |
| Sam | 0 / 0 / 0 (17, 14) | 0 / 0 / 0 (17, 15, 14, 13) | 0 / 0 / 0 (17.5) |
| Theo | 54 / 46 / 4 (17, 13) | 33 / 25 / 3 (17, 13) | 0 / 0 / 0 (15) |
| Zoe | 32 / 30 / 3 (17, 13) | 17 / 9 / 3 (17, 13) | 0 / 0 / 0 (18, 15, 14) |

So: 6 of 10 lives scroll at 1133×744 and 9 of 10 at 1366×657; up to 85 px too long at the end; up to six rows cut or under the fade; three or four line sizes in one list (the compact rows at 13 px, with 12 px ages, beside 17 px lines). At 1440×900 nothing scrolls, but seven lives end with three sizes, 18, 15 and 14 px. Lists that fit end 2 px above the Pause row.

"Choices add up", the ten lives at 1280×800, 1440×900, 1920×1080, 2560×1440, 744×1133, 1133×744 and 1366×657 (70 cases): two of three labels for **Theo at 1133×744** and **Leo at 1280×800**. Lena and Omar at 744×1133 show three on this branch's store. The sweep also checks that no chip covers a dot of the route and no pin crosses one: 14 more cases fail that (Omar at 1133×744: "Luck" sits over the dot "Not his choice" points to, and that pin runs through the "Luck" chip).

Why the labels failed, from a log of every try (each label has 6 heights × 3 alignments): every try was blocked by the map's edge (the 40 px axis at the foot, the top), the other chips or a named step's own label (which never steps back), and the fallback that steps other labels back found no try clear of those. For Theo at 1133×744 "Luck" had 18 tries: 9 hit a label that could step back but sat beside a chip or a named label, 9 hit the other chips or named labels. The old fallback also let a chip sit over a dot and a pin run through a chip.

Cost of a line arriving (`--budget`, Theo at 1133×744): 6.4 layouts on average, 9 at most (the fold's tries). Sam at 1920×1080: 1.3 and 3.

### The options (2× crops, Theo's end at 1133×744 and Nora's end at 1440×900)

Every option starts from the same base:

- **Room on short screens.** On the story beat at heights of 820 px or less (`opening.css`, scoped to `.narration-body[data-beat="life"]`, not a what-if): the kicker hides, as it already does in a changed life (35 px); the heading drops to one line, 24 to 28 px (39 px at 1133×744, 46 at 1366×657); the beat dots sit beside Back and Next in one row, the buttons still 48 px (44 px). The list's box grows from 367 to **490 px** at 1133×744 and from 268 to **399 px** at 1366×657.
- **One type scale.** At most two sizes: the four newest rows and the older rows, older rows 14 px or more. The ages have one size throughout, so the age column has one width. The fold's steps (15, 14 and 13 px, the compact rows) are gone.

| Option | Image | Judged as a child of eight reading it |
| --- | --- | --- |
| A, older rows shorten to their label, at 16/14 px (the lean) | [option A](opening-list-option-a-v01.png) | Follows from 0 to the end, every step there. The step from 16 to 14 px still reads as two styles at 1440 (Nora). |
| B, older rows gather into one row ("Age 0–11 · 4 earlier steps") | [option B](opening-list-option-b-v01.png) | The life no longer starts at birth: the first thing read is a count. The steps are a tap away only after the story. Drawn only, its words not written. |
| C, today's folding kept to two sizes | [option C](opening-list-option-c-v01.png) | Still too long at 1133×744 (the last line is cut), and the compact rows with their age inline are a second style halfway down. |
| D, one size (16 px) throughout, labels sooner | [option D](opening-list-option-d-v01.png) | The calmest: one style top to bottom. More rows shorten (9 of Theo's 16 at 1133×744, 3 of Nora's at 1440). |
| **E, the pick: one size when the whole story fits; else labels, older rows at most 1 px smaller** | [option E](opening-list-option-e-v01.png) | Reads as one story, top to bottom, at one size or a size and a pixel; Theo keeps 16 px for his four newest rows and 15 px for the rest, with seven of his older steps as labels. |

**The pick: E** (A, kept to one size). A child follows the life from birth, every step still in its place, and nothing in the list changes style: a shortened row is the same type and colour as its neighbours, it only says the step in fewer words ("Helps the neighbours" for "His grandma takes soup to a neighbour, and Theo comes along"). A's 16/14 step was the kind of size difference the owner flagged; B drops the start of the story; C does not fit and keeps two looks. E ends up with fewer labels than D where the room allows (it tries a single size down to 15 px before shortening anything).

### What was built

- **The list is planned, not tried.** Before the first line, `fitStory` (page.js) measures every row once at each size it considers (one layout a size, a probe row for a shortened row's height) and works out the list's height at every step of the story. It takes the largest single size at which every step fits whole (24 down to 15 px). Failing that, it shortens the oldest rows to their step's map label, one at a time and only as many as needed, with older rows at most 1 px smaller (16/15, 15/15 or 15/14; of these, the plan that shortens the fewest rows), and 14 px for everything only if none fits. A line arriving only applies its step's plan: before the line rises, the fifth-newest row may step back and the oldest rows may shorten; the four newest never change.
- **A shortened row** keeps its age and shows the step's map label ("Helps at home") in the same type and colour as its neighbours; the whole line stays in a visually hidden span for screen readers, and the label is `aria-hidden`.
- **The ages** have one size (82% of the older rows' size, at least 13 px), so the age column keeps one width.
- **Room on short screens**, as in the options: the kicker, a one-line heading, and the beat dots beside Back and Next. These are story-beat rules in `opening.css`; the dots-beside-buttons rule also holds in a changed life, so the controls don't jump when a choice is picked.
- **A changed life's list** still uses `fitList` as before; its fold is now only `foldWhat`.
- **"Choices add up"** (`chip()` in map.js): tries go out to 140 px above and below the dot, each running right, left or centred, then slid 20 or 40 px along the route. A chip is placed in tiers: clear of the other chips, the labels that stay, every dot (and its pin crosses no dot but its own) and the route; then the route may run under it; then its pin may cross a label or a chip; then other steps' labels step back. The three named steps keep their labels, and a slide never puts a chip over another dot.
- **Found on the way:** with reduced motion at 744×1133, leaving the cover drew the life for the cover's taller stage (Born 10 px below the map's foot, the route mostly off the stage), and "Choices add up" then showed one or two labels. The life map kept a layout keyed only on the stage size, while Born's place came from a size cached on the cover. The layout is now keyed on Born's place too (`layoutKey` in life-map.js). It was the same at 72d8ffe.

### Measured after (Chromium)

- **The sweep, all ten lives × 1133×744, 1366×657 and 1440×900 × both paces:** 0 px scrolled during playback, 0 px too long at the end, 0 rows out of view, in all 60 runs (before: 30 runs scrolled, up to 87 px, and up to six rows were cut). Line sizes at the end: one size (Sam 15.5–17.5 px, Ana 15 px), or 15 and 14 px; 14 px throughout for Amara and Omar at 1366×657 only. Ages 13 px (14.35 px for Sam at 1440×900, 82% of his one size). Shortened rows at the end: 0 to 6 (Theo 6 at 1133×744, 1 at 1366×657, none at 1440×900; Nora 5, 3 and 1).
- **Where a list ends:** 4 px above the Pause row when the life fits at one size (2 px before). Where the tightest moment was an earlier step, not the end, a little more is left: up to 20 px (Leo and Zoe at 1133×744).
- **The room:** the list's box is 490 px at 1133×744 (367 before) and 399 px at 1366×657 (268); 1440×900 is unchanged (469).
- **"Choices add up":** 3/3, with no clash (each other, the labels that stay, a dot, a pin over a dot, the map's edge, the end card), for all 70 lives × sizes at 1280×800, 1440×900, 1920×1080, 2560×1440, 744×1133, 1133×744 and 1366×657 (before: 2 short and 14 with a chip over a dot).
- **The whole opening, keyboard only:** each life from the cover through the story; at the end a changed life from the last ring (Enter on the ring, Enter on its first choice); Escape back; Next to "Choices add up" (3 labels); Next to the hike; ← ← back to the story. All 70 lives × sizes pass at the quicker pace. The normal pace passes at 1440×900 and 1366×657 (Theo, Nora, Omar, Sam), and reduced motion passes at 1440×900, 744×1133 and 1133×744 (all ten lives). A changed life's list never scrolls in any of them. No console errors or warnings.
- **Cost of a line arriving:** layouts per line (Chrome's own count, stepping through the story): Theo at 1133×744 6.4 → **1.3** on average, 9 → 4 at most; Sam at 1920×1080 1.3 → 1.3. The longest tasks at 4× slowdown cannot be judged on this VM. Its headless Chromium composites in software, and the same baseline run swings from 77 to 846 ms (Sam at 1920×1080, 72d8ffe) between runs. With that noise, the arrival task read 77 → 67 ms (Theo at 1133×744) and 101–846 → 213 ms (Sam at 1920×1080). `node sweep.mjs --budget --sizes 1133x744 --lives theo` repeats it on a real machine.
- **Memory:** five Replays at 1133×744: JavaScript heap 14.4 → 15.2 MB, 522 to 537 page elements (before: 14.2 → 15.0 MB, 498 to 506).
- `npm test` passes (264 tests); `npm run lives:check`: no errors, no warnings.
- **WebKit** could not be installed here: the VM's network policy blocks Playwright's download hosts. On a Mac: `npx playwright install webkit`, then `node sweep.mjs --engine webkit --sizes 1133x744,1440x900,1366x657` and with `--no-story --sizes 1280x800,1440x900,1920x1080,2560x1440,744x1133,1133x744,1366x657`.

### Simplified, and known issues

- The plan assumes each row's height depends only on its own size and width, which holds for this list (a grid of independent rows). A row's text changing after the plan (a font arriving late) is fitted again only if the list's box changes size.
- A life whose tightest moment is not its end keeps the labels it needed then: Nora at 1440×900 shortens one row although the finished list would have room for it. Rows never lengthen again, so nothing changes under the reader.
- At 1366×657, Amara and Omar need 14 px for every row, plus labels. 1366×657 is a laptop browser window, below the project's minimum targets, but it now fits.
- Option B's words were never written; it was drawn only.

### Review images (v06)

| Moment | v06 | Compare |
| --- | --- | --- |
| Theo at the end of the story, 1133×744 | [list theo v06](opening-list-1133x744-theo-v06.png) | [end 1133 v04](opening-end-1133-v04.png) |
| Theo mid-story (step 10), 1133×744 | [list theo play v06](opening-list-1133x744-theo-play-v06.png) | |
| Nora at the end, 1440×900 | [list nora v06](opening-list-1440-nora-v06.png) | [option C (today's fold, two sizes)](opening-list-option-c-v01.png) |
| Ana at the end, 1366×657 | [list ana v06](opening-list-1366x657-ana-v06.png) | |
| Sam at the end, 1920×1080 | [list sam v06](opening-list-1920-sam-v06.png) | [story v05](opening-history-story-1920x1080-v05.png) |
| "Choices add up", Theo, 1133×744 | [adds theo v06](opening-adds-1133x744-theo-v06.png) | |
| "Choices add up", Lena, 744×1133 | [adds lena v06](opening-adds-744-lena-v06.png) | [adds 744 v01](opening-adds-744-v01.png) |
| "Choices add up", Omar, 744×1133 | [adds omar v06](opening-adds-744-omar-v06.png) | |
| The five list options | [A](opening-list-option-a-v01.png), [B](opening-list-option-b-v01.png), [C](opening-list-option-c-v01.png), [D](opening-list-option-d-v01.png), [E, the pick](opening-list-option-e-v01.png) | |

### The cover to the story

The note, paraphrased: going from the cover to the story there is a redraw hitch. Every path shifts at once as the narration column arrives. The column should come in over the map instead, so the field never redraws.

Before (72d8ffe, `node sweep.mjs --cover --sizes 1440x900,1920x1080`): as the cover left, the stage narrowed from 1400 to 1002 px at 1440×900 (1880 to 1470 at 1920×1080). The field was re-fitted and painted again (two bitmap changes on `#map-base`), the life map laid out again (two more on each of its canvases), and Born moved 13 px. Back to the cover did the same in reverse.

What changed (opening.css, and the visible-area reads in map.js and life-map.js):

- Beside the narration (990 px and wider), the cover, the story and "Choices add up" keep the stage at full width. The grid keeps its two columns from the cover on, and the narration sits over the stage's right part. The card takes its story shape with `clip-path: inset(0 var(--cut) 0 0 round 22px)`, where `--cut` is the column's width minus 20 px. Its paper is a `::before` layer that fades in. The hike's first step keeps the lesson's own layout.
- On the cover the column is laid out but unseen (`visibility: hidden`, `opacity: 0`). As the cover leaves, the card's edge leads: the clip closes in over 380 ms, and the column follows 140 ms later, sliding in 40 px and fading in over 440 ms, both with `cubic-bezier(.2,.7,.2,1)`, so its words never land on the paths. The field fades out over the 96 px before the card's edge rather than stopping at it; that fade moves in with the edge (`--edge`, a registered length eased on `.map-stack`, as map.js sets the field's own transition inline). The story starts once the column has landed (580 ms, was 380). With reduced motion nothing moves; the column and the card appear at once. Back to the cover reverses it: the column slides out over 180 ms first, then the clip opens (100 ms later).
- The life map, its labels, rings, popovers and end card, and the chips are laid out in the card's visible part from the start: its layers stop `--cut` short of the stage's right edge, and their width is read from there. Born stays where it was on the cover.

After, in Chromium:

- **No re-fit and no redraw:** from ArrowRight on the cover to the first line, the stage's box never changes and `#map-base` never changes its bitmap (it changed twice before). The life's canvases are sized once, when the life is first drawn (two changes each, from nothing). Born moves 0 px. Back from the story to the cover changes no canvas at all.
- **The landed state is today's:** the card's visible edge and the column's left edge and width are the same as 72d8ffe to the pixel at 1050×800, 1133×744, 1280×800, 1440×900 and 1920×1080 (for example card 20–1022 px and column 1022 px, 418 px wide, at 1440×900). Born sits 10 to 13 px further right, because it keeps its place from the cover. The route's end is within 1 px.
- **Frames:** this VM's headless Chromium draws at roughly 15 to 20 frames a second even when nothing moves, so its frame times cannot be judged against the 20 and 33 ms budgets: before and after, most frames read 50 to 67 ms. The redraw's own long frame is gone from the record (the 233 ms frame at 1440×900 and 300 ms at 1920×1080 before; 67 and 133 ms at most after), but that is not a measurement of the budget. `node sweep.mjs --cover --sizes 1440x900,1920x1080` (with `--engine webkit` too) repeats it on a real machine.
- Everything else that sets or clears the cover still works: the full journey above (all ten lives × seven sizes, the quicker pace; reduced motion at three sizes), Back to the cover, Replay from the cover, and the hike's stage at the lesson's own size (20–1022 px at 1440×900, no clip).

| Moment | Image |
| --- | --- |
| The cover, mid-slide (about 200 ms in), landed, the first line, 1440×900 | [cover to story v06](opening-cover-to-story-1440-v06.png) |
| The landed story, 72d8ffe (left) beside this round (right), 1440×900 | [landed v05/v06](opening-story-landed-1440-v05-v06.png) (the field is mid-fade at a different moment in the two; compare the card and the column) |

### Checked on a Mac

- **Copy check** (`copy.mjs`, desktop and phone width): the tree page's own labels are names now ("Editing", "Fresh starts", "Label or id", the kicker "Lesson 1 opening"), and the all-clear sentence under "0 errors · 0 warnings" is gone. A written life's steps are the store's own words (its labels and its "What if …?" lines, the what-if headings the lesson asks), so they carry `data-copy-ok="question pronoun"`.

- **The story list and the labels in WebKit** (`sweep.mjs --engine webkit`, all ten lives at 1133×744, 1366×657, 1440×900, 1280×800, 1920×1080, 744×1133 and 2560×1440, both paces): 140 runs with no scroll while playing, no overflow and no row out of view at the end; "Choices add up" 3/3 and clear in all 70. The sizes match Chromium's: 15 and 14 px at 1440×900 for the longer lives (18, 15 and 14 px before), 15 to 19 px at 1920×1080 as before. No console errors.
- **The cover to the story** (`sweep.mjs --cover`, frames sampled in the page): in WebKit the long frames at the moment the column arrived are gone (49 and 65 ms at 1440×900 and 33 and 116 ms at 1920×1080 before; none over 25 ms after, with the soft edge). Over the whole step, from ArrowRight to the first line, the longest WebKit frame is 27 ms at 1440×900, 37 ms at 1920×1080 and 35 ms at 1133×744 (29 and 54 ms at the first two before), the rest coming from the paths growing and the story's first draw, not the column. Headless Chromium paces its frames unevenly (26 to 27 ms gaps at rest), so its counts over 20 ms say little.
- **A line arriving** (`--budget`, Chromium at 4× slowdown): layouts per line 6.0 → 1.3 (Theo at 1133×744). The longest task varies too much between runs of the same build on this machine to judge the 16.7 ms budget: 19 to 55 ms for Theo at 1920×1080 on one build. Not yet measured on a real iPad.

## Round 4: the owner's notes on v04 (v05)

The notes, paraphrased:

1. Round 3 is really good.
2. The stars and diamonds must sit cleanly on top of the lines.
3. Take the path options out of the code into a store, with a nested tree that can be seen and edited.
4. Store them as nodes: many starting points lead to the same choices, and choices should build on each other. A life should never sign a record deal without ever having been in a band.
5. More options and more chance: about ten written lives, so a child can play five or six times and meet really different lives.
6. A map label showed only "A band", not the whole choice.
7. The history on the right covers about the top 40% of the column instead of running down to the controls.

Today, measured (v04, before this round):

- **Where Sam's life lived:** his 14 steps and 9 labelled alternatives were code, `LIFE_STEPS` in `life.js`, with their words in `copy.json` (`map.life.*` labels, `lesson.beat.life.*` lines) and fixed heights on the map: 0.5, 0.515, 0.49, 0.505, 0.49, 0.4, 0.29, 0.33, 0.78, 0.67, 0.55, 0.45, 0.36, 0.27.
- **Markers:** each star, diamond and dot was drawn with its own line, at the line's alpha, so lines drawn later crossed it, and a faded star or diamond on Sam's light path let the lines behind it show through. Its 2 px ring had the same alpha.
- **"A band":** that was the label's own text (`map.life.band`). Separately, the nine gray choice buttons were all cut by their box (text wider than the button) at 1280, 1440, 1680, 1920 and 2560 px wide.
- **The history column:** the story list stopped at 548 px. At 1920×1080 it ran from 246 to 793 px with the controls at 923; at 2560×1440 the controls sat at 1283, so the list filled about half its room. A changed life's list stopped at 303 px, and at 1280×800 it scrolled (303 px of rows in a 221 px box).

What changed:

- **The lives store** (`prototype/lesson1-opening/lives/`; its README is the schema). A node is one thing that can happen: a choice, a lucky break, a setback or an event, with the ages it can happen at and what must already be on the path (`after`, `needs`, `unless`, `within`). Nodes live in one YAML file per area of life; a written life (a baseline) is a list of nodes with ages and the alternatives at each choice. On this branch the store has 460 nodes in 14 files and ten written lives; the writer's audited store (its own branch) has 471.
- **The engine** (`lives/engine.js`, no DOM) reads and checks the store, works out each step's height and grows a new life from any fork. Lives build on their last two steps about two times in three. From 8 until four years before the end, about one fork in three is a lucky break or a setback; the last four years have none, so no life ends on one. A surprise that follows the life's own story comes first. After a setback, seven times in ten something that answers it comes one or two years later. An interest the life left more than twelve years ago counts a quarter as much. Sam's heights land within 0.07 of round 3's.
- **The checker**, `npm run lives:check`: every error and warning in the store, a variety report for every alternative of every written life (50 grown lives each), and sample lives as plain text for reading.
- **The tree page** (`/prototype/lesson1-opening/lives/`): Born at the root; under each node the nodes that can follow it; fresh starts grouped by age; a node that follows several others is shown in full once and as a "↪" link elsewhere. Search, file and kind filters, expand and collapse all. On the right: the checker's findings, each linked to its node, the written lives with their alternatives, "Grow 5 more" lives from any alternative, and a short "Editing" note. The page updates when a file is saved.
- **The opening reads the store.** Sam plays first; **Replay** and the end card's new **Watch another life** play someone not seen yet. Every choice with alternatives gets a ring, and each ring is a button that opens a small popover with the alternatives as chips (the arrow keys move between them), so a choice whose label had no room on the map can still be picked. A pick grows a different life each time, with its seed in the address; **Try again** grows another.
- **Markers on top:** every line is drawn first, then every dot, star and diamond, solid (a faded one is a pre-mixed colour, not see-through), each with a 2 px ring in the map's colour where a line passes behind it.
- **Whole labels:** labels are phrases ("Starts a band") and are never cut; a label with no room is left out, gray ones first, and its choice stays in the ring's popover.
- **The history column** now runs from the heading to the controls. The words take the largest size, in half pixels, at which the whole list fits (15 to 24 px for a story, 14 to 21 px for a changed life), and the room left over goes between the rows. A list too long even at the smallest size folds its older rows as in v04, and a changed life's older rows close up.
- **"Choices add up" for every life:** its three labels mark the person's own choice that builds on an earlier one, the first lucky break and the first setback. With the store's lives the steps' own labels often left them no room (Theo's showed none at 1440×900), so a label now also tries the left of its dot, centred on it and two rows farther, and as a last resort the labels of other steps in its way step back (their dots and lines stay).
- **Fixes found on the way:** the end card hides any gray label it would cover (at 1280×800 and 1133×744); in Safari a click on a popover's chip now picks it (the popover used to close as the button was pressed); and a long story's oldest lines take the compact layout one at a time, not all at once, which had left up to 81 px empty under the list at 1280×800.

Simplified, and known issues:

- **The tree page is read-only,** as asked for this round: editing is in the YAML files, and the page updates when one is saved. A node whose id appears twice shows only its first copy (the checker reports the duplicate). Neither page is in `npm run build:prototype`'s inputs; they run on the dev server, as the opening did in round 3.
- **At 1133×744** (an iPad held sideways) the column is too short for the longer lives. While they play, six of the ten lists (Ana, Kai, Noah, Omar, Theo and Zoe) scroll by 8 to 55 px for a few steps to keep the newest line in view, under the top fade; at the end, Ana, Omar and Theo are still 13 to 51 px too long with every older line compact (in WebKit, four more by 5 px). At every other size no list scrolls while a life plays (sampled every 100 ms for all ten lives at 1280×800), and every story fits at its end.
- **"Choices add up"** shows two of its three labels for Lena and Omar at 744×1133 and Theo at 1133×744: no room even with other labels stepped back. The words beside the map still name all three.
- **A changed life from a late fork** has few rows, so its list stops at the largest size (21 px) and the room left over stays under it.
- **The branch's store** is the writer's store as of its first merge. The writer's audited store (on its own branch) fixes 17 of the 18 errors the new rules find here, and renames two people (Ines and Noah become Leo and Nora); it is not merged here.

Review images (v05):

| Moment | Image |
| --- | --- |
| Sam's last step, 1440×900 | [14 v05](opening-14-1440-v05.png) |
| The end card, 1440×900 | [end v05](opening-end-1440-v05.png) |
| A fork's popover open (chess club at 10), 1440×900 | [popover v05](opening-whatif-pop-1440-v05.png) |
| The chess club picked: the new life grown, 1440×900 | [what-if v05](opening-whatif-1440-v05.png) |
| The history column, story and changed life, 1920×1080 | [story v05](opening-history-story-1920x1080-v05.png), [what-if v05](opening-history-whatif-1920x1080-v05.png) |
| The history column, story and changed life, 2560×1440 | [story v05](opening-history-story-2560x1440-v05.png), [what-if v05](opening-history-whatif-2560x1440-v05.png) |
| The chess club picked, 744×1133 | [what-if v05](opening-whatif-744-v05.png) |
| Every marker of both paths, three times zoomed, 1920×1080 | [dots v05](opening-dots-1920-v05.png) |
| "Choices add up" on Theo's life: the three labels, two other labels stepped back, 1440×900 | [adds v05](opening-adds-1440-v05.png) |
| The tree page: "Starts a band" found from Sam's life, five lives grown from the football club (the 18 errors are this branch's copy of the store under the round's new rules; see Checks) | [tree v05](lives-tree-1440-v05.png) |

## Round 3: the owner's notes on v02

The notes, paraphrased:

1. Use the darker wording (example A).
2. The dots don't sit on the lines the way they do elsewhere in the lesson. Sam's route cut across the field's lines, and its dots floated between them.
3. Bring back the explorer's interactive feel: click, the path changes, and the other paths stay behind it.
4. After 30, on the darker path, more good things can happen: he has kids, teaches at the local school, watches his child on stage.

What changed:

- **The words** are example A only; the switch is gone. Sam's life runs to 41: he teaches guitar at 30, has two kids at 33, teaches music at the local school at 36 and watches his daughter sing on stage at 41. That last line echoes choir at 6, so the age-6 dot pulses when it lands. The story has 15 lines and takes about 29 s at the normal pace.
- **The drawing** is the Explore chapter's. As the story starts, the cover's field fades out over 600 ms and the age axis (0 to 45) fades in, so no field line crosses the route. Every step is a fork: the route's curves leave and reach each dot level, and one or two gray choices leave every dot, so each dot sits where lines split. The choices he didn't make carry on as faint gray lives, and light green paths carry on past 41.
- **Labels and markers:** short dark labels on the map for Sam's steps (the narration keeps the full sentences), gray labels for the choices he didn't make, the explorer's sun star for the radio play and clay diamond for the split. Where there is no clear room, a gray label is left out before a dark one, keeping its line.
- **The shape:** level to 16, a rise at 18 to 20, a tip down at 23, the steepest drop at 25, recovery from 27, then a steady climb from 30 that ends at 41 higher than fame.
- **Change one of his choices.** The end card reads "One life, one path. Every gray line is a life Sam could have lived." Picking a gray choice at 6, 10, 14, 23 or 27 turns Sam's real path from that fork light green; it stays behind. A new dark path grows from the same dot with the same stroke, using the explorer's tree, seeded by the choice, so a pick always gives the same life. It walks at the explorer's pace, with labels, gray choices at every fork, and its own luck and setbacks, to 41. The narration asks "What if Sam had picked drums?" and lists the new life's events by age.
- **Honesty.** The new lives go up and down like any explorer life: two end higher than Sam's (football club, drums), early nights a little lower, and the other six lower. "Saves money" ends lower than Sam's. Seeds were chosen to keep that mix. Asking for help is not set against going it alone: its alternatives are moving back home and taking an office job.
- **Text version:** one added sentence, "On the page you can change one of Sam's choices and watch his path change."

## Round 3 fixes (v04)

Two fixes to v03 before the owner's review:

- **No story line is cut off.** In v03 the oldest lines folded to one row and could end in "…". Lines still to come wait unseen in one row each, as before, so the list doesn't jump. When the list would outgrow its column beside the map, the oldest lines step down to 15 px in the quiet colour, one at a time, then to 14 px, and they always wrap to their whole text. The three lines before the newest keep their size unless that is not enough: at 1133×744 the rows close up from 3 px to 1 px, and then those three step down too. Nothing scrolls while the story plays, at any size (see Checks).
- **A changed life is told about Sam.** Sam's story is in the third person, but the explorer's events speak to the reader ("You hurt your hand for a year"). A changed life now uses only labels without "you" or "your". Of the explorer's 26 events, 21 speak to the reader, including all five that can happen in any life, so filtering alone would leave almost none. Each of the 21 has a short third-person version, and any label still addressed to the reader is left out of the pool: today that is three example choices ("Build something of your own", "Teach others your craft", "Write your story"). Choices keep the explorer's imperative ("Join the school band"); "Start your own business" becomes "Start a business". The nine lives keep their shapes and their ends. Three change one late label: football club's last step reads "Start a business", saves money takes "Take a job closer to family" at 37, and the school team ends with "Take it slowly, then go back".

New strings for the integration, English only, in `prototype/lesson1-opening/copy.json`. Each is one catalog key per explorer step, to add to every catalog:

| Key | English | The explorer's words |
| --- | --- | --- |
| `opening.whatif.step.ownBusiness` | Start a business | Start your own business |
| `opening.whatif.step.teacherSpots` | A teacher notices his work | A teacher notices your work |
| `opening.whatif.step.scholarship` | He wins a scholarship | You win a scholarship |
| `opening.whatif.step.unkindSupervisor` | An unkind supervisor | Your supervisor is unkind |
| `opening.whatif.step.discovery` | His team makes a discovery | Your team makes a discovery |
| `opening.whatif.step.bandInvite` | An older band asks him to join | An older band asks you to join |
| `opening.whatif.step.songOnRadio` | A radio station plays his song | A radio station plays your song |
| `opening.whatif.step.handInjury` | A hurt hand, for a year | You hurt your hand for a year |
| `opening.whatif.step.scoutWatches` | A scout watches him play | A scout watches you play |
| `opening.whatif.step.nurseMentor` | A senior nurse becomes his mentor | A senior nurse becomes your mentor |
| `opening.whatif.step.hospitalCloses` | The hospital closes | Your hospital closes |
| `opening.whatif.step.robotPrize` | His robot wins a prize | Your robot wins a prize |
| `opening.whatif.step.bigCustomer` | A big company becomes a customer | A big company becomes your customer |
| `opening.whatif.step.publishersSayNo` | Ten publishers say no to his book | Ten publishers say no to your book |
| `opening.whatif.step.bookDeal` | A publisher wants his book | A publisher wants your book |
| `opening.whatif.step.chefOffer` | A chef offers to train him | A chef offers to train you |
| `opening.whatif.step.friendInvites` | A friend invites him to a new club | A friend invites you to a new club |
| `opening.whatif.step.friendForLife` | A friend for life | You meet a friend for life |
| `opening.whatif.step.oldFriendJob` | An old friend offers him a job | An old friend offers you a job |
| `opening.whatif.step.illForMonths` | Ill for a few months | You’re ill for a few months |
| `opening.whatif.step.jobEnds` | His job ends suddenly | Your job ends suddenly |

The mockup's filter checks the English words for "you" and "your". On the site it should work by key, so it holds in every language: a step with an `opening.whatif.step.*` key uses it, and the three example choices are left out by their keys (`explore.choice.adult.buildSomethingOfYourOwn`, `explore.choice.later.teachOthersYourCraft`, `explore.choice.later.writeYourStory`).

The mockup has English words only, so the German story lines' fit is for the integration to check.

## Review images

Round 3 fixes (v04), only the images that changed:

| Moment | 1440×900 | 744×1133 | 1280×800 | 1133×744 |
| --- | --- | --- | --- | --- |
| Step 14, his daughter on stage: older lines step down a size, whole | [14 v04](opening-14-1440-v04.png) | | | |
| The end card: the whole story fits, no line cut off | [end v04](opening-end-1440-v04.png) | | [end v04](opening-end-1280-v04.png) | [end v04](opening-end-1133-v04.png) |
| Choosing: older lines step down to make room for the hint | [choose v04](opening-choose-1440-v04.png) | | | |
| Drums picked at 10: "A hurt hand, for a year", "A radio station plays his song" | [what-if 10 v04](opening-whatif-10-1440-v04.png) | [what-if 10 v04](opening-whatif-10-744-v04.png) | | |

Steps 6 and 9, and step 14 at 744×1133, are unchanged from v03.

Round 3 (v03), at 1440×900 and 744×1133 (the iPad mini, portrait):

| Moment | 1440×900 | 744×1133 |
| --- | --- | --- |
| Step 6, the radio DJ: the star blooms, the song pulses | [06 v03](opening-06-1440-v03.png) | |
| Step 9, the band splits: the drop | [09 v03](opening-09-1440-v03.png) | |
| Step 14, his daughter on stage: the age-6 dot pulses | [14 v03](opening-14-1440-v03.png) | [14 v03](opening-14-744-v03.png) |
| The end card | [end v03](opening-end-1440-v03.png) | |
| Choosing: rings on the five forks, the gray choices as buttons | [choose v03](opening-choose-1440-v03.png) | |
| Drums picked at 10: the new life grown to 41, Sam's real path light behind it | [what-if 10 v03](opening-whatif-10-1440-v03.png) | [what-if 10 v03](opening-whatif-10-744-v03.png) |

[Dot close-ups at 1920×1080](opening-dots-1920-v03.png): every dot of Sam's route, from Born to Daughter on stage, at three times the screen's resolution, each showing where its lines split.

The held moments use the page's review hook (`opening.player.seek(step, ms)`), which pauses the story at that moment. In these images, the Pause link reads as it does while the story plays.

Earlier rounds, kept for comparison (v01 the first build, v02 the smooth route on the field):

| Moment | 1440×900 | 744×1133 | 1280×800 |
| --- | --- | --- | --- |
| Cover | [cover v01](opening-cover-1440-v01.png) | [cover v01](opening-cover-744-v01.png) | |
| Step 1, Sam is born | [01 v01](opening-01-1440-v01.png) | [01 v01](opening-01-744-v01.png) | |
| Step 6, the radio DJ | [06 v02](opening-06-1440-v02.png), [v01](opening-06-1440-v01.png) | [06 v01](opening-06-744-v01.png) | |
| Step 9, the band splits | [09 v02](opening-09-1440-v02.png), [v01](opening-09-1440-v01.png) | [09 v01](opening-09-744-v01.png) | [09 v01](opening-09-1280-v01.png) |
| Step 11, the story to 30 | [11 v02](opening-11-1440-v02.png), [v01](opening-11-1440-v01.png) | [11 v02](opening-11-744-v02.png), [v01](opening-11-744-v01.png) | [11 v01](opening-11-1280-v01.png) |
| Choices add up | [adds v02](opening-adds-1440-v02.png), [v01](opening-adds-1440-v01.png) | [adds v01](opening-adds-744-v01.png) | |
| Into the hike, 820 ms after Next | [fade v01](opening-fade-1440-v01.png) | [fade v01](opening-fade-744-v01.png) | |
| Life strip | [v02](opening-life-strip-1440-v02.png), [v01](opening-life-strip-1440-v01.png) | | |

The cover, "Choices add up" and the fade into the hike work as in v01 and v02; "Choices add up" now puts its three labels on the round 3 drawing.

## How it plays

Each line has the same rhythm. In the first 420 ms the line rises 14 px and fades in. As it lands (260 ms), its dot blooms on the map. Then the traveller walks there, from 300 to 1000 ms, starting softly and arriving slowly, while the gray choices he didn't make sprout beside him and run on a little way. The step's short label appears as he arrives. The steps this one builds on pulse once: a ring that widens and fades over 600 ms, 140 ms apart. Then the pause. One clock drives the words and the route, so they can't drift apart, whether the reader pauses, steps or taps quickly.

- Choices keep the route level. The radio play lifts it (the star). The split drops it (the diamond). Asking for help starts the climb back.
- Builds-on pulses: choir → guitar → band → song → radio and record deal; teaching guitar answers the guitar; the school job answers teaching; his daughter on stage answers choir.
- Lines older than the last four step back to the quiet colour. Beside the map the list is planned before it plays (round 5): one size if the whole story fits; otherwise the oldest rows, one at a time, show their step's map label, and older rows may be a pixel smaller. The four newest rows always show their whole line.
- After the last line the end card appears on the map, clear of the route: lower right where there is room (1920×1080), lower left otherwise (at 1280×800 and 1440×900 a gray label holds the lower right), and as a bar along the top of the map at 744×1133 and 1133×744.
- **A changed choice:** the traveller goes back to the fork, and each step of the new life takes 700 ms plus 70 ms a year (at most 1500 ms), with a 320 ms pause. Its labels follow the explorer's rules. The list shows each event as it is reached, newest at the bottom. With reduced motion, the new life appears at once.
- In "Choices add up", three labels mark the guitar (His choice), the radio play (Luck) and the split (Not his choice); on another life, its first own choice that builds on an earlier one, its first lucky break and its first setback. The gray choices' labels step back there, so the three have room; their lines stay. Where a life's own labels still leave no room, the labels of other steps in the way step back too.
- Into the hike: the gray lines, the labels and the age axis fade first (320 ms). Sam's route stays alone. At 700 ms the hike scene and its words come in, as the route fades.
- With reduced motion, the finished story shows at once, and the beats change without travel.

## Checks

### Round 4 (v05)

Headless Chromium and WebKit (Chrome's and Safari's engines), on this branch:

- **The journey**, on the test store (`?store=fixture`): cover → Sam's story → end card → a fork's popover → a pick → **Try again** (a different life: the two lives' nodes differ) → **Try another choice** (the rings come back) → **Back to Sam's life** → **Watch another life** (the test store's second person) → "Choices add up" (all three of its labels, at every size) → the hike. 22 runs, all complete: in each engine the six sizes at the quicker pace, the normal pace at 1440×900, reduced motion at 1440×900 and 744×1133, and fast tapping (40 clicks on the map, 40 ms apart, while the story plays) at 1440×900 and at 1133×744 at the normal pace (four of them run again after the last change to the list's fit).
- **The tree page:** from Born down to an adult node, a "↪" link that moves to the node in full, "Grow 5 more" from a written life's alternative, and a test-store file saved with an unknown name in `after`: the page shows the error within a second, and drops it when the file is put back. Chromium at 1440×900 and WebKit at 1133×744 (and WebKit at 744×1133 without the edit); no console errors.
- **Keyboard:** the forks in age order with the arrow keys, Enter opens a fork's popover (inside the map at every size), the arrow keys move between its choices, Escape goes back to the fork, Enter picks. Sam at 1440×900 (Chromium, 8 forks), Lena at 744×1133 and Theo at 1133×744 (WebKit, 10 and 9 forks).
- **Every life of the store at every size** (the ten written lives × the six sizes, the story's end and a changed life from the last fork, both engines): no label, choice button, chip or list row cut by its box; no two visible labels overlapping; none outside the map; none under the end card. At its end, a story's list reaches to within 2 to 4 px of the controls at 1280×800, 1440×900, 1920×1080 and 2560×1440 (Amara at 1280×800 is 1 px over in Chromium); at 744×1133 it runs in two columns under the map, and 1133×744 is in the known issues above. A changed life's list never scrolls.
- **"Choices add up":** all three labels show for 57 of the 60 lives × sizes, the same in both engines (see the known issues above); on the test store's second person they now show at every size (in round 4's first build, none showed at 744×1133).
- **Console:** no errors or warnings in any run. `npm test` passes (264 tests).

The store and the engine (`npm run lives:check`, 50 grown lives for every alternative of every written life, then 5,000 random lives):

| | The store on this branch: the writer's audited store, merged |
| --- | --- |
| Errors | 0 (one of Sam's alternatives, `writesForOthers` at 30, broke the four-year `within` rule; it is now `joinsAdultChoir`) |
| Warnings | 0 |
| Grown lives reaching end − 3 | 100% |
| Mean overlap of two lives after the same fork (0 none shared) | 0.08 |
| Distinct nodes after a fork (50 lives) | 111 |
| Lucky breaks and setbacks among forks from 8 to end − 4 | 32% |
| Steps that build on one of the last two | 60% |
| Forks whose lives end more than 0.12 above or below their others | 0 |
| Lives that end on a lucky break or a setback | 0% |
| Surprises that follow the life's own story | 57% |
| Setbacks answered within four years | 85% |
| Nodes used in 5,000 lives | 470 of 471 (not `freelancesCode`) |
| Time | 1.7 s |

Before this round's growth rules (the writer's store at 3031dfa), 17.8% of lives ended on a lucky break or a setback, 38% of surprises followed the life's own story, and 49% of setbacks were answered within four years.

Budgets (Chromium, 1440×900, the processor slowed 4× where noted):

- **The store:** read and checked after the first paint. This branch's store (460 nodes) in 14 to 25 ms; the test store copied six times (409 nodes, `?store=fixture&scale=6`) in 10.4 ms (parse 8.0, check 2.4).
- **A pick at 4× slowdown,** with the 409-node store: growing and laying out a changed life is one task, then the list is fitted in a task of its own. Over ten picks the longest task was 14.7 to 16.4 ms across runs (the first pick, before the code has warmed up, is the slowest). One run of several showed a single 748 ms task on its tenth pick that did not come back in later runs; its cause is not known. Measured in Chromium's new headless mode: the older headless shell composites in software and adds 5 to 16 ms a frame of its own.
- **Memory:** the JavaScript heap was 9.5 MB after the first pick, 8.7 MB after ten and 9.2 MB after five changes of life; 921, 906 and 944 page elements.
- **The checker** on the full store, every alternative × 50 lives and 5,000 random lives: 1.7 to 1.8 s.

### Round 3 (v04)

Both browser engines (Chrome's and Safari's) at 1280×800, 1440×900, 1920×1080, 744×1133 and 1133×744:

- **The flow:** cover → story → end card → a changed choice at each of the five forks (6, 10, 14, 23 and 27) → Try another choice between them → Back to Sam's life → a gray choice tapped straight from the end card → Escape → "Choices add up" with his real path and its three labels → the hike. Back and the arrow keys go back to the finished story and on to the hike.
- **Both paces:** the story takes 29.1 s at the normal pace and 25.9 s at the quicker one. The words and the map never drift apart while playing or under fast taps. The narration never scrolls while the story plays and no line is cut off, during the story or at its end; at the end the whole list fits at every size.
- **Keyboard only:** Tab from the end card reaches its button; Enter shows the five forks; the nine gray choices are buttons in age order (football club, swimming lessons, drums, chess club, the school team, early nights, saves money, moves back home, takes an office job); Enter picks one; → shows the new life whole; each event is announced as it is reached, as in the explorer; Escape puts Sam's life back. Safari moves to buttons with Option-Tab unless its "Press Tab to highlight each item" setting is on, so it was checked that way.
- **Reduced motion:** the finished story shows at once from the cover, and a changed life appears at once.
- **Labels:** no two visible labels or choice buttons overlap at any size, in the story, while choosing or in any of the nine changed lives, and the end card covers no label and no dot. Where a changed life's label has no clear room (some at 744×1133), it is left out, as in the explorer; its dot and line stay.
- **Voice:** no label or list line in the nine changed lives says "you" or "your".
- **Dots:** every dot of Sam's route and of the nine changed lives sits where its lines split: at least one gray line leaves each one, and two or three light green paths leave each life's last dot. Each was checked in close-up at 1440×900 and 1920×1080 ([Sam's route at 1920](opening-dots-1920-v03.png)).
- No console errors or warnings. `npm test` and `npm run build` pass.

Narration fit, the same in both engines:

| Screen | End of the story | A changed life's list |
| --- | --- | --- |
| 1280×800 | Fits (416 px): 11 older lines at 15 px, the 7 oldest of them at 14 px; Next ends at 780 of 800 | Scrolls to its newest event for five of the nine choices |
| 1440×900 | Fits (467 px): 11 older lines at 15 px; Next ends at 846 | Fits for six; scrolls for football club, swimming lessons and chess club |
| 1920×1080 | Fits (548 px), every line at full size; Next ends at 1026 | Fits |
| 744×1133 | Fits (two columns); Next ends at 1053 | Fits (two columns) |
| 1133×744 | Fits (364 px): every line but the last at 14 px, rows closed up; Next ends at 724 of 744 | Scrolls for eight of the nine |

Frame cost at 1440×900 with the processor slowed 4×, measured from browser traces. The browser ran headless, with software compositing:

- **Story:** no main-thread task over 16.7 ms from the first line to the end; the longest was 13.1 ms (v04; also 13.6 ms at 1133×744, where the most lines step down), and the story's own drawing took at most 8.1 ms a frame.
- **Cover to story:** one 164 ms task in v04 (174 ms in v03; roughly 44 ms at full speed) when the stage narrows after the paths grow and the field repaints at its new size, as in v02 (145 ms), and one 19 ms frame just after it. Both fall before the first line, while nothing else moves; then the field fades out.
- **A changed choice:** the pick itself is one task of about 14 ms. The new life is laid out ahead of time, while the end card shows; the map behind it changes over the next two frames, and its labels are placed one a frame. While the new life grows, no task went over 16.7 ms.
- **Change one of his choices / Try another choice:** one task of 15 to 21 ms, which redraws Sam's whole story for choosing.
- **Memory** over ten picks (each of the nine, then drums again): the JavaScript heap went from 6.3 MB at the end of the story to 6.8 MB after the first pick and stayed between 6.8 and 7.1 MB; after Back to Sam's life it was 6.8 MB, with the same 485 page elements as before the first pick.

## Simplified or changed

- **The age axis is even**, 0 to 45 across the map, rather than the explorer's axis, which gives the early years more room. Over 41 years with 14 steps, the explorer's spacing crowded the years from 23 to 27.
- **The end card** sits lower left at 1280×800 and 1440×900, and is a bar along the top of the map (not under it) at 744×1133 and 1133×744: under the map there is the narration, and at the top the bar covers no step.
- **Closed choices** (the explorer's crossed-out options) are left out of the changed lives, to keep the five what-ifs readable.
- **A changed life's dots** move by up to about a year where they would land on Sam's light green path, so every dot stays clear of it.
- **The narration** is a compact list. Below 990 px wide it runs in two columns under the map, and so does a changed life's list. Beside the map, both lists fill the column (round 4); one too long for a short column folds its older rows instead of scrolling.
- **The Mockup bar** takes about 46 px from the stage's height. It is not part of the lesson.
- **"Choices add up"** hides the gray choices' labels (not their lines): with them, the map had no clear room for "His choice" and "Not his choice".
- **Into the hike:** the old words fade out over 300 ms, while the map goes.
- **Drawing:** the gray lines and the route are drawn once per step on two canvases the size of the stage; only the step in motion is redrawn each frame, on a small canvas the size of that step. Labels, the choice buttons, rings and the end card are HTML over the map.
- **Navigation:** the menu's links go to the live site. The hike's first beat is the last one here, so Next is hidden there.
- **English only.** The words are in `prototype/lesson1-opening/copy.json`, merged over the lesson's English catalog.

## Sources

`prototype/lesson1-opening/`:

- `index.html`, `boot.js`: the page, and the English words.
- `page.js`: the lesson controller for the opening, with the trail, beats, keys, the end card's controls, the what-if narration and the Mockup bar.
- `life.js`: the life that plays (from the store), the timing and the player.
- `life-map.js`: the life in the Explore chapter's drawing, with the labels, the rings and their popovers, the end card and the changed lives. A study copy of the drawing and label code in `src/lessons/choices/journey-explore.js`.
- `lives/`: the store (`nodes/*.yaml`, `baselines/*.yaml`), its README (the schema and the growth rules), `engine.js` (read, check, heights, grow), `store.js` (loads the store after first paint, and the test store with `?store=fixture`) and the tree page (`index.html`, `tree.js`, `tree.css`).
- `map.js`: a study copy of `src/lessons/choices/journey-map.js`, with the cover's field, its fade and the "Choices add up" labels.
- `opening.css`: the rules added to `src/lessons/choices/journey.css`.
- `copy.json`: the page's own words (headings, buttons, the closing line); the lives' words are in the store.

Elsewhere: `tooling/lives-check.mjs` (`npm run lives:check`), `tests/lives-engine.test.js` and the test store in `tests/fixtures/lives/`. Round 3's `explore-tree.js` (a study copy of the explorer's life tree) is gone: the engine grows the changed lives now.

It imports `src/engine/` (the path network and renderer) and `src/lessons/choices/` (the hike, the life choices, the motion helpers and the styles) without changing them.
