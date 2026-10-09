import { CHAPTERS, FRAGMENT_ALIASES, beatList } from './journey-story.js';
import { t } from '../../i18n/runtime.js';
import { ICONS } from './journey-icons.js';
import { createToken, prefersReducedMotion, wait } from './journey-motion.js';
import { createPathsScene } from './journey-map.js';
import { createHikeScene } from './journey-hike.js';
import { createSkillsScene } from './journey-skills.js';
import { createPlayScene } from './journey-play.js';
import { createExploreScene } from './journey-explore.js';
import { createSortBoard } from './journey-sort.js';
import { watchField } from '../../components/stage-field.js';

const beats = beatList();
const $ = selector => document.querySelector(selector);
/** The beat a URL fragment points at, following merged beats' old fragments; -1 when none. */
const beatForHash = hash => {
  const fragment = hash.slice(1);
  return beats.findIndex(item => item.fragment === (FRAGMENT_ALIASES[fragment] ?? fragment));
};
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const roots = {
  paths: $('#scene-paths'),
  hike: $('#scene-hike'),
  skills: $('#scene-skills'),
  play: $('#scene-play'),
  explore: $('#scene-explore'),
};
const scenes = {
  // A softer right-hand end than the lab's 0.04: beside the narration panel
  // the line ends otherwise stand in a straight wall (as on the home stage).
  paths: createPathsScene(roots.paths, { edgeFade: 0.24 }),
  hike: createHikeScene(roots.hike),
  skills: createSkillsScene(roots.skills),
  play: createPlayScene(roots.play),
  explore: createExploreScene(roots.explore),
};
const rootFor = chapterId => (chapterId === 'wrap' ? 'paths' : chapterId);
Object.values(roots).forEach(root => { root.hidden = true; });

if (scenes.paths.failed) {
  const fallback = document.createElement('p');
  fallback.className = 'stage-note';
  fallback.textContent = t('lesson.ui.mapUnavailable');
  roots.paths.prepend(fallback);
}

// ——— Cover (design 002 v02 · A) ———
// The first step fills the stage: the question in the middle of a faint
// field. Begin lifts the words away, the paths grow out of the Beginning,
// and then the narration arrives for the next step.
const journeyRoot = $('#journey');
const skipLink = document.querySelector('.skip-link');
const cover = document.createElement('div');
cover.className = 'cover-stage';
cover.id = 'cover';
cover.innerHTML = `<p class="beat-kicker lift">${escapeHTML(t('lesson.beat.cover.kicker'))}</p>
  <h1 class="lift" id="cover-heading" tabindex="-1">${escapeHTML(t('map.coverQuestion'))}</h1>
  <p class="cover-hint lift">${escapeHTML(t('map.coverHint'))}</p>
  <div class="cover-actions lift"><button class="next-button" type="button" data-cover-begin>${escapeHTML(t('lesson.beat.cover.next'))}</button></div>`;
roots.paths.append(cover);
const pathsStack = roots.paths.querySelector('.map-stack');
const ghost = document.createElement('img');
ghost.id = 'map-ghost';
ghost.alt = '';
ghost.setAttribute('aria-hidden', 'true');
pathsStack.prepend(ghost);
// The still copy is only needed while the cover shows.
const coverField = watchField(pathsStack, roots.paths.querySelector('#map-base'), ghost, { snapshotWhen: () => journeyRoot.dataset.cover === 'true' });

/** 'true' shows the cover, 'leaving' keeps its full-width stage while the paths grow, null is the lesson layout. */
function setCover(state) {
  if (state) journeyRoot.dataset.cover = state;
  else delete journeyRoot.dataset.cover;
  if (state === 'true') {
    cover.classList.remove('is-lifted');
    cover.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  }
  skipLink?.setAttribute('href', state ? '#cover' : '#narration');
}

/** The cover's lines lift and fade in turn: 480 ms each, 70 ms apart (690 ms in all). */
function liftCover() {
  if (prefersReducedMotion()) { cover.classList.add('is-lifted'); return; }
  const exits = [...cover.querySelectorAll('.lift')].map((line, position) => line.animate(
    [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-36px)', opacity: 0 }],
    { duration: 480, delay: position * 70, easing: 'cubic-bezier(.4, 0, .7, .2)', fill: 'forwards' },
  ));
  // The lifted state is a class, not the animations' fill: a finished fill
  // could outlive the cover being hidden and leave Back on a cover with no words.
  Promise.all(exits.map(exit => exit.finished)).then(() => {
    if (journeyRoot.dataset.cover === 'true') return;
    cover.classList.add('is-lifted');
    exits.forEach(exit => exit.cancel());
  }, () => {});
}

let index = 0;
let token = createToken();
const seen = new Set();
const choices = new Map();
const sorted = new Map();
let visibleRoot = null;

// ——— Chapter trail ———
const trailDone = $('#trail-done');
{
  const stops = CHAPTERS.map((_, position) => ((position + 0.5) / CHAPTERS.length) * 1000);
  const third = (stops[1] - stops[0]) / 3;
  let d = `M ${stops[0]} 24 C ${stops[0] + third} 6, ${stops[1] - third} 42, ${stops[1]} 24`;
  for (let position = 2; position < stops.length; position += 1) d += ` S ${stops[position] - third} ${position % 2 ? 42 : 6}, ${stops[position]} 24`;
  $('#trail-base').setAttribute('d', d);
  trailDone.setAttribute('d', d);
}
const trailLength = trailDone.getTotalLength();
trailDone.style.strokeDasharray = `${trailLength} ${trailLength}`;
$('#chapter-list').innerHTML = CHAPTERS.map((chapter, chapterIndex) => `<li style="width:${100 / CHAPTERS.length}%">
  <button class="chapter-stop" type="button" data-chapter="${chapterIndex}">
    <span class="stop-dot" aria-hidden="true"></span><span class="stop-label">${escapeHTML(chapter.short ?? chapter.title)}</span>
  </button></li>`).join('');

function updateTrail(chapterIndex) {
  document.querySelectorAll('.chapter-stop').forEach(button => {
    const stop = Number(button.dataset.chapter);
    button.dataset.state = stop < chapterIndex ? 'done' : stop === chapterIndex ? 'current' : 'todo';
    if (stop === chapterIndex) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  const fraction = chapterIndex / (CHAPTERS.length - 1);
  trailDone.style.strokeDashoffset = String(trailLength * (1 - fraction));
}

// ——— Narration ———
function renderChoice(item) {
  const { beat } = item;
  const picked = choices.get(beat.id);
  const option = beat.choice.options.find(entry => entry.id === picked);
  return `<p class="choice-prompt" id="choice-prompt">${escapeHTML(beat.choice.prompt)}</p>
    <ul class="choice-list" aria-labelledby="choice-prompt">${beat.choice.options.map(entry => `<li>
      <button class="choice-button" type="button" data-choice="${entry.id}" aria-pressed="${entry.id === picked}"><span class="choice-mark" aria-hidden="true"></span>${escapeHTML(entry.label)}</button></li>`).join('')}</ul>
    <div aria-live="polite">${option ? `<p class="choice-feedback" data-tone="${option.story ? 'story' : 'other'}">${escapeHTML(option.feedback)}</p>` : ''}</div>`;
}

const SORT_DONE = t('lesson.sort.done');

function renderSortProgress(item) {
  const results = sorted.get(item.beat.id) ?? {};
  const count = Object.keys(results).length;
  const done = count === item.beat.sort.length;
  return `<div aria-live="polite">${done
    ? `<p class="sort-summary">${escapeHTML(SORT_DONE)}</p>`
    : `<p class="beat-note">${escapeHTML(t('lesson.sort.progress', { count, total: item.beat.sort.length }))}</p>`}</div>`;
}

const sortItem = beats.find(entry => entry.beat.sort);
const sortBoard = createSortBoard(scenes.hike.sortBoard, {
  cards: sortItem.beat.sort,
  results: {},
  doneText: SORT_DONE,
  onChange: results => {
    sorted.set(sortItem.beat.id, results);
    if (beats[index] === sortItem) $('#beat-extra').innerHTML = renderSortProgress(sortItem);
  },
});

function renderNarration(item, { animate }) {
  const { beat, chapter, beatIndex } = item;
  const body = $('#narration-body');
  $('#beat-kicker').textContent = chapter.beats.length > 1
    ? t('lesson.ui.kickerStep', { kicker: beat.kicker, step: beatIndex + 1, total: chapter.beats.length })
    : beat.kicker;
  $('#beat-heading').textContent = beat.heading;
  const paragraphs = beat.game ? [] : beat.body;
  $('#narration').dataset.compact = String(Boolean(beat.game));
  $('#beat-text').innerHTML = paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('')
    + (beat.note ? `<p class="beat-note">${escapeHTML(beat.note)}</p>` : '');
  const extra = $('#beat-extra');
  extra.innerHTML = '';
  if (beat.choice) extra.innerHTML = renderChoice(item);
  if (beat.sort) extra.innerHTML = renderSortProgress(item);
  if (beat.closer) {
    extra.insertAdjacentHTML('beforeend', `<details class="closer"><summary>${escapeHTML(beat.closer.heading)}</summary>${beat.closer.body.map(text => `<p>${escapeHTML(text)}</p>`).join('')}</details>`);
  }
  if (beat.game) scenes.play.mountPanel(extra);
  if (beat.explore) scenes.explore.mountPanel(extra);
  if (beat.takeaways) {
    extra.innerHTML = `<ul class="takeaways">${beat.takeaways.map(entry => `<li>${ICONS[entry.icon]}<div><strong>${escapeHTML(entry.heading)}</strong><span>${escapeHTML(entry.text)}</span></div></li>`).join('')}</ul>
      <div class="end-actions"><button class="pill-button" type="button" data-end="play">${escapeHTML(t('lesson.ui.playAgain'))}</button>
      <button class="pill-button" type="button" data-end="restart">${escapeHTML(t('lesson.ui.restart'))}</button>
      <button class="pill-button" type="button" data-end="explore">${escapeHTML(t('lesson.ui.explore'))}</button></div>`;
  }
  if (animate && !prefersReducedMotion()) {
    body.classList.remove('is-changing');
    void body.offsetWidth;
    body.classList.add('is-changing');
  }
  body.scrollTop = 0;
}

function renderControls(item) {
  const { chapter, beatIndex } = item;
  $('#beat-dots').innerHTML = chapter.beats.map((beat, position) => {
    const globalIndex = beats.findIndex(entry => entry.chapter === chapter && entry.beatIndex === position);
    return `<li><button type="button" data-beat="${globalIndex}" aria-label="${escapeHTML(t('lesson.ui.stepLabel', { step: position + 1, heading: beat.heading }))}" ${position === beatIndex ? 'aria-current="step"' : ''} data-seen="${seen.has(globalIndex)}"></button></li>`;
  }).join('');
  $('#beat-dots').hidden = chapter.beats.length < 2;
  $('#back').disabled = index === 0;
  const next = $('#next');
  const isLast = index === beats.length - 1;
  next.hidden = isLast;
  const upcoming = beats[index + 1];
  next.textContent = item.beat.next
    ?? (upcoming && upcoming.chapter !== item.chapter ? t('lesson.ui.nextChapter', { chapter: upcoming.chapter.short ?? upcoming.chapter.title }) : t('lesson.ui.next'));
  next.dataset.emphasis = String(index === 0);
}

// ——— Stage ———
async function switchRoot(target, { zoomFrom = null } = {}) {
  const incoming = roots[target];
  if (visibleRoot === incoming) return;
  const outgoing = visibleRoot;
  visibleRoot = incoming;
  const reduced = prefersReducedMotion();
  if (outgoing && !reduced) {
    const zoom = zoomFrom && outgoing === roots.paths ? scenes.paths.todayScreenPoint() : null;
    if (zoom) outgoing.style.transformOrigin = `${zoom.x}px ${zoom.y}px`;
    outgoing.classList.add(zoom ? 'zoom-leaving' : 'is-leaving');
    const leaving = outgoing;
    setTimeout(() => {
      leaving.classList.remove('zoom-leaving', 'is-leaving');
      if (visibleRoot !== leaving) leaving.hidden = true;
    }, zoom ? 700 : 380);
    await new Promise(resolve => setTimeout(resolve, zoom ? 380 : 160));
  } else if (outgoing) {
    outgoing.hidden = true;
  }
  if (visibleRoot !== incoming) return;
  incoming.hidden = false;
  incoming.classList.remove('is-entering');
  if (!reduced) { void incoming.offsetWidth; incoming.classList.add('is-entering'); }
}

async function go(target, { animate = true, focus = 'none', history = 'replace' } = {}) {
  target = Math.max(0, Math.min(beats.length - 1, target));
  const previous = beats[index];
  const previousIndex = index;
  index = target;
  seen.add(target);
  token.cancel();
  token = createToken();
  const run = token;
  const item = beats[target];
  const sequential = animate && target === previousIndex + 1 && rootFor(previous.chapter.id) === rootFor(item.chapter.id) && previous.chapter === item.chapter;
  const leavingCover = sequential && previous.beat.id === 'cover' && Boolean(journeyRoot.dataset.cover);
  if (item.beat.id === 'cover') setCover('true');
  else if (!leavingCover) setCover(null);
  const fragment = `#${item.fragment}`;
  if (location.hash !== fragment) {
    if (history === 'push') window.history.pushState(null, '', fragment);
    else window.history.replaceState(null, '', fragment);
  }
  const titleHeading = item.beat.heading.replace(/\.$/, '');
  const lessonTitle = t('lesson.ui.title');
  document.title = titleHeading === lessonTitle ? `${lessonTitle} · ${t('site.name')}` : `${titleHeading} · ${lessonTitle}`;
  updateTrail(item.chapterIndex);
  renderNarration(item, { animate });
  renderControls(item);
  $('#stage-description').textContent = item.beat.alt ?? '';
  $('#announcer').textContent = t('lesson.ui.announce', { chapter: item.chapter.title, step: item.beatIndex + 1, total: item.chapter.beats.length, heading: item.beat.heading });
  if (focus === 'heading') (journeyRoot.dataset.cover ? $('#cover-heading') : $('#beat-heading')).focus({ preventScroll: true });
  if (focus === 'next' && !leavingCover && !$('#next').hidden) $('#next').focus({ preventScroll: true });

  const rootId = rootFor(item.chapter.id);
  const zoom = animate && previous.chapter.id === 'paths' && previous.beat.id === 'outside' && item.chapter.id === 'hike' && item.beatIndex === 0;
  const changing = visibleRoot !== roots[rootId];
  const scene = scenes[rootId];
  if (changing) {
    if (rootId === 'paths' || rootId === 'hike' || rootId === 'skills') {
      // Prepare the final state before it fades in.
      roots[rootId].hidden = false;
      scene.show(item.beat.id, { animate: false, token: run });
      if (visibleRoot) roots[rootId].hidden = true;
    }
    await switchRoot(rootId, { zoomFrom: zoom });
    if (run.cancelled) return;
    if (rootId === 'skills' && item.beat.id === 'fork' && animate) scene.show('fork', { animate: true, token: run });
    if (rootId === 'play' || rootId === 'explore') scene.show();
  } else if (leavingCover) {
    // Full width while the paths grow; the narration arrives once they have.
    setCover('leaving');
    liftCover();
    if (!(await wait(320, run))) return;
    await scene.show(item.beat.id, { from: 'cover', animate: true, token: run });
    if (run.cancelled) return;
    setCover(null);
    const narration = $('#narration');
    if (!prefersReducedMotion()) {
      narration.classList.remove('is-arriving');
      void narration.offsetWidth;
      narration.classList.add('is-arriving');
    }
    if (focus === 'next' && !$('#next').hidden) $('#next').focus({ preventScroll: true });
  } else {
    scene.show(item.beat.id, { from: sequential ? previous.beat.id : null, animate: sequential, token: run });
    if (item.beat.id === 'cover') coverField.snapshot();
  }
  const board = scenes.hike.sortBoard;
  board.hidden = item.beat.id !== 'sort';
  if (item.beat.sort) {
    board.classList.remove('board-in');
    sortBoard.render();
    if (animate && !prefersReducedMotion()) { void board.offsetWidth; board.classList.add('board-in'); }
  }
  const picked = choices.get(item.beat.id);
  if (picked && scene.choose) {
    if (sequential) await wait(50, run);
    scene.choose(item.beat.id, picked);
  }
}

// ——— Events ———
$('#next').addEventListener('click', () => go(index + 1, { focus: 'next' }));
cover.querySelector('[data-cover-begin]').addEventListener('click', () => go(1, { focus: 'next' }));
$('#back').addEventListener('click', () => go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }));
$('#chapter-list').addEventListener('click', event => {
  const button = event.target.closest('[data-chapter]');
  if (!button) return;
  const chapterIndex = Number(button.dataset.chapter);
  go(beats.findIndex(item => item.chapterIndex === chapterIndex), { animate: false, focus: 'heading', history: 'push' });
});
$('#beat-dots').addEventListener('click', event => {
  const button = event.target.closest('[data-beat]');
  if (button) go(Number(button.dataset.beat), { animate: false, focus: 'heading' });
});
$('#beat-extra').addEventListener('click', event => {
  const choiceButton = event.target.closest('[data-choice]');
  const item = beats[index];
  if (choiceButton) {
    choices.set(item.beat.id, choiceButton.dataset.choice);
    $('#beat-extra').innerHTML = renderChoice(item);
    scenes[rootFor(item.chapter.id)].choose?.(item.beat.id, choiceButton.dataset.choice);
    $(`[data-choice="${choiceButton.dataset.choice}"]`)?.focus({ preventScroll: true });
    return;
  }
  const end = event.target.closest('[data-end]');
  if (end?.dataset.end === 'restart') { choices.clear(); sorted.clear(); go(0, { animate: false, focus: 'heading', history: 'push' }); }
  if (end?.dataset.end === 'explore') go(beats.findIndex(entry => entry.beat.explore), { animate: false, focus: 'heading', history: 'push' });
  if (end?.dataset.end === 'play') {
    go(beats.findIndex(entry => entry.beat.game), { animate: false, focus: 'none', history: 'push' }).then(() => scenes.play.restart());
  }
});

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
  if ($('#reading-dialog').open) return;
  if (event.target.closest?.('input, textarea, select, [contenteditable="true"], [data-local-keys]')) return;
  if (event.key === 'ArrowRight' && index < beats.length - 1) { event.preventDefault(); go(index + 1); }
  if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }); }
});

// A closer with its own picture changes the stage while it is open.
$('#beat-extra').addEventListener('toggle', event => {
  const item = beats[index];
  if (!event.target.matches('details.closer') || !item.beat.closer?.alt) return;
  const { open } = event.target;
  scenes[rootFor(item.chapter.id)].closer?.(open, { animate: true });
  $('#stage-description').textContent = open ? item.beat.closer.alt : item.beat.alt;
}, true);

window.addEventListener('popstate', () => {
  const target = beatForHash(location.hash);
  if (target >= 0 && target !== index) go(target, { animate: false, focus: 'heading' });
});

const dialog = $('#reading-dialog');
$('#open-reading').addEventListener('click', () => dialog.showModal());
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

// ——— Start ———
const initial = Math.max(0, beatForHash(location.hash));
index = initial;
go(initial, { animate: false });
