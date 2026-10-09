// Direction D · Three things, two weeks. Lesson 1's game (journey-play.js:
// the card feed, three picture options a day, the day rail, skill boxes on
// the right) with fourteen days, the reader's own three activities, and one
// new thing: each home activity's card shows how easy it has become to start.
// Two looks for the change on the right: Lines (a line carries the tap to
// the card; the Starting row is a path) and Glow (the card lights up; the
// card's icon brightens as starting gets easier). Words: copy.json, l2.d.*.
import { t, esc, mountFrame, announce, ownPlanMarkup } from './ui.js';
import { skillBoxMarkup, setSkillBox } from '../../src/lessons/choices/journey-skills.js';
import { prefersReducedMotion } from '../../src/lessons/choices/journey-motion.js';
import { ICONS, ACTIVITY_ICON } from './icons-d.js';
import {
  DAYS, KINDS, HOME, CHOICES, DEFAULT_PICKS, SKILLS,
  replay, frontierIndex, startingStage, lightStep, startingGotEasier,
} from './model-d.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Milliseconds after a tap (the spec's timeline for each look).
const TIMING = {
  lines: { land: 450, change: 500, chips: 600, advance: 1100, draw: 500, travel: 350 },
  glow: { change: 150, chips: 150, settle: 900, advance: 900 },
  quiet: { advance: 650 }, // a choice that changes nothing on the right
  reduced: { clear: 1500, advance: 900 },
};
const CHIP_LIFE = 1900;

/** The look from the URL: ?look=glow|lines, and ?starting=path|light for the cross combinations. */
function readLook() {
  const params = new URLSearchParams(location.search);
  const change = params.get('look') === 'glow' ? 'glow' : 'lines';
  const asked = params.get('starting');
  const starting = asked === 'light' || asked === 'path' ? asked : change === 'glow' ? 'light' : 'path';
  return { change, starting };
}

const weekday = index => t(`l2.wd.${DAYS[index].weekday}`);
const listOf = items => new Intl.ListFormat(t.locale, { type: 'conjunction' }).format(items);

export function start(app) {
  let picks = { ...DEFAULT_PICKS };
  let started = false;
  let choices = Array(DAYS.length).fill(null);
  let state = replay(choices, picks);
  let currentIndex = 0;
  let activeKey = 'pick';
  let ghost = null;
  let look = readLook();
  let timers = [];
  let advanceTimer = null;
  let suppressFocusActivate = false;
  let rafPending = false;

  const frame = mountFrame(app, 'd', { onRestart: restart });
  const main = app.querySelector('.l2');
  const stage = app.querySelector('.l2-stage');
  const { panel, live } = frame;
  stage.innerHTML = `<div class="scene-play d-scene">
      <ol class="play-feed" aria-label="${esc(t('l2.feedLabel'))}"></ol>
      <ol class="play-rail" aria-label="${esc(t('l2.d.railLabel'))}">${DAYS.map((day, index) => `<li class="play-rail-item"><button type="button" class="play-rail-tile" data-day="${index}" data-weekend="${day.weekend}" disabled>
        <span class="play-rail-icon" aria-hidden="true"></span><span class="play-rail-num" aria-hidden="true">${esc(t(`l2.wdShort.${day.weekday}`))}</span></button></li>`).join('')}</ol>
    </div>`;
  const feed = stage.querySelector('.play-feed');
  const rail = stage.querySelector('.play-rail');
  const overlay = document.createElementNS(SVG_NS, 'svg');
  overlay.setAttribute('class', 'd-lines');
  overlay.setAttribute('aria-hidden', 'true');
  main.append(overlay);
  mountLookToggle();
  applyLook();

  // ——— Words for an option ———
  function describe(option) {
    if (option.id === 'instrument' || option.id === 'quiet') {
      const activity = picks[option.id];
      return { label: t(`l2.d.act.${activity}.do`), caption: t(`l2.d.time.${option.time}`), icon: ACTIVITY_ICON[activity] };
    }
    if (option.id === 'sport') return { label: t(`l2.d.act.${picks.sport}.${option.event}`), caption: '', icon: ACTIVITY_ICON[picks.sport] };
    return { label: t(`l2.d.opt.${option.id}`), caption: '', icon: option.icon };
  }

  // ——— Markup ———
  function pickCardMarkup() {
    return `<li class="play-card d-pick" data-role="pick" aria-labelledby="d-pick-heading">
      <p class="kicker d-kicker">${esc(t('l2.d.pick.kicker'))}</p>
      <h2 class="play-heading" id="d-pick-heading" tabindex="-1">${esc(t('l2.d.pick.heading'))}</h2>
      ${KINDS.map(kind => `<ul class="play-options d-pick-row" aria-label="${esc(t(`l2.d.pick.group.${kind}`))}">${CHOICES[kind].map(id => `<li>
        <button type="button" class="play-activity d-pick-option" data-kind="${kind}" data-pick="${id}" aria-pressed="${picks[kind] === id}">
          <span class="play-activity-icon">${ICONS[ACTIVITY_ICON[id]]}</span><span class="play-activity-label">${esc(t(`l2.d.act.${id}`))}</span>
        </button></li>`).join('')}</ul>`).join('')}
      <div class="d-pick-actions"><button type="button" class="solid-pill" data-action="start">${esc(t('l2.d.pick.start'))}</button></div>
    </li>`;
  }

  function dayCardMarkup(day, index) {
    const tag = day.chance ? `<span class="chance-tag" data-chance="${day.chance}">${esc(t(day.chance === 'lucky' ? 'game.chance.lucky' : 'game.chance.chance'))}</span>` : '';
    return `<li class="play-card" data-day="${index}" aria-labelledby="play-heading-${index}">
      <p class="play-day-label">${esc(weekday(index))}${tag}</p>
      <h2 class="play-heading" id="play-heading-${index}" tabindex="-1">${esc(t(`l2.d.day.${index + 1}`, { instrument: picks.instrument, sport: picks.sport }))}</h2>
      <ul class="play-options" aria-labelledby="play-heading-${index}">${day.options.map(option => {
        const { label, caption, icon } = describe(option);
        return `<li><button type="button" class="play-activity" data-day="${index}" data-option="${option.id}" aria-pressed="false">
          <span class="play-activity-icon">${ICONS[icon]}</span>
          <span class="play-activity-label">${esc(label)}</span>${caption ? `<span class="play-activity-kind">${esc(caption)}</span>` : ''}
        </button></li>`;
      }).join('')}</ul>
    </li>`;
  }

  const pathMarkup = () => '<i class="d-path-dot"></i><i class="d-path-fill"></i>';
  const boxIcon = activity => `<span class="d-box-icon" aria-hidden="true">${ICONS[ACTIVITY_ICON[activity]]}</span>`;

  function endCardMarkup() {
    return `<li class="play-card play-end d-end" data-role="end" aria-labelledby="d-end-heading" hidden>
      <p class="kicker d-kicker">${esc(t('l2.end.kicker'))}</p>
      <h2 id="d-end-heading" tabindex="-1"></h2>
      <p class="d-end-line">${esc(t('l2.d.end.missed'))}</p>
      <p class="d-end-line">${esc(t('l2.d.end.real'))}</p>
      <div class="d-end-paths" aria-hidden="true">${HOME.map(kind => `<div class="d-end-path" data-kind="${kind}">${boxIcon(picks[kind])}<span class="d-path">${pathMarkup()}</span></div>`).join('')}</div>
      <div class="d-end-actions"><button type="button" class="btn btn-primary" data-action="own">${esc(t('l2.d.end.own'))}</button>
        <button type="button" class="btn btn-quiet" data-action="again">${esc(t('l2.end.again'))}</button></div>
    </li>`;
  }

  function buildFeed() {
    feed.innerHTML = `${pickCardMarkup()}${DAYS.map(dayCardMarkup).join('')}${endCardMarkup()}`;
  }

  /** Rebuild the day cards and the end card (the pick card stays, with its focus). */
  function rebuildDays() {
    feed.querySelectorAll('.play-card[data-day], .d-end, .l2-own').forEach(li => li.remove());
    feed.insertAdjacentHTML('beforeend', `${DAYS.map(dayCardMarkup).join('')}${endCardMarkup()}`);
  }

  function buildPanel() {
    panel.innerHTML = `<div class="d-boxes">${KINDS.map(kind => {
      const activity = picks[kind];
      return skillBoxMarkup({
        id: `d-box-${kind}`, group: kind, title: t(`l2.d.act.${activity}`), owner: t('play.you'),
        skills: SKILLS[activity].map(id => ({ id, label: t(`l2.d.skill.${id}`) })),
      });
    }).join('')}</div>`;
    for (const kind of KINDS) {
      const box = panel.querySelector(`#d-box-${kind}`);
      const activity = picks[kind];
      box.classList.add('d-box');
      box.dataset.kind = kind;
      box.querySelector('h3').insertAdjacentHTML('afterbegin', boxIcon(activity));
      if (!HOME.includes(kind)) continue;
      box.querySelector('header').insertAdjacentHTML('afterend', `<div class="d-start-row" data-role="start">
        <span class="skill-name d-start-name">${esc(t('l2.d.starting'))}</span>
        <span class="d-path" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${esc(t('l2.d.startMeter', { title: t(`l2.d.act.${activity}`) }))}">${pathMarkup()}</span>
      </div>`);
    }
  }

  // ——— Painting state ———
  function paintStarting(container, level) {
    const path = container.querySelector('.d-path');
    path?.style.setProperty('--start', String(level));
    if (path?.getAttribute('role') === 'meter') {
      path.setAttribute('aria-valuenow', String(Math.round(level * 100)));
      path.setAttribute('aria-valuetext', t(`l2.start.stage.${startingStage(level)}`));
    }
    const icon = container.querySelector('.d-box-icon');
    icon.dataset.step = String(lightStep(level));
    icon.dataset.gray = String(level < 0.4);
  }

  function paintPanel(s) {
    for (const kind of KINDS) {
      const box = panel.querySelector(`#d-box-${kind}`);
      setSkillBox(box, s.skills[kind], { ghost: ghost?.[kind] ?? null });
      if (HOME.includes(kind)) paintStarting(box, s.starting[kind]);
    }
  }

  function updateEnd() {
    const li = feed.querySelector('.d-end');
    const complete = started && currentIndex >= DAYS.length;
    li.hidden = !complete;
    li.classList.toggle('is-complete', complete);
    if (!complete) return;
    li.querySelector('#d-end-heading').textContent = t(startingGotEasier(state.starting) ? 'l2.end.heading' : 'l2.end.headingStill');
    for (const kind of HOME) paintStarting(li.querySelector(`.d-end-path[data-kind="${kind}"]`), state.starting[kind]);
  }

  // ——— Feed state (Lesson 1's active card, scroll and focus) ———
  const isFutureDay = index => !started || index > currentIndex;

  function cardElement(key) {
    if (key === 'pick') return feed.querySelector('.d-pick');
    if (key === 'end') return feed.querySelector('.d-end');
    if (key === 'own') return feed.querySelector('.l2-own');
    return feed.querySelector(`.play-card[data-day="${key}"]`);
  }
  const keyOf = li => (li.dataset.day !== undefined ? Number(li.dataset.day) : li.dataset.role);

  function applyActiveClasses() {
    feed.querySelectorAll('.play-card').forEach(li => {
      const key = keyOf(li);
      const future = typeof key === 'number' && isFutureDay(key);
      const active = !future && key === activeKey;
      li.classList.toggle('is-active', active);
      li.classList.toggle('is-inactive', !active);
    });
    main.dataset.active = String(activeKey);
  }

  function scrollToCard(key, { smooth = true } = {}) {
    const li = cardElement(key);
    if (!li) return;
    li.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto', block: 'center' });
  }

  function setActive(key, { scroll = true, smooth = true } = {}) {
    activeKey = key;
    applyActiveClasses();
    if (scroll) scrollToCard(key, { smooth });
  }

  /** Move the keyboard's place to a card's heading, so Tab goes on to its options. */
  function focusCard(key) {
    cardElement(key)?.querySelector('h2')?.focus({ preventScroll: true });
  }

  function syncActiveFromScroll() {
    const feedRect = feed.getBoundingClientRect();
    const centerY = feedRect.top + feedRect.height / 2;
    let bestKey = null;
    let bestDist = Infinity;
    feed.querySelectorAll('.play-card:not([hidden])').forEach(li => {
      const key = keyOf(li);
      if (typeof key === 'number' && isFutureDay(key)) return;
      const rect = li.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - centerY);
      if (dist < bestDist) { bestDist = dist; bestKey = key; }
    });
    if (bestKey !== null && bestKey !== activeKey) setActive(bestKey, { scroll: false });
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; syncActiveFromScroll(); });
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove('play-pop');
    void el.offsetWidth;
    el.classList.add('play-pop');
  }

  function updateCard(index) {
    const li = cardElement(index);
    const chosen = choices[index];
    const future = isFutureDay(index);
    li.classList.toggle('is-chosen', chosen != null);
    li.classList.toggle('is-current', started && index === currentIndex);
    li.classList.toggle('is-future', future);
    li.querySelectorAll('.play-activity').forEach(button => {
      const here = button.dataset.option === chosen;
      button.setAttribute('aria-pressed', String(here));
      button.classList.toggle('is-chosen', here);
      button.disabled = future;
    });
  }

  function updateRailTile(index) {
    const button = rail.querySelector(`.play-rail-tile[data-day="${index}"]`);
    const chosen = choices[index];
    const option = chosen ? DAYS[index].options.find(item => item.id === chosen) : null;
    const described = option ? describe(option) : null;
    const future = isFutureDay(index);
    const current = started && index === currentIndex;
    const changed = button.dataset.option !== (chosen ?? '');
    button.dataset.option = chosen ?? '';
    button.dataset.chosen = String(Boolean(option));
    button.dataset.state = future ? 'future' : current ? 'current' : 'done';
    button.disabled = future;
    const status = described ? described.label : current ? t('play.rail.today') : t('play.rail.notYet');
    button.setAttribute('aria-label', t(index >= 7 ? 'play.rail.labelWeek2' : 'play.rail.label', { weekday: weekday(index), status }));
    const icon = button.querySelector('.play-rail-icon');
    icon.innerHTML = described ? ICONS[described.icon] : '';
    if (changed && described) pulse(icon);
  }

  function updatePick() {
    const card = cardElement('pick');
    card.querySelectorAll('.d-pick-option').forEach(button => {
      button.setAttribute('aria-pressed', String(picks[button.dataset.kind] === button.dataset.pick));
      button.disabled = started;
    });
    card.querySelector('.d-pick-actions').hidden = started;
  }

  function updateAll() {
    for (let index = 0; index < DAYS.length; index += 1) { updateCard(index); updateRailTile(index); }
    updatePick();
    updateEnd();
    applyActiveClasses();
  }

  // ——— The change on the right ———
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function clearChange() {
    timers.forEach(clearTimeout);
    timers = [];
    panel.querySelectorAll('.gain-chip').forEach(chip => chip.remove());
    panel.querySelectorAll('.is-glow, .is-changed').forEach(el => el.classList.remove('is-glow', 'is-changed'));
    overlay.replaceChildren();
    main.dataset.busy = 'false';
  }

  function addChips(box, entry) {
    if (!box) return;
    for (const id of entry.grew) {
      const row = box.querySelector(`.skill-row[data-skill="${id}"]`);
      row?.append(chip(t('play.chip.grew')));
    }
    if (entry.move) {
      const holder = look.starting === 'light' ? box.querySelector('header') : box.querySelector('.d-start-row');
      holder?.append(chip(t(`l2.d.chip.${entry.move}`)));
    }
  }

  function chip(text) {
    const el = document.createElement('span');
    el.className = 'gain-chip';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = text;
    return el;
  }

  function changedRows(box, entry) {
    const rows = entry.grew.map(id => box.querySelector(`.skill-row[data-skill="${id}"]`));
    if (entry.move && look.starting === 'path') rows.push(box.querySelector('.d-start-row'));
    return rows.filter(Boolean);
  }

  /** One line from the tapped option's icon to the card's icon; it draws, then travels in and is gone. */
  function drawLine(from, to) {
    const base = main.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - base.left;
    const y1 = a.top + a.height / 2 - base.top;
    const x2 = b.left + b.width / 2 - base.left;
    const y2 = b.top + b.height / 2 - base.top;
    const dx = x2 - x1;
    const dy = y2 - y1;
    // Side by side: horizontal tangents. Panel above the cards (portrait): vertical ones.
    const d = Math.abs(dx) >= Math.abs(dy)
      ? `M${x1} ${y1}C${x1 + dx / 2} ${y1} ${x2 - dx / 2} ${y2} ${x2} ${y2}`
      : `M${x1} ${y1}C${x1} ${y1 + dy / 2} ${x2} ${y2 - dy / 2} ${x2} ${y2}`;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    overlay.append(path);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    const { draw, travel } = TIMING.lines;
    const animation = path.animate([
      { strokeDashoffset: length, easing: 'cubic-bezier(0, 0, .58, 1)' },
      { strokeDashoffset: 0, offset: draw / (draw + travel), easing: 'linear' },
      { strokeDashoffset: -length },
    ], { duration: draw + travel, fill: 'both' });
    animation.onfinish = () => path.remove();
  }

  /** Play the change for one lived day; `advanceTo` is the card that comes next, if any. */
  function playChange(entry, before, after, optionIcon, advanceTo) {
    clearChange();
    paintPanel(before);
    const box = entry.kind ? panel.querySelector(`#d-box-${entry.kind}`) : null;
    const reduced = prefersReducedMotion();
    main.dataset.busy = 'true';
    let advance;
    if (!box) {
      paintPanel(after);
      advance = TIMING.quiet.advance;
      later(advance, () => { main.dataset.busy = 'false'; });
    } else if (reduced) {
      // Everything jumps; the tints and chips stay a moment, then go.
      paintPanel(after);
      if (look.change === 'glow') { box.classList.add('is-glow'); changedRows(box, entry).forEach(row => row.classList.add('is-changed')); }
      addChips(box, entry);
      later(TIMING.reduced.clear, () => clearChange());
      advance = TIMING.reduced.advance;
    } else if (look.change === 'glow') {
      const { change, chips, settle } = TIMING.glow;
      box.classList.add('is-glow');
      changedRows(box, entry).forEach(row => row.classList.add('is-changed'));
      later(change, () => paintPanel(after));
      later(chips, () => addChips(box, entry));
      later(settle, () => panel.querySelectorAll('.is-glow, .is-changed').forEach(el => el.classList.remove('is-glow', 'is-changed')));
      later(chips + CHIP_LIFE, () => clearChange());
      advance = TIMING.glow.advance;
    } else {
      const { land, change, chips } = TIMING.lines;
      const target = box.querySelector('.d-box-icon');
      drawLine(optionIcon, target);
      later(land, () => { target.classList.remove('d-land'); void target.offsetWidth; target.classList.add('d-land'); });
      later(change, () => paintPanel(after));
      later(chips, () => addChips(box, entry));
      later(chips + CHIP_LIFE, () => clearChange());
      advance = TIMING.lines.advance;
    }
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    if (advanceTo == null) return;
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      const keyboard = feed.contains(document.activeElement);
      setActive(advanceTo, { scroll: true, smooth: true });
      if (keyboard) focusCard(advanceTo);
    }, advance);
  }

  function announceText(index, entry) {
    const parts = [t('l2.d.live.choice', { weekday: weekday(index), choice: describe(entry.option).label })];
    if (entry.grew.length) parts.push(t('l2.d.live.grew', { skills: listOf(entry.grew.map(id => t(`l2.d.skill.${id}`))) }));
    if (entry.move) parts.push(t('l2.d.live.starting', { title: t(`l2.d.act.${entry.activity}`), stage: t(`l2.start.stage.${entry.stage}`) }));
    return parts.join(' ');
  }

  // ——— Actions ———
  function chooseOption(index, optionId, button) {
    if (!started || index > currentIndex) return;
    const wasChosen = choices[index] != null;
    const before = state;
    choices = choices.map((id, position) => (position === index ? optionId : id));
    // A changed earlier day replays the days after it, as in Lesson 1.
    state = replay(choices, picks);
    currentIndex = frontierIndex(choices);
    updateAll();
    const entry = state.history[index];
    announce(live, announceText(index, entry));
    const icon = button.querySelector('.play-activity-icon');
    pulse(icon);
    const next = wasChosen ? null : currentIndex >= DAYS.length ? 'end' : currentIndex;
    playChange(entry, before, state, icon, next);
  }

  function choosePick(kind, id) {
    if (started || picks[kind] === id) return;
    picks = { ...picks, [kind]: id };
    state = replay(choices, picks);
    rebuildDays();
    buildPanel();
    paintPanel(state);
    updateAll();
    pulse(feed.querySelector(`.d-pick-option[data-pick="${id}"] .play-activity-icon`));
    pulse(panel.querySelector(`#d-box-${kind} .d-box-icon`));
  }

  function startDays() {
    started = true;
    currentIndex = frontierIndex(choices);
    updateAll();
    setActive(0, { scroll: true, smooth: true });
    focusCard(0);
  }

  function showOwnPlan() {
    let own = cardElement('own');
    if (!own) {
      own = document.createElement('li');
      own.className = 'play-card l2-own';
      own.dataset.role = 'own';
      own.setAttribute('aria-labelledby', 'd-own-heading');
      own.innerHTML = ownPlanMarkup();
      own.querySelector('.l2-own-heading').id = 'd-own-heading';
      // Nothing is sent: Enter in a field must not submit the form anywhere.
      own.querySelector('form').addEventListener('submit', event => event.preventDefault());
      feed.append(own);
    }
    setActive('own', { scroll: true, smooth: true });
    focusCard('own');
  }

  function playAgain() {
    if (choices.some(id => id != null)) ghost = structuredClone(state.skills);
    choices = Array(DAYS.length).fill(null);
    state = replay(choices, picks);
    currentIndex = 0;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    clearChange();
    cardElement('own')?.remove();
    updateAll();
    paintPanel(state);
    setActive(0, { scroll: true, smooth: true });
    focusCard(0);
  }

  function restart() {
    picks = { ...DEFAULT_PICKS };
    started = false;
    ghost = null;
    choices = Array(DAYS.length).fill(null);
    state = replay(choices, picks);
    currentIndex = 0;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    clearChange();
    buildFeed();
    buildPanel();
    paintPanel(state);
    updateAll();
    setActive('pick', { scroll: true, smooth: false });
    focusCard('pick');
  }

  // ——— The look toggle (owner-facing: Glow | Lines) ———
  function mountLookToggle() {
    const nav = app.querySelector('.l2-dirs');
    nav.insertAdjacentHTML('afterbegin', `<div class="d-look" role="group" aria-label="${esc(t('l2.d.look.label'))}">
      ${['glow', 'lines'].map(value => `<button type="button" class="d-look-option" data-look="${value}" aria-pressed="false">${esc(t(`l2.d.look.${value}`))}</button>`).join('')}
    </div>`);
    nav.querySelector('.d-look').addEventListener('click', event => {
      const button = event.target.closest('.d-look-option');
      if (!button) return;
      look = { change: button.dataset.look, starting: button.dataset.look === 'glow' ? 'light' : 'path' };
      const params = new URLSearchParams(location.search);
      params.set('look', look.change);
      params.delete('starting');
      history.replaceState(null, '', `${location.pathname}?${params}`);
      clearChange();
      paintPanel(state);
      applyLook();
    });
  }

  function applyLook() {
    main.dataset.change = look.change;
    main.dataset.starting = look.starting;
    app.querySelectorAll('.d-look-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.look === look.change)));
    // Deutsch / English keep the look.
    const params = new URLSearchParams(location.search);
    const lang = app.querySelector('.l2-lang');
    if (params.get('lang') === 'de') params.delete('lang'); else params.set('lang', 'de');
    lang.href = params.size ? `${location.pathname}?${params}` : location.pathname;
  }

  // ——— Events ———
  function onFocusIn(event) {
    const li = event.target.closest('.play-card');
    if (!li) return;
    if (suppressFocusActivate) { suppressFocusActivate = false; return; }
    const key = keyOf(li);
    if ((typeof key === 'number' && isFutureDay(key)) || key === activeKey) return;
    setActive(key, { scroll: true, smooth: true });
  }

  function onFeedClick(event) {
    suppressFocusActivate = false;
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'start') { startDays(); return; }
    if (action === 'own') { showOwnPlan(); return; }
    if (action === 'again') { playAgain(); return; }
    if (action === 'print') { window.print(); return; }
    const li = event.target.closest('.play-card');
    if (!li) return;
    const key = keyOf(li);
    const pickButton = event.target.closest('.d-pick-option');
    if (pickButton && !pickButton.disabled) {
      if (key !== activeKey) setActive(key, { scroll: false });
      choosePick(pickButton.dataset.kind, pickButton.dataset.pick);
      return;
    }
    if (typeof key !== 'number') {
      if (key !== activeKey) setActive(key, { scroll: true, smooth: true });
      return;
    }
    if (isFutureDay(key)) return;
    const button = event.target.closest('.play-activity');
    // Today's card answers straight away; an earlier day wakes up on the first tap.
    if (key === currentIndex && button && !button.disabled) {
      if (key !== activeKey) setActive(key, { scroll: false });
      chooseOption(key, button.dataset.option, button);
      return;
    }
    if (key !== activeKey) {
      event.preventDefault();
      setActive(key, { scroll: true, smooth: true });
      return;
    }
    if (button && !button.disabled) chooseOption(key, button.dataset.option, button);
  }

  function onRailClick(event) {
    const button = event.target.closest('.play-rail-tile');
    if (!button || button.disabled) return;
    setActive(Number(button.dataset.day), { scroll: true, smooth: true });
  }

  // Room above the first card and below the last, so either can sit in the middle.
  const updatePad = () => feed.style.setProperty('--play-pad', `${Math.max(80, Math.round(feed.clientHeight / 2) - 30)}px`);
  new ResizeObserver(updatePad).observe(feed);
  feed.addEventListener('scroll', onScroll, { passive: true });
  feed.addEventListener('pointerdown', () => { suppressFocusActivate = true; }, true);
  feed.addEventListener('focusin', onFocusIn);
  feed.addEventListener('click', onFeedClick);
  rail.addEventListener('click', onRailClick);

  buildFeed();
  buildPanel();
  paintPanel(state);
  updateAll();
  main.dataset.busy = 'false';
  updatePad();
  setActive('pick', { scroll: true, smooth: false });
  focusCard('pick');
}
