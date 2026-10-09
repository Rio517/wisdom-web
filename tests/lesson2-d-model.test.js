// Lesson 2 game, direction D (prototype): the model's risk checks. Starting
// depends on counts alone (no streaks), never goes down, and only a home
// activity moves it; skills never go down either.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAYS, DEFAULT_PICKS, HOME, KINDS, CHOICES, replay, startingLevel, startingStage, frontierIndex, startingGotEasier,
} from '../prototype/lesson2/model-d.js';

// A small seeded generator so a failure can be replayed.
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, items) => items[Math.floor(rand() * items.length)];
const randomPicks = rand => Object.fromEntries(KINDS.map(kind => [kind, pick(rand, CHOICES[kind])]));
const randomChoices = (rand, days = DAYS) => days.map(day => pick(rand, day.options).id);
function shuffle(rand, items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
const close = (a, b) => Math.abs(a - b) < 1e-12;

test('fourteen days, three options each, weekends on days 6–7 and 13–14', () => {
  assert.equal(DAYS.length, 14);
  for (const day of DAYS) assert.equal(day.options.length, 3);
  assert.deepEqual(DAYS.filter(day => day.weekend).map(day => day.index), [5, 6, 12, 13]);
});

test('the same days in shuffled order end at the same levels', () => {
  const rand = random(20261009);
  for (let trial = 0; trial < 2000; trial += 1) {
    const picks = randomPicks(rand);
    const choices = randomChoices(rand);
    const order = shuffle(rand, DAYS.map((_, index) => index));
    const a = replay(choices, picks);
    const b = replay(order.map(index => choices[index]), picks, order.map(index => DAYS[index]));
    for (const kind of HOME) assert.ok(close(a.starting[kind], b.starting[kind]), `starting ${kind}, trial ${trial}`);
    for (const kind of KINDS) {
      for (const skill of Object.keys(a.skills[kind])) assert.ok(close(a.skills[kind][skill], b.skills[kind][skill]), `${kind}.${skill}, trial ${trial}`);
    }
  }
});

test('rest, bad luck, the sport and skipped activities move Starting zero times; nothing ever goes down', () => {
  const rand = random(7);
  let checkedDays = 0;
  let nonHomeMoves = 0;
  for (let trial = 0; trial < 3000; trial += 1) {
    const picks = randomPicks(rand);
    const choices = randomChoices(rand);
    let previous = replay(Array(DAYS.length).fill(null), picks);
    for (let index = 0; index < DAYS.length; index += 1) {
      const current = replay(choices.map((id, i) => (i <= index ? id : null)), picks);
      const id = choices[index];
      for (const kind of HOME) {
        const delta = current.starting[kind] - previous.starting[kind];
        assert.ok(delta >= 0, `Starting went down on day ${index + 1}`);
        // Only starting this very activity moves its path: a rest, a fun
        // option, the sport, the other home activity, an unlucky day all leave it.
        if (id !== kind && delta !== 0) nonHomeMoves += 1;
      }
      for (const kind of KINDS) {
        for (const skill of Object.keys(current.skills[kind])) assert.ok(current.skills[kind][skill] >= previous.skills[kind][skill], 'a skill went down');
      }
      checkedDays += 1;
      previous = current;
    }
  }
  assert.equal(nonHomeMoves, 0);
  assert.equal(checkedDays, 3000 * DAYS.length);
});

test('a usual-time start is a full notch, another time half of one', () => {
  assert.equal(startingLevel(1, 0), 0.14);
  assert.equal(startingLevel(0, 1), 0.07);
  assert.equal(startingLevel(8, 0), 1);
  const cello = replay(DAYS.map(day => (day.options.some(o => o.id === 'instrument') && !['sport'].includes(day.options[0].id) ? 'instrument' : day.options[0].id)));
  assert.ok(cello.starting.instrument > 0.9, 'cello on every free day nearly fills the path');
});

test('the first start says "started", later ones "easier"; a full path stops moving', () => {
  const choices = DAYS.map(() => 'quiet');
  choices[1] = 'sport';
  const { history } = replay(choices);
  assert.equal(history[0].move, 'started');
  assert.equal(history[2].move, 'easier');
  assert.equal(history[1].move, null);
  const full = history.findIndex(entry => entry && entry.stage === 3);
  assert.ok(full > 0);
  assert.ok(history.slice(full + 1).every(entry => entry.kind !== 'quiet' || entry.move === null));
});

test('alternating cello and reading moves both past the middle; the end heading follows it', () => {
  const choices = DAYS.map((day, index) => {
    const ids = day.options.map(o => o.id);
    const want = index % 2 ? 'quiet' : 'instrument';
    return ids.includes(want) ? want : ids.find(id => HOME.includes(id)) ?? ids[0];
  });
  const { starting } = replay(choices);
  // Seven starts each: reading always at its usual time, cello half at another.
  assert.ok(starting.instrument >= 0.5 && starting.instrument < 1);
  assert.ok(starting.quiet > starting.instrument);
  assert.equal(startingGotEasier(starting), true);
  const none = replay(DAYS.map(day => day.options.find(o => !HOME.includes(o.id)).id));
  assert.equal(startingGotEasier(none.starting), false);
  assert.equal(startingStage(0), 0);
});

test('the lucky day grows the sport more, and picks change only names', () => {
  const sportDays = DAYS.filter(day => day.options.some(o => o.id === 'sport')).map(day => day.index);
  const go = index => DAYS.map((day, i) => (i === index ? 'sport' : day.options.find(o => o.id !== 'sport').id));
  const normal = replay(go(sportDays[0]));
  const lucky = replay(go(DAYS.findIndex(day => day.chance === 'lucky')));
  assert.ok(lucky.skills.sport.ballControl > normal.skills.sport.ballControl * 1.5);
  const piano = replay(go(sportDays[0]), { ...DEFAULT_PICKS, instrument: 'piano' });
  assert.deepEqual(Object.keys(piano.skills.instrument), ['readingMusic', 'bothHands']);
  assert.equal(frontierIndex([null]), 0);
  assert.equal(frontierIndex(DAYS.map(() => 'quiet')), DAYS.length);
});
