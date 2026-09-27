import test from 'node:test';
import assert from 'node:assert/strict';
import { generateNetwork, projectScenario } from '../src/engine/path-network.js';
import * as futureModule from '../src/engine/lab-future.js';

const BASE_OPTIONS = {
  seed: 'lab-future-base', width: 1260, height: 740, maxAge: 70,
  maxTips: 130, maxEdges: 259, sampleAgeStep: 1,
  splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
  openingSplitMin: 1, openingSplitMax: 3, openingBurst: 0.8,
  turnStrength: 5.2, turnMin: 4.5, turnMax: 14,
  crowdingStrength: 1.2, crowdingRadius: 58,
};

const SETTINGS = {
  choiceSeed: 'future-route', maxTips: 130, todayBurst: 0.82,
  growthMode: 'paced', firstChildrenMin: 4, firstChildrenMax: 5,
  laterChildrenMin: 3, laterChildrenMax: 6,
  ageTaper: 0.7, burstSpan: 5, forkSpread: 120,
  boundaryMode: 'exit', exitMargin: 40,
};

function departureSlopeSpan(graph) {
  const choice = graph.choicePoints[0];
  // Compare a fixed visible distance, not a sample index. Descendants may
  // branch before a gentle departure arc finishes.
  const x = choice.x + 16;
  const slopes = graph.edges.filter(edge => edge.points[0].x <= x
    && edge.points.at(-1).x >= x).map(edge => {
    const index = edge.points.findIndex(point => point.x >= x);
    const after = edge.points[index];
    const before = edge.points[Math.max(0, index - 1)];
    const amount = after.x === before.x ? 0 : (x - before.x) / (after.x - before.x);
    const y = before.y + (after.y - before.y) * amount;
    return (y - choice.y) / (x - choice.x);
  });
  assert.ok(slopes.length >= 4, 'the near-opening cross-section retains the abundant fan');
  return Math.max(...slopes) - Math.min(...slopes);
}

test('lab future is absent until there is a selected remaining horizon', async () => {
  assert.equal(typeof futureModule.generateLabFuture, 'function');
  if (!futureModule.generateLabFuture) return;

  const network = {
    seed: 'base', maxAge: 70,
    bounds: { x: 0, y: 0, width: 1260, height: 740 },
    config: { seed: 'base', maxAge: 70, width: 1260, height: 740 },
  };
  const settings = { choiceSeed: 'route', maxTips: 100, todayBurst: 0.8 };
  assert.equal(futureModule.generateLabFuture(network, {}, settings), null);
  assert.equal(futureModule.generateLabFuture(network, { age: 0, today: { x: 40, y: 370 } }, settings), null);
  assert.equal(futureModule.generateLabFuture(network, { age: 69.5, today: { x: 1211.6, y: 370 } }, settings), null);
  assert.equal(futureModule.generateLabFuture(network, {
    age: 25, today: { x: 461.4286, y: 250 }, routeExited: true,
  }, settings), null, 'a route already committed to a boundary exit gets no invented continuation');
});

test('a middle-age future starts exactly at Today and quickly opens into a substantial fresh fan', () => {
  const network = generateNetwork(BASE_OPTIONS);
  const sourceProjection = projectScenario(network, { age: 25, choiceSeed: SETTINGS.choiceSeed });
  const exactToday = {
    ...sourceProjection.today,
    x: sourceProjection.today.x + 0.0000003,
    y: sourceProjection.today.y + 0.0000007,
  };
  const projection = {
    ...sourceProjection,
    today: exactToday,
    past: [...sourceProjection.past.slice(0, -1), exactToday],
  };
  const original = structuredClone({ network, projection });

  const future = futureModule.generateLabFuture(network, projection, SETTINGS);

  assert.ok(future);
  const root = future.nodes.find(node => node.id === future.rootId);
  assert.deepEqual({ x: root.x, y: root.y, age: root.age }, {
    x: projection.today.x, y: projection.today.y, age: 25,
  });
  const firstFork = future.choicePoints[0];
  assert.ok(firstFork.x > projection.today.x && firstFork.x - projection.today.x < 3,
    'the new fan opens immediately after Today without overlapping the dot');
  assert.ok(firstFork.options.length >= 4 && firstFork.options.length <= 5);
  assert.ok(future.choicePoints.slice(1).every(point => (
    point.options.length >= 3 && point.options.length <= 6
  )));
  assert.ok(future.nodes.filter(node => node.outgoing.length === 0).length >= 8);
  assert.equal(future.config.forkSpread, 120);
  const local = generateNetwork(future.config);
  const localSpan = departureSlopeSpan(local);
  const mappedSpan = departureSlopeSpan(future);
  assert.ok(localSpan > 0.2, 'the configured 120-degree fork creates a broad local departure');
  assert.ok(mappedSpan >= localSpan * 0.85,
    'the Today graft preserves the initial sibling angular spread before easing into bounds');
  assert.deepEqual({ network, projection }, original, 'future generation cannot mutate its source scene');
  assert.doesNotThrow(() => JSON.stringify(future));
});

test('fresh future geometry remains connected, finite, forward-only, age-mapped and in bounds', () => {
  const network = generateNetwork(BASE_OPTIONS);
  for (const age of [1, 12, 25, 40, 69]) {
    const projection = projectScenario(network, { age, choiceSeed: SETTINGS.choiceSeed });
    const future = futureModule.generateLabFuture(network, projection, SETTINGS);
    assert.ok(future, `age ${age} retains at least one year of fresh future`);
    assert.equal(future.maxAge, 70);
    assert.equal(future.config.ageHorizon, 100,
      'the 70-year display window does not redefine the conceptual life taper');
    for (const edge of future.edges) {
      assert.ok(edge.points.length >= 2);
      const source = future.nodes.find(node => node.id === edge.from);
      assert.deepEqual(edge.points[0], { x: source.x, y: source.y, age: source.age });
      for (let index = 0; index < edge.points.length; index += 1) {
        const point = edge.points[index];
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.age));
        assert.ok(point.x >= projection.today.x && point.x <= 1220);
        assert.ok(point.y >= -40 && point.y <= 780);
        assert.ok(point.age >= age && point.age <= network.maxAge);
        if (index > 0) {
          assert.ok(point.x >= edge.points[index - 1].x);
          assert.ok(point.age >= edge.points[index - 1].age);
        }
      }
    }
    assert.ok(future.edges.every(edge => future.nodes.some(node => node.id === edge.to)));
  }

  const ended = projectScenario(network, { age: 70, choiceSeed: SETTINGS.choiceSeed });
  assert.equal(futureModule.generateLabFuture(network, ended, SETTINGS), null);
});

test('exit-mode future keeps native vertical geometry and stops branches at the open boundary', () => {
  const network = generateNetwork(BASE_OPTIONS);
  const projection = projectScenario(network, { age: 25, choiceSeed: SETTINGS.choiceSeed });
  const future = futureModule.generateLabFuture(network, projection, SETTINGS);

  assert.equal(future.config.boundaryMode, 'exit');
  assert.equal(future.config.originY, projection.today.y);
  const pastStart = projection.past.at(-2);
  const expectedSlope = (projection.today.y - pastStart.y) / (projection.age - pastStart.age);
  assert.ok(Math.abs(future.config.originSlope - expectedSlope) < 1e-9);

  const local = generateNetwork(future.config);
  const localById = new Map(local.edges.map(edge => [edge.id, edge]));
  for (const edge of future.edges) {
    const source = localById.get(edge.id);
    assert.equal(edge.points.length, source.points.length);
    edge.points.forEach((point, index) => {
      const localPoint = source.points[index];
      assert.ok(Math.abs(point.x - (localPoint.x - 40 + projection.today.x)) < 0.0002);
      assert.equal(point.y, localPoint.y, 'native vertical spread is not compressed or clamped');
      assert.ok(Math.abs(point.age - (localPoint.age + projection.age)) < 0.0002);
    });
  }

  const exits = future.nodes.filter(node => node.terminationReason === 'boundary-exit');
  assert.ok(exits.length > 0, 'the broad fan is allowed to expand beyond the visible field');
  assert.ok(exits.every(node => node.y === -40 || node.y === 780));
  assert.ok(exits.every(node => node.outgoing.length === 0),
    'offscreen branches stop computing once they reach the fade margin');
  assert.ok(future.edges.every(edge => Number.isFinite(edge.reachableUntilAge)
    && edge.reachableUntilAge >= projection.age
    && edge.reachableUntilAge <= network.maxAge),
  'edge reachability metadata is translated onto the displayed age horizon');
});

test('wide Today fans turn gradually instead of introducing sharp departure elbows', () => {
  for (const growthMode of ['paced', 'organic']) {
    const network = generateNetwork({
      ...BASE_OPTIONS, ...SETTINGS, growthMode,
      sampleAgeStep: growthMode === 'organic' ? 0.5 : 1,
      firstSplitAge: 0.12,
    });
    for (const age of [12, 25, 60]) {
      const projection = projectScenario(network, { age, choiceSeed: SETTINGS.choiceSeed });
      const future = futureModule.generateLabFuture(network, projection, { ...SETTINGS, growthMode });
      for (const edge of future.edges) {
        for (let index = 2; index < edge.points.length; index += 1) {
          const [before, corner, after] = edge.points.slice(index - 2, index + 1);
          if (corner.age > age + 10 || corner.x - before.x < 0.4 || after.x - corner.x < 0.4) continue;
          const incoming = Math.atan2(corner.y - before.y, corner.x - before.x);
          const outgoing = Math.atan2(after.y - corner.y, after.x - corner.x);
          const turn = Math.abs(outgoing - incoming) * 180 / Math.PI;
          assert.ok(turn < 30,
            `${growthMode} age ${age}, ${edge.id}: ${turn.toFixed(1)}° elbow at age ${corner.age}`);
        }
      }
    }
  }
});

test('remaining-year generation becomes narrower and lower-capacity as Today advances', () => {
  const network = generateNetwork(BASE_OPTIONS);
  const scenes = [12, 25, 40, 60].map(age => {
    const projection = projectScenario(network, { age, choiceSeed: SETTINGS.choiceSeed });
    const future = futureModule.generateLabFuture(network, projection, SETTINGS);
    return {
      age,
      future,
      tips: future.nodes.filter(node => node.outgoing.length === 0).length,
      span: Math.max(...future.edges.flatMap(edge => edge.points.map(point => point.x)))
        - projection.today.x,
    };
  });

  assert.deepEqual(scenes.map(scene => scene.future.config.maxAge), [58, 45, 30, 10]);
  assert.ok(scenes.every((scene, index) => index === 0
    || scene.future.config.maxTips < scenes[index - 1].future.config.maxTips));
  assert.ok(scenes.every((scene, index) => index === 0 || scene.tips <= scenes[index - 1].tips));
  assert.ok(scenes.every((scene, index) => index === 0 || scene.span < scenes[index - 1].span));
  const expectedWidths = [1057.7143, 838.5714, 585.7143, 248.5714];
  assert.ok(scenes.every((scene, index) => (
    Math.abs(scene.future.config.width - expectedWidths[index]) < 0.0001
  )));
});

test('future generation is deterministic, keeps zero Today boost, and respects zero split probability', () => {
  const network = generateNetwork(BASE_OPTIONS);
  const projection = projectScenario(network, { age: 25, choiceSeed: SETTINGS.choiceSeed });
  const first = futureModule.generateLabFuture(network, projection, SETTINGS);
  const replay = futureModule.generateLabFuture(network, projection, SETTINGS);
  const quieter = futureModule.generateLabFuture(network, projection, { ...SETTINGS, todayBurst: 0.35 });

  assert.deepEqual(replay, first);
  assert.notDeepEqual(quieter, first);
  const noBoost = futureModule.generateLabFuture(network, projection, { ...SETTINGS, todayBurst: 0 });
  assert.ok(noBoost, 'zero Today boost keeps the actual remaining-years future');
  assert.equal(noBoost.config.openingBurst, 0);

  const noSplitNetwork = generateNetwork({
    ...BASE_OPTIONS, seed: 'no-future-splits', splitProbability: 0,
  });
  const noSplitProjection = projectScenario(noSplitNetwork, { age: 25, choiceSeed: SETTINGS.choiceSeed });
  const noSplitFuture = futureModule.generateLabFuture(noSplitNetwork, noSplitProjection, SETTINGS);
  assert.equal(noSplitFuture.choicePoints.length, 0);
  assert.equal(noSplitFuture.nodes.filter(node => node.outgoing.length === 0).length, 1);

  const lowRequestedCapacity = futureModule.generateLabFuture(network, projection, {
    ...SETTINGS, maxTips: 4, firstChildrenMin: 5, firstChildrenMax: 5,
  });
  assert.ok(lowRequestedCapacity.config.maxTips >= 5,
    'the fresh fan budget always leaves room for its requested first fork');
  assert.equal(lowRequestedCapacity.choicePoints[0].options.length, 5);
});

test('scene builder reuses base geometry and style-only scenes while age and network changes stay isolated', () => {
  assert.equal(typeof futureModule.createLabSceneBuilder, 'function');
  if (!futureModule.createLabSceneBuilder) return;
  const build = futureModule.createLabSceneBuilder();
  const first = build({ options: BASE_OPTIONS, settings: SETTINGS, age: 25 });
  const styleOnly = build({
    options: { ...BASE_OPTIONS }, settings: { ...SETTINGS, lineWidth: 3.2 }, age: 25,
  });
  const later = build({ options: { ...BASE_OPTIONS }, settings: SETTINGS, age: 40 });
  const organic = build({
    options: { ...BASE_OPTIONS }, settings: { ...SETTINGS, growthMode: 'organic' }, age: 40,
  });
  const widerFork = build({
    options: { ...BASE_OPTIONS }, settings: { ...SETTINGS, growthMode: 'organic', forkSpread: 135 }, age: 40,
  });
  const changed = build({
    options: { ...BASE_OPTIONS, seed: 'changed-base' }, settings: SETTINGS, age: 40,
  });

  assert.strictEqual(styleOnly, first, 'style-only changes reuse the exact generated scene');
  assert.strictEqual(later.network, first.network, 'moving Today projects the cached base network');
  assert.deepEqual(
    later.projection.past.slice(0, first.projection.past.length - 1),
    first.projection.past.slice(0, -1),
    'the previously traveled prefix does not regenerate when Today moves',
  );
  assert.notStrictEqual(organic, later, 'growth mode invalidates the generated future scene');
  assert.equal(organic.future.config.growthMode, 'organic');
  assert.notStrictEqual(widerFork, organic, 'fork spread invalidates the generated future scene');
  assert.equal(widerFork.future.config.forkSpread, 135);
  assert.notStrictEqual(changed.network, first.network);
});

test('Today resets the broad opening rounds and caches count-scaled spread controls separately', () => {
  const build = futureModule.createLabSceneBuilder();
  const make = patch => build({ options: BASE_OPTIONS, settings: { ...SETTINGS, wideForkLevels: 1, laterBranchSpacing: 12, ...patch }, age: 25 });
  const first = make({});
  const moreOpening = make({ wideForkLevels: 3 });
  const tighterLater = make({ laterBranchSpacing: 6 });
  const contained = make({ boundaryMode: 'contain' });
  assert.equal(first.future.config.wideForkLevels, 1);
  assert.equal(first.future.config.laterBranchSpacing, 12);
  assert.equal(moreOpening.future.config.wideForkLevels, 3);
  assert.equal(tighterLater.future.config.laterBranchSpacing, 6);
  assert.strictEqual(moreOpening.network, first.network, 'changing the Today fan must reuse the original graph');
  assert.notStrictEqual(moreOpening, first, 'the opening exception changes the regenerated future');
  assert.notStrictEqual(tighterLater, first, 'later spacing changes the regenerated future');
  assert.notStrictEqual(contained, first, 'boundary behavior changes the regenerated future');
  assert.notDeepEqual(moreOpening.future.edges, first.future.edges);
  assert.notDeepEqual(tighterLater.future.edges, first.future.edges);
});
