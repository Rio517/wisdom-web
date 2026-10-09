import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, FRAGMENT_ALIASES, LEARNED, beatList, renderJourneyReading } from '../src/lessons/choices/journey-story.js';
import { t as runtimeT } from '../src/i18n/runtime.js';

test('the journey keeps the approved order: big picture, hike, compounding, explore, takeaways', () => {
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['paths', 'hike', 'skills', 'explore', 'wrap']);
});

test('every beat has a stable unique fragment, a heading, text and a picture description', () => {
  const beats = beatList();
  const fragments = beats.map(item => item.fragment);
  assert.equal(new Set(fragments).size, fragments.length);
  for (const { beat } of beats) {
    assert.ok(beat.heading && beat.body.length, beat.id);
    assert.ok(beat.alt, `${beat.id} describes its picture`);
  }
});

test('Maya takes three beats; basketball is an optional closer with its own picture', () => {
  const skills = CHAPTERS.find(chapter => chapter.id === 'skills');
  assert.deepEqual(skills.beats.map(beat => beat.id), ['fork', 'builds', 'never-late']);
  const builds = skills.beats[1];
  assert.ok(builds.scrub, 'learning builds keeps its scrub');
  assert.equal(builds.closer.body.length, 2);
  assert.ok(builds.closer.alt, 'the closer describes its picture');
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
  assert.match(text, /doesn’t guarantee/);
});

test('the static reading renders every heading and escapes content', () => {
  const html = renderJourneyReading({ t: (key, values) => (key === 'lesson.beat.fork.heading' ? 'A <b> test' : runtimeT(key, values)) });
  for (const { beat } of beatList()) if (beat.id !== 'fork') assert.ok(html.includes(beat.heading.replaceAll('&', '&amp;')), beat.heading);
  assert.match(html, /A &lt;b&gt; test/);
  assert.match(html, /what they chose/);
});

test('Lesson 1 no longer has the ten-afternoon game, in the journey or its text version', () => {
  assert.ok(!beatList().some(item => item.beat.game || item.chapter.id === 'play'));
  assert.doesNotMatch(renderJourneyReading(), /afternoon/i);
});
