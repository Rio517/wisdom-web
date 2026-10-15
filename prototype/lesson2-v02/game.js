// Round v02's shared game: Lesson 1's frame (the day feed on the left, the
// day rail, one card per activity on the right) with a pick screen and
// fourteen days. Each direction (e.js, f.js, g.js) adds its own way of
// showing that starting got easier, through the hooks below. Words come from
// copy.json; none live here.
import { t } from '../../src/i18n/runtime.js';
import { ICONS, ACTIVITY_ICON } from './icons.js';
import {
  KINDS, CHOICES, NO_PICKS, SKILLS, OTHERS, DAYS,
  replay, frontierIndex, startedKind, nextUsual, stage, startingGotEasier,
} from './model.js';

export { t, ICONS };
export const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const weekday = index => t(`v2.wd.${DAYS[index].weekday}`);

// Milliseconds after a choice lands. The starting change shows for at least
// 1.2 s before the feed moves on; a day that changes nothing moves on sooner.
export const TIMING = { bars: 650, highlight: 1900, advanceEasier: 2000, advanceStart: 1200, advanceQuiet: 800 };

const LETTERS = ['e', 'f', 'g', 'd'];
const hrefFor = letter => (letter === 'd' ? './d/d.html' : `./${letter}.html`);

/**
 * hooks:
 *  startMarkup(ctx, kind)            the starting row inside an activity's card
 *  paintStart(ctx, kind, { animate }) draw the starting row for the current state; animate when it just changed
 *  startChanged(ctx, kind, before, after) did starting visibly move? (tallies before and after the day)
 *  optionInner(ctx, index, option)   extra markup inside an option tile (E: the steps)
 *  onOptionTap(ctx, index, option, button) return true when the direction handled the tap itself (E's steps)
 *  onCurrent(ctx, index)             a day just became today (F: the habit picks first)
 *  cardExtra(ctx, index)             extra markup at the end of a day card (F: Next)
 *  onCardClick(ctx, index, event)    clicks inside a day card that aren't options (F: Next)
 */
export function startGame(app, direction, hooks = {}) {
  const params = new URLSearchParams(location.search);
  const de = params.get('lang') === 'de';
  const keep = de ? '?lang=de' : '';

  let picks = { ...NO_PICKS };
  let started = false;
  let choices = Array(DAYS.length).fill(null);
  let state = replay(choices, picks);
  let currentIndex = 0;
  let timers = [];
  let busy = false;
  const picked = () => KINDS.every(kind => picks[kind]);

  app.innerHTML = `<header class="v2-top">
      <a class="v2-brand" href="./index.html${keep}">${esc(t('v2.brand'))}<span>${esc(t('v2.brandSub'))}</span></a>
      <p class="v2-study"><span>${esc(t('v2.study'))}</span><strong>${esc(t('v2.dir.letter', { letter: direction.toUpperCase() }))} · ${esc(t(`v2.dir.${direction}`))}</strong></p>
      <nav class="v2-dirs" aria-label="${esc(t('v2.dirNav'))}">
        ${LETTERS.map(letter => `<a href="${hrefFor(letter)}${keep}" ${letter === direction ? 'aria-current="page"' : ''} title="${esc(t(`v2.dir.${letter}`))}">${letter.toUpperCase()}</a>`).join('')}
        <a class="v2-lang" href="${de ? location.pathname : `${location.pathname}?lang=de`}" lang="${de ? 'en' : 'de'}" title="${esc(t('v2.langLabel'))}">${esc(t(de ? 'v2.langBack' : 'v2.lang'))}</a>
        <button type="button" class="v2-restart">${esc(t('v2.restart'))}</button>
      </nav>
    </header>
    <main class="v2" data-direction="${direction}">
      <section class="v2-stage"><div class="scene-play">
        <ol class="play-feed" aria-label="${esc(t('v2.feedLabel'))}"></ol>
        <ol class="play-rail" aria-label="${esc(t('v2.railLabel'))}">${DAYS.map((day, index) => `<li class="play-rail-item"><button type="button" class="play-rail-tile" data-day="${index}" data-weekend="${day.weekend}" disabled>
          <span class="play-rail-icon" aria-hidden="true"></span><span class="play-rail-num" aria-hidden="true">${esc(t(`v2.wdShort.${day.weekday}`))}</span></button></li>`).join('')}</ol>
      </div></section>
      <aside class="v2-panel" aria-label="${esc(t('v2.panelLabel'))}"><div class="v2-boxes"></div></aside>
    </main>
    <p class="sr-only" role="status" aria-live="polite" data-role="live"></p>`;

  const main = app.querySelector('.v2');
  const feed = app.querySelector('.play-feed');
  const rail = app.querySelector('.play-rail');
  const boxes = app.querySelector('.v2-boxes');
  const live = app.querySelector('[data-role="live"]');

  const ctx = {
    direction, main, feed, boxes,
    get picks() { return picks; },
    get state() { return state; },
    get choices() { return choices; },
    get currentIndex() { return currentIndex; },
    activity: kind => picks[kind],
    name: kind => t(`v2.act.${picks[kind]}`),
    icon: kind => ICONS[ACTIVITY_ICON[picks[kind]]] ?? '',
    box: kind => boxes.querySelector(`.v2-box[data-kind="${kind}"]`),
    card: index => feed.querySelector(`.v2-day[data-day="${index}"]`),
    tile: (index, option) => feed.querySelector(`.v2-day[data-day="${index}"] .v2-opt[data-option="${option}"]`),
    optionLabel: option => (KINDS.includes(option) ? t(`v2.act.${picks[option]}`) : t(`v2.opt.${option}`)),
    later: (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id); return id; },
    choose: (index, option) => choose(index, option),
    announce,
    stageWord: kind => t(`v2.stage.${stage(direction, state.tally[kind])}`),
    reducedMotion,
  };

  // ——— Markup ———
  function optionIcon(option) {
    return KINDS.includes(option) ? ctx.icon(option) : ICONS[OTHERS[option].icon];
  }

  function pickCardMarkup() {
    return `<li class="play-card v2-pick" data-role="pick" aria-labelledby="v2-pick-heading">
      <h2 class="v2-pick-heading" id="v2-pick-heading" tabindex="-1">${esc(t('v2.pick.heading'))}</h2>
      ${KINDS.map(kind => `<div class="v2-pick-row">
        <p class="v2-row-label" id="v2-row-${kind}">${esc(t(`v2.pick.row.${kind}`))}</p>
        <ul class="play-options v2-pick-options" aria-labelledby="v2-row-${kind}">${CHOICES[kind].map(id => `<li>
          <button type="button" class="play-activity v2-pick-option" data-kind="${kind}" data-pick="${id}" aria-pressed="false">
            <span class="play-activity-icon">${ICONS[ACTIVITY_ICON[id]]}</span><span class="play-activity-label">${esc(t(`v2.act.${id}`))}</span>
          </button></li>`).join('')}</ul></div>`).join('')}
      <div class="v2-pick-actions">
        <button type="button" class="btn btn-quiet" data-action="random">${esc(t('v2.pick.random'))}</button>
        <button type="button" class="btn btn-primary" data-action="start" aria-disabled="true">${esc(t('v2.pick.start'))}</button>
      </div>
    </li>`;
  }

  function dayCardMarkup(day, index) {
    const tag = day.chance ? `<span class="chance-tag">${esc(t('v2.tag.bad'))}</span>` : '';
    return `<li class="play-card v2-day is-future" data-day="${index}" aria-labelledby="v2-wd-${index}">
      <div class="v2-day-top"><h2 class="v2-weekday" id="v2-wd-${index}" tabindex="-1">${esc(weekday(index))}</h2>${tag}</div>
      <p class="v2-next" data-role="next" hidden></p>
      ${day.line ? `<p class="v2-line">${esc(t(`v2.line.${day.line}`))}</p>` : ''}
      <ul class="play-options v2-options" aria-labelledby="v2-wd-${index}">${day.options.map(option => `<li>
        <button type="button" class="play-activity v2-opt" data-day="${index}" data-option="${option}" ${KINDS.includes(option) ? `data-kind="${option}"` : ''} aria-pressed="false" disabled>
          <span class="play-activity-icon">${optionIcon(option)}</span>
          <span class="play-activity-label">${esc(ctx.optionLabel(option))}</span>
          ${hooks.optionInner?.(ctx, index, option) ?? ''}
        </button></li>`).join('')}</ul>
      <div class="v2-result" data-role="result"></div>
      ${hooks.cardExtra?.(ctx, index) ?? ''}
    </li>`;
  }

  function endCardMarkup() {
    return `<li class="play-card v2-end" data-role="end" aria-labelledby="v2-end-heading" hidden>
      <h2 id="v2-end-heading" tabindex="-1">${esc(t('v2.end.heading'))}</h2>
      <p class="v2-end-line" data-role="end-first"></p>
      <p class="v2-end-line">${esc(t('v2.end.weeks'))}</p>
      <p class="v2-end-line">${esc(t('v2.end.missed'))}</p>
      <div class="v2-end-actions"><button type="button" class="btn btn-primary" data-action="again">${esc(t('v2.end.again'))}</button></div>
    </li>`;
  }

  function buildFeed() {
    feed.innerHTML = pickCardMarkup();
  }

  function buildDays() {
    feed.querySelectorAll('.v2-day, .v2-end').forEach(li => li.remove());
    if (!picked()) return;
    feed.insertAdjacentHTML('beforeend', `${DAYS.map(dayCardMarkup).join('')}${endCardMarkup()}`);
  }

  function boxMarkup(kind) {
    const activity = picks[kind];
    if (!activity) {
      return `<section class="v2-box is-empty" data-kind="${kind}" aria-hidden="true"><header><span class="v2-box-icon"></span><h3>&nbsp;</h3></header>
        <div class="v2-start"></div><div class="v2-skills">${[0, 1].map(() => '<div class="v2-skill"><span class="v2-skill-name">&nbsp;</span><span class="meter"></span></div>').join('')}</div></section>`;
    }
    const name = t(`v2.act.${activity}`);
    return `<section class="v2-box" data-kind="${kind}" aria-label="${esc(t('v2.sr.box', { activity: name }))}">
      <header><span class="v2-box-icon" aria-hidden="true">${ICONS[ACTIVITY_ICON[activity]]}</span><h3>${esc(name)}</h3></header>
      <div class="v2-start" role="img" data-role="start">${hooks.startMarkup?.(ctx, kind) ?? ''}<span class="v2-chip" aria-hidden="true" hidden>${esc(t('v2.chip.easier'))}</span></div>
      <div class="v2-skills">${SKILLS[activity].map(id => `<div class="v2-skill" data-skill="${id}">
        <span class="v2-skill-name">${esc(t(`v2.skill.${id}`))}</span>
        <span class="meter" data-group="${kind}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${esc(t('v2.sr.meter', { skill: t(`v2.skill.${id}`) }))}"><i class="fill" style="--level:0"></i></span>
      </div>`).join('')}</div>
    </section>`;
  }

  function buildPanel() {
    boxes.innerHTML = KINDS.map(boxMarkup).join('');
    for (const kind of KINDS) if (picks[kind]) paintBox(kind, { animate: false });
  }

  // ——— Painting ———
  function paintSkills(kind) {
    const box = ctx.box(kind);
    if (!box || !picks[kind]) return;
    for (const row of box.querySelectorAll('.v2-skill[data-skill]')) {
      const level = state.skills[kind][row.dataset.skill] ?? 0;
      const meter = row.querySelector('.meter');
      meter.querySelector('.fill').style.setProperty('--level', String(level));
      meter.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    }
  }

  function paintBox(kind, { animate }) {
    const box = ctx.box(kind);
    if (!box || !picks[kind]) return;
    hooks.paintStart?.(ctx, kind, { animate });
    box.querySelector('[data-role="start"]').setAttribute('aria-label', t('v2.sr.starting', { activity: ctx.name(kind), stage: ctx.stageWord(kind) }));
    paintSkills(kind);
  }

  function updatePick() {
    const card = feed.querySelector('.v2-pick');
    card.querySelectorAll('.v2-pick-option').forEach(button => {
      button.setAttribute('aria-pressed', String(picks[button.dataset.kind] === button.dataset.pick));
      button.disabled = started;
    });
    card.querySelector('.v2-pick-actions').hidden = started;
    card.querySelector('[data-action="start"]').setAttribute('aria-disabled', String(!picked()));
    card.classList.toggle('is-done', started);
  }

  function nextLine(index) {
    const before = state.log[index - 1];
    if (!before) return '';
    const missed = KINDS.find(kind => before.how[kind] === 'miss' || before.how[kind] === 'rest');
    if (!missed) return '';
    const next = nextUsual(index - 1, missed);
    if (next === -1) return '';
    return `<span class="v2-next-icon" aria-hidden="true">${ctx.icon(missed)}</span>${esc(t('v2.next', { activity: ctx.name(missed), weekday: weekday(next) }))}`;
  }

  function resultLine(index) {
    const entry = state.log[index];
    if (!entry) return '';
    const kind = startedKind(entry.option);
    if (kind && entry.how[kind] === 'other') return t('v2.result.other');
    if (KINDS.some(k => entry.how[k] === 'miss')) return t('v2.result.miss');
    if (KINDS.some(k => entry.how[k] === 'rest')) return t('v2.result.rest');
    return '';
  }

  function updateCard(index) {
    const li = ctx.card(index);
    if (!li) return;
    const chosen = choices[index];
    const future = !started || index > currentIndex;
    const current = started && index === currentIndex;
    li.classList.toggle('is-future', future);
    li.classList.toggle('is-current', current);
    li.classList.toggle('is-past', started && index < currentIndex);
    li.classList.toggle('is-chosen', chosen != null);
    li.querySelectorAll('.v2-opt').forEach(button => {
      const here = button.dataset.option === chosen;
      button.setAttribute('aria-pressed', String(here));
      button.classList.toggle('is-chosen', here);
      button.disabled = !current;
    });
    const next = li.querySelector('[data-role="next"]');
    const line = started && index <= currentIndex ? nextLine(index) : '';
    next.hidden = !line;
    next.innerHTML = line;
    const result = li.querySelector('[data-role="result"]');
    const text = resultLine(index);
    if (result.dataset.text !== text) { result.dataset.text = text; result.innerHTML = text ? `<p>${esc(text)}</p>` : ''; }
  }

  function updateRail(index) {
    const button = rail.querySelector(`.play-rail-tile[data-day="${index}"]`);
    const day = DAYS[index];
    const chosen = choices[index];
    const future = !started || index > currentIndex;
    const current = started && index === currentIndex;
    button.dataset.state = future ? 'future' : current ? 'current' : 'done';
    button.dataset.chosen = String(chosen != null);
    button.disabled = future || current;
    const usual = picks[day.usual] && !day.off ? day.usual : null;
    const icon = button.querySelector('.play-rail-icon');
    const show = chosen ?? usual;
    const want = show ? `${chosen ? 'c' : 'u'}:${show}` : '';
    if (icon.dataset.show !== want) { icon.dataset.show = want; icon.innerHTML = show ? optionIcon(show) : ''; }
    const status = chosen ? ctx.optionLabel(chosen) : current ? t('v2.sr.today') : usual ? t('v2.sr.usual', { activity: ctx.name(usual) }) : t('v2.sr.notYet');
    button.setAttribute('aria-label', t(day.week === 2 ? 'v2.sr.railWeek2' : 'v2.sr.rail', { weekday: weekday(index), status }));
  }

  function updateEnd() {
    const li = feed.querySelector('.v2-end');
    if (!li) return;
    const complete = started && currentIndex >= DAYS.length;
    li.hidden = !complete;
    li.classList.toggle('is-current', complete);
    li.querySelector('[data-role="end-first"]').textContent = t(startingGotEasier(state) ? 'v2.end.easier' : 'v2.end.still');
  }

  function updateAll() {
    if (started) for (let index = 0; index < DAYS.length; index += 1) { updateCard(index); }
    for (let index = 0; index < DAYS.length; index += 1) updateRail(index);
    updatePick();
    updateEnd();
    main.dataset.started = String(started);
  }

  // ——— Feed position ———
  function scrollToCard(li, { smooth = true } = {}) {
    if (!li) return;
    li.scrollIntoView({ behavior: smooth && !reducedMotion() ? 'smooth' : 'auto', block: 'center' });
  }

  function focusCard(li) {
    li?.querySelector('h2')?.focus({ preventScroll: true });
  }

  function announce(text) {
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = text; });
  }

  // ——— Playing a day ———
  /** Bring today's card up, let the direction act on it (F), and give it the keyboard. */
  function makeCurrent({ smooth = true, focus = true } = {}) {
    updateAll();
    const li = currentIndex >= DAYS.length ? feed.querySelector('.v2-end') : ctx.card(currentIndex);
    scrollToCard(li, { smooth });
    if (focus) focusCard(li);
    if (currentIndex < DAYS.length) hooks.onCurrent?.(ctx, currentIndex);
  }

  function choose(index, option) {
    if (busy || index !== currentIndex || choices[index] != null) return;
    busy = true;
    choices = choices.map((value, i) => (i === index ? option : value));
    state = replay(choices, picks);
    const entry = state.log[index];
    const kind = startedKind(option);
    // The day's card shows the choice; the rest of the feed waits.
    const li = ctx.card(index);
    li.querySelectorAll('.v2-opt').forEach(button => {
      const here = button.dataset.option === option;
      button.setAttribute('aria-pressed', String(here));
      button.classList.toggle('is-chosen', here);
    });
    li.classList.add('is-chosen');
    pop(ctx.tile(index, option)?.querySelector('.play-activity-icon'));
    updateCard(index);
    updateRail(index);
    pop(rail.querySelector(`.play-rail-tile[data-day="${index}"] .play-rail-icon`));

    let easier = false;
    if (kind) {
      const box = ctx.box(kind);
      easier = entry.how[kind] === 'usual' && Boolean(hooks.startChanged?.(ctx, kind, entry.before[kind], state.tally[kind]));
      box.classList.remove('is-changing');
      void box.offsetWidth;
      box.classList.add('is-changing');
      ctx.later(TIMING.highlight, () => box.classList.remove('is-changing'));
      if (easier) {
        hooks.paintStart?.(ctx, kind, { animate: true });
        const chip = box.querySelector('.v2-chip');
        chip.hidden = false;
        chip.classList.remove('is-on');
        void chip.offsetWidth;
        chip.classList.add('is-on');
        ctx.later(TIMING.highlight, () => { chip.classList.remove('is-on'); chip.hidden = true; });
      } else {
        hooks.paintStart?.(ctx, kind, { animate: false });
      }
      box.querySelector('[data-role="start"]').setAttribute('aria-label', t('v2.sr.starting', { activity: ctx.name(kind), stage: ctx.stageWord(kind) }));
      // Starting moves first; the skill bars follow, so the eye goes to starting.
      ctx.later(easier ? TIMING.bars : 150, () => paintSkills(kind));
    }
    const said = [t('v2.sr.day', { weekday: weekday(index), option: ctx.optionLabel(option) })];
    if (easier) said.push(t('v2.sr.easier', { activity: ctx.name(kind), stage: ctx.stageWord(kind) }));
    const result = resultLine(index);
    if (result) said.push(result);
    announce(said.join(' '));
    const wait = easier ? TIMING.advanceEasier : kind ? TIMING.advanceStart : TIMING.advanceQuiet;
    ctx.later(wait, () => {
      busy = false;
      currentIndex = frontierIndex(choices);
      makeCurrent();
    });
  }

  function pop(el) {
    if (!el || reducedMotion()) return;
    el.classList.remove('play-pop');
    void el.offsetWidth;
    el.classList.add('play-pop');
  }

  // ——— Pick screen ———
  function setPick(kind, id) {
    picks = { ...picks, [kind]: id };
    state = replay(choices, picks);
    buildPanel();
    buildDays();
    updateAll();
  }

  function startDays() {
    if (!picked() || started) return;
    started = true;
    currentIndex = 0;
    state = replay(choices, picks);
    buildPanel();
    makeCurrent();
  }

  function restart() {
    timers.forEach(clearTimeout);
    timers = [];
    busy = false;
    picks = { ...NO_PICKS };
    started = false;
    choices = Array(DAYS.length).fill(null);
    state = replay(choices, picks);
    currentIndex = 0;
    buildFeed();
    buildPanel();
    updateAll();
    hooks.onRestart?.(ctx);
    const pick = feed.querySelector('.v2-pick');
    scrollToCard(pick, { smooth: false });
    focusCard(pick);
  }

  // ——— Events ———
  feed.addEventListener('click', event => {
    const target = event.target;
    if (target.closest('[data-action="again"]')) { restart(); return; }
    const pickButton = target.closest('.v2-pick-option');
    if (pickButton && !started) { setPick(pickButton.dataset.kind, pickButton.dataset.pick); return; }
    if (target.closest('[data-action="random"]') && !started) {
      for (const kind of KINDS) picks[kind] = CHOICES[kind][Math.floor(Math.random() * CHOICES[kind].length)];
      setPick('sport', picks.sport);
      return;
    }
    if (target.closest('[data-action="start"]')) { startDays(); return; }
    const li = target.closest('.v2-day');
    if (!li) return;
    const index = Number(li.dataset.day);
    const button = target.closest('.v2-opt');
    if (button && !button.disabled && index === currentIndex && choices[index] == null && !busy) {
      if (hooks.onOptionTap?.(ctx, index, button.dataset.option, button)) return;
      choose(index, button.dataset.option);
      return;
    }
    hooks.onCardClick?.(ctx, index, event);
  });

  rail.addEventListener('click', event => {
    const button = event.target.closest('.play-rail-tile');
    if (!button || button.disabled) return;
    scrollToCard(ctx.card(Number(button.dataset.day)));
  });

  app.querySelector('.v2-restart').addEventListener('click', restart);

  buildFeed();
  buildPanel();
  updateAll();
  focusCard(feed.querySelector('.v2-pick'));
  jumpFromUrl();
  return ctx;

  /**
   * Review aid: `?at=N` picks gymnastics, cello and reading and lives the first
   * N days the scripted way (each day's usual activity, a fort on the rained-off
   * Thursday, the party on the second Monday), so a reviewer or the copy check
   * can open any day directly. `?at=15` opens the end card.
   */
  function jumpFromUrl() {
    const at = Number(params.get('at'));
    if (!at) return;
    picks = { sport: 'gymnastics', art: 'cello', quiet: 'reading' };
    started = true;
    const n = Math.min(DAYS.length, at - 1);
    choices = DAYS.map((day, i) => (i < n ? (i === 7 ? 'party' : i === 3 ? 'fort' : day.usual) : null));
    state = replay(choices, picks);
    currentIndex = n;
    buildPanel();
    buildDays();
    makeCurrent({ smooth: false });
  }
}
