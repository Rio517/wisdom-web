import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, LEARNED, beatList, renderJourneyReading } from '../src/lessons/choices/journey-story.js';

test('the journey keeps the approved order: big picture, hike, compounding, game, explore, takeaways', () => {
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['paths', 'hike', 'skills', 'play', 'explore', 'wrap']);
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
  const html = renderJourneyReading({ gameDays: [{ label: 'Monday', situation: 'A <b> test', options: [{ label: 'Rest' }] }] });
  for (const { beat } of beatList()) assert.ok(html.includes(beat.heading.replaceAll('&', '&amp;')), beat.heading);
  assert.match(html, /A &lt;b&gt; test/);
  assert.match(html, /what they chose/);
});
