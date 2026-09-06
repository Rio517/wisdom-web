import { readState, stateURL } from './model.js';
import { createMapView } from './map-view.js';

const $ = selector => document.querySelector(selector);
let state = readState(location.href);
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionControl = $('#reduce-motion');
motionControl.checked = systemMotion.matches;
motionControl.disabled = systemMotion.matches;
motionControl.title = systemMotion.matches ? 'Enabled by your system preference' : '';
const map = createMapView($('#life-map'), age => navigate({ age, selected: true }, true), () => motionControl.checked || systemMotion.matches);
const ageCopy = {
  8: 'At eight, a new interest can start with a question, a first lesson, or someone showing you how. You do not need a whole-life plan.',
  12: 'At twelve, you might return to something you enjoy or try an unfamiliar activity. A difficult first attempt does not have to be your last.',
  16: 'At sixteen, practicing a skill or exploring a course can help you discover what you want to learn next. Ask what preparation—and what help—you need.',
  25: 'At twenty-five, a skill from one setting may be useful in another. You can explore a new direction while working out its costs and requirements.',
  40: 'At forty, you bring experience to a new beginning. A change may take planning, practice, and support; the next part of life is not already written.',
  60: 'At sixty, there can still be unfamiliar things to learn and interests to return to. What is possible depends on your circumstances, not a line in this drawing.',
};

function render(animate = false, focusHeading = false) {
  const opening = state.scene === 'possibilities';
  $('#possibilities-scene').hidden = !opening;
  $('#learning-scene').hidden = opening;
  $('#example-age').value = state.age;
  $('#past-label').textContent = state.selected ? 'The path to this moment' : 'A beginning';
  $('#moment-copy').textContent = ageCopy[state.age];
  $('#map-instruction').textContent = state.selected ? 'One route behind you. Possibilities still ahead.' : 'Choose a moment. See the path that leads there.';
  $('#replay').hidden = !state.selected;
  $('#overview').hidden = !state.selected;
  for (const link of document.querySelectorAll('.scene-links [data-scene]')) {
    if (link.dataset.scene === state.scene) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
    link.href = stateURL({ ...state, scene: link.dataset.scene }, location.href);
  }
  if (opening) map.show(state.age, state.selected, animate);
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
  state = { ...state, ...change };
  const url = stateURL(state, location.href);
  if (url.href !== location.href) history.pushState(null, '', url);
  render(animate, changedScene);
  if (focusedAge && !changedScene) $(`.map-anchor[data-age="${focusedAge}"]`)?.focus({ preventScroll: true });
  if (state.selected && !changedScene) $('#status').textContent = `Example age ${state.age} selected. The path taken is dark green; untaken routes are faint; possible futures are light gray-green.`;
}

$('#explore').addEventListener('click', () => navigate({ age: Number($('#example-age').value), selected: true }, true));
$('#example-age').addEventListener('change', event => navigate({ age: Number(event.target.value), selected: state.selected }, state.selected));
$('#replay').addEventListener('click', () => map.show(state.age, true, true));
$('#overview').addEventListener('click', () => map.overview());
motionControl.addEventListener('change', () => map.show(state.age, state.selected, false));
systemMotion.addEventListener('change', () => {
  motionControl.checked = systemMotion.matches;
  motionControl.disabled = systemMotion.matches;
  motionControl.title = systemMotion.matches ? 'Enabled by your system preference' : '';
  if (state.scene === 'possibilities') map.show(state.age, state.selected, false);
});
document.querySelectorAll('[data-scene]').forEach(control => control.addEventListener('click', event => {
  event.preventDefault();
  navigate({ scene: control.dataset.scene });
}));
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#main').focus();
});
window.addEventListener('popstate', () => { state = readState(location.href); render(false, true); });
window.addEventListener('hashchange', () => {
  const restored = readState(location.href);
  if (restored.scene !== state.scene) { state = restored; render(false, true); }
});

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
setIndex(!matchMedia('(max-width: 900px)').matches);

document.querySelectorAll('[data-dialog]').forEach(control => control.addEventListener('click', () => {
  const dialog = $(`#${control.dataset.dialog}-dialog`);
  dialog.showModal();
}));
document.querySelectorAll('[data-close]').forEach(control => control.addEventListener('click', () => control.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
history.replaceState(null, '', stateURL(state, location.href));
render();
