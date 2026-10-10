# v13 — Lesson 1 opening

Created: 2026-10-09. Updated: 2026-10-10 (round 4: the lives store, as v05). Status: playable mockup on a branch; owner review pending. Not published.

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
- **The tree page** (`/prototype/lesson1-opening/lives/`): Born at the root; under each node the nodes that can follow it; fresh starts grouped by age; a node that follows several others is shown in full once and as a "↪" link elsewhere. Search, file and kind filters, expand and collapse all. On the right: the checker's findings, each linked to its node, the written lives with their alternatives, "Grow 5 more" lives from any alternative, and a short "How to edit". The page updates when a file is saved.
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
- Lines older than the last four step back to the quiet colour. Beside the map, when the list would outgrow its column, the oldest step down to 15 px, then 14 px, and always wrap to their whole text; the three before the newest step down last.
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
