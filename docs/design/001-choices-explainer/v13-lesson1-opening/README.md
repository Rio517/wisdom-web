# v13 — Lesson 1 opening

Created: 2026-10-09. Updated: 2026-10-09 (round 3, with two fixes as v04). Status: playable mockup on a branch; owner review pending. Not published.

Question: does the opening tell one life clearly? Since round 3, also: does Sam's story read like the Explore chapter, and does changing one of his choices show that every gray line is a life he could have lived?

The mockup plays the new start of Lesson 1 from beginning to end. First the cover. Then Sam's life grows fork by fork along an age line, from birth to 41, drawn the way the Explore chapter draws a life. At the end the reader can change one of his choices and watch a different life grow from that fork. Then "Choices add up". Then the stage fades into the first beat of Alfredo's hike. It uses the lesson's own header, chapter trail, stage, narration column and styles, the same seed and path engine for the cover, and the Explore chapter's drawing and tree, so it looks like the lesson. Only the opening plays: the chapters after the hike are shown but can't be opened.

Related: [product 013](../../../product/013-choices-guided-journey.md) (the guided journey), [product 003](../../../product/003-visual-language-and-navigation.md) (visual language), [002 v03 — Stage build](../../002-site/v03-stage-build/README.md) (the cover this opening starts from), [v12 — Maya figure](../v12-maya-figure/README.md) (the round before this one).

## Run it

```sh
npm run dev:prototype -- --host 127.0.0.1 --port 4638 --strictPort
```

Open <http://127.0.0.1:4638/prototype/lesson1-opening/>.

- Press **Watch the paths grow** on the cover. Then Sam's story plays by itself.
- **Space** or **Pause** holds the story. **→**, or a click on the map or the lines, plays the next step (while paused, one step plays and holds). **Next** lands the whole story at once (300 ms), then moves on. **Back** and **←** go back a beat.
- At the end, the card on the map offers **Change one of his choices**. Then the five forks Sam could have taken differently get a ring, and their gray choices become buttons. A gray choice can also be tapped straight away. **Try another choice** goes back to the five forks; **Back to Sam's life** or **Escape** puts his life back as it was. **Next** goes on to "Choices add up" with his real path.
- The **Mockup** bar under the stage switches the pace (**Normal**: 900 ms pauses, 1300 ms after events; **Quicker**: 700 and 1000 ms) and replays the story.
- The address keeps the pace: `?pace=quick`. `#paths-life` opens the finished story, `#paths-adds` the next beat and `#hike-plan` the hike.

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
- In "Choices add up", three labels mark the guitar (His choice), the radio play (Luck) and the split (Not his choice). The gray choices' labels step back there, so the three have room; their lines stay.
- Into the hike: the gray lines, the labels and the age axis fade first (320 ms). Sam's route stays alone. At 700 ms the hike scene and its words come in, as the route fades.
- With reduced motion, the finished story shows at once, and the beats change without travel.

## Checks

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
- **The narration** is a compact list. Below 990 px wide it runs in two columns under the map, and so does a changed life's list. Beside the map, a changed life's list scrolls to its newest event when the column is short (see Checks), with the top edge faded.
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
- `life.js`: Sam's steps, the choices he didn't make, the timing and the player.
- `life-map.js`: Sam's life in the Explore chapter's drawing, with the labels, the end card and the changed lives. A study copy of the drawing and label code in `src/lessons/choices/journey-explore.js`.
- `explore-tree.js`: a study copy of the explorer's life tree (`createLifeTree` in `src/lessons/choices/journey-explore.js`), which grows a life from one of Sam's forks and can take its step labels from elsewhere and leave some out (the what-if's third-person words).
- `map.js`: a study copy of `src/lessons/choices/journey-map.js`, with the cover's field, its fade and the "Choices add up" labels.
- `opening.css`: the rules added to `src/lessons/choices/journey.css`.
- `copy.json`: the words, including the what-if's third-person labels (`opening.whatif.step.*`).

It imports `src/engine/` (the path network and renderer) and `src/lessons/choices/` (the hike, the life choices, the motion helpers and the styles) without changing them.
