import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  generateNetwork,
  projectScenario,
  splitProbabilityForStep,
} from '../src/engine/path-network.js';

test('legacy growth retains the pre-mode topology and geometry exactly', () => {
  const network = generateNetwork({
    seed: 'legacy-growth-fixture', maxTips: 12,
    openingBurst: 0.8, openingSplitMin: 1, openingSplitMax: 3,
    firstSplitAge: 0.12,
  });
  const geometry = {
    nodes: network.nodes,
    edges: network.edges,
    choicePoints: network.choicePoints,
  };
  const digest = createHash('sha256').update(JSON.stringify(geometry)).digest('hex');

  assert.equal(digest, '297b376072ca5a025e66aefeef6d054ecd0b2746b1145494b843bad56eebd96e');
  assert.deepEqual(
    generateNetwork({
      seed: 'legacy-growth-fixture', maxTips: 12,
      openingBurst: 0.8, openingSplitMin: 1, openingSplitMax: 3,
      firstSplitAge: 0.12, growthMode: 'legacy',
    }).edges,
    network.edges,
  );
});

test('legacy growth ignores an explicit fork spread without suppressing its divergence', () => {
  const controls = {
    seed: 'legacy-ignores-fork-spread', growthMode: 'legacy', maxTips: 20,
    openingBurst: 0.8, openingSplitMin: 1, openingSplitMax: 3,
  };
  const ordinary = generateNetwork(controls);
  const withIgnoredSpread = generateNetwork({ ...controls, forkSpread: 120 });

  assert.deepEqual(withIgnoredSpread.nodes, ordinary.nodes);
  assert.deepEqual(withIgnoredSpread.edges, ordinary.edges);
  assert.deepEqual(withIgnoredSpread.choicePoints, ordinary.choicePoints);
});

test('legacy growth ignores fork-level shaping options exactly', () => {
  const controls = {
    seed: 'legacy-ignores-fork-levels', growthMode: 'legacy', maxTips: 20,
    openingBurst: 0.8, openingSplitMin: 1, openingSplitMax: 3,
    forkSpread: 120,
  };
  const ordinary = generateNetwork(controls);
  const shaped = generateNetwork({ ...controls, wideForkLevels: 3, laterBranchSpacing: 27 });

  assert.deepEqual(shaped.nodes, ordinary.nodes);
  assert.deepEqual(shaped.edges, ordinary.edges);
  assert.deepEqual(shaped.choicePoints, ordinary.choicePoints);
});

test('paced growth supports bounded multi-child forks without an early quota pause', () => {
  const network = generateNetwork({
    seed: 'paced-multichild', growthMode: 'paced', maxAge: 40, ageHorizon: 100,
    maxTips: 130, maxEdges: 259, splitProbability: 1,
    splitMin: 10, splitMax: 10, openingSplitMin: 1, openingSplitMax: 1,
    openingBurst: 1, burstSpan: 5, firstSplitAge: 0.12,
    firstChildrenMin: 4, firstChildrenMax: 4,
    laterChildrenMin: 3, laterChildrenMax: 3,
  });
  const root = network.choicePoints.find(point => point.id === 'n-r');
  const childForks = network.choicePoints.filter(point => /^n-r[0-3]$/.test(point.id));
  const grandchildForks = network.choicePoints.filter(point => /^n-r[0-3][0-2]$/.test(point.id));

  assert.equal(root.options.length, 4);
  assert.equal(childForks.length, 4);
  assert.ok(childForks.every(point => point.age < 3));
  assert.ok(grandchildForks.length > 0);
  assert.ok(grandchildForks.every(point => point.age < 6));
  assert.ok(network.choicePoints.some(point => point.age > 10),
    'paced growth should ease into later independent forks instead of globally pausing');
});

test('paced launch clocks stay close to Today even when absolute-age taper is strong', () => {
  for (const ageOffset of [0, 40, 60, 85]) {
    const network = generateNetwork({
      seed: `paced-launch-${ageOffset}`, growthMode: 'paced',
      maxAge: 100 - ageOffset, ageOffset, ageHorizon: 100, ageTaper: 0.7,
      maxTips: 24, maxEdges: 60, splitProbability: 1,
      splitMin: 5.5, splitMax: 13.5,
      openingSplitMin: 1, openingSplitMax: 3, openingBurst: 0.85,
      firstSplitAge: 0.12, firstChildrenMin: 4, firstChildrenMax: 4,
      laterChildrenMin: 3, laterChildrenMax: 3,
    });
    const first = network.choicePoints[0];
    const childForks = network.choicePoints.filter(point => /^n-r[0-3]$/.test(point.id));

    assert.equal(first.age, 0.12);
    assert.ok(childForks.length >= 3);
    assert.ok(childForks.every(point => point.age - first.age <= 1.6),
      `paced launch stretched at absolute age ${ageOffset}`);
  }
});

test('paced burst duration changes independent descendant clocks instead of acting as a no-op', () => {
  const controls = {
    seed: 'paced-burst-duration', growthMode: 'paced', maxAge: 24,
    maxTips: 80, maxEdges: 159, splitProbability: 1,
    splitMin: 8, splitMax: 8, openingBurst: 0.85,
    firstSplitAge: 0.12, firstChildrenMin: 4, firstChildrenMax: 4,
    laterChildrenMin: 3, laterChildrenMax: 3,
  };
  const short = generateNetwork({ ...controls, burstSpan: 1 });
  const long = generateNetwork({ ...controls, burstSpan: 12 });
  const earlyDescendantAges = network => network.choicePoints
    .filter(point => point.id !== 'n-r' && point.age < 12)
    .map(point => point.age);

  assert.notDeepEqual(long.choicePoints.map(point => point.age),
    short.choicePoints.map(point => point.age));
  assert.ok(earlyDescendantAges(long).length > earlyDescendantAges(short).length,
    'a longer paced burst should keep descendant clocks accelerated for longer');
});

test('multi-child capacity accounts for k minus one tips and every outstanding edge', () => {
  const controls = {
    seed: 'paced-capacity', growthMode: 'paced', maxAge: 20,
    splitProbability: 1, splitMin: 1, splitMax: 1, openingBurst: 1,
    firstSplitAge: 0.12, firstChildrenMin: 4, firstChildrenMax: 4,
    laterChildrenMin: 3, laterChildrenMax: 3,
  };
  const exact = generateNetwork({ ...controls, maxTips: 6, maxEdges: 8 });
  const short = generateNetwork({ ...controls, maxTips: 5, maxEdges: 7 });
  const disabled = generateNetwork({ ...controls, maxTips: 20, maxEdges: 40, splitProbability: 0 });

  assert.deepEqual(exact.choicePoints.map(point => point.options.length), [4, 3]);
  assert.equal(exact.nodes.filter(node => node.outgoing.length === 0).length, 6);
  assert.equal(exact.edges.length, 8);
  assert.deepEqual(short.choicePoints.map(point => point.options.length), [4]);
  assert.equal(short.edges.length, 5);
  assert.equal(disabled.choicePoints.length, 0);
  assert.equal(disabled.edges.length, 1);
});

test('multi-child siblings leave with locally separated but non-mirrored departures', () => {
  const network = generateNetwork({
    seed: 'paced-organic-siblings', growthMode: 'paced', maxAge: 12,
    maxTips: 5, maxEdges: 6, splitProbability: 1, firstSplitAge: 0.12,
    openingBurst: 1, firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6,
    turnStrength: 0, crowdingStrength: 0, boundaryStrength: 0,
  });
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));
  const fork = network.choicePoints[0];
  const yAfterTwoYears = fork.options.map(edgeId => {
    const edge = edges.get(edgeId);
    return edge.points.find(candidate => candidate.age >= fork.age + 2).y;
  }).sort((a, b) => a - b);
  const gaps = yAfterTwoYears.slice(1).map((y, index) => y - yAfterTwoYears[index]);
  const distances = yAfterTwoYears.map(y => Math.abs(y - fork.y));

  assert.ok(gaps.every(gap => gap > 0.5), 'siblings should resolve local overlap');
  assert.ok(new Set(distances.map(distance => distance.toFixed(2))).size >= 4,
    'sibling departures should retain seeded, non-mirrored magnitudes');
});

test('fork spread opens opt-in sibling fans to the requested broad local angle', () => {
  const network = generateNetwork({
    seed: 'wide-local-forks', growthMode: 'paced', maxAge: 10,
    maxTips: 5, maxEdges: 6, sampleAgeStep: 0.1,
    splitProbability: 1, firstSplitAge: 0.12, openingBurst: 1,
    firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6,
    forkSpread: 120,
    turnMin: 10, turnMax: 10, turnStrength: 0,
    crowdingStrength: 0, boundaryStrength: 0,
  });
  const fork = network.choicePoints[0];
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const xPerAge = (network.bounds.width - 80) / network.maxAge;
  const angles = fork.options.map(edgeId => {
    const edge = edgeById.get(edgeId);
    const point = edge.points.find(candidate => candidate.age >= fork.age + 1);
    const slopePerAge = (point.y - fork.y) / (point.age - fork.age);
    return Math.atan(slopePerAge / xPerAge) * 180 / Math.PI;
  }).sort((a, b) => a - b);

  assert.ok(angles[0] < -40, `expected a steep rising branch, received ${angles[0]}`);
  assert.ok(angles.at(-1) > 40, `expected a steep falling branch, received ${angles.at(-1)}`);
  assert.ok(angles.at(-1) - angles[0] > 95,
    `expected roughly 120 degrees of local spread, received ${angles}`);
  assert.equal(new Set(angles.map(angle => angle.toFixed(2))).size, 5);
});

test('later fork aperture scales with child count while the opening keeps full width', () => {
  const network = generateNetwork({
    seed: 'scaled-later-aperture', growthMode: 'paced', maxAge: 12,
    width: 221.6,
    maxTips: 25, maxEdges: 31, sampleAgeStep: 0.25,
    splitProbability: 1, firstSplitAge: 0.12,
    splitMin: 8, splitMax: 8, openingSplitMin: 0.8, openingSplitMax: 0.8,
    openingBurst: 1, firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 5, laterChildrenMax: 5,
    forkSpread: 120, wideForkLevels: 1, laterBranchSpacing: 12,
    turnMin: 10, turnMax: 10, turnStrength: 0,
    crowdingStrength: 0, boundaryStrength: 0, height: 5000,
  });
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const observedSpan = choice => {
    const angles = choice.options.map(edgeId => {
      const edge = edgeById.get(edgeId);
      const point = edge.points.find(candidate => candidate.age >= choice.age + 3);
      return Math.atan2(point.y - choice.y, point.x - choice.x) * 180 / Math.PI;
    });
    return Math.max(...angles) - Math.min(...angles);
  };
  const opening = network.choicePoints[0];
  const later = network.choicePoints.find(choice => choice.id === 'n-r2');
  // The fixture keeps the lab's 11.8 world-units/year scale. The widest
  // children need roughly 37 world units of arc length to reach their target,
  // so inspect the settled opening rather than an arbitrary mid-arc sample.
  const openingAge = opening.age + 6;
  const openingAngles = network.edges.filter(edge => (
    edge.points[0].age <= openingAge && edge.points.at(-1).age >= openingAge
  )).map(edge => {
    const afterIndex = edge.points.findIndex(point => point.age >= openingAge);
    const after = edge.points[afterIndex];
    const before = edge.points[Math.max(0, afterIndex - 1)];
    const progress = after.age === before.age
      ? 0
      : (openingAge - before.age) / (after.age - before.age);
    const point = {
      x: before.x + (after.x - before.x) * progress,
      y: before.y + (after.y - before.y) * progress,
    };
    return Math.atan2(point.y - opening.y, point.x - opening.x) * 180 / Math.PI;
  });

  assert.ok(Math.max(...openingAngles) - Math.min(...openingAngles) > 95);
  assert.ok(observedSpan(later) > 30 && observedSpan(later) <= 52,
    `five later children should request about 48°, received ${observedSpan(later)}`);
});

test('wide fork steering is one-way and does not hook back on a shared release timer', () => {
  const network = generateNetwork({
    seed: 'one-way-wide-arc', growthMode: 'paced', maxAge: 8,
    width: 174.4,
    maxTips: 5, maxEdges: 6, sampleAgeStep: 1,
    splitProbability: 1, firstSplitAge: 0.12, openingBurst: 1,
    firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6,
    forkSpread: 120, wideForkLevels: 1, laterBranchSpacing: 12,
    turnMin: 8, turnMax: 8, turnStrength: 0,
    crowdingStrength: 0, boundaryStrength: 0, height: 5000,
  });
  const fork = network.choicePoints[0];
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));

  for (const edgeId of fork.options) {
    const points = edgeById.get(edgeId).points;
    const angles = points.slice(1).map((point, index) => Math.atan2(
      point.y - points[index].y,
      point.x - points[index].x,
    ) * 180 / Math.PI);
    const extreme = angles.reduce((best, angle) => (
      Math.abs(angle) > Math.abs(best) ? angle : best
    ), angles[0]);
    const final = angles.at(-1);
    assert.ok(Math.abs(final) >= Math.abs(extreme) - 8,
      `${edgeId} hooked from ${extreme.toFixed(1)}° back to ${final.toFixed(1)}°`);
  }
});

test('wide fork departures ease through rounded angles instead of making an early elbow', () => {
  const network = generateNetwork({
    seed: 'smooth-wide-forks', growthMode: 'paced', maxAge: 12,
    maxTips: 5, maxEdges: 6, sampleAgeStep: 1,
    splitProbability: 1, firstSplitAge: 0.12, openingBurst: 1,
    firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6, forkSpread: 120,
    turnMin: 10, turnMax: 10, turnStrength: 0,
    crowdingStrength: 0, boundaryStrength: 0,
  });
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const fork = network.choicePoints[0];

  for (const edgeId of fork.options) {
    const points = edgeById.get(edgeId).points.filter(point => point.age <= fork.age + 1.1);
    const angles = points.slice(1).map((point, index) => Math.atan2(
      point.y - points[index].y,
      point.x - points[index].x,
    ) * 180 / Math.PI);
    const changes = angles.slice(1).map((angle, index) => Math.abs(angle - angles[index]));
    assert.ok(changes.every(change => change < 28),
      `${edgeId} contains an early ${Math.max(...changes)} degree elbow`);
  }
});

test('wide opt-in forks steer smoothly away from edges without a hard bounce elbow', () => {
  const network = generateNetwork({
    seed: 'smooth-wide-forks', growthMode: 'paced', maxAge: 12,
    maxTips: 5, maxEdges: 6, sampleAgeStep: 1,
    splitProbability: 1, firstSplitAge: 0.12, openingBurst: 1,
    firstChildrenMin: 5, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6, forkSpread: 120,
    turnMin: 10, turnMax: 10, turnStrength: 0,
    crowdingStrength: 0, boundaryStrength: 0,
  });
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));

  for (const edgeId of network.choicePoints[0].options) {
    const points = edgeById.get(edgeId).points;
    const angles = points.slice(1).map((point, index) => Math.atan2(
      point.y - points[index].y,
      point.x - points[index].x,
    ) * 180 / Math.PI);
    const changes = angles.slice(1).map((angle, index) => Math.abs(angle - angles[index]));
    assert.ok(changes.every(change => change < 42),
      `${edgeId} contains a ${Math.max(...changes)} degree boundary elbow`);
  }
});

test('opt-in branches do not settle onto one shared horizontal rail at each soft edge', () => {
  for (const growthMode of ['paced', 'organic']) {
    const network = generateNetwork({
      seed: 'choices-network-1', growthMode,
      maxAge: 100, width: 1260, height: 740,
      maxTips: 130, maxEdges: 259,
      sampleAgeStep: growthMode === 'organic' ? 0.5 : 1,
      splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
      openingSplitMin: 1, openingSplitMax: 3,
      firstSplitAge: 0.12, openingBurst: 0.8,
      firstChildrenMin: 4, firstChildrenMax: 5,
      laterChildrenMin: 3, laterChildrenMax: 6,
      forkSpread: 120, wideForkLevels: 1, laterBranchSpacing: 12,
      ageOffset: 0, ageHorizon: 100, ageTaper: 0.7, burstSpan: 5,
      turnStrength: 4.8, turnMin: 4.5, turnMax: 14,
      crowdingStrength: 1.15, crowdingRadius: 58,
    });
    const horizontalBySide = { top: [], bottom: [] };
    for (const edge of network.edges) {
      for (let index = 1; index < edge.points.length; index += 1) {
        const start = edge.points[index - 1];
        const end = edge.points[index];
        if (end.x <= 200) continue;
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        if (Math.abs(angle) >= 3) continue;
        const middleY = (start.y + end.y) / 2;
        if (middleY < 300) horizontalBySide.top.push(middleY);
        if (middleY > 440) horizontalBySide.bottom.push(middleY);
      }
    }
    for (const [side, values] of Object.entries(horizontalBySide)) {
      const bins = new Map();
      for (const value of values) {
        const bin = Math.round(value / 4) * 4;
        bins.set(bin, (bins.get(bin) ?? 0) + 1);
      }
      const largestRail = Math.max(...bins.values());
      assert.ok(values.length > 100, `${growthMode} ${side} fixture needs edge samples`);
      assert.ok(largestRail / values.length < 0.12,
        `${growthMode} ${side} pooled ${(100 * largestRail / values.length).toFixed(1)}% on one rail`);
    }
  }
});

test('organic step probability is time-step stable and responds to burst age and density', () => {
  const base = {
    growthMode: 'organic', maxAge: 20, ageHorizon: 100,
    splitProbability: 0.5, splitMin: 10, splitMax: 10,
    openingBurst: 0, ageTaper: 0,
  };
  const whole = splitProbabilityForStep(base, 10, 10);
  const half = splitProbabilityForStep(base, 10, 5);
  const combinedHalves = 1 - (1 - half) ** 2;
  const opening = splitProbabilityForStep({ ...base, openingBurst: 1 }, 0, 0.5);
  const afterBurst = splitProbabilityForStep({ ...base, openingBurst: 1 }, 15, 0.5);
  const crowded = splitProbabilityForStep({ ...base, openingBurst: 1 }, 0, 0.5, 4);
  const late = splitProbabilityForStep({ ...base, ageOffset: 80, ageTaper: 1 }, 10, 0.5);

  assert.ok(Math.abs(whole - 0.5) < 1e-12);
  assert.ok(Math.abs(combinedHalves - whole) < 1e-12);
  assert.ok(opening > afterBurst);
  assert.ok(crowded < opening);
  assert.ok(late < afterBurst);
  assert.equal(splitProbabilityForStep({ ...base, splitProbability: 0 }, 0, 0.5), 0);
});

test('organic growth is deterministic, probabilistic at the root, and distinct from paced growth', () => {
  const controls = {
    seed: 'organic-comparison', maxAge: 35, ageHorizon: 100,
    maxTips: 30, maxEdges: 100, sampleAgeStep: 0.5,
    splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
    openingBurst: 0.8, burstSpan: 5, firstSplitAge: 0.12,
    firstChildrenMin: 4, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6,
  };
  const organic = generateNetwork({ ...controls, growthMode: 'organic' });
  const again = generateNetwork({ ...controls, growthMode: 'organic' });
  const paced = generateNetwork({ ...controls, growthMode: 'paced' });

  assert.deepEqual(again, organic);
  assert.notDeepEqual(organic.choicePoints, paced.choicePoints);
  assert.ok(organic.choicePoints[0].age <= 2,
    `expected the opening hazard to fork early, received ${organic.choicePoints[0].age}`);
  assert.notEqual(organic.choicePoints[0].age, 0.12,
    'organic growth should not guarantee firstSplitAge');
  assert.ok(organic.edges.length <= organic.config.maxEdges);
  assert.ok(organic.nodes.filter(node => node.outgoing.length === 0).length <= organic.config.maxTips);
});

test('organic launch is fast across seeds and successful events are staggered within steps', () => {
  const firstAges = [];
  for (const seed of ['organic-fast-a', 'organic-fast-b', 'organic-fast-c', 'organic-fast-d']) {
    const network = generateNetwork({
      seed, growthMode: 'organic', maxAge: 15, ageHorizon: 100,
      maxTips: 30, maxEdges: 80, sampleAgeStep: 0.5,
      splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
      openingBurst: 0.85, burstSpan: 5,
      firstChildrenMin: 4, firstChildrenMax: 5,
      laterChildrenMin: 3, laterChildrenMax: 6,
    });
    firstAges.push(network.choicePoints[0].age);
    assert.ok(network.choicePoints[0].age < 1.25, `${seed} launched too slowly`);
  }
  assert.ok(firstAges.reduce((total, age) => total + age, 0) / firstAges.length < 0.6);

  const network = generateNetwork({
    seed: 'organic-stagger', growthMode: 'organic', maxAge: 15, ageHorizon: 100,
    maxTips: 45, maxEdges: 100, sampleAgeStep: 0.5,
    splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
    openingBurst: 0.85, burstSpan: 5,
    firstChildrenMin: 4, firstChildrenMax: 5,
    laterChildrenMin: 3, laterChildrenMax: 6,
  });
  const fractionalPhases = network.choicePoints.slice(0, 10)
    .map(point => Math.round((point.age % 0.5) * 10000) / 10000);

  assert.ok(fractionalPhases.some(phase => phase > 0.001 && phase < 0.499));
  assert.ok(new Set(fractionalPhases).size >= 4,
    'independent branches should not share one half-year event phase');
});

test('generates a deterministic bounded tree with stable identifiers', () => {
  const first = generateNetwork({ seed: 'stable-example', maxTips: 64 });
  const again = generateNetwork({ seed: 'stable-example', maxTips: 64 });
  const different = generateNetwork({ seed: 'another-example', maxTips: 64 });

  assert.deepEqual(again, first);
  assert.notDeepEqual(different.edges, first.edges);
  assert.deepEqual(first.bounds, { x: 0, y: 0, width: 1260, height: 740 });
  assert.equal(first.version, 2);
  assert.deepEqual(first.config, {
    seed: 'stable-example', maxAge: 100, width: 1260, height: 740,
    splitMin: 5.5, splitMax: 13.5, splitProbability: 0.78,
    openingSplitMin: null, openingSplitMax: null, openingBurst: 0,
    firstSplitAge: null,
    growthMode: 'legacy',
    firstChildrenMin: 2, firstChildrenMax: 2,
    laterChildrenMin: 2, laterChildrenMax: 2,
    ageOffset: 0, ageHorizon: 100, ageTaper: 0, burstSpan: 5, forkSpread: null,
    wideForkLevels: 1, laterBranchSpacing: 12,
    boundaryMode: 'contain', exitMargin: 40, originY: null, originSlope: 0,
    maxTips: 64, maxEdges: 300, envelopeAge: 25, settleYears: 6, waveStrength: 1, openingAngle: 120,
    endingRate: 0,
    sampleAgeStep: 1,
    turnMin: 4.5, turnMax: 14, turnStrength: 4.8, maxSlope: 7.2,
    crowdingStrength: 1.15, crowdingRadius: 58, crowdingSplitSuppression: 0.22,
    boundaryStrength: 1.35, yPadding: 18,
  });
  assert.equal(first.maxAge, 100);
  assert.equal(first.nodes.find(node => node.id === first.rootId)?.age, 0);
  assert.equal(new Set(first.nodes.map(node => node.id)).size, first.nodes.length);
  assert.equal(new Set(first.edges.map(edge => edge.id)).size, first.edges.length);
  assert.ok(first.edges.length <= 300);
  const tips = first.nodes.filter(node => node.outgoing.length === 0);
  assert.ok(tips.length >= 50 && tips.length <= 100);
  assert.ok(tips.every(tip => tip.age === first.maxAge));

  const nodeIds = new Set(first.nodes.map(node => node.id));
  const edgeIds = new Set(first.edges.map(edge => edge.id));
  for (const node of first.nodes) {
    assert.ok(Number.isFinite(node.age) && Number.isFinite(node.x) && Number.isFinite(node.y));
    assert.ok(node.x >= 0 && node.x <= 1260 && node.y >= 0 && node.y <= 740);
    assert.ok(node.outgoing.every(edgeId => edgeIds.has(edgeId)));
  }
  for (const edge of first.edges) {
    assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to));
    assert.ok(edge.points.length >= 2);
    for (let index = 0; index < edge.points.length; index += 1) {
      const point = edge.points[index];
      assert.ok(Number.isFinite(point.age) && Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(point.x >= 40 && point.x <= 1220 && point.y >= 0 && point.y <= 740);
      if (index > 0) {
        assert.ok(point.age > edge.points[index - 1].age, `${edge.id} reversed in age`);
        assert.ok(point.x > edge.points[index - 1].x, `${edge.id} reversed in x`);
      }
    }
  }
});

test('exit boundaries preserve the configured origin tangent and stop exactly offscreen', () => {
  const controls = {
    seed: 'open-boundary-single', growthMode: 'paced', boundaryMode: 'exit',
    maxAge: 10, ageHorizon: 100, width: 200, height: 200,
    maxTips: 1, maxEdges: 1, sampleAgeStep: 1,
    splitProbability: 0, turnMin: 10, turnMax: 10,
    turnStrength: 0, boundaryStrength: 3,
    originY: 10, originSlope: -7, exitMargin: 5,
  };
  const open = generateNetwork(controls);
  const contained = generateNetwork({ ...controls, boundaryMode: 'contain' });
  const reentering = generateNetwork({
    ...controls, originY: -4, originSlope: 7,
  });
  const openTip = open.nodes.find(node => node.outgoing.length === 0);
  const openEdge = open.edges[0];

  assert.deepEqual(openEdge.points[0], { x: 40, y: 10, age: 0 });
  assert.equal(openEdge.points.at(-1).y, -5);
  assert.ok(openEdge.points.at(-1).age > 0 && openEdge.points.at(-1).age < 10);
  assert.equal(openTip.terminationReason, 'boundary-exit');
  assert.equal(openEdge.reachableUntilAge, openTip.age);
  assert.equal(contained.nodes.at(-1).age, 10);
  assert.ok(contained.nodes.at(-1).y >= 0 && contained.nodes.at(-1).y <= 200);
  assert.equal(Object.hasOwn(contained.nodes.at(-1), 'terminationReason'), false,
    'the legacy containment shape should not gain geometry metadata');
  assert.equal(reentering.edges[0].points[0].y, -4,
    'an exit-mode future may begin inside the offscreen margin and return');
  assert.equal(reentering.nodes.at(-1).terminationReason, 'horizon');

  const boundaryOrigin = generateNetwork({
    ...controls, originY: 0, originSlope: -7, exitMargin: 0,
  });
  assert.equal(boundaryOrigin.edges[0].points.at(-1).y, 0);
  assert.ok(boundaryOrigin.edges[0].points.at(-1).age > 0);
  assert.ok(boundaryOrigin.edges[0].points.at(-1).x > 40,
    'an outward-facing margin origin should still produce a forward edge');
});

test('exit boundaries retain path budgets while pruning offscreen computation', () => {
  for (const growthMode of ['paced', 'organic']) {
    const network = generateNetwork({
      seed: 'choices-network-1', growthMode, boundaryMode: 'exit', exitMargin: 40,
      maxAge: 100, width: 1260, height: 740,
      maxTips: 130, maxEdges: 259,
      sampleAgeStep: growthMode === 'organic' ? 0.5 : 1,
      splitProbability: 0.78, splitMin: 5.5, splitMax: 13.5,
      openingSplitMin: 1, openingSplitMax: 3,
      firstSplitAge: 0.12, openingBurst: 0.8, burstSpan: 5,
      firstChildrenMin: 4, firstChildrenMax: 5,
      laterChildrenMin: 3, laterChildrenMax: 6,
      forkSpread: 120, wideForkLevels: 1, laterBranchSpacing: 12,
      ageOffset: 0, ageHorizon: 100, ageTaper: 0.7,
    });
    const tips = network.nodes.filter(node => node.outgoing.length === 0);
    const exited = tips.filter(node => node.terminationReason === 'boundary-exit');
    const horizon = tips.filter(node => node.terminationReason === 'horizon');

    // Lines that leave the drawing hand their place back, so the budget
    // bounds the lines still inside, and the field keeps forking later on.
    assert.ok(horizon.length <= 130, `${growthMode} keeps the horizon within the budget`);
    assert.ok(tips.length > 130, `${growthMode} should reuse places freed by exits`);
    assert.ok(exited.length > 0, `${growthMode} should let some branches leave the frame`);
    assert.ok(horizon.length > 20, `${growthMode} should retain many selectable horizon routes`);
    assert.ok(exited.every(node => node.age < network.maxAge));
    assert.ok(network.edges.every(edge => Number.isFinite(edge.reachableUntilAge)));
  }
});

test('fork divergence establishes a broad early field without fixed lanes', () => {
  const network = generateNetwork({
    seed: 'choices-network-1', splitMin: 5.5, splitMax: 13.5,
    splitProbability: 0.78, maxTips: 120,
  });
  const yAt = (edge, age) => {
    const afterIndex = edge.points.findIndex(point => point.age >= age);
    const after = edge.points[afterIndex];
    if (after.age === age) return after.y;
    const before = edge.points[afterIndex - 1];
    const progress = (age - before.age) / (after.age - before.age);
    return before.y + (after.y - before.y) * progress;
  };
  const crossings = network.edges.filter(edge => (
    edge.points[0].age <= 40 && edge.points.at(-1).age >= 40
  )).map(edge => yAt(edge, 40));

  assert.ok(crossings.length >= 8);
  assert.ok(Math.max(...crossings) - Math.min(...crossings) >= 210,
    'the field should already read as branching by age 40');
  assert.ok(new Set(crossings.map(y => Math.round(y / 12))).size >= crossings.length * 0.7,
    'branches should not settle into repeated horizontal lanes');
});

test('children share the fork point and depart close to the parent tangent', () => {
  const network = generateNetwork({ seed: 'shared-tangent', maxTips: 48 });
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));
  for (const choice of network.choicePoints) {
    const parent = network.edges.find(edge => edge.to === choice.id);
    const parentEnd = parent.points.at(-1);
    const parentBefore = parent.points.at(-2);
    const parentSlope = (parentEnd.y - parentBefore.y) / (parentEnd.x - parentBefore.x);
    for (const childId of choice.options) {
      const child = edges.get(childId);
      assert.deepEqual(child.points[0], parentEnd);
      const childSlope = (child.points[1].y - child.points[0].y)
        / (child.points[1].x - child.points[0].x);
      assert.ok(Math.abs(childSlope - parentSlope) < 0.04,
        `${childId} left its parent's direction too abruptly`);
    }
  }
});

test('early opening-burst children still depart smoothly from the parent tangent', () => {
  const network = generateNetwork({
    seed: 'choices-network-1', maxTips: 151,
    openingSplitMin: 1, openingSplitMax: 3, openingBurst: 0.8,
  });
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));

  for (const choice of network.choicePoints) {
    if (choice.age >= network.maxAge * 0.25) continue;
    const parent = network.edges.find(edge => edge.to === choice.id);
    const parentEnd = parent.points.at(-1);
    const parentBefore = parent.points.at(-2);
    const parentSlope = (parentEnd.y - parentBefore.y) / (parentEnd.x - parentBefore.x);
    for (const childId of choice.options) {
      const child = edges.get(childId);
      const childSlope = (child.points[1].y - child.points[0].y)
        / (child.points[1].x - child.points[0].x);
      assert.ok(Math.abs(childSlope - parentSlope) < 0.04,
        `${childId} left its parent's direction too abruptly during the burst`);
    }
  }
});

test('sibling edges do not duplicate a geometric prefix after their shared fork point', () => {
  const network = generateNetwork({ seed: 'no-repainted-child-prefix', maxTips: 48 });
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));

  for (const choice of network.choicePoints) {
    const [first, second] = choice.options.map(edgeId => edges.get(edgeId));
    assert.deepEqual(first.points[0], second.points[0]);
    assert.notDeepEqual(first.points[1], second.points[1],
      `${first.id} and ${second.id} repaint the same child prefix`);
  }
});

test('sibling departures do not receive mirrored copies of one parent divergence value', () => {
  const network = generateNetwork({
    seed: 'independent-sibling-divergence', maxTips: 2,
    splitMin: 10, splitMax: 10, splitProbability: 1,
    turnStrength: 0, crowdingStrength: 0, boundaryStrength: 0,
  });
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));
  const changes = network.choicePoints[0].options.map(edgeId => {
    const points = edges.get(edgeId).points;
    return (points[2].y - points[1].y) / (points[2].age - points[1].age);
  });

  assert.ok(Math.abs(Math.abs(changes[0]) - Math.abs(changes[1])) > 0.05,
    'independent children should not be exact reflected copies');
});

test('every fork is a true shared connection and every edge appears only once', () => {
  const network = generateNetwork({ seed: 'connected-tree', maxTips: 72 });
  const nodes = new Map(network.nodes.map(node => [node.id, node]));
  const incoming = new Map(network.nodes.map(node => [node.id, 0]));

  for (const edge of network.edges) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    assert.deepEqual(edge.points[0], { x: from.x, y: from.y, age: from.age });
    assert.deepEqual(edge.points.at(-1), { x: to.x, y: to.y, age: to.age });
  }

  assert.equal(incoming.get(network.rootId), 0);
  assert.ok(network.nodes.filter(node => node.id !== network.rootId)
    .every(node => incoming.get(node.id) === 1));
  for (const point of network.choicePoints) {
    assert.deepEqual(point.options, nodes.get(point.id).outgoing);
    assert.equal(point.options.length, 2);
    for (const edgeId of point.options) {
      assert.equal(network.edges.find(edge => edge.id === edgeId).from, point.id);
    }
  }
});

test('growth controls support a single authored fork without ending its children early', () => {
  const network = generateNetwork({
    seed: 'one-symbolic-fork',
    maxAge: 100,
    maxTips: 2,
    splitMin: 40,
    splitMax: 60,
    splitProbability: 1,
  });
  const tips = network.nodes.filter(node => node.outgoing.length === 0);

  assert.equal(network.choicePoints.length, 1);
  assert.equal(network.edges.length, 3);
  assert.equal(tips.length, 2);
  assert.ok(network.choicePoints[0].age >= 40 && network.choicePoints[0].age <= 60);
  assert.ok(tips.every(tip => tip.age === 100 && tip.x === 1220));
});

test('an opt-in opening interval starts the visible fan early without changing later intervals', () => {
  const network = generateNetwork({
    seed: 'early-opening', maxTips: 8, splitMin: 20, splitMax: 30,
    splitProbability: 1, openingSplitMin: 1, openingSplitMax: 3,
  });

  assert.ok(network.choicePoints[0].age >= 1 && network.choicePoints[0].age <= 3);
  const childChoiceAges = network.choicePoints.slice(1).map(point => point.age);
  assert.ok(childChoiceAges.every(age => age >= network.choicePoints[0].age + 20));
});

test('an exact first split age guarantees the root fork independently of seed', () => {
  for (const seed of ['exact-root-a', 'exact-root-b', 'exact-root-c', 'exact-root-d']) {
    const network = generateNetwork({
      seed, maxTips: 2, splitProbability: 0.01,
      splitMin: 40, splitMax: 60, firstSplitAge: 0.12,
    });

    assert.equal(network.choicePoints.length, 1);
    assert.equal(network.choicePoints[0].age, 0.12);
    assert.equal(network.edges[0].points.at(-1).age, 0.12);
  }
});

test('an exact near-origin root fork resolves same-side siblings into a visible separation', () => {
  const network = generateNetwork({
    seed: 'choices-network-1', maxTips: 2,
    splitProbability: 1, firstSplitAge: 0.12,
    turnStrength: 0, crowdingStrength: 0, boundaryStrength: 0,
  });
  const fork = network.choicePoints[0];
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const yAt = (edge, age) => {
    const afterIndex = edge.points.findIndex(point => point.age >= age);
    const after = edge.points[afterIndex];
    const before = edge.points[afterIndex - 1];
    const progress = (age - before.age) / (after.age - before.age);
    return before.y + (after.y - before.y) * progress;
  };
  const departures = fork.options.map(edgeId => yAt(edgeById.get(edgeId), 2) - fork.y);

  assert.ok(departures[0] * departures[1] < 0,
    'the near-origin root children should leave on opposite sides');
  assert.ok(Math.abs(departures[0] - departures[1]) >= 6,
    'the fork should be visible within the first two years');
  assert.ok(Math.abs(Math.abs(departures[0]) - Math.abs(departures[1])) > 0.25,
    'opposite directions must retain independent seeded magnitudes');
});

test('an already-opposed exact root fork keeps its seeded child directions', () => {
  const network = generateNetwork({
    seed: 'opposite-existing', maxTips: 2,
    splitProbability: 1, firstSplitAge: 0.12,
    turnStrength: 0, crowdingStrength: 0, boundaryStrength: 0,
  });
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const directions = network.choicePoints[0].options.map(edgeId => {
    const points = edgeById.get(edgeId).points;
    return Math.sign(points[2].y - points[1].y);
  });

  assert.deepEqual(directions, [1, -1]);
});

test('exact-root collision handling does not force later siblings apart', () => {
  const network = generateNetwork({
    seed: 'later-same-0', maxTips: 8, firstSplitAge: 0.12,
    splitProbability: 1, splitMin: 10, splitMax: 10,
    turnStrength: 0, crowdingStrength: 0, boundaryStrength: 0,
  });
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const laterFork = network.choicePoints.find(point => point.id === 'n-r00');
  const directions = laterFork.options.map(edgeId => {
    const points = edgeById.get(edgeId).points;
    return Math.sign(points[2].y - points[1].y);
  });

  assert.deepEqual(directions, [-1, -1]);
});

test('an exact first split age stays a root-only event and leaves child clocks ordinary', () => {
  const network = generateNetwork({
    seed: 'root-only-first-event', maxTips: 4, splitProbability: 1,
    splitMin: 20, splitMax: 20, firstSplitAge: 0.12,
  });

  assert.equal(network.choicePoints[0].age, 0.12);
  assert.ok(network.choicePoints.slice(1).every(point => point.age >= 20.12));
});

test('an exact first split respects zero probability and hard capacity', () => {
  const disabled = generateNetwork({
    seed: 'disabled-exact-root', maxTips: 20,
    splitProbability: 0, firstSplitAge: 0.12,
  });
  const capped = generateNetwork({
    seed: 'capped-exact-root', maxTips: 1,
    splitProbability: 1, firstSplitAge: 0.12,
  });

  assert.equal(disabled.choicePoints.length, 0);
  assert.equal(capped.choicePoints.length, 0);
  assert.equal(disabled.edges.length, 1);
  assert.equal(capped.edges.length, 1);
});

test('a tiny one-off first split age is not charged as a repeated work interval', () => {
  const network = generateNetwork({
    seed: 'bounded-one-off-root', maxTips: 151,
    firstSplitAge: 0.001,
  });

  assert.equal(network.choicePoints[0].age, 0.001);
  assert.ok(network.edges.length <= network.config.maxEdges);
});

test('opening burst creates a broad early fan while reserving room for later forks', () => {
  const network = generateNetwork({
    seed: 'choices-network-1', maxTips: 151,
    splitMin: 5.5, splitMax: 13.5, splitProbability: 0.78,
    openingSplitMin: 1, openingSplitMax: 3, openingBurst: 0.8,
  });
  const yAt = (edge, age) => {
    const afterIndex = edge.points.findIndex(point => point.age >= age);
    const after = edge.points[afterIndex];
    if (after.age === age) return after.y;
    const before = edge.points[afterIndex - 1];
    const progress = (age - before.age) / (after.age - before.age);
    return before.y + (after.y - before.y) * progress;
  };
  const crossingsAt = age => network.edges.filter(edge => (
    edge.points[0].age <= age && edge.points.at(-1).age >= age
  ));
  const age12 = crossingsAt(12);
  const age25Y = crossingsAt(25).map(edge => yAt(edge, 25));

  assert.ok(age12.length >= 12 && age12.length <= 20,
    `expected 12-20 routes at age 12, received ${age12.length}`);
  assert.ok(Math.max(...age25Y) - Math.min(...age25Y) >= 250,
    'the opening fan should spread widely before age 25');
  assert.ok(crossingsAt(20).length < network.config.maxTips / 2,
    'the burst must not spend the tip budget near the opening');
  assert.ok(network.choicePoints.some(point => point.age > 60),
    'the network must retain later choices after the opening burst');
});

test('zero opening burst preserves the default topology and geometry', () => {
  const implicit = generateNetwork({ seed: 'zero-burst', maxTips: 48 });
  const explicit = generateNetwork({ seed: 'zero-burst', maxTips: 48, openingBurst: 0 });

  assert.deepEqual(explicit, implicit);
});

test('a null first split age preserves legacy topology and geometry', () => {
  const implicit = generateNetwork({ seed: 'legacy-first-split', maxTips: 48 });
  const explicit = generateNetwork({
    seed: 'legacy-first-split', maxTips: 48, firstSplitAge: null,
  });

  assert.deepEqual(explicit, implicit);
});

test('opening burst does not override a zero split probability', () => {
  const network = generateNetwork({
    seed: 'disabled-splits', maxTips: 151, splitProbability: 0,
    openingSplitMin: 1, openingSplitMax: 3, openingBurst: 1,
  });

  assert.equal(network.choicePoints.length, 0);
  assert.equal(network.edges.length, 1);
});

test('invalid controls fail clearly rather than producing invalid geometry', () => {
  for (const options of [
    { seed: '' },
    { maxAge: 0 },
    { width: 80 },
    { splitMin: 8, splitMax: 7 },
    { splitProbability: 1.1 },
    { openingBurst: -0.01 },
    { openingBurst: 1.01 },
    { openingBurst: Number.NaN },
    { firstSplitAge: Number.NaN },
    { firstSplitAge: Infinity },
    { firstSplitAge: 0 },
    { firstSplitAge: 0.0009 },
    { firstSplitAge: -1 },
    { firstSplitAge: '0.12' },
    { maxAge: 10, firstSplitAge: 10 },
    { maxAge: 10, firstSplitAge: 11 },
    { growthMode: 'waves' },
    { boundaryMode: 'wrap' },
    { exitMargin: -0.01 },
    { height: 100, exitMargin: 101 },
    { exitMargin: Number.NaN },
    { originY: -0.01 },
    { height: 100, originY: 100.01 },
    { boundaryMode: 'exit', height: 100, exitMargin: 20, originY: -20.01 },
    { boundaryMode: 'exit', height: 100, exitMargin: 20, originY: 120.01 },
    { originY: Number.NaN },
    { originSlope: Number.NaN },
    { height: 100, originSlope: 101 },
    { wideForkLevels: 0 },
    { wideForkLevels: 4 },
    { wideForkLevels: 1.5 },
    { laterBranchSpacing: 2.9 },
    { laterBranchSpacing: 30.1 },
    { forkSpread: 14.9 },
    { forkSpread: 160.1 },
    { forkSpread: Number.NaN },
    { firstChildrenMin: 1 },
    { firstChildrenMax: 9 },
    { firstChildrenMin: 5, firstChildrenMax: 4 },
    { laterChildrenMin: 6, laterChildrenMax: 5 },
    { ageOffset: -1 },
    { ageHorizon: 0 },
    { ageTaper: 1.01 },
    { burstSpan: 0 },
    { growthMode: 'paced', maxAge: 30, ageOffset: 80, ageHorizon: 100 },
    { growthMode: 'organic', maxAge: 30, ageOffset: 80, ageHorizon: 100 },
    { openingSplitMin: 2 },
    { openingSplitMin: 3, openingSplitMax: 2 },
    { maxTips: 0 },
    { maxEdges: 0 },
    { crowdingStrength: -1 },
    { sampleAgeStep: Number.NaN },
    { width: 1e308 },
    { maxAge: 1e9 },
    { maxAge: 100, sampleAgeStep: 0.001 },
    { maxAge: 100, turnMin: 1e-300, turnMax: 1 },
    { maxAge: 100, splitMin: 1e-300, splitMax: 1 },
  ]) {
    assert.throws(() => generateNetwork(options), RangeError);
  }
});

test('supported spans retain arbitrary fractional projection ages without rounding', () => {
  const network = generateNetwork({ maxAge: 100, maxTips: 1 });
  const projection = projectScenario(network, { age: 12.34567 });

  assert.equal(network.edges[0].points.at(-1).age, 100);
  assert.equal(projection.age, 12.34567);
  assert.equal(projection.today.age, 12.34567);
  assert.equal(projection.past.at(-1).age, 12.34567);
  assert.equal(projection.future[0].age, 12.34567);
});

test('years-based controls reject microscopic spans and event intervals', () => {
  for (const options of [
    { maxAge: 1e-8, sampleAgeStep: 1e-8, maxTips: 1 },
    { maxAge: 1, sampleAgeStep: 0.0009, maxTips: 1 },
    { maxAge: 1, splitMin: 0.0009, splitMax: 1, maxTips: 1 },
    { maxAge: 1, turnMin: 0.0009, turnMax: 1, maxTips: 1 },
    { maxAge: 1, openingSplitMin: 0.0009, openingSplitMax: 1, maxTips: 1 },
  ]) {
    assert.throws(() => generateNetwork(options), RangeError);
  }
});

test('the global work guard rejects individually valid controls with quadratic total cost', () => {
  assert.throws(
    () => generateNetwork({ seed: 'event-budget-review', sampleAgeStep: 0.025, maxTips: 20 }),
    error => error instanceof RangeError && /total work budget/.test(error.message),
  );
});

function literalTree() {
  const nodes = [
    { id: 'root', age: 0, x: 40, y: 100, outgoing: ['e-root'] },
    { id: 'fork', age: 30, x: 300, y: 100, outgoing: ['e-up', 'e-down'] },
    { id: 'up-fork', age: 60, x: 600, y: 50, outgoing: ['e-up-a', 'e-up-b'] },
    { id: 'down-fork', age: 60, x: 600, y: 150, outgoing: ['e-down-a', 'e-down-b'] },
    { id: 'up-a-tip', age: 100, x: 1220, y: 30, outgoing: [] },
    { id: 'up-b-tip', age: 100, x: 1220, y: 70, outgoing: [] },
    { id: 'down-a-tip', age: 100, x: 1220, y: 130, outgoing: [] },
    { id: 'down-b-tip', age: 100, x: 1220, y: 170, outgoing: [] },
  ];
  const edges = [
    { id: 'e-root', from: 'root', to: 'fork', points: [
      { x: 40, y: 100, age: 0 }, { x: 300, y: 100, age: 30 },
    ] },
    { id: 'e-up', from: 'fork', to: 'up-fork', points: [
      { x: 300, y: 100, age: 30 }, { x: 600, y: 50, age: 60 },
    ] },
    { id: 'e-down', from: 'fork', to: 'down-fork', points: [
      { x: 300, y: 100, age: 30 }, { x: 600, y: 150, age: 60 },
    ] },
    { id: 'e-up-a', from: 'up-fork', to: 'up-a-tip', points: [
      { x: 600, y: 50, age: 60 }, { x: 1220, y: 30, age: 100 },
    ] },
    { id: 'e-up-b', from: 'up-fork', to: 'up-b-tip', points: [
      { x: 600, y: 50, age: 60 }, { x: 1220, y: 70, age: 100 },
    ] },
    { id: 'e-down-a', from: 'down-fork', to: 'down-a-tip', points: [
      { x: 600, y: 150, age: 60 }, { x: 1220, y: 130, age: 100 },
    ] },
    { id: 'e-down-b', from: 'down-fork', to: 'down-b-tip', points: [
      { x: 600, y: 150, age: 60 }, { x: 1220, y: 170, age: 100 },
    ] },
  ];
  return {
    seed: 'literal', bounds: { x: 0, y: 0, width: 1260, height: 200 }, maxAge: 100,
    rootId: 'root', nodes, edges,
    choicePoints: [
      { id: 'fork', age: 30, x: 300, y: 100, options: ['e-up', 'e-down'] },
      { id: 'up-fork', age: 60, x: 600, y: 50, options: ['e-up-a', 'e-up-b'] },
      { id: 'down-fork', age: 60, x: 600, y: 150, options: ['e-down-a', 'e-down-b'] },
    ],
  };
}

test('projection classifies ancestry and all descendants of a missed branch exactly', () => {
  const projection = projectScenario(literalTree(), {
    age: 50,
    choices: { fork: 'e-up', 'up-fork': 'e-up-a' },
  });
  const states = projection.segments.map(segment => [segment.id, segment.edgeId, segment.state]);

  assert.deepEqual(states, [
    ['e-root', 'e-root', 'completed'],
    ['e-up:completed', 'e-up', 'completed'],
    ['e-up:possible', 'e-up', 'possible'],
    ['e-down', 'e-down', 'untaken'],
    ['e-up-a', 'e-up-a', 'possible'],
    ['e-up-b', 'e-up-b', 'possible'],
    ['e-down-a', 'e-down-a', 'untaken'],
    ['e-down-b', 'e-down-b', 'untaken'],
  ]);
  assert.deepEqual(projection.today, { x: 500, y: 66.6667, age: 50, edgeId: 'e-up' });
  assert.deepEqual(projection.past.at(-1), { x: 500, y: 66.6667, age: 50 });
  assert.deepEqual(projection.future[0], projection.past.at(-1));
});

test('untaken descendants retain the earliest missed-fork provenance', () => {
  const projection = projectScenario(literalTree(), {
    age: 90,
    choices: { fork: 'e-up', 'up-fork': 'e-up-a' },
  });
  const provenance = Object.fromEntries(projection.segments.map(segment => [segment.id, {
    state: segment.state,
    untakenAtAge: segment.untakenAtAge,
    untakenAtNodeId: segment.untakenAtNodeId,
  }]));

  assert.deepEqual(provenance['e-down'], {
    state: 'untaken', untakenAtAge: 30, untakenAtNodeId: 'fork',
  });
  assert.deepEqual(provenance['e-down-a'], provenance['e-down']);
  assert.deepEqual(provenance['e-down-b'], provenance['e-down']);
  assert.deepEqual(provenance['e-up-b'], {
    state: 'untaken', untakenAtAge: 60, untakenAtNodeId: 'up-fork',
  });
  assert.deepEqual(provenance['e-root'], {
    state: 'completed', untakenAtAge: undefined, untakenAtNodeId: undefined,
  });
  assert.deepEqual(provenance['e-up-a:possible'], {
    state: 'possible', untakenAtAge: undefined, untakenAtNodeId: undefined,
  });
});

test('Today on a fork leaves both outgoing subtrees possible without untaken provenance', () => {
  const projection = projectScenario(literalTree(), {
    age: 60,
    choices: { fork: 'e-up', 'up-fork': 'e-up-a' },
  });
  const byId = new Map(projection.segments.map(segment => [segment.id, segment]));

  for (const edgeId of ['e-up-a', 'e-up-b']) {
    assert.equal(byId.get(edgeId).state, 'possible');
    assert.equal(Object.hasOwn(byId.get(edgeId), 'untakenAtAge'), false);
    assert.equal(Object.hasOwn(byId.get(edgeId), 'untakenAtNodeId'), false);
  }
  for (const edgeId of ['e-down', 'e-down-a', 'e-down-b']) {
    assert.equal(byId.get(edgeId).untakenAtAge, 30);
    assert.equal(byId.get(edgeId).untakenAtNodeId, 'fork');
  }
});

test('explicit choices change the selected route without changing graph geometry', () => {
  const network = generateNetwork({ seed: 'choice-stability', maxTips: 20 });
  const point = network.choicePoints[0];
  const first = projectScenario(network, { age: 75, choices: { [point.id]: point.options[0] } });
  const second = projectScenario(network, { age: 75, choices: { [point.id]: point.options[1] } });

  assert.notDeepEqual(first.spine, second.spine);
  assert.deepEqual(first.selections[0], { pointId: point.id, edgeId: point.options[0], assumed: false });
  assert.deepEqual(second.selections[0], { pointId: point.id, edgeId: point.options[1], assumed: false });
  assert.equal(JSON.stringify(network), JSON.stringify(generateNetwork({ seed: 'choice-stability', maxTips: 20 })));
});

test('seeded route assumptions are age-stable and invalid explicit choices fall back safely', () => {
  const network = literalTree();
  const young = projectScenario(network, { age: 10, choiceSeed: 'reader-a' });
  const older = projectScenario(network, { age: 90, choiceSeed: 'reader-a' });
  const invalid = projectScenario(network, {
    age: 90,
    choiceSeed: 'reader-a',
    choices: { fork: 'e-not-from-this-fork', unknown: 'e-up' },
  });

  assert.deepEqual(older.selections, young.selections);
  assert.deepEqual(invalid.selections, young.selections);
  assert.ok(invalid.selections.every(selection => selection.assumed));
});

function exitChoiceTree() {
  return {
    version: 2,
    seed: 'literal-exit-tree',
    config: { boundaryMode: 'exit' },
    maxAge: 10,
    rootId: 'root',
    nodes: [
      { id: 'root', age: 0, x: 40, y: 100, outgoing: ['e-exit', 'e-live-a', 'e-live-b'] },
      { id: 'exit-tip', age: 3, x: 200, y: -40, outgoing: [], terminationReason: 'boundary-exit' },
      { id: 'live-a-tip', age: 10, x: 1220, y: 80, outgoing: [], terminationReason: 'horizon' },
      { id: 'live-b-tip', age: 10, x: 1220, y: 120, outgoing: [], terminationReason: 'horizon' },
    ],
    edges: [
      { id: 'e-exit', from: 'root', to: 'exit-tip', reachableUntilAge: 3, points: [
        { x: 40, y: 100, age: 0 }, { x: 200, y: -40, age: 3 },
      ] },
      { id: 'e-live-a', from: 'root', to: 'live-a-tip', reachableUntilAge: 10, points: [
        { x: 40, y: 100, age: 0 }, { x: 1220, y: 80, age: 10 },
      ] },
      { id: 'e-live-b', from: 'root', to: 'live-b-tip', reachableUntilAge: 10, points: [
        { x: 40, y: 100, age: 0 }, { x: 1220, y: 120, age: 10 },
      ] },
    ],
    choicePoints: [{
      id: 'root', age: 0, x: 40, y: 100,
      options: ['e-exit', 'e-live-a', 'e-live-b'],
    }],
  };
}

test('exit-mode seeded routes remain age-stable and prefer a horizon survivor', () => {
  const network = exitChoiceTree();
  const young = projectScenario(network, { age: 2, choiceSeed: 'same-reader' });
  const older = projectScenario(network, { age: 9, choiceSeed: 'same-reader' });

  assert.deepEqual(older.selections, young.selections);
  assert.notEqual(older.selections[0].edgeId, 'e-exit');
  assert.equal(older.routeEndAge, 10);
  assert.equal(older.routeExited, false);
  assert.equal(older.today.age, 9);
});

test('exit projection derives reachability safely when cached edge metadata is absent', () => {
  const network = exitChoiceTree();
  network.edges = network.edges.map(({ reachableUntilAge: ignored, ...edge }) => edge);
  const projection = projectScenario(network, { age: 9, choiceSeed: 'uncached-reader' });

  assert.notEqual(projection.selections[0].edgeId, 'e-exit');
  assert.equal(projection.routeEndAge, 10);
  assert.equal(projection.routeExited, false);
});

test('an explicit offscreen route remains authoritative and reports an honest early end', () => {
  const projection = projectScenario(exitChoiceTree(), {
    age: 9,
    choices: { root: 'e-exit' },
  });

  assert.deepEqual(projection.selections, [
    { pointId: 'root', edgeId: 'e-exit', assumed: false },
  ]);
  assert.equal(projection.age, 9);
  assert.equal(projection.today.age, 3);
  assert.equal(projection.today.y, -40);
  assert.equal(projection.routeEndAge, 3);
  assert.equal(projection.routeExited, true);
  assert.equal(projection.past.at(-1).age, 3);
  assert.equal(projection.future.at(-1).age, 3);
});

test('an all-exit graph exposes its furthest honest route without fabricating Today', () => {
  const network = generateNetwork({
    seed: 'all-exit-route', growthMode: 'paced', boundaryMode: 'exit',
    maxAge: 10, ageHorizon: 100, width: 200, height: 200,
    maxTips: 1, maxEdges: 1, sampleAgeStep: 1,
    splitProbability: 0, turnMin: 10, turnMax: 10, turnStrength: 0,
    originY: 10, originSlope: -7, exitMargin: 5,
  });
  const projection = projectScenario(network, { age: 9 });

  assert.ok(projection.routeEndAge < 9);
  assert.equal(projection.routeExited, true);
  assert.equal(projection.today.age, projection.routeEndAge);
  assert.equal(projection.today.y, -5);
});

test('annotations attach by choice-point ID without changing topology or accepting metadata as choices', () => {
  const network = literalTree();
  const before = JSON.stringify(network);
  const projection = projectScenario(network, {
    age: 40,
    choiceSeed: 'labels-do-not-choose',
    annotations: {
      fork: { label: 'A fictional choice', options: { 'e-down': 'Ask for help' } },
      missing: { label: 'Ignored' },
    },
  });

  assert.deepEqual(projection.choicePoints[0].annotation, {
    label: 'A fictional choice', options: { 'e-down': 'Ask for help' },
  });
  assert.equal(projection.choicePoints[1].annotation, undefined);
  assert.equal(projection.selections[0].assumed, true);
  assert.equal(JSON.stringify(network), before);
});

test('Today follows generated geometry, clamps at boundaries, and joins past to future', () => {
  const network = generateNetwork({ seed: 'age-sampling', maxTips: 24 });
  for (const requested of [-5, 0, 12.25, 47.5, 100, 180]) {
    const projection = projectScenario(network, { age: requested, choiceSeed: 'same-route' });
    const expectedAge = Math.max(0, Math.min(100, requested));
    assert.equal(projection.age, expectedAge);
    assert.equal(projection.today.age, expectedAge);
    assert.deepEqual(projection.past.at(-1), projection.future[0]);
    assert.deepEqual(projection.today, { ...projection.past.at(-1), edgeId: projection.today.edgeId });
    assert.ok(Math.abs(projection.today.x - (40 + 11.8 * expectedAge)) < 0.01);
  }
  assert.notEqual(projectScenario(network, { age: 12.25 }).today.y,
    projectScenario(network, { age: 47.5 }).today.y);
});

test('age zero leaves the whole tree reachable and max age completes only the selected history', () => {
  const network = literalTree();
  const choices = { fork: 'e-up', 'up-fork': 'e-up-a' };
  const birth = projectScenario(network, { age: 0, choices });
  const end = projectScenario(network, { age: 100, choices });

  assert.ok(birth.segments.every(segment => segment.state === 'possible'));
  assert.deepEqual(birth.past, [{ x: 40, y: 100, age: 0 }]);
  assert.deepEqual(end.future, [{ x: 1220, y: 30, age: 100 }]);
  assert.deepEqual(end.segments.filter(segment => segment.state === 'completed').map(segment => segment.id),
    ['e-root', 'e-up', 'e-up-a']);
  assert.deepEqual(end.segments.filter(segment => segment.state === 'untaken').map(segment => segment.id),
    ['e-down', 'e-up-b', 'e-down-a', 'e-down-b']);
});

test('Today exactly on a fork completes the incoming edge and keeps every outgoing subtree possible', () => {
  const projection = projectScenario(literalTree(), {
    age: 30, choices: { fork: 'e-up', 'up-fork': 'e-up-a' },
  });

  assert.deepEqual(projection.today, { x: 300, y: 100, age: 30, edgeId: 'e-up' });
  assert.deepEqual(projection.segments.map(segment => [segment.id, segment.state]), [
    ['e-root', 'completed'],
    ['e-up', 'possible'],
    ['e-down', 'possible'],
    ['e-up-a', 'possible'],
    ['e-up-b', 'possible'],
    ['e-down-a', 'possible'],
    ['e-down-b', 'possible'],
  ]);
});

test('crowding increases right-edge separation under the same independent branch decisions', () => {
  const controls = {
    seed: 'crowding-controlled', maxTips: 50, crowdingSplitSuppression: 0,
  };
  const unsteered = generateNetwork({ ...controls, crowdingStrength: 0 });
  const steered = generateNetwork({ ...controls, crowdingStrength: 1.15 });
  const yAt = (edge, age) => {
    const afterIndex = edge.points.findIndex(point => point.age >= age);
    const after = edge.points[afterIndex];
    if (after.age === age) return after.y;
    const before = edge.points[afterIndex - 1];
    const progress = (age - before.age) / (after.age - before.age);
    return before.y + (after.y - before.y) * progress;
  };
  const localGap = network => {
    const gaps = [];
    for (let age = 20; age <= 100; age += 5) {
      const ys = network.edges.filter(edge => (
        edge.points[0].age <= age && edge.points.at(-1).age >= age
      )).map(edge => yAt(edge, age)).sort((a, b) => a - b);
      for (let index = 0; index < ys.length; index += 1) {
        gaps.push(Math.min(
          index > 0 ? ys[index] - ys[index - 1] : 58,
          index + 1 < ys.length ? ys[index + 1] - ys[index] : 58,
        ));
      }
    }
    return gaps.reduce((total, gap) => total + gap, 0) / gaps.length;
  };

  assert.deepEqual(steered.edges.map(edge => [edge.id, edge.from, edge.to]),
    unsteered.edges.map(edge => [edge.id, edge.from, edge.to]));
  assert.ok(localGap(steered) > localGap(unsteered) * 1.1);
});

test('dense-region split suppression reduces extra forks without exceeding hard guards', () => {
  const controls = { seed: 'dense-suppression', maxTips: 100 };
  const unsuppressed = generateNetwork({ ...controls, crowdingSplitSuppression: 0 });
  const suppressed = generateNetwork({ ...controls, crowdingSplitSuppression: 1 });

  assert.ok(suppressed.choicePoints.length < unsuppressed.choicePoints.length);
  assert.ok(suppressed.edges.length <= suppressed.config.maxEdges);
});

test('independent branches do not share one synchronized bend pattern', () => {
  const network = generateNetwork({
    seed: 'independent-turn-clocks', maxTips: 12, crowdingStrength: 0,
  });
  const terminalEdges = network.edges.filter(edge => {
    const target = network.nodes.find(node => node.id === edge.to);
    return target.outgoing.length === 0 && edge.points.length >= 16;
  });
  const signatures = terminalEdges.map(edge => edge.points.slice(2).map((point, index) => {
    const before = edge.points[index];
    const middle = edge.points[index + 1];
    const firstSlope = (middle.y - before.y) / (middle.age - before.age);
    const secondSlope = (point.y - middle.y) / (point.age - middle.age);
    return Math.sign(secondSlope - firstSlope);
  }).join(''));

  assert.ok(terminalEdges.length >= 6);
  assert.ok(new Set(signatures).size >= Math.ceil(signatures.length * 0.8));
});

test('returned data is deeply frozen so consumers cannot poison reusable geometry', () => {
  const network = generateNetwork({ seed: 'immutable', maxTips: 4 });
  const projection = projectScenario(network, { annotations: { [network.choicePoints[0].id]: { label: 'Safe' } } });

  assert.ok(Object.isFrozen(network) && Object.isFrozen(network.edges[0].points));
  assert.ok(Object.isFrozen(projection) && Object.isFrozen(projection.choicePoints[0].annotation));
  assert.throws(() => { network.edges[0].points[0].y = -1; }, TypeError);
  assert.throws(() => { projection.spine.push({ x: 0, y: 0, age: 0 }); }, TypeError);
});
