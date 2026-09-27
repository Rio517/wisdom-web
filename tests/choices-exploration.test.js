import test from 'node:test';
import assert from 'node:assert/strict';
import { createExplorationSession, createExplorationNetwork } from '../src/engine/choices-exploration.js';
import { generateNetwork, projectScenario } from '../src/engine/path-network.js';
import { generateLabFuture } from '../src/engine/lab-future.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../src/engine/lab-settings.js';

const point = (age, y) => ({ age, x: 40 + age * 10, y });
function fixture() {
  const nodes = [
    { id: 'root', ...point(0, 200), outgoing: ['trunk'] },
    { id: 'fork', ...point(10, 200), outgoing: ['up', 'down'] },
    { id: 'upper', ...point(20, 100), outgoing: ['upper-a', 'upper-b'] },
    { id: 'lower', ...point(20, 300), outgoing: ['lower-a', 'lower-b'] },
    { id: 'ua', ...point(35, 50), outgoing: [] },
    { id: 'ub', ...point(35, 150), outgoing: [] },
    { id: 'la', ...point(35, 250), outgoing: [] },
    { id: 'lb', ...point(35, 350), outgoing: [] },
  ];
  const pairs = [['trunk', 'root', 'fork'], ['up', 'fork', 'upper'], ['down', 'fork', 'lower'], ['upper-a', 'upper', 'ua'], ['upper-b', 'upper', 'ub'], ['lower-a', 'lower', 'la'], ['lower-b', 'lower', 'lb']];
  const edges = pairs.map(([id, from, to]) => ({
    id, from, to, points: [nodes.find(n => n.id === from), nodes.find(n => n.id === to)].map(({ x, y, age }) => ({ x, y, age })),
  }));
  return { seed: 'hand-drawn', config: {}, bounds: { x: 0, y: 0, width: 430, height: 400 }, maxAge: 35, rootId: 'root', nodes, edges,
    choicePoints: nodes.filter(n => n.outgoing.length > 1).map(n => ({ id: n.id, x: n.x, y: n.y, age: n.age, options: [...n.outgoing] })) };
}
const session = () => createExplorationSession({ network: fixture(), age: 12, choices: { fork: 'up', upper: 'upper-a' } });

test('preview leaves the cursor, route selections and network unchanged', () => {
  const s = session();
  const before = s.snapshot();
  s.preview('upper-b');
  const after = s.snapshot();
  assert.equal(after.preview.id, 'upper-b');
  assert.equal(after.preview.available, true);
  assert.equal(after.age, 12);
  assert.deepEqual(after.selections, before.selections);
  assert.strictEqual(after.network, before.network);
  s.preview(null);
  assert.equal(s.snapshot().preview, null);
});

test('choice state marks only explicitly selected branches', () => {
  const s = createExplorationSession({ network: fixture(), age: 12 });
  assert.deepEqual(s.snapshot().choices.map(choice => choice.selected), [false, false]);

  assert.equal(s.choose('upper-b'), true);
  assert.equal(s.revisit('upper'), true);
  assert.deepEqual(s.snapshot().choices.map(choice => [choice.id, choice.selected]), [
    ['upper-a', false],
    ['upper-b', true],
  ]);
});

test('choice labels identify the graphical source fork by position and illustrative age', () => {
  const s = createExplorationSession({ network: fixture(), age: 10 });
  assert.deepEqual(s.snapshot().choices.map(choice => choice.label), [
    'Upper path · middle fork at 10',
    'Lower path · middle fork at 10',
  ]);
});

test('choice descriptions name the next drawn fork or endpoint and its illustrative age', () => {
  const atFirstFork = createExplorationSession({ network: fixture(), age: 10 });
  assert.equal(atFirstFork.snapshot().choices[0].description, 'Leads to another fork near age 20.');

  const atUpperFork = session();
  assert.equal(atUpperFork.snapshot().choices[0].description, 'Continues to the edge of this drawing near age 35.');
});

test('a gray path explains its earlier fork and cannot be committed directly', () => {
  const s = session();
  s.preview('down');
  assert.equal(s.snapshot().preview.available, false);
  assert.equal(s.snapshot().preview.revisitPointId, 'fork');
  const before = s.snapshot();
  assert.equal(s.choose('down'), false);
  assert.deepEqual(s.snapshot().selections, before.selections);
  assert.equal(s.snapshot().age, 12);
});

test('revisiting does not clear choices; confirming an alternate clears only its dependent future', () => {
  const s = session();
  s.previous();
  assert.equal(s.snapshot().age, 10);
  assert.deepEqual(s.snapshot().selections, { fork: 'up', upper: 'upper-a' });
  assert.equal(s.choose('down'), true);
  assert.equal(s.snapshot().age, 20);
  assert.deepEqual(s.snapshot().selections, { fork: 'down' });
  assert.deepEqual(s.snapshot().choices.map(c => c.id), ['lower-a', 'lower-b']);
  assert.equal(s.snapshot().projection.past.at(-1).y, 300);
});

test('picking a distant reachable branch commits its connected ancestors', () => {
  const s = createExplorationSession({ network: fixture(), age: 0 });
  assert.equal(s.choose('lower-b'), true);
  assert.deepEqual(s.snapshot().selections, { fork: 'down', lower: 'lower-b' });
  assert.equal(s.snapshot().age, 35);
  assert.deepEqual(s.snapshot().projection.past.at(-1), point(35, 350));
});

test('confirming the same branch preserves its already selected downstream future', () => {
  const s = session();
  s.revisit('fork');
  s.choose('up');
  assert.deepEqual(s.snapshot().selections, { fork: 'up', upper: 'upper-a' });
});

test('previous and next traverse actual forks and stop at the route endpoint', () => {
  const s = session();
  s.next();
  assert.equal(s.snapshot().age, 20);
  s.next();
  assert.equal(s.snapshot().age, 35);
  assert.equal(s.snapshot().canNext, false);
  s.next();
  assert.equal(s.snapshot().age, 35);
  s.previous();
  assert.equal(s.snapshot().age, 20);
  s.previous();
  assert.equal(s.snapshot().age, 10);
  s.previous();
  assert.equal(s.snapshot().age, 0);
  assert.equal(s.snapshot().canPrevious, false);
});

test('a foreign point or edge cannot teleport the route', () => {
  const s = session();
  const before = s.snapshot();
  assert.equal(s.revisit('lower'), false);
  assert.equal(s.choose('missing'), false);
  assert.equal(s.revisit('missing'), false);
  assert.equal(s.snapshot().age, before.age);
  assert.deepEqual(s.snapshot().selections, before.selections);
});

test('snapshots cannot mutate the session choices or generated geometry', () => {
  const s = session();
  const snapshot = s.snapshot();
  assert.throws(() => { snapshot.network.nodes[0].x = 999; }, TypeError);
  snapshot.selections.fork = 'down';
  assert.equal(s.snapshot().selections.fork, 'up');
});

test('the frozen age-12 scene retains exactly the lab fan geometry and lived history', () => {
  const settings = LAB_DEFAULTS;
  const original = generateNetwork(networkOptionsForLab(settings, { today: 12 }));
  const projection = projectScenario(original, { age: 12, choiceSeed: settings.choiceSeed });
  const fan = generateLabFuture(original, projection, settings);
  const combined = createExplorationNetwork({ age: 12, settings });
  const frozenFan = combined.edges.filter(e => e.id.startsWith('future:'));
  assert.deepEqual(frozenFan.map(e => e.points), fan.edges.map(e => e.points));
  const s = createExplorationSession({ network: combined, age: 12, choiceSeed: settings.choiceSeed });
  assert.deepEqual(s.snapshot().projection.past, projection.past);
  const digest = JSON.stringify(combined);
  s.preview(s.snapshot().choices[0].id);
  s.choose(s.snapshot().choices[0].id);
  s.previous();
  s.next();
  assert.equal(JSON.stringify(combined), digest);
});

test('spliced scenes are connected, deterministic and traversable back into original alternatives', () => {
  const a = createExplorationNetwork({ age: 40 });
  assert.deepEqual(a, createExplorationNetwork({ age: 40 }));
  const nodes = new Map(a.nodes.map(n => [n.id, n]));
  const edges = new Map(a.edges.map(e => [e.id, e]));
  assert.equal(nodes.size, a.nodes.length);
  assert.equal(edges.size, a.edges.length);
  const reached = new Set();
  const visit = id => { if (reached.has(id)) return; reached.add(id); for (const edgeId of nodes.get(id).outgoing) { const edge = edges.get(edgeId); assert.equal(edge.from, id); assert.ok(nodes.has(edge.to)); visit(edge.to); } };
  visit(a.rootId);
  assert.equal(reached.size, nodes.size);
  const s = createExplorationSession({ network: a, age: 40, choiceSeed: LAB_DEFAULTS.choiceSeed });
  const oldest = s.snapshot().projection.selections[0];
  assert.equal(s.revisit(oldest.pointId), true);
  const alternative = s.snapshot().choices.find(c => c.id !== oldest.edgeId);
  assert.equal(s.choose(alternative.id), true);
  assert.ok(s.snapshot().projection.past.length > 1);
});

test('beginning and the seventy-year horizon have honest forward/back boundaries', () => {
  const beginning = createExplorationSession({ age: 0 });
  assert.equal(beginning.snapshot().age, 0);
  assert.equal(beginning.snapshot().canPrevious, false);
  assert.ok(beginning.snapshot().choices.length >= 3);
  const end = createExplorationSession({ age: 70 });
  assert.equal(end.snapshot().canNext, false);
  assert.deepEqual(end.snapshot().choices, []);
  assert.equal(end.network.edges.some(e => e.id.startsWith('future:')), false);
});
