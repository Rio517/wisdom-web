# v05 — Lesson 2 links

Created: 2026-10-18. Updated: 2026-10-18. Status: built on a branch; review pending; not published.

Question: with Maya's chapter moved to Lesson 2, does Lesson 1's ending (two takeaways, the line that points ahead and a button to Lesson 2) look intended at laptop and iPad sizes, and do the menu and the home roadmap list the seven lessons in their new order, with Lessons 1 and 2 open?

Related: [013 — Guided journey](../../../product/013-choices-guided-journey.md), [016 — Lessons two to four](../../../product/016-lessons-two-to-four.md), [003 v04 — Lesson 2 build](../../003-lesson-two/v04-practice-build/README.md). Sources: `src/lessons/choices/journey.css` (the two-card band and the cropped portrait map on the last step), `src/lessons/choices/journey.js` (the end buttons and `cropEndingMap`), `src/data/site.js` (the lesson order), `src/components/SiteNav.astro` (the menu), `src/pages/[...locale]/practice/index.astro` (Lesson 2's overview page). Captures: WebKit (Playwright 1.62.1) against the compiled preview.

## Lesson 1 takeaways

| Size | Image |
| --- | --- |
| 1440×900, English | [l1-takeaways-1440x900-en-v01.png](l1-takeaways-1440x900-en-v01.png) |
| 1133×744, English | [l1-takeaways-1133x744-en-v01.png](l1-takeaways-1133x744-en-v01.png) |
| 744×1133, English | [l1-takeaways-744x1133-en-v01.png](l1-takeaways-744x1133-en-v01.png) |
| 744×1133, German | [l1-takeaways-744x1133-de-v02.png](l1-takeaways-744x1133-de-v02.png) (current) · [v01](l1-takeaways-744x1133-de-v01.png) (map shortened evenly; its labels crowd) |
| 744×1133, French | [l1-takeaways-744x1133-fr-v01.png](l1-takeaways-744x1133-fr-v01.png) |

Beside the map, the two takeaways share the band in halves with a rule between them. In portrait the map on this one step keeps only the range the life uses, at the same scale, so its labels sit as they do on the steps before. The stage drops the empty bands above and below the life, only as much as the words and the three buttons need to fit without scrolling the page. The English 744×1133 v01 still shows the earlier, evenly shortened map.

## Menu and home

- The menu inside Lesson 1, iPad landscape: [menu-open-1133x744-en-v01.png](menu-open-1133x744-en-v01.png).
- The menu on a Lesson 2 page, with its group open: [menu-open-lesson2-1133x744-en-v01.png](menu-open-lesson2-1133x744-en-v01.png).
- The home roadmap, desktop: [home-roadmap-1440x900-en-v01.png](home-roadmap-1440x900-en-v01.png).
- Lesson 2's overview page `/practice/`, desktop: [practice-overview-1440x900-en-v01.png](practice-overview-1440x900-en-v01.png).

## Checks

- Fit sweep (`tooling/fit-sweep.mjs`, four languages, eight sizes): Lesson 1 has 65 failing cells of 416, against 74 on `main` without the Skills steps. The ending fails in one cell (a 13 px label in German at 1024×768, as on `main`) and no longer scrolls the page in portrait. Lesson 2: 37 of 448, all page scroll in portrait, none in landscape (unchanged).
- Copy check (`copy.mjs`, desktop and `--phone`) on the home page, both lessons, their text versions and overview pages: no failure that the branch's base did not already have.
