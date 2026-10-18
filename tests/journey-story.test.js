import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, FRAGMENT_ALIASES, LEARNED, beatList, chaptersFor, renderJourneyReading } from '../src/lessons/choices/journey-story.js';
import { readStoreFiles } from '../tooling/lives-data.mjs';
import { loadStore } from '../src/lessons/choices/lives/engine.js';
import { writtenLife } from '../src/lessons/choices/lives/engine.js';
import { t as runtimeT } from '../src/i18n/runtime.js';

test('the journey keeps the approved order: big picture, hike, explore, takeaways', () => {
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['paths', 'hike', 'explore', 'wrap']);
});

// "Many paths" tells one life from the lives store: Sam's, as the static reading does.
const sam = writtenLife(loadStore(readStoreFiles()), 'sam');

test('every beat has a stable unique fragment, a heading, text and a picture description', () => {
  const beats = beatList(chaptersFor(runtimeT, sam));
  const fragments = beats.map(item => item.fragment);
  assert.equal(new Set(fragments).size, fragments.length);
  for (const { beat } of beats) {
    assert.ok(beat.heading && (beat.body.length || beat.steps?.length), beat.id);
    assert.ok(beat.alt, `${beat.id} describes its picture`);
  }
});

test('Maya lives in Lesson 2: no Skills chapter, two takeaways, and her old links land on Explore', () => {
  assert.ok(!CHAPTERS.some(chapter => chapter.id === 'skills'));
  assert.deepEqual(CHAPTERS.at(-1).beats[0].takeaways.map(item => item.icon), ['add', 'weather']);
  for (const old of ['skills-fork', 'skills-builds', 'skills-never-late', 'skills-slow', 'skills-transfer']) assert.equal(FRAGMENT_ALIASES[old], 'explore-explore');
  assert.doesNotMatch(renderJourneyReading(), /Maya/);
});

test('old fragments of merged beats land on the beat that holds their words', () => {
  const fragments = new Set(beatList().map(item => item.fragment));
  for (const [old, current] of Object.entries(FRAGMENT_ALIASES)) {
    assert.ok(!fragments.has(old), `${old} is still a beat`);
    assert.ok(fragments.has(current), `${old} → ${current}`);
  }
});

test('choices mark exactly one option as what happened in the story', () => {
  for (const { beat } of beatList().filter(item => item.beat.choice)) {
    assert.equal(beat.choice.options.filter(option => option.story).length, 1, beat.id);
    for (const option of beat.choice.options) assert.ok(option.feedback.length > 20);
  }
});

test('the control sort includes both kinds of card and learned items exist', () => {
  const sort = beatList().find(item => item.beat.sort).beat.sort;
  assert.ok(sort.some(card => card.mine) && sort.some(card => !card.mine));
  for (const { beat } of beatList()) for (const id of beat.learned ?? []) assert.ok(LEARNED[id]);
});

test('copy avoids guarantees, invented numbers and scores', () => {
  const text = JSON.stringify(CHAPTERS);
  assert.doesNotMatch(text, /\d+ ?%|guarantees? (?:success|you)|will always|always leads/i);
});

test('the static reading renders every heading and escapes content', () => {
  const html = renderJourneyReading({ t: (key, values) => (key === 'lesson.beat.plan.heading' ? 'A <b> test' : runtimeT(key, values)) });
  for (const { beat } of beatList()) if (beat.id !== 'plan') assert.ok(html.includes(beat.heading.replaceAll('&', '&amp;')), beat.heading);
  assert.match(html, /A &lt;b&gt; test/);
  assert.match(html, /what they chose/);
});

test('Lesson 1 no longer has the ten-afternoon game, in the journey or its text version', () => {
  assert.ok(!beatList().some(item => item.beat.game || item.chapter.id === 'play'));
  assert.doesNotMatch(renderJourneyReading(), /afternoon/i);
});

test('"Many paths" is the cover, one life and "Choices add up"; old links land on the beat that holds their words', () => {
  assert.deepEqual(CHAPTERS[0].beats.map(beat => beat.id), ['cover', 'life', 'adds']);
  assert.equal(FRAGMENT_ALIASES['paths-many'], 'paths-life');
  assert.equal(FRAGMENT_ALIASES['paths-travel'], 'paths-life');
  assert.equal(FRAGMENT_ALIASES['paths-outside'], 'paths-adds');
});

test('the text version tells the life step by step, then how to change a choice, then the picture, then "Choices add up"', () => {
  const html = renderJourneyReading({ t: runtimeT, life: sam });
  const life = html.slice(html.indexOf('id="read-life"'), html.indexOf('id="read-adds"'));
  assert.match(life, /<ol class="reading-steps"><li><strong>Age 0<\/strong> Sam is born\.<\/li>/);
  assert.match(life, /<li>Many paths are still ahead\.<\/li><\/ol><p>In the lesson, you can change one of Sam’s choices/);
  assert.ok(life.indexOf('reading-visual') > life.indexOf('In the lesson'), 'the picture comes after the sentence');
  assert.match(html.slice(html.indexOf('id="read-adds"')), /Choir led Sam to the guitar/);
});
