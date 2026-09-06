# Storyboard generation prompts

Selected outputs and their review limits are linked from the [storyboard index](README.md).

Mode: built-in ImageGen. The prompts below are exact inputs. Versioned images are review artifacts, not working interfaces. Generated illustration/text is raster; production text, labels, and paths must be recreated natively.

## Reading board — initial

```text
Use case: ui-mockup.
Asset type: high-fidelity visual review board for a real educational website, not production code.
Create a beautifully art-directed, practical responsive reading-interface board for "Wisdom", a life manual for ages 8 and older. Landscape canvas, very high resolution. Two flat screen compositions on one immaculate near-white board: a large desktop viewport occupying roughly three quarters of the width and a narrower phone viewport to its right. No device hardware, browser chrome, perspective, shadows around the screens, floating cards, or scene props. Small board labels "Desktop" and "Phone" outside the viewports.
Visual identity: the clarity and care of a modern natural-history field guide, blended with an exceptionally precise interactive path map. Almost-white #FCFCFA page, deep charcoal green #23302D ink, dark green #2F604D selected routes, quiet #596860 secondary text, pale #D5DDD5 separators. Readable Source Serif 4-like headings and prose, Source Sans 3-like navigation and diagram labels. Restrained, spacious, left-aligned, excellent editorial hierarchy. Avoid cream parchment, oversized marketing headlines, generic SaaS cards, ornamental leaves, mascot faces, heavy gradients, black backgrounds, tiny text and fantasy effects.
Desktop composition: a quiet collapsible left index about one fifth of that viewport, separated only by a fine rule. "Wisdom" at top with a small panel-collapse control. Expanded "Choices" topic, indented chapter label "Your future has more than one path". Three scene links beneath it: selected "Here you are, today", "One skill, several paths", "The pattern matters". Separate "About" and "Source code" links at bottom. No empty future topics. Main reading region has breadcrumb "Choices", a sensible prominent serif title "Your future has more than one path", then the exact two-sentence body "Your future isn't a single road. What you learn now can give you more ways to choose later." At upper right a clearly labeled modest selector "Example age" with value "8".
The main visual is a large horizontal branching path map, geometric but gently organic, with a single dark green lived path entering from left and reaching a dot labeled "Today", a fine vertical present boundary at that dot, and a small set of 5 readable branching possible paths extending to the right. Include two very subtle grey past-alternative branches on the left; they do not reconnect to become two lived paths. All future branches grow out of the Today dot. No income/success vertical axis, no milestones that rank occupations, no numbers implying probabilities. Distinguish zones with readable labels "Before today" and "Possible futures". Endpoints are simple small open circles. The resting Today marker has no giant glow. Map is the memorable focal object, not a tiny ornament.
Immediately below map: short caption "Possible paths, not predictions." and text-button "Replay path". Below this, a simple text disclosure "Why does learning help?" with a tiny delicate ink-and-wash rose brain specimen beside it, no anatomical labels or face; the illustration should occupy less than 4 percent of the viewport and never dominate. Reading controls lower down: "Read as a page", "1 of 7", and a clear green "Next" button. No fake completion badge.
Phone composition: same exact design language and opening content, realistically reflowed at phone width, not a shrunken desktop. Top "Wisdom" and labeled "Menu", no open sidebar. Title split across sensible lines, body legible, "Example age" selector showing "8". A vertical path map with "Before today" above, dot and horizontal "Today" boundary, and restrained future branches below, all fitting without sideways panning. Show short caption, "1 of 7" and "Next"; no clipped buttons. Use comfortable margins and generously sized touch controls.
This is a refined product mockup with readable realistic UI, not a poster. Keep all requested words accurate and do not invent extra copy. The small illustration warms the explanation; the whitespace and map carry it.
```

## Motion board — initial

```text
Use case: ui-mockup.
Asset type: high-fidelity four-frame animation storyboard for an educational interactive path map.
Produce one exceptionally clear and beautiful landscape storyboard on near-white #FCFCFA. Exactly four equal panels in a two-by-two grid with ample gutters and very fine separators. The heading is "A point becomes a path". Subheading "One short interaction. The content stays available." This is a precise digital motion-design board, not comic art or a fantasy illustration.
Style: clean modern natural-history field guide. Charcoal-green #23302D text, #2F604D routes, #596860 quiet labels, pale #D5DDD5 scaffolding. Refined Source Serif 4-like panel headings, clear Source Sans 3-like UI labels. Nothing rotated. No browser/device hardware. No decorative leaves, no paper grain, no sweeping gradients, no tiny text.
Each panel shows EXACTLY the same cropped section of a large horizontal life-path map at the same scale and camera position. Identical topology and node positions across all four: one sinuous left-hand lived-path guide reaches a central Today point, one thin vertical present boundary passes through that point, then five simple branching future routes originate at the Today point and spread rightward ending in small hollow circles. Two faint grey past alternatives split off to the left and end before the present boundary. Readable zone labels "Before today", "Today", "Possible futures". The diagram describes possible paths, not probabilities or ranks. No life score, no success-axis, no salary/job names. All route outlines are already visible as pale guides in the first frame so content never depends on animation.
Panel 1 top left: title "1. Ready" and time "Before selection". Today is a hollow, clearly selectable ring. No glow. Lived-path and future guides remain faint. Small button "Start here" beneath. Caption "Choose the marked point."
Panel 2 top right: title "2. Acknowledge" and time "100 ms". Today is now a solid dark green dot with a SMALL, soft translucent green-grey halo confirming selection. No beam or particles. The geometry and all text remain stationary. Caption "The dot responds immediately."
Panel 3 bottom left: title "3. Connect" and time "350 ms". A fine dark green stroke is partway traced along the existing left-hand guide, progressing LEFT TO RIGHT toward Today, with a very small luminous leading tip localized on that path, not a huge glow at Today. Completed stroke behind the tip, pale guide ahead. Some future guides receive restrained darkening from their root. Caption "Trace the connection, not a performance."
Panel 4 bottom right: title "4. Settle" and time "700 ms". Today solid, lived route fully green; possible future paths clear in green but slightly lighter than the lived path. No halo and no moving highlight remain. Everything sharp and quiet. Caption "A clear map, ready to read."
Under the four panels a slim legend with exact text "Reduced motion: show the settled map immediately." and "Next stays available throughout."
Do not turn this into four different maps. The permanent route skeleton must match across panels: reveal emphasis rather than inventing fresh geometry. All effects are subtle and fast. Prioritize the communication of state and refined line quality over decoration.
```

## Reading board — first refinement

Input: `iterations/reading-v1.png`, edit target.

```text
Use case: ui-mockup. Input image 1 is the edit target, the first responsive Wisdom reading board.
Improve the path-map grammar only, preserving the excellent near-white editorial layout, two viewports, typography, all main prose, sidebar, example-age selector, tiny brain illustration, footer controls, and overall scale.
DESKTOP MAP: Replace the simple five-spoke fan and misleading past lines with one coherent branching tree. A single dark-green lived path runs from a left starting point to the Today dot at the vertical present boundary. Two dashed quiet-grey alternatives must visibly SPLIT OFF that same lived path at separate points BEFORE Today, travel away, and end BEFORE the present boundary; they are not separate origins that merge into the lived path. To the right of Today, two initial future branches continue to two later fork points; each of those forks subdivides into three smaller routes, producing SIX hollow endpoints. This is two levels of future branching, not six spokes from one center. Use smooth, fine, restrained dark-green linework and gentle rhythmic spacing. Remove every destination caption ("Keep creating", "Help others", etc.); the only map labels are "Before today", "Today", and "Possible futures". This avoids presenting a finite menu of five life destinations. Preserve caption "Possible paths, not predictions." and "Replay path" below.
PHONE MAP: Rebuild the diagram as genuinely top-to-bottom time. A single lived path begins at TOP CENTER and descends toward a Today dot precisely ON a horizontal present boundary. One or two grey dashed alternatives split from that downward lived path ABOVE Today and end above the boundary. From Today two future branches descend, fork once more, and fan to six spaced hollow endpoints BELOW. No horizontal past line arriving from the left, no second dot below Today, no break between Today and its future routes. Label "Before today" above and "Possible futures" below, with "Today" beside the central dot. Remove endpoint captions. Fit within the phone's content width with generous margins and retain the current readable phone prose and Next button.
Keep all map labels dark enough to read and alternatives clearly dashed so meaning is not color alone. The result remains a refined practical UI mockup. No other redesign, no extra words, no decorative glow in this resting-state board.
```

## Motion board — first refinement

Input: `iterations/motion-v1.png`, edit target.

```text
Use case: ui-mockup. Input image 1 is the edit target, the four-panel "A point becomes a path" storyboard.
Make one focused improvement: correct and clarify the identical map topology and reveal direction across all four panels. Preserve the exact existing two-by-two board layout, titles, all timestamps, captions, background, typography, panel scale, footer notes and clean field-guide style.
Use one identical map skeleton in every panel. A single sinuous lived-path guide enters at left and ends at the Today dot on the vertical present boundary. TWO dashed grey not-taken paths visibly SPLIT OFF this lived-path guide at two points before Today, and stop before the boundary. Delete the detached parallel dashed lines below the map.
Future topology must be EXACTLY TWO branches leaving Today. The upper branch reaches a later junction, then splits into THREE terminal paths; the lower branch reaches a later junction, then splits into THREE terminal paths. This makes SIX hollow endpoints, not four or five spokes from Today. All six endpoints, both junctions, the lived path, dashed alternatives, Today dot and boundary occupy IDENTICAL positions in all four frames. Give the future halves more width if necessary within each panel, but preserve the stable camera between frames. No crossing branches or disconnected geometry.
State differences only: 1. Ready shows all routes in a readable medium-light neutral grey-green, with hollow Today target and Start here button. 2. Acknowledge at 100 ms fills Today and gives it a small soft translucent halo; nothing else moves. 3. Connect at 350 ms shows one dark green stroke drawn from the far LEFT along the lived guide, ending just before Today at a small luminous tracing tip; the remaining guide to Today stays visible. ALL future routes in frame 3 remain neutral guides, without premature dark-green root strokes. 4. Settle at 700 ms shows the full lived path dark green, all six future endpoints and branches in readable slightly quieter green, a solid Today dot, no glow.
Ensure the first frame is readable too: pale guides must not disappear into the background. Use dash pattern and hollow/solid endpoints to help distinguish line roles beyond color. Keep all original text verbatim and keep animation compact rather than theatrical.
```

## Reading board — second refinement

Input: `iterations/reading-v2.png`, edit target.

```text
Use case: ui-mockup. Input image 1 is the edit target: the refined Wisdom desktop-and-phone reading board.
Final focused refinement: make time direction and secondary reading controls unambiguous, preserving the established layout, main exact copy, serif/sans type pairing, near-white palette, current two-level future tree, quiet sidebar, and overall proportions. Do not redesign the page.
1. Desktop past alternatives currently bend backward to the LEFT from the lived-path junctions. Change only those two dashed grey branches so each visibly leaves its junction traveling to the RIGHT (forward in time), arcs above the lived line, and ENDS to the right of that junction but still strictly BEFORE the vertical Today boundary. For example, the first past junction near the left quarter can lead diagonally up-right to a small hollow endpoint near the middle of the past zone; the later past junction can lead up-right to an endpoint just left of Today. Neither branch reconnects. Keep the solid lived path itself and all future geometry unchanged.
2. Phone: preserve top-to-bottom time. Make the two dashed alternatives split off at separate points on the downward lived path, and each travel DOWNWARD and outward before terminating ABOVE the horizontal Today boundary. They do not branch backwards upward. Keep one Today dot ON the boundary, two future branches and six endpoints below it. No duplicated Today dot.
3. Add this brief readable explanation immediately below each map, BEFORE the existing caption: "Dashed paths were not taken." Keep the separate existing caption "Possible paths, not predictions." Do not add a dense legend or extra endpoint labels. Make dashed paths a moderately visible muted grey, not nearly white; preserve their dash pattern.
4. Add the missing text link "Read as a page" to the PHONE reading controls, positioned comfortably near "Replay path" without crowding the Next button or shrinking any body text. The phone may use two short control rows. Remove the small brain illustration from the PHONE only if space is needed; the desktop keeps its small ink-and-wash brain. Preserve "Why does learning help?" as an optional disclosure.
The output remains two flat review viewports labeled "Desktop" and "Phone", not physical devices. No new imagery, frames, chrome, giant glow, gradient or watermark. All primary text remains verbatim and legible.
```

## Motion board — second refinement

Input: `iterations/motion-v2.png`, edit target.

```text
Use case: ui-mockup. Input image 1 is the edit target: the refined four-panel "A point becomes a path" storyboard.
Final focused refinement: improve selected-state continuity and the clarity of the trace. Preserve the full board composition, exact panel headings, exact times, panel captions, unchanged six-endpoint branching map geometry in all four panels, and clean near-white field-guide styling.
CRITICAL: In panel "3. Connect", the Today circle at the fixed vertical boundary must be a SOLID dark green dot, exactly as it is in panels 2 and 4. It must never revert to an empty ring after acknowledgment. Only panel 1 has a hollow Today target. Preserve the tiny highlight on the incoming trace, but make it smaller than the Today dot and not an outlined white circle; it is a soft moving tip on the stroke, not another selectable node. The path trace still goes from left toward Today and stops just before it at 350 ms. Future routes remain unaccented in panel 3.
Make unaccented route guides a little darker, approximately #84958B, so the geometry in panels 1–3 remains readable. Keep the active lived trace #2F604D and the settled future routes slightly quieter but clearly visible. Dashed past alternatives remain distinct by dash pattern and must still split off the lived path forward in time. Do not alter their topology.
At the bottom, remove the two unnecessary circular pictogram badges. Replace them with three simple, well-spaced text notes, large enough to read: "Dashed paths were not taken.", "Reduced motion: show the settled map immediately.", and "Next stays available throughout." A compact two-line footer is fine. Preserve every existing panel caption and the heading/subheading. No added decorative symbols.
Maintain the restrained transient halo ONLY in panel 2, with no large glow in the final frame. Keep the refined airy composition. This is a quick functional confirmation and connection trace, not a theatrical introduction. No device mockups or new artwork.
```
