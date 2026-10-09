import test from 'node:test';
import assert from 'node:assert/strict';
import { generateNetwork } from '../src/engine/path-network.js';
import * as labSettings from '../src/engine/lab-settings.js';
import {
  LAB_CONTROLS,
  LAB_DEFAULTS,
  normalizeLabSettings,
  networkOptionsForLab,
  readLabState,
  labURL,
  exportLabSettings,
} from '../src/engine/lab-settings.js';

test('lab metadata exposes the complete grouped control contract', () => {
  for (const field of ['firstChildrenMin', 'firstChildrenMax', 'laterChildrenMin', 'laterChildrenMax', 'ageTaper', 'burstSpan', 'forkSpread', 'fadeFloor', 'todayFade']) {
    assert.ok(LAB_CONTROLS.some(control => control.field === field), `${field} must be adjustable`);
  }
  for (const control of LAB_CONTROLS) {
    assert.equal(typeof control.label, 'string');
    assert.equal(typeof control.help, 'string');
    assert.equal(typeof control.unit, 'string');
    assert.ok(Number.isFinite(control.min) && Number.isFinite(control.max));
    assert.ok(control.min < control.max && control.step > 0);
  }
});

test('timeline gives ages zero to twenty-five half the slider and ends selection at seventy', () => {
  assert.equal(typeof labSettings.ageForTimelinePosition, 'function');
  assert.equal(typeof labSettings.timelinePositionForAge, 'function');
  for (const [position, age] of [[0, 0], [0.25, 10.9375], [0.5, 25], [0.75, 43.75], [1, 70]]) {
    assert.ok(Math.abs(labSettings.ageForTimelinePosition(position) - age) < 1e-9);
    assert.ok(Math.abs(labSettings.timelinePositionForAge(age) - position) < 1e-9);
  }
  assert.equal(labSettings.ageForTimelinePosition(-1), 0);
  assert.equal(labSettings.ageForTimelinePosition(2), 70);
  assert.equal(labSettings.timelinePositionForAge(100), 1);
  for (let age = 0; age <= 70; age += 1) {
    assert.ok(Math.abs(labSettings.ageForTimelinePosition(labSettings.timelinePositionForAge(age)) - age) < 1e-9);
  }
  const restored = readLabState(labURL({ age: 85, selected: true }, 'https://example.test/path-lab.html'));
  assert.equal(restored.age, 70);
  assert.equal(networkOptionsForLab().maxAge, 70, 'the drawing must not include ages beyond seventy');
});

test('normalization clamps numeric settings and keeps maxTips integral', () => {
  const normalized = normalizeLabSettings({
    openingBurst: 4, todayBurst: -1, splitProbability: -1, splitSpacing: 99, maxTips: 41.8,
    turnStrength: -5, turnSpacing: 2,
    crowdingStrength: 9, crowdingRadius: 19,
    lineWidth: 8, grayOpacity: -2, fadeDistance: 999, edgeFade: 5,
    seed: '  tuned-network  ', choiceSeed: '  tuned-route  ', variant: 'fading',
    ignored: 'not serialized',
  });

  assert.deepEqual(normalized, {
    ...LAB_DEFAULTS,
    seed: 'tuned-network', choiceSeed: 'tuned-route', variant: 'fading',
    openingBurst: 1, todayBurst: 0, splitProbability: 0, splitSpacing: 18, maxTips: 42,
    turnStrength: 0, turnSpacing: 3,
    crowdingStrength: 3, crowdingRadius: 20,
    lineWidth: 4, grayOpacity: 0.1, fadeDistance: 650, edgeFade: 0.3,
  });
});

test('non-finite, wrong-type, and unknown values fall back independently', () => {
  const normalized = normalizeLabSettings({
    openingBurst: Number.NaN, splitProbability: '0.2', maxTips: Infinity,
    seed: '', choiceSeed: new String('boxed'), variant: 'unknown', lineWidth: 2.4,
  });

  assert.deepEqual(normalized, { ...LAB_DEFAULTS, lineWidth: 2.4 });
  assert.deepEqual(normalizeLabSettings(null), LAB_DEFAULTS);
  assert.deepEqual(normalizeLabSettings([]), LAB_DEFAULTS);
});

test('network adapter derives safe generator controls around spacing values', () => {
  const options = networkOptionsForLab({
    ...LAB_DEFAULTS, turnStrength: 5.2, crowdingStrength: 1.2,
  });

  assert.deepEqual(options, {
    seed: 'choices-network-1', width: 1260, height: 740, maxAge: 70,
    maxTips: 67, maxEdges: Math.round(67 * (4 + 12 * 0.85)) - 1, sampleAgeStep: 1,
    splitProbability: 1, splitMin: 0.5789, splitMax: 1.4211,
    openingSplitMin: 1, openingSplitMax: 3, openingBurst: 1, firstSplitAge: 0.1,
    turnStrength: 5.2, turnMin: 4.5, turnMax: 14,
    crowdingStrength: 1.2, crowdingRadius: 100,
    growthMode: 'laminar', firstChildrenMin: 3, firstChildrenMax: 4,
    laterChildrenMin: 2, laterChildrenMax: 3,
    ageOffset: 0, ageHorizon: 100, ageTaper: 1, burstSpan: 3.5,
    forkSpread: 150, wideForkLevels: 1, laterBranchSpacing: 12,
    boundaryMode: 'exit', exitMargin: 40,
    envelopeAge: 25, settleYears: 6, waveStrength: 5.2 / 4.8, openingAngle: 150, endingRate: 0.01,
    fanOut: 0.85, centerBias: 0.5, bigForkChance: 0.25, bigForkAge: 8,
    yPadding: 8,
  });
  assert.doesNotThrow(() => generateNetwork(options));
});

test('all normalized extrema produce engine-accepted bounded configs', () => {
  const low = Object.fromEntries(LAB_CONTROLS.map(control => [control.field, control.min]));
  const high = Object.fromEntries(LAB_CONTROLS.map(control => [control.field, control.max]));
  for (const settings of [low, high, { ...low, growthMode: 'organic' }, { ...high, growthMode: 'organic' }]) {
    const options = networkOptionsForLab(settings);
    const network = generateNetwork(options);
    assert.ok(network.edges.length <= options.maxEdges);
    // The limit is on lines inside the drawing; lines that left it, or ended, gave their place back.
    const inside = network.nodes.filter(node => node.outgoing.length === 0
      && node.terminationReason !== 'boundary-exit' && node.terminationReason !== 'ended');
    assert.ok(inside.length <= options.maxTips);
  }
});

test('fork ranges are integral, ordered and clamped before generation', () => {
  const settings = normalizeLabSettings({ firstChildrenMin: 6.7, firstChildrenMax: 3,
    laterChildrenMin: -5, laterChildrenMax: 99, ageTaper: 12, burstSpan: -2 });
  assert.equal(settings.firstChildrenMin, 7);
  assert.equal(settings.firstChildrenMax, 7);
  assert.equal(settings.laterChildrenMin, 2);
  assert.equal(settings.laterChildrenMax, 8);
  assert.equal(settings.ageTaper, 1);
  assert.equal(settings.burstSpan, 1);
});

test('opening rounds and later branch spacing normalize and survive sharing', () => {
  const settings = normalizeLabSettings({ wideForkLevels: 2.6, laterBranchSpacing: 18 });
  assert.equal(settings.wideForkLevels, 3);
  assert.equal(settings.laterBranchSpacing, 18);
  assert.equal(normalizeLabSettings({ wideForkLevels: 99 }).wideForkLevels, 3);
  assert.equal(normalizeLabSettings({ wideForkLevels: -1 }).wideForkLevels, 1);
  assert.equal(normalizeLabSettings({ laterBranchSpacing: 99 }).laterBranchSpacing, 30);
  assert.equal(normalizeLabSettings({ laterBranchSpacing: -1 }).laterBranchSpacing, 3);
  const state = { settings, age: 40, selected: true };
  const restored = readLabState(labURL(state, 'https://example.test/prototype/path-lab.html'));
  const exported = JSON.parse(exportLabSettings(state));
  assert.equal(restored.settings.wideForkLevels, 3);
  assert.equal(restored.settings.laterBranchSpacing, 18);
  assert.equal(exported.networkOptions.wideForkLevels, 3);
  assert.equal(exported.networkOptions.laterBranchSpacing, 18);
});

test('organic mode reaches the generator and survives URL and export round trips', () => {
  const settings = normalizeLabSettings({ growthMode: 'organic', firstChildrenMin: 5, firstChildrenMax: 6 });
  const state = { settings, age: 60, selected: true };
  const restored = readLabState(labURL(state, 'https://example.test/prototype/path-lab.html'));
  const exported = JSON.parse(exportLabSettings(state));
  assert.equal(restored.settings.growthMode, 'organic');
  assert.equal(exported.networkOptions.growthMode, 'organic');
  assert.equal(exported.networkOptions.sampleAgeStep, 0.5);
  assert.equal(exported.settings.firstChildrenMax, 6);
  assert.equal(normalizeLabSettings({ growthMode: 'unsupported' }).growthMode, 'laminar');
});

test('URL state round-trips only normalized settings and bounded time state', () => {
  const href = 'https://example.test/prototype/path-lab.html?unrelated=keep#fragment';
  const state = {
    settings: normalizeLabSettings({
      variant: 'hybrid', maxTips: 40.6, lineWidth: 2.25,
      seed: ' shared-network ', unknown: 'discard me',
    }),
    age: 40.25,
    selected: true,
  };
  const url = labURL(state, href);
  const restored = readLabState(url);
  const serialized = url.searchParams.get('lab');

  assert.equal(url.searchParams.get('unrelated'), 'keep');
  assert.equal(url.hash, '#fragment');
  assert.deepEqual(restored, { ...state, age: 40.25 });
  assert.deepEqual(Object.keys(JSON.parse(serialized)), ['settings', 'age', 'selected']);
  assert.equal(JSON.parse(serialized).settings.unknown, undefined);
  assert.ok(serialized.length < 1200);
});

test('malformed and oversized URL state falls back safely', () => {
  for (const value of ['', '{bad json', 'x'.repeat(5000)]) {
    const url = new URL('https://example.test/prototype/path-lab.html');
    url.searchParams.set('lab', value);
    assert.deepEqual(readLabState(url), {
      settings: LAB_DEFAULTS, age: 0, selected: false,
    });
  }
});

test('export contains normalized settings, time, and resolved generator config', () => {
  const source = { settings: { seed: ' export-test ', maxTips: 63.7 }, age: 120, selected: true };
  const exported = JSON.parse(exportLabSettings(source));

  assert.equal(exported.settings.seed, 'export-test');
  assert.equal(exported.settings.maxTips, 64);
  assert.equal(exported.age, 70);
  assert.equal(exported.selected, true);
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.algorithmVersion, 2);
  assert.deepEqual(exported.networkOptions, networkOptionsForLab(exported.settings));
  assert.deepEqual(exported.resolvedConfig, generateNetwork(exported.networkOptions).config);
});
