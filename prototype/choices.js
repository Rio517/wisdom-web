import { createChoicesMap } from './choices-map.js';
import { renderMapChoiceList, renderTrailDiagram } from './choices-markup.js';
import { ALFREDO_SCENES, CHOICES_DEEP_DIVES, CORE_SCENES, createLessonState } from './choices-story.js';

const allScenes = [...CORE_SCENES, ...ALFREDO_SCENES];
const sceneByFragment = new Map(allScenes.map(scene => [scene.fragment, scene.id]));
const initialScene = sceneByFragment.get(location.hash.slice(1)) || 'possibilities';
const lesson = createLessonState({ scene: initialScene, age: 25 });

const body = document.body;
const storyView = document.querySelector('#story-view');
const explorationView = document.querySelector('#exploration-view');
const storyColumn = document.querySelector('#choices-scene');
const visualColumn = document.querySelector('.visual-column');
const visualEyebrow = document.querySelector('#visual-eyebrow');
const visualContext = document.querySelector('#visual-context');
const mapFrame = document.querySelector('#map-frame');
const trailFrame = document.querySelector('#trail-frame');
const weatherFrame = document.querySelector('#weather-frame');
const explorationMapSlot = document.querySelector('.exploration-map-slot');
const canvas = document.querySelector('#choices-canvas');
const overlay = document.querySelector('#choices-overlay');
const status = document.querySelector('#choices-status');
const mapStatus = document.querySelector('#map-status');
const mapChoiceList = document.querySelector('#map-choice-list');
const mapPreviewPanel = document.querySelector('#map-preview-panel');
const previewTitle = document.querySelector('#map-preview-title');
const previewDescription = document.querySelector('#map-preview-description');
const usePreviewButton = document.querySelector('#use-previewed-path');
const revisitButton = document.querySelector('#revisit-earlier-fork');
const mapPrevious = document.querySelector('#map-previous');
const mapNext = document.querySelector('#map-next');
const ageForm = document.querySelector('#age-form');
const ageInput = document.querySelector('#example-age');
const readingDialog = document.querySelector('#reading-dialog');
const canvasFallback = document.querySelector('#canvas-fallback');
const mapHome = document.createComment('choices-map-home');
mapFrame.before(mapHome);

let previewedChoice = null;
let choicesSignature = '';
let deepDiveTrigger = null;
let storyTextHidden = false;
let mapState = { choices: [], preview: null, canPrevious: false, canNext: false, status: '' };

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function miniatureLifeMap(caption) {
  return `<div class="life-thumbnail" aria-label="${escapeHTML(caption)}">
    <svg viewBox="0 0 260 80" role="img" aria-label="A small life map with many branching paths">
      <g fill="none" stroke-linecap="round" stroke-width="2">
        <path d="M5 43 C38 43 48 24 76 28 S109 56 139 48 S171 13 255 18" stroke="#285442"/>
        <path d="M39 40 C62 54 78 67 118 65 S166 48 255 61" stroke="#c5cec8"/>
        <path d="M77 28 C111 9 145 8 184 30 S223 42 255 34" stroke="#8daa91"/>
        <path d="M116 50 C150 72 201 74 255 69" stroke="#c5cec8"/>
      </g>
    </svg>
    <span>${escapeHTML(caption)}<small>Part of the larger life map</small></span>
  </div>`;
}

function renderSceneCopy(scene, state) {
  const isExample = state.track === 'example';
  const deepDive = isExample && state.deepDive ? CHOICES_DEEP_DIVES[state.deepDive] : null;
  const deepDiveButton = isExample && scene.id === 'later'
    ? `<button class="text-button deep-dive-trigger" type="button" data-deep-dive="learning">${escapeHTML(CHOICES_DEEP_DIVES.learning.heading)}</button>`
    : isExample && scene.id === 'world'
      ? `<button class="text-button deep-dive-trigger" type="button" data-deep-dive="changing">${escapeHTML(CHOICES_DEEP_DIVES.changing.heading)}</button>`
      : '';
  const completion = state.completed
    ? `<p class="completion-state" id="lesson-complete" tabindex="-1"><strong>${isExample ? 'Example complete.' : 'Lesson complete.'}</strong> ${isExample ? 'Return to the main lesson whenever you’re ready.' : 'You can revisit any part or open the optional example.'}</p>`
    : '';
  const dive = deepDive ? `<aside class="deep-dive-panel" aria-labelledby="deep-dive-title">
    <h2 id="deep-dive-title" tabindex="-1">${escapeHTML(deepDive.heading)}</h2>
    <p>${escapeHTML(deepDive.paragraph)}</p>
    <button class="text-button" type="button" data-close-deep-dive>${escapeHTML(deepDive.returnLabel)}</button>
  </aside>` : deepDiveButton;
  const exampleAction = !isExample && scene.id === 'control'
    ? '<button class="text-button example-entry" id="open-hike-example" type="button">See an example: Alfredo’s hikes</button>'
    : '';

  storyColumn.innerHTML = `<div class="story-toolbar">
    <button class="story-text-toggle" id="toggle-story-text" type="button" aria-controls="scene-copy" aria-expanded="${!storyTextHidden}">${storyTextHidden ? 'Show text' : 'Hide text'}</button>
    ${isExample ? '<button class="text-button example-return" id="return-to-core" type="button">← Back to main lesson</button>' : ''}
  </div>
  <div class="scene-copy" id="scene-copy" ${storyTextHidden ? 'hidden' : ''}>
    ${isExample ? '<p class="scene-kicker">Example · Alfredo’s hikes</p>' : ''}
    <h1 id="choices-scene-title" tabindex="-1">${escapeHTML(scene.heading)}</h1>
    ${scene.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}
    ${dive}${completion}
    <div class="story-actions">
      ${exampleAction}
      <button class="text-button" id="explore-map" type="button">Explore map</button>
    </div>
  </div>
  <nav class="scene-navigation" aria-label="${isExample ? 'Example scenes' : 'Main lesson scenes'}">
    <button class="text-button" id="lesson-back" type="button" ${state.canPreviousScene ? '' : 'disabled'}>← ${escapeHTML(scene.backLabel)}</button>
    <button class="primary-button" id="lesson-next" type="button" ${state.completed ? 'disabled' : ''}>${state.completed ? (isExample ? 'Example complete' : 'Lesson complete') : `${escapeHTML(scene.nextLabel)} →`}</button>
  </nav>`;
}

function placeMapInStory() {
  if (mapFrame.parentElement !== visualColumn) mapHome.after(mapFrame);
}

function renderVisual(scene, state) {
  placeMapInStory();
  storyView.dataset.track = state.track;
  storyView.dataset.scene = scene.id;
  visualColumn.className = `visual-column scene-enter scene-${scene.id} track-${state.track}`;
  const guidedDiagram = innerWidth > 900 && innerWidth <= 1200 ? 'wide-gutter' : innerWidth > 900;
  visualEyebrow.textContent = scene.eyebrow;
  trailFrame.hidden = true;
  weatherFrame.hidden = true;
  mapFrame.hidden = true;

  if (state.track === 'core' || scene.id === 'example') {
    visualContext.textContent = '';
    mapFrame.hidden = false;
    document.querySelector('#map-caption').textContent = 'Many possible paths—an illustration, not a prediction or score. Height has no meaning.';
    map.showOverview();
    return;
  }

  if (scene.id === 'steps') {
    visualContext.textContent = '';
    trailFrame.hidden = false;
    trailFrame.innerHTML = renderTrailDiagram({ variant: 'first', idPrefix: 'guided-first', guided: guidedDiagram });
    return;
  }

  if (scene.id === 'later') {
    visualContext.textContent = '';
    trailFrame.hidden = false;
    trailFrame.innerHTML = renderTrailDiagram({ variant: 'later', idPrefix: 'guided-later', guided: guidedDiagram });
    return;
  }

  visualContext.textContent = '';
  trailFrame.hidden = false;
  trailFrame.innerHTML = `${renderTrailDiagram({ variant: 'rain', idPrefix: 'guided-rain', guided: guidedDiagram })}
    ${miniatureLifeMap('The larger life map still holds many paths')}`;
}

function updateTopicNavigation(scene) {
  document.querySelectorAll('[data-topic-scene]').forEach(link => {
    if (link.dataset.topicScene === scene.id) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}

function setFragment(scene, historyMode = 'push') {
  const url = `#${scene.fragment}`;
  if (location.hash === url) return;
  history[historyMode === 'replace' ? 'replaceState' : 'pushState'](null, '', url);
}

function renderStory({ focus = false, historyMode = null, focusDeepDive = false } = {}) {
  const state = lesson.getState();
  const scenes = state.track === 'example' ? ALFREDO_SCENES : CORE_SCENES;
  const scene = scenes[state.sceneIndex];
  renderSceneCopy(scene, state);
  renderVisual(scene, state);
  updateTopicNavigation(scene);
  if (historyMode) setFragment(scene, historyMode);
  status.textContent = `${state.track === 'example' ? 'Example' : 'Main lesson'} scene ${state.sceneIndex + 1} of ${scenes.length}: ${scene.heading}`;
  if (focusDeepDive) document.querySelector('#deep-dive-title')?.focus();
  else if (focus) document.querySelector(storyTextHidden ? '#toggle-story-text' : '#choices-scene-title')?.focus();
}

function choiceSignature(choices) {
  return choices.map(choice => [
    choice.id, choice.label, choice.description, Boolean(choice.selected),
    choice.available !== false, choice.revisitPointId || '',
  ].join('|')).join('::');
}

function renderChoiceList(choices) {
  const signature = choiceSignature(choices);
  if (signature === choicesSignature) {
    mapChoiceList.querySelectorAll('[data-map-choice]').forEach(button => {
      button.dataset.previewed = String(button.dataset.mapChoice === mapState.preview?.id);
    });
    return;
  }
  choicesSignature = signature;
  mapChoiceList.innerHTML = renderMapChoiceList(choices, mapState.preview?.id);
}

function updateMapUI(nextState) {
  mapState = nextState;
  mapPrevious.disabled = !nextState.canPrevious;
  mapNext.disabled = !nextState.canNext;
  mapStatus.textContent = nextState.status || '';
  renderChoiceList(nextState.choices || []);
  previewedChoice = nextState.preview || null;
  if (!previewedChoice) {
    mapPreviewPanel.hidden = true;
    return;
  }
  mapPreviewPanel.hidden = false;
  previewTitle.textContent = previewedChoice.label;
  previewDescription.textContent = previewedChoice.description;
  usePreviewButton.hidden = previewedChoice.available === false;
  revisitButton.hidden = !previewedChoice.revisitPointId;
  revisitButton.dataset.pointId = previewedChoice.revisitPointId || '';
}

const map = createChoicesMap({ canvas, overlay, onChange: updateMapUI });

function enterExploration() {
  lesson.enterExploration();
  storyView.hidden = true;
  explorationView.hidden = false;
  body.classList.add('exploring');
  explorationMapSlot.append(mapFrame);
  mapFrame.hidden = false;
  const state = lesson.getState();
  ageInput.value = state.ageDraft;
  updateMapUI(map.explore(state.age));
  document.querySelector('#map-caption').textContent = 'Explore connected fictional paths. Blue previews do not change the selected route.';
  document.querySelector('#exploration-title').focus();
}

function resumeStory() {
  lesson.resumeStory();
  explorationView.hidden = true;
  storyView.hidden = false;
  body.classList.remove('exploring');
  renderStory();
  document.querySelector(storyTextHidden ? '#toggle-story-text' : '#choices-scene-title').focus();
}

function goToScene(id, { focus = true, historyMode = 'push' } = {}) {
  lesson.goToScene(id);
  explorationView.hidden = true;
  storyView.hidden = false;
  body.classList.remove('exploring');
  renderStory({ focus, historyMode });
}

storyColumn.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.id === 'lesson-back') {
    lesson.previousScene();
    renderStory({ focus: true, historyMode: 'push' });
  } else if (target.id === 'lesson-next') {
    const before = lesson.getState();
    if (!before.canNextScene) {
      lesson.finishLesson();
      renderStory();
      status.textContent = before.track === 'example' ? 'Example complete.' : 'Lesson complete.';
      document.querySelector(storyTextHidden ? '#toggle-story-text' : '#lesson-complete')?.focus();
    } else {
      lesson.nextScene();
      renderStory({ focus: true, historyMode: 'push' });
    }
  } else if (target.id === 'open-hike-example') {
    lesson.enterExample();
    renderStory({ focus: true, historyMode: 'push' });
  } else if (target.id === 'return-to-core') {
    lesson.returnToCore();
    renderStory({ focus: true, historyMode: 'push' });
  } else if (target.id === 'explore-map') {
    enterExploration();
  } else if (target.id === 'toggle-story-text') {
    storyTextHidden = !storyTextHidden;
    document.querySelector('#scene-copy').hidden = storyTextHidden;
    target.textContent = storyTextHidden ? 'Show text' : 'Hide text';
    target.setAttribute('aria-expanded', String(!storyTextHidden));
  } else if (target.dataset.deepDive) {
    deepDiveTrigger = target.dataset.deepDive;
    lesson.openDeepDive(deepDiveTrigger);
    renderStory({ focusDeepDive: true });
  } else if (target.hasAttribute('data-close-deep-dive')) {
    const returnTo = deepDiveTrigger;
    lesson.closeDeepDive();
    renderStory();
    document.querySelector(`[data-deep-dive="${returnTo}"]`)?.focus();
    deepDiveTrigger = null;
  }
});

document.querySelectorAll('[data-topic-scene]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    setIndex(false);
    goToScene(link.dataset.topicScene);
  });
});

window.addEventListener('hashchange', () => {
  const id = sceneByFragment.get(location.hash.slice(1));
  if (id) goToScene(id, { historyMode: null });
});

document.querySelector('#resume-story').addEventListener('click', resumeStory);
document.querySelector('#map-previous').addEventListener('click', () => map.previous());
document.querySelector('#map-next').addEventListener('click', () => map.next());

ageInput.addEventListener('input', () => lesson.setAgeDraft(ageInput.value));
ageForm.addEventListener('submit', event => {
  event.preventDefault();
  lesson.setAgeDraft(ageInput.value);
  if (!ageInput.reportValidity() || !lesson.confirmAge()) return;
  const state = lesson.getState();
  ageInput.value = state.ageDraft;
  updateMapUI(map.explore(state.age));
  mapStatus.textContent = `Showing a fictional map at age ${state.age}.`;
});

mapChoiceList.addEventListener('pointerover', event => {
  const button = event.target.closest('[data-map-choice]');
  if (button) map.preview(button.dataset.mapChoice);
});
mapChoiceList.addEventListener('pointerout', event => {
  const button = event.target.closest('[data-map-choice]');
  if (button && document.activeElement !== button && !button.contains(event.relatedTarget)) map.preview(null);
});
mapChoiceList.addEventListener('focusin', event => {
  const button = event.target.closest('[data-map-choice]');
  if (button) map.preview(button.dataset.mapChoice);
});
mapChoiceList.addEventListener('click', event => {
  const button = event.target.closest('[data-map-choice]');
  if (button) map.preview(button.dataset.mapChoice);
});

function focusAfterMapChange() {
  const nextChoice = mapChoiceList.querySelector('[data-map-choice]');
  if (nextChoice) nextChoice.focus();
  else if (!mapNext.disabled) mapNext.focus();
  else mapPrevious.focus();
}

usePreviewButton.addEventListener('click', () => {
  if (previewedChoice?.available !== false && map.choose(previewedChoice?.id)) focusAfterMapChange();
});
revisitButton.addEventListener('click', () => {
  if (revisitButton.dataset.pointId && map.revisit(revisitButton.dataset.pointId)) focusAfterMapChange();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && lesson.getState().mode === 'explore' && !document.querySelector('dialog[open]')) {
    map.preview(null);
  }
});

function openDialog(dialog, trigger) {
  dialog.dataset.returnFocus = trigger.id || '';
  dialog.showModal();
}

document.querySelector('#read-whole-lesson').addEventListener('click', event => openDialog(readingDialog, event.currentTarget));
document.querySelectorAll('[data-dialog="about"]').forEach(button => {
  button.addEventListener('click', () => openDialog(document.querySelector('#about-dialog'), button));
});
document.querySelectorAll('dialog [data-close]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (dialog.dataset.returnFocus) document.querySelector(`#${dialog.dataset.returnFocus}`)?.focus();
  });
});

const openIndex = document.querySelector('#open-index');
const closeIndex = document.querySelector('#close-index');
const indexBackdrop = document.querySelector('#index-backdrop');
function setIndex(open, focus = false) {
  body.classList.toggle('index-closed', !open);
  openIndex.hidden = open;
  openIndex.setAttribute('aria-expanded', String(open));
  indexBackdrop.hidden = !open;
  if (focus) (open ? closeIndex : openIndex).focus();
}
closeIndex.addEventListener('click', () => setIndex(false, true));
openIndex.addEventListener('click', () => setIndex(true, true));
indexBackdrop.addEventListener('click', () => setIndex(false, true));
setIndex(false);

renderStory({ historyMode: location.hash ? null : 'replace' });

if (canvas.dataset.failed === 'true') {
  storyView.hidden = true;
  explorationView.hidden = true;
  canvasFallback.hidden = false;
  document.querySelector('#read-whole-lesson').hidden = true;
  const continuousReading = readingDialog.querySelector('.choices-reading');
  if (continuousReading) canvasFallback.append(continuousReading);
}

window.addEventListener('pagehide', () => map.destroy(), { once: true });
