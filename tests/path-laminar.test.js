import test from 'node:test';
import assert from 'node:assert/strict';
import { generateNetwork, projectScenario } from '../src/engine/path-network.js';
import { networkOptionsForLab } from '../src/engine/lab-settings.js';

const controls = {
  seed: 'choices-network-1', growthMode: 'laminar', boundaryMode: 'exit',
  maxAge: 70, width: 1260, height: 740,
  maxTips: 64, maxEdges: 255, sampleAgeStep: 1,
  splitProbability: 1, splitMin: 2.3, splitMax: 5.7, firstSplitAge: 2,
  firstChildrenMin: 4, firstChildrenMax: 8, laterChildrenMin: 3, laterChildrenMax: 6,
  ageOffset: 0, ageHorizon: 100, ageTaper: 0.7,
  turnMin: 4.5, turnMax: 14,
  envelopeAge: 30, settleYears: 6, waveStrength: 1,
};

/** Every line alive at `age`, top to bottom by its y there. */
function linesAt(network, age) {
  return network.edges
    .filter(edge => edge.points[0].age <= age && edge.points.at(-1).age >= age)
    .map(edge => {
      const after = edge.points.findIndex(point => point.age >= age);
      const end = edge.points[after];
      const start = edge.points[Math.max(0, after - 1)];
      const share = end.age === start.age ? 0 : (age - start.age) / (end.age - start.age);
      return { id: edge.id, y: start.y + (end.y - start.y) * share };
    });
}

test('laminar growth is deterministic and follows the network contract', () => {
  const first = generateNetwork(controls);
  const again = generateNetwork(controls);
  assert.deepEqual(again, first);
  assert.notDeepEqual(generateNetwork({ ...controls, seed: 'another' }).edges, first.edges);
  assert.equal(first.version, 2);
  assert.ok(first.edges.every(edge => edge.reachableUntilAge === first.maxAge));
  assert.ok(first.edges.every(edge => edge.points.every((point, index) =>
    index === 0 || point.x >= edge.points[index - 1].x)), 'lines only move forward');
  const projection = projectScenario(first, { age: 30, choiceSeed: 'example' });
  assert.ok(projection.past.length > 2);
  assert.ok(projection.segments.some(segment => segment.state === 'untaken'));
});

test('the trunk waits for its first fork, then the field fills its budget by the envelope age', () => {
  const network = generateNetwork(controls);
  const forks = network.choicePoints.map(point => point.age).sort((a, b) => a - b);
  assert.equal(forks[0], 2, 'the first fork is at firstSplitAge');
  assert.equal(linesAt(network, 1).length, 1, 'one line before the first fork');
  assert.ok(linesAt(network, 15).length > 20 && linesAt(network, 15).length < 64,
    'the field is still opening halfway to the envelope age');
  assert.ok(linesAt(network, 30).length >= 60, 'the budget is spent by the envelope age');
  assert.ok(forks.some(age => age > 15 && age < 30), 'forks keep landing while the field opens');
  const tips = network.nodes.filter(node => node.outgoing.length === 0);
  assert.ok(tips.length <= 64);
  assert.ok(tips.every(tip => tip.age === 70));
});

test('lines keep their order, so none cross, and forks share one point', () => {
  const network = generateNetwork(controls);
  const orderAt = age => linesAt(network, age).sort((a, b) => a.y - b.y).map(item => item.id);
  // Follow each line's descendants: at any later age, everything descended
  // from a line above stays above everything descended from a line below.
  const parentOf = new Map(network.edges.map(edge => [edge.id, edge.from]));
  const edgeTo = new Map(network.edges.map(edge => [edge.to, edge.id]));
  const ancestorsOf = id => {
    const chain = [];
    let current = id;
    while (current) {
      chain.push(current);
      current = edgeTo.get(parentOf.get(current));
    }
    return chain;
  };
  for (const [earlier, later] of [[10, 20], [20, 40], [40, 69]]) {
    const before = orderAt(earlier);
    const rank = new Map(before.map((id, index) => [id, index]));
    const lineage = id => ancestorsOf(id).find(ancestor => rank.has(ancestor));
    const after = orderAt(later).map(lineage);
    for (let index = 1; index < after.length; index += 1) {
      assert.ok(rank.get(after[index]) >= rank.get(after[index - 1]),
        `order at ${later} keeps the order at ${earlier}`);
    }
  }
  for (const point of network.choicePoints) {
    const node = network.nodes.find(item => item.id === point.id);
    for (const edgeId of node.outgoing) {
      const child = network.edges.find(edge => edge.id === edgeId);
      assert.deepEqual([child.points[0].x, child.points[0].y], [node.x, node.y]);
    }
  }
});

test('the lab passes Today as the envelope age and the mode survives normalization', () => {
  const options = networkOptionsForLab({ growthMode: 'laminar', firstSplitAge: 2 }, { today: 16 });
  assert.equal(options.growthMode, 'laminar');
  assert.equal(options.envelopeAge, 16);
  assert.equal(options.firstSplitAge, 2);
  assert.equal(networkOptionsForLab({ growthMode: 'laminar' }).envelopeAge, 25, 'no Today: a default envelope');
  assert.doesNotThrow(() => generateNetwork(options));
  assert.throws(() => generateNetwork({ ...controls, envelopeAge: 0 }), RangeError);
});

test('a few lines end — rarely in childhood, more with age — and routes still reach Today', () => {
  const network = generateNetwork({ ...controls, endingRate: 0.02 });
  const ended = network.nodes.filter(node => node.terminationReason === 'ended');
  assert.ok(ended.length >= 3, `expected some endings, saw ${ended.length}`);
  assert.ok(ended.filter(node => node.age < 15).length <= 3, 'childhood endings are rare');
  assert.ok(ended.filter(node => node.age >= 40).length >= ended.filter(node => node.age < 40).length,
    'most endings come after forty');
  assert.ok(linesAt(network, 69).length >= 2, 'the field is never emptied');
  for (const edge of network.edges) {
    assert.ok(Number.isFinite(edge.reachableUntilAge) && edge.reachableUntilAge <= 70);
  }
  const projection = projectScenario(network, { age: 60, choiceSeed: 'example' });
  assert.ok(projection.past.at(-1).age >= 60 - 1e-9, 'the example route prefers lines that go on');
  assert.equal(generateNetwork(controls).nodes.filter(node => node.terminationReason === 'ended').length, 0,
    'zero turns endings off');
});
