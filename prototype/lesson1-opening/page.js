// The Lesson 1 opening as a playable mockup (design 001 v13): the lesson's own
// page, header, chapter trail, stage and narration, with the "Many paths"
// chapter cut to three steps (the cover, Sam's life, "Choices add up") and the
// fade into the hike's first step. Adapted from src/lessons/choices/journey.js.
import { chaptersFor } from '../../src/lessons/choices/journey-story.js';
import { t } from '../../src/i18n/runtime.js';
import { createToken, prefersReducedMotion, wait } from '../../src/lessons/choices/journey-motion.js';
import { createHikeScene } from '../../src/lessons/choices/journey-hike.js';
import { watchField } from '../../src/components/stage-field.js';
import { initSiteNav } from '../../src/components/site-nav.js';
import { UI, lessonsFor } from '../../src/data/site.js';
import { createPathsScene } from './map.js';
import { LINES, createLifePlayer } from './life.js';
import { ALTS } from './life-map.js';

const SITE_URL = 'https://wisdom.knyflores.com';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const $ = selector => document.querySelector(selector);

// ——— Mockup settings (in the URL, so a view can be shared and captured) ———
const params = new URLSearchParams(location.search);
const settings = {
  pace: params.get('pace') === 'quick' ? 'quick' : 'normal',
};
function saveSettings() {
  const next = new URLSearchParams(location.search);
  next.delete('dark');
  next.set('pace', settings.pace);
  history.replaceState(null, '', `${location.pathname}?${next}${location.hash}`);
}

// ——— Words ———
const stepLine = index => t(`lesson.beat.life.${LINES[index].key}`);
const lifeAlt = () => t('lesson.beat.life.alt');

// ——— Structure: the lesson's chapters, with "Many paths" cut to three steps ———
const chapters = chaptersFor(t);
const paths = chapters.find(chapter => chapter.id === 'paths');
const cover = paths.beats.find(beat => beat.id === 'cover');
const lifeBeat = { id: 'life', kicker: paths.beats[1].kicker, heading: t('lesson.beat.life.heading'), body: [], life: true };
const addsBeat = { id: 'adds', kicker: paths.beats[1].kicker, heading: t('lesson.beat.adds.heading'), body: [t('lesson.beat.adds.body1')], alt: t('lesson.beat.adds.alt') };
Object.defineProperty(lifeBeat, 'alt', { get: lifeAlt });
paths.beats = [cover, lifeBeat, addsBeat];
const CHAPTERS = chapters;
// Only the opening plays here: the cover, Sam's life, "Choices add up" and the hike's first step.
const beats = [
  ...paths.beats.map((beat, beatIndex) => ({ chapter: paths, chapterIndex: 0, beat, beatIndex })),
  { chapter: CHAPTERS[1], chapterIndex: 1, beat: CHAPTERS[1].beats[0], beatIndex: 0 },
].map(item => ({ ...item, fragment: `${item.chapter.id}-${item.beat.id}` }));
const LIFE = beats.findIndex(item => item.beat.id === 'life');
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

  // ——— Sam's story: one player, two sinks ———
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
  // Beside the stage the list has a fixed height. Lines that haven't arrived
  // wait folded to one row; when the list would overflow, older lines fold to
  // one row too, oldest first, so the newest stay whole and nothing scrolls.
  const sideColumn = matchMedia('(min-width: 990px)');
  const fold = newest => {
    const box = list();
    if (!box || !sideColumn.matches) return;
    const all = lines();
    for (let other = 0; other < newest && box.scrollHeight > box.clientHeight + 1; other += 1) all[other].classList.add('is-folded');
  };
  // If the list still has to scroll in its column, the newest line stays in view.
  const keepInView = element => {
    const box = list();
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
        element.classList.remove('is-past', 'is-folded');
      });
      if (list()) list().scrollTop = 0;
    },
    reveal(position, { duration, dim }) {
      const all = lines();
      if (!all[position]) return;
      lineIn(all[position], duration);
      all.forEach((element, other) => element.classList.toggle('is-past', other <= dim));
      fold(position);
      keepInView(all[position]);
    },
    revealAll({ duration }) {
      const all = lines();
      all.filter(element => element.classList.contains('is-pending')).forEach(element => lineIn(element, duration));
      all.forEach((element, other) => element.classList.toggle('is-past', other < all.length - 4));
      fold(all.length - 1);
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

  // ——— After the story: change one of Sam's choices ———
  const lifeMap = scenes.paths.life;
  const lifeMode = () => lifeMap.mode;
  const announce = message => { $('#announcer').textContent = ''; requestAnimationFrame(() => { $('#announcer').textContent = message; }); };
  // The story's end shows the end card; playing again hides it.
  function lifeState(state) {
    const mode = lifeMode();
    if (state.complete && (mode === 'story' || mode === 'adds')) {
      scenes.paths.lifeMode('ended');
      $('#stage-description').textContent = `${lifeAlt()} ${t('lesson.beat.life.altEnd')}`;
      const here = document.activeElement;
      if (!here || here === document.body || here === $('#narration')) lifeMap.card.querySelector('h2').focus({ preventScroll: true });
      announce(t('opening.end.announce'));
    } else if (!state.complete && mode !== 'story') {
      scenes.paths.lifeMode('story');
      $('#stage-description').textContent = lifeAlt();
    }
  }
  /** The story's words, whole, as the story left them (after a picked life, or for picking). */
  // While choosing, a hint under the story; the story's oldest lines fold to make room for it.
  const addHint = () => { if (!$('.life-hint')) $('#beat-extra').insertAdjacentHTML('beforeend', `<p class="life-hint">${esc(t('opening.choose.hint'))}</p>`); };
  function showStoryWords({ hint = false } = {}) {
    renderNarration(beats[index], { animate: false });
    $('#life-pause').parentElement.classList.add('is-done');
    if (hint) addHint();
    narration.revealAll({ duration: 0 });
  }
  function startChoosing() {
    scenes.paths.lifeMode('choosing');
    if (lifeMode() === 'choosing' && !$('.life-hint') && !$('#whatif-list')) { addHint(); fold(lines().length - 1); }
    else showStoryWords({ hint: true });
    scenes.paths.restAtEnd();
    announce(t('opening.choose.announce'));
    lifeMap.focusFirstPick();
  }
  function backToSam() {
    scenes.paths.lifeMode('ended');
    scenes.paths.restAtEnd();
    showStoryWords();
    $('#stage-description').textContent = `${lifeAlt()} ${t('lesson.beat.life.altEnd')}`;
    announce(t('opening.whatif.announceBack'));
    lifeMap.card.querySelector('button').focus({ preventScroll: true });
  }
  function pickChoice(key) {
    if (!onLife() || !player.state.complete) return;
    scenes.paths.lifeMode('whatif');
    lifeMap.pick(key);
  }
  // The narration of a picked life: its question, then its events by age, in the explorer's list style.
  let whatAge = 0;
  whatIf.onPick = ({ alt, age }) => {
    whatAge = age;
    const body = $('#narration-body');
    body.dataset.beat = 'life';
    body.classList.add('whatif');
    $('#beat-heading').textContent = t(`opening.whatif.heading.${alt.id}`);
    $('#beat-text').innerHTML = `<p class="whatif-same">${esc(t('opening.whatif.same', { age }))}</p><ol class="timeline" id="whatif-list"></ol>`;
    $('#beat-extra').innerHTML = `<p class="whatif-note" hidden>${esc(t('opening.whatif.note'))}</p>
      <div class="whatif-actions"><button type="button" class="pill-button" data-whatif="again">${esc(t('opening.whatif.again'))}</button>
      <button type="button" class="pill-button" data-whatif="back">${esc(t('opening.whatif.back'))}</button></div>`;
    $('#stage-description').textContent = t('opening.whatif.alt');
    announce(t(`opening.whatif.heading.${alt.id}`));
    // Focus moves on the next frame, once the new words are laid out, so the pick stays one short task.
    requestAnimationFrame(() => requestAnimationFrame(() => { if (body.classList.contains('whatif')) $('#beat-heading')?.focus({ preventScroll: true }); }));
  };
  const kindOf = node => (node.kind === 'lucky' || node.kind === 'roadblock' ? node.kind : null);
  // The picked choice is dated at Sam's own age for that step; the rest at their own ages.
  whatIf.onStep = (node, position) => {
    const list = $('#whatif-list');
    if (!list) return;
    const kind = kindOf(node);
    const age = position === 0 ? whatAge : Math.round(node.age);
    list.insertAdjacentHTML('beforeend', `<li><div class="timeline-step"><span class="timeline-age">${age}</span><span class="timeline-label">${kind ? `<small class="timeline-kind is-${kind}">${esc(t(`explore.kind.${kind}`))}</small> ` : ''}${esc(node.label)}${node.byFamily ? ` <small>${esc(t('explore.byFamily'))}</small>` : ''}</span></div></li>`);
    list.scrollTop = list.scrollHeight;
    list.classList.toggle('is-scrolled', list.scrollTop > 0);
    announce(kind ? t('explore.announceSurprise', { age, kind: t(`explore.kind.${kind}`), event: node.label })
      : t('explore.announceChoice', { age, choice: node.label }));
  };
  whatIf.onDone = () => {
    const note = document.querySelector('.whatif-note');
    if (note) note.hidden = false;
    scenes.paths.restAtEnd();
  };
  lifeMap.onCard(action => { if (action === 'choose') startChoosing(); });
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
   * chips and the old words, Sam's route holds alone (320–700 ms), then the
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
      // Full width while the paths grow; then the narration arrives, then Sam's story starts.
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
    if (action === 'again') startChoosing();
    if (action === 'back') backToSam();
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
      backToSam();
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
    if (option.dataset.replay !== undefined) go(LIFE, { animate: false, autoplay: true, focus: 'next', history: 'push' });
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
          <p>${esc(t('opening.reading.change'))}</p></section>
        <section class="reading-beat"><h3>${esc(addsBeat.heading)}</h3>${addsBeat.body.map(text => `<p>${esc(text)}</p>`).join('')}${picture(addsBeat.alt)}</section>
      </section>
      <section class="reading-chapter" aria-labelledby="read-chapter-hike"><h2 id="read-chapter-hike">${esc(plan.chapter.title)}</h2>
        <section class="reading-beat"><h3>${esc(plan.beat.heading)}</h3>${plan.beat.body.map(text => `<p>${esc(text)}</p>`).join('')}${picture(plan.beat.alt)}</section>
      </section>
    </article>`;
  }
  $('#open-reading').addEventListener('click', () => {
    $('#reading-content').innerHTML = readingMarkup();
    if (onLife() && player.state.playing && player.state.started) player.toggle(); // the story waits behind the text
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

  // A test hook for the capture scripts.
  globalThis.opening = { player, go, beats, scenes, pickChoice, startChoosing, backToSam, ALTS, get index() { return index; } };

  const initial = Math.max(0, beatForHash(location.hash));
  index = initial;
  go(initial, { animate: false });
}
