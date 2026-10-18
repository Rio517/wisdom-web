// Lesson 3 · The elephant and the rider: the guided journey on its page. Lesson 1's frame (journey-shell.js:
// the chapter trail, step dots, Back and Next, the fit beside the stage, the takeaways' band), as Lesson 2
// uses it, with Lesson 3's chapters (elephant-story.js), its pictures (elephant-stage.js) and its activity,
// Elephant or rider (elephant-sort.js, on Lesson 1's sort board).
import { t } from '../../i18n/runtime.js';
import { beatList } from '../choices/journey-story.js';
import { prefersReducedMotion } from '../choices/journey-motion.js';
import { TIGHT, createChapterTrail, createNarrationFit, createBand, watchDots, renderControls, kickerFor, titleFor, escapeHTML } from '../choices/journey-shell.js';
import { CHAPTERS, ELEPHANT_TITLE } from './elephant-story.js';
import { TAKEAWAY_ICONS } from './elephant-pictures.js';
import { createElephantStage } from './elephant-stage.js';
import { createElephantSort } from './elephant-sort.js';
import { bindReadingDialog } from '../../components/lesson-controls.js';

const $ = selector => document.querySelector(selector);
// Test only: ?stress=wide sets every word about 8% wider (journey.css), for the fit sweep.
if (new URLSearchParams(location.search).get('stress') === 'wide') document.documentElement.classList.add('stress-wide');

const beats = beatList(CHAPTERS);
const beatForHash = hash => beats.findIndex(item => item.fragment === hash.slice(1));
const journeyRoot = $('#journey');
const roots = { picture: $('#scene-elephant'), activity: $('#scene-sort') };
const stage = createElephantStage(roots.picture);
let index = 0;
const seen = new Set();
let visible = null;

const sort = createElephantSort(roots.activity, {
  onChange: () => { if (beats[index]?.beat.activity) renderNarration(beats[index], { animate: false }); },
});

const updateTrail = createChapterTrail(CHAPTERS);
const fitNarration = createNarrationFit($('#narration-body'));
const sizeBand = createBand(journeyRoot);
watchDots($('#beat-dots'));

// ——— Narration ———
function renderNarration(item, { animate }) {
  const { beat } = item;
  const body = $('#narration-body');
  body.getAnimations().forEach(animation => animation.cancel());
  body.dataset.beat = beat.id;
  body.classList.remove(...TIGHT);
  journeyRoot.dataset.beat = beat.takeaways ? 'takeaways' : beat.id;
  $('#beat-kicker').textContent = beat.ownKicker ? beat.kicker : kickerFor(item);
  $('#beat-heading').textContent = beat.heading;
  // At the end of the sort the story keeps its first line and adds what the two sides show together.
  const done = beat.activity && sort.state.done;
  const paragraphs = done ? [beat.body[0]] : beat.body;
  $('#beat-text').innerHTML = paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('');
  const extra = $('#beat-extra');
  extra.innerHTML = '';
  if (beat.activity) {
    const line = done ? t('elephant.beat.partners.result') : sort.state.line;
    extra.innerHTML = `<div aria-live="polite">${line ? `<p class="beat-result">${escapeHTML(line)}</p>` : ''}</div>`;
  }
  if (beat.takeaways) {
    extra.innerHTML = `<ul class="takeaways">${beat.takeaways.map(entry => `<li>${TAKEAWAY_ICONS[entry.icon]}<div><strong>${escapeHTML(entry.heading)}</strong><span>${escapeHTML(entry.text)}</span></div></li>`).join('')}</ul>`;
  }
  if (index === beats.length - 1) {
    extra.innerHTML = `<div class="end-actions"><button class="pill-button" type="button" data-end="restart">${escapeHTML(t('lesson.ui.restart'))}</button></div>`;
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

// ——— Stage ———
function switchTo(name) {
  const incoming = roots[name];
  if (visible === incoming) return;
  const outgoing = visible;
  visible = incoming;
  if (outgoing) outgoing.hidden = true;
  incoming.hidden = false;
  incoming.classList.remove('is-entering');
  if (outgoing && !prefersReducedMotion()) { void incoming.offsetWidth; incoming.classList.add('is-entering'); }
}

function go(target, { animate = true, focus = 'none', history = 'replace' } = {}) {
  target = Math.max(0, Math.min(beats.length - 1, target));
  index = target;
  seen.add(target);
  const item = beats[target];
  const fragment = `#${item.fragment}`;
  if (location.hash !== fragment) {
    if (history === 'push') window.history.pushState(null, '', fragment);
    else window.history.replaceState(null, '', fragment);
  }
  document.title = titleFor(item, t(ELEPHANT_TITLE));
  updateTrail(item.chapterIndex);
  if (item.beat.activity) { switchTo('activity'); sort.enter(); } else switchTo('picture');
  renderNarration(item, { animate });
  renderControls({ beats, index, seen });
  if (!item.beat.activity) stage.show(item.beat.id, { animate });
  $('#stage-description').textContent = item.beat.alt ?? '';
  $('#announcer').textContent = t('lesson.ui.announce', { chapter: item.chapter.title, step: item.beatIndex + 1, total: item.chapter.beats.length, heading: item.beat.heading });
  if (focus === 'heading') $('#beat-heading').focus({ preventScroll: true });
  if (focus === 'next' && !$('#next').hidden) $('#next').focus({ preventScroll: true });
}

// ——— Events ———
$('#next').addEventListener('click', () => go(index + 1, { focus: 'next' }));
$('#back').addEventListener('click', () => go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }));
$('#chapter-list').addEventListener('click', event => {
  const button = event.target.closest('[data-chapter]');
  if (button) go(beats.findIndex(item => item.chapterIndex === Number(button.dataset.chapter)), { animate: false, focus: 'heading', history: 'push' });
});
$('#beat-dots').addEventListener('click', event => {
  const button = event.target.closest('[data-beat]');
  if (button) go(Number(button.dataset.beat), { animate: false, focus: 'heading' });
});
$('#beat-extra').addEventListener('click', event => {
  if (event.target.closest('[data-end="restart"]')) { sort.restart(); go(0, { animate: false, focus: 'heading', history: 'push' }); }
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
  if ($('#reading-dialog').open) return;
  if (event.target.closest?.('input, textarea, select, [contenteditable="true"], [data-local-keys]')) return;
  if (event.key === 'ArrowRight' && index < beats.length - 1) { event.preventDefault(); go(index + 1); }
  if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); go(index - 1, { animate: false, focus: index - 1 === 0 ? 'heading' : 'none' }); }
});
window.addEventListener('popstate', () => {
  const target = beatForHash(location.hash);
  if (target >= 0 && target !== index) go(target, { animate: false, focus: 'heading' });
});

const dialog = $('#reading-dialog');
bindReadingDialog(dialog);
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

// A hook for the review captures and the fit sweep.
globalThis.journey = { go, beats, sort, stage, get index() { return index; } };

// ——— Start ———
go(Math.max(0, beatForHash(location.hash)), { animate: false });
document.documentElement.dataset.ready = 'true';
