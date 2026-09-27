import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITIES, DAYS, MAX_ENERGY, MAYA_PATTERNS, TRANSFERS,
  applyActivity, createSkillState, levelWord, mayaSeasons, practiseSeason, summarize, transferLevels,
} from '../src/lessons/choices/journey-game.js';

const total = levels => Object.values(levels).reduce((sum, value) => sum + value, 0);

test('every afternoon offers three known activities, including a way to rest', () => {
  assert.equal(DAYS.length, 10);
  for (const day of DAYS) {
    assert.equal(day.options.length, 3);
    for (const id of day.options) assert.ok(ACTIVITIES[id], `${id} is defined`);
  }
  assert.ok(DAYS.filter(day => day.options.some(id => ACTIVITIES[id].rest)).length >= 8, 'rest is almost always available');
});

test('practice builds skills and costs energy; rest restores energy and builds nothing', () => {
  const start = createSkillState();
  const practised = applyActivity(start, 'soccerPractice');
  assert.ok(practised.state.levels.passing > 0);
  assert.equal(practised.state.energy, MAX_ENERGY - 1);
  const rested = applyActivity(practised.state, 'nap');
  assert.equal(rested.state.energy, MAX_ENERGY);
  assert.deepEqual(rested.state.levels, practised.state.levels);
  assert.equal(rested.result.rest, true);
});

test('practising while worn out builds less than practising rested', () => {
  const rested = createSkillState();
  const tired = { ...createSkillState(), energy: 0 };
  const a = applyActivity(rested, 'kickBall').result.gains.ballControl;
  const b = applyActivity(tired, 'kickBall');
  assert.ok(b.result.tired);
  assert.ok(b.result.gains.ballControl < a);
});

test('a foundation makes related practice count for more, and levels stay bounded', () => {
  const novice = createSkillState();
  const skilled = createSkillState({ ballControl: 0.6 });
  const withoutBase = applyActivity(novice, 'soccerPractice').result;
  const withBase = applyActivity(skilled, 'soccerPractice').result;
  assert.ok(withBase.gains.passing > withoutBase.gains.passing);
  assert.ok(withBase.boosts.some(boost => boost.skill === 'passing' && boost.from === 'ballControl'));
  let state = createSkillState({ ballControl: 0.99, passing: 0.99, positioning: 0.99 });
  for (let i = 0; i < 20; i += 1) state = applyActivity({ ...state, energy: MAX_ENERGY }, 'soccerPractice').state;
  for (const value of Object.values(state.levels)) assert.ok(value <= 1);
});

test('Maya: regular practice pulls ahead, and its per-season growth speeds up', () => {
  const a = mayaSeasons({ pattern: MAYA_PATTERNS.a });
  const b = mayaSeasons({ pattern: MAYA_PATTERNS.b });
  assert.equal(a.length, 4);
  for (let season = 1; season <= 3; season += 1) assert.ok(total(a[season].levels) > total(b[season].levels));
  const gains = [1, 2, 3].map(season => total(a[season].levels) - total(a[season - 1].levels));
  assert.ok(gains[1] > gains[0] && gains[2] > gains[1], `growth accelerates: ${gains}`);
  const gap = [1, 2, 3].map(season => total(a[season].levels) - total(b[season].levels));
  assert.ok(gap[2] > gap[0], 'the gap grows');
});

test('transfer gives a partial head start, never the full skill', () => {
  const levels = { positioning: 0.5, passing: 0.5, ballControl: 0.8, reading: 0.4, rhythm: 0.4, fingers: 0.4 };
  for (const [id, transfer] of Object.entries(TRANSFERS)) {
    const carried = transferLevels(levels, id);
    for (const skill of transfer.skills) {
      assert.ok(carried[skill.id] < levels[skill.source]);
      assert.ok(carried[skill.id] >= 0);
    }
  }
  const late = practiseSeason(transferLevels(levels, 'basketball'));
  assert.ok(total(late) > total(transferLevels(levels, 'basketball')), 'starting later still grows');
});

test('reader-facing words describe levels without numbers, and the summary counts choices', () => {
  for (const value of [0, 0.1, 0.3, 0.6, 0.9]) assert.doesNotMatch(levelWord(value), /\d/);
  let state = createSkillState();
  for (const id of ['soccerPractice', 'celloLesson', 'nap']) state = applyActivity(state, id).state;
  const summary = summarize(state);
  assert.deepEqual({ soccer: summary.counts.soccer, cello: summary.counts.cello, rest: summary.counts.rest }, { soccer: 1, cello: 1, rest: 1 });
  assert.ok(summary.lines.length >= 2);
});
