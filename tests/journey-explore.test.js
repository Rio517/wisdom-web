import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifeTree, LIFE_END, LIFE_START } from '../src/lessons/choices/journey-explore.js';
import { CHOICE_BANDS, labelsForFork, bandFor, bandChoices, mapStory, STORY_COUNT, STORY_SHAPE } from '../src/lessons/choices/journey-choices.js';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES } from '../src/i18n/config.js';

function walk(tree, pick = () => 0) {
  const path = [tree.get('r')];
  for (let guard = 0; guard < 60; guard += 1) {
    const options = tree.children(path.at(-1).id).filter(option => !option.closed);
    if (!options.length) break;
    tree.fix(options[0].id);
    const next = options[pick(options.length, guard) % options.length];
    tree.fix(next.id);
    path.push(next);
    tree.layoutAhead(next.id);
  }
  return path;
}

test('the same seed grows the same tree; another seed differs', () => {
  const a = walk(createLifeTree({ seed: 's1' })).map(node => `${node.age}:${node.label}`);
  const b = walk(createLifeTree({ seed: 's1' })).map(node => `${node.age}:${node.label}`);
  const c = walk(createLifeTree({ seed: 's2' })).map(node => `${node.age}:${node.label}`);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('a life runs forward from age three to seventy with a sensible number of choices', () => {
  for (const seed of ['a', 'b', 'c', 'd']) {
    const path = walk(createLifeTree({ seed }), (count, step) => step);
    assert.equal(path[0].age, LIFE_START);
    assert.equal(path.at(-1).age, LIFE_END);
    for (let i = 1; i < path.length; i += 1) assert.ok(path[i].age > path[i - 1].age);
    assert.ok(path.length >= 10 && path.length <= 20, `${path.length} steps`);
  }
});

test('forks are not lined up: sibling options fork again at different ages', () => {
  const tree = createLifeTree({ seed: 'columns' });
  const ages = new Set(tree.children('r').map(option => option.age));
  assert.ok(ages.size > 1);
});

test('siblings have distinct labels and a life does not repeat a choice', () => {
  const tree = createLifeTree({ seed: 'labels' });
  const path = walk(tree, (count, step) => step * 7);
  const labels = path.slice(1).map(node => node.label);
  assert.equal(new Set(labels).size, labels.length);
  for (const node of path.slice(0, -1)) {
    const options = tree.children(node.id).map(option => option.label);
    assert.equal(new Set(options).size, options.length);
  }
});

test('closed options have a reason, appear only from age seven and never close every way', () => {
  let closed = 0;
  for (const seed of ['x', 'y', 'z', 'w', 'v']) {
    const tree = createLifeTree({ seed });
    for (const node of walk(tree, (count, step) => step).slice(0, -1)) {
      const options = tree.children(node.id);
      const shut = options.filter(option => option.closed);
      assert.ok(shut.length < options.length);
      for (const option of shut) {
        closed += 1;
        assert.ok(node.age >= 7);
        assert.ok(option.reason);
      }
    }
  }
  assert.ok(closed > 0, 'circumstances appear somewhere');
});

test('options ahead are laid out in order without crossing and stay on the map', () => {
  const tree = createLifeTree({ seed: 'layout' });
  const check = id => {
    const options = tree.children(id);
    const heights = options.map(option => option.y ?? option.ay);
    for (let i = 1; i < heights.length; i += 1) assert.ok(heights[i] > heights[i - 1]);
    for (const value of heights) assert.ok(value > 0 && value < 1);
  };
  check('r');
  for (const node of walk(tree, (count, step) => step).slice(0, -1)) check(node.id);
});

test('labels come from the right age band, with family choices only for young children', () => {
  assert.equal(bandFor(4).by, 'family');
  assert.equal(bandFor(12).by, undefined);
  const { labels } = labelsForFork(12, 'k', 3);
  assert.ok(labels.every(label => bandChoices(bandFor(12)).includes(label)));
  assert.ok(CHOICE_BANDS.every(band => band.items.length >= 8));
});

test('forks draw the same choices in every language, only the words differ', () => {
  const english = labelsForFork(30, 'fork', 3, [], getTranslator('en')).labels;
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    for (const each of CHOICE_BANDS) assert.equal(new Set(bandChoices(each, t)).size, each.items.length, `${locale} ${each.id} labels are distinct`);
    const labels = labelsForFork(30, 'fork', 3, [], t).labels;
    const band = bandFor(30);
    const index = label => bandChoices(band, t).indexOf(label);
    assert.deepEqual(labels.map(index), english.map(label => bandChoices(band).indexOf(label)), locale);
  }
});

test('map stories: twenty complete sets, each internally distinct in every language', () => {
  assert.ok(STORY_COUNT >= 20);
  for (const locale of LOCALES) {
    const t = getTranslator(locale);
    for (let index = 0; index < STORY_COUNT; index += 1) {
      const story = mapStory(index, t);
      for (const [part, count] of Object.entries(STORY_SHAPE)) assert.equal(story[part].length, count);
      const all = Object.values(story).flat();
      assert.equal(new Set(all).size, all.length, `${locale}: ${all.join(', ')}`);
      assert.ok(all.every(label => !label.startsWith('map.story')), `${locale} story ${index + 1} is complete`);
    }
  }
});
