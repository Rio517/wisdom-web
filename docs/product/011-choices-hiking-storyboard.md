# 011 — Choices hiking storyboard

Current revision: [The paths we make — editable Draft 02](../content/choices-story.md). The general explanation about choices, accumulation and circumstances is primary; Alfredo’s hikes are an optional example. The full-width life map uses a right-side overlay to leave its origin clear. The earlier storyboard below is retained for its implementation and evidence context; it is no longer the current lesson to edit.

Status: Approved for prototyping — v04 storyboard accepted, with the character renamed Alfredo. Created: 2026-09-14. Updated: 2026-09-14.

This proposal turns the hiking idea in [Choices add up: a series of hikes](../choices-paths/ideas/paths-worn-by-steps.md) into the four-beat, reader-controlled structure in [001 — Choices experience](001-choices-experience.md). It specifies the accepted story and interaction direction. The local implementation is recorded in [012](012-choices-lesson-implementation.md), with [review evidence in design round v08](../design/001-choices-explainer/v08-alfredo-lesson/README.md). Production and owner acceptance of that implementation remain separate.

Use the [name-updated storyboard](../design/001-choices-explainer/v07-hiking-storyboard/storyboard-v05.html) and [accepted v04 scene images](../design/001-choices-explainer/v07-hiking-storyboard/README.md#current-review). Revision 05 changes only the character name from accepted v04 (plus the revision label). The board preserves this document’s reader text and demonstrates the proposed map states; it does not implement map interaction or motion.

Implementation uses Tailwind for most layout and UI styling, retaining Canvas/SVG for diagrams. The Tailwind CDN is permitted for development without compilation; production uses compiled Tailwind. The accepted storyboard’s embedded CSS is document-artifact styling, not the application styling standard.

## Takeaway

**What you do now can change what becomes possible later; choices accumulate, and circumstances, support and chance also matter.**

## Scene 1 — More than one path

### Reader text

> **Your future has more than one path.**
>
> Imagine a life as a landscape full of paths. Some lead toward things you already know; others lead toward places you have not imagined. Each branch is a possibility, not a promise.
>
> What happens along one part can change what becomes possible later. Let’s follow Alfredo, a fictional child setting out on a hike with an adult.

### Proposed view and action

On entry, the abundant lifetime map fades in over 350 ms and settles in its complete overview. Caption: **“Many possible paths—an illustration, not a prediction or score. Height has no meaning.”** Selecting **Next** leaves for scene 2 immediately; it does not trigger another scene 1 state.

## Scene 2 — Small actions add up

### Reader text

> **A long hike is made of small steps.**
>
> On Alfredo’s first hike, each footstep adds a little distance. Together, the steps carry Alfredo and the adult to a stream for lunch. Rest, water and food help them continue.
>
> At first, Alfredo can follow the adult’s map reading but cannot help plan the route. The adult shows how a bridge and a stream bend match map symbols. Steps add distance during this hike; what Alfredo learns can carry into a later one.

### Proposed view and action

On entry, a 400 ms transition moves from the lifetime overview to one settled literal trail map. A dotted sequence of footsteps resolves into the continuous route to the stream, with rest, water and learned landmarks labeled. Keep a small lifetime-map thumbnail visible with the caption **“Example: one hike.”** The reader can select **Next** immediately; there are no intermediate clicks or hidden core states.

## Scene 3 — What happened before changes what is possible

### Reader text

> **One hike can help with the next.**
>
> Across several hikes, Alfredo practises matching landmarks to maps. Later, Alfredo and the adult check an unfamiliar route to a lake. Alfredo can now match the bridge and stream bend, help plan the route and notice if they stray from it.
>
> That is a new possibility for Alfredo: helping to plan, not only following. Enough time and careful packing make the lake practical for the group today. Across hikes, packing sunscreen has also become a familiar part of Alfredo’s check.

### Proposed view and action

On entry, a 400 ms highlight connects the learned landmarks to the unfamiliar section and settles on **Later hike**. Keep a lifetime-map thumbnail visible with the caption **“Example: several hikes.”** An optional **First hike / Later hike** switch compares two complete settled maps without blocking **Next**. Label both causal changes: **role—follows the adult / helps plan and check**; **destination—stream fits today / lake is practical today**. This is the only core-scene comparison control.

## Scene 4 — Other things can change the plan

### Reader text

> **Plans meet the world.**
>
> On another day, heavy rain makes part of the trail unsafe. Packing carefully cannot control the weather. A ranger explains what has changed, and the adult helps the group choose a sheltered route. Turning back would also be sensible.
>
> The life map still holds many possibilities. Like rain, a change can alter what comes next; like the ranger and adult, help can reveal another way forward. What is one small action now that could help a future you—even though it cannot promise what will happen?

### Proposed view and action

On entry, one transition begins with the already-readable changed trail and pulls back to the flat lifetime map within 600 ms. In the settled view, keep a trail-map inset beside it showing the closed segment, ranger help and sheltered route together; no key event flashes and disappears. The reflection remains private and unrecorded, not a scored response or another required state. **Next** simply finishes the lesson.

## Navigation labels

| Scene | Back | Next |
| --- | --- | --- |
| 1 | **Choices overview** | **Follow Alfredo’s first hike** |
| 2 | **See the life map** | **See a later hike** |
| 3 | **Return to the first hike** | **When plans change** |
| 4 | **Return to the later hike** | **Finish the lesson** |

Back restores the exact settled state of the preceding scene. Next and Back remain available throughout every transition. Keyboard, touch and pointer activate the same states, and focus moves to the new scene heading.

## Explorable lifetime-map contract

This is a proposed fictional exploration mode, not a way to enter or rewrite the reader’s real past. The static no-JavaScript review board should demonstrate the states and labels below; the storyboard direction is accepted for prototyping, and interactive implementation is the next stage.

- **Enter and leave:** **Explore map** opens exploration without changing the current lesson scene. **Resume story** restores that scene, its settled diagram and focus. Lesson **Back / Next** remain visually separate from map **Previous choice / Next choice**.
- **Move through choices:** **Previous choice** revisits the preceding fork on the selected lineage; **Next choice** moves forward to the next fork. Clicking an earlier fork does the same. Inspecting the past changes nothing by itself. Choosing an alternate reachable branch clears only its dependent fictional future, and only after the new choice is confirmed.
- **Preview and commit:** Mouse hover or keyboard focus previews a path in blue (`#376F9A`) and names its destination or consequence without committing it. Clicking a reachable branch selects that connected branch and lineage; it never teleports to an unrelated path. Selected history is dark green, reachable paths sage and untaken paths gray.
- **Unavailable paths:** A gray path may preview why it is not reachable from the current fictional lineage and offer **Revisit earlier fork**. It is not silently selectable. Gray paths beyond Today remain clipped rather than appearing as current future options.
- **Stable field:** Hovering, focusing, previewing, moving between forks and changing a branch do not regenerate the network. The untouched seeded layout stays fixed so differences remain legible. An age or other map input regenerates only when the reader deliberately changes and confirms that input.
- **Touch, keyboard and crossings:** On iPad, the first tap previews and a clearly labeled **Use this path** commits. Keyboard users operate an adjacent list of choices for the active fork rather than tabbing through hundreds of lines; Enter previews or activates the labeled control, and Escape dismisses a preview. Generous hit targets and a labeled choice panel disambiguate crossings before selection.

### Exploration acceptance checks

| Check | Pass condition |
| --- | --- |
| Story state | Explore, move backward or forward, then **Resume story**; the same lesson scene and settled story state return. |
| Non-committing preview | Hover, focus or first-tap preview turns only the candidate blue and changes neither lineage nor seeded geometry. |
| Connected selection | Confirming **Use this path** commits only a branch connected to the active fork; history, reachable and untaken colors update with labels. |
| Alternate history | Visiting an earlier fork preserves the existing future until another branch is confirmed, then clears only dependent later selections. |
| Unreachable route | A gray route explains its state and links to a relevant earlier fork; it cannot be selected directly, and gray beyond Today stays clipped. |
| Input and access parity | Pointer, iPad and adjacent keyboard controls reach the same named choices; crossings are unambiguous, Escape dismisses preview, and regeneration requires a confirmed input change. |
| Static review | The no-JavaScript board visibly labels preview, selected, reachable, untaken, unavailable and story-resume states without claiming they already work. |

## Motion and static parity

Motion is functional and interruptible: route emphasis and state changes settle in about 250–400 ms; the scene 4 pullback may take up to 600 ms. Text and controls appear immediately. A new selection cancels the active transition, and replay is optional.

Reduced-motion, continuous-reading and print views show the same named landmarks, destinations, changed roles, closed segment, support, hike-map captions and final life map without travel animation. Nothing essential depends on color, hover, timing or remembering an earlier frame; concise labels, the persistent trail inset and an adjacent static comparison carry the change.

## Optional deep dives

At most these two disclosures accompany the main path. Closing either one returns focus to its trigger and preserves the parent scene’s First/Later selection.

### How did the map learning carry forward?

> Alfredo did not simply remember a route. Alfredo learned how real landmarks can match marks on a map. On the later hike, that understanding let Alfredo help plan and check a section not walked before. A new place can still require adult help and careful checking.

Return action: **Back to the later hike**.

### Why can changing route be worthwhile?

> A plan is useful, but it cannot control weather or every other condition. When the trail changes, getting current information and choosing a safer route can be a good response. Reaching a different place—or returning another day—is not a lesser kind of life path.

Return action: **Back to when plans change**.

## Evidence map

The hike and Alfredo are fictional editorial illustrations. The sources support the bounded meanings below, not claims about hiking instruction or a prediction for an individual reader.

| Story move | Evidence connection | Boundary retained |
| --- | --- | --- |
| Earlier map understanding lets Alfredo help plan and check a later unfamiliar section | Prior knowledge can support new learning and may also need adapting: [L11](../research/learning/sources.md#l11--prior-knowledge-and-new-learning) | This is a specific build-on mechanism, not universal skill transfer or independent navigation. |
| Checking sunscreen becomes familiar across repeated hikes | Repeated starts in stable contexts can relate to automaticity: [B4](../research/habits/sources.md#b4--context-and-study-habits) | The sample does not validate a child intervention, a timetable or general good judgment. |
| Preparation changes what is practical without guaranteeing the trip | Real opportunity depends on more than possessing a resource: [C5](../research/circumstances/sources.md#c5) | Stream and lake outcomes are fictional; preparation does not control weather. |
| Weather and trail conditions change what the same group can do | Agency operates within opportunities and constraints: [C1](../research/circumstances/sources.md#c1) and [C7](../research/circumstances/sources.md#c7) | These frameworks organize the explanation; they do not forecast a life route. |
| A ranger’s information and an adult’s help support a changed route | Recovery involves people and systems, not willpower alone: [C11](../research/circumstances/sources.md#c11) and [C12](../research/circumstances/sources.md#c12) | No named support guarantees recovery, and adversity is not presented as beneficial. |

## Acceptance reader prompts

These are editorial comprehension checks conducted after the experience, not a quiz inside it.

| Prompt | Understanding to listen for | Signal to revise |
| --- | --- | --- |
| “What did Alfredo learn on the first hike that helped later?” | Connects real landmarks with helping plan and check a new route | Names only sunscreen, packing or possessions |
| “What changed for Alfredo, and what made the lake practical for the group?” | Separates Alfredo’s new planning role from the group’s time and preparation | Says map learning magically opened the lake |
| “Did careful packing make the weather behave?” | Says no; identifies weather, ranger information or adult help as another influence | Treats every outcome as earned or guaranteed |
| “What does the large life map mean?” | Describes possibilities and accumulated effects, not measured odds or a success scale | Reads height as worth or branches as fixed predictions |

## Reader-validation questions

The owner accepted v04 with Alfredo as the character on 2026-09-14. The following remain comprehension checks, not another owner-approval gate:

1. Does the complete story land the takeaway that present actions can change later possibilities while rain, help and other conditions also matter?
2. Do the life-map thumbnail, labeled hike examples and final trail inset make the change of scale clear without giving elevation a meaning on the lifetime map?
