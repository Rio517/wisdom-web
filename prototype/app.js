import { readState, stateURL, transition } from './model.js';
import { createMapView } from './map-view.js';
import { renderDecision } from './decision-view.js';
import { MOMENTS } from './story.js';

const $ = selector => document.querySelector(selector);
let state = readState(location.href);
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionControl = $('#reduce-motion');
let manualLessMotion = false;
let lastDialogTrigger = null;

motionControl.checked = systemMotion.matches;
motionControl.disabled = systemMotion.matches;
motionControl.title = systemMotion.matches ? 'Enabled by your system preference' : '';

const map = createMapView({
  canvas: $('#life-map'),
  overlay: $('#map-overlay'),
  lessMotion: () => manualLessMotion || systemMotion.matches,
  onPreview(age) {
    $('#map-preview').textContent = age === null
      ? 'Move over the traveled route to preview an earlier moment.'
      : `Age ${age}: ${MOMENTS.find(moment => moment.age === age)?.title ?? ''}`;
  },
  onInspect(age) {
    if (!state.selected) navigate({ age, selected: true }, true);
    else if (age === 12 && (state.age >= 12 || state.age === 8)) navigate({ inspect: 12 }, true);
    else if (age <= state.age) reviewMoment(age);
    else $('#map-preview').textContent = `Age ${age} is ahead of today. Use the example-age control to change the starting age.`;
  },
});

function renderEarlierMoments() {
  const list = $('#moment-list');
  const available = MOMENTS.filter(moment => moment.age <= state.age);
  list.replaceChildren(...available.map(moment => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.reviewAge = moment.age;
    button.textContent = `Age ${moment.age}: ${moment.title}`;
    return button;
  }));
}

function setIndex(open, returnFocus = false) {
  $('#site-index').hidden = !open;
  $('#open-index').hidden = open;
  $('#open-index').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('index-closed', !open);
  const overlay = open && matchMedia('(max-width: 900px)').matches;
  $('#main').inert = overlay;
  if (overlay) {
    $('#site-index').setAttribute('role', 'dialog');
    $('#site-index').setAttribute('aria-modal', 'true');
  } else {
    $('#site-index').removeAttribute('role');
    $('#site-index').removeAttribute('aria-modal');
  }
  if (returnFocus) $(open ? '#close-index' : '#open-index').focus();
}

function render(animate = false, focusHeading = false) {
  if (focusHeading) {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    if ($('#main').inert) setIndex(false);
  }
  const opening = state.scene === 'possibilities';
  $('#possibilities-scene').hidden = !opening;
  $('#learning-scene').hidden = opening;
  $('#example-age').value = state.age;
  const context = MOMENTS.find(moment => moment.age === (state.inspect ?? state.age));
  $('#moment-copy').textContent = `Age ${context.age}: ${context.summary}`;
  $('#earlier-title').textContent = state.age === 8 ? 'The starting moment' : 'Earlier decisions';
  $('#earlier-description').textContent = state.age === 8
    ? 'Age 12 is a separate looking-ahead example below.'
    : 'Map targets and these controls describe the same fictional example. Choosing one keeps today unchanged.';
  renderEarlierMoments();
  $('#past-label').textContent = state.selected ? 'The path to today' : 'A beginning';
  $('#map-instruction').textContent = state.inspect === 12
    ? 'Compare one age-12 choice while keeping today in view.'
    : state.selected ? 'Today is one example moment. Earlier points remain revisitable.' : 'Choose an example age to see a route to today.';
  $('#overview').hidden = !state.selected;
  $('#overview').textContent = state.overview ? 'Focus on today' : 'See the whole map';
  $('#return-today').hidden = state.inspect === null;
  $('#replay').hidden = !state.selected;
  for (const link of document.querySelectorAll('.scene-links [data-scene]')) {
    link.toggleAttribute('aria-current', link.dataset.scene === state.scene);
    link.href = stateURL({ ...state, scene: link.dataset.scene }, location.href);
  }
  renderDecision(state);
  if (opening) map.show(state, animate);
  else map.cancel();
  document.title = `${opening ? 'Many possible paths' : 'Learning builds on learning'} · Wisdom`;
  if (focusHeading) {
    $(`#${opening ? 'opening' : 'learning'}-title`).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function navigate(change, animate = false) {
  const changedScene = change.scene && change.scene !== state.scene;
  const focusedAge = document.activeElement?.dataset.age;
  state = transition(state, change);
  const url = stateURL(state, location.href);
  if (url.href !== location.href) history.pushState(null, '', url);
  render(animate, changedScene);
  if (focusedAge && !changedScene) requestAnimationFrame(() => $(`.map-target[data-age="${focusedAge}"]`)?.focus({ preventScroll: true }));
  if (state.selected && !changedScene) $('#status').textContent = state.inspect === 12
    ? `Age 12 is open for comparison. Today remains age ${state.age}.`
    : `Example age ${state.age} selected. The dark route is traveled, dashed gray routes were not taken, and gray-green routes remain possible.`;
}

function reviewMoment(age) {
  if (age === state.age) navigate({ inspect: null });
  else navigate({ inspect: age });
}

$('#explore').addEventListener('click', () => navigate({ age: Number($('#example-age').value), selected: true }, true));
$('#example-age').addEventListener('change', event => navigate({ age: Number(event.target.value), selected: state.selected }, state.selected));
$('#overview').addEventListener('click', () => navigate({ overview: !state.overview }));
$('#return-today').addEventListener('click', () => navigate({ inspect: null }));
$('#replay').addEventListener('click', () => map.show(state, true));
$('#comparison-entry').addEventListener('click', () => navigate({ inspect: 12 }, true));
$('#moment-list').addEventListener('click', event => {
  const button = event.target.closest('[data-review-age]');
  if (!button) return;
  const age = Number(button.dataset.reviewAge);
  if (!state.selected) navigate({ age, selected: true }, true);
  else if (age === 12 && (state.age >= 12 || state.age === 8)) navigate({ inspect: 12 }, true);
  else reviewMoment(age);
});
document.querySelectorAll('[data-comparison]').forEach(button => button.addEventListener('click', () => navigate({ comparison: button.dataset.comparison }, true)));
document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
  const layers = state.layers.includes(button.dataset.layer)
    ? state.layers.filter(layer => layer !== button.dataset.layer)
    : [...state.layers, button.dataset.layer];
  navigate({ layers });
}));

motionControl.addEventListener('change', () => {
  manualLessMotion = motionControl.checked;
  map.show(state, false);
});
systemMotion.addEventListener('change', () => {
  motionControl.checked = manualLessMotion || systemMotion.matches;
  motionControl.disabled = systemMotion.matches;
  motionControl.title = systemMotion.matches ? 'Enabled by your system preference' : '';
  if (state.scene === 'possibilities') map.show(state, false);
});
document.querySelectorAll('[data-scene]').forEach(control => control.addEventListener('click', event => {
  event.preventDefault();
  navigate({ scene: control.dataset.scene });
}));
$('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); });
window.addEventListener('popstate', () => { state = readState(location.href); render(false, true); });
window.addEventListener('hashchange', () => {
  const restored = readState(location.href);
  if (restored.scene !== state.scene) { state = restored; render(false, true); }
});

$('#close-index').addEventListener('click', () => setIndex(false, true));
$('#open-index').addEventListener('click', () => setIndex(true, true));
$('#site-index').addEventListener('keydown', event => {
  if (event.key === 'Escape') setIndex(false, true);
  if (event.key !== 'Tab' || !$('#main').inert || document.querySelector('dialog[open]')) return;
  const controls = [...$('#site-index').querySelectorAll('a, button, summary')].filter(node => node.checkVisibility());
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
matchMedia('(max-width: 900px)').addEventListener('change', event => setIndex(!event.matches));

document.querySelectorAll('[data-dialog]').forEach(control => control.addEventListener('click', () => {
  lastDialogTrigger = control;
  $(`#${control.dataset.dialog}-dialog`).showModal();
}));
document.querySelectorAll('[data-close]').forEach(control => control.addEventListener('click', () => control.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => lastDialogTrigger?.focus({ preventScroll: true }));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

setIndex(!matchMedia('(max-width: 900px)').matches);
history.replaceState(null, '', stateURL(state, location.href));
if (map.failed) {
  $('#life-map').hidden = true;
  $('#map-overlay').hidden = true;
  $('#canvas-fallback').hidden = false;
  $('#map-preview').textContent = 'The map could not start. The complete reading explanation is available here.';
}
render();
