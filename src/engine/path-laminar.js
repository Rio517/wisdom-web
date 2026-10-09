/**
 * Laminar growth: the field as a bundle of lanes.
 *
 * The paced and organic modes let every line steer for itself and lean on
 * crowding to keep lines apart; the result fans out in straight rays that
 * cross and leave the drawing. This mode draws the shape the reference has:
 * lines that leave the beginning close together, flare outward as the field
 * widens, level off, and wave gently without crossing — an S along the top
 * edge, a soft Z along the bottom.
 *
 * How it works:
 *
 * - **An envelope.** The field opens from the beginning at the opening
 *   angle (`openingAngle`, the lab's Opening spread) and levels off toward
 *   the drawable height. Every line lives inside it. A fan that starts later
 *   in life is narrower by the age taper — choices narrowing — except for a
 *   line at each edge that still reaches out.
 * - **A budget.** Forks are admitted while the line count is under a share
 *   of `maxTips` that grows to the whole by `envelopeAge` (the lab passes
 *   Today), so the count keeps growing until the line, however soon the
 *   field itself opened.
 * - **Lanes.** The lines alive at an age keep a fixed top-to-bottom order.
 *   Each has a rank in (0, 1) and its lane is that rank mapped into the
 *   envelope. Order never changes, so lines never cross; a seeded wave on
 *   each line stays within a third of the lane spacing for the same reason.
 * - **Forks.** Every line keeps its own split clock (`splitMin..splitMax`
 *   apart, `splitProbability`, the age taper). The root's first fork waits
 *   `firstSplitAge` — the trunk before the field opens. A fork's children
 *   start on the parent's lane, with its motion, and spring apart to their
 *   own lanes over `settleYears` while the other lanes shift to make room.
 *   The spring is critically damped, so a split is an S and a lane that is
 *   still moving when the next fork lands keeps its momentum — no steps.
 *
 * - **Endings.** A few lines end before the horizon — very few in childhood,
 *   more with age (`endingRate` per year at the horizon, rising as the
 *   square of age; zero turns it off). The lines beside an ending close the
 *   gap, a fork may take the freed place, and routes prefer lines that go on.
 *
 * Output follows the generateNetwork contract exactly (nodes, edges, choice
 * points, `reachableUntilAge`), so projection, presentation and the lab need
 * no special case beyond passing `growthMode: 'laminar'`.
 */

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const round = value => Math.round(value * 10000) / 10000;
const smoothstep = progress => {
  const t = clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
};

function hash32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function randomUnit(key) {
  let value = hash32(key);
  value += 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

const randomRange = (key, minimum, maximum) => minimum + randomUnit(key) * (maximum - minimum);

/**
 * How open the field is at an age, 0..1. It leaves the origin at the opening
 * angle and approaches full height exponentially, so a wide angle opens it
 * in a few years and a narrow one takes longer — but never longer than about
 * half the way to `envelopeAge`, so the field is open at the line.
 */
function envelopeAt(options, age, reach) {
  const xPerAge = (options.width - 80) / options.maxAge;
  const angle = clamp(options.openingAngle / 2, 5, 80) * Math.PI / 180;
  const byAngle = reach / (Math.tan(angle) * xPerAge);
  const tau = Math.max(0.5, Math.min(byAngle, options.envelopeAge / 2.2));
  return (1 - Math.exp(-age / tau)) * smoothstep(age / 0.3);
}

/** The share of the budget open at an age, 0..1: all of it by `envelopeAge`. */
function budgetShareAt(options, age) {
  const t = clamp(age / options.envelopeAge, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

/** Age weight for later-life forks, as the other modes taper them. */
function ageWeight(options, age) {
  if (options.ageTaper === 0) return 1;
  const absoluteAge = options.ageOffset + age;
  const remaining = clamp((options.ageHorizon - absoluteAge) / options.ageHorizon, 0, 1);
  const tapered = 0.2 + 0.8 * remaining ** 2;
  return 1 + (tapered - 1) * options.ageTaper;
}

export function generateLaminarNetwork(options) {
  const seed = options.seed;
  const xForAge = age => 40 + (options.width - 80) * age / options.maxAge;
  const centreY = options.originY ?? options.height / 2;
  // Lanes stop just short of the padding so the wave never touches it.
  const fullTop = Math.max(8, (centreY - options.yPadding) * 0.995);
  const fullBottom = Math.max(8, (options.height - options.yPadding - centreY) * 0.995);
  // A field that starts later in life is narrower by the age taper — how
  // the choices narrow over time. At full taper: under two fifths of the
  // height at 27, under a fifth at 50, an eighth at 70.
  const remainingLife = clamp((options.ageHorizon - options.ageOffset) / options.ageHorizon, 0, 1);
  const narrowing = 1 + ((0.12 + 0.88 * remainingLife ** 4) - 1) * options.ageTaper;
  const topReach = fullTop * narrowing;
  const bottomReach = fullBottom * narrowing;
  // Fan-out keeps the field widening after it opens, past the top and the
  // bottom of the drawing: outer lines leave through the edges and give their
  // place back, so lines go on splitting and spreading instead of running
  // level. Zero keeps the field inside the drawing.
  const fanOut = options.fanOut ?? 0;
  const fanGrowth = age => fanOut * clamp(age / options.maxAge, 0, 1) ** 0.85;
  const envelope = age => envelopeAt(options, age, Math.max(topReach, bottomReach)) * (1 + fanGrowth(age));
  // Waves are small and even, as in the reference: never more than a third
  // of a lane, and never more than a few pixels however wide the lane is.
  const waveCap = 12 * options.waveStrength;
  const settle = options.settleYears;
  const step = options.sampleAgeStep;

  // The lines alive right now, in top-to-bottom order — and the lane count
  // the wave uses, sprung between forks so no line kinks when a fork lands.
  let lines = [];
  const laneCount = { value: 1, velocity: 0, target: 1 };
  // The two lines that reach past a narrowed field are chosen once, when
  // the field has opened, and the role passes to the outermost child at a
  // fork — never reassigned by position, which would hand it between lines
  // mid-flight and draw loops.
  let edgeRolesGiven = false;
  // Critically damped: settles in about `settleYears` without overshoot.
  // The wide opening rounds settle in half that, so the field opens at the
  // beginning rather than a few years in.
  const omega = 4 / Math.max(0.5, settle);
  const spring = (state, dt, rate = omega) => {
    const accel = rate * rate * (state.target - state.value) - 2 * rate * state.velocity;
    state.velocity += accel * dt;
    state.value += state.velocity * dt;
  };
  const nodes = [];
  const edges = [];
  const choicePoints = [];
  const rootId = 'n-root';
  nodes.push({ id: rootId, age: 0, x: round(xForAge(0)), y: round(centreY), outgoing: [] });
  const nodeById = new Map([[rootId, nodes[0]]]);

  function newLine(branchId, sourceId, age, rank, depth, inheritedWave = 0, velocity = 0, edge = null) {
    const splitIndex = 0;
    const wait = branchId === 'r' && options.firstSplitAge !== null
      ? options.firstSplitAge
      : randomRange(`${seed}|laminar|${branchId}|interval|${splitIndex}`, options.splitMin, options.splitMax);
    return {
      branchId,
      sourceId,
      depth,
      bornAt: age,
      points: [],
      // Where the line is, how fast its lane is moving, and where it is going.
      lane: { value: rank, velocity, target: rank },
      // How far this line reaches past the narrowed field: sprung toward 1
      // while it is the outermost line on its side, toward 0 otherwise, and
      // inherited at a fork so nothing jumps.
      edge: edge ? { ...edge } : { value: 0, velocity: 0, target: 0 },
      nextSplit: age + wait,
      splitIndex,
      // A child starts on its parent's wave and blends onto its own, so the
      // fork point is one point for both and nothing jogs.
      inheritedWave,
      wavePhase: randomUnit(`${seed}|laminar|${branchId}|phase`) * Math.PI * 2,
      wavePeriod: randomRange(`${seed}|laminar|${branchId}|period`, options.turnMin, options.turnMax),
      waveShare: randomRange(`${seed}|laminar|${branchId}|wave`, 0.5, 1),
    };
  }

  const rankAt = line => line.lane.value;
  const laneCountAt = () => laneCount.value;

  /** Move every lane on by `dt` years toward where it is going. */
  function advance(dt) {
    if (dt <= 0) return;
    // Sub-step so the spring stays exact at any event spacing.
    const steps = Math.max(1, Math.ceil(dt / 0.25));
    const slice = dt / steps;
    for (let index = 0; index < steps; index += 1) {
      spring(laneCount, slice);
      for (const line of lines) {
        spring(line.lane, slice, line.depth <= options.wideForkLevels ? omega * 2 : omega);
        spring(line.edge, slice);
      }
      // Order is the rule, not a hope: a lane carried past its neighbour by
      // inherited momentum is held level with it. Children of one fork start
      // together and part as their springs pull them to their own lanes.
      for (let at = 1; at < lines.length; at += 1) {
        const below = lines[at].lane;
        const above = lines[at - 1].lane;
        if (below.value < above.value) {
          below.value = above.value;
          below.velocity = Math.max(below.velocity, above.velocity);
        }
      }
    }
  }

  /** Every lane heads for an even spread, keeping order; a little seeded jitter keeps it from reading as a ruler. */
  function respread() {
    const count = lines.length;
    laneCount.target = count;
    lines.forEach((line, index) => {
      const jitter = (randomUnit(`${seed}|laminar|${line.branchId}|lane-jitter`) - 0.5) * 0.24 / count;
      line.lane.target = count === 1 ? 0.5 : clamp((index + 0.5) / count + jitter, 0.005, 0.995);
    });
    if (!edgeRolesGiven && narrowing < 0.97 && count >= 4) {
      lines[0].edge.target = 1;
      lines[count - 1].edge.target = 1;
      edgeRolesGiven = true;
    }
  }

  /** The field's top and bottom edge at an age; lanes are spread evenly between them. */
  function edgesAt(age) {
    const open = envelope(age);
    return { top: centreY - topReach * open, bottom: centreY + bottomReach * open };
  }

  /**
   * The narrowed field keeps one line at each edge that still reaches for
   * the full height — the choices that push a life up or down late on.
   */
  function outlierReach(line, age) {
    if (line.edge.value <= 0.001) return 0;
    // Up to about the band's own height beyond it, never all the way to the
    // page edge: a line that pushes out, still part of the group.
    const pull = randomRange(`${seed}|laminar|${line.branchId}|outlier`, 0.5, 1);
    const open = envelope(age);
    const band = (topReach + bottomReach) * open;
    const room = line.lane.value < 0.5 ? fullTop - topReach : fullBottom - bottomReach;
    const side = Math.min(room * open, band) * (line.lane.value < 0.5 ? -1 : 1);
    return side * pull * clamp(line.edge.value, 0, 1);
  }

  function waveAt(line, age) {
    const { top, bottom } = edgesAt(age);
    // Inside the lane — neighbours with opposite phases close under half
    // the narrowest gap between them — and under the cap, so a lone trunk
    // does not swing across an empty field.
    const spacing = (bottom - top) / Math.max(1, laneCountAt());
    const amplitude = Math.min(waveCap, options.waveStrength * spacing * 0.22) * line.waveShare;
    // Waves lengthen with absolute age — the lab's timeline gives later
    // years less room, and an even wave on the page needs a longer one in
    // years there. Phase is the integral of 2π/period(a) for period growing
    // with a.
    const absolute = options.ageOffset + age;
    const stretch = 35;
    const phase = (Math.PI * 2 * stretch / line.wavePeriod) * Math.log1p(absolute / stretch)
      - (Math.PI * 2 * stretch / line.wavePeriod) * Math.log1p(options.ageOffset / stretch);
    const own = amplitude * Math.sin(phase + line.wavePhase);
    const blend = smoothstep((age - line.bornAt) / Math.max(0.5, settle));
    return line.inheritedWave * (1 - blend) + own * blend;
  }

  function yAtRank(rank, line, age) {
    // Evenly between the edges. Where the origin sits off-centre (a fan
    // from a Today near the bottom), the field opens toward the room it
    // has, and the middle lane drifts that way with it.
    const { top, bottom } = edgesAt(age);
    const lane = top + rank * (bottom - top) + outlierReach(line, age);
    const drift = options.originSlope * age * Math.exp(-age / Math.max(1, settle));
    if (fanOut > 0) return clamp(lane + waveAt(line, age) + drift, -options.height, options.height * 2);
    return clamp(lane + waveAt(line, age) + drift, options.yPadding, options.height - options.yPadding);
  }

  // The trunk drifts along the incoming direction for a while, then levels.
  const yAt = (line, age) => yAtRank(rankAt(line), line, age);

  // With fan-out, lines that have left the drawing keep their lanes (so the
  // others don't shift) but neither fork nor count against the budget: the
  // places they give back go to forks inside the drawing.
  const inside = line => fanOut <= 0 || (line.points.at(-1).y >= 0 && line.points.at(-1).y <= options.height);
  const visibleCount = () => (fanOut > 0 ? lines.filter(inside).length : lines.length);

  function budgetAt(age) {
    return Math.max(1, Math.floor(options.maxTips * Math.max(0.05, budgetShareAt(options, age))));
  }

  /** A big fork: after `bigForkAge`, now and then a later fork opens wide, like the first. */
  const isBigFork = (line, age) => line.branchId !== 'r' && (options.bigForkChance ?? 0) > 0
    && options.ageOffset + age >= options.bigForkAge
    && randomUnit(`${seed}|laminar|${line.branchId}|big|${line.splitIndex}`) < options.bigForkChance;

  function childCount(line, age, big = false) {
    const first = line.branchId === 'r';
    const minimum = first ? options.firstChildrenMin : big ? options.laterChildrenMax + 1 : options.laterChildrenMin;
    const maximum = first ? options.firstChildrenMax : big ? options.laterChildrenMax + 2 : options.laterChildrenMax;
    const room = budgetAt(age) - visibleCount() + 1;
    const edgeRoom = options.maxEdges - edges.length - lines.length - 1;
    const available = Math.min(maximum, room, edgeRoom);
    if (available < minimum) return 0;
    const requested = minimum + Math.floor(randomUnit(`${seed}|laminar|${line.branchId}|children`) * (maximum - minimum + 1));
    return Math.min(requested, available);
  }

  /**
   * The chance a line ends in this year at this absolute age: the shape of
   * a life table, lightly — a bump in the first five years, very little
   * through the middle, and a rise from forty that steepens. `endingRate`
   * is the yearly chance at seventy.
   */
  function endingChance(absoluteAge, years) {
    if (options.endingRate <= 0) return 0;
    const early = 1.2 * Math.exp(-absoluteAge / 2.5);
    const late = 0.6 * Math.max(0, (absoluteAge - 40) / 30) ** 2;
    return options.endingRate * (0.05 + early + late) * years;
  }

  function endLine(line, age, splitting, reason = 'horizon') {
    const targetId = splitting ? `n-${line.branchId}` : `n-${line.branchId}-tip`;
    const last = line.points.at(-1);
    const target = { id: targetId, age, x: last.x, y: last.y, outgoing: [] };
    if (!splitting) target.terminationReason = reason;
    nodes.push(target);
    nodeById.set(targetId, target);
    const edgeId = `e-${line.branchId}`;
    edges.push({ id: edgeId, from: line.sourceId, to: targetId, points: line.points });
    nodeById.get(line.sourceId).outgoing.push(edgeId);
    return target;
  }

  /** Between samples: a point for one line (a fork or an ending), still in lane order. */
  function pointNow(line, age) {
    if (line.points.at(-1).age >= age - 1e-9) return;
    const at = lines.indexOf(line);
    const above = at > 0 ? yAt(lines[at - 1], age) + 0.01 : -Infinity;
    const below = at < lines.length - 1 ? yAt(lines[at + 1], age) - 0.01 : Infinity;
    const y = above <= below ? clamp(yAt(line, age), above, below) : yAt(line, age);
    line.points.push({ x: round(xForAge(age)), y: round(y), age });
  }

  const root = newLine('r', rootId, 0, 0.5, 0);
  root.points.push({ x: round(xForAge(0)), y: round(centreY), age: 0 });
  lines = [root];

  // March through the years; fork events land between samples at their own age.
  let age = 0;
  let lastSampledAge = 0;
  let guard = 0;
  while (age < options.maxAge) {
    guard += 1;
    if (guard > 100000) throw new RangeError('laminar generation exceeded its event budget');
    // Samples sit on a fixed grid, whatever events land between them.
    const nextSample = Math.min(options.maxAge, (Math.floor(age / step + 1e-9) + 1) * step);
    const nextFork = Math.min(...lines.map(line => line.nextSplit));
    const nextAge = Math.min(nextSample, nextFork);
    advance(nextAge - age);
    age = nextAge;
    // Lanes never cross, and neither may the waves on them: the drawn y is
    // held in lane order at every sample. Lines get a point at each yearly
    // sample; a fork between samples adds one only to the line that forks,
    // so the drawing holds a point per line per sample, not per event.
    const sampling = nextAge >= nextSample - 1e-9;
    const due = lines.filter(line => line.nextSplit <= age + 1e-9);
    if (sampling) {
      let floor = -Infinity;
      for (const line of lines) {
        // A hair apart at least, so order is never a tie.
        const y = Math.max(floor + 0.01, yAt(line, age));
        floor = y;
        line.points.push({ x: round(xForAge(age)), y: round(y), age });
      }
    }
    if (age >= options.maxAge) break;

    // A few lines end here. Never the last line, and never in the trunk.
    // Each line draws one number a year; the year's hazard accumulates over
    // the events inside it, and the line ends at the event where the
    // accumulated hazard passes its draw.
    const elapsed = age - lastSampledAge;
    if (elapsed > 0 && lines.length > 1) {
      const year = Math.floor(age - 1e-9);
      const ending = lines.filter(line => {
        // Not the trunk, and not a line reaching for the edge: an ending
        // there would hand the reach to its neighbour mid-flight.
        if (line.branchId === 'r' || line.edge.target === 1) return false;
        if (line.hazardYear !== year) {
          line.hazardYear = year;
          line.hazard = 0;
        }
        line.hazard += endingChance(options.ageOffset + age, elapsed);
        return randomUnit(`${seed}|laminar|${line.branchId}|end|${year}`) < line.hazard;
      });
      for (const line of ending) {
        if (lines.length <= 1) break;
        pointNow(line, age);
        endLine(line, age, false, 'ended');
        lines.splice(lines.indexOf(line), 1);
      }
      if (ending.length) respread();
    }
    lastSampledAge = age;

    // Forks due now, in lane order so a run is one drawing.
    for (const line of due) {
      const remaining = options.maxAge - age;
      const roll = randomUnit(`${seed}|laminar|${line.branchId}|split|${line.splitIndex}`);
      const guaranteed = line.branchId === 'r' && line.splitIndex === 0 && options.firstSplitAge !== null;
      // Centre bias favours forks in the middle band, where readers look.
      const centre = 1 - (options.centerBias ?? 0) * Math.min(1, Math.abs(rankAt(line) - 0.5) * 2);
      const chance = options.splitProbability * ageWeight(options, age) * centre;
      // A line reaching for the edge neither forks nor ends: its children
      // would drop back into the band and draw a loop.
      const mayFork = line.edge.target !== 1 && remaining >= step * 1.5 && inside(line) && (guaranteed || roll < chance);
      const big = mayFork && isBigFork(line, age);
      const count = mayFork ? childCount(line, age, big) : 0;
      if (count <= 0) {
        line.splitIndex += 1;
        line.nextSplit = age + randomRange(`${seed}|laminar|${line.branchId}|interval|${line.splitIndex}`, options.splitMin, options.splitMax);
        continue;
      }
      pointNow(line, age);
      const fork = endLine(line, age, true);
      const rank = rankAt(line);
      const waveNow = waveAt(line, age);
      const children = [];
      for (let child = 0; child < count; child += 1) {
        const childLine = newLine(`${line.branchId}${child}`, fork.id, age, rank, line.depth + 1, waveNow, line.lane.velocity, line.edge);
        childLine.points.push({ x: fork.x, y: fork.y, age });
        children.push(childLine);
      }
      const at = lines.indexOf(line);
      // An edge role goes to the child on the outside; the rest let it go.
      if (line.edge.target === 1) {
        const keeper = at === 0 ? children[0] : children[children.length - 1];
        for (const child of children) child.edge.target = child === keeper ? 1 : 0;
      }
      lines.splice(at, 1, ...children);
      choicePoints.push({ id: fork.id, age, x: fork.x, y: fork.y, options: children.map(child => `e-${child.branchId}`) });
      respread();
      // A fork has to read as a fork: the line carries on through it, and
      // the other children peel off toward their lanes at an angle, with the
      // damping bringing them in. Without the angle they leave parallel to
      // the parent and the fork is invisible; without the one that carries
      // on, every line swerves at every fork.
      // The wide opening rounds (the lab's Wide opening rounds) push off at
      // the opening angle; later forks at the later branch spacing.
      const wide = line.depth < options.wideForkLevels;
      const departure = wide ? options.openingAngle / 75
        : big ? Math.max(options.laterBranchSpacing / 10, options.openingAngle / 110)
          : options.laterBranchSpacing / 10;
      const carriesOn = children.reduce((closest, child) =>
        (Math.abs(child.lane.target - rank) < Math.abs(closest.lane.target - rank) ? child : closest));
      for (const child of children) {
        if (child === carriesOn) continue;
        child.lane.velocity += (child.lane.target - child.lane.value) * omega * departure;
      }
    }
  }
  for (const line of lines) endLine(line, options.maxAge, false, inside(line) ? 'horizon' : 'boundary-exit');
  // How far each edge can still lead: to the horizon unless everything past
  // it has ended. Routes prefer the edges that lead furthest.
  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  const reachable = new Map();
  const reachableFrom = nodeId => {
    if (reachable.has(nodeId)) return reachable.get(nodeId);
    const node = nodeById.get(nodeId);
    const value = node.outgoing.length === 0
      ? node.age
      : Math.max(...node.outgoing.map(edgeId => reachableFrom(edgeById.get(edgeId).to)));
    reachable.set(nodeId, value);
    return value;
  };
  for (const edge of edges) edge.reachableUntilAge = reachableFrom(edge.to);

  return {
    version: 2,
    seed,
    config: { ...options },
    bounds: { x: 0, y: 0, width: options.width, height: options.height },
    maxAge: options.maxAge,
    rootId,
    nodes,
    edges,
    choicePoints,
  };
}
