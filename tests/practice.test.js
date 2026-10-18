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

test('Lesson 2 promises no result: practice helps, it doesn’t guarantee', () => {
  const text = JSON.stringify(chaptersFor(en));
  assert.match(text, /doesn’t guarantee/);
  assert.doesNotMatch(text, /\d+ ?%|guarantees? (?:success|you)|will always|always leads/i);
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

test('the end card names what grew most and the head start, in words', () => {
  const state = replay(PLAYED);
  const tally = counts(PLAYED);
  assert.equal(tally.soccer + tally.cello + tally.basketball + tally.rest, 10);
  const lines = endLines(PLAYED, state.levels, state.carried, en);
  assert.deepEqual(lines, ['You chose soccer most often, so soccer grew the most.', 'You chose cello now and then, and it grew a little.', 'Basketball began with a head start from soccer.']);
  const none = endLines(Array(10).fill('nap'), replay([]).levels, null, en);
  assert.match(none[0], /didn’t choose soccer/);
});

test('every mix of afternoons gets true end lines with no numbers', () => {
  const sum = (levels, group) => SKILLS[group].reduce((total, id) => total + levels[id], 0);
  let mixes = 0;
  // Every mix of the ten afternoons (3^10), checked in English; a sample in every language.
  for (let code = 0; code < 3 ** 10; code += 1) {
    const choices = DAYS.map((day, index) => day.options[Math.floor(code / 3 ** index) % 3]);
    const { levels, carried } = replay(choices);
    const tally = counts(choices);
    const lines = endLines(choices, levels, carried, en);
    assert.ok(lines.every(line => !/\d|\{/.test(line)), lines.join(' '));
    assert.equal(lines.length, tally.basketball ? 3 : 2, 'the basketball line only after basketball was picked');
    for (const [index, group, other] of [[0, 'soccer', 'cello'], [1, 'cello', 'soccer']]) {
      if (/grew the most|grew more/.test(lines[index])) {
        assert.ok(tally[group] > tally[other] && sum(levels, group) > sum(levels, other), lines[index]);
      }
      if (/most often/.test(lines[index])) assert.ok(Object.values(tally).every(value => value <= tally[group]), lines[index]);
      if (/a little/.test(lines[index])) assert.ok(sum(levels, group) < sum(levels, other), lines[index]);
    }
    if (code % 97 === 0) for (const locale of LOCALES) {
      for (const line of endLines(choices, levels, carried, getTranslator(locale))) assert.ok(line && !/\d|\{/.test(line), `${locale}: ${line}`);
    }
    mixes += 1;
  }
  assert.equal(mixes, 59049);
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

test('Lesson 2 is linked like Lesson 1: the roadmap, the menu, its overview page and the end of Lesson 1', async () => {
  assert.equal(PRACTICE_READ_PATH, `${PRACTICE_PATH}read/`);
  const { lessonsFor } = await import('../src/data/site.js');
  const lessons = lessonsFor(en);
  assert.deepEqual(lessons.map(lesson => lesson.id), ['choices', 'practice', 'deciding', 'habits', 'happiness', 'relationships', 'learning']);
  assert.deepEqual(lessons.filter(lesson => lesson.href).map(lesson => lesson.href), ['/choices/', '/practice/']);
  assert.equal(lessons[1].title, en('practice.ui.title'));
  const dist = new URL('../dist/', import.meta.url);
  if (!existsSync(new URL('index.html', dist))) return; // the built pages are checked after `npm run build`
  const page = path => readFileSync(new URL(`${path.slice(1)}index.html`, dist), 'utf8');
  for (const prefix of ['/', '/es/', '/de/', '/fr/']) {
    const local = path => `${prefix}${path.slice(1)}`;
    for (const path of [PRACTICE_PATH, PRACTICE_READ_PATH, '/practice/']) {
      assert.doesNotMatch(page(local(path)), /<meta name="robots" content="noindex/, local(path));
    }
    const home = page(prefix);
    assert.ok(home.includes(`href="${local('/practice/')}"`), `${prefix}: the roadmap links to Lesson 2`);
    assert.ok(home.includes(`href="${local(PRACTICE_PATH)}"`), `${prefix}: the menu links to Lesson 2`);
    const overview = page(local('/practice/'));
    assert.ok(overview.includes(`href="${local(PRACTICE_PATH)}"`) && overview.includes(`href="${local(PRACTICE_READ_PATH)}"`), `${prefix}: the overview links to the lesson`);
    assert.ok(page(local('/choices/the-paths-we-make/')).includes(`data-next-lesson="${local(PRACTICE_PATH)}"`), `${prefix}: Lesson 1 ends with a link to Lesson 2`);
  }
});
