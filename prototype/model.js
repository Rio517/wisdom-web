import { COMPARISONS } from './story.js';
import { generateNetwork, projectScenario } from '../src/engine/path-network.js';
import { generateLabFuture } from '../src/engine/lab-future.js';

export const AGES = [8, 12, 16, 25, 40, 60];
export const OVERVIEW = { x: 0, y: 0, width: 1260, height: 740 };

const LAYER_ORDER = ['pattern', 'starting'];
const COMPARISON_IDS = ['gap', 'build', 'repair'];
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const ease = value => value * value * (3 - 2 * value);
const normalizeAge = value => AGES.includes(Number(value)) ? Number(value) : 8;

function normalizeLayers(value) {
  const requested = Array.isArray(value) ? value : [];
  return LAYER_ORDER.filter(layer => requested.includes(layer));
}

function normalizeState(value = {}) {
  const age = normalizeAge(value.age);
  const requestedInspect = Number(value.inspect);
  const canInspect = AGES.includes(requestedInspect)
    && (requestedInspect <= age || (age === 8 && requestedInspect === 12));
  const inspect = value.inspect === null || value.inspect === undefined || !canInspect
    ? null
    : requestedInspect;
  const hasComparison = inspect === 12;

  return {
    age,
    scene: value.scene === 'learning' ? 'learning' : 'possibilities',
    selected: value.selected === true || inspect !== null,
    overview: value.overview === true,
    inspect,
    comparison: hasComparison && COMPARISON_IDS.includes(value.comparison)
      ? value.comparison
      : 'gap',
    layers: hasComparison ? normalizeLayers(value.layers) : [],
  };
}

export function readState(input) {
  const url = new URL(input);
  const layerValue = url.searchParams.get('layers');
  return normalizeState({
    age: url.searchParams.get('age'),
    scene: url.hash === '#learning' ? 'learning' : 'possibilities',
    selected: url.searchParams.get('selected') === '1',
    overview: url.searchParams.get('overview') === '1',
    inspect: url.searchParams.has('inspect') ? url.searchParams.get('inspect') : null,
    comparison: url.searchParams.get('choice') || 'gap',
    layers: layerValue ? layerValue.split(',') : [],
  });
}

export function stateURL(state, input) {
  const normalized = normalizeState(state);
  const fields = new URLSearchParams({ age: String(normalized.age) });
  if (normalized.selected) fields.set('selected', '1');
  if (normalized.overview) fields.set('overview', '1');
  if (normalized.inspect !== null) fields.set('inspect', String(normalized.inspect));
  if (normalized.comparison !== 'gap') fields.set('choice', normalized.comparison);
  if (normalized.layers.length) fields.set('layers', normalized.layers.join(','));

  const url = new URL(input);
  url.search = fields.toString();
  url.hash = normalized.scene === 'learning' ? 'learning' : 'possibilities';
  return url;
}

export function transition(state, change) {
  const next = { ...state, ...change };
  if (Object.hasOwn(change, 'age')) {
    next.inspect = null;
    next.comparison = 'gap';
    next.layers = [];
    next.overview = false;
  } else if (Object.hasOwn(change, 'inspect') && change.inspect === null) {
    next.comparison = 'gap';
    next.layers = [];
  }
  return normalizeState(next);
}

export function motionFrame(elapsed, reduced = false) {
  if (reduced) return { travel: 1, zoom: 1, settled: true };
  return {
    travel: ease(clamp(elapsed / 500)),
    zoom: ease(clamp((elapsed - 500) / 250)),
    settled: elapsed >= 750,
  };
}

const DEFAULT_NETWORK_SEED = 'choices-network-1';
const DEFAULT_CHOICE_SEED = 'mika-example-19';
const networkCache = new Map();
const mapCache = new Map();
const comparisonCache = new Map();
const xy = point => ({ x: point.x, y: point.y });

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function cached(cache, key, build, limit = 24) {
  if (!cache.has(key)) {
    cache.set(key, freeze(build()));
    if (cache.size > limit) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}

function networkFor(options) {
  return cached(networkCache, JSON.stringify(options), () => generateNetwork(options), 8);
}

function atAge(points, age) {
  if (age <= points[0].age) return { ...points[0] };
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].age >= age) {
      const before = points[index - 1], after = points[index];
      const amount = (age - before.age) / (after.age - before.age);
      return { age, x: before.x + (after.x - before.x) * amount, y: before.y + (after.y - before.y) * amount };
    }
  }
  return { ...points.at(-1) };
}

const OPTION_WORDS = new Set(['growthMode', 'boundaryMode']);

function drawingOptions(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new RangeError('networkOptions must be a settings object');
  }
  const settings = {};
  for (const [field, value] of Object.entries(input)) {
    if (OPTION_WORDS.has(field)) {
      if (typeof value !== 'string') throw new RangeError(`${field} must be a string`);
      settings[field] = value;
      continue;
    }
    if (value === null) continue;
    if (!Number.isFinite(value)) throw new RangeError(`${field} must be a finite number`);
    settings[field] = value;
  }
  return settings;
}

export function makeMap(value, scenario = {}) {
  const age = normalizeAge(value);
  const networkSeed = scenario.networkSeed ?? DEFAULT_NETWORK_SEED;
  if (typeof networkSeed !== 'string' || !networkSeed.length) {
    throw new RangeError('networkSeed must be a non-empty string');
  }
  const requestedChoiceSeed = scenario.choiceSeed ?? DEFAULT_CHOICE_SEED;
  const choiceSeed = typeof requestedChoiceSeed === 'string' ? requestedChoiceSeed : 'example';
  const choices = Object.fromEntries(Object.entries(scenario.choices ?? {})
    .filter(([, value]) => typeof value === 'string'));
  const annotations = scenario.annotations ?? {};
  const networkOptions = drawingOptions(scenario.networkOptions ?? {});
  const fanSettings = scenario.fan && typeof scenario.fan === 'object' ? scenario.fan : null;
  const key = JSON.stringify([age, networkSeed, choiceSeed, choices, networkOptions, fanSettings]);
  const build = () => {
    const network = networkFor({
      seed: networkSeed, width: OVERVIEW.width, height: OVERVIEW.height,
      maxAge: 100, splitMin: 5.5, splitMax: 13.5, splitProbability: 0.78, maxTips: 96,
      openingSplitMin: 1, openingSplitMax: 3,
      ...networkOptions,
      // Laminar growth opens its field and spends its budget by the age in view.
      ...(networkOptions.growthMode === 'laminar' ? { envelopeAge: Math.max(4, age) } : {}),
    });
    const projected = projectScenario(network, { age, choiceSeed, choices, annotations });
    // With fan settings, the futures are a fresh fan from Today (a narrower
    // one later in life), drawn instead of the network's own continuation.
    const fan = fanSettings ? generateLabFuture(network, projected, fanSettings) : null;
    return {
      network,
      fan,
      anchor: { age, ...xy(projected.today) },
      anchors: AGES.map(moment => ({ age: moment, ...xy(atAge(projected.spine, moment)) })),
      spine: projected.spine.map(xy),
      past: projected.past.map(xy),
      future: projected.future.map(xy),
      segments: projected.segments,
      choicePoints: projected.choicePoints,
      selections: projected.selections,
      focus: { x: 16, y: 14, width: 1228, height: 712 },
    };
  };
  // Geometry stays cached; authored metadata is copied afresh, never folded
  // into a lossy JSON cache key (for example NaN and null stringify equally).
  return Object.keys(annotations).length ? freeze(build()) : cached(mapCache, key, build);
}

// The comparison remains an authored lesson, not a forecast. Its small branch
// diagram uses the same growth engine; local progress is not the life-age axis.
export function comparisonRoutes(value, scenario = {}) {
  const mode = COMPARISON_IDS.includes(value) ? value : 'gap';
  const anchor = makeMap(12, scenario).anchor;
  return cached(comparisonCache, JSON.stringify([mode, anchor.x, anchor.y]), () => {
    const graph = networkFor({
      seed: 'lesson-' + mode, maxTips: mode === 'repair' ? 2 : 1,
      splitMin: 40, splitMax: 60, splitProbability: 1, crowdingSplitSuppression: 0,
    });
    const root = graph.nodes.find(node => node.id === graph.rootId);
    const xScale = (OVERVIEW.width - 120 - anchor.x) / (OVERVIEW.width - 80);
    const yScale = Math.min(0.65, (anchor.y - 30) / root.y, (OVERVIEW.height - 30 - anchor.y) / root.y);
    const transform = point => ({
      x: anchor.x + (point.x - root.x) * xScale,
      y: anchor.y + (point.y - root.y) * yScale,
    });
    const section = (points, from, to) => [
      atAge(points, from),
      ...points.filter(point => point.age > from && point.age < to),
      atAge(points, to),
    ].map(transform);
    let routes;
    if (mode === 'repair') {
      const fork = graph.choicePoints[0];
      const work = projectScenario(graph, { age: 0, choices: { [fork.id]: fork.options[0] } }).spine;
      const missed = projectScenario(graph, { age: 0, choices: { [fork.id]: fork.options[1] } }).spine;
      const later = fork.age + (graph.maxAge - fork.age) * 0.5;
      routes = [
        section(work, 0, fork.age * 0.5),
        section(work, fork.age * 0.5, fork.age),
        section(work, fork.age, later),
        section(missed, fork.age, graph.maxAge),
        section(work, later, graph.maxAge),
      ];
    } else {
      const route = projectScenario(graph, { age: 0 }).spine;
      routes = [section(route, 0, 100 / 3), section(route, 100 / 3, 200 / 3), section(route, 200 / 3, 100)];
    }
    return COMPARISONS[mode].outcomes.map((outcome, index) => ({
      id: outcome.id, label: outcome.label, status: outcome.status, points: routes[index],
    }));
  });
}

export function pointOnRoute(points, progress) {
  if (!Array.isArray(points) || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y };

  const lengths = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    );
    lengths.push(length);
    total += length;
  }
  if (total === 0) return { x: points[0].x, y: points[0].y };

  const target = total * clamp(progress);
  let travelled = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    const next = travelled + lengths[index];
    if (target <= next || index === lengths.length - 1) {
      const segmentProgress = lengths[index] === 0 ? 0 : (target - travelled) / lengths[index];
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * segmentProgress,
        y: points[index].y + (points[index + 1].y - points[index].y) * segmentProgress,
      };
    }
    travelled = next;
  }
  return { x: points.at(-1).x, y: points.at(-1).y };
}
