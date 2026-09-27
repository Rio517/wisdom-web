import { createLabSceneBuilder } from '../src/engine/lab-future.js';
import { createLabRenderer } from '../src/engine/lab-renderer.js';
import { LAB_DEFAULTS, LAB_CONTROLS, LAB_MAX_AGE, ageForTimelinePosition, timelinePositionForAge, normalizeLabSettings, networkOptionsForLab, readLabState, labURL, exportLabSettings } from '../src/engine/lab-settings.js';

const $ = selector => document.querySelector(selector);
let state = readLabState(location.href);
const renderer = createLabRenderer($('#path-canvas'));
let network = null;
let projection = null;
let future = null;
let networkKey = '';
let inflight = false;
let timer;
let worker;
let lastDialogTrigger;
let displayedGroup = 'Branching';
const buildFallbackScene = createLabSceneBuilder();
const currentKey = () => JSON.stringify({
  options: networkOptionsForLab(state.settings, { today: state.selected ? state.age : null }),
  age: state.selected ? state.age : 0,
  choiceSeed: state.settings.choiceSeed,
  todayBurst: state.settings.todayBurst,
});

const format = (control, value) => {
  if (['openingBurst', 'todayBurst', 'ageTaper', 'splitProbability', 'grayOpacity', 'fadeFloor', 'edgeFade'].includes(control.field)) return `${Math.round(value * 100)}%`;
  if (control.field === 'endingRate') return `${(value * 100).toFixed(1)}% a year at 70`;
  const precision = String(control.step).split('.')[1]?.length ?? 0;
  const amount = Number.isInteger(value) ? String(value) : Number(value.toFixed(Math.max(precision, 1))).toString();
  return `${amount}${control.unit ? `${control.unit === '°' ? '' : ' '}${control.unit}` : ''}`;
};

const forkRangeContainers = new Map();
for (const control of LAB_CONTROLS) {
  const field = document.createElement('div');
  field.className = 'parameter';
  const heading = document.createElement('div');
  heading.className = 'parameter-heading';
  const label = document.createElement('label');
  label.htmlFor = control.field;
  label.textContent = control.label;
  const output = document.createElement('output');
  output.htmlFor = control.field;
  output.id = `${control.field}-value`;
  const input = document.createElement('input');
  Object.assign(input, { id: control.field, type: 'range', min: control.min, max: control.max, step: control.step });
  input.setAttribute('aria-describedby', `${control.field}-help`);
  const help = document.createElement('p');
  help.id = `${control.field}-help`;
  help.textContent = control.help;
  let container = $(`#controls-${control.group.toLowerCase()}`);
  if (control.field.includes('Children')) {
    const kind = control.field.startsWith('first') ? 'first' : 'later';
    if (!forkRangeContainers.has(kind)) {
      const range = document.createElement('fieldset');
      range.className = 'fork-range';
      const legend = document.createElement('legend');
      legend.textContent = kind === 'first' ? 'First fork' : 'Later forks';
      const inputs = document.createElement('div');
      inputs.className = 'fork-range-inputs';
      const description = document.createElement('p');
      description.textContent = kind === 'first'
        ? 'A seeded count within this range. Set both bounds alike for an exact count.'
        : 'Children at later forks, when the drawing has room.';
      range.append(legend, inputs, description);
      if (kind === 'first') {
        const actual = document.createElement('p');
        actual.id = 'first-fork-actual';
        actual.setAttribute('aria-live', 'polite');
        range.append(actual);
      }
      container.append(range);
      forkRangeContainers.set(kind, inputs);
    }
    container = forkRangeContainers.get(kind);
    label.textContent = control.field.endsWith('Min') ? 'Minimum' : 'Maximum';
    help.className = 'sr-only';
  }
  heading.append(label, output);
  field.append(heading, input, help);
  container.append(field);
  input.addEventListener('input', () => updateSettings({ [control.field]: Number(input.value) }));
}

function setBusy(busy, message) {
  $('#lab-status').dataset.busy = String(busy);
  $('#lab-status').textContent = message ?? (busy ? 'Updating…' : 'Settings stay in this URL');
}

function syncControls() {
  for (const control of LAB_CONTROLS) {
    const input = $(`#${control.field}`);
    input.value = state.settings[control.field];
    const formatted = format(control, state.settings[control.field]);
    $(`#${control.field}-value`).value = formatted;
    input.setAttribute('aria-valuetext', formatted);
  }
  $('#fadeDistance').disabled = state.settings.variant === 'retained';
  $('#fadeFloor').disabled = state.settings.variant !== 'fading';
  $('#endingRate').disabled = state.settings.growthMode !== 'laminar';
  $('#todayBurst').disabled = !state.selected || state.age >= LAB_MAX_AGE;
  $('#todayBurst-help').textContent = !state.selected
    ? 'Select an age to tune its new fan. At Beginning, use Opening boost.'
    : state.age >= LAB_MAX_AGE
      ? 'The view ends at 70. Select an earlier age to tune its new fan.'
      : 'Accelerates branching just after Today. Zero removes the boost, not the future.';
  const activeBoost = state.selected ? state.settings.todayBurst : state.settings.openingBurst;
  $('#burstSpan-help').textContent = activeBoost === 0
    ? `The ${state.selected ? 'Today' : 'Opening'} boost is zero, so duration has no effect here. Raise that boost to preview it.`
    : 'How long the boost eases off, in years. Works in both growth models; branch clocks stay independent.';
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.settings.growthMode));
  });
  $('#path-variant').value = state.settings.variant;
  $('#map-seed').value = state.settings.seed;
  $('#route-seed').value = state.settings.choiceSeed;
  $('#timeline-age').value = timelinePositionForAge(state.selected ? state.age : 0) * LAB_MAX_AGE;
  $('#timeline-age').setAttribute('aria-valuenow', String(state.age));
  $('#timeline-age').setAttribute('aria-valuetext', state.selected ? `Age ${Math.round(state.age)}` : 'Beginning');
  $('#age-output').value = state.selected ? `Age ${Math.round(state.age)}` : 'Beginning';
  $('[data-stop="0"]').setAttribute('aria-pressed', String(!state.selected));
  document.querySelectorAll('[data-stop]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.stop) === (state.selected ? state.age : 0)));
  });
  $('#view-caption').textContent = state.selected ? 'One route through the possibilities.' : 'Many paths. One beginning.';
  const modelDescription = state.settings.growthMode === 'organic'
    ? 'Organic: each line tests its own split chance as it advances.'
    : state.settings.growthMode === 'laminar'
      ? 'Laminar: lines keep their order in a field that opens by Today; forks ease apart, nothing crosses.'
      : 'Paced: each line schedules its next split, with quicker early generations.';
  $('#drawing-description').textContent = `${modelDescription} ${state.selected
    ? 'The past stays fixed as Today moves; futures regrow. Gray ends at Today.'
    : 'Pick a stop or drag the timeline to compare ages.'}`;
}

function draw() {
  if (!network) return;
  if (networkKey !== currentKey()) return;
  renderer.paint(network, projection, state.settings, state.selected, future);
  const count = network.nodes.filter(node => node.outgoing.length === 0).length;
  const atLimit = count >= state.settings.maxTips;
  const futureCount = future?.nodes.filter(node => node.outgoing.length === 0).length;
  const firstFork = (state.selected && future ? future : network).choicePoints[0];
  $('#first-fork-actual').textContent = firstFork
    ? `This ${state.selected && future ? 'Today fan' : 'drawing'}: ${firstFork.options.length} branches at the first fork.`
    : 'This drawing: no fork with the current settings.';
  if (projection.routeExited) {
    $('#drawing-description').textContent = `This route leaves the drawing at age ${Math.round(projection.routeEndAge)}. Select an earlier age or try another route; no off-screen future is generated.`;
  }
  $('#network-summary').textContent = future
    ? `Background: ${count} branch end${count === 1 ? '' : 's'} · Today fan: ${futureCount}`
    : `Drawing: ${count} branch end${count === 1 ? '' : 's'}${atLimit ? ' · limit reached' : ''}`;
  $('#path-canvas').setAttribute('aria-label', state.selected
    ? `A branching map at example age ${Math.round(state.age)}. The traveled path is dark green; reachable futures are green; untaken paths are gray.`
    : 'Many independently branching possible paths from a shared beginning. No route has been selected.');
}

function receive(result) {
  inflight = false;
  if (result.key === currentKey()) {
    if (result.error) { setBusy(false, `Could not draw: ${result.error}`); return; }
    network = result.network;
    projection = result.projection;
    future = result.future;
    networkKey = result.key;
    draw();
    setBusy(false);
  }
  if (networkKey !== currentKey()) beginGeneration();
}

function beginGeneration() {
  if (inflight) return;
  const key = currentKey();
  if (key === networkKey) { draw(); setBusy(false); return; }
  inflight = true;
  const options = networkOptionsForLab(state.settings, { today: state.selected ? state.age : null });
  const request = { key, options, settings: state.settings, age: state.selected ? state.age : 0 };
  if (worker) worker.postMessage(request);
  else {
    try { receive({ key, ...buildFallbackScene(request) }); }
    catch (error) { receive({ key, error: error.message }); }
  }
}

function scheduleDraw() {
  clearTimeout(timer);
  if (networkKey === currentKey()) { draw(); setBusy(false); return; }
  setBusy(true);
  timer = setTimeout(beginGeneration, 65);
}

function storeState() {
  history.replaceState(null, '', labURL(state, location.href));
}

function updateSettings(change) {
  for (const kind of ['first', 'later']) {
    const minimum = `${kind}ChildrenMin`;
    const maximum = `${kind}ChildrenMax`;
    if (Number.isFinite(change[maximum]) && change[maximum] < state.settings[minimum]) change[minimum] = change[maximum];
  }
  state = { ...state, settings: normalizeLabSettings({ ...state.settings, ...change }) };
  syncControls();
  storeState();
  scheduleDraw();
}

function setAge(age) {
  const bounded = Math.max(0, Math.min(LAB_MAX_AGE, Number.isFinite(age) ? age : 0));
  state = { ...state, age: bounded, selected: bounded > 0 };
  syncControls();
  storeState();
  scheduleDraw();
}

function showGroup(group, focus = false) {
  displayedGroup = group;
  document.querySelectorAll('[data-group]').forEach(button => {
    const active = button.dataset.group === group;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    $(`#controls-${button.dataset.group.toLowerCase()}`).hidden = !active;
    if (active && focus) button.focus();
  });
}

document.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => showGroup(button.dataset.group)));
$('.control-tabs').addEventListener('keydown', event => {
  const groups = ['Branching', 'Forks', 'Shape', 'Style'];
  let index = groups.indexOf(displayedGroup);
  if (event.key === 'ArrowRight') index = (index + 1) % groups.length;
  else if (event.key === 'ArrowLeft') index = (index + groups.length - 1) % groups.length;
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = groups.length - 1;
  else return;
  event.preventDefault();
  showGroup(groups[index], true);
});
$('#timeline-age').addEventListener('input', event => setAge(Math.round(ageForTimelinePosition(Number(event.target.value) / LAB_MAX_AGE))));
$('#timeline-age').addEventListener('keydown', event => {
  const changes = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
  if (event.key === 'Home' || event.key === 'End' || Object.hasOwn(changes, event.key)) {
    event.preventDefault();
    setAge(event.key === 'Home' ? 0 : event.key === 'End' ? LAB_MAX_AGE : state.age + changes[event.key]);
  }
});
document.querySelectorAll('[data-stop]').forEach(button => button.addEventListener('click', () => setAge(Number(button.dataset.stop))));
$('#path-canvas').addEventListener('click', event => setAge(Math.round(renderer.ageAt(event.clientX))));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => updateSettings({ growthMode: button.dataset.mode })));
$('#path-variant').addEventListener('change', event => updateSettings({ variant: event.target.value }));
$('#map-seed').addEventListener('change', event => updateSettings({ seed: event.target.value }));
$('#route-seed').addEventListener('change', event => updateSettings({ choiceSeed: event.target.value }));
$('#new-route').addEventListener('click', () => updateSettings({ choiceSeed: `route-${crypto.getRandomValues(new Uint32Array(1))[0]}` }));
$('#reset-lab').addEventListener('click', () => {
  state = { settings: normalizeLabSettings(LAB_DEFAULTS), age: 0, selected: false };
  syncControls();
  storeState();
  scheduleDraw();
});

function openDialog(id, trigger) {
  lastDialogTrigger = trigger;
  $(id).showModal();
}
$('#how-it-works').addEventListener('click', event => openDialog('#algorithm-dialog', event.currentTarget));
$('#copy-settings').addEventListener('click', async event => {
  const trigger = event.currentTarget;
  const content = exportLabSettings(state);
  try {
    await navigator.clipboard.writeText(content);
    $('#lab-status').textContent = 'Settings copied';
  } catch {
    $('#settings-output').value = content;
    openDialog('#settings-dialog', trigger);
    $('#settings-output').focus();
    $('#settings-output').select();
  }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => lastDialogTrigger?.focus()));
window.addEventListener('popstate', () => { state = readLabState(location.href); syncControls(); scheduleDraw(); });
new ResizeObserver(() => { if (network) draw(); }).observe($('#path-canvas'));

try {
  worker = new Worker(new URL('./lab-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = event => receive(event.data);
  worker.onerror = event => {
    event.preventDefault();
    worker.terminate();
    worker = null;
    inflight = false;
    beginGeneration();
  };
} catch { /* The bounded generator also works when a worker is unavailable. */ }

syncControls();
storeState();
if (renderer.failed) {
  $('#canvas-error').hidden = false;
  setBusy(false, 'Canvas unavailable');
} else scheduleDraw();
