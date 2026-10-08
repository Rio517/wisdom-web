---
name: wisdom-design
description: Use when designing or changing ANY Wisdom UI: pages, components, CSS, Canvas or SVG drawing, layouts. The site's tokens, motifs, hard rules and what not to do.
---

# Wisdom design

Calm field guide: near-white page, flat, quiet. Code wins over older docs.

## Tokens (`src/styles/tokens.css`; use the names, no new hex)
- `paper` page; `index` sidebar; `paper-deep` bands; `ink` text; `quiet` secondary text; `rule` hairlines.
- `forest` lived route, current state, links, buttons; `forest-deep` hover.
- `sage` futures, list markers; `mist` untaken, inactive.
- `lake` focus ring only (3px, offset 3px).
- `sun` draft notices; `clay` closed or lost paths.
- `*-soft` tints: backgrounds only.

## Type
- `font-field` (Iowan Old Style, Palatino, Georgia): headings (weight 500), prose (`.prose` 20px/1.62, 68ch), ledes.
- `font-guide` (Avenir Next, Segoe UI): UI, labels, buttons (600). No web fonts.
- Idioms: sentence case, left-aligned, tight negative tracking on big headings, small `.kicker` above titles.

## Controls and spacing
- Touch targets: 44px minimum (menu, nav rows), `.btn` 50px pill; small chips 34-36px at most.
- Pills (radius 999px) for buttons; 10-30px radius for cards and bands. 1px `rule` borders.
- Page: max 1240px, padding `clamp(28px, 5vw, 72px)`; sidebar 272px, drawer up to 320px.
- Tailwind for layout; custom CSS for small exceptions; Canvas/SVG draw diagrams.

## Motifs
- Life map (Canvas, flat, uniform stroke per route): lived route dark green (`forest`), futures light green (`sage`), untaken faint gray (`mist`); Today is a dashed vertical divider, not a barrier.
- Chapter trail: `.chapter-trail`, `#trail-base` dotted `mist`, `#trail-done` solid `forest`, `.chapter-stop`.
- Sidebar `.site-nav` collapses (remembered per browser); on tablets and inside the lesson it is a drawer (`data-mode="drawer"`, `.nav-opener`) with focus trap, Escape, focus return.
- Hike map: `.hike-map .trail-walked` / `.trail-closed-seg`.

## Hard rules
- WCAG AA contrast; visible focus; every control works by keyboard.
- Each interactive diagram has a static alternative and `prefers-reduced-motion` support (same settled state, no travel).
- Targets: desktop and iPad mini. Phone deferred.
- No user-facing prose in code. Words live in `src/i18n/messages/*.json` (en, es, de, fr change together). Recheck German layouts after copy changes.

## Do not
- Shadows, bevels, volume gradients or shaded dots on the map; numbers in path dots or endpoint badges; rough penwork, paper texture, watercolor washes, ornamental frames.
- Grids of decorative cards, confetti, glow, sparkles, ambient particles, theatrical zoom.
- Loops or backward curls in routes; color alone as meaning.
- Hardcoded age coordinates; synchronized waves in the path field.
- Invented palettes; Inter, Source or other web fonts.

## Pointers and verifying
- Tokens: `src/styles/tokens.css`. Look: `docs/product/003-visual-language-and-navigation.md`. Records: `docs/design/README.md` (`002-site/v01-launch`, `001-choices-explainer/v09-guided-journey`).
- Render at 1440x900, 1024x768 and 768x1024 before calling UI done, then dispatch `.claude/agents/design-reviewer.md` for a fresh-context review.
