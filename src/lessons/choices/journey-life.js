// "Many paths": one life from the lives store, told beside the map (design 001
// v13, the Lesson 1 opening; ported from prototype/lesson1-opening/page.js). The
// story's list beside the map, fitted to its column; the player that tells it;
// the end card's "Change one of his choices" and "Watch another life"; the
// narration of a changed life. journey.js owns the page, the beats and the keys
// and calls in here for the story beat. The map is journey-map.js with
// journey-life-map.js; the timing is journey-life-player.js.
import { t, locale } from '../../i18n/runtime.js';
import { prefersReducedMotion } from './journey-motion.js';
import { LIFE, LINES, createLifePlayer, useLife } from './journey-life-player.js';
import { writtenLife } from './lives/engine.js';
import { openLives } from './lives/site.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const $ = selector => document.querySelector(selector);

// A review address may name the life, the pace and a changed life: `?life=theo&pace=quick`,
// `&fork=3&alt=drums&seed=abc123`. The page reads it and never writes it.
const params = new URLSearchParams(location.search);

// ——— The lives store: read after the first paint, so the cover never waits for it ———
let store = null;
const storeReady = new Promise(resolve => {
  requestAnimationFrame(() => setTimeout(async () => {
    store = await openLives(locale);
    resolve(store);
  }, 0));
});
/** The lives that can play: every written life with a route to draw. */
const lifeIds = () => [...store.baselines.keys()].filter(id => (writtenLife(store, id)?.steps.length ?? 0) > 1);

// The lives already watched in this browser, so "Watch another life" and a return visit bring a new one until all have played.
const SEEN = 'wisdom.opening.lives';
const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN)) ?? []; } catch { return []; } };
const writeSeen = list => { try { localStorage.setItem(SEEN, JSON.stringify(list)); } catch { /* private window: the lives still cycle in this visit */ } };

// ——— Words ———
const stepLine = index => (LINES[index].close ? t('lesson.beat.life.close') : LINES[index].line);
export const lifeAlt = () => (LIFE ? t('lesson.beat.life.alt', { name: LIFE.name, end: LIFE.end }) : '');
const kindOf = kind => (kind === 'lucky' ? 'lucky' : kind === 'setback' ? 'roadblock' : null);

/**
 * The story beat's controller. `scene` is the paths scene (journey-map.js) made with `hooks`;
 * `onLife()` is true while the story beat shows; `goToLife()` plays the story beat again (another
 * life); `rerender()` renders the story beat's narration afresh.
 */
export function createLifeStory({ scene, hooks, onLife, goToLife, rerender }) {
  // ——— The story's list ———
  const lifeMarkup = () => `<ol class="life-steps" id="life-steps">${LINES.map((line, position) => `<li class="life-step is-pending${line.close ? ' is-close' : ''}" data-step="${position}">
    <span class="life-age">${line.close ? '' : esc(t('lesson.ui.age', { age: line.age }))}</span><span class="life-line"><span class="life-full">${esc(stepLine(position))}</span>${line.label ? `<span class="life-short" aria-hidden="true">${esc(line.label)}</span>` : ''}</span></li>`).join('')}</ol>`;

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
  // Beside the stage a list fills the column, from the heading down to the
  // controls. A changed life's list (fitList) takes the largest size at which
  // all its rows fit, and the room left over goes between the rows.
  const sideColumn = matchMedia('(min-width: 990px)');
  const lastFit = new Map(); // a list's id and box size → the size it fitted at last time
  function fitList(box, { min = 15, max = 24 } = {}) {
    box.classList.remove('is-tight', 'is-snug');
    box.style.removeProperty('--snug-gap');
    box.style.removeProperty('--fit-size');
    box.style.removeProperty('--fit-gap');
    [...box.children].forEach(row => row.classList.remove('is-folded'));
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
      // Too long even at the smallest size (a long life in a short column): older rows close up
      // as they arrive (foldWhat), and the newest stays in view.
      box.style.removeProperty('--fit-size');
      box.classList.add('is-tight');
      box.fitKey = `${box.clientWidth}x${box.clientHeight}:${box.children.length}`;
      const shown = [...box.children].filter(row => !row.classList.contains('is-pending'));
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

  // The story's list is planned once, before its first line (round 5, option E): every row is
  // measured at each size tried (one layout a size), so the height of the list at every step of the
  // story is known ahead. It takes the largest single size at which every step fits whole; failing
  // that, the oldest rows, one at a time and only as many as needed, show their step's map label
  // instead of their whole line, and older rows (those before the four newest) may be a pixel
  // smaller. A line arriving then only applies its step's plan: nothing is tried, and the list never scrolls.
  const STORY_FIT = {
    one: [24, 15], // one size, the largest at which every step fits whole, down to 15 px
    // then the oldest rows shortened, older rows at most a pixel smaller: of these the plan that
    // shortens fewest rows (the larger sizes first among equals), and 14 px only if none fits
    short: [[[16, 15], [15, 15], [15, 14]], [[14, 14]]],
    // a long life (a written life may have 17 steps since round 6) that still does not fit: the
    // three (then two) newest rows stay whole instead of four, so more rows may shorten
    tight: [[15, 14], [14, 14], [14, 13]],
    tightGap: 3,
    margin: 4, // px kept free under the last row: rounding, and WebKit's text a few px taller than Chromium's
  };
  let storyPlan = null; // { short: rows shortened at each step }
  function fitStory(box) {
    storyPlan = null;
    box.classList.remove('is-two', 'is-fits', 'is-packed');
    for (const name of ['--fit-size', '--fit-old', '--fit-age', '--fit-gap']) box.style.removeProperty(name);
    const rows = [...box.children];
    const shortened = rows.filter(row => row.classList.contains('is-short'));
    shortened.forEach(row => row.classList.remove('is-short'));
    if (!sideColumn.matches || !box.clientHeight || !rows.length) { box.fitKey = 'unfitted'; return; } // under the map: no fit
    const last = rows.length - 1;
    const room = box.clientHeight - parseFloat(getComputedStyle(box).paddingBottom) - STORY_FIT.margin;
    const gap = parseFloat(getComputedStyle(box).rowGap);
    // A shortened row is one text row: measured on a row like the others, holding the longest label.
    const labels = rows.map(row => row.querySelector('.life-short')?.textContent ?? '');
    const probe = document.createElement('li');
    probe.className = 'life-step is-past is-short';
    probe.setAttribute('aria-hidden', 'true');
    probe.innerHTML = `<span class="life-age">${esc(t('lesson.ui.age', { age: 88 }))}</span><span class="life-line"><span class="life-full"></span><span class="life-short">${esc(labels.reduce((a, b) => (b.length > a.length ? b : a), ''))}</span></span>`;
    box.append(probe);
    const ageFor = older => Math.max(13, older * 0.82);
    const measured = new Map();
    // Every row at `size`, the ages at the size `older` gives them (it sets the age column's width).
    const measure = (size, older) => {
      const key = `${size}/${older}`;
      if (!measured.has(key)) {
        box.style.setProperty('--fit-size', `${size}px`);
        box.style.setProperty('--fit-age', `${ageFor(older)}px`);
        measured.set(key, { rows: rows.map(row => row.getBoundingClientRect().height), short: probe.getBoundingClientRect().height });
      }
      return measured.get(key);
    };
    // The rows that may shorten, oldest first: older rows whose label is shorter than their line.
    // The plan: at each step, how many of them are shortened (never fewer than the step before).
    const plan = (newest, older, allowShort, keep = 4, rowGap = gap) => {
      const full = measure(newest, older).rows;
      const { rows: past, short } = measure(older, older);
      const can = allowShort ? rows.map((_, at) => at).filter(at => at <= last - keep && labels[at] && past[at] - short > 0.5) : [];
      const steps = [];
      let count = 0; let saved = 0; let extra = Infinity;
      for (let step = 0; step <= last; step += 1) {
        let height = step * rowGap - saved;
        for (let at = 0; at <= step; at += 1) height += at <= step - keep ? past[at] : full[at];
        while (height > room) {
          if (count >= can.length || can[count] > step - keep) return null;
          const gain = past[can[count]] - short;
          height -= gain; saved += gain; count += 1;
        }
        steps.push(new Set(can.slice(0, count)));
        if (step > 0) extra = Math.min(extra, (room - height) / step);
      }
      return { newest, older, short: steps, extra, keep, tight: rowGap < gap };
    };
    // The largest single size that fits, to half a pixel: a guess from the rows' height, then halving.
    const [top, bottom] = STORY_FIT.one;
    let found = null;
    let fit = bottom - 0.5; let over = top + 0.5;
    const tryOne = size => { const result = plan(size, size, false); if (result) { fit = size; found = result; } else over = size; };
    const firstSize = lastFit.get(`story:${box.clientWidth}x${box.clientHeight}`) ?? 18;
    tryOne(firstSize);
    while (over - fit > 0.5) tryOne(Math.round(fit + over) / 2);
    for (const sizes of STORY_FIT.short) {
      for (const [newest, older] of found ? [] : sizes) {
        const result = plan(newest, older, true);
        if (result && (!found || result.short.at(-1).size < found.short.at(-1).size)) found = result;
      }
    }
    // In order, the first that fits: the larger sizes, then two newest rows whole, then 13 px.
    for (const [newest, older] of STORY_FIT.tight) {
      for (const keep of [3, 2]) {
        // The rows close up to the short screens' 3 px gap (journey.css, .is-packed) as well.
        if (!found) found = plan(newest, older, true, keep, Math.min(gap, STORY_FIT.tightGap));
      }
    }
    probe.remove();
    box.fitKey = `${box.clientWidth}x${box.clientHeight}:${box.children.length}`;
    if (!found) {
      // A column far too short for this life: the smallest plan, and the newest line kept in view.
      const [newest, older] = STORY_FIT.short.at(-1).at(-1);
      found = { newest, older, keep: 2, tight: true, short: rows.map(() => new Set(rows.map((_, at) => at).filter(at => at <= last - 2 && labels[at]))), extra: 0 };
    } else {
      box.classList.add('is-fits');
      lastFit.set(`story:${box.clientWidth}x${box.clientHeight}`, found.newest);
    }
    storyPlan = found;
    box.style.setProperty('--fit-size', `${found.newest}px`);
    box.style.setProperty('--fit-old', `${found.older}px`);
    box.style.setProperty('--fit-age', `${ageFor(found.older)}px`);
    box.classList.toggle('is-two', found.older !== found.newest);
    box.classList.toggle('is-packed', Boolean(found.tight));
    if (found.extra > 0 && found.extra < Infinity) box.style.setProperty('--fit-gap', `${Math.min(found.newest * 0.9, found.extra).toFixed(2)}px`);
    // Mid-story (the column resized): the rows shown take this plan's state for the newest of them.
    const shown = rows.filter(row => !row.classList.contains('is-pending')).length;
    if (shown) shortenFor(shown - 1);
  }
  // A step's plan: its oldest rows shortened (only ever older rows, and only as a line arrives).
  const shortenFor = newest => {
    const short = storyPlan?.short[newest];
    lines().forEach((row, at) => row.classList.toggle('is-short', Boolean(short?.has(at))));
  };
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
      if (box.id === 'whatif-list') fitList(box, WHAT_FIT); else fitStory(box);
    });
  });
  fitObserver.observe(document.getElementById('narration-body'));
  // If a list still has to scroll in its column, the newest line stays in view.
  const keepInView = (element, box = list()) => {
    if (!box || box.scrollHeight <= box.clientHeight + 1) return;
    const bottom = element.offsetTop + element.offsetHeight - box.offsetTop;
    if (bottom > box.scrollTop + box.clientHeight) box.scrollTo({ top: bottom - box.clientHeight + 4, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  // The story never needs to scroll unless its column is far too short (no plan fits).
  const keepStoryInView = element => { if (!list()?.classList.contains('is-fits')) keepInView(element); };
  const narration = {
    reset() {
      narrationPaused = false;
      lines().forEach(element => {
        element.getAnimations().forEach(animation => animation.cancel());
        element.classList.add('is-pending');
        element.classList.remove('is-past', 'is-short');
      });
      if (list()) list().scrollTop = 0;
    },
    reveal(position, { duration, dim }) {
      const all = lines();
      if (!all[position]) return;
      // Older rows change before the line starts rising, never while it moves.
      all[position].classList.remove('is-pending');
      // The plan may keep only the three newest rows whole (a long life in a short column).
      const past = storyPlan?.keep ? position - storyPlan.keep : dim;
      all.forEach((element, other) => element.classList.toggle('is-past', other <= past));
      shortenFor(position);
      lineIn(all[position], duration);
      keepStoryInView(all[position]);
    },
    revealAll({ duration }) {
      const all = lines();
      const arriving = all.filter(element => element.classList.contains('is-pending'));
      arriving.forEach(element => element.classList.remove('is-pending'));
      all.forEach((element, other) => element.classList.toggle('is-past', other < all.length - (storyPlan?.keep ?? 4)));
      shortenFor(all.length - 1);
      arriving.forEach(element => lineIn(element, duration));
      if (all.length) keepStoryInView(all.at(-1));
    },
    finishCurrent() { lines().forEach(element => element.getAnimations().forEach(animation => animation.finish())); },
    pause() { narrationPaused = true; lines().forEach(element => element.getAnimations().forEach(animation => animation.pause())); },
    resume() { narrationPaused = false; lines().forEach(element => element.getAnimations().forEach(animation => animation.play())); },
    seek(ms) { lines().forEach(element => element.getAnimations().forEach(animation => { animation.currentTime = ms; animation.pause(); })); },
  };
  const player = createLifePlayer({
    map: frame => scene.setLife(frame),
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
  player.setPace(params.get('pace') === 'quick' ? 'quick' : 'normal');

  // ——— After the story: change one of the person's choices ———
  const lifeMap = scene.life;
  const lifeMode = () => lifeMap.mode;
  const announce = message => { $('#announcer').textContent = ''; requestAnimationFrame(() => { $('#announcer').textContent = message; }); };
  const altEnd = () => `${lifeAlt()} ${t('lesson.beat.life.altEnd', { name: LIFE.name })}`;
  // The story's end shows the end card; playing again hides it.
  function lifeState(state) {
    const mode = lifeMode();
    if (state.complete && (mode === 'story' || mode === 'adds')) {
      scene.lifeMode('ended');
      $('#stage-description').textContent = altEnd();
      const here = document.activeElement;
      if (!here || here === document.body || here === $('#narration')) lifeMap.card.querySelector('h2').focus({ preventScroll: true });
      announce(t('opening.end.announce', { name: LIFE.name }));
    } else if (!state.complete && mode !== 'story') {
      scene.lifeMode('story');
      $('#stage-description').textContent = lifeAlt();
    }
  }
  // While choosing, a hint under the story; the story is fitted again to make room for it.
  const addHint = () => { if (!$('.life-hint')) $('#beat-extra').insertAdjacentHTML('beforeend', `<p class="life-hint">${esc(t('opening.choose.hint', { name: LIFE.name }))}</p>`); };
  /** The story's words, whole, as the story left them (after a picked life, or for picking). */
  function showStoryWords({ hint = false } = {}) {
    rerender();
    $('#life-pause').parentElement.classList.add('is-done');
    if (hint) { addHint(); fitStory(list()); }
    narration.revealAll({ duration: 0 });
  }
  function startChoosing() {
    scene.lifeMode('choosing');
    if (lifeMode() === 'choosing' && !$('.life-hint') && !$('#whatif-list')) { addHint(); fitStory(list()); }
    else showStoryWords({ hint: true });
    scene.restAtEnd();
    announce(t('opening.choose.announce', { count: lifeMap.forks().length, name: LIFE.name }));
    lifeMap.focusFirstFork();
  }
  function backToLife() {
    clearTimeout(pickTimer);
    scene.lifeMode('ended');
    scene.restAtEnd();
    showStoryWords();
    $('#stage-description').textContent = altEnd();
    announce(t('opening.whatif.announceBack', { name: LIFE.name }));
    lifeMap.card.querySelector('button').focus({ preventScroll: true });
  }
  hooks.onLeave = () => backToLife();
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
      scene.lifeMode('whatif');
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
  hooks.onPick = ({ item, age, nodes, life }) => {
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
    setTimeout(() => fitWhat(timeline), 0);
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
  hooks.onStep = (node, position) => {
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
  hooks.onDone = () => {
    const note = $('#whatif-list .whatif-note');
    if (note) {
      fitWhat(note.parentElement);
      note.classList.remove('is-pending');
      foldWhat(note.parentElement.children.length - 1);
      keepInView(note, note.parentElement);
    }
    scene.restAtEnd();
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
    const seen = readSeen();
    if (!seen.includes(id)) writeSeen([...seen, id]);
  }
  /**
   * The first life: the one the address names, else Sam on the first visit, else one not watched
   * yet in this browser (a return visit brings a new life, until every life has played).
   */
  async function ensureLife() {
    if (LIFE) return;
    await storeReady;
    if (LIFE) return;
    const ids = lifeIds();
    const asked = params.get('life');
    const seen = readSeen().filter(id => ids.includes(id));
    let first;
    if (ids.includes(asked)) first = asked;
    else if (!seen.length) first = ids.includes('sam') ? 'sam' : ids[0];
    else {
      const fresh = ids.filter(id => !seen.includes(id));
      if (!fresh.length) writeSeen([]);
      const pool = fresh.length ? fresh : ids;
      first = pool[Math.floor(Math.random() * pool.length)];
    }
    useStoredLife(first);
  }
  function playLife(id) {
    useStoredLife(id);
    goToLife();
  }
  lifeMap.onCard(action => {
    if (action === 'choose') startChoosing();
    if (action === 'another') playLife(nextLife());
  });
  lifeMap.onAlt(key => pickChoice(key));

  const growing = () => onLife() && lifeMode() === 'whatif' && lifeMap.what && !lifeMap.what.done;

  return {
    player,
    ensureLife,
    get life() { return LIFE; },
    get store() { return store; },
    storeReady,
    /** The story beat's narration: its list and its Pause link (journey.js renderNarration). */
    render(text, extra) {
      text.innerHTML = lifeMarkup();
      extra.innerHTML = `<p class="life-control"><button class="quiet-link life-pause" id="life-pause" type="button">${esc(t('lesson.ui.pause'))}</button></p>`;
      const steps = list();
      steps.addEventListener('scroll', () => steps.classList.toggle('is-scrolled', steps.scrollTop > 2), { passive: true });
      fitStory(steps);
      fitObserver.observe(steps);
    },
    /** A click in the narration's extras: Pause, and a changed life's buttons. */
    extraClick(event) {
      if (event.target.closest('#life-pause')) player.toggle();
      const action = event.target.closest('[data-whatif]')?.dataset.whatif;
      if (action === 'retry') tryAgain();
      if (action === 'again') startChoosing();
      if (action === 'back') backToLife();
    },
    /** A click or tap on the map or the lines plays the next step (or shows a growing life whole). */
    tap(event) {
      if (event.target.closest('button, a')) return;
      if (growing()) { lifeMap.finishWhat(); return; }
      if (!onLife() || !player.state.started || player.state.complete) return;
      player.advance();
    },
    /** The story's keys: Escape, → and Space; true when the key was the story's. */
    key(event) {
      const telling = onLife() && player.state.started && !player.state.complete;
      if (event.key === 'Escape' && onLife() && (lifeMode() === 'whatif' || lifeMode() === 'choosing')) {
        event.preventDefault();
        backToLife();
        return true;
      }
      if (event.key === 'ArrowRight' && growing()) { event.preventDefault(); lifeMap.finishWhat(); return true; }
      if (event.key === ' ' && onLife() && !event.target.closest?.('button, a, summary')) {
        event.preventDefault();
        player.toggle();
        return true;
      }
      if (event.key === 'ArrowRight' && telling) { event.preventDefault(); player.advance(); return true; }
      return false;
    },
    /** A review address's changed life (`?fork=3&alt=drums&seed=…`), once the story shows whole. */
    openAsked() {
      const alt = params.get('alt');
      if (!alt || !onLife() || !LIFE) return;
      const picks = lifeMap.picks();
      const pick = picks.find(item => item.id === alt && item.stepIndex === Number(params.get('fork'))) ?? picks.find(item => item.id === alt);
      if (pick) pickChoice(pick.key, { seed: params.get('seed') || undefined });
    },
    lifeAlt,
    altEnd,
    // For review captures and the sweep.
    pickChoice, startChoosing, backToLife, tryAgain, playLife, nextLife,
  };
}
