import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALFREDO_SCENES,
  CHOICES_DEEP_DIVES,
  CORE_SCENES,
  createLessonState,
} from '../prototype/choices-story.js';
import {
  renderChoicesReading,
  renderMapChoiceList,
  renderTrailDiagram,
} from '../prototype/choices-markup.js';

test('the three-scene core lesson finishes without entering the optional example', () => {
  const lesson = createLessonState();

  assert.deepEqual(
    CORE_SCENES.map(scene => [scene.id, scene.fragment]),
    [
      ['possibilities', 'more-than-one-path'],
      ['accumulation', 'small-choices-add-up'],
      ['control', 'not-everything-is-yours-to-choose'],
    ],
  );
  assert.equal(lesson.getState().track, 'core');
  assert.equal(lesson.getState().scene, 'possibilities');
  assert.equal(lesson.previousScene().scene, 'possibilities');
  assert.equal(lesson.nextScene().scene, 'accumulation');
  assert.equal(lesson.nextScene().scene, 'control');
  assert.equal(lesson.nextScene().scene, 'control');
  const finished = lesson.finishLesson();
  assert.equal(finished.scene, 'control');
  assert.equal(finished.track, 'core');
  assert.equal(finished.completed, true);
  assert.equal(finished.exampleCompleted, false);
});

test('the optional Alfredo example returns to the completed core scene', () => {
  const lesson = createLessonState({ scene: 'control' });
  lesson.finishLesson();

  const example = lesson.enterExample();
  assert.equal(example.track, 'example');
  assert.equal(example.scene, 'example');
  assert.equal(example.completed, false);
  assert.equal(lesson.nextScene().scene, 'steps');
  const returned = lesson.returnToCore();
  assert.equal(returned.track, 'core');
  assert.equal(returned.scene, 'control');
  assert.equal(returned.completed, true);
});

test('exploration pauses and resumes the exact core or example scene', () => {
  const lesson = createLessonState({ scene: 'control' });
  lesson.enterExample();
  lesson.nextScene();
  lesson.enterExploration();

  assert.equal(lesson.getState().mode, 'explore');
  assert.equal(lesson.getState().track, 'example');
  assert.equal(lesson.getState().scene, 'steps');
  const state = lesson.resumeStory();

  assert.equal(state.track, 'example');
  assert.equal(state.scene, 'steps');
  assert.equal(state.mode, 'story');
});

test('direct navigation supports stable core and existing hike fragments', () => {
  assert.deepEqual(
    ALFREDO_SCENES.map(scene => [scene.id, scene.fragment]),
    [
      ['example', 'alfredo-hikes'],
      ['steps', 'small-actions-add-up'],
      ['later', 'what-happened-before'],
      ['world', 'plans-meet-world'],
    ],
  );
  const lesson = createLessonState({ scene: 'accumulation' });

  lesson.enterExploration();
  const state = lesson.goToScene('world');

  assert.equal(state.mode, 'story');
  assert.equal(state.track, 'example');
  assert.equal(state.scene, 'world');
  assert.equal(lesson.returnToCore().scene, 'accumulation');
});

test('editing example age does not confirm or regenerate it', () => {
  const lesson = createLessonState({ age: 25 });

  lesson.setAgeDraft('41');
  assert.equal(lesson.getState().age, 25);
  assert.equal(lesson.getState().ageDraft, '41');
  assert.equal(lesson.confirmAge(), true);
  assert.equal(lesson.getState().age, 41);

  lesson.setAgeDraft('71');
  assert.equal(lesson.confirmAge(), false);
  assert.equal(lesson.getState().age, 41);
});

test('static reading renders the exact authored paragraphs and meaningful trail labels', () => {
  const html = renderChoicesReading();

  assert.match(html, /^<article[ >]/);
  for (const scene of [...CORE_SCENES, ...ALFREDO_SCENES]) {
    assert.ok(html.includes(scene.heading));
    for (const paragraph of scene.paragraphs) assert.ok(html.includes(paragraph));
  }
  assert.match(html, /<details class="reading-example"/);
  assert.match(html, /<summary>Example: Alfredo’s hikes<\/summary>/);
  assert.ok(html.indexOf(CORE_SCENES.at(-1).heading) < html.indexOf('Example: Alfredo’s hikes'),
    'the complete core lesson must precede the optional example');
  for (const deepDive of Object.values(CHOICES_DEEP_DIVES)) {
    assert.ok(html.includes(deepDive.heading));
    assert.ok(html.includes(deepDive.paragraph));
  }
  for (const label of [
    'Start', 'Bridge', 'Stream bend', 'Lake', 'Trail closed', 'Ranger',
    'Turn back', 'water',
  ]) assert.ok(html.includes(label), `missing static label: ${label}`);
  assert.match(html, /research on prior knowledge/i);
  assert.match(html, /research on circumstances and support/i);
});

test('separate static readings keep every heading and diagram reference unique', () => {
  const dialog = renderChoicesReading({ idPrefix: 'dialog' });
  const fallback = renderChoicesReading({ idPrefix: 'fallback' });
  const combined = `${dialog}${fallback}`;
  const ids = [...combined.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const references = [...combined.matchAll(/(?:aria-labelledby|aria-describedby)="([^"]+)"/g)]
    .flatMap(match => match[1].split(/\s+/));

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(references.every(reference => ids.includes(reference)),
    'every static reading reference should resolve inside its own instance');
  assert.ok(ids.includes('dialog-reading-title'));
  assert.ok(ids.includes('fallback-rain-title'));
});

test('static reading draws the seeded life map and labels every exploration state', () => {
  const html = renderChoicesReading({ idPrefix: 'static' });

  assert.match(html, /<svg[^>]+class="static-life-map"/);
  for (const state of ['selected', 'reachable', 'untaken', 'preview']) {
    assert.match(html, new RegExp(`data-map-state="${state}"`));
  }
  for (const label of [
    'Selected path', 'Reachable from here', 'Untaken path', 'Preview only',
    'Unavailable from here', 'Revisit an earlier fork', 'Resume story · same scene',
  ]) assert.ok(html.includes(label), `missing static exploration state: ${label}`);
  assert.match(html, /clip-path="url\(#static-life-untaken-clip\)"/);
  assert.match(html, /<clipPath id="static-life-untaken-clip">/);
});

test('first-hike diagram retains settled footsteps as well as the solid route', () => {
  const html = renderTrailDiagram({ variant: 'first', idPrefix: 'steps' });

  assert.match(html, /class="trail-footsteps"/);
  assert.match(html, /class="trail-route trail-route-active"/);
});

test('preparing the retry does not depict an already completed hike', () => {
  const html = renderTrailDiagram({ variant: 'later', idPrefix: 'retry' });

  assert.match(html, /class="trail-route trail-route-muted"/);
  assert.doesNotMatch(html, /class="trail-route trail-route-active"/);
  const reachedPoints = html.match(/<g class="trail-points">([\s\S]*?)<\/g>/)?.[1] || '';
  assert.equal((reachedPoints.match(/<circle /g) || []).length, 1, 'Only the starting point has been reached');
});

test('map choice list preserves native buttons for unavailable previews', () => {
  const html = renderMapChoiceList([
    { id: 'reachable', label: 'Upper path', description: 'Connected path.', selected: false, available: true },
    { id: 'earlier', label: 'Lower path', description: 'Separated earlier.', selected: false, available: false },
  ], 'earlier');

  assert.equal((html.match(/role="listitem"/g) || []).length, 2);
  assert.equal((html.match(/<button/g) || []).length, 2);
  assert.doesNotMatch(html, /<button[^>]+role="listitem"/);
  assert.doesNotMatch(html, /aria-disabled/);
  assert.match(html, /data-map-choice="earlier"[^>]+data-available="false"/);
  assert.match(html, /data-previewed="true"/);
});
