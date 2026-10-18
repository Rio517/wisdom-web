// Lesson 2 · Practice: the guided journey on its page. Lesson 1's frame (journey-shell.js: the
// chapter trail, step dots, Back and Next, the fit beside the stage, the takeaways' band), with
// Lesson 2's chapters (practice-story.js), its pictures (practice-stage.js) and its activity,
// Ten afternoons (practice-afternoons.js).
import { t } from '../../i18n/runtime.js';
import { beatList } from '../choices/journey-story.js';
import { prefersReducedMotion } from '../choices/journey-motion.js';
import { TIGHT, createChapterTrail, createNarrationFit, createBand, watchDots, renderControls, kickerFor, titleFor, escapeHTML } from '../choices/journey-shell.js';
import { CHAPTERS } from './practice-story.js';
import { TAKEAWAY_ICONS } from './practice-pictures.js';
import { createPracticeStage } from './practice-stage.js';
import { createAfternoons, PHASES } from './practice-afternoons.js';

const $ = selector => document.querySelector(selector);
// Test only: ?stress=wide sets every word about 8% wider (journey.css), for the fit sweep.
if (new URLSearchParams(location.search).get('stress') === 'wide') document.documentElement.classList.add('stress-wide');

const beats = beatList(CHAPTERS);
const beatForHash = hash => beats.findIndex(item => item.fragment === hash.slice(1));
const journeyRoot = $('#journey');
const roots = { picture: $('#scene-practice'), activity: $('#scene-afternoons') };
const stage = createPracticeStage(roots.picture);
const afternoons = createAfternoons(roots.activity, {
  onPhase: () => { if (beats[index]?.beat.activity) renderNarration(beats[index], { animate: false, keepPanel: true }); },
});
let index = 0;
const seen = new Set();
let visible = null;

const updateTrail = createChapterTrail(CHAPTERS);
const fitNarration = createNarrationFit($('#narration-body'));
const sizeBand = createBand(journeyRoot);
watchDots($('#beat-dots'));

// ——— Narration ———
function renderNarration(item, { animate, keepPanel = false }) {
  const { beat } = item;
  const body = $('#narration-body');
  body.getAnimations().forEach(animation => animation.cancel());
  body.dataset.beat = beat.id;
  body.classList.remove(...TIGHT);
  journeyRoot.dataset.beat = beat.takeaways ? 'takeaways' : beat.id;
  $('#beat-kicker').textContent = kickerFor(item);
  $('#beat-heading').textContent = beat.heading;
  const paragraphs = beat.activity ? [t(PHASES[afternoons.phase])] : beat.body;
  $('#beat-text').innerHTML = paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('');
  const extra = $('#beat-extra');
  if (!(keepPanel && beat.activity)) extra.innerHTML = '';
  if (beat.activity && !keepPanel) afternoons.mountPanel(extra);
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
  const previous = beats[index];
  const sequential = animate && target === index + 1;
  index = target;
  seen.add(target);
  const item = beats[target];
  const fragment = `#${item.fragment}`;
  if (location.hash !== fragment) {
    if (history === 'push') window.history.pushState(null, '', fragment);
    else window.history.replaceState(null, '', fragment);
  }
  document.title = titleFor(item, t('practice.ui.title'));
  updateTrail(item.chapterIndex);
  if (!item.beat.activity) afternoons.hide();
  if (item.beat.activity) { switchTo('activity'); afternoons.enter(); } else switchTo('picture');
  renderNarration(item, { animate });
  renderControls({ beats, index, seen });
  if (!item.beat.activity) stage.show(item.beat.id, { from: sequential ? previous.beat.id : null, animate });
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
  if (event.target.closest('[data-end="restart"]')) { afternoons.restart(); go(0, { animate: false, focus: 'heading', history: 'push' }); }
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
$('#open-reading').addEventListener('click', () => dialog.showModal());
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

// A hook for the review captures and the fit sweep.
globalThis.journey = { go, beats, afternoons, stage, get index() { return index; } };

// ——— Start ———
go(Math.max(0, beatForHash(location.hash)), { animate: false });
document.documentElement.dataset.ready = 'true';
