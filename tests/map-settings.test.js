import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMapSettings, readMapSettings, mapSettingsURL, scenarioForSettings } from '../prototype/map-settings.js';
import { makeMap } from '../prototype/model.js';

test('the default visual study preserves a substantial future fan at its middle-age example', () => {
  const map = makeMap(40, scenarioForSettings(normalizeMapSettings()));
  // The futures are the fan drawn from Today, narrower at forty than at
  // twelve — but never one or two tips.
  assert.ok(map.fan && map.fan.edges.length >= 15,
    'The selected illustrative route must not collapse the visible future to one or two tips');
  const early = makeMap(12, scenarioForSettings(normalizeMapSettings()));
  assert.ok(early.fan.edges.length > map.fan.edges.length, 'the fan narrows with age');
  assert.equal(map.network.config.growthMode, 'laminar');
  assert.equal(map.network.config.envelopeAge, 40, 'the field opens by the age in view');
});

test('invalid drawing settings cannot pass unsafe values into generation or rendering', () => {
  const settings = normalizeMapSettings({
    variant: 'unknown', seed: {}, openingBurst: Infinity, splitRate: -4,
    curvature: 999, congestion: NaN, lineWidth: 0, fadeDistance: 9000,
  });
  assert.equal(settings.variant, 'fading');
  assert.equal(typeof settings.seed, 'string');
  assert.ok(Number.isFinite(settings.openingBurst));
  assert.equal(settings.splitRate, 0);
  assert.equal(settings.curvature, 9);
  assert.ok(Number.isFinite(settings.congestion));
  assert.equal(settings.lineWidth, 1.2);
  assert.equal(settings.fadeDistance, 700);
  assert.ok(Object.isFrozen(settings));
});

test('changing the visibility treatment does not regenerate a different network or scenario', () => {
  const baseline = { seed: 'comparison', openingBurst: 0.7, splitRate: 0.6 };
  const retained = scenarioForSettings({ ...baseline, variant: 'retained' });
  assert.deepEqual(scenarioForSettings({ ...baseline, variant: 'fading', lineWidth: 3, fadeDistance: 400 }), retained);
  assert.deepEqual(scenarioForSettings({ ...baseline, variant: 'hybrid' }), retained);
  assert.equal(retained.networkSeed, 'comparison');
  assert.equal(retained.networkOptions.openingBurst, 0.7);
  assert.equal(retained.networkOptions.splitProbability, 0.6);
});

test('drawing settings round trip through a URL without replacing lesson state or hosting path', () => {
  const settings = normalizeMapSettings({ variant: 'fading', seed: 'curves & branches', openingBurst: 0.65, lineWidth: 2.8 });
  const url = mapSettingsURL(settings, 'http://127.0.0.1:4600/wisdom/prototype/?age=40&selected=1&inspect=12#learning');
  assert.equal(url.pathname, '/wisdom/prototype/');
  assert.equal(url.searchParams.get('age'), '40');
  assert.equal(url.searchParams.get('inspect'), '12');
  assert.equal(url.hash, '#learning');
  assert.deepEqual(readMapSettings(url), settings);
  const restoredDefaults = mapSettingsURL(normalizeMapSettings(), url);
  assert.equal(restoredDefaults.searchParams.has('paths'), false);
  assert.equal(restoredDefaults.searchParams.has('tune'), false);
});

test('malformed or excessive shared settings fall back while retaining a valid view', () => {
  assert.equal(readMapSettings('http://localhost/?paths=hybrid&tune={').variant, 'hybrid');
  const huge = new URL('http://localhost/?paths=fading');
  huge.searchParams.set('tune', JSON.stringify({ seed: 'x'.repeat(5000) }));
  assert.equal(readMapSettings(huge).variant, 'fading');
  assert.notEqual(readMapSettings(huge).seed, 'x'.repeat(5000));
});
