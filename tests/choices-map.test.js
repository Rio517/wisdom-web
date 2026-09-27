import test from 'node:test';
import assert from 'node:assert/strict';
import { hitTestPaths } from '../prototype/choices-map.js';

const identity = { world: point => point };
const segment = (edgeId, state, y) => ({ edgeId, state, points: [{ x: 0, y, age: 0 }, { x: 100, y, age: 20 }] });
test('hit testing uses CSS-pixel proximity and distinguishes nearby branches', () => {
  const projection = { age: 10, today: { x: 50, y: 0 }, segments: [segment('top', 'possible', 10), segment('bottom', 'possible', 30)] };
  assert.equal(hitTestPaths(projection, identity, { x: 70, y: 12 }).edgeId, 'top');
  assert.equal(hitTestPaths(projection, identity, { x: 70, y: 29 }).edgeId, 'bottom');
  assert.equal(hitTestPaths(projection, identity, { x: 70, y: 60 }), null);
});
test('untaken routes are not hit beyond the Today clipping line', () => {
  const projection = { age: 10, today: { x: 50, y: 0 }, segments: [segment('gray', 'untaken', 10)] };
  assert.equal(hitTestPaths(projection, identity, { x: 75, y: 10 }), null);
  assert.equal(hitTestPaths(projection, identity, { x: 20, y: 10 }).edgeId, 'gray');
});
test('close crossings require preview rather than a silent ambiguous commit', () => {
  const projection = { age: 0, today: { x: 0, y: 0 }, segments: [segment('a', 'possible', 10), segment('b', 'possible', 12)] };
  const hit = hitTestPaths(projection, identity, { x: 70, y: 11 });
  assert.equal(hit.ambiguous, true);
  assert.equal(hit.candidates.length, 2);
});
