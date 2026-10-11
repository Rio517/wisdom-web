# opening-r5 notes

## Hello

hello from opening-r5. Branch agents/opening-r5 from 72d8ffe. The relay was not reachable from this VM (403), so notes go here.

## Deliverables 1 and 2 pushed (d842be5)

- `sweep.mjs` committed; today's numbers are in the README's Round 5 section. At 1133×744, 6 of 10 lives scroll while playing (up to 76 px) and 3 end too long; at 1366×657, 9 of 10 scroll (up to 87 px); at 1440×900, seven lives end with three sizes (18/15/14).
- "Choices add up": Theo at 1133×744 and Leo at 1280×800 show 2/3. Lena and Omar at 744×1133 already show 3/3 on this branch's store. The sweep also finds 14 cases of a chip sitting over another step's dot.
- Five list options drawn (`opening-list-option-{a..e}-v01.png`). Pick: E, which is A kept to one size where the whole story fits, and otherwise older rows shorten to their label at most 1 px smaller.
- WebKit could not be installed on this VM: the network policy blocks Playwright's download hosts. The sweep runs in WebKit with `--engine webkit` on the Mac.

## Deliverables 3 to 5 pushed

- Built pick E. The sweep shows 0 scroll, 0 overflow and 0 rows out of view in all 60 runs (10 lives × 1133×744, 1366×657 and 1440×900 × both paces), with at most two sizes, never more than 1 px apart.
- "Choices add up": 3/3 with no clash in all 70 cases (7 sizes × 10 lives).
- Fixed on the way: with reduced motion at 744×1133, leaving the cover drew the life for the cover's taller stage (the route was mostly off the map). The same bug is in 72d8ffe.
- Layouts per arriving line: 6.4 → 1.3 (Theo, 1133×744). This VM can't judge the 16.7 ms task budget: its timings swing by 10×. Please re-run `sweep.mjs --budget` on the Mac.
- WebKit was not run (no download access here).
- Next: deliverable 6, the cover to the story without a redraw.

## Deliverable 6 pushed: the cover to the story

- At 990 px and wider the stage keeps its full-width box from the cover on. The card takes its story shape by an animated clip-path, and the column slides in 40 px over the map's right part (500 ms).
- The field is never re-fitted or redrawn (`#map-base` bitmap changes 2 → 0), the stage box never changes, and Born moves 0 px. Back to the cover changes no canvas.
- The landed layout matches 72d8ffe to the pixel (card edge, column position and width) at five sizes. Born is 10–13 px further right because it keeps its cover position.
- Frame budgets can't be judged on this VM: headless draws at about 15–20 fps even at rest. Please run `sweep.mjs --cover --sizes 1440x900,1920x1080` in Chromium and WebKit on the Mac.
