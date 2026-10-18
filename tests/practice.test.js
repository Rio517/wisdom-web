import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES } from '../src/i18n/config.js';
import { CHAPTERS, chaptersFor, afternoonsFor, renderPracticeReading, PRACTICE_PATH, PRACTICE_READ_PATH } from '../src/lessons/practice/practice-story.js';
import { DAYS, ACTIVITIES, SKILLS, OPENS, replay, counts, endLines } from '../src/lessons/practice/practice-afternoons-data.js';
import { beatList } from '../src/lessons/choices/journey-story.js';
import { escapeHTML } from '../src/lessons/choices/journey-shell.js';

const en = getTranslator('en');
const words = text => text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
const PLAYED = ['soccerPractice', 'kickBall', 'celloPractice', 'hallway', 'soccerPractice', 'soccerPractice', 'basketball', 'friend', 'trick', 'match'];

test('Lesson 2 has eleven steps and the activity in five chapters', () => {
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['small', 'adding', 'new', 'activity', 'keep']);
  const beats = beatList(CHAPTERS);
  assert.equal(beats.filter(item => !item.beat.activity).length, 11);
  assert.equal(beats.filter(item => item.beat.activity).length, 1);
  assert.equal(new Set(beats.map(item => item.fragment)).size, beats.length, 'every step has its own address');
});

test('the English story stays within its 422 words', () => {
  let total = 0;
  for (const chapter of chaptersFor(en)) for (const beat of chapter.beats) {
    if (beat.activity) continue;
    total += words(beat.heading) + beat.body.reduce((sum, paragraph) => sum + words(paragraph), 0)
      + (beat.takeaways ?? []).reduce((sum, item) => sum + words(item.heading) + words(item.text), 0);
  }
  assert.ok(total <= 422, `${total} words`);
});

test('every step has words and a picture description in every language', () => {
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    for (const chapter of chaptersFor(t)) for (const beat of chapter.beats) {
      assert.ok(beat.heading && beat.alt, `${locale} ${beat.id}`);
      assert.ok((beat.body.length > 0 || beat.takeaways) && beat.body.every(Boolean), `${locale} ${beat.id} body`);
      assert.ok(!/practice\.[a-z]+\.|\{/.test([beat.heading, beat.alt, ...beat.body].join(' ')), `${locale} ${beat.id} has a raw key or argument`);
    }
  }
});

test('each afternoon offers three choices with labels of four words or fewer', () => {
  assert.equal(DAYS.length, 10);
  for (const locale of LOCALES) {
    for (const day of afternoonsFor(getTranslator(locale))) {
      assert.equal(day.options.length, 3);
      if (locale === 'en') for (const option of day.options) assert.ok(words(option.label) <= 4, option.label);
    }
  }
  for (const day of DAYS) for (const id of day.options) assert.ok(ACTIVITIES[id], id);
});

test('afternoon 7 opens basketball with a head start from soccer, dribbling empty', () => {
  const before = replay(PLAYED.slice(0, OPENS - 1));
  assert.equal(before.open, false);
  const opened = replay([...PLAYED.slice(0, OPENS), null]);
  assert.equal(opened.open, true);
  assert.ok(opened.carried.court > 0, 'knowing where to stand starts partly filled');
  assert.ok(opened.carried.bPassing > 0, 'passing starts partly filled');
  assert.equal(opened.carried.dribbling, undefined);
  assert.equal(opened.levels.dribbling, 0, 'dribbling with hands starts empty');
  assert.deepEqual(SKILLS.basketball, ['court', 'bPassing', 'dribbling']);
});

test('nothing shrinks: every pick only adds', () => {
  const pick = seed => DAYS.map((day, index) => day.options[(seed * 7 + index * 3) % 3]);
  for (let seed = 0; seed < 12; seed += 1) {
    const choices = pick(seed);
    let previous = replay([]).levels;
    for (let day = 1; day <= DAYS.length; day += 1) {
      const { levels } = replay(choices.slice(0, day));
      for (const [id, level] of Object.entries(levels)) assert.ok(level >= previous[id] - 1e-9, `${id} shrank on afternoon ${day}`);
      previous = levels;
    }
  }
});

test('changing an earlier afternoon recomputes the later ones', () => {
  const changed = [...PLAYED]; changed[0] = 'celloPractice';
  assert.notDeepEqual(replay(changed).levels, replay(PLAYED).levels);
});

test('the end card names what grew most and the head start', () => {
  const state = replay(PLAYED);
  const tally = counts(PLAYED);
  assert.equal(tally.soccer + tally.cello + tally.basketball + tally.rest, 10);
  const lines = endLines(PLAYED, state.levels, state.carried, en);
  assert.equal(lines.length, 3);
  assert.match(lines[0], /soccer grew the most/);
  assert.match(lines[2], /head start/);
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    for (const line of endLines(PLAYED, state.levels, state.carried, t)) assert.ok(line && !line.includes('{'), `${locale}: ${line}`);
  }
  const none = endLines(Array(10).fill('nap'), replay([]).levels, null, en);
  assert.match(none[0], /didn’t choose soccer/);
});

test('the text version has every step and the activity as a still', () => {
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    const html = renderPracticeReading({ t });
    for (const chapter of chaptersFor(t)) for (const beat of chapter.beats) assert.ok(html.includes(escapeHTML(beat.heading)), `${locale} ${beat.id}`);
    for (const day of afternoonsFor(t)) assert.ok(html.includes(escapeHTML(day.options[0].label)), `${locale} ${day.label}`);
    assert.ok(!/<script/i.test(html));
  }
});

test('the journey and its text version are built, unlinked and noindex', () => {
  assert.equal(PRACTICE_READ_PATH, `${PRACTICE_PATH}read/`);
  const dist = new URL('../dist/', import.meta.url);
  if (!existsSync(new URL('index.html', dist))) return; // checked after `npm run build`
  for (const prefix of ['', 'es/', 'de/', 'fr/']) {
    for (const page of [PRACTICE_PATH, PRACTICE_READ_PATH]) {
      const html = readFileSync(new URL(`${prefix}${page.slice(1)}index.html`, dist), 'utf8');
      assert.match(html, /<meta name="robots" content="noindex/, `${prefix}${page}`);
    }
    const home = readFileSync(new URL(`${prefix}index.html`, dist), 'utf8');
    assert.ok(!home.includes(PRACTICE_PATH), `${prefix} home links to Lesson 2`);
    const lesson1 = readFileSync(new URL(`${prefix}choices/the-paths-we-make/index.html`, dist), 'utf8');
    assert.ok(!lesson1.includes(PRACTICE_PATH), `${prefix} Lesson 1 links to Lesson 2`);
  }
});
