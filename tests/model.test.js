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

test('invalid shared state falls back independently to the complete authored state', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=999&selected=no&overview=yes&inspect=25&choice=unknown&layers=unknown#other',
  ), DEFAULT_STATE);
});

test('valid shared fields survive when neighboring fields are invalid', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=40&selected=no&overview=1&inspect=999&choice=build&layers=starting,unknown#learning',
  ), {
    age: 40,
    scene: 'learning',
    selected: false,
    overview: true,
    inspect: null,
    comparison: 'gap',
    layers: [],
  });
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

test('earlier authored decisions can be inspected without turning them into the age-12 comparison', () => {
  assert.deepEqual(readState(
    'https://example.test/?age=40&selected=1&inspect=25&choice=repair&layers=pattern',
  ), {
    age: 40,
    scene: 'possibilities',
    selected: true,
    overview: false,
    inspect: 25,
    comparison: 'gap',
    layers: [],
  });
  assert.equal(transition(readState('https://example.test/?age=60&selected=1'), { inspect: 40 }).inspect, 40);
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

test('today and authored moments come from one generated time-based route', () => {
  const forty = makeMap(40);
  assert.ok(forty.network?.edges?.length > 1, 'the adapter must expose its generated graph');
  assert.ok(Math.abs(forty.anchor.x - 512) < 0.01, 'age 40 is 40% of the 40–1220 time axis, within sampled rounding');
  assert.deepEqual(forty.anchors.map(point => point.age), AGES);
  for (const age of AGES) {
    const map = makeMap(age);
    assert.deepEqual(map.anchors, forty.anchors, 'changing today must not invent another history');
    assert.deepEqual(map.past.at(-1), { x: map.anchor.x, y: map.anchor.y });
    assert.deepEqual(map.future[0], { x: map.anchor.x, y: map.anchor.y });
    assert.ok(map.past.every(point => point.x <= map.anchor.x));
    assert.ok(map.future.every(point => point.x >= map.anchor.x));
  }
});

test('a scenario seed changes the generated route rather than only a color or label', () => {
  const first = makeMap(40, { networkSeed: 'adapter-first' });
  const second = makeMap(40, { networkSeed: 'adapter-second' });
  assert.notDeepEqual(first.spine, second.spine);
  assert.ok(Math.abs(first.anchor.x - second.anchor.x) < 0.01, 'time scale is independent of the random geometry, within sampled rounding');
  assert.notEqual(first.anchor.y, second.anchor.y, 'today must sit on the generated route');
  assert.deepEqual(makeMap(40, { networkSeed: 'adapter-first' }), first);
});

test('generated map segments stay finite, bounded and forward-moving', () => {
  for (const age of AGES) {
    const map = makeMap(age);
    assert.ok(Array.isArray(map.segments) && map.segments.length > 1);
    const routes = [map.spine, map.past, map.future, ...map.segments.map(segment => segment.points)];
    for (const points of routes) {
      assert.ok(points.length > 0);
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= 0 && point.x <= OVERVIEW.width);
        assert.ok(point.y >= 0 && point.y <= OVERVIEW.height);
        if (index) assert.ok(point.x >= points[index - 1].x);
      }
    }
    assert.ok(map.segments.some(segment => segment.state === 'completed'));
    assert.ok(map.segments.some(segment => segment.state === 'possible'));
  }
});

test('scenario labels attach to stable choice points without changing the drawing', () => {
  const initial = makeMap(40);
  assert.ok(initial.choicePoints?.length > 0);
  const point = initial.choicePoints[0];
  const labeled = makeMap(40, { annotations: { [point.id]: { label: 'Ask for another explanation' } } });
  assert.equal(labeled.choicePoints.find(item => item.id === point.id).annotation.label, 'Ask for another explanation');
  assert.deepEqual(labeled.spine, initial.spine);
  assert.deepEqual(labeled.network.edges, initial.network.edges);
});

test('scenario assumptions can explicitly select a branch without regenerating the network', () => {
  const initial = makeMap(40);
  assert.ok(initial.selections?.length > 0);
  const selection = initial.selections[0];
  const point = initial.choicePoints.find(item => item.id === selection.pointId);
  const alternative = point.options.find(id => id !== selection.edgeId);
  const changed = makeMap(40, { choices: { [point.id]: alternative } });
  assert.deepEqual(changed.network.edges, initial.network.edges);
  assert.notDeepEqual(changed.spine, initial.spine);
  assert.equal(changed.selections.find(item => item.pointId === point.id).assumed, false);
});

test('annotation projections do not collide through lossy JSON cache keys', () => {
  const point = makeMap(40).choicePoints[0];
  const nonFinite = makeMap(40, { annotations: { [point.id]: { score: NaN } } });
  const emptyScore = makeMap(40, { annotations: { [point.id]: { score: null } } });
  assert.ok(Number.isNaN(nonFinite.choicePoints[0].annotation.score));
  assert.equal(emptyScore.choicePoints[0].annotation.score, null);
  assert.deepEqual(nonFinite.network.edges, emptyScore.network.edges);
});

test('scenario cache keys use the same validated primitive inputs as the engine', () => {
  const initial = makeMap(40);
  const point = initial.choicePoints[0];
  const selected = initial.selections.find(selection => selection.pointId === point.id);
  const alternative = point.options.find(id => id !== selected.edgeId);
  makeMap(40, { choices: { [point.id]: alternative } });
  const invalidChoice = makeMap(40, { choices: { [point.id]: new String(alternative) } });
  assert.deepEqual(invalidChoice.selections, initial.selections, 'boxed strings must fall back, not reuse an explicit choice');
  makeMap(40, { networkSeed: 'cache-network' });
  assert.throws(() => makeMap(40, { networkSeed: new String('cache-network') }), RangeError);
  makeMap(40, { choiceSeed: 'cache-scenario' });
  const invalidSeed = makeMap(40, { choiceSeed: new String('cache-scenario') });
  assert.deepEqual(invalidSeed.selections, makeMap(40, { choiceSeed: 'example' }).selections);
});

test('the illustrated middle-age route retains later branching instead of exhausting the drawing budget early', () => {
  const map = makeMap(40);
  const reachable = map.segments.filter(segment => segment.state === 'possible');
  assert.ok(reachable.length >= 11, 'the example needs several actual future forks, not a recolored terminal line');
  assert.ok(map.network.choicePoints.some(point => point.age > 60), 'the drawing must keep branching later in its time span');
});

test('drawing controls change generation without contaminating cached defaults', () => {
  const original = makeMap(40);
  const single = makeMap(40, { networkOptions: { maxTips: 1, splitProbability: 0 } });
  assert.equal(single.network.edges.length, 1);
  assert.equal(single.choicePoints.length, 0);
  assert.deepEqual(makeMap(40).network, original.network);
  assert.throws(() => makeMap(40, { networkOptions: { maxTips: new Number(1) } }), RangeError);
  assert.throws(() => makeMap(40, { networkOptions: { turnStrength: Infinity } }), RangeError);
});

test('comparison overlays attach to the same tuned example route as the map', () => {
  const scenario = { networkSeed: 'different-example', networkOptions: { turnStrength: 8, crowdingStrength: 0 } };
  const anchor = makeMap(12, scenario).anchor;
  for (const mode of ['gap', 'build', 'repair']) {
    assert.deepEqual(comparisonRoutes(mode, scenario)[0].points[0], { x: anchor.x, y: anchor.y });
  }
});

test('focus remains within the drawing while preserving future context', () => {
  for (const age of AGES) {
    const { focus } = makeMap(age);
    assert.ok(focus.x >= 0 && focus.y >= 0);
    assert.ok(focus.x + focus.width <= OVERVIEW.width);
    assert.ok(focus.y + focus.height <= OVERVIEW.height);
    assert.ok(focus.width >= OVERVIEW.width * 0.9);
    assert.ok(focus.height >= OVERVIEW.height * 0.9);
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

test('each comparison grows from the authored age-twelve anchor', () => {
  const anchor = makeMap(12).anchor;
  for (const mode of ['gap', 'build', 'repair']) {
    assert.deepEqual(comparisonRoutes(mode)[0].points[0], { x: anchor.x, y: anchor.y });
  }
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

test('every comparison route coordinate is finite and inside the authored drawing', () => {
  for (const mode of ['gap', 'build', 'repair']) {
    for (const route of comparisonRoutes(mode)) {
      assert.ok(route.points.length >= 2);
      for (const point of route.points) {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= OVERVIEW.x && point.x <= OVERVIEW.x + OVERVIEW.width);
        assert.ok(point.y >= OVERVIEW.y && point.y <= OVERVIEW.y + OVERVIEW.height);
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
