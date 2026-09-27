import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES, DAYS, MAX_ENERGY, applyActivity, createSkillState, replayChoices } from '../src/lessons/choices/journey-game.js';
import { activityKind, announceText, dayLabel, frontierIndex, resultMessage } from '../src/lessons/choices/journey-play.js';

test('dayLabel reads "Afternoon N of 10 · <day>", matching DAYS', () => {
  assert.equal(dayLabel(0), 'Afternoon 1 of 10 · Monday');
  assert.equal(dayLabel(9), 'Afternoon 10 of 10 · Friday');
  for (let index = 0; index < DAYS.length; index += 1) {
    assert.match(dayLabel(index), new RegExp(`Afternoon ${index + 1} of ${DAYS.length} · ${DAYS[index].label}$`));
  }
});

test('activityKind labels rest activities as "Rest & fun" and practice by its sport', () => {
  assert.equal(activityKind(ACTIVITIES.nap), 'Rest & fun');
  assert.equal(activityKind(ACTIVITIES.soccerPractice), 'Soccer');
  assert.equal(activityKind(ACTIVITIES.celloLesson), 'Cello');
});

test('frontierIndex finds the first unchosen day, or the full length once every day is chosen', () => {
  assert.equal(frontierIndex(Array(10).fill(null)), 0);
  assert.equal(frontierIndex(['soccerPractice', 'nap', null, null]), 2);
  assert.equal(frontierIndex(Array(10).fill('nap')), 10);
});

test('resultMessage and announceText describe a rest day and a practice day without inventing new wording', () => {
  const rest = applyActivity(createSkillState(), 'nap').result;
  assert.match(resultMessage(rest), /Energy back up/);
  assert.equal(announceText(0, rest), `Monday: Take a nap. ${resultMessage(rest)}`);

  const practice = applyActivity(createSkillState({ ballControl: 0.6 }), 'soccerPractice').result;
  assert.match(resultMessage(practice), /grew/);
  assert.match(resultMessage(practice), /ball control helped your passing grow faster/);
});

test('replayChoices replaying a full run matches applying the same activities one by one', () => {
  const sequence = ['soccerPractice', 'celloLesson', 'nap', 'hallwayDribble', 'soccerPractice', 'rest', 'celloSolo', 'soccerPractice', 'drillPractice', 'celloPractice'];
  let manual = createSkillState();
  sequence.forEach((activityId, day) => { manual = applyActivity(manual, activityId, { day }).state; });
  const replayed = replayChoices(sequence);
  assert.deepEqual(replayed.levels, manual.levels);
  assert.equal(replayed.energy, manual.energy);
  assert.equal(replayed.history.length, sequence.length);
  replayed.history.forEach((entry, day) => assert.equal(entry.day, day));
});

test('replayChoices stops at the first unchosen day and ignores anything after it', () => {
  const partial = replayChoices(['soccerPractice', 'nap', null, 'soccerPractice']);
  const expected = replayChoices(['soccerPractice', 'nap']);
  assert.deepEqual(partial.levels, expected.levels);
  assert.equal(partial.energy, expected.energy);
  assert.equal(partial.history.length, 2);
});

test('replayChoices with no choices is the same as a fresh skill state', () => {
  const empty = replayChoices([]);
  const fresh = createSkillState();
  assert.deepEqual(empty.levels, fresh.levels);
  assert.equal(empty.energy, MAX_ENERGY);
  assert.equal(empty.history.length, 0);
});

test('editing an earlier day and replaying recomputes every later day, but keeps their chosen activities', () => {
  const original = ['nap', 'soccerPractice', 'soccerPractice', 'celloLesson'];
  const before = replayChoices(original);
  const edited = [...original];
  edited[0] = 'soccerPractice'; // day 0 was rest, now practice: less energy going into day 1
  const after = replayChoices(edited);
  assert.equal(after.history.length, before.history.length, 'later days are still all chosen');
  assert.deepEqual(after.history.map(entry => entry.activity), edited, 'each day keeps its own chosen activity');
  assert.notDeepEqual(after.levels, before.levels, 'recomputing changes the resulting levels');
  assert.ok(after.energy <= before.energy, 'skipping the early rest leaves less energy by the end');
});
