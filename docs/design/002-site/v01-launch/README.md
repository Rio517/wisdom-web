# v01 — Launch

Created: 2026-09-27. Status: implemented locally in Astro; owner review pending; not published.

Question: does the first complete site carry the approved field-guide aesthetic into a home page, a lesson overview and the supporting pages, at desktop and iPad sizes, without changing the approved lesson?

Sources: `src/pages/`, `src/layouts/`, `src/components/SiteNav.astro`, `src/styles/site.css`, `src/styles/nav.css`, `src/styles/tokens.css`, `src/data/site.js`. The prose pages come from `src/pages/choices/notes.md` and `src/pages/about.md`. These are code-rendered captures of the production build (preview on port 4601), not generated images.

## Design choices

- **Same visual language as the lesson.** Near-white paper, Iowan Old Style/Palatino for headings and reading, Avenir Next for interface text, forest and sage accents, flat surfaces. The tokens are shared with the lesson through `src/styles/tokens.css`.
- **The signature moment on the home page.** The hero plays the lesson's opening on the approved path field (the paths grow from the beginning dot, then a traveller walks to Today), without labels. Reduced motion shows the settled state. "Play again" replays it.
- **A quiet index (003).** The sidebar lists Lesson 1 and its pages. Planned lessons are shown greyed as "In preparation", without links. About, research and source code sit in a separate utility area. The sidebar can be hidden (remembered per browser); on tablets and inside the lesson it becomes a drawer with focus trapping, Escape and focus return.
- **Numbered where the content is a sequence.** Lesson numbers (01–06) and chapter numbers are real reading orders.

## Current review images

Desktop (1440 × 900): [home](home-desktop-v01.png) · [home, full page](home-full-desktop-v01.png) · [lesson overview](lesson-overview-desktop-v01.png) · [lesson overview, full page](lesson-overview-full-desktop-v01.png) · [lesson](lesson-desktop-v01.png) · [index open inside the lesson](lesson-index-open-desktop-v01.png) · [text version](read-desktop-v01.png) · [notes for grown-ups](notes-desktop-v01.png) · [about](about-desktop-v01.png) · [404](not-found-desktop-v01.png)

Small desktop (1180 × 820): [home](home-small-desktop-v01.png)

iPad mini landscape (1024 × 768): [home](home-landscape-v01.png) · [index drawer](index-drawer-landscape-v01.png)

iPad mini portrait (768 × 1024): [home](home-portrait-v01.png) · [lesson overview](lesson-overview-portrait-v01.png) · [lesson](lesson-portrait-v01.png)

## Review loops

1. First desktop pass. Removed the Astro dev toolbar from review, balanced the hero headline onto two lines, pinned the lesson status to the top of its card, and tightened the space above the footer.
2. Tablet and narrow-desktop pass. The drawer showed the desktop "hide" chevron instead of a close button; both icons now switch with the index mode. The hero map was squeezed into a tall panel at around 1180 px, so the hero now stacks below 1280 px.
3. Built-site check (preview 4601):
   - Every route returns 200 and unknown paths get the styled 404.
   - The journey's key interactions work from the built files.
   - The home hero finishes, and all home-page links resolve.
   - The port guard refuses out-of-range ports and non-local hosts.

## Limits

Browser emulation only: no physical iPad, Safari or screen-reader session. Fonts are the system stacks the lesson was approved with; packaging web fonts for Windows and Android readers is an open decision. The research links in the prose pages point to GitHub and will only resolve once the research files are pushed.
