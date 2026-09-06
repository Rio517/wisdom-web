import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGES,
  OVERVIEW,
  comparisonRoutes,
  makeMap,
  motionFrame,
  pointOnRoute,
  readState,
  stateURL,
  transition,
} from '../prototype/model.js';

const DEFAULT_STATE = {
  age: 8,
  scene: 'possibilities',
  selected: false,
  overview: false,
  inspect: null,
  comparison: 'gap',
  layers: [],
};

const EXPECTED_ANCHORS = [
  { age: 8, x: 250, y: 245 },
  { age: 12, x: 350, y: 295 },
  { age: 16, x: 450, y: 247 },
  { age: 25, x: 565, y: 268 },
  { age: 40, x: 700, y: 220 },
  { age: 60, x: 805, y: 258 },
];

test('invalid shared state falls back independently to the complete authored state', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=999&selected=no&overview=yes&inspect=25&choice=unknown&layers=unknown#other',
  ), DEFAULT_STATE);
});

test('shared state restores every field and canonicalizes layer order', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=40&selected=1&overview=1&inspect=12&choice=repair&layers=starting,pattern,starting#learning',
  ), {
    age: 40,
    scene: 'learning',
    selected: true,
    overview: true,
    inspect: 12,
    comparison: 'repair',
    layers: ['pattern', 'starting'],
  });
});

test('age twelve may be inspected looking ahead from age eight', () => {
  const state = readState(
    'https://example.test/?age=8&inspect=12&choice=build&layers=pattern#possibilities',
  );
  assert.equal(state.inspect, 12);
  assert.equal(state.selected, true);
  assert.equal(state.comparison, 'build');
  assert.deepEqual(state.layers, ['pattern']);
});

test('other future moments cannot be restored as memories', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=8&selected=1&inspect=16&choice=repair&layers=pattern,starting',
  ), {
    ...DEFAULT_STATE,
    selected: true,
  });
});

test('state URLs normalize all fields, preserve the hosting path and remove unknown parameters', () => {
  const url = stateURL({
    age: 40,
    scene: 'learning',
    selected: false,
    overview: true,
    inspect: 12,
    comparison: 'repair',
    layers: ['starting', 'bogus', 'pattern'],
  }, 'https://example.test/wisdom/prototype/?junk=secret#old');

  assert.equal(url.href,
    'https://example.test/wisdom/prototype/?age=40&selected=1&overview=1&inspect=12&choice=repair&layers=pattern%2Cstarting#learning');
  assert.deepEqual(readState(url), {
    age: 40,
    scene: 'learning',
    selected: true,
    overview: true,
    inspect: 12,
    comparison: 'repair',
    layers: ['pattern', 'starting'],
  });
});

test('all authored ages survive complete state URL round trips', () => {
  for (const age of AGES) {
    const original = { ...DEFAULT_STATE, age };
    assert.deepEqual(readState(stateURL(original, 'https://example.test/')), original);
  }
});

test('an explicit age change clears inspection, comparison, layers and overview', () => {
  const state = readState(
    'https://example.test/?age=40&selected=1&overview=1&inspect=12&choice=repair&layers=pattern#learning',
  );
  assert.deepEqual(transition(state, { age: 16 }), {
    age: 16,
    scene: 'learning',
    selected: true,
    overview: false,
    inspect: null,
    comparison: 'gap',
    layers: [],
  });
});

test('inspection transitions select age twelve but reject unsupported futures', () => {
  assert.deepEqual(transition(DEFAULT_STATE, { inspect: 12 }), {
    ...DEFAULT_STATE,
    selected: true,
    inspect: 12,
  });
  assert.deepEqual(transition(DEFAULT_STATE, { inspect: 16, comparison: 'repair', layers: ['pattern'] }),
    DEFAULT_STATE);
});

test('scene and whole-map transitions preserve the worked comparison and layers', () => {
  const inspected = readState(
    'https://example.test/?age=40&inspect=12&choice=repair&layers=pattern,starting',
  );
  const learning = transition(inspected, { scene: 'learning' });
  assert.deepEqual(learning, { ...inspected, scene: 'learning' });
  assert.deepEqual(transition(learning, { overview: true }), { ...learning, overview: true });
});

test('returning to today resets comparison layers but preserves today and scene', () => {
  const inspected = readState(
    'https://example.test/?age=40&inspect=12&choice=build&layers=starting#learning',
  );
  assert.deepEqual(transition(inspected, { inspect: null }), {
    age: 40,
    scene: 'learning',
    selected: true,
    overview: false,
    inspect: null,
    comparison: 'gap',
    layers: [],
  });
});

test('dot travels before the camera starts and settles within 800 ms', () => {
  assert.deepEqual(motionFrame(0, false), { travel: 0, zoom: 0, settled: false });
  const underway = motionFrame(200, false);
  assert.ok(underway.travel > 0 && underway.travel < 1);
  assert.equal(underway.zoom, 0);
  assert.equal(motionFrame(550, false).travel, 1);
  assert.ok(motionFrame(650, false).zoom > 0);
  assert.deepEqual(motionFrame(800, false), { travel: 1, zoom: 1, settled: true });
});

test('reduced motion skips both dot travel and zoom animation', () => {
  assert.deepEqual(motionFrame(0, true), { travel: 1, zoom: 1, settled: true });
});

test('maps retain exact authored anchors and join past and future at today', () => {
  for (const expected of EXPECTED_ANCHORS) {
    const map = makeMap(expected.age);
    assert.deepEqual(map.anchor, expected);
    assert.deepEqual(map.anchors, EXPECTED_ANCHORS);
    assert.deepEqual(map.past.at(-1), { x: expected.x, y: expected.y });
    assert.deepEqual(map.future[0], { x: expected.x, y: expected.y });
    assert.deepEqual(map.spine.slice(0, map.past.length), map.past);
    assert.deepEqual(map.spine.slice(map.past.length - 1), map.future);
  }
});

test('every sampled map route is finite, bounded and never reverses horizontally', () => {
  for (const age of AGES) {
    const map = makeMap(age);
    const routes = [map.spine, map.past, map.future, ...map.branches.map(branch => branch.points)];
    for (const points of routes) {
      assert.ok(Array.isArray(points) && points.length > 0);
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= OVERVIEW.x && point.x <= OVERVIEW.x + OVERVIEW.width);
        assert.ok(point.y >= OVERVIEW.y && point.y <= OVERVIEW.y + OVERVIEW.height);
        if (index > 0) assert.ok(point.x >= points[index - 1].x, 'route moved backward');
      }
    }
  }
});

test('branches retain a rich contextual field and stable authored state', () => {
  const map = makeMap(25);
  assert.ok(map.branches.length >= 60, 'retain a field, not a handful of endpoints');
  assert.ok(map.branches.filter(branch => branch.state === 'possible').length >= 24);
  for (const branch of map.branches) {
    assert.equal(branch.state, branch.originAge < 25 ? 'untaken' : 'possible');
  }
  assert.deepEqual(makeMap(25), map);
  assert.deepEqual(makeMap(-1), makeMap(8));
});

test('focus remains within the drawing while preserving future context', () => {
  for (const age of AGES) {
    const { focus } = makeMap(age);
    assert.ok(focus.x >= 0 && focus.y >= 0);
    assert.ok(focus.x + focus.width <= OVERVIEW.width);
    assert.ok(focus.y + focus.height <= OVERVIEW.height);
    assert.ok(focus.width > 800);
  }
});

test('comparison routes expose distinct named consequences in all three views', () => {
  const gap = comparisonRoutes('gap');
  const build = comparisonRoutes('build');
  const repair = comparisonRoutes('repair');

  assert.deepEqual(gap.map(route => [route.id, route.status]), [
    ['fraction-foundation', 'needs-work'],
    ['recipe-ratio', 'needs-work'],
    ['first-intake', 'missed'],
  ]);
  assert.deepEqual(build.map(route => [route.id, route.status]), [
    ['fraction-foundation', 'available'],
    ['recipe-ratio', 'available'],
    ['course-readiness', 'available'],
  ]);
  assert.deepEqual(repair.map(route => [route.id, route.status]), [
    ['equal-parts-revisit', 'needs-work'],
    ['supported-fractions', 'needs-work'],
    ['ratio-practice', 'needs-work'],
    ['first-intake', 'missed'],
    ['later-intake', 'available'],
  ]);
  assert.notDeepEqual(gap.map(route => route.points), build.map(route => route.points));
  assert.notDeepEqual(build.map(route => route.points), repair.map(route => route.points));
});

test('comparison routes progress rightward and recovery eligibility follows its named work', () => {
  const repair = comparisonRoutes('repair');
  const later = repair.find(route => route.id === 'later-intake');
  const work = repair.filter(route => route.status === 'needs-work');
  assert.equal(repair.find(route => route.id === 'first-intake').status, 'missed');
  assert.ok(work.every(route => route.points.at(-1).x < later.points.at(-1).x));

  for (const mode of ['gap', 'build', 'repair']) {
    for (const route of comparisonRoutes(mode)) {
      for (let index = 1; index < route.points.length; index += 1) {
        assert.ok(route.points[index].x >= route.points[index - 1].x);
      }
    }
  }
});

test('pointOnRoute clamps progress and samples cumulative segment length', () => {
  const points = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }];
  assert.deepEqual(pointOnRoute(points, -1), { x: 0, y: 0 });
  assert.deepEqual(pointOnRoute(points, 0.5), { x: 3, y: 0.5 });
  assert.deepEqual(pointOnRoute(points, 2), { x: 3, y: 4 });
});

test('pointOnRoute returns a finite point for single-point and zero-length routes', () => {
  assert.deepEqual(pointOnRoute([{ x: 7, y: 9 }], 0.8), { x: 7, y: 9 });
  assert.deepEqual(pointOnRoute([{ x: 4, y: 5 }, { x: 4, y: 5 }], 0.5), { x: 4, y: 5 });
});
