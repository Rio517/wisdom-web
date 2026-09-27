import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifeTree, LIFE_END, LIFE_START } from '../src/lessons/choices/journey-explore.js';
import { CHOICE_BANDS, labelsForFork, bandFor } from '../src/lessons/choices/journey-choices.js';

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
  assert.ok(labels.every(label => bandFor(12).choices.includes(label)));
  assert.ok(CHOICE_BANDS.every(band => band.choices.length >= 8));
});

test('map stories: twenty complete sets, each internally distinct', async () => {
  const { MAP_STORIES } = await import('../src/lessons/choices/journey-choices.js');
  assert.ok(MAP_STORIES.length >= 20);
  for (const story of MAP_STORIES) {
    assert.equal(story.taken.length, 2);
    assert.equal(story.untaken.length, 3);
    assert.equal(story.build.length, 3);
    assert.equal(story.fresh.length, 3);
    const all = [...story.taken, ...story.untaken, ...story.build, ...story.fresh];
    assert.equal(new Set(all).size, all.length, all.join(', '));
  }
});
