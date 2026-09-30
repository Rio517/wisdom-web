# Current state and next steps

## Current state

**The site is deployed.** On 2026-09-27 the owner approved the guided journey as Lesson 1 and asked for the main site. It is an Astro static site at the repository root. `main` deploys to GitHub Pages through `.github/workflows/deploy.yml` (tests, build, deploy), with the custom domain `wisdom.knyflores.com` set in the Pages settings. Every route was verified from GitHub's Pages servers.

**Live at <https://wisdom.knyflores.com/>** since 2026-09-30. The Namecheap `CNAME` (`wisdom` → `rio517.github.io.`) is in place; GitHub issued the certificate (expires 2026-12-29, renewed automatically) after the custom domain was removed and re-added, and HTTPS is enforced, so `http://` redirects.

| Page | Local URL |
| --- | --- |
| Home | <http://127.0.0.1:4600/> |
| Lesson 1 overview | <http://127.0.0.1:4600/choices/> |
| Lesson 1 journey | <http://127.0.0.1:4600/choices/the-paths-we-make/> |
| Text version | <http://127.0.0.1:4600/choices/the-paths-we-make/read/> |
| Notes for grown-ups | <http://127.0.0.1:4600/choices/notes/> |
| About | <http://127.0.0.1:4600/about/> |
| Spanish, German, French | <http://127.0.0.1:4600/es/>, <http://127.0.0.1:4600/de/>, <http://127.0.0.1:4600/fr/> (same paths below each) |

**Languages (2026-09-30):** the site is internationalized ([014](docs/product/014-languages.md)). English is the source. Spanish, German and French are AI-drafted translations that the owner published on 2026-09-30 without native review; the language switcher (sidebar, footer, lesson drawer) links all four. The i18n work was deployed on 2026-09-30 (`19c6854`), together with a separate commit (`33078e8`) adding the dev-only Dialecto in-context editor (`tooling/dialecto-in-context.mjs`, inert unless `DIALECTO_URL` and `DIALECTO_REPO` are set).

Design records:
- Site shell and home: [002 — Site, v01 — Launch](docs/design/002-site/v01-launch/README.md).
- The lesson: [001, v09 — Guided journey](docs/design/001-choices-explainer/v09-guided-journey/README.md).

Architecture and routes: [002 — Delivery architecture](docs/product/002-delivery-architecture.md#implementation-2026-09-27). Languages and catalogs: [014](docs/product/014-languages.md). Lesson structure: [013](docs/product/013-choices-guided-journey.md). The live words are in `src/i18n/messages/en.json`; the readable lesson copy, including the 20 life-map story sets, is [choices-journey.md](docs/content/choices-journey.md) (regenerate with `npm run copy:lesson`).

Lesson 1 has six chapters:
1. The life map, with coherent story sets of example choices.
2. Alfredo's hike, with the drag-to-sort board.
3. Maya's two paths.
4. The ten-afternoon game.
5. The life-path explorer.
6. Takeaways.

The home page shows the lesson roadmap. Lessons 02–06 are listed as "in preparation" without pages or links, following the brief's rule against empty lesson pages.

The shared path engine is `src/engine/`, and the lesson code is `src/lessons/choices/`. The earlier studies under `prototype/` (lesson study, `choices.html`, `path-lab.html`) import the same engine and still run on their own ports. Preserve the approved drawing.

The [lesson roadmap](docs/README.md#lesson-roadmap) remains the canonical index: 01 choices and their effects; 02 habits and daily practice; 03 how we make choices; 04 what makes a happy life; 05 relationships; 06 how to learn. Preserve the later decision-making research leads there without researching them now.

The public repository is [Rio517/wisdom-web](https://github.com/Rio517/wisdom-web), with local work on `prototype/choices-map`. The worktree contains substantial uncommitted code, documentation and design changes; preserve them.

## Immediate next work

1. **Owner review of the site** at the URLs above and the [v01 captures](docs/design/002-site/v01-launch/README.md), including the i18n change before it is committed.
2. **Keep translations in step:** any change to English text updates all four catalogs in the same change (`npm test` enforces parity); recheck German layouts afterwards.
3. **Domain protection (optional):** verify `knyflores.com` in GitHub account settings (Pages → verified domains) so no other account can claim the subdomain.
4. **Reader testing** near age eight and with older readers. Can they connect earlier learning to a later possibility, separate preparation from guaranteed outcomes, and name something outside Alfredo's control? Does the game read as "practice plus rest builds skills" rather than "never have fun"?
5. **Lesson 02, Habits and daily practice**, is next. It gets a page and navigation link only when its content is complete.

Open decisions: whether to use regional language variants (see 014), packaging web fonts (the site uses the approved system font stacks, which fall back to Palatino/Georgia and Segoe UI on non-Apple devices), a phone layout (deferred), and whether to retire the `prototype/` studies once the site is published.

## Run and verify

The package requires Node 22.12 or newer. The stack is Astro 7 (Vite 8), compiled Tailwind 4, Canvas 2D and plain JavaScript modules.

```sh
npm ci
npm run dev        # site on http://127.0.0.1:4600 (Astro runs it in the background; `npx astro dev stop` stops it)
npm test
npm run build      # static output in dist/
npm run preview    # built site on http://127.0.0.1:4601
npm run dev:prototype   # earlier studies on http://127.0.0.1:4602/prototype/
```

All servers stay in **4600–4699** on `127.0.0.1` and fail rather than move; `tooling/ports.js` holds the shared guard used by both configs.

Verification on 2026-09-30 (i18n): 240 Node tests and the Astro build (25 pages) pass. In the browser, all four languages were checked at 1440×900, 1024×768 and 768×1024: every page, all 20 lesson steps, the game and the explorer, with no raw message keys, clipped text or console errors. The built preview confirmed the language-aware 404 and, before publication, the draft gate.

Verification on 2026-09-27:
- 225 Node tests pass, and the Astro build produces 7 pages.
- **Built site, on preview 4601:** every route returns 200 and unknown paths get the styled 404. The home hero animation completes, and all home-page links resolve.
- **Lesson from the built files:** map labels, hike choice, sort Skip, game auto-advance and an explorer step work.
- **Index:** the desktop sidebar collapses and the choice is remembered. On tablets and inside the lesson, the drawer traps focus, closes with Escape and returns focus.
- **Layouts** reviewed at 1440×900, 1180×820, 1024×768 and 768×1024.
- **Port guard:** refuses 4700 and non-local hosts.
- The full browser QA of the lesson was last run on 2026-09-26 (two independent passes). The lesson code has since moved to `src/` but is otherwise unchanged.

## Review limits

The audience remains ages 8+; desktop and iPad mini are the viewport targets, with phone design deferred. Browser screenshots do not establish physical-device behavior, reader comprehension or complete accessibility. The research is focused, not exhaustive; consult each ledger record before strengthening a claim.

## Documentation rules

Keep this file about current state and next actions. Put history in [COMPLETED.md](COMPLETED.md). Use the [documentation index](docs/README.md) for lesson navigation and the [research library](docs/research/README.md) for canonical findings. Keep proposal IDs and filenames stable, label unapproved ideas, and preserve the registered design-study structure.
