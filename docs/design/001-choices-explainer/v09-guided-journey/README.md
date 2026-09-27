# v09 — Guided journey

Created: 2026-09-26. Status: local implementation; owner review pending. Not published.

Question: does a guided, animated journey explain the lesson better than v08's static map with changing text cards? The journey runs big picture → Alfredo's hike → Maya's two paths → a ten-afternoon game → takeaways.

Sources: [product 013](../../../product/013-choices-guided-journey.md), [editable copy Draft 03](../../../content/choices-journey.md), live source [journey.html](../../../../prototype/journey.html) with `prototype/journey-*.js` and `journey.css`. These are code-rendered browser captures, not generated images; no image prompt is involved. The path engine, path lab and v08 lesson are unchanged.

Live: <http://127.0.0.1:4600/prototype/journey.html>. Every step has a URL, for example `#hike-closed` or `#skills-builds`.

## Round two — owner feedback applied (current)

The owner's second set of notes (2026-09-26):
- Remove the illustration disclaimer line.
- Drag to sort, with Skip.
- Label real choices on the map.
- No Next button in the game: a vertical feed with the days on the right, and past days editable.
- Merge the travel and ahead beats, and tighten the Many-paths copy.
- A fun, interactive life-path explorer with example choices.

These are refinements to the same review question, so they stay in this round.

Desktop: [Many paths v02](many-paths-desktop-v02.png) · [Choices on the map](travel-choices-desktop-v01.png) · [Closed paths with reasons v02](outside-control-desktop-v02.png) · [Dragging a card v02](hike-sort-drag-desktop-v02.png) · [Sorting in progress v02](hike-sort-retry-desktop-v02.png) · [Game feed with day rail v02](game-feed-desktop-v02.png) · [Game end card v02](game-end-desktop-v02.png) · [Explore start](explore-start-desktop-v01.png) · [Explore with hover preview and a closed option](explore-preview-desktop-v01.png) · [Explore: whole life at 70](explore-end-desktop-v01.png)

Landscape: [Choices on the map](travel-choices-landscape-v01.png) · [Sort v02](hike-sort-landscape-v02.png) · [Game feed v02](game-feed-landscape-v02.png) · [Explore](explore-landscape-v01.png)

Portrait: [Choices on the map](travel-choices-portrait-v01.png) · [Sort v02](hike-sort-portrait-v02.png) · [Game feed v02](game-feed-portrait-v02.png) · [Explore](explore-portrait-v01.png)

Round-two work split:
- Two Sonnet workers built the drag-sort component (`journey-sort.js/.css`) and the game feed (`journey-play.js/.css`, `replayChoices`) in separate files.
- I built the map labels, the explorer (`journey-explore.js`, `journey-choices.js`) and the integration.
- Visual loops:
  - Explorer: an interval layout to stop look-ahead branches crossing, chips placed above their lines and nudged apart, collision-aware canvas labels, a gentler path swing, zoom that adapts to stage width, and a start at age 3 with family-chosen options.
  - Sort: a wider centre column and a working narrow-width rule.
  - Game: today's card answers on the first tap, and the end card is styled.
  - Shorter trail labels.
- An independent Sonnet QA pass across all three sizes found no bugs; one defensive guard was added after it noted a transient dev-server error.

## Round one images



Desktop (1440 × 900):

- [Cover](cover-desktop-v01.png) · [Many paths](many-paths-desktop-v01.png) · [Ahead, with callouts](ahead-desktop-v01.png) · [Outside your control](outside-control-desktop-v01.png)
- [Hike: halfway choice ("keep going" feedback)](hike-halfway-choice-desktop-v01.png) · [Practice loops and backpack](hike-practice-desktop-v01.png) · [Trail closed, ranger](hike-closed-desktop-v01.png) · [Waterfall response](hike-respond-desktop-v01.png) · [Control sorting board](hike-sort-desktop-v01.png)
- [Maya: fork](skills-fork-desktop-v01.png) · [Learning builds on learning](skills-builds-desktop-v01.png) · [Basketball head start](skills-transfer-desktop-v01.png) · [Never too late](skills-never-late-desktop-v01.png)
- [Game intro](game-intro-desktop-v01.png) · [An afternoon, with a boost](game-day-desktop-v01.png) · [Summary](game-summary-desktop-v01.png) · [What carries over](game-transfer-desktop-v01.png)
- [Takeaways](takeaways-desktop-v01.png)

iPad mini landscape (1024 × 768): [Ahead](ahead-landscape-v01.png) · [Trail closed](hike-closed-landscape-v01.png) · [Never too late v02](skills-never-late-landscape-v02.png) · [Game day](game-day-landscape-v01.png)

iPad mini portrait (768 × 1024): [Travel](travel-portrait-v01.png) · [Sorting board](hike-sort-portrait-v01.png) · [Learning builds v02](skills-builds-portrait-v02.png) · [Game day](game-day-portrait-v01.png)

Superseded within this round: `skills-never-late-landscape-v01.png` and `skills-builds-portrait-v01.png` clipped the growth badges on tablets. v02 corrects this with smaller calendar squares and rebalanced columns.

## Review and improvement loops

1. First full pass at desktop size. Fixes:
   - Aligned the chapter trail stops with the drawn trail.
   - Painted the overview from the same base network as the traveller, so the dark route lines up with its lines, and removed stray fan crossings.
   - Removed a duplicate Today label.
   - Made the hike walkers larger and kept their scale separate from the bob animation.
   - Redrew the waterfall and the practice loops, and moved the rock and ranger so labels don't collide.
   - Extended the ground past the frame to remove a seam.
2. Moved the sort off the text column onto a two-bin card board on the stage. Walkers return home after practice. Redesigned Maya's chapter:
   - A fork from one Maya.
   - Per-season growth badges (a little / more / a lot).
   - Clearer striped head starts.
   - Non-overlapping "helped by" notes.
3. Honesty fix: in "never too late", Path B visually overtook Path A only because A was frozen, so now both Mayas practise basketball. Also:
   - Made the game panel compact so energy stays visible.
   - Added a cover question on the empty opening stage.
   - Tightened the takeaways.
4. Tablet pass:
   - Hid the map scene on non-map chapters (its caption was leaking through).
   - Compact lanes in landscape and portrait.
   - In portrait, the game's skill boxes sit side by side under the day card.
5. Independent QA (Sonnet) stress-tested interrupted animations, keyboard, history, reduced motion, the no-JS reading and the compiled preview. It fixed a duplicated tab title. Its three notes were addressed afterwards: `aria-pressed` on all game options, tablet growth badges keep a short word, and resize during the traveller animation no longer resets the drawing.

## Limits

- Browser emulation only: no physical iPad/Safari check, screen-reader session or child comprehension test.
- The skill model and branch geometry are illustrations, not measurements or forecasts.
- Copy and structure follow the owner's 2026-09-26 direction but depart from several earlier rules, which are listed in [013](../../../product/013-choices-guided-journey.md#changes-to-current-rules-that-need-owner-approval).
