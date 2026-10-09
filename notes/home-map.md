# home-map notes

## Closing report: direction A built

The full record (deviations, review round, numbers, captures) is in `docs/design/002-site/v03-stage-build/README.md`. The corrected prototype A settled shots are `docs/design/002-site/v02-directions/dir-a-home-3-settled-{1440,2560}-v02.png`.

### What changed
- **Merge.** The branch was brought up to date with `origin/main`. It was a fast-forward, with no conflicts.
- **Home** (`src/pages/[...locale]/index.astro`, plus a new `stage` mode in `src/layouts/SiteLayout.astro`):
  - No sidebar. A top bar with the Index button (it opens the existing drawer), the brand and About.
  - A's stage: one sentence over a faint field. "Watch the paths grow" lifts the words away (690 ms), the paths grow out of the Beginning (2.2 s), and one life travels to Today. Then a short line and Start lesson 1 appear, and focus moves there.
  - Below the stage: the lesson, the roadmap, and one line for grown-ups.
  - The old hero, lesson card, chapter stops and grown-ups band are removed, along with 16 unused `home.*` keys.
- **Lesson cover** (`journey.js` and `journey.css`, cover step only):
  - The first step takes the full width, with the question over the faint field.
  - Begin (or →) lifts the words and grows the paths. Then the narration panel arrives, with focus on Next.
  - Back (or ←) returns to the cover, with focus on its heading.
- **Words.** A's words are in all four catalogs (`home.*`), in the narrator's voice. The cover uses its existing `map.cover*` and `lesson.beat.cover.*` keys.
- **Shared helper.** `src/components/stage-field.js` holds the Beginning origin for the grow and the faint field, which is a still image.
- **Map performance** (`journey-map.js`, `lab-renderer.js`):
  - Sizes come from layout size, not the on-screen box.
  - The Today canvas is painted in a quiet moment after load.
  - A resize repaints on an idle moment.

### Deviations from A
1. **Cover narration.** It arrives in the lesson's right-hand panel, not A's bottom card, because every later step uses that panel.
2. **Edge fade.** The lesson map's right-hand fade is 0.24, so the line ends no longer stand as a wall beside the panel. The home stage uses 0.16, as A does. The lab default stays at the owner's 0.04.
3. **Roadmap.** The home roadmap keeps each lesson's summary, and the page keeps the site footer.
4. **→ key.** It also plays the cover animation.
5. **Cover kicker.** It uses the lesson's kicker style.
6. **Pulse ring.** The Beginning dot keeps its quiet pulse ring before the click.
7. **Cover header.** The cover keeps the lesson's own header (round menu button, trail, Read as text).

### Numbers
- **Frame budget.** Production build at 1440×900 with 4× CPU throttle, three runs each.
  - Home: 95th percentile 16.8 ms; 1–2 frames over 33 ms, the longest 33–67 ms, around the click.
  - Lesson cover: 95th percentile 16.7–16.8 ms; 0–1 frames over 33 ms, the longest 33–50 ms.
  - Every main-thread task during the grow was under 5 ms.
  - After the grow, the home page's travel stays at 50 ms or less per frame (it was 530–600 ms before this round). The cover has one 370–430 ms idle repaint once the narration panel has slid in.
- **Tests and build.** `npm test`: 240 pass. `npm run build`: 25 pages.
- **Captures.** 72 captures (home and cover; before, mid and settled; 1440×900, 1024×768, 768×1024, 744×1133 and 2560×1440; en and de, plus es and fr at 1440). No page errors.
- **Keyboard and reduced motion.** Keyboard-only and reduced-motion runs pass on both pages, including the drawer (focus trap, Escape, focus return).

### Design review
I ran one round.
- **Blocker, fixed.** Back could return to a cover with no words. Checked four times since: the words and the focus come back every time.
- **Should-fix items, all fixed.**
  - ← focus.
  - A blank field with a hairline box on the first paint on large monitors.
  - New raw hex values.
  - Two unlisted deviations, now listed.
- **Polish.** The settled buttons now clear the axis labels.
- **Left as is.** The shared inline footer padding. Also the two labels "Start lesson 1" and "Start the journey", which lead to the same place; which should win is a voice question for the owner.
- **Not run.** No second review round. The fixes were checked by script and by screenshot.

### The lead's two points
1. **The right-hand wall.** It came from the owner's 0.04 fade. The lesson map now uses 0.24; the lab default is unchanged.
2. **The 400 ms frame as the narration arrives.** The repaint is now deferred to an idle moment after the panel animation, so it no longer falls inside an animation. It still happens once, and it is documented.

### Known issues
- The frame budget is not strictly met: the home page has a 50–67 ms frame at the click, and the cover has one long idle repaint after the grow. This headless Chromium composites in software, so a real GPU should do better; that is untested.
- If someone clicks within about a second of loading, before the faint field's still copy exists, the grow starts without its circle animation.
- `prototype/directions/copy.json` still holds A's words for the prototypes.

CLOSE wisdom-03wc0o
