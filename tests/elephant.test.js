import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES } from '../src/i18n/config.js';
import { CHAPTERS, chaptersFor, momentsFor, renderElephantReading, ELEPHANT_PATH, ELEPHANT_READ_PATH, MOMENTS } from '../src/lessons/elephant/elephant-story.js';
import { beatList } from '../src/lessons/choices/journey-story.js';
import { escapeHTML } from '../src/lessons/choices/journey-shell.js';

const en = getTranslator('en');
const words = text => text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
const storyWords = beat => words(beat.heading) + beat.body.reduce((sum, paragraph) => sum + words(paragraph), 0)
  + (beat.takeaways ?? []).reduce((sum, item) => sum + words(item.heading) + words(item.text), 0);

test('Lesson 3 has ten steps and the activity in six chapters', () => {
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['pair', 'strengths', 'steering', 'team', 'activity', 'keep']);
  const beats = beatList(CHAPTERS);
  assert.deepEqual(beats.filter(item => !item.beat.activity).map(item => item.beat.id), ['pair', 'quick', 'slow', 'now', 'reins', 'path', 'team', 'first', 'keep', 'next']);
  assert.equal(beats.filter(item => item.beat.activity).length, 1);
  assert.equal(new Set(beats.map(item => item.fragment)).size, beats.length, 'every step has its own address');
  assert.equal(ELEPHANT_READ_PATH, `${ELEPHANT_PATH}read/`);
});

test('the English story keeps its 419 words, at most 50 a step', () => {
  let total = 0;
  for (const chapter of chaptersFor(en)) for (const beat of chapter.beats) {
    if (beat.activity) continue;
    assert.ok(storyWords(beat) <= 50, `${beat.id}: ${storyWords(beat)} words`);
    total += storyWords(beat);
  }
  assert.equal(total, 419);
});

test('the picture stays a picture: not a brain, not a boss, not an enemy', () => {
  const text = JSON.stringify(chaptersFor(en));
  assert.match(text, /doesn’t show how a real brain works/);
  assert.match(text, /The rider isn’t the boss, and the elephant isn’t the problem/);
  assert.doesNotMatch(text, /willpower is a muscle|\d+ ?%|will always/i);
});

test('every step has words and a picture description in every language', () => {
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    for (const chapter of chaptersFor(t)) for (const beat of chapter.beats) {
      assert.ok(beat.heading && beat.alt, `${locale} ${beat.id}`);
      assert.ok((beat.body.length > 0 || beat.takeaways) && beat.body.every(Boolean), `${locale} ${beat.id} body`);
      assert.ok(!/elephant\.[a-z]+\.|\{/.test([beat.heading, beat.alt, ...beat.body].join(' ')), `${locale} ${beat.id} has a raw key or argument`);
    }
  }
});

test('six moments, three for each partner, each with its line', () => {
  assert.deepEqual(MOMENTS.map(card => card.side), ['elephant', 'elephant', 'elephant', 'rider', 'rider', 'rider']);
  for (const locale of LOCALES) {
    for (const card of momentsFor(getTranslator(locale))) assert.ok(card.label && card.line && !/\{|elephant\.sort/.test(card.label + card.line), `${locale} ${card.id}`);
  }
});

test('the text version has every step and the activity as a still', () => {
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    const html = renderElephantReading({ t });
    for (const chapter of chaptersFor(t)) for (const beat of chapter.beats) assert.ok(html.includes(escapeHTML(beat.heading)), `${locale} ${beat.id}`);
    for (const card of momentsFor(t)) assert.ok(html.includes(escapeHTML(card.label)) && html.includes(escapeHTML(card.line)), `${locale} ${card.id}`);
    assert.ok(html.includes(escapeHTML(t('elephant.sort.strong.rider'))));
    assert.ok(!/<script/i.test(html));
  }
});

test('Lesson 3 is linked: the roadmap, the menu and the end of Lesson 2', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { lessonsFor } = await import('../src/data/site.js');
  const lesson = lessonsFor(en).find(item => item.id === 'deciding');
  assert.equal(lesson.status, 'available');
  assert.equal(lesson.href, ELEPHANT_PATH);
  assert.equal(lesson.title, en('elephant.ui.title'));
  const dist = new URL('../dist/', import.meta.url);
  if (!existsSync(new URL('index.html', dist))) return; // the built pages are checked after `npm run build`
  const page = path => readFileSync(new URL(`${path.slice(1)}index.html`, dist), 'utf8');
  for (const prefix of ['/', '/es/', '/de/', '/fr/']) {
    const local = path => `${prefix}${path.slice(1)}`;
    for (const path of [ELEPHANT_PATH, ELEPHANT_READ_PATH]) assert.doesNotMatch(page(local(path)), /<meta name="robots" content="noindex/, local(path));
    assert.ok(page(prefix).includes(`href="${local(ELEPHANT_PATH)}"`), `${prefix}: the roadmap and menu link to Lesson 3`);
    assert.ok(page(local(ELEPHANT_READ_PATH)).includes(`href="${local(ELEPHANT_PATH)}"`), `${prefix}: the text version links to the journey`);
    assert.ok(page(local('/practice/small-choices/')).includes(`data-next-lesson="${local(ELEPHANT_PATH)}"`), `${prefix}: Lesson 2 ends with a link to Lesson 3`);
    assert.ok(page(local('/practice/small-choices/read/')).includes(`href="${local(ELEPHANT_PATH)}"`), `${prefix}: Lesson 2's text version links to Lesson 3`);
  }
});
