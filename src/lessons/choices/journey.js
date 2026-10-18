import { CHAPTERS, FRAGMENT_ALIASES, LEARNED, beatList, chaptersFor, renderReadingBeat } from './journey-story.js';
import { t } from '../../i18n/runtime.js';
import { ICONS } from './journey-icons.js';
import { edgePoints } from './journey-life-draw.js';
import { createToken, prefersReducedMotion, wait } from './journey-motion.js';
import { createPathsScene } from './journey-map.js';
import { createHikeScene } from './journey-hike.js';
import { createExploreScene } from './journey-explore.js';
import { createSortBoard } from './journey-sort.js';
import { createLifeStory } from './journey-life.js';
import { watchField } from '../../components/stage-field.js';
import { bindReadingDialog } from '../../components/lesson-controls.js';
import { TIGHT, createChapterTrail, createNarrationFit, createBand, watchDots, renderControls as renderStepControls, kickerFor, titleFor, escapeHTML } from './journey-shell.js';

const beats = beatList();
const $ = selector => document.querySelector(selector);
// Test only: ?stress=wide sets every word about 8% wider (journey.css), for the fit sweep.
if (new URLSearchParams(location.search).get('stress') === 'wide') document.documentElement.classList.add('stress-wide');
/** The beat a URL fragment points at, following merged beats' old fragments; -1 when none. */
const beatForHash = hash => {
  const fragment = hash.slice(1);
  return beats.findIndex(item => item.fragment === (FRAGMENT_ALIASES[fragment] ?? fragment));
};

const roots = {
  paths: $('#scene-paths'),
  hike: $('#scene-hike'),
  explore: $('#scene-explore'),
};
// "Many paths" tells one life (journey-life.js): a changed life tells the narration as it grows.
const hooks = { onPick: () => {}, onStep: () => {}, onDone: () => {}, onLeave: () => {} };
const scenes = {
  // A softer right-hand end than the lab's 0.04: beside the narration panel
  // the line ends otherwise stand in a straight wall (as on the home stage).
  paths: createPathsScene(roots.paths, { edgeFade: 0.24, life: {
    onPick: info => hooks.onPick(info), onStep: (node, position) => hooks.onStep(node, position), onDone: run => hooks.onDone(run), onLeave: () => hooks.onLeave(),
  } }),
  hike: createHikeScene(roots.hike),
  explore: createExploreScene(roots.explore),
};
// The hike's practice cards arrive with its walks: the scene says how many show and which is new.
roots.hike.addEventListener('hike-practised', event => {
  document.querySelectorAll('#practised li').forEach((card, index) => {
    card.classList.toggle('is-pending', index >= event.detail.shown);
    card.classList.toggle('is-new', index === event.detail.fresh);
  });
});
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
// field. "Watch the paths grow" lifts the words away, the paths grow out of the Beginning,
// and then the narration arrives for the next step.
const journeyRoot = $('#journey');
const skipLink = document.querySelector('.skip-link');
const cover = document.createElement('div');
cover.className = 'cover-stage';
cover.id = 'cover';
cover.innerHTML = `<p class="beat-kicker lift">${escapeHTML(t('lesson.beat.cover.kicker'))}</p>
  <h1 class="lift" id="cover-heading" tabindex="-1">${escapeHTML(t('map.coverQuestion'))}</h1>
  <p class="cover-hint lift">${escapeHTML(t('lesson.beat.cover.lede'))}</p>
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
    // Back to the cover: the column slides out as the card opens (its arrival's fill would hold it).
    const column = $('#narration');
    if (column?.classList.contains('is-arriving')) {
      column.classList.remove('is-arriving');
      if (!prefersReducedMotion()) column.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 180, easing: 'cubic-bezier(.2, .7, .2, 1)' });
    }
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
const updateTrail = createChapterTrail(CHAPTERS);

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

// Beside the map a step's words show whole (journey-shell.js); the life and its what-ifs fit their
// own lists (journey-life.js).
const fitNarration = createNarrationFit($('#narration-body'), { skip: body => body.dataset.beat === 'life' || body.classList.contains('whatif') });
const sizeBand = createBand(journeyRoot);

// On an upright screen the ending's map keeps only the range the life uses, at the same scale, so
// the words and the buttons have room below it (journey.css crops the stage by --crop-top and --crop).
const upright = matchMedia('(width < 990px)');
function cropEndingMap() {
  journeyRoot.style.removeProperty('--crop');
  journeyRoot.style.removeProperty('--crop-top');
  const lifeMap = scenes.paths.life;
  if (journeyRoot.dataset.beat !== 'takeaways' || !upright.matches || scenes.paths.failed || !lifeMap) return;
  const g = lifeMap.geometry();
  const boxes = [...g.labels, ...g.grayLabels].filter(Boolean).map(label => label.box);
  const lines = [...g.edges.slice(1), ...g.alts.flatMap(entry => [entry.edge, ...entry.tails]), ...g.ahead];
  const ys = [...g.points.map(point => point.y), ...lines.flatMap(edge => edgePoints(edge, 12).map(point => point.y))];
  const highest = Math.min(...ys, ...boxes.map(box => box.top));
  const lowest = Math.max(...ys, ...boxes.map(box => box.bottom));
  // The stack sits 18 px down the stage: 24 px stay clear above the life, and 14 px under it before
  // the age axis's own 36 px at the foot.
  const top = Math.floor(highest - 6);
  const bottom = Math.floor(pathsStack.clientHeight - lowest - 14 - 36);
  // Crop only what the page needs to fit the window, from both ends alike.
  const room = Math.max(0, top) + Math.max(0, bottom);
  const needed = document.documentElement.scrollHeight - innerHeight + 8;
  if (room <= 0 || needed <= 8) return;
  const share = Math.min(1, needed / room);
  journeyRoot.style.setProperty('--crop-top', `${Math.floor(Math.max(0, top) * share)}px`);
  journeyRoot.style.setProperty('--crop', `${Math.floor(Math.max(0, bottom) * share)}px`);
}
let cropTimer = 0;
const recrop = () => { clearTimeout(cropTimer); cropTimer = setTimeout(cropEndingMap, 160); };
upright.addEventListener('change', recrop);
addEventListener('resize', recrop);
// The map lays itself out again when its stack changes size (as when the stage leaves another
// scene's height): measure the ending again once it has.
new ResizeObserver(() => { if (journeyRoot.dataset.beat === 'takeaways') recrop(); }).observe(pathsStack);

function renderNarration(item, { animate }) {
  const { beat } = item;
  const body = $('#narration-body');
  body.getAnimations().forEach(animation => animation.cancel());
  body.dataset.beat = beat.id;
  body.classList.remove('whatif', ...TIGHT);
  journeyRoot.dataset.beat = beat.id;
  $('#beat-kicker').textContent = kickerFor(item);
  $('#beat-heading').textContent = beat.heading;
  $('#beat-text').innerHTML = beat.body.map(text => `<p>${escapeHTML(text)}</p>`).join('')
    + (beat.note ? `<p class="beat-note">${escapeHTML(beat.note)}</p>` : '');
  const extra = $('#beat-extra');
  extra.innerHTML = '';
  if (beat.life) life.render($('#beat-text'), extra);
  if (beat.choice) extra.innerHTML = renderChoice(item);
  if (beat.sort) extra.innerHTML = renderSortProgress(item);
  if (beat.practised) {
    extra.innerHTML = `<ul class="practised" id="practised">${beat.practised.map(card => `<li><strong>${ICONS[LEARNED[card.id].icon === 'rest' ? 'restSmall' : LEARNED[card.id].icon]}${escapeHTML(LEARNED[card.id].label)}</strong><span>${escapeHTML(card.text)}</span></li>`).join('')}</ul>`;
  }
  if (beat.closer) {
    extra.insertAdjacentHTML('beforeend', `<details class="closer"><summary>${escapeHTML(beat.closer.heading)}</summary>${beat.closer.body.map(text => `<p>${escapeHTML(text)}</p>`).join('')}</details>`);
  }
  if (beat.explore) scenes.explore.mountPanel(extra);
  if (beat.takeaways) {
    extra.innerHTML = `<ul class="takeaways">${beat.takeaways.map(entry => `<li>${ICONS[entry.icon]}<div><strong>${escapeHTML(entry.heading)}</strong><span>${escapeHTML(entry.text)}</span></div></li>`).join('')}</ul>
      <div class="end-actions"><a class="solid-pill next-lesson" href="${escapeHTML(journeyRoot.dataset.nextLesson ?? '')}">${escapeHTML(t('lesson.ui.nextLesson', { title: t('practice.ui.title') }))}</a>
      <button class="pill-button" type="button" data-end="restart">${escapeHTML(t('lesson.ui.restart'))}</button>
      <button class="pill-button" type="button" data-end="explore">${escapeHTML(t('lesson.ui.explore'))}</button></div>`;
  }
  sizeBand();
  fitNarration();
  if (animate && !prefersReducedMotion()) {
    body.classList.remove('is-changing');
    void body.offsetWidth;
    body.classList.add('is-changing');
  }
  body.scrollTop = 0;
}

watchDots($('#beat-dots'));
const renderControls = () => renderStepControls({ beats, index, seen });

// ——— The life the story tells (design 001 v13) ———
const LIFE_BEAT = beats.findIndex(item => item.beat.id === 'life');
const onLife = () => beats[index]?.beat.id === 'life';
const life = createLifeStory({
  scene: scenes.paths,
  hooks,
  onLife,
  goToLife: () => { tellLife(); go(LIFE_BEAT, { animate: false, autoplay: true, focus: 'next', history: 'push' }); },
  rerender: () => renderNarration(beats[index], { animate: false }),
});
/** Put the life on screen into the words of "Many paths" and the takeaways. */
function tellLife() {
  if (!life.life) return;
  const told = chaptersFor(t, life.life).flatMap(chapter => chapter.beats);
  for (const item of beats) {
    if (!['life', 'adds', 'takeaways'].includes(item.beat.id)) continue;
    const fresh = told.find(beat => beat.id === item.beat.id);
    Object.assign(item.beat, { body: fresh.body, alt: fresh.alt, steps: fresh.steps, change: fresh.change });
  }
}
const needsLife = beatId => ['life', 'adds', 'takeaways'].includes(beatId);

// ——— Stage ———
async function switchRoot(target) {
  const incoming = roots[target];
  if (visibleRoot === incoming) return;
  const outgoing = visibleRoot;
  visibleRoot = incoming;
  const reduced = prefersReducedMotion();
  if (outgoing && !reduced) {
    outgoing.classList.add('is-leaving');
    const leaving = outgoing;
    setTimeout(() => {
      leaving.classList.remove('is-leaving');
      if (visibleRoot !== leaving) leaving.hidden = true;
    }, 380);
    await new Promise(resolve => setTimeout(resolve, 160));
  } else if (outgoing) {
    outgoing.hidden = true;
  }
  if (visibleRoot !== incoming) return;
  incoming.hidden = false;
  incoming.classList.remove('is-entering');
  if (!reduced) { void incoming.offsetWidth; incoming.classList.add('is-entering'); }
}

/**
 * "Choices add up" → the hike: the field fades (0–320 ms) with the chips and the
 * old words, the route holds alone (320–700 ms), then the route fades while the
 * hike and its words arrive (700–1220 ms). No zoom.
 */
async function arriveAtHike(item, run, focus) {
  const body = $('#narration-body');
  const reduced = prefersReducedMotion();
  if (!reduced) {
    scenes.paths.fadeField(320);
    body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    if (!(await wait(700, run))) return;
    scenes.paths.fadeRoute(300);
  }
  renderNarration(item, { animate: true });
  if (focus === 'next' && !$('#next').hidden) $('#next').focus({ preventScroll: true });
  roots.hike.hidden = false;
  scenes.hike.show(item.beat.id, { animate: false, token: run });
  const leaving = roots.paths;
  visibleRoot = roots.hike;
  if (reduced) { leaving.hidden = true; scenes.paths.restore(); return; }
  roots.hike.classList.remove('is-entering');
  void roots.hike.offsetWidth;
  roots.hike.classList.add('is-entering');
  if (!(await wait(300, run))) return;
  if (visibleRoot !== leaving) { leaving.hidden = true; scenes.paths.restore(); scenes.paths.hide(); }
}

async function go(target, { animate = true, focus = 'none', history = 'replace', autoplay = false } = {}) {
  target = Math.max(0, Math.min(beats.length - 1, target));
  // The life's steps need the store: on the cover it is read after the first paint, long before it is needed.
  if (!life.life && needsLife(beats[target].beat.id)) { await life.ensureLife(); tellLife(); }
  const previous = beats[index];
  const previousIndex = index;
  index = target;
  seen.add(target);
  token.cancel();
  token = createToken();
  const run = token;
  life.player.stop();
  const item = beats[target];
  const sequential = animate && target === previousIndex + 1 && rootFor(previous.chapter.id) === rootFor(item.chapter.id) && previous.chapter === item.chapter;
  const leavingCover = sequential && previous.beat.id === 'cover' && Boolean(journeyRoot.dataset.cover);
  const toHike = animate && target === previousIndex + 1 && previous.beat.id === 'adds' && item.beat.id === 'plan';
  if (item.beat.id === 'cover') setCover('true');
  else if (!leavingCover) setCover(null);
  const fragment = `#${item.fragment}`;
  if (location.hash !== fragment) {
    if (history === 'push') window.history.pushState(null, '', fragment);
    else window.history.replaceState(null, '', fragment);
  }
  document.title = titleFor(item, t('lesson.ui.title'));
  updateTrail(item.chapterIndex);
  if (!toHike) renderNarration(item, { animate });
  renderControls();
  $('#stage-description').textContent = item.beat.alt ?? '';
  $('#announcer').textContent = t('lesson.ui.announce', { chapter: item.chapter.title, step: item.beatIndex + 1, total: item.chapter.beats.length, heading: item.beat.heading });
  // During the story → and Space belong to it, so focus waits on the narration rather than on Next.
  const focusNext = focus === 'next' && item.beat.id !== 'life';
  if (focus === 'heading') (journeyRoot.dataset.cover ? $('#cover-heading') : $('#beat-heading')).focus({ preventScroll: true });
  if (focusNext && !leavingCover && !toHike && !$('#next').hidden) $('#next').focus({ preventScroll: true });
  if (focus === 'next' && item.beat.id === 'life' && !leavingCover) $('#narration').focus({ preventScroll: true });

  const rootId = rootFor(item.chapter.id);
  const scene = scenes[rootId];
  if (toHike) { await arriveAtHike(item, run, focus); return; }
  if (visibleRoot !== roots[rootId]) {
    if (rootId === 'paths' || rootId === 'hike') {
      // Prepare the final state before it fades in.
      roots[rootId].hidden = false;
      scene.show(item.beat.id, { animate: false, token: run });
      if (rootId === 'paths') cropEndingMap();
      if (visibleRoot) roots[rootId].hidden = true;
    }
    await switchRoot(rootId);
    if (run.cancelled) return;
    if (rootId === 'paths') recrop();
    if (rootId === 'explore') scene.show();
  } else if (leavingCover) {
    // Full width while the paths grow; then the narration slides in over the map's right part (the
    // stage keeps its box beside it, so the field is never re-fitted), then the story starts.
    setCover('leaving');
    liftCover();
    life.player.reset();
    if (!(await wait(320, run))) return;
    await scene.show(item.beat.id, { from: 'cover', animate: true, token: run });
    if (run.cancelled) return;
    setCover(null);
    // Nothing changed size, so this repaints nothing; it only places the life if it wasn't yet.
    scenes.paths.settle();
    const narration = $('#narration');
    if (!prefersReducedMotion()) {
      narration.classList.remove('is-arriving');
      void narration.offsetWidth;
      narration.classList.add('is-arriving');
    }
    if (focus === 'next') narration.focus({ preventScroll: true });
    // The story starts once the column has landed (journey.css: 140 ms + 440 ms).
    if (!(await wait(prefersReducedMotion() ? 0 : 580, run))) return;
    scenes.paths.beginStory(prefersReducedMotion() ? 0 : 600);
    life.player.play();
    return;
  } else {
    scene.show(item.beat.id, { from: sequential ? previous.beat.id : null, animate: sequential, token: run });
    if (item.beat.id === 'cover') coverField.snapshot();
    cropEndingMap();
  }
  if (item.beat.id === 'life') {
    if (autoplay) { life.player.reset(); if (!(await wait(200, run))) return; life.player.play(); } else life.player.showAll();
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
$('#next').addEventListener('click', () => {
  if (onLife() && life.player.land()) return; // the first Next lands the story; the next one moves on
  go(index + 1, { focus: 'next' });
});
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
  if (onLife()) { life.extraClick(event); return; }
  const choiceButton = event.target.closest('[data-choice]');
  const item = beats[index];
  if (choiceButton) {
    choices.set(item.beat.id, choiceButton.dataset.choice);
    $('#beat-extra').innerHTML = renderChoice(item);
    fitNarration();
    scenes[rootFor(item.chapter.id)].choose?.(item.beat.id, choiceButton.dataset.choice);
    $(`[data-choice="${choiceButton.dataset.choice}"]`)?.focus({ preventScroll: true });
    return;
  }
  const end = event.target.closest('[data-end]');
  if (end?.dataset.end === 'restart') { choices.clear(); sorted.clear(); go(0, { animate: false, focus: 'heading', history: 'push' }); }
  if (end?.dataset.end === 'explore') go(beats.findIndex(entry => entry.beat.explore), { animate: false, focus: 'heading', history: 'push' });
});
// A click or tap on the map or the lines plays the next step of the story.
$('#stage').addEventListener('click', event => life.tap(event));
$('#beat-text').addEventListener('click', event => life.tap(event));

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
  if ($('#reading-dialog').open) return;
  if (event.target.closest?.('input, textarea, select, [contenteditable="true"], [data-local-keys]')) return;
  if (life.key(event)) return;
  if (event.key === 'ArrowRight' && index < beats.length - 1) { event.preventDefault(); go(index + 1); }
  if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }); }
});

// An opened closer scrolls fully into view in the narration (a closed one stays pinned at its foot).
$('#beat-extra').addEventListener('toggle', event => {
  if (event.target.matches('details.closer') && event.target.open) revealInNarration(event.target);
}, true);

function revealInNarration(element) {
  const body = element.closest('.narration-body');
  if (!body) return;
  const port = body.getBoundingClientRect(), box = element.getBoundingClientRect();
  const below = box.bottom + 12 - port.bottom;
  if (below > 0) body.scrollBy({ top: Math.min(below, box.top - port.top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

window.addEventListener('popstate', () => {
  const target = beatForHash(location.hash);
  if (target >= 0 && target !== index) go(target, { animate: false, focus: 'heading' });
  // An old link to the beat already shown (#paths-travel on the life) still takes the beat's own address.
  else if (target === index && location.hash !== `#${beats[index].fragment}`) window.history.replaceState(null, '', `#${beats[index].fragment}`);
});

const dialog = $('#reading-dialog');
// The text version tells the life on screen (the page was built with Sam's).
bindReadingDialog(dialog, async () => {
  await life.ensureLife();
  tellLife();
  for (const id of ['life', 'adds', 'takeaways']) {
    const old = dialog.querySelector(`#read-${id}`);
    const beat = beats.find(item => item.beat.id === id)?.beat;
    if (old && beat) old.outerHTML = renderReadingBeat(beat, t);
  }
  if (onLife() && life.player.state.playing && life.player.state.started) life.player.toggle(); // the story waits behind the text
});
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

// A hook for the review captures and the sweep.
globalThis.opening = {
  get player() { return life.player; }, go, beats, scenes, storeReady: life.storeReady,
  pickChoice: life.pickChoice, startChoosing: life.startChoosing, backToLife: life.backToLife, tryAgain: life.tryAgain, playLife: life.playLife, nextLife: life.nextLife,
  picks: () => scenes.paths.life.picks(),
  get life() { return life.life; },
  get store() { return life.store; },
  get index() { return index; },
};

// ——— Start ———
const initial = Math.max(0, beatForHash(location.hash));
index = initial;
// A review address's changed life (`?life=sam&fork=3&alt=drums&seed=…`) opens on the finished story with that life grown.
go(initial, { animate: false }).then(() => life.openAsked());
