import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutOutcomeMarkers } from '../prototype/map-view.js';

test('outcome annotations move away from age markers without moving route endpoints', () => {
  const endpoints = [{ x: 100, y: 100 }, { x: 128, y: 100 }, { x: 170, y: 130 }];
  const obstacles = [{ x: 100, y: 100 }, { x: 170, y: 102 }];
  const placed = layoutOutcomeMarkers(endpoints, obstacles, { width: 220, height: 180 });

  assert.deepEqual(placed.map(item => item.endpoint), endpoints);
  for (const [index, item] of placed.entries()) {
    assert.ok(item.marker.x >= 14 && item.marker.x <= 206);
    assert.ok(item.marker.y >= 14 && item.marker.y <= 166);
    assert.ok(obstacles.every(point => Math.hypot(item.marker.x - point.x, item.marker.y - point.y) >= 28));
    assert.ok(placed.slice(0, index).every(other => Math.hypot(
      item.marker.x - other.marker.x, item.marker.y - other.marker.y,
    ) >= 26));
    assert.ok(Number.isFinite(item.leader.length) && Number.isFinite(item.leader.angle));
  }
});
