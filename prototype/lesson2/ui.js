// Shared UI for the three Lesson 2 game directions: the frame, the panel
// (calendar, Starting tracks, skills), the card feed, the end card and the
// reader's own plan. Words come from the catalog (copy.json); none live here.
import { t } from '../../src/i18n/runtime.js';
import { SKILL_GROUPS } from '../../src/lessons/choices/journey-game.js';
import { skillBoxMarkup, setSkillBox } from '../../src/lessons/choices/journey-skills.js';
import { ICONS, routineIcon } from './icons.js';
import { DAYS, STAGES, WEEK_ONE_END, startingLevel, startingStage, bookStage, nextChance } from './model.js';

export { t, ICONS };
export const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ——— Words helpers ———
export const weekday = index => t(`l2.wd.${DAYS[index].weekday}`);
/** "Monday · First week" on the day a week starts; after that the weekday is enough (the calendar shows the week). */
export const dayLabel = index => (index === 0 || index === WEEK_ONE_END + 1
  ? t('l2.day.label', { weekday: weekday(index), week: t(`l2.week.${DAYS[index].week}`) })
  : weekday(index));
export const routineWord = routine => t(`l2.routine.${routine}`);
export const RoutineWord = routine => t(`l2.Routine.${routine}`);
export const momentYour = moment => t(`l2.moment.${moment}.your`);
export const stageWord = level => t(`l2.start.stage.${startingStage(level)}`);
export const listOf = items => new Intl.ListFormat(t.locale, { type: 'conjunction' }).format(items);
export function situation(index, routine = 'cello') {
  const day = DAYS[index];
  return day.event === 'snag' ? t(`l2.d10.${routine}`) : t(`l2.${day.id}`);
}
/** "Next chance: Tuesday, after your snack." With `routine`, names it (two routines in play). */
export function nextChanceLine(index, moment, cardIndex, routine = null) {
  const chance = nextChance(index, moment);
  if (!chance) return '';
  const today = chance.index === cardIndex;
  const values = { moment: momentYour(moment), weekday: weekday(chance.index), routine: routine ? routineWord(routine) : '' };
  if (routine) return t(today ? 'l2.nextForToday' : 'l2.nextFor', values);
  return t(today ? 'l2.nextToday' : 'l2.next', values);
}

// ——— Frame ———
const LETTERS = ['a', 'b', 'c'];
export function mountFrame(app, direction, { onRestart } = {}) {
  const params = new URLSearchParams(location.search);
  const de = params.get('lang') === 'de';
  const langHref = de ? location.pathname : `${location.pathname}?lang=de`;
  const keep = de ? '?lang=de' : '';
  app.innerHTML = `<header class="l2-top">
      <a class="l2-brand" href="./index.html${keep}">Wisdom<span>${esc(t('l2.brandSub'))}</span></a>
      <p class="l2-study"><span>${esc(t('l2.study'))}</span><strong>${esc(t('l2.dir.letter', { letter: direction.toUpperCase() }))} · ${esc(t(`l2.dir.${direction}`))}</strong></p>
      <nav class="l2-dirs" aria-label="${esc(t('l2.dirNav'))}">
        ${LETTERS.map(letter => `<a href="./${letter}.html${keep}" ${letter === direction ? 'aria-current="page"' : ''} title="${esc(t(`l2.dir.${letter}`))}">${letter.toUpperCase()}</a>`).join('')}
        <a class="l2-lang" href="${langHref}" lang="${de ? 'en' : 'de'}" title="${esc(t('l2.langLabel'))}">${esc(t(de ? 'l2.langBack' : 'l2.lang'))}</a>
        <button type="button" class="l2-restart">${esc(t('l2.restart'))}</button>
      </nav>
    </header>
    <main class="l2" data-direction="${direction}">
      <section class="l2-stage"><ol class="l2-feed" aria-label="${esc(t('l2.feedLabel'))}"></ol></section>
      <aside class="l2-panel" aria-label="${esc(t('l2.panel.kicker'))}"></aside>
    </main>
    <p class="sr-only" role="status" aria-live="polite" data-role="live"></p>`;
  app.querySelector('.l2-restart').addEventListener('click', () => onRestart?.());
  const feed = app.querySelector('.l2-feed');
  feed.addEventListener('wheel', stopScroll, { passive: true });
  feed.addEventListener('touchstart', stopScroll, { passive: true });
  return { feed, panel: app.querySelector('.l2-panel'), live: app.querySelector('[data-role="live"]') };
}

export function announce(live, text) {
  live.textContent = '';
  // A fresh node each time so the same words are read again.
  requestAnimationFrame(() => { live.textContent = text; });
}

/**
 * How long a card that plays by itself stays before the next day: about
 * three words a second (a ten-year-old reading every word), at least 3 s.
 */
export function readingTime(el) {
  let words = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement.closest('.sr-only, [hidden]')) words += node.textContent.split(/\s+/).filter(Boolean).length;
  }
  return Math.max(3000, words * 330);
}

// ——— Feed: cards, scrolling, focus ———
let scrollRaf = 0;
function stopScroll() { if (scrollRaf) cancelAnimationFrame(scrollRaf); scrollRaf = 0; }

/** Bring a new card in a little above the middle, with earlier days above it. */
export function scrollFeedTo(feed, li) {
  const free = feed.clientHeight - li.offsetHeight;
  scrollFeedTop(feed, Math.max(0, li.offsetTop - Math.max(24, free * 0.4)));
}

/** After a result appears, bring the end of the card into view if it isn't. */
export function revealEnd(feed, li) {
  const bottom = li.offsetTop + li.offsetHeight + 24 - feed.clientHeight;
  if (bottom > feed.scrollTop) scrollFeedTop(feed, bottom);
}

/** Scroll the feed in at most 420 ms; a wheel or touch stops it. Reduced motion jumps. */
export function scrollFeedTop(feed, top) {
  stopScroll();
  if (reducedMotion()) { feed.scrollTop = top; return; }
  const start = feed.scrollTop;
  const delta = top - start;
  if (Math.abs(delta) < 2) return;
  const t0 = performance.now();
  const duration = 420;
  const ease = p => 1 - (1 - p) ** 3;
  const step = now => {
    const p = Math.min(1, (now - t0) / duration);
    feed.scrollTop = start + delta * ease(p);
    scrollRaf = p < 1 ? requestAnimationFrame(step) : 0;
  };
  scrollRaf = requestAnimationFrame(step);
}

/** Append a card and make it the current one: earlier cards go quiet. */
export function addCard(feed, html, { className = '', focus = true, scroll = true, day = null } = {}) {
  feed.querySelectorAll('.l2-card.is-current').forEach(card => {
    card.classList.remove('is-current');
    card.classList.add('is-past');
    card.querySelectorAll('button, input').forEach(control => { if (!control.closest('.l2-keep-live')) control.disabled = true; });
  });
  const li = document.createElement('li');
  li.className = `l2-card is-current ${className}`.trim();
  if (day !== null) li.dataset.day = String(day);
  li.innerHTML = html;
  feed.append(li);
  if (scroll) scrollFeedTo(feed, li);
  if (focus) li.querySelector('[data-focus]')?.focus({ preventScroll: true });
  return li;
}

export function clearFeed(feed) { stopScroll(); feed.innerHTML = ''; feed.scrollTop = 0; }

// ——— Cards ———
export function dayHead(index, { routine = 'cello', next = [] } = {}) {
  const day = DAYS[index];
  const tag = day.chance ? `<span class="l2-tag" data-chance="${day.chance}">${esc(t(`l2.tag.${day.chance}`))}</span>`
    : (day.kind === 'weekend' || day.kind === 'sunday') ? `<span class="l2-tag" data-chance="weekend">${esc(t('l2.tag.weekend'))}</span>` : '';
  const lines = [].concat(next).filter(Boolean);
  return `<p class="l2-day">${esc(dayLabel(index))}${tag}</p>
    ${lines.map(line => `<p class="l2-next">${ICONS.clock}<span>${esc(line)}</span></p>`).join('')}
    <h2 class="l2-situation" tabindex="-1" data-focus>${esc(situation(index, routine))}</h2>`;
}

/** A row reminding the reader of the cue and the set-up. */
export function cueLine(routine, moment, setup) {
  return `<p class="l2-cue"><span class="l2-cue-item">${ICONS[moment]}<span>${esc(t('l2.cue', { moment: momentYour(moment) }))}</span></span>
    <span class="l2-cue-item">${ICONS[setup]}<span>${esc(t(`l2.setup.${setup}.your`))}</span></span></p>`;
}

/** Option buttons. Each option: { label, kind, icon }. No captions: the labels say what each afternoon is, and none is the answer. */
export function optionsMarkup(options, { name = '' } = {}) {
  return `<ul class="l2-options" data-count="${options.length}" ${name ? `aria-label="${esc(name)}"` : ''}>${options.map((option, i) => `<li>
    <button type="button" class="l2-opt" data-option="${i}" data-kind="${option.kind}" aria-pressed="false">
      <span class="l2-opt-icon">${ICONS[option.icon] ?? ''}</span>
      <span class="l2-opt-label">${esc(option.label)}</span>
    </button></li>`).join('')}</ul>`;
}

export function markChosen(container, button) {
  container.querySelectorAll('.l2-opt, .l2-chip-choice').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
}

/**
 * "Starting · Easier today." — the track's move, in words, on the card. The
 * stage itself is on the panel's track; screen readers hear both here.
 */
export function startChip(routine, entry) {
  const move = moveOf(entry);
  return `<p class="l2-start-chip" data-move="${move}"><span class="l2-chip-icon">${routineIcon(routine)}</span>
    <span><span class="sr-only">${esc(t(`l2.start.title.${routine}`))}: ${esc(stageWord(entry.after))}. </span><span aria-hidden="true">${esc(t('l2.start.chipLabel'))} · </span><span class="l2-chip-move">${esc(t(`l2.start.delta.${move}`))}</span></span></p>`;
}

// ——— Panel ———
export function createPanel(aside, { routines, soccerSetUp = false }) {
  aside.dataset.routines = String(routines.length);
  const tile = index => `<li><span class="l2-tile" data-day="${index}" data-state="later" data-weekend="${DAYS[index].kind === 'weekend' || DAYS[index].kind === 'sunday'}">
      <span class="l2-tile-wd" aria-hidden="true">${esc(t(`l2.wdShort.${DAYS[index].weekday}`))}</span><span class="l2-tile-icons" aria-hidden="true"></span>
      <span class="sr-only" data-role="status"></span></span></li>`;
  const week = number => `<div class="l2-cal-week"><span class="l2-cal-label">${esc(t(`l2.week.${number}`))}</span>
      <ol class="l2-cal-days">${DAYS.map((day, index) => (day.week === number ? tile(index) : '')).join('')}</ol></div>`;
  const track = routine => `<div class="l2-start" data-routine="${routine}">
      <div class="l2-start-head"><h3>${routineIcon(routine)}<span>${esc(t(`l2.start.title.${routine}`))}</span></h3><strong class="l2-start-word" data-stage="0">${esc(t('l2.start.stage.0'))}</strong></div>
      <div class="l2-track" role="meter" aria-label="${esc(t(`l2.start.title.${routine}`))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="${esc(t('l2.start.stage.0'))}">
        <span class="l2-track-base"></span><span class="l2-track-fill"></span>
        ${STAGES.slice(1).map(at => `<span class="l2-track-tick" style="--at:${at}"></span>`).join('')}
        <span class="l2-track-marker"></span>
      </div>
      <div class="l2-track-ends" aria-hidden="true"><span>${esc(t('l2.start.stage.0'))}</span><span>${esc(t('l2.start.stage.3'))}</span></div>
      <p class="l2-start-delta" data-move="none">${esc(t('l2.start.delta.none'))}</p>
    </div>`;
  const book = `<section class="skill-box l2-book" aria-label="${esc(t('l2.book.title'))}">
      <header><h3>${ICONS.book}<span class="box-title">${esc(t('l2.book.title'))}</span></h3><span class="box-note">${esc(t('l2.book.note'))}</span></header>
      <div class="skill-row"><span class="skill-name">${esc(t('l2.book.meter'))}</span>
        <div class="meter" data-group="book" role="meter" aria-label="${esc(t('l2.book.meter'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="carried" style="--level:0"></i><i class="fill" style="--level:0;--from:0"></i></div>
        <span class="skill-meta"><span class="skill-word">${esc(t('l2.book.stage.0'))}</span></span></div>
    </section>`;
  aside.innerHTML = `<section class="l2-starts">${routines.map(track).join('')}<p class="l2-help">${esc(t('l2.start.help'))}</p></section>
    <div class="l2-cal" aria-label="${esc(t('l2.cal.label'))}">${week(1)}${week(2)}</div>
    <section class="l2-skills" aria-label="${esc(t('l2.skills.kicker'))}">
      <p class="kicker l2-panel-kicker">${esc(t('l2.skills.kicker'))}</p>
      <div class="l2-boxes" data-count="${routines.length + 1}">
        ${routines.includes('cello') ? skillBoxMarkup({ id: 'l2-cello', group: 'cello', title: t('game.group.cello'), skills: SKILL_GROUPS.cello.skills }) : ''}
        ${routines.includes('reading') ? book : ''}
        ${skillBoxMarkup({ id: 'l2-soccer', group: 'soccer', title: t('game.group.soccer'), skills: SKILL_GROUPS.soccer.skills })}
      </div>
      <p class="l2-help">${esc(t('l2.skills.help'))}</p>
    </section>
    <p class="illustration-note">${esc(t('l2.panel.note'))}</p>`;
  if (soccerSetUp) {
    const note = aside.querySelector('#l2-soccer .box-note');
    note.innerHTML = `<span class="l2-setup-note" title="${esc(t('l2.soccer.setUpHelp'))}">${esc(t('l2.soccer.setUp'))}</span>`;
    aside.querySelector('#l2-soccer header').insertAdjacentHTML('afterend', `<p class="l2-soccer-help">${esc(t('l2.soccer.setUpHelp'))}</p>`);
  }

  function setTrack(routine, level, move) {
    const el = aside.querySelector(`.l2-start[data-routine="${routine}"]`);
    if (!el) return;
    const stage = startingStage(level);
    const trackEl = el.querySelector('.l2-track');
    trackEl.style.setProperty('--level', String(level));
    trackEl.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    trackEl.setAttribute('aria-valuetext', t(`l2.start.stage.${stage}`));
    const word = el.querySelector('.l2-start-word');
    word.textContent = t(`l2.start.stage.${stage}`);
    word.dataset.stage = String(stage);
    el.querySelectorAll('.l2-track-tick').forEach(tick => { tick.dataset.passed = String(level >= Number(tick.style.getPropertyValue('--at'))); });
    const delta = el.querySelector('.l2-start-delta');
    delta.dataset.move = move;
    delta.textContent = t(`l2.start.delta.${move}`);
    if (move !== 'still') {
      delta.classList.remove('is-new');
      void delta.offsetWidth; // restart the short highlight
      delta.classList.add('is-new');
    }
  }

  function tileIcons(entry) {
    const icons = [];
    for (const [routine, item] of Object.entries(entry.routines)) {
      if (item.how === 'moment' || item.how === 'other') icons.push({ icon: routine === 'cello' ? 'celloSmall' : 'book', moment: item.how === 'moment' });
    }
    if (entry.soccer.length) icons.push({ icon: 'soccerSmall' });
    if (icons.length < 2) {
      const others = Object.values(entry.routines);
      const unlucky = Object.keys(entry.routines).find(routine => entry.routines[routine].how === 'luck');
      if (others.some(item => item.how === 'skip')) icons.push({ icon: others.find(item => item.how === 'skip').icon ?? 'friends' });
      else if (unlucky) icons.push({ icon: unlucky === 'cello' ? 'snap' : 'backpack' });
      else if (others.some(item => item.how === 'rest')) icons.push({ icon: 'restSmall' });
    }
    return icons.slice(0, 2);
  }

  function tileStatus(entry) {
    const parts = Object.entries(entry.routines).map(([routine, item]) => t(`l2.cal.did.${item.how}`, { routine: routineWord(routine) }));
    if (entry.soccer.length) parts.push(t('l2.cal.soccer'));
    return listOf([...new Set(parts)]);
  }

  /** Bring the panel up to date with a life and the current day index. */
  function update(life, { current = -1, moves = {} } = {}) {
    for (const routine of routines) {
      const level = startingLevel(life.tally[routine]);
      setTrack(routine, level, moves[routine] ?? (life.log.length ? 'still' : 'none'));
    }
    const cello = aside.querySelector('#l2-cello');
    if (cello) setSkillBox(cello, life.levels);
    setSkillBox(aside.querySelector('#l2-soccer'), life.levels);
    const bookEl = aside.querySelector('.l2-book');
    if (bookEl) {
      const fill = bookEl.querySelector('.fill');
      fill.style.setProperty('--level', String(life.book));
      bookEl.querySelector('.meter').setAttribute('aria-valuenow', String(Math.round(life.book * 100)));
      const word = t(`l2.book.stage.${bookStage(life.book)}`);
      bookEl.querySelector('.meter').setAttribute('aria-valuetext', word);
      bookEl.querySelector('.skill-word').textContent = word;
    }
    const lived = new Map(life.log.map(entry => [entry.index, entry]));
    aside.querySelectorAll('.l2-tile').forEach(tileEl => {
      const index = Number(tileEl.dataset.day);
      const entry = lived.get(index);
      const state = entry ? 'done' : index === current ? 'today' : 'later';
      tileEl.dataset.state = state;
      const icons = entry ? tileIcons(entry) : [];
      const key = icons.map(item => item.icon).join(',');
      const holder = tileEl.querySelector('.l2-tile-icons');
      if (holder.dataset.key !== key) {
        holder.dataset.key = key;
        holder.dataset.count = String(icons.length);
        holder.innerHTML = icons.map(item => `<span class="l2-tile-icon">${ICONS[item.icon] ?? ''}</span>`).join('');
      }
      const status = entry ? tileStatus(entry) : t(state === 'today' ? 'l2.cal.today' : 'l2.cal.later');
      tileEl.querySelector('[data-role="status"]').textContent = t('l2.cal.tile', { weekday: weekday(index), week: t(`l2.week.${DAYS[index].week}`), status });
    });
  }

  return { update };
}

/**
 * Which way a routine's Starting moved on a day: first (the very first start,
 * which has nothing to be easier than) · up · small · still · down.
 */
export function moveOf(item) {
  if (item.moved === 'down') return 'down';
  if (item.moved !== 'up') return 'still';
  if (item.before === 0) return 'first';
  return item.after - item.before < 0.06 ? 'small' : 'up';
}

export function movesFor(entry) {
  return Object.fromEntries(Object.entries(entry.routines).map(([routine, item]) => [routine, moveOf(item)]));
}

// ——— End card and the reader's own plan ———
const stageKey = level => ['push', 'little', 'easier', 'normal'][startingStage(level)];

export function endCardMarkup(life, routines) {
  const levels = Object.fromEntries(routines.map(routine => [routine, startingLevel(life.tally[routine])]));
  const best = Math.max(...Object.values(levels));
  const easier = startingStage(best) > 0;
  const skipped = routines.some(routine => life.tally[routine].skips > 0);
  const tracks = routines.map(routine => `<div class="l2-end-track">
      <p class="l2-end-track-head">${routineIcon(routine)}<strong>${esc(t(`l2.start.title.${routine}`))}</strong><span>${esc(stageWord(levels[routine]))}</span></p>
      <div class="l2-track is-static" style="--level:${levels[routine]}" aria-hidden="true"><span class="l2-track-base"></span><span class="l2-track-fill"></span>
        ${STAGES.slice(1).map(at => `<span class="l2-track-tick" style="--at:${at}" data-passed="${levels[routine] >= at}"></span>`).join('')}<span class="l2-track-marker"></span></div>
      <p>${esc(t(`l2.end.journey.${routine}`, { stage: stageKey(levels[routine]) }))}</p>
    </div>`).join('');
  return `<p class="kicker">${esc(t('l2.end.kicker'))}</p>
    <h2 class="l2-end-heading" tabindex="-1" data-focus>${esc(t(easier ? 'l2.end.heading' : 'l2.end.headingStill'))}</h2>
    <div class="l2-end-tracks">${tracks}</div>
    <p class="l2-end-p">${esc(t(easier ? 'l2.end.why' : 'l2.end.whyStill'))}</p>
    <p class="l2-end-p">${esc(t('l2.end.skill'))}</p>
    <p class="l2-end-p l2-end-strong">${esc(t('l2.end.time'))}</p>
    <p class="l2-end-p">${esc(t(skipped ? 'l2.end.missed' : 'l2.end.missedNone'))}</p>
    <p class="illustration-note">${esc(t('l2.end.note'))}</p>`;
}

export function ownPlanMarkup() {
  const field = (key, id) => `<label class="l2-own-field" for="l2-own-${id}"><span>${esc(t(`l2.own.${key}`))}</span>
      <input id="l2-own-${id}" type="text" autocomplete="off" placeholder="${esc(t(`l2.own.${key}Hint`))}"></label>`;
  return `<p class="kicker">${esc(t('l2.own.kicker'))}</p>
    <h2 class="l2-own-heading" tabindex="-1">${esc(t('l2.own.heading'))}</h2>
    <p class="l2-own-text">${esc(t('l2.own.text'))}</p>
    <form class="l2-own-form l2-keep-live">
      <p class="l2-own-sheet-title" aria-hidden="true">${esc(t('l2.own.sheetTitle'))}</p>
      ${field('what', 'what')}${field('moment', 'moment')}${field('ready', 'ready')}${field('missed', 'missed')}
      <p class="l2-own-footer">${esc(t('l2.own.footer'))}</p>
    </form>
    <div class="l2-own-actions l2-keep-live">
      <button type="button" class="btn btn-primary" data-action="print">${esc(t('l2.own.print'))}</button>
      <button type="button" class="btn btn-quiet" data-action="again">${esc(t('l2.end.again'))}</button>
    </div>`;
}

/** Add the end card and the own-plan card; wire print and play again. */
export function finish(feed, life, routines, { onAgain }) {
  const end = addCard(feed, endCardMarkup(life, routines), { className: 'l2-end' });
  const own = document.createElement('li');
  own.className = 'l2-card l2-own is-current';
  own.innerHTML = ownPlanMarkup();
  feed.append(own);
  // Nothing is sent: Enter in a field must not submit the form anywhere.
  own.querySelector('form').addEventListener('submit', event => event.preventDefault());
  own.querySelector('[data-action="print"]').addEventListener('click', () => window.print());
  own.querySelector('[data-action="again"]').addEventListener('click', () => onAgain());
  return { end, own };
}
