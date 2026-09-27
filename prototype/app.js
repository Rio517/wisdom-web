import { readState, stateURL, transition } from './model.js';
import { createMapView } from './map-view.js';
import { renderDecision } from './decision-view.js';
import { MOMENTS } from './story.js';
import { readMapSettings, normalizeMapSettings, mapSettingsURL, scenarioForSettings } from './map-settings.js';

const $ = selector => document.querySelector(selector);
let state = readState(location.href);
let mapSettings = readMapSettings(location.href);
const currentURL = (nextState = state) => mapSettingsURL(mapSettings, stateURL(nextState, location.href));
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
  getScenario: () => scenarioForSettings(mapSettings),
  getPresentation: () => mapSettings,
  onPreview(age) {
    const moment = MOMENTS.find(item => item.age === age);
    $('#map-preview').textContent = age === null
      ? state.selected ? 'Move over the traveled route to preview an earlier moment.' : 'Choose an example age to follow one possible path.'
      : `Age ${age}: ${moment?.title ?? ''} — ${moment?.preview ?? ''}`;
  },
  onInspect(age) {
    if (!state.selected) navigate({ age, selected: true }, true);
    else if (state.inspect !== null && age === state.age) navigate({ inspect: null });
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
    // Native close events are deferred; navigation now owns focus restoration.
    lastDialogTrigger = null;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    if ($('#main').inert) setIndex(false);
  }
  const opening = state.scene === 'possibilities';
  $('#possibilities-scene').hidden = !opening;
  $('#learning-scene').hidden = opening;
  $('#example-age').value = state.age;
  const context = MOMENTS.find(moment => moment.age === (state.inspect ?? state.age));
  $('#moment-copy').textContent = `Age ${context.age}: ${context.summary}`;
  $('.reflection').hidden = !state.selected || state.inspect === 12;
  $('.earlier-moments').hidden = !state.selected;
  $('#map-preview').textContent = state.selected
    ? 'Move over the traveled route to preview an earlier moment.'
    : 'Choose an example age to follow one possible path.';
  $('#map-description').textContent = state.selected
    ? `A winding route from birth to an example age. ${mapSettings.variant === 'retained' ? 'Gray alternatives continue beyond today, around the green possible futures.' : mapSettings.variant === 'fading' ? 'Untaken gray branches fade after their missed fork; green reachable futures remain visible.' : 'Most untaken gray branches fade, while a few faint context paths remain around the green reachable futures.'} Height is not a measure of success.`
    : 'Many illustrated possible paths branch from birth. No route to today has been selected. Height is not a measure of success.';
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
  $('#return-today').setAttribute('aria-label', `Return to today, age ${state.age}`);
  $('#return-today').innerHTML = `<span aria-hidden="true">Return to today</span><span class="sr-only">Return to today, age ${state.age}</span>`;
  $('#replay').hidden = !state.selected;
  for (const button of document.querySelectorAll('[data-path-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.pathView === mapSettings.variant));
  }
  for (const link of document.querySelectorAll('.scene-links [data-scene]')) {
    link.toggleAttribute('aria-current', link.dataset.scene === state.scene);
    link.href = currentURL({ ...state, scene: link.dataset.scene });
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
  const focusedReviewAge = document.activeElement?.dataset.reviewAge;
  state = transition(state, change);
  const url = currentURL();
  if (url.href !== location.href) history.pushState(null, '', url);
  render(animate, changedScene);
  if (focusedAge && !changedScene) requestAnimationFrame(() => $(`.map-target[data-age="${focusedAge}"]`)?.focus({ preventScroll: true }));
  if (focusedReviewAge && !changedScene) $(`[data-review-age="${focusedReviewAge}"]`)?.focus({ preventScroll: true });
  if (state.selected && !changedScene) $('#status').textContent = state.inspect === 12
    ? `Age 12 is open for comparison. Today remains age ${state.age}.`
    : `Example age ${state.age} selected. The dark route is traveled, gray routes were not taken, and gray-green routes remain possible.`;
}

function reviewMoment(age) {
  if (age === state.age) navigate({ inspect: null });
  else navigate({ inspect: age });
}

$('#explore').addEventListener('click', () => navigate({ age: Number($('#example-age').value), selected: true }, true));
document.querySelectorAll('[data-path-view]').forEach(button => button.addEventListener('click', () => {
  mapSettings = normalizeMapSettings({ ...mapSettings, variant: button.dataset.pathView });
  const url = currentURL();
  if (url.href !== location.href) history.pushState(null, '', url);
  render();
}));
$('#example-age').addEventListener('change', event => navigate({ age: Number(event.target.value), selected: state.selected }, state.selected));
$('#overview').addEventListener('click', () => navigate({ overview: !state.overview }));
$('#return-today').addEventListener('click', () => {
  navigate({ inspect: null });
  $('#example-age').focus({ preventScroll: true });
});
$('#replay').addEventListener('click', () => map.show(state, true));
$('#comparison-entry').addEventListener('click', () => {
  navigate({ inspect: 12 }, true);
  $('#decision-heading').focus({ preventScroll: true });
  $('#decision-panel').scrollIntoView({ block: 'start', behavior: 'instant' });
});
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
window.addEventListener('popstate', () => {
  state = readState(location.href);
  mapSettings = readMapSettings(location.href);
  render(false, true);
});
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
history.replaceState(null, '', currentURL());
if (map.failed) {
  $('#life-map').hidden = true;
  $('#map-overlay').hidden = true;
  $('#canvas-fallback').hidden = false;
  $('#map-preview').textContent = 'The map could not start. The complete reading explanation is available here.';
}
render();
