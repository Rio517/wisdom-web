// Direction B · Juggling the afternoon. Each day has two spots (after school
// and evening; morning and afternoon at the weekend). Soccer takes some of
// them because the coach says so. The reader fills the rest with cello,
// reading, rest or whatever else is on. Nobody sets a moment: a routine's
// usual spot is simply where it has happened most often, and each day starts
// with every routine already in its usual spot, so a routine that keeps its
// spot gets easy to start and the days get quicker to plan.
import {
  mountFrame, createPanel, addCard, announce, dayHead, startChip, movesFor, finish,
  t, esc, ICONS, weekday, RoutineWord, routineWord, revealEnd,
} from './ui.js';
import { routineIcon } from './icons.js';
import { person } from '../../src/lessons/choices/journey-icons.js';
import { DAYS, SETUPS, WEEK_ONE_END, createLife, liveDay, startingLevel, startingStage, soccerToday } from './model.js';
import { soccerLine } from './story.js';

const ROUTINES = ['cello', 'reading'];
const ADVANCE_MS = 1500;
const WEEKDAY_SLOTS = ['afterSchool', 'evening'];
const WEEKEND_SLOTS = ['morning', 'afternoon'];
const ALL_SLOTS = [...WEEKDAY_SLOTS, ...WEEKEND_SLOTS];
const SLOT_ICON = { afterSchool: 'snack', evening: 'dinner', morning: 'morning', afternoon: 'clock' };
const FUN = { tag: ['tag', 'friends'], rain: ['fort', 'fort'], party: ['party', 'party'], cousins: ['cousins', 'friends'] };

const isWeekend = day => day.kind === 'weekend' || day.kind === 'sunday';
const slotsFor = day => (isWeekend(day) ? WEEKEND_SLOTS : WEEKDAY_SLOTS);
const slotIn = slot => t(`l2.b.slotIn.${slot}`);

/** The spot soccer takes today, if any: practice after school, the match and the visit in the afternoon. */
function lockedFor(day) {
  if (!soccerToday(day)) return {};
  return day.match ? { afternoon: 'match' } : { afterSchool: 'soccer' };
}

/** Today's other thing: whatever is on, or videos. */
function funFor(day) {
  const key = day.tempt ?? (day.event === 'rain' ? 'rain' : null);
  const [id, icon] = FUN[key] ?? ['play', 'screen'];
  return { id, icon };
}

const chipIcon = (id, day) => ({ cello: 'cello', reading: 'book', rest: 'rest' }[id] ?? funFor(day).icon);

/** Where a routine has happened most often, among some spots (ties: the earlier spot). */
function usualSlot(counts, among = ALL_SLOTS) {
  let best = null;
  for (const slot of among) if ((counts[slot] ?? 0) > (best ? counts[best] : 0)) best = slot;
  return best;
}
const most = counts => Math.max(0, ...Object.values(counts));

/**
 * Replay the days from what was placed where. A routine counts as "at its
 * moment" when it lands in a spot it has used most often so far (the first
 * time, any spot): then the model's moment tally is always the most-used
 * spot's count and "other" the rest. Unplaced routines rest at the weekend
 * or when the reader picked rest, lose the day to soccer when soccer has
 * their usual spot, and otherwise skip.
 */
function replayB(days) {
  let life = createLife();
  const counts = { cello: {}, reading: {} };
  days.forEach((arrangement, index) => {
    if (!arrangement) return;
    const day = DAYS[index];
    const locked = lockedFor(day);
    const placed = Object.entries(arrangement);
    const plan = {};
    const details = {};
    for (const routine of ROUTINES) {
      const slot = placed.find(([, what]) => what === routine)?.[0];
      if (slot) {
        const first = most(counts[routine]) === 0;
        plan[routine] = (counts[routine][slot] ?? 0) === most(counts[routine]) ? 'moment' : 'other';
        counts[routine][slot] = (counts[routine][slot] ?? 0) + 1;
        details[routine] = { slot, first };
        continue;
      }
      const usual = usualSlot(counts[routine]);
      if (day.event === 'snag' && routine === 'cello') plan[routine] = 'luck';
      else if (usual && locked[usual]) plan[routine] = 'gone';
      else if (placed.some(([, what]) => what === 'rest') || isWeekend(day)) plan[routine] = 'rest';
      else plan[routine] = 'skip';
      details[routine] = { icon: funFor(day).icon };
    }
    life = liveDay(life, index, plan, { details });
  });
  return { life, counts };
}

export function start(app) {
  let ui;
  let panel;
  let setups;
  let days;
  let pins;
  let timer = 0;
  let checked = false;

  const state = () => replayB(days);

  function reset() {
    clearTimeout(timer);
    setups = { cello: null, reading: null };
    days = [];
    pins = {};
    checked = false;
    ui = mountFrame(app, 'b', { onRestart: reset });
    panel = createPanel(ui.panel, { routines: ROUTINES });
    panel.update(state().life, { current: -1 });
    showIntro();
  }

  // ——— Getting ready ———
  function showIntro() {
    const chips = routine => SETUPS[routine].map(value => `<button type="button" class="l2-chip-choice" data-routine="${routine}" data-value="${value}" aria-pressed="false">
        ${ICONS[value]}<span>${esc(t(`l2.setup.${value}`))}</span></button>`).join('');
    const card = addCard(ui.feed, `<div class="l2-plan-head">
        <div><p class="kicker">${esc(t('l2.b.kicker'))}</p>
        <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.b.heading'))}</h2>
        <p class="l2-intro">${esc(t('l2.b.text'))}</p></div>
        <div class="l2-scene" aria-hidden="true">${person({ shirt: '#285442' })}<span class="l2-scene-item" data-for="cello"></span><span class="l2-scene-item" data-for="reading"></span></div>
      </div>
      <div class="l2-board">
        <p class="l2-board-q">${esc(t('l2.b.ready'))}</p>
        ${ROUTINES.map(routine => `<fieldset class="l2-choice"><legend>${esc(t(`l2.Routine.${routine}`))}</legend><div class="l2-chips">${chips(routine)}</div></fieldset>`).join('')}
      </div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="go">${esc(t('l2.b.go'))}</button>
        <p class="l2-hint" role="alert" hidden>${esc(t('l2.plan.needs'))}</p></div>`, { className: 'l2-plan' });
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, value } = chip.dataset;
        setups[routine] = value;
        card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"]`).forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
        card.querySelector(`[data-for="${routine}"]`).innerHTML = ICONS[value];
        card.querySelector('.l2-hint').hidden = true;
        return;
      }
      if (event.target.closest('[data-action="go"]')) {
        const missing = ROUTINES.find(routine => !setups[routine]);
        if (missing) {
          card.querySelector('.l2-hint').hidden = false;
          card.querySelector(`.l2-chip-choice[data-routine="${missing}"]`).focus();
          return;
        }
        showDay(0);
      }
    });
  }

  // ——— A day: fill the free spots ———
  /** The next day a skipped routine's usual spot is free again. */
  function nextFor(routine, fromIndex, cardIndex, usual) {
    if (!usual) return '';
    for (let i = fromIndex + 1; i < DAYS.length; i += 1) {
      if (!slotsFor(DAYS[i]).includes(usual) || lockedFor(DAYS[i])[usual]) continue;
      const values = { routine: routineWord(routine), weekday: weekday(i), slot: slotIn(usual) };
      return t(i === cardIndex ? 'l2.b.nextToday' : 'l2.b.next', values);
    }
    return '';
  }

  /**
   * Each routine starts in its usual spot for this kind of day (a pinned spot
   * first, then the one used most), unless soccer has it. The reader changes
   * what they like.
   */
  function prefill(day, available, counts) {
    const slots = slotsFor(day);
    const locked = lockedFor(day);
    const arrangement = {};
    const wants = ROUTINES.filter(routine => available.includes(routine))
      .map(routine => ({ routine, pinned: Boolean(pins[routine] && !isWeekend(day)), slot: (!isWeekend(day) && pins[routine]) || usualSlot(counts[routine], slots) }))
      .filter(want => want.slot && !locked[want.slot])
      .sort((a, b) => (b.pinned - a.pinned) || ((counts[b.routine][b.slot] ?? 0) - (counts[a.routine][a.slot] ?? 0)));
    for (const { routine, slot } of wants) if (!arrangement[slot]) arrangement[slot] = routine;
    return arrangement;
  }

  function showDay(index) {
    clearTimeout(timer);
    if (index === WEEK_ONE_END + 1 && !checked) { showCheck(); return; }
    if (index >= DAYS.length) { done(); return; }
    const day = DAYS[index];
    const { life, counts } = state();
    panel.update(life, { current: index });
    const slots = slotsFor(day);
    const locked = lockedFor(day);
    const broken = day.event === 'snag';
    const choices = ['cello', 'reading', 'rest', funFor(day).id];
    const available = choices.filter(id => !(broken && id === 'cello'));
    const arrangement = prefill(day, available, counts);
    const last = index > 0 ? life.log.at(-1) : null;
    const next = last ? ROUTINES.filter(routine => last.routines[routine]?.how === 'skip')
      .map(routine => nextFor(routine, index - 1, index, usualSlot(counts[routine]))) : [];
    const usualHere = slot => ROUTINES.filter(routine => usualSlot(counts[routine]) === slot)
      .map(routine => t('l2.b.usual', { Routine: RoutineWord(routine) })).join(' · ');

    const slotMarkup = slot => {
      const usual = usualHere(slot);
      const head = `<legend class="l2-slot-name">${ICONS[SLOT_ICON[slot]]}<span>${esc(t(`l2.b.slot.${slot}`))}</span>${usual ? `<span class="l2-slot-usual">${esc(usual)}</span>` : ''}</legend>`;
      if (locked[slot]) {
        return `<fieldset class="l2-slot" data-slot="${slot}" data-locked="true">${head}
          <p class="l2-slot-lock">${ICONS.soccerSmall}<span>${esc(t(`l2.b.lock.${locked[slot]}`))}</span></p></fieldset>`;
      }
      const chips = choices.map(id => {
        const gone = broken && id === 'cello';
        const label = gone ? t('l2.b.chip.broken') : t(`l2.b.chip.${id}`);
        return `<button type="button" class="l2-chip-choice" data-slot="${slot}" data-chip="${id}" aria-pressed="${arrangement[slot] === id}" ${gone ? 'disabled' : ''}>
          ${ICONS[gone ? 'snap' : chipIcon(id, day)]}<span>${esc(label)}</span></button>`;
      }).join('');
      return `<fieldset class="l2-slot" data-slot="${slot}">${head}<div class="l2-chips">${chips}</div></fieldset>`;
    };

    const card = addCard(ui.feed, `${dayHead(index, { routine: 'cello', next })}
      <div class="l2-slots">${slots.map(slotMarkup).join('')}</div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="live">${esc(t('l2.b.live'))}</button>
        <p class="l2-hint" role="alert" hidden>${esc(t('l2.b.needs'))}</p></div>
      <div class="l2-result" data-role="result"></div>`, { className: 'l2-day-card l2-juggle', day: index });

    const sync = () => card.querySelectorAll('.l2-slot .l2-chip-choice').forEach(chip => {
      chip.setAttribute('aria-pressed', String(arrangement[chip.dataset.slot] === chip.dataset.chip));
    });

    card.addEventListener('click', event => {
      if (card.classList.contains('is-answered')) return;
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { slot, chip: id } = chip.dataset;
        // A routine happens once a day: putting it here takes it out of the other spot.
        if (ROUTINES.includes(id)) for (const other of Object.keys(arrangement)) if (arrangement[other] === id) delete arrangement[other];
        arrangement[slot] = id;
        sync();
        card.querySelector('.l2-hint').hidden = true;
        return;
      }
      if (event.target.closest('[data-action="live"]')) {
        const empty = slots.find(slot => !locked[slot] && !arrangement[slot]);
        if (empty) {
          card.querySelector('.l2-hint').hidden = false;
          card.querySelector(`.l2-chip-choice[data-slot="${empty}"]:not([disabled])`).focus();
          return;
        }
        live(index, card, { ...arrangement });
      }
    });
  }

  function resultKey(item) {
    if (item.how === 'moment' && item.first) return 'first';
    if (item.how === 'moment' && item.tired) return 'tired';
    if (item.how === 'skip' && item.moved === 'down') return 'slip';
    return item.how;
  }

  function live(index, card, arrangement) {
    card.classList.add('is-answered');
    card.querySelectorAll('button').forEach(button => { button.disabled = true; });
    days[index] = arrangement;
    const { life } = state();
    const entry = life.log.at(-1);
    panel.update(life, { current: index, moves: movesFor(entry) });
    const keys = ROUTINES.map(routine => resultKey(entry.routines[routine]));
    const chips = ROUTINES.map(routine => startChip(routine, entry.routines[routine]));
    // When both went the same way, one sentence says it for both.
    const lines = keys[0] === keys[1] && ['moment', 'other', 'skip', 'rest'].includes(keys[0])
      ? [{ text: t(`l2.b.res.both.${keys[0]}`), chip: `<div class="l2-start-chips">${chips.join('')}</div>` }]
      : ROUTINES.map((routine, i) => {
        const item = entry.routines[routine];
        return { text: t(`l2.b.res.${keys[i]}`, { Routine: RoutineWord(routine), routine: routineWord(routine), slot: item.slot ? slotIn(item.slot) : '' }), chip: chips[i] };
      });
    const soccer = soccerLine(entry);
    card.querySelector('[data-role="result"]').innerHTML = `${lines.map(line => `<div class="l2-result-row"><p>${esc(line.text)}</p>${line.chip}</div>`).join('')}
      ${soccer ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(soccer)}</span></p>` : ''}`;
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: `${lines.map(line => line.text).join(' ')} ${soccer}`.trim() }));
    revealEnd(ui.feed, card);
    timer = setTimeout(() => showDay(index + 1), ADVANCE_MS);
  }

  // ——— The check: which one got easier, and why? ———
  function showCheck() {
    const { life, counts } = state();
    panel.update(life, { current: -1 });
    const row = routine => {
      // Weekends have their own spots, so only school days say whether it kept one.
      const usual = usualSlot(counts[routine], WEEKDAY_SLOTS);
      const total = WEEKDAY_SLOTS.reduce((sum, slot) => sum + (counts[routine][slot] ?? 0), 0);
      const steady = usual && counts[routine][usual] / total >= 0.7;
      const line = steady
        ? t('l2.b.check.usual', { Routine: RoutineWord(routine), slot: slotIn(usual) })
        : t('l2.b.check.moved', { Routine: RoutineWord(routine) });
      const level = startingLevel(life.tally[routine]);
      return `<div class="l2-check-row" data-routine="${routine}">
        <p class="l2-ask-name">${routineIcon(routine)}<span>${esc(t(`l2.start.title.${routine}`))}: ${esc(t(`l2.start.stage.${startingStage(level)}`))}</span></p>
        <p class="l2-check-snag">${esc(line)}</p>
        <div class="l2-chips" role="group" aria-label="${esc(t('l2.b.check.pin', { routine: routineWord(routine) }))}">
          ${WEEKDAY_SLOTS.map(slot => `<button type="button" class="l2-chip-choice" data-routine="${routine}" data-slot="${slot}" aria-pressed="false">${ICONS[SLOT_ICON[slot]]}<span>${esc(t(`l2.b.slot.${slot}`))}</span></button>`).join('')}
          <button type="button" class="l2-chip-choice" data-routine="${routine}" data-slot="" aria-pressed="true">${ICONS.clock}<span>${esc(t('l2.b.check.keep'))}</span></button>
        </div>
        <p class="l2-check-result" data-role="moved"></p>
      </div>`;
    };
    const card = addCard(ui.feed, `<p class="kicker">${esc(t('l2.check.kicker'))}</p>
      <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.b.check.heading'))}</h2>
      ${ROUTINES.map(row).join('')}
      <p class="l2-intro">${esc(t('l2.b.check.ask'))}</p>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="week2">${esc(t('l2.check.go'))}</button></div>`, { className: 'l2-check' });

    const show = routine => {
      const slot = pins[routine] ?? '';
      card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.slot === slot)));
      card.querySelector(`.l2-check-row[data-routine="${routine}"] [data-role="moved"]`).textContent = slot
        ? t('l2.b.check.pinned', { routine: routineWord(routine), slot: slotIn(slot) }) : '';
    };
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, slot } = chip.dataset;
        if (!slot) delete pins[routine];
        else {
          // One spot holds one thing: pinning here unpins the other routine.
          for (const other of ROUTINES) if (other !== routine && pins[other] === slot) { delete pins[other]; show(other); }
          pins[routine] = slot;
        }
        show(routine);
        const said = card.querySelector(`.l2-check-row[data-routine="${routine}"] [data-role="moved"]`).textContent;
        if (said) announce(ui.live, said);
        return;
      }
      if (event.target.closest('[data-action="week2"]')) {
        checked = true;
        showDay(WEEK_ONE_END + 1);
      }
    });
  }

  function done() {
    const { life } = state();
    panel.update(life, { current: -1 });
    finish(ui.feed, life, ROUTINES, { onAgain: reset });
    announce(ui.live, t('l2.end.heading'));
  }

  reset();
}
