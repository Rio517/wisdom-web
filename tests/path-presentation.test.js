import test from 'node:test';
import assert from 'node:assert/strict';
import * as presentation from '../src/engine/path-presentation.js';

const { backingScale, normalizePresentation } = presentation;

const points = (fromAge, toAge, fromY, toY) => [
  { age: fromAge, x: 40 + fromAge * 10, y: fromY },
  { age: toAge, x: 40 + toAge * 10, y: toY },
];

function literalTree() {
  const edges = [
    { id: 'e-history', from: 'root', to: 'missed', points: points(0, 20, 150, 150) },
    { id: 'e-u-trunk', from: 'missed', to: 'u-fork', points: points(20, 50, 150, 145) },
    { id: 'e-u-high', from: 'u-fork', to: 'high', points: points(50, 100, 145, 30) },
    { id: 'e-u-middle', from: 'u-fork', to: 'middle', points: points(50, 100, 145, 140) },
    { id: 'e-u-low', from: 'u-fork', to: 'low', points: points(50, 100, 145, 270) },
    { id: 'e-possible', from: 'missed', to: 'possible', points: points(20, 100, 150, 190) },
  ];
  const network = {
    maxAge: 100,
    bounds: { x: 0, y: 0, width: 1080, height: 300 },
    edges,
  };
  const segments = [
    { ...edges[0], edgeId: 'e-history', state: 'completed' },
    { ...edges[1], edgeId: 'e-u-trunk', state: 'untaken', untakenAtAge: 20, untakenAtNodeId: 'missed' },
    { ...edges[2], edgeId: 'e-u-high', state: 'untaken', untakenAtAge: 20, untakenAtNodeId: 'missed' },
    { ...edges[3], edgeId: 'e-u-middle', state: 'untaken', untakenAtAge: 20, untakenAtNodeId: 'missed' },
    { ...edges[4], edgeId: 'e-u-low', state: 'untaken', untakenAtAge: 20, untakenAtNodeId: 'missed' },
    { ...edges[5], edgeId: 'e-possible', state: 'possible' },
    { id: 'e-born', edgeId: 'e-born', points: points(0, 100, 120, 120) },
  ];
  return { network, segments };
}

test('presentation settings default safely and Canvas backing resolution stays between 2x and 3x', async () => {
  assert.deepEqual(normalizePresentation(), {
    variant: 'retained',
    lineWidth: 2.2,
    historyLineWidth: 3.5,
    fadeDistance: 240,
    fadeFloor: 0,
  });
  assert.deepEqual(normalizePresentation({
    variant: 'unknown', lineWidth: -4, historyLineWidth: Infinity, fadeDistance: 0,
  }), {
    variant: 'retained',
    lineWidth: 2.2,
    historyLineWidth: 3.5,
    fadeDistance: 240,
    fadeFloor: 0,
  });
  assert.equal(backingScale(1), 2);
  assert.equal(backingScale(2.5), 2.5);
  assert.equal(backingScale(4), 3);
  assert.equal(backingScale(NaN), 2);
});

test('bitmap sizing supersamples CSS pixels without changing the CSS coordinate space', () => {
  assert.equal(typeof presentation.canvasBitmap, 'function');
  if (!presentation.canvasBitmap) return;
  assert.deepEqual(presentation.canvasBitmap({ width: 333.3, height: 200.2 }, 1), {
    scale: 2, width: 667, height: 400,
  });
  assert.deepEqual(presentation.canvasBitmap({ width: 333.3, height: 200.2 }, 4), {
    scale: 3, width: 1000, height: 601,
  });
});

test('fade colors change only opacity of the flat route color', () => {
  assert.equal(typeof presentation.fadeColors, 'function');
  if (!presentation.fadeColors) return;
  assert.deepEqual(presentation.fadeColors('#c5cec8', 0.35), {
    full: '#c5cec8', floor: '#c5cec859', clear: '#c5cec800',
  });
});

test('retained presentation keeps every segment flat and unfaded', () => {
  assert.equal(typeof presentation.buildPathPresentation, 'function');
  if (!presentation.buildPathPresentation) return;
  const { network, segments } = literalTree();
  const original = structuredClone({ network, segments });

  const result = presentation.buildPathPresentation(network, segments, { variant: 'retained' });

  assert.deepEqual(result.paths.map(path => [path.edgeId, path.fade]), [
    ['e-history', null],
    ['e-u-trunk', null],
    ['e-u-high', null],
    ['e-u-middle', null],
    ['e-u-low', null],
    ['e-possible', null],
    ['e-born', null],
  ]);
  assert.deepEqual({ network, segments }, original, 'presentation must not mutate graph provenance');
});

test('fading starts from the earliest missed fork across all untaken descendants', () => {
  if (!presentation.buildPathPresentation) return;
  const { network, segments } = literalTree();

  const result = presentation.buildPathPresentation(network, segments, {
    variant: 'fading', fadeDistance: 200,
  });
  const byId = new Map(result.paths.map(path => [path.edgeId, path]));

  for (const id of ['e-u-trunk', 'e-u-high', 'e-u-middle', 'e-u-low']) {
    assert.deepEqual(byId.get(id).fade, { startX: 260, endX: 440, floor: 0 });
  }
  assert.equal(byId.get('e-history').fade, null);
  assert.equal(byId.get('e-possible').fade, null);
  assert.equal(byId.get('e-born').fade, null);
});

test('a faded floor keeps old alternatives faintly present; quiet context ignores it', () => {
  const { network, segments } = literalTree();

  const fading = presentation.buildPathPresentation(network, segments, {
    variant: 'fading', fadeDistance: 200, fadeFloor: 0.3,
  });
  for (const path of fading.paths.filter(item => item.state === 'untaken')) {
    assert.deepEqual(path.fade, { startX: 260, endX: 440, floor: 0.3 });
  }

  const quiet = presentation.buildPathPresentation(network, segments, {
    variant: 'hybrid', fadeDistance: 200, fadeFloor: 0.9,
  });
  // The small fixture makes every untaken route a context route: all at the
  // quiet floor, none at the fading floor.
  const floors = new Set(quiet.paths.filter(item => item.fade).map(item => item.fade.floor));
  assert.deepEqual([...floors], [0.35], 'quiet context keeps its own floor');

  assert.equal(presentation.normalizePresentation({ fadeFloor: 4 }).fadeFloor, 1);
  assert.equal(presentation.normalizePresentation({ fadeFloor: -1 }).fadeFloor, 0);
});

test('hybrid keeps four vertically spread terminal routes and their untaken ancestors at a faint floor', () => {
  const { network, segments } = literalTree();
  const additions = [
    ['e-u-upper', 'upper', 80],
    ['e-u-lower', 'lower', 210],
    ['e-u-lowish', 'lowish', 240],
  ].map(([id, to, y]) => ({
    id, edgeId: id, from: 'u-fork', to, state: 'untaken',
    untakenAtAge: 20, untakenAtNodeId: 'missed', points: points(50, 100, 145, y),
  }));
  network.edges.push(...additions);
  segments.push(...additions);

  const first = presentation.buildPathPresentation(network, segments, {
    variant: 'hybrid', fadeDistance: 200,
  });
  const reordered = presentation.buildPathPresentation(network, [...segments].reverse(), {
    variant: 'hybrid', fadeDistance: 200,
  });

  assert.deepEqual(first.contextEdgeIds, [
    'e-u-high', 'e-u-low', 'e-u-lower', 'e-u-middle', 'e-u-trunk',
  ]);
  assert.deepEqual(reordered.contextEdgeIds, first.contextEdgeIds, 'context identity is order-independent');
  const floors = Object.fromEntries(first.paths
    .filter(path => path.state === 'untaken')
    .map(path => [path.edgeId, path.fade.floor]));
  assert.deepEqual(floors, {
    'e-u-trunk': 0.35,
    'e-u-high': 0.35,
    'e-u-middle': 0.35,
    'e-u-low': 0.35,
    'e-u-upper': 0,
    'e-u-lower': 0.35,
    'e-u-lowish': 0,
  });
});
