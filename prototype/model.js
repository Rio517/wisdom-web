import { COMPARISONS } from './story.js';

export const AGES = [8, 12, 16, 25, 40, 60];
export const OVERVIEW = { x: 0, y: 0, width: 1260, height: 540 };

const ALL_ANCHORS = [
  { age: 0, x: 40, y: 270 },
  { age: 4, x: 150, y: 290 },
  { age: 8, x: 250, y: 245 },
  { age: 12, x: 350, y: 295 },
  { age: 16, x: 450, y: 247 },
  { age: 25, x: 565, y: 268 },
  { age: 40, x: 700, y: 220 },
  { age: 60, x: 805, y: 258 },
  { age: 80, x: 1015, y: 264 },
  { age: 100, x: 1220, y: 236 },
];

const LAYER_ORDER = ['pattern', 'starting'];
const COMPARISON_IDS = ['gap', 'build', 'repair'];
const round = value => Math.round(value * 10) / 10;
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

function sampleSegment(start, end, steps = 8) {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    points.push({
      x: round(start.x + (end.x - start.x) * progress),
      y: round(start.y + (end.y - start.y) * ease(progress)),
    });
  }
  return points;
}

function samplePolyline(nodes, steps = 6) {
  const points = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const segment = sampleSegment(nodes[index - 1], nodes[index], steps);
    points.push(...(index === 1 ? segment : segment.slice(1)));
  }
  return points;
}

function makeSpine() {
  return samplePolyline(ALL_ANCHORS, 8);
}

function makeBranches(age) {
  const branches = [];
  const add = (originAge, points) => branches.push({
    originAge,
    state: originAge < age ? 'untaken' : 'possible',
    points,
  });

  for (let group = 1; group < ALL_ANCHORS.length - 2; group += 1) {
    const origin = ALL_ANCHORS[group];
    for (const side of [-1, 1]) {
      const distance = 1220 - origin.x;
      const forkX = round(origin.x + distance * (0.4 + group * 0.012));
      const endBase = side < 0 ? 24 + group * 24 : 522 - group * 23;
      const forkY = round(origin.y + (endBase - origin.y) * 0.78);
      add(origin.age, samplePolyline([
        origin,
        { x: round(origin.x + (forkX - origin.x) * 0.48), y: round(origin.y - side * 30) },
        { x: forkX, y: forkY },
      ]));

      for (let twig = 0; twig < 3; twig += 1) {
        const midX = round(forkX + (1220 - forkX) * (0.42 + twig * 0.05));
        const midY = round(Math.max(24, Math.min(516,
          endBase + (twig - 1) * 17 + 12 * Math.sin(group + twig))));
        const sway = 27 * Math.sin(group * 2.4 + twig);
        add(origin.age, samplePolyline([
          { x: forkX, y: forkY },
          { x: round(forkX + (midX - forkX) * 0.52), y: round((forkY + midY) / 2 + sway) },
          { x: midX, y: midY },
        ]));

        const endX = 1160 + ((group * 17 + twig * 13) % 60);
        const endY = round(Math.max(24, Math.min(516,
          midY + 16 * Math.sin(group * 2 + twig))));
        add(origin.age, samplePolyline([
          { x: midX, y: midY },
          { x: round(midX + (endX - midX) * 0.5), y: round((midY + endY) / 2 - sway) },
          { x: endX, y: endY },
        ]));
      }
    }
  }
  return branches;
}

export function makeMap(value) {
  const age = normalizeAge(value);
  const spine = makeSpine();
  const authoredIndex = ALL_ANCHORS.findIndex(point => point.age === age);
  const anchorIndex = authoredIndex * 8;
  const anchor = { ...ALL_ANCHORS[authoredIndex] };
  return {
    anchor,
    anchors: ALL_ANCHORS.filter(point => AGES.includes(point.age)).map(point => ({ ...point })),
    spine,
    past: spine.slice(0, anchorIndex + 1),
    future: spine.slice(anchorIndex),
    branches: makeBranches(age),
    focus: {
      x: round(Math.min(220, Math.max(0, anchor.x - 310))),
      y: 48,
      width: 1040,
      height: 446,
    },
  };
}

const COMPARISON_NODES = {
  gap: {
    'fraction-foundation': [{ x: 350, y: 295 }, { x: 435, y: 326 }, { x: 520, y: 338 }],
    'recipe-ratio': [{ x: 520, y: 338 }, { x: 625, y: 370 }, { x: 730, y: 350 }],
    'first-intake': [{ x: 730, y: 350 }, { x: 825, y: 380 }, { x: 920, y: 380 }],
  },
  build: {
    'fraction-foundation': [{ x: 350, y: 295 }, { x: 435, y: 262 }, { x: 520, y: 250 }],
    'recipe-ratio': [{ x: 520, y: 250 }, { x: 610, y: 226 }, { x: 700, y: 220 }],
    'course-readiness': [{ x: 700, y: 220 }, { x: 800, y: 198 }, { x: 900, y: 204 }],
  },
  repair: {
    'equal-parts-revisit': [{ x: 350, y: 295 }, { x: 425, y: 328 }, { x: 500, y: 330 }],
    'supported-fractions': [{ x: 500, y: 330 }, { x: 575, y: 306 }, { x: 650, y: 300 }],
    'ratio-practice': [{ x: 650, y: 300 }, { x: 725, y: 276 }, { x: 800, y: 270 }],
    'first-intake': [{ x: 650, y: 300 }, { x: 735, y: 355 }, { x: 820, y: 370 }],
    'later-intake': [{ x: 800, y: 270 }, { x: 910, y: 238 }, { x: 1020, y: 242 }],
  },
};

export function comparisonRoutes(value) {
  const mode = COMPARISON_IDS.includes(value) ? value : 'gap';
  return COMPARISONS[mode].outcomes.map(outcome => ({
    id: outcome.id,
    points: samplePolyline(COMPARISON_NODES[mode][outcome.id], 6),
    label: outcome.label,
    status: outcome.status,
  }));
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
