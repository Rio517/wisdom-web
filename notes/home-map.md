# home-map notes

The relay returned HTTP 403 from this cloud container, so notes go here instead.

## 1. Hello

hello from home-map

## 2. Deliverable 3 is ready (the round)

The relay returned 403 again, so this note is here.

Three playable directions for the home page and the lesson cover are on `agents/home-map`:
- A · Stage
- B · Left third
- C · Words into dots

Each has a Home view and a Lesson cover view. Run `npm run dev:prototype`, then open http://127.0.0.1:4602/prototype/directions/. The toolbar at the bottom left switches between the views; Reset plays the animation again.

The README has each idea in two lines, the trade-offs, the frame numbers, and captures (before, mid and settled, at 1440×900 and 2560×1440, plus today's home as the baseline): `docs/design/002-site/v02-directions/README.md`.

The fresh-context design reviewer would defend **A** (calmest; scales best to large monitors). B's slide is its weakest moment. C is the most memorable, but about 40 moving dots is the least calm.

Until a direction is picked, its new words live in `prototype/directions/copy.json` (title "A life can go many ways.").

## 3. Closing report

### What I built
1. **Shell** (a6522a7, plus review fixes):
   - The index draws one line through the lesson circles, centre to centre. Each row draws its own piece, so it measured exact at 1×, 1.5× and 2×.
   - Planned lessons in the index and the home roadmap are buttons with a popover. It opens on hover, focus and click; Escape and an outside click close it. The words are short (`site.soonTip.*`, in all four catalogs).
   - Play again is removed.
   - Shell text is at least 15px, and descriptive body text at least 19px.
   - The planned-lesson numbers now use the `quiet` token, which passes AA.
2. **Path field** (d1fe799):
   - New lab controls, with the owner's settings kept as the base: Fan-out 0.85, Middle forks 0.5, Big later forks 0.25 from age 8, and a separate Top and bottom fade 0.16.
   - The field keeps splitting through life, fans past the top and bottom, and fades there. It is still seeded, lines still never cross, and the route states are unchanged.
   - Generation went from about 450 ms to about 150 ms (one point per line per year, not one per fork event).
   - The circles are fixed. The pulse ring could get a negative radius, which threw an error and froze it. The traveller's halo is gone.
   - Before/after captures are in the round folder.
3. **Directions** (700f8d6, plus review fixes): `prototype/directions/`. Each one uses the real engine and `journey-map.js`, the real tokens, the site CSS and the drawer. All work by keyboard and with reduced motion.
4. **Doors that open** (e51044c): on the map's "not everything is yours to choose" step, three closings alternate with three openings (`map.opened.*`, in all four catalogs).

### Simplified, or outside my files
- I edited three engine tests in `tests/`, which isn't on my file list. They pinned the exact generator options, config and label font that the owner's feedback changes. They only pin values; no behaviour is weakened.
- The lesson cover's own layout (the right-hand narration panel) lives in `journey.css`, which the lesson session owns. The "centred, lots of space" cover exists only in the prototypes until a direction is picked.
- The lesson map's beat text still says "Lines split, bend and cross", but lanes never cross. That copy belongs to the lesson session; I suggest "Lines split and bend."
- The prototype drawer has no language switcher. The site's drawer does.

### Known issues
- **Frame budget not met.** At 1440×900 with 4× CPU throttling (median of 3 runs), each run has 4–7 frames over 33 ms, the longest 50–83 ms. The 95th percentile is 16.8–33.3 ms. Every main-thread task is under 5 ms; the slow frames are the click frame and the grow's first frame, when the canvas is first uploaded. This headless Chromium composites in software. The full table is in the README.
- **Growth time.** The paths are fully grown 2.6–2.9 s after the click (by the clip transition); the grown state is flagged at 2.8–3.2 s.
- **Lesson cover edge.** It keeps the owner's 0.04 right-hand fade, so the line ends still stand as a wall there. The directions use 0.16.
- **Fewer openings on small screens.** At 1024×768 the map fits two openings next to three closings.
- **Sidebar overflow (pre-existing).** At 1440×900 the language list sits just below the fold of the sidebar.

### Checks
- `npm test`: 240 pass. `npm run build`: 25 pages.
- Screens at 1440×900, 1024×768, 768×1024 and 2560×1440.
- Keyboard-only runs through the menu, the popover and each direction in both views. Focus moves to Start lesson 1 or Next after the click, and Escape closes the drawer.
- Reduced motion jumps straight to the settled state.
- One design-review round. No blockers; all six should-fix items are fixed.

### Waiting
Once the owner's pick arrives, I'll build it into the site: the home page, and the lesson cover's map with the lesson session's agreement on `journey.css`. The words move into the four catalogs at the same time.
