# 010 — Procedural choice network

Status: Implemented: locally verified engine; visual refinement required. Created: 2026-09-07. Updated: 2026-09-07.

## Purpose and boundary

Define the bounded, deterministic network used by the Choices map and by the
small comparison overlays. The network is an illustrative fictional field of
forward-moving possibilities. It is not a simulator, a forecast, a count of
life opportunities, or a model of the probability of a person's outcomes.

This document authorizes a reusable prototype engine only. It does not approve
a scenario editor, personal profile, prediction, mobile layout, new research,
publication, or production infrastructure. The current UI keeps its authored
example ages 8, 12, 16, 25, 40 and 60; the engine itself accepts any finite,
bounded numeric age within the generated network's age span.

Related decisions: [008 — Choices and consequences](008-choices-and-consequences.md),
[009 — Layered choices rewrite implementation plan](009-layered-choices-implementation.md),
and [design study 001, v06 — Flat Canvas](../design/001-choices-explainer/v06-flat-canvas/README.md).

## Product behavior

`generateNetwork(options)` creates one complete forward-only tree from age 0
through `maxAge`. A seed and the full generation configuration determine its
geometry and stable node, edge, and choice-point IDs. Branches have independent
seeded turn clocks and split decisions. Occupancy-based crowding is a shared
drawing control: it spaces nearby branches and can suppress splits when the
field is dense. Split/turn controls, maximum tips, maximum edges, and related
caps are resource and composition controls, not claims about how often real
people face choices or how many opportunities a life contains.

Generation uses years-based controls: `maxAge` is 1–10,000; sample, split and
turn intervals are at least 0.001. The optional `openingSplitMin` and
`openingSplitMax` pair changes only the root's first split interval when
`openingBurst` is zero (the engine default). Opt-in `openingBurst` accepts
0–1: it blends every early branch's independent split interval toward those
opening intervals, broadens departures, and scales its split probability.
A zero split probability still prevents every split. The burst tapers away
during the first quarter of the drawing's age span, with an early tip cap
that reserves capacity for later forks. This is a composition schedule, not
a developmental claim. Dimensions and per-edge/total work are bounded, and
excessive configurations fail before expensive generation. Projection may
still select any finite fractional age, including 0 and values such as 12.34567.

The field remains visually abundant and illustrative. Routes move left to
right without loops or backward curls. The completed dark-green route is the
selected fictional route; possible descendants are light green; routes not
taken in the selected fictional scenario are faint gray. Gray means “untaken
in this fictional scenario,” not “irrecoverably closed in life.” The palette
must remain legible without treating vertical placement, density, or endpoint
position as a score for success, worth, wealth, lifespan, or freedom.

`projectScenario(network, { age, choiceSeed, choices, annotations })` projects
a scenario onto an already generated network:

- `age` is an arbitrary finite numeric age, clamped to the network bounds for
  projection. It selects the “today” position and the past/future split; it
  does not regenerate geometry or change the network.
- `choiceSeed` independently selects the assumed outgoing edge at each choice
  point. The assumed choices and the full selected route are age-stable: a
  younger or older projection with the same network and choice seed follows
  the same assumed choices, merely revealing a different point along it.
- `choices` contains explicit overrides keyed by `nodeID` to an outgoing
  `edgeID`. A valid override changes the selected route for that choice point;
  an unknown node, an edge from another point, or another invalid value falls
  back to the seeded assumed choice. Invalid overrides do not corrupt the
  network or throw as a route-selection side effect.
- `annotations` attaches presentation metadata by stable choice-point ID.
  It cannot select a route. The projection copies and freezes accepted
  annotation data, leaving caller-owned input and the generated network
  unchanged.

The projected result exposes the today point, selected spine, past and future
segments, choice points, and selections with an `assumed` distinction. Untaken
segments also carry the earliest missed fork as `untakenAtAge` and
`untakenAtNodeId`; descendants inherit that origin even when they continue
beyond Today. Route state is a visual classification for the fictional
scenario, not a statement about what the reader has done or what remains
possible in their own life.

Selected age is an example context, not a diagnosis or age forecast. The UI's
authored age controls remain a reading device; they do not imply that age alone
closes or opens a fixed number of routes. Existing comparison overlays reuse
the same engine with a symbolic local-progress axis. They are not forecasts
along the selected life-age axis, and their semantic lesson labels remain
authored content from the Choices story.

## Identity and reuse contract

Generated geometry may be cached and reused across projections. IDs are stable
only for the same seed, complete generation configuration, and algorithm
version. They are not globally meaningful, permanent identifiers across a
changed algorithm or changed configuration. Named fictional choices and
annotations should therefore attach to stable choice-point IDs only when that
same generation contract is retained; a new seed/configuration/version needs a
new authored mapping review.

Independent per-branch seeded generation is explicitly reusable. Shared
crowding is the intentional exception because it responds to nearby geometry.
No editor or authoring UI is part of this proposal; authored metadata can be
provided by code or fixtures for the bounded prototype.

## Minimal use example

```js
import { generateNetwork, projectScenario } from './path-network.js';

const network = generateNetwork({
  seed: 'choices-network-1',
  maxAge: 100,
  maxTips: 84,
});

const fork = network.choicePoints[0];
const projection = projectScenario(network, {
  age: 12.25,
  choiceSeed: 'mika-example-1',
  // Overrides are node ID -> outgoing edge ID.
  choices: { [fork.id]: fork.options[1] },
  annotations: {
    [fork.id]: {
      label: 'Return to the difficult idea',
      options: { [fork.options[1]]: 'Ask for a useful explanation' },
    },
  },
});
```

The example selects a route at one stable choice point and labels it without
changing the generated graph. It does not imply that age 12 is a universal
decision boundary or that the route predicts Mika's or a reader's life.

## Implementation references

- [Network generator and projection API](../../prototype/path-network.js)
- [Current model consumer](../../prototype/model.js)
- [Network behavior tests](../../tests/path-network.test.js)
- [Flat Canvas design round](../design/001-choices-explainer/v06-flat-canvas/README.md)
- [Choices and consequences contract](008-choices-and-consequences.md)
- [Layered choices implementation plan](009-layered-choices-implementation.md)

The engine exports both APIs. A network includes its algorithm `version`, its resolved
`config`, `seed`, `bounds`, `maxAge`, `rootId`, `nodes`, `edges` and `choicePoints`.
A projection includes `age`, `today` (with `edgeId`), the complete assumed `spine`,
`past`, `future`, classified `segments`, `selections`, and choice points with
optional `.annotation` metadata. Geometry is cached separately from authored
metadata; annotated projections are copied afresh.

## Acceptance checklist

- [x] `generateNetwork(options)` validates finite bounded controls, produces a
      deterministic complete forward-only tree, and respects resource caps.
- [x] Independent branch turn/split clocks replay from the seed while shared
      crowding changes drawing separation without being presented as life
      probability.
- [x] Node, edge, and choice-point IDs remain stable for the same seed,
      complete configuration, and algorithm version, with the identity limit
      documented in code-facing metadata.
- [x] `projectScenario(network, { age, choiceSeed, choices, annotations })`
      accepts arbitrary bounded numeric ages and preserves the full network and
      age-stable assumed route.
- [x] Explicit overrides use `nodeID -> outgoing edgeID`; invalid overrides
      fall back to seeded assumed choices.
- [x] Annotation copies are frozen and do not mutate caller input or network
      geometry.
- [x] Projected state distinguishes completed dark-green, possible light-green,
      and untaken faint-gray segments, with gray documented as fictional
      scenario state rather than irreversible closure.
- [x] Existing authored UI ages remain 8, 12, 16, 25, 40 and 60, while
      comparison overlays use symbolic local progress rather than age forecast.
- [x] The engine and current prototype checks are locally verified; see
      [current verification](../../NEXT_STEP.md#run-and-verify). These checks
      do not establish visual acceptance.

## Current visual refinement

The engine is implemented, while visual acceptance remains pending. The current
Canvas uses heavier high-resolution strokes, with a 2×–3× backing buffer and a
larger opening burst generated by earlier independent splits and broader early
divergence. The burst is a drawing control, not a probability claim.

The same generated network and scenario now support three switchable path views:
full context keeps gray alternatives visible; fading alternatives reduce
untaken branches after their missed fork and configured fade distance; quiet
context retains only a small faint subset of context ancestries. The three
buttons preserve the same network/scenario, and `paths` plus `tune` settings
survive URL reload and history. Fading changes presentation, never graph
reachability or scenario history. Canonical defaults and bounds live in
[prototype/map-settings.js](../../prototype/map-settings.js); do not duplicate
or hardcode them here.

An additional tuning-panel UI is proposed for a later, explicitly approved
scope decision. It is not claimed as built or required by this document.
Keep versioned evidence within the existing v06 design round.
