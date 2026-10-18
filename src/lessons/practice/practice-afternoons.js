// Ten afternoons: Lesson 2's activity (design 003 v03 · A; revived from Lesson 1's old activity,
// journey-play.js, with its model, skill boxes and styles). One afternoon's card at a time with
// three picture choices, the next one waiting below it; a rail of the ten afternoons on the right,
// where an earlier one can be opened and changed (every later afternoon recomputes); the soccer
// and cello boxes in the story column grow from what was picked. On afternoon 7 a basketball box
// opens in the card with a head start from soccer. After the tenth, the end card and Start again.
// No meters but the skill bars, no numbers, nothing that shrinks.
import { t } from '../../i18n/runtime.js';
import { ICONS } from '../choices/journey-icons.js';
import { setSkillBox } from '../choices/journey-skills.js';
import { frontierIndex } from '../choices/journey-play.js';
import { prefersReducedMotion } from '../choices/journey-motion.js';
import { escapeHTML } from '../choices/journey-shell.js';
import { DAYS, ACTIVITIES, SKILLS, SKILL_WORD, OPENS, activityGroup, replay, endLines } from './practice-afternoons-data.js';
import { kindLabel } from './practice-story.js';
import { skillBox } from './practice-pictures.js';

const ADVANCE = 650; // ms the picked choice shows before the next afternoon comes up
const weekday = index => t(`game.weekday.${DAYS[index].weekday}`);
const dayLabel = index => t('practice.activity.dayLabel', { n: index + 1, total: DAYS.length, weekday: weekday(index) });
const rows = group => SKILLS[group].map(id => ({ id, name: t(`practice.skill.${SKILL_WORD[id] ?? id}`) }));
const box = (group, extra = {}) => skillBox({ group, title: t(`game.group.${group}`), rows: rows(group), ...extra });

/** The words for the story column at each moment: before afternoon 7, from it on, and at the end. */
export const PHASES = { start: 'practice.beat.afternoons.body.start', new: 'practice.beat.afternoons.body.new', end: 'practice.beat.afternoons.body.end' };

export function createAfternoons(root, { onPhase = () => {} } = {}) {
  let choices = Array(DAYS.length).fill(null);
  let state = replay(choices);
  let shown = 0; // the afternoon on the card, or DAYS.length for the end card
  let panel = null;
  let timer = null;
  let phase = 'start';

  root.innerHTML = `<div class="play-feed" data-role="feed" aria-label="${escapeHTML(t('practice.activity.feedLabel'))}"></div>
    <ol class="play-rail" aria-label="${escapeHTML(t('practice.activity.railLabel'))}">${DAYS.map((_, index) => `<li class="play-rail-item"><button type="button" class="play-rail-tile" data-day="${index}">
      <span class="play-rail-icon" aria-hidden="true"></span><span class="play-rail-num" aria-hidden="true">${index + 1}</span></button></li>`).join('')}</ol>
    <p class="sr-only" role="status" aria-live="polite" data-role="live"></p>`;
  const feed = root.querySelector('[data-role="feed"]');
  const rail = root.querySelector('.play-rail');
  const live = root.querySelector('[data-role="live"]');

  const frontier = () => frontierIndex(choices);

  function option(index, id) {
    const activity = ACTIVITIES[id];
    const picked = choices[index] === id;
    return `<li><button type="button" class="play-activity${picked ? ' is-chosen' : ''}" data-day="${index}" data-activity="${id}" aria-pressed="${picked}">
      <span class="play-activity-icon">${ICONS[activity.icon]}</span>
      <span class="play-activity-label">${escapeHTML(t(`practice.activity.option.${id}`))}</span>
      <span class="play-activity-kind">${escapeHTML(kindLabel(activity))}</span></button></li>`;
  }

  function card(index, { waiting = false } = {}) {
    const day = DAYS[index];
    const opens = index === OPENS && !waiting;
    return `<article class="play-card ${waiting ? 'is-future' : 'is-active'}" data-day="${index}" aria-labelledby="play-heading-${index}"${waiting ? ' aria-hidden="true"' : ''}>
      <p class="play-day-label">${escapeHTML(dayLabel(index))}${day.chance ? `<span class="chance-tag">${escapeHTML(t('practice.activity.new'))}</span>` : ''}</p>
      <h2 class="play-heading" id="play-heading-${index}">${escapeHTML(t(`practice.activity.day${index + 1}`))}</h2>
      <ul class="play-options" aria-labelledby="play-heading-${index}">${day.options.map(id => option(index, id)).join('')}</ul>
      ${opens ? `<div class="card-box">${box('basketball', { isNew: true, note: t('practice.activity.new'), id: 'play-basketball' })}<p class="box-key">${escapeHTML(t('practice.stripes'))}</p></div>` : ''}
    </article>`;
  }

  function endCard() {
    return `<article class="play-card play-end is-active" aria-labelledby="play-end-heading">
      <h2 id="play-end-heading" tabindex="-1">${escapeHTML(t('practice.activity.end.heading'))}</h2>
      <ul class="play-summary-list">${endLines(choices, state.levels, state.carried, t).map(line => `<li>${escapeHTML(line)}</li>`).join('')}</ul>
      <div class="card-box">${box('basketball', { id: 'play-basketball' })}</div>
      <div class="play-end-actions"><button type="button" class="solid-pill" data-action="again">${escapeHTML(t('practice.activity.end.again'))}</button></div>
    </article>`;
  }

  function setPhase() {
    const next = shown >= DAYS.length ? 'end' : shown >= OPENS && state.open ? 'new' : 'start';
    if (next === phase) return;
    phase = next;
    onPhase(phase);
  }

  function renderFeed({ arrive = false, focus = false } = {}) {
    feed.innerHTML = shown >= DAYS.length ? endCard() : card(shown) + (shown + 1 < DAYS.length ? card(shown + 1, { waiting: true }) : '');
    const basket = feed.querySelector('#play-basketball');
    if (basket) setSkillBox(basket, state.levels, { carried: state.carried ?? {} });
    if (arrive && !prefersReducedMotion()) feed.querySelector('.play-card').classList.add('is-arriving');
    if (focus) (feed.querySelector('.play-activity, #play-end-heading'))?.focus({ preventScroll: true });
  }

  function renderRail() {
    const edge = frontier();
    rail.querySelectorAll('.play-rail-tile').forEach(button => {
      const index = Number(button.dataset.day);
      const id = choices[index];
      const reachable = index <= edge;
      button.dataset.activity = id ?? '';
      button.dataset.chosen = String(Boolean(id));
      button.dataset.state = index === shown ? 'current' : reachable ? 'done' : 'future';
      button.disabled = !reachable;
      if (index === shown) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      const status = id ? t(`practice.activity.option.${id}`) : index === edge ? t('practice.activity.rail.today') : t('practice.activity.rail.notYet');
      button.setAttribute('aria-label', `${dayLabel(index)}: ${status}`);
      button.querySelector('.play-rail-icon').innerHTML = id ? ICONS[ACTIVITIES[id].icon] : '';
    });
  }

  function renderPanel(grown = null) {
    if (!panel) return;
    if (!panel.querySelector('#play-soccer')) panel.innerHTML = `<div class="panel-boxes">${box('soccer', { id: 'play-soccer' })}${box('cello', { id: 'play-cello' })}</div>`;
    for (const group of ['soccer', 'cello']) {
      const element = panel.querySelector(`#play-${group}`);
      setSkillBox(element, state.levels);
      if (grown === group && !prefersReducedMotion()) {
        element.classList.remove('is-growing');
        void element.offsetWidth;
        element.classList.add('is-growing');
      }
    }
  }

  function show(index, options = {}) {
    clearTimeout(timer);
    shown = Math.max(0, Math.min(DAYS.length, index));
    renderFeed(options);
    renderRail();
    setPhase();
  }

  function pick(index, id) {
    if (index > frontier()) return;
    const first = choices[index] == null;
    choices = choices.map((value, position) => (position === index ? id : value));
    state = replay(choices);
    const group = activityGroup(ACTIVITIES[id]);
    live.textContent = t('practice.activity.announce', { weekday: weekday(index), activity: t(`practice.activity.option.${id}`), result: t(`practice.activity.grew.${group}`) });
    feed.querySelectorAll(`.play-activity[data-day="${index}"]`).forEach(button => {
      const on = button.dataset.activity === id;
      button.setAttribute('aria-pressed', String(on));
      button.classList.toggle('is-chosen', on);
    });
    const basket = feed.querySelector('#play-basketball');
    if (basket) setSkillBox(basket, state.levels, { carried: state.carried ?? {} });
    renderPanel(group);
    renderRail();
    clearTimeout(timer);
    // A first pick moves on to the next afternoon; changing an earlier one stays on it.
    if (first) timer = setTimeout(() => { timer = null; show(frontier(), { arrive: true, focus: true }); }, prefersReducedMotion() ? 0 : ADVANCE);
  }

  function restart() {
    choices = Array(DAYS.length).fill(null);
    state = replay(choices);
    renderPanel();
    show(0, { arrive: true, focus: true });
  }

  feed.addEventListener('click', event => {
    if (event.target.closest('[data-action="again"]')) { restart(); return; }
    const button = event.target.closest('.play-activity');
    if (button && !button.closest('.is-future')) pick(Number(button.dataset.day), button.dataset.activity);
  });
  rail.addEventListener('click', event => {
    const button = event.target.closest('.play-rail-tile');
    if (button && !button.disabled) show(Number(button.dataset.day), { arrive: true });
  });

  show(0);
  return {
    /** Put the soccer and cello boxes into the story column. */
    mountPanel(container) { panel = container; panel.innerHTML = ''; renderPanel(); },
    get phase() { return phase; },
    /** Leave: a pending move to the next afternoon happens now, unseen (the picks stay). */
    hide() { if (timer) { clearTimeout(timer); timer = null; shown = frontier(); } },
    restart,
    /** Arrive: the afternoon left on screen, drawn again. */
    enter() { show(shown); },
    // Test and capture hooks: pick a list of activity ids from the first afternoon, or open one afternoon.
    playThrough(ids) { choices = Array(DAYS.length).fill(null).map((_, i) => ids[i] ?? null); state = replay(choices); renderPanel(); show(frontier()); },
    open: index => show(index),
    get choices() { return [...choices]; },
  };
}
