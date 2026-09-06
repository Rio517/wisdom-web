import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMap, readState, stateURL, motionFrame } from '../prototype/model.js';

test('invalid shared state falls back to a real authored scene and age', () => {
  assert.deepEqual(readState('https://example.test/?age=999#unknown'), {
    age: 8, scene: 'possibilities', selected: false,
  });
});

test('shared state restores the selected moment and learning scene', () => {
  assert.deepEqual(readState('https://example.test/?age=40&selected=1#learning'), {
    age: 40, scene: 'learning', selected: true,
  });
});

test('state URLs preserve the hosting subpath without leaking unknown parameters', () => {
  assert.equal(stateURL({ age: 16, scene: 'learning', selected: true },
    'https://example.test/wisdom/prototype/?junk=secret').href,
  'https://example.test/wisdom/prototype/?age=16&selected=1#learning');
});

test('all authored ages survive shared URL round trips', () => {
  for (const age of [8, 12, 16, 25, 40, 60]) {
    const original = { age, scene: 'possibilities', selected: false };
    assert.deepEqual(readState(stateURL(original, 'https://example.test/')), original);
  }
});

test('selected history connects the beginning to its exact authored anchor', () => {
  const map = makeMap(40);
  assert.equal(map.past.startsWith('M 40 270'), true);
  assert.equal(map.past.endsWith('700 220'), true);
  assert.equal(map.future.startsWith('M 700 220'), true);
  assert.deepEqual(map.anchor, { x: 700, y: 220, age: 40 });
});

test('branches diverging before today become untaken, not possible futures', () => {
  const map = makeMap(25);
  assert.ok(map.branches.length >= 60, 'retain a field, not a handful of endpoints');
  assert.ok(map.branches.filter(branch => branch.state === 'possible').length >= 24);
  for (const branch of map.branches) {
    assert.equal(branch.state, branch.originAge < 25 ? 'untaken' : 'possible');
  }
});

test('older examples still have a rich future; geometry is stable across replay', () => {
  const map = makeMap(60);
  assert.ok(map.branches.filter(branch => branch.state === 'possible').length >= 12);
  assert.deepEqual(makeMap(60), map);
  assert.deepEqual(makeMap(-1), makeMap(8));
  assert.ok(!JSON.stringify(map).includes('NaN'));
  assert.ok(map.focus.width > 800, 'focus must preserve future context');
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

test('focus never pans into empty space beyond the illustrated future', () => {
  for (const age of [8, 12, 16, 25, 40, 60]) {
    const { focus } = makeMap(age);
    assert.ok(focus.x + focus.width <= 1260);
    assert.ok(focus.x >= 0);
  }
});
