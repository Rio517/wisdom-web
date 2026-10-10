// The Lesson 1 opening as a playable mockup (design 001 v13): the lesson's own
// page, header, chapter trail, stage and narration, with the "Many paths"
// chapter cut to three steps (the cover, one person's life, "Choices add up")
// and the fade into the hike's first step. Adapted from src/lessons/choices/journey.js.
// The lives come from the lives store (lives/README.md), read after the first paint.
import { chaptersFor } from '../../src/lessons/choices/journey-story.js';
import { t } from '../../src/i18n/runtime.js';
import { createToken, prefersReducedMotion, wait } from '../../src/lessons/choices/journey-motion.js';
import { createHikeScene } from '../../src/lessons/choices/journey-hike.js';
import { watchField } from '../../src/components/stage-field.js';
import { initSiteNav } from '../../src/components/site-nav.js';
import { UI, lessonsFor } from '../../src/data/site.js';
import { addsSteps, createPathsScene } from './map.js';
import { LIFE, LINES, createLifePlayer, useLife } from './life.js';
import { writtenLife } from './lives/engine.js';
import { openStore, storeFromURL } from './lives/store.js';

const SITE_URL = 'https://wisdom.knyflores.com';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const $ = selector => document.querySelector(selector);

// ——— Mockup settings (in the URL, so a view can be shared and captured) ———
const params = new URLSearchParams(location.search);
const settings = {
  pace: params.get('pace') === 'quick' ? 'quick' : 'normal',
  life: params.get('life'),
};
/** Keep the URL in step: `pace`, `life`, and a what-if's `fork`, `alt` and `seed` (null removes one). */
function saveSettings(extra = {}) {
  const next = new URLSearchParams(location.search);
  next.delete('dark');
  next.set('pace', settings.pace);
  if (settings.life) next.set('life', settings.life);
  for (const [key, value] of Object.entries(extra)) {
    if (value === null) next.delete(key); else next.set(key, value);
  }
  history.replaceState(null, '', `${location.pathname}?${next}${location.hash}`);
}

// ——— The lives store: read and checked after the first paint, so the cover never waits for it ———
let store = null;
let storeTimes = null;
const storeReady = new Promise(resolve => {
  requestAnimationFrame(() => setTimeout(async () => {
    const opened = await openStore(storeFromURL());
    store = opened.store;
    storeTimes = opened.ms;
    if (opened.errors.length) console.info(`The lives store has ${opened.errors.length} problems: npm run lives:check`);
    resolve(store);
  }, 0));
});
/** The lives that can play: every written life with a route to draw. */
const lifeIds = () => [...store.baselines.keys()].filter(id => (writtenLife(store, id)?.steps.length ?? 0) > 1);

// The lives already watched in this browser, so "Watch another life" brings a new one until all have played.
const SEEN = 'wisdom.opening.lives';
const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN)) ?? []; } catch { return []; } };
const writeSeen = list => { try { localStorage.setItem(SEEN, JSON.stringify(list)); } catch { /* private window: the lives still cycle in this visit */ } };

// ——— Words ———
const stepLine = index => (LINES[index].close ? t('lesson.beat.life.close') : LINES[index].line);
const lifeAlt = () => t('lesson.beat.life.alt', { name: LIFE.name, end: LIFE.end });
const kindOf = kind => (kind === 'lucky' ? 'lucky' : kind === 'setback' ? 'roadblock' : null);

// ——— Structure: the lesson's chapters, with "Many paths" cut to three steps ———
const chapters = chaptersFor(t);
const paths = chapters.find(chapter => chapter.id === 'paths');
const cover = paths.beats.find(beat => beat.id === 'cover');
const lifeBeat = { id: 'life', kicker: paths.beats[1].kicker, heading: t('lesson.beat.life.heading'), body: [], life: true };
const addsBeat = { id: 'adds', kicker: paths.beats[1].kicker, heading: t('lesson.beat.adds.heading') };
Object.defineProperty(lifeBeat, 'alt', { get: lifeAlt });
// "Choices add up" tells the life that just played: Sam's own words, or words that fit any life.
Object.defineProperty(addsBeat, 'body', {
  get: () => [LIFE.id === 'sam' ? t('lesson.beat.adds.body1') : t('opening.adds.body', { name: LIFE.name, pronoun: LIFE.pronoun })],
});
Object.defineProperty(addsBeat, 'alt', {
  get: () => {
    const [choice, luck, notHis] = addsSteps(LIFE).map(item => LIFE.steps[item.step].label);
    return choice && luck && notHis
      ? t('opening.adds.alt', { name: LIFE.name, pronoun: LIFE.pronoun, choice, luck, notHis })
      : t('opening.adds.altShort', { name: LIFE.name });
  },
});
paths.beats = [cover, lifeBeat, addsBeat];
const CHAPTERS = chapters;
// Only the opening plays here: the cover, one person's life, "Choices add up" and the hike's first step.
const beats = [
  ...paths.beats.map((beat, beatIndex) => ({ chapter: paths, chapterIndex: 0, beat, beatIndex })),
  { chapter: CHAPTERS[1], chapterIndex: 1, beat: CHAPTERS[1].beats[0], beatIndex: 0 },
].map(item => ({ ...item, fragment: `${item.chapter.id}-${item.beat.id}` }));
const LIFE_BEAT = beats.findIndex(item => item.beat.id === 'life');
const ALIASES = { 'paths-many': 'paths-life', 'paths-travel': 'paths-life', 'paths-outside': 'paths-adds' };
const beatForHash = hash => {
  const fragment = hash.slice(1);
  return beats.findIndex(item => item.fragment === (ALIASES[fragment] ?? fragment));
};

// ——— Page ———
function navMarkup() {
  const soon = lessonsFor(t).filter(lesson => lesson.status !== 'available');
  const pages = [
    { label: t('nav.aboutLesson'), path: '/choices/' },
    { label: t('nav.lesson'), path: '/choices/the-paths-we-make/', current: true },
    { label: t('nav.read'), path: '/choices/the-paths-we-make/read/' },
    { label: t('nav.notes'), path: '/choices/notes/' },
  ];
  return `<nav class="site-nav" id="site-nav" data-mode="drawer" data-open="false" aria-label="${esc(t('nav.label'))}" data-label-close="${esc(t('nav.close'))}" data-label-hide="${esc(t('nav.hide'))}">
  <div class="nav-head">
    <a class="brand" href="${SITE_URL}/"><span class="brand-name">${esc(t('site.name'))}</span><span class="brand-tag">${esc(t('site.tagline'))}</span></a>
    <button class="nav-close" type="button" data-nav-close aria-label="${esc(t('nav.close'))}"><span class="icon-collapse">${UI.collapse}</span><span class="icon-close">${UI.close}</span></button>
  </div>
  <div>
    <p class="nav-section-label" id="site-nav-lessons">${esc(t('nav.lessons'))}</p>
    <ul class="nav-lessons" aria-labelledby="site-nav-lessons">
      <li class="nav-lesson"><details open><summary><span class="lesson-num">01</span><span class="nav-lesson-title">${esc(t('nav.choices'))}</span><span class="chevron">${UI.chevron}</span></summary>
        <ul class="nav-pages">${pages.map(page => `<li><a href="${SITE_URL}${page.path}"${page.current ? ' aria-current="page"' : ''}>${esc(page.label)}</a></li>`).join('')}</ul></details></li>
      ${soon.map(lesson => `<li class="nav-lesson nav-lesson-soon" data-status="${lesson.status}">
        <button class="nav-soon soon-trigger" type="button" aria-describedby="site-nav-tip-${lesson.id}"><span class="lesson-num">${lesson.number}</span><span class="nav-lesson-title">${esc(lesson.title)}</span></button>
        <span class="soon-tip" role="tooltip" id="site-nav-tip-${lesson.id}" hidden>${esc(lesson.tip)}</span></li>`).join('')}
    </ul>
  </div>
  <div class="nav-utility"><a href="${SITE_URL}/about/">${esc(t('nav.about'))}</a></div>
</nav>`;
}

function segmented(name, label, options, value) {
  return `<div class="mockup-group" role="group" aria-label="${esc(label)}"><span class="mockup-label" aria-hidden="true">${esc(label)}</span>${options.map(([key, text]) => `<button type="button" class="mockup-option" data-${name}="${key}" aria-pressed="${key === value}">${esc(text)}</button>`).join('')}</div>`;
}

export function start(app) {
  document.title = `${t('opening.title')} · ${t('opening.mockup')} · ${t('site.name')}`;
  app.innerHTML = `
  <a class="skip-link" href="#narration">${esc(t('lesson.ui.skipToStory'))}</a>
  ${navMarkup()}
  <header class="journey-header">
    <div class="journey-home">
      <button class="journey-menu" type="button" data-nav-open aria-label="${esc(t('lesson.ui.openIndex'))}">${UI.menu}</button>
      <a class="journey-brand" href="./">${esc(t('site.name'))} <span>${esc(t('site.tagline'))}</span></a>
    </div>
    <nav class="chapter-trail" aria-label="${esc(t('lesson.ui.chapters'))}">
      <svg class="trail-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path id="trail-base"/><path id="trail-done"/></svg>
      <ol id="chapter-list"></ol>
    </nav>
    <button class="quiet-link" id="open-reading" type="button">${esc(t('lesson.ui.readAsText'))}</button>
  </header>
  <main class="journey" id="journey">
    <section class="stage" id="stage" aria-label="${esc(t('lesson.ui.illustration'))}">
      <div class="scene scene-paths" id="scene-paths" data-scene="paths">
        <div class="map-stack">
          <canvas id="map-base" aria-hidden="true"></canvas>
          <canvas id="map-fx" aria-hidden="true"></canvas>
          <div class="map-callouts" id="map-callouts" aria-hidden="true"></div>
        </div>
      </div>
      <div class="scene scene-hike" id="scene-hike" data-scene="hike" hidden></div>
      <p class="sr-only" id="stage-description" aria-live="polite"></p>
    </section>
    <aside class="narration" id="narration" aria-labelledby="beat-heading" tabindex="-1">
      <div class="narration-body" id="narration-body">
        <p class="beat-kicker" id="beat-kicker"></p>
        <h1 id="beat-heading" tabindex="-1"></h1>
        <div class="beat-text" id="beat-text"></div>
        <div class="beat-extra" id="beat-extra"></div>
      </div>
      <footer class="narration-controls">
        <ol class="beat-dots" id="beat-dots" aria-label="${esc(t('lesson.ui.stepsInChapter'))}"></ol>
        <div class="nav-buttons">
          <button class="back-button" id="back" type="button">${esc(t('lesson.ui.back'))}</button>
          <button class="next-button" id="next" type="button">${esc(t('lesson.ui.next'))}</button>
        </div>
        <p class="key-hint">${esc(t('lesson.ui.keyHint'))}</p>
      </footer>
    </aside>
    <div class="mockup-bar" id="mockup-bar" data-local-keys>
      <strong class="mockup-title">${esc(t('opening.mockup'))}</strong>
      ${segmented('pace', t('opening.pace'), [['normal', t('opening.pace.normal')], ['quick', t('opening.pace.quick')]], settings.pace)}
      <label class="mockup-group"><span class="mockup-label">${esc(t('opening.life'))}</span><select class="mockup-select" id="life-select" data-local-keys disabled></select></label>
      <button type="button" class="mockup-option mockup-replay" data-replay>${esc(t('opening.replay'))}</button>
    </div>
  </main>
  <p class="sr-only" id="announcer" role="status" aria-live="polite"></p>
  <dialog id="reading-dialog" aria-labelledby="journey-reading-title">
    <button class="quiet-link dialog-close" type="button" data-close>${esc(t('lesson.ui.backToJourney'))}</button>
    <div id="reading-content"></div>
  </dialog>`;
  initSiteNav();
  run();
}

function run() {
  const roots = { paths: $('#scene-paths'), hike: $('#scene-hike') };
  // A picked life tells the narration as it grows (set up with the narration below).
  const whatIf = { onPick: () => {}, onStep: () => {}, onDone: () => {} };
  const scenes = {
    paths: createPathsScene(roots.paths, { edgeFade: 0.24, life: {
      onPick: info => whatIf.onPick(info), onStep: (node, position) => whatIf.onStep(node, position), onDone: run => whatIf.onDone(run),
      onLeave: () => backToLife(),
    } }),
    hike: createHikeScene(roots.hike),
  };
  Object.values(roots).forEach(root => { root.hidden = true; });
  if (scenes.paths.failed) {
    const fallback = document.createElement('p');
    fallback.className = 'stage-note';
    fallback.textContent = t('lesson.ui.mapUnavailable');
    roots.paths.prepend(fallback);
  }

  // ——— Cover (as on the lesson) ———
  const journeyRoot = $('#journey');
  const skipLink = $('.skip-link');
  const coverStage = document.createElement('div');
  coverStage.className = 'cover-stage';
  coverStage.id = 'cover';
  coverStage.innerHTML = `<p class="beat-kicker lift">${esc(t('lesson.beat.cover.kicker'))}</p>
    <h1 class="lift" id="cover-heading" tabindex="-1">${esc(t('map.coverQuestion'))}</h1>
    <p class="cover-hint lift">${esc(t('lesson.beat.cover.lede'))}</p>
    <div class="cover-actions lift"><button class="next-button" type="button" data-cover-begin>${esc(t('lesson.beat.cover.next'))}</button></div>`;
  roots.paths.append(coverStage);
  const pathsStack = roots.paths.querySelector('.map-stack');
  const ghost = document.createElement('img');
  ghost.id = 'map-ghost';
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  pathsStack.prepend(ghost);
  const coverField = watchField(pathsStack, roots.paths.querySelector('#map-base'), ghost, { snapshotWhen: () => journeyRoot.dataset.cover === 'true' });

  function setCover(state) {
    if (state) journeyRoot.dataset.cover = state;
    else delete journeyRoot.dataset.cover;
    if (state === 'true') {
      coverStage.classList.remove('is-lifted');
      coverStage.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    }
    skipLink?.setAttribute('href', state ? '#cover' : '#narration');
  }
  function liftCover() {
    if (prefersReducedMotion()) { coverStage.classList.add('is-lifted'); return; }
    const exits = [...coverStage.querySelectorAll('.lift')].map((line, position) => line.animate(
      [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-36px)', opacity: 0 }],
      { duration: 480, delay: position * 70, easing: 'cubic-bezier(.4, 0, .7, .2)', fill: 'forwards' },
    ));
    Promise.all(exits.map(exit => exit.finished)).then(() => {
      if (journeyRoot.dataset.cover === 'true') return;
      coverStage.classList.add('is-lifted');
      exits.forEach(exit => exit.cancel());
    }, () => {});
  }

  let index = 0;
  let token = createToken();
  const seen = new Set();
  let visibleRoot = null;

  // ——— Chapter trail (every chapter shows; only the opening's two play here) ———
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
  $('#chapter-list').innerHTML = CHAPTERS.map((chapter, chapterIndex) => {
    const playable = beats.some(item => item.chapterIndex === chapterIndex);
    return `<li style="width:${100 / CHAPTERS.length}%"><button class="chapter-stop" type="button" data-chapter="${chapterIndex}"${playable ? '' : ` aria-disabled="true" title="${esc(t('opening.notInMockup'))}"`}>
      <span class="stop-dot" aria-hidden="true"></span><span class="stop-label">${esc(chapter.short ?? chapter.title)}</span></button></li>`;
  }).join('');
  function updateTrail(chapterIndex) {
    document.querySelectorAll('.chapter-stop').forEach(button => {
      const stop = Number(button.dataset.chapter);
      button.dataset.state = stop < chapterIndex ? 'done' : stop === chapterIndex ? 'current' : 'todo';
      if (stop === chapterIndex) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    trailDone.style.strokeDashoffset = String(trailLength * (1 - chapterIndex / (CHAPTERS.length - 1)));
  }

  // ——— Narration ———
  const lifeMarkup = () => `<ol class="life-steps" id="life-steps">${LINES.map((line, position) => `<li class="life-step is-pending${line.close ? ' is-close' : ''}" data-step="${position}">
    <span class="life-age">${line.close ? '' : esc(t('lesson.ui.age', { age: line.age }))}</span><span class="life-line">${esc(stepLine(position))}</span></li>`).join('')}</ol>`;

  function renderNarration(item, { animate }) {
    const { beat, chapter, beatIndex } = item;
    const body = $('#narration-body');
    body.getAnimations().forEach(animation => animation.cancel());
    body.dataset.beat = beat.id;
    body.classList.remove('whatif');
    journeyRoot.dataset.beat = beat.id;
    $('#beat-kicker').textContent = chapter.beats.length > 1
      ? t('lesson.ui.kickerStep', { kicker: beat.kicker, step: beatIndex + 1, total: chapter.beats.length })
      : beat.kicker;
    $('#beat-heading').textContent = beat.heading;
    $('#beat-text').innerHTML = beat.life ? lifeMarkup() : beat.body.map(text => `<p>${esc(text)}</p>`).join('');
    $('#beat-extra').innerHTML = beat.life
      ? `<p class="life-control"><button class="quiet-link life-pause" id="life-pause" type="button">${esc(t('lesson.ui.pause'))}</button></p>`
      : '';
    const steps = list();
    steps?.addEventListener('scroll', () => steps.classList.toggle('is-scrolled', steps.scrollTop > 2), { passive: true });
    if (steps) { fitList(steps); fitObserver.observe(steps); }
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
      const playable = globalIndex >= 0;
      return `<li><button type="button" data-beat="${globalIndex}" aria-label="${esc(t('lesson.ui.stepLabel', { step: position + 1, heading: beat.heading }))}" ${position === beatIndex ? 'aria-current="step"' : ''} data-seen="${seen.has(globalIndex)}"${playable ? '' : ` aria-disabled="true" title="${esc(t('opening.notInMockup'))}"`}></button></li>`;
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

  // ——— The story: one player, two sinks ———
  let narrationPaused = false;
  const list = () => document.getElementById('life-steps');
  const lines = () => [...(list()?.children ?? [])];
  const lineIn = (element, duration) => {
    element.classList.remove('is-pending');
    if (!duration) return null;
    const animation = element.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
      { duration, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (narrationPaused) animation.pause();
    return animation;
  };
  // Beside the stage the list fills the column, from the heading down to the
  // controls: its words take the largest size at which the whole story fits,
  // and the room left over goes between the rows. Lines that haven't arrived
  // keep their place unseen, so nothing moves as they arrive and nothing scrolls.
  const sideColumn = matchMedia('(min-width: 990px)');
  const lastFit = new Map(); // a list's id and box size → the size it fitted at last time
  function fitList(box, { min = 15, max = 24 } = {}) {
    box.classList.remove('is-tight', 'is-snug');
    box.style.removeProperty('--fit-size');
    box.style.removeProperty('--fit-gap');
    [...box.children].forEach(row => row.classList.remove('is-folded', 'is-folded-more', 'is-compact'));
    if (!sideColumn.matches || !box.clientHeight) { box.fitKey = 'unfitted'; return; } // under the map: no fit
    // The largest size, to half a pixel, at which every row shows. Each try is a layout, so few
    // tries: the size this list fitted at last time (else the middle), then a guess in proportion
    // to the rows' height there, then beside the guess; halving what is left only if need be.
    // (scrollHeight never reads less than the box, so the rows' own height is measured.)
    const tried = new Map();
    const fits = size => {
      if (!tried.has(size)) { box.style.setProperty('--fit-size', `${size}px`); tried.set(size, box.scrollHeight <= box.clientHeight); }
      return tried.get(size);
    };
    const snap = size => Math.min(max, Math.max(min, Math.floor(size * 2) / 2));
    let fit = min - 0.5; let over = max + 0.5; // the largest size known to fit, the smallest known not to
    const probe = size => { if (fits(size)) fit = Math.max(fit, size); else over = Math.min(over, size); };
    const fitFor = `${box.id}:${box.clientWidth}x${box.clientHeight}`;
    const first = snap(lastFit.get(fitFor) ?? (min + max) / 2);
    probe(first);
    const height = box.lastElementChild.getBoundingClientRect().bottom - box.getBoundingClientRect().top + box.scrollTop;
    const guess = snap((first * (box.clientHeight - 4)) / Math.max(1, height));
    probe(guess);
    const beside = fits(guess) ? guess + 0.5 : guess - 0.5;
    if (beside > fit && beside < over) probe(beside);
    while (over - fit > 0.5) probe(Math.round(fit + over) / 2);
    const lo = fit < min ? null : fit;
    if (lo === null) {
      // Too long even at the smallest size (a long life, or an iPad held sideways): older lines fold
      // as they arrive (below), and the newest stays in view.
      box.style.removeProperty('--fit-size');
      box.classList.add('is-tight');
      box.fitKey = `${box.clientWidth}x${box.clientHeight}:${box.children.length}`;
      const shown = [...box.children].filter(row => !row.classList.contains('is-pending'));
      if (box.id === 'life-steps' && shown.length) fold(shown.length - 1);
      if (shown.length) keepInView(shown.at(-1), box);
      return;
    }
    lastFit.set(fitFor, lo);
    box.style.setProperty('--fit-size', `${lo.toFixed(2)}px`);
    box.fitKey = `${box.clientWidth}x${box.clientHeight}:${box.children.length}`;
    const rows = box.children.length;
    // The room under the last row (scrollHeight never reads less than the box's own height).
    const spare = box.getBoundingClientRect().bottom - box.lastElementChild.getBoundingClientRect().bottom - 4;
    if (rows > 1 && spare > 0) box.style.setProperty('--fit-gap', `${Math.min(lo * 0.9, spare / (rows - 1)).toFixed(2)}px`);
  }
  // Fit again when the column changes size (the cover lifting, a window resized).
  // The list itself is watched too: its room changes when the heading or the controls
  // change height (the web fonts arriving, a longer heading), with the column unchanged.
  let refit = null;
  const fitObserver = new ResizeObserver(() => {
    if (refit !== null) return;
    refit = requestAnimationFrame(() => {
      refit = null;
      const box = document.getElementById('whatif-list') ?? list();
      // Not fitted yet (a what-if, fitted in a task of its own), or unchanged since: nothing to do.
      if (!box?.fitKey || box.fitKey === `${box.clientWidth}x${box.clientHeight}:${box.children.length}`) return;
      fitList(box, box.id === 'whatif-list' ? WHAT_FIT : undefined);
    });
  });
  fitObserver.observe(document.getElementById('narration-body'));
  // Only a story too long for its column at the smallest size (is-tight): lines that
  // haven't arrived wait in one row each, and when the list would overflow, older
  // lines step down a size, oldest first, then one size more; then the rows close
  // up, and only then do the three lines before the newest step down; then, oldest
  // first, lines take their age into their own row (is-compact).
  const fold = newest => {
    const box = list();
    if (!box || !sideColumn.matches || !box.classList.contains('is-tight')) return;
    const all = lines();
    const over = () => box.scrollHeight > box.clientHeight + 1;
    const shrink = (step, upTo) => { for (let other = 0; other < upTo && over(); other += 1) all[other].classList.add(step); };
    shrink('is-folded', newest - 3);
    shrink('is-folded-more', newest - 3);
    if (over()) box.classList.add('is-snug');
    shrink('is-folded', newest);
    shrink('is-folded-more', newest);
    shrink('is-compact', newest);
  };
  // If the list still has to scroll in its column, the newest line stays in view.
  const keepInView = (element, box = list()) => {
    if (!box || box.scrollHeight <= box.clientHeight + 1) return;
    const bottom = element.offsetTop + element.offsetHeight - box.offsetTop;
    if (bottom > box.scrollTop + box.clientHeight) box.scrollTo({ top: bottom - box.clientHeight + 4, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const narration = {
    reset() {
      narrationPaused = false;
      lines().forEach(element => {
        element.getAnimations().forEach(animation => animation.cancel());
        element.classList.add('is-pending');
        element.classList.remove('is-past', 'is-folded', 'is-folded-more', 'is-compact');
      });
      if (list()) { list().scrollTop = 0; list().classList.remove('is-snug'); }
    },
    reveal(position, { duration, dim }) {
      const all = lines();
      if (!all[position]) return;
      // Fold before the line starts rising, so its motion isn't measured as height.
      all[position].classList.remove('is-pending');
      all.forEach((element, other) => element.classList.toggle('is-past', other <= dim));
      fold(position);
      lineIn(all[position], duration);
      keepInView(all[position]);
    },
    revealAll({ duration }) {
      const all = lines();
      const arriving = all.filter(element => element.classList.contains('is-pending'));
      arriving.forEach(element => element.classList.remove('is-pending'));
      all.forEach((element, other) => element.classList.toggle('is-past', other < all.length - 4));
      fold(all.length - 1);
      arriving.forEach(element => lineIn(element, duration));
      if (all.length) keepInView(all.at(-1));
    },
    finishCurrent() { lines().forEach(element => element.getAnimations().forEach(animation => animation.finish())); },
    pause() { narrationPaused = true; lines().forEach(element => element.getAnimations().forEach(animation => animation.pause())); },
    resume() { narrationPaused = false; lines().forEach(element => element.getAnimations().forEach(animation => animation.play())); },
    seek(ms) { lines().forEach(element => element.getAnimations().forEach(animation => { animation.currentTime = ms; animation.pause(); })); },
  };
  const player = createLifePlayer({
    map: frame => scenes.paths.setLife(frame),
    narration,
    onChange: state => {
      const button = $('#life-pause');
      if (onLife()) lifeState(state);
      // While the story plays, a line rising into place never shows a scroll bar.
      $('#life-steps')?.classList.toggle('is-playing', !state.complete);
      if (!button) return;
      button.textContent = t(state.playing || !state.started ? 'lesson.ui.pause' : 'lesson.ui.play');
      if (state.complete && document.activeElement === button) $('#next').focus({ preventScroll: true });
      button.parentElement.classList.toggle('is-done', state.complete);
    },
  });
  player.setPace(settings.pace);
  const onLife = () => beats[index]?.beat.id === 'life';

  // ——— After the story: change one of the person's choices ———
  const lifeMap = scenes.paths.life;
  const lifeMode = () => lifeMap.mode;
  const announce = message => { $('#announcer').textContent = ''; requestAnimationFrame(() => { $('#announcer').textContent = message; }); };
  const altEnd = () => `${lifeAlt()} ${t('lesson.beat.life.altEnd', { name: LIFE.name })}`;
  // The story's end shows the end card; playing again hides it.
  function lifeState(state) {
    const mode = lifeMode();
    if (state.complete && (mode === 'story' || mode === 'adds')) {
      scenes.paths.lifeMode('ended');
      $('#stage-description').textContent = altEnd();
      const here = document.activeElement;
      if (!here || here === document.body || here === $('#narration')) lifeMap.card.querySelector('h2').focus({ preventScroll: true });
      announce(t('opening.end.announce', { name: LIFE.name }));
    } else if (!state.complete && mode !== 'story') {
      scenes.paths.lifeMode('story');
      $('#stage-description').textContent = lifeAlt();
    }
  }
  /** The story's words, whole, as the story left them (after a picked life, or for picking). */
  // While choosing, a hint under the story; the story's oldest lines fold to make room for it.
  const addHint = () => { if (!$('.life-hint')) $('#beat-extra').insertAdjacentHTML('beforeend', `<p class="life-hint">${esc(t('opening.choose.hint', { name: LIFE.name }))}</p>`); };
  function showStoryWords({ hint = false } = {}) {
    renderNarration(beats[index], { animate: false });
    $('#life-pause').parentElement.classList.add('is-done');
    if (hint) { addHint(); fitList(list()); }
    narration.revealAll({ duration: 0 });
  }
  const forgetWhatIf = () => saveSettings({ fork: null, alt: null, seed: null });
  function startChoosing() {
    scenes.paths.lifeMode('choosing');
    if (lifeMode() === 'choosing' && !$('.life-hint') && !$('#whatif-list')) { addHint(); fitList(list()); fold(lines().length - 1); }
    else showStoryWords({ hint: true });
    forgetWhatIf();
    scenes.paths.restAtEnd();
    announce(t('opening.choose.announce', { count: lifeMap.forks().length, name: LIFE.name }));
    lifeMap.focusFirstFork();
  }
  function backToLife() {
    clearTimeout(pickTimer);
    scenes.paths.lifeMode('ended');
    scenes.paths.restAtEnd();
    showStoryWords();
    forgetWhatIf();
    $('#stage-description').textContent = altEnd();
    announce(t('opening.whatif.announceBack', { name: LIFE.name }));
    lifeMap.card.querySelector('button').focus({ preventScroll: true });
  }
  let focusAfterPick = 'heading';
  // The popover closes at once, and the new life is grown and laid out in a task of its own just
  // after, so a pick is never one long task. A second pick before it runs replaces the first.
  let pickTimer = 0;
  function pickChoice(key, { seed, focus = 'heading' } = {}) {
    if (!onLife() || !player.state.complete) return;
    focusAfterPick = focus;
    lifeMap.closeFork();
    clearTimeout(pickTimer);
    pickTimer = setTimeout(() => {
      if (!onLife() || !player.state.complete) return;
      // The map is measured before anything changes its look, so nothing forces a layout mid-task.
      lifeMap.pick(key, seed ? { seed } : {});
      scenes.paths.lifeMode('whatif');
    }, 0);
  }
  /** "Try again": the same choice, a new life from it. */
  function tryAgain() {
    const run = lifeMap.what;
    if (run) pickChoice(run.item.key, { focus: 'again' });
  }
  // The narration of a picked life: its question, then its events by age, in the explorer's list
  // style. Every row is there from the start, unseen, so the list fits its column once and holds still.
  const WHAT_FIT = { min: 14, max: 21 };
  let whatAge = 0;
  const whatRow = (node, position) => {
    const kind = kindOf(node.kind);
    const age = position === 0 ? whatAge : node.age;
    return `<li class="is-pending"><div class="timeline-step"><span class="timeline-age">${age}</span><span class="timeline-label">${kind ? `<small class="timeline-kind is-${kind}">${esc(t(`explore.kind.${kind}`))}</small> ` : ''}${esc(node.label)}${node.byFamily ? ` <small>${esc(t('explore.byFamily'))}</small>` : ''}</span></div></li>`;
  };
  whatIf.onPick = ({ item, age, nodes, seed, life }) => {
    whatAge = age;
    const body = $('#narration-body');
    body.dataset.beat = 'life';
    body.classList.add('whatif');
    // The heading always names the person ("What if Sam had…?"), never "he".
    const heading = t('opening.whatif.heading', { whatIf: item.whatIf });
    $('#beat-heading').textContent = heading;
    // The note closes the list once the new life has grown, as "Many paths still ahead" closes the story.
    $('#beat-text').innerHTML = `<p class="whatif-same">${esc(t('opening.whatif.same', { name: LIFE.name, age }))}</p><ol class="timeline" id="whatif-list">${nodes.map(whatRow).join('')}<li class="whatif-note is-pending">${esc(t('opening.whatif.note', { name: LIFE.name }))}</li></ol>`;
    $('#beat-extra').innerHTML = `<div class="whatif-actions"><button type="button" class="solid-pill" data-whatif="retry">${esc(t('opening.whatif.tryAgain'))}</button>
      <button type="button" class="pill-button" data-whatif="again">${esc(t('opening.whatif.again'))}</button>
      <button type="button" class="pill-button" data-whatif="back">${esc(t('opening.whatif.back', { name: LIFE.name }))}</button></div>`;
    const timeline = $('#whatif-list');
    timeline.addEventListener('scroll', () => timeline.classList.toggle('is-scrolled', timeline.scrollTop > 2), { passive: true });
    // Fitted in a task of its own, so a pick stays one short task; before any row shows, all the same.
    // The address too: writing it makes the browser lay out the page first (to keep the scroll).
    setTimeout(() => {
      fitWhat(timeline);
      if (lifeMap.what?.seed === seed) saveSettings({ fork: String(item.stepIndex), alt: item.id, seed });
    }, 0);
    fitObserver.observe(timeline);
    $('#stage-description').textContent = t('opening.whatif.alt', { name: LIFE.name, pronoun: LIFE.pronoun, end: life.end });
    announce(heading);
    // Focus moves on the next frame, once the new words are laid out, so the pick stays one short task.
    const target = focusAfterPick;
    focusAfterPick = 'heading';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!body.classList.contains('whatif')) return;
      (target === 'again' ? $('[data-whatif="retry"]') : $('#beat-heading'))?.focus({ preventScroll: true });
    }));
  };
  // A what-if's list is fitted once, before its first row shows.
  const fitWhat = timeline => { if (timeline.isConnected && !timeline.fitKey) fitList(timeline, WHAT_FIT); };
  // The picked choice is dated at the person's own age for that step; the rest at their own ages.
  whatIf.onStep = (node, position) => {
    const row = $('#whatif-list')?.children[position];
    if (!row) return;
    fitWhat(row.parentElement);
    row.classList.remove('is-pending');
    foldWhat(position);
    keepInView(row, row.parentElement);
    if (!prefersReducedMotion() && !lifeMap.what?.done) {
      row.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    const kind = kindOf(node.kind);
    const age = position === 0 ? whatAge : node.age;
    announce(kind ? t('explore.announceSurprise', { age, kind: t(`explore.kind.${kind}`), event: node.label })
      : t('explore.announceChoice', { age, choice: node.label }));
  };
  whatIf.onDone = () => {
    const note = $('#whatif-list .whatif-note');
    if (note) {
      fitWhat(note.parentElement);
      note.classList.remove('is-pending');
      foldWhat(note.parentElement.children.length - 1);
      keepInView(note, note.parentElement);
    }
    scenes.paths.restAtEnd();
  };
  // A new life too long for a short column (is-tight): as it grows, its older rows close up, oldest first.
  function foldWhat(newest) {
    const box = $('#whatif-list');
    if (!box?.classList.contains('is-tight')) return;
    const rows = [...box.children];
    const over = () => box.scrollHeight > box.clientHeight + 1;
    for (let other = 0; other < newest - 2 && over(); other += 1) rows[other].classList.add('is-folded');
    for (let other = Math.max(0, newest - 2); other < newest && over(); other += 1) rows[other].classList.add('is-folded');
  }
  /** Another life: one not watched yet in this browser, until every life has played. */
  function nextLife() {
    const ids = lifeIds();
    let seen = readSeen().filter(id => ids.includes(id));
    if (!seen.includes(LIFE.id)) seen.push(LIFE.id);
    let fresh = ids.filter(id => !seen.includes(id));
    if (!fresh.length) { seen = [LIFE.id]; fresh = ids.filter(id => id !== LIFE.id); }
    writeSeen(seen);
    return fresh.length ? fresh[Math.floor(Math.random() * fresh.length)] : LIFE.id;
  }
  /** Put a written life on the map and in the narration (it plays from `go`). */
  function useStoredLife(id) {
    const life = writtenLife(store, id);
    useLife(life);
    lifeMap.setLife(life, store);
    settings.life = id;
    const seen = readSeen();
    if (!seen.includes(id)) writeSeen([...seen, id]);
    const select = $('#life-select');
    if (select) select.value = id;
    saveSettings({ fork: null, alt: null, seed: null });
  }
  /** The first life: the one the URL names, else Sam (the first visit's life), else the first written. */
  async function ensureLife() {
    if (LIFE) return;
    await storeReady;
    if (LIFE) return;
    const ids = lifeIds();
    useStoredLife(ids.includes(settings.life) ? settings.life : ids.includes('sam') ? 'sam' : ids[0]);
    const select = $('#life-select');
    select.innerHTML = `${ids.map(id => `<option value="${esc(id)}">${esc(store.baselines.get(id).name)}</option>`).join('')}<option value="*">${esc(t('opening.life.random'))}</option>`;
    select.value = LIFE.id;
    select.disabled = false;
  }
  function playLife(id) {
    useStoredLife(id);
    go(LIFE_BEAT, { animate: false, autoplay: true, focus: 'next', history: 'push' });
  }
  lifeMap.onCard(action => {
    if (action === 'choose') startChoosing();
    if (action === 'another') playLife(nextLife());
  });
  lifeMap.onAlt(key => pickChoice(key));

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
   * "Choices add up" → the hike (§4): the field fades (0–320 ms) with the
   * chips and the old words, the route holds alone (320–700 ms), then the
   * route fades while the hike and its words arrive (700–1220 ms). No zoom.
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
    if (!LIFE && ['life', 'adds'].includes(beats[target].beat.id)) await ensureLife();
    const previous = beats[index];
    const previousIndex = index;
    index = target;
    seen.add(target);
    token.cancel();
    token = createToken();
    const run = token;
    player.stop();
    const item = beats[target];
    const sequential = animate && target === previousIndex + 1;
    const leavingCover = sequential && previous.beat.id === 'cover' && Boolean(journeyRoot.dataset.cover);
    const toHike = sequential && previous.beat.id === 'adds' && item.beat.id === 'plan';
    if (item.beat.id === 'cover') setCover('true');
    else if (!leavingCover) setCover(null);
    const fragment = `#${item.fragment}`;
    if (location.hash !== fragment) {
      if (history === 'push') window.history.pushState(null, '', fragment);
      else window.history.replaceState(null, '', fragment);
    }
    const titleHeading = item.beat.heading.replace(/\.$/, '');
    document.title = `${titleHeading} · ${t('opening.mockup')} · ${t('site.name')}`;
    updateTrail(item.chapterIndex);
    if (!toHike) renderNarration(item, { animate });
    renderControls(item);
    $('#stage-description').textContent = item.beat.alt ?? '';
    $('#announcer').textContent = t('lesson.ui.announce', { chapter: item.chapter.title, step: item.beatIndex + 1, total: item.chapter.beats.length, heading: item.beat.heading });
    // During the story → and Space belong to it, so focus waits on the narration rather than on Next.
    const focusNext = focus === 'next' && item.beat.id !== 'life';
    if (focus === 'heading') (journeyRoot.dataset.cover ? $('#cover-heading') : $('#beat-heading')).focus({ preventScroll: true });
    if (focusNext && !leavingCover && !toHike && !$('#next').hidden) $('#next').focus({ preventScroll: true });
    if (focus === 'next' && item.beat.id === 'life' && !leavingCover) $('#narration').focus({ preventScroll: true });

    const rootId = item.chapter.id === 'hike' ? 'hike' : 'paths';
    const scene = scenes[rootId];
    if (toHike) { await arriveAtHike(item, run, focus); return; }
    if (visibleRoot !== roots[rootId]) {
      roots[rootId].hidden = false;
      scene.show(item.beat.id, { animate: false, token: run });
      if (visibleRoot) roots[rootId].hidden = true;
      await switchRoot(rootId);
      if (run.cancelled) return;
    } else if (leavingCover) {
      // Full width while the paths grow; then the narration arrives, then the story starts.
      setCover('leaving');
      liftCover();
      player.reset();
      if (!(await wait(320, run))) return;
      await scene.show('life', { from: 'cover', animate: true, token: run });
      if (run.cancelled) return;
      setCover(null);
      // The stage just narrowed: repaint the field now, before the story's frames start.
      scenes.paths.settle();
      const narrationEl = $('#narration');
      if (!prefersReducedMotion()) {
        narrationEl.classList.remove('is-arriving');
        void narrationEl.offsetWidth;
        narrationEl.classList.add('is-arriving');
      }
      if (focus === 'next') narrationEl.focus({ preventScroll: true });
      if (!(await wait(380, run))) return;
      scenes.paths.beginStory(prefersReducedMotion() ? 0 : 600);
      player.play();
      return;
    } else {
      scene.show(item.beat.id, { from: sequential ? previous.beat.id : null, animate: sequential, token: run });
      if (item.beat.id === 'cover') coverField.snapshot();
    }
    if (item.beat.id === 'life') {
      if (autoplay) { player.reset(); if (!(await wait(200, run))) return; player.play(); } else player.showAll();
    }
  }

  // ——— Events ———
  $('#next').addEventListener('click', () => {
    if (onLife() && player.land()) return; // the first Next lands the story; the next one moves on
    go(index + 1, { focus: 'next' });
  });
  coverStage.querySelector('[data-cover-begin]').addEventListener('click', () => go(1, { focus: 'next' }));
  $('#back').addEventListener('click', () => go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }));
  $('#chapter-list').addEventListener('click', event => {
    const button = event.target.closest('[data-chapter]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    const chapterIndex = Number(button.dataset.chapter);
    go(beats.findIndex(item => item.chapterIndex === chapterIndex), { animate: false, focus: 'heading', history: 'push' });
  });
  $('#beat-dots').addEventListener('click', event => {
    const button = event.target.closest('[data-beat]');
    if (button && button.getAttribute('aria-disabled') !== 'true') go(Number(button.dataset.beat), { animate: false, focus: 'heading' });
  });
  $('#beat-extra').addEventListener('click', event => {
    if (event.target.closest('#life-pause')) player.toggle();
    const action = event.target.closest('[data-whatif]')?.dataset.whatif;
    if (action === 'retry') tryAgain();
    if (action === 'again') startChoosing();
    if (action === 'back') backToLife();
  });
  const growing = () => onLife() && lifeMode() === 'whatif' && lifeMap.what && !lifeMap.what.done;
  // A click or tap on the map or the lines plays the next step (or shows a growing life whole).
  const tapAdvance = event => {
    if (event.target.closest('button, a')) return;
    if (growing()) { lifeMap.finishWhat(); return; }
    if (!onLife() || !player.state.started || player.state.complete) return;
    player.advance();
  };
  $('#stage').addEventListener('click', tapAdvance);
  $('#beat-text').addEventListener('click', tapAdvance);

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
    if ($('#reading-dialog').open) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"], [data-local-keys]')) return;
    const telling = onLife() && player.state.started && !player.state.complete;
    if (event.key === 'Escape' && onLife() && (lifeMode() === 'whatif' || lifeMode() === 'choosing')) {
      event.preventDefault();
      backToLife();
      return;
    }
    if (event.key === 'ArrowRight' && growing()) { event.preventDefault(); lifeMap.finishWhat(); return; }
    if (event.key === ' ' && onLife() && !event.target.closest?.('button, a, summary')) {
      event.preventDefault();
      player.toggle();
      return;
    }
    if (event.key === 'ArrowRight' && telling) { event.preventDefault(); player.advance(); return; }
    if (event.key === 'ArrowRight' && index < beats.length - 1) { event.preventDefault(); go(index + 1); }
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }); }
  });

  window.addEventListener('popstate', () => {
    const target = beatForHash(location.hash);
    if (target >= 0 && target !== index) go(target, { animate: false, focus: 'heading' });
  });

  // ——— Mockup bar ———
  const bar = $('#mockup-bar');
  bar.addEventListener('click', event => {
    const option = event.target.closest('[data-pace], [data-replay]');
    if (!option) return;
    if (option.dataset.pace) {
      settings.pace = option.dataset.pace;
      player.setPace(settings.pace);
    }
    bar.querySelectorAll('[data-pace]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pace === settings.pace)));
    saveSettings();
    // Replay plays a life not watched yet, as "Watch another life" does.
    if (option.dataset.replay !== undefined && LIFE) playLife(nextLife());
  });
  $('#life-select').addEventListener('change', event => {
    const ids = lifeIds();
    const value = event.target.value;
    playLife(value === '*' ? ids.filter(id => id !== LIFE.id)[Math.floor(Math.random() * (ids.length - 1))] ?? LIFE.id : value);
  });

  // ——— Read as text: the opening's words in reading order ———
  const dialog = $('#reading-dialog');
  function readingMarkup() {
    const picture = text => `<p class="reading-visual"><span>${esc(t('reading.picture'))}</span> ${esc(text)}</p>`;
    const plan = beats.at(-1);
    return `<article class="journey-reading" aria-labelledby="journey-reading-title">
      <h1 id="journey-reading-title">${esc(t('reading.title'))}</h1>
      <p class="reading-intro">${esc(t('reading.intro'))}</p>
      <section class="reading-chapter" aria-labelledby="read-chapter-paths"><h2 id="read-chapter-paths">${esc(paths.title)}</h2>
        <section class="reading-beat"><h3>${esc(cover.heading)}</h3>${cover.body.map(text => `<p>${esc(text)}</p>`).join('')}${picture(cover.alt)}</section>
        <section class="reading-beat"><h3>${esc(lifeBeat.heading)}</h3>
          <ol class="reading-steps">${LINES.map((line, position) => `<li>${line.close ? '' : `<strong>${esc(t('lesson.ui.age', { age: line.age }))}</strong> `}${esc(stepLine(position))}</li>`).join('')}</ol>
          ${picture(lifeAlt())}
          <p>${esc(t('opening.reading.change', { name: LIFE.name, pronoun: LIFE.pronoun }))}</p></section>
        <section class="reading-beat"><h3>${esc(addsBeat.heading)}</h3>${addsBeat.body.map(text => `<p>${esc(text)}</p>`).join('')}${picture(addsBeat.alt)}</section>
      </section>
      <section class="reading-chapter" aria-labelledby="read-chapter-hike"><h2 id="read-chapter-hike">${esc(plan.chapter.title)}</h2>
        <section class="reading-beat"><h3>${esc(plan.beat.heading)}</h3>${plan.beat.body.map(text => `<p>${esc(text)}</p>`).join('')}${picture(plan.beat.alt)}</section>
      </section>
    </article>`;
  }
  $('#open-reading').addEventListener('click', async () => {
    await ensureLife();
    $('#reading-content').innerHTML = readingMarkup();
    if (onLife() && player.state.playing && player.state.started) player.toggle(); // the story waits behind the text
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

  // A test hook for the capture scripts.
  globalThis.opening = {
    player, go, beats, scenes, pickChoice, startChoosing, backToLife, tryAgain, playLife, nextLife, storeReady,
    picks: () => lifeMap.picks(),
    get life() { return LIFE; },
    get store() { return store; },
    get storeTimes() { return storeTimes; },
    get index() { return index; },
  };

  const initial = Math.max(0, beatForHash(location.hash));
  index = initial;
  // A shared what-if (`?life=sam&fork=3&alt=drums&seed=…`) opens on the finished story with that life grown.
  go(initial, { animate: false }).then(() => {
    const alt = params.get('alt');
    if (!alt || !onLife() || !LIFE) return;
    const picks = lifeMap.picks();
    const pick = picks.find(item => item.id === alt && item.stepIndex === Number(params.get('fork'))) ?? picks.find(item => item.id === alt);
    if (pick) pickChoice(pick.key, { seed: params.get('seed') || undefined });
  });
}
