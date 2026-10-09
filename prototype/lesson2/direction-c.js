// Direction C · Plan, then live it. A Sunday-night board pins a moment and one
// thing to get ready for cello and for reading. Then the days play by
// themselves and stop only when something happens: a weekend, a tired day, a
// party, a broken string, the plan check after the first week.
import {
  mountFrame, createPanel, addCard, clearFeed, announce, dayHead, optionsMarkup, markChosen,
  startChip, movesFor, finish, t, esc, ICONS, weekday, momentYour, RoutineWord, listOf,
  nextChanceLine, revealEnd,
} from './ui.js';
import { routineIcon } from './icons.js';
import { person } from '../../src/lessons/choices/journey-icons.js';
import { DAYS, MOMENTS, SETUPS, WEEK_ONE_END, momentFit, replay, weekSummary } from './model.js';
import { routineOptions, autoHow, resultLine, soccerLine } from './story.js';

const ROUTINES = ['cello', 'reading'];
const QUIET_MS = 1500;

export function start(app) {
  let ui;
  let panel;
  let plan;
  let decisions;
  let timer = 0;
  let paused = false;
  let auto = null;
  let checked = false;

  function life() { return replay(decisions); }

  function reset() {
    clearTimeout(timer);
    plan = { cello: { moment: null, setup: null }, reading: { moment: null, setup: null } };
    decisions = [];
    paused = false;
    checked = false;
    ui = mountFrame(app, 'c', { onRestart: reset });
    ui.feed.insertAdjacentHTML('beforebegin', `<div class="l2-auto" hidden>
        <p class="l2-auto-text" data-role="auto-text">${esc(t('l2.c.playing'))}</p>
        <button type="button" class="pill-button" data-action="pause">${esc(t('l2.c.pause'))}</button>
        <button type="button" class="pill-button" data-action="step">${esc(t('l2.c.step'))}</button>
      </div>`);
    auto = ui.feed.previousElementSibling;
    auto.querySelector('[data-action="pause"]').addEventListener('click', togglePause);
    auto.querySelector('[data-action="step"]').addEventListener('click', () => { clearTimeout(timer); runDay(decisions.length); });
    panel = createPanel(ui.panel, { routines: ROUTINES });
    panel.update(life());
    showPlan();
  }

  // ——— The Sunday board ———
  function chips(routine, field) {
    const values = field === 'moment' ? MOMENTS : SETUPS[routine];
    return values.map(value => `<button type="button" class="l2-chip-choice" data-routine="${routine}" data-field="${field}" data-value="${value}" aria-pressed="false">
        ${ICONS[value]}<span>${esc(t(field === 'moment' ? `l2.moment.${value}` : `l2.setup.${value}`))}</span></button>`).join('');
  }

  function showPlan() {
    const row = routine => `<div class="l2-board-row" data-routine="${routine}">
        <p class="l2-board-name">${routineIcon(routine)}<span>${esc(t(`l2.Routine.${routine}`))}</span></p>
        <fieldset class="l2-choice"><legend>${esc(t('l2.c.moment'))}</legend><div class="l2-chips">${chips(routine, 'moment')}</div></fieldset>
        <fieldset class="l2-choice"><legend>${esc(t('l2.c.ready'))}</legend><div class="l2-chips">${chips(routine, 'setup')}</div></fieldset>
      </div>`;
    const card = addCard(ui.feed, `<div class="l2-plan-head">
        <div><p class="kicker">${esc(t('l2.c.kicker'))}</p>
        <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.c.heading'))}</h2>
        <p class="l2-intro">${esc(t('l2.c.text'))}</p></div>
        <div class="l2-scene" aria-hidden="true">${person({ shirt: '#285442' })}<span class="l2-scene-item" data-for="cello"></span><span class="l2-scene-item" data-for="reading"></span></div>
      </div>
      <div class="l2-board">${ROUTINES.map(row).join('')}</div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="go">${esc(t('l2.c.go'))}</button>
        <p class="l2-hint" role="alert" hidden>${esc(t('l2.plan.needs'))}</p></div>`, { className: 'l2-plan' });
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, field, value } = chip.dataset;
        plan[routine][field] = value;
        card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"][data-field="${field}"]`)
          .forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
        if (field === 'setup') card.querySelector(`.l2-scene-item[data-for="${routine}"]`).innerHTML = ICONS[value];
        card.querySelector('.l2-hint').hidden = true;
        return;
      }
      if (event.target.closest('[data-action="go"]')) {
        const missing = ROUTINES.flatMap(routine => ['moment', 'setup'].filter(field => !plan[routine][field]).map(field => ({ routine, field })));
        if (missing.length) {
          card.querySelector('.l2-hint').hidden = false;
          card.querySelector(`.l2-chip-choice[data-routine="${missing[0].routine}"][data-field="${missing[0].field}"]`).focus();
          return;
        }
        auto.hidden = false;
        runDay(0);
      }
    });
  }

  // ——— Auto-play ———
  function togglePause() {
    paused = !paused;
    const button = auto.querySelector('[data-action="pause"]');
    button.textContent = t(paused ? 'l2.c.resume' : 'l2.c.pause');
    auto.querySelector('[data-role="auto-text"]').textContent = t(paused ? 'l2.c.paused' : 'l2.c.playing');
    if (paused) clearTimeout(timer);
    else schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => runDay(decisions.length), QUIET_MS);
  }

  function setAuto(waiting) {
    auto.querySelector('[data-action="step"]').disabled = waiting;
    auto.querySelector('[data-action="pause"]').disabled = waiting;
  }

  /** "Next chance for cello: Tuesday, after your snack." after a skipped day. */
  function nextLines(index) {
    const last = decisions[index - 1];
    if (!last) return [];
    return ROUTINES.filter(routine => last.plan[routine] === 'skip')
      .map(routine => nextChanceLine(index - 1, plan[routine].moment, index, routine));
  }

  // Days where both routines are asked the same question get one row.
  function combined(index) {
    const day = DAYS[index];
    const fits = Object.fromEntries(ROUTINES.map(routine => [routine, momentFit(plan[routine].moment, day)]));
    if (day.tempt === 'party') {
      const then = Object.fromEntries(ROUTINES.map(routine => [routine, plan[routine].moment === 'snack' ? 'skip' : 'moment']));
      const options = [{ label: t('l2.c.partyGo'), kind: 'skip', icon: 'party', plan: { cello: 'skip', reading: 'skip' } }];
      if (Object.values(then).includes('moment')) options.push({ label: t('l2.c.partyThen'), kind: 'moment', icon: 'party', plan: then });
      options.push({ label: t('l2.c.partyStay'), kind: 'moment', icon: 'cello', plan: { cello: 'moment', reading: 'moment' } });
      return options.map(option => ({ ...option, alt: 'party' }));
    }
    if (fits.cello === 'weekend' && fits.reading === 'weekend') {
      return [
        { label: t('l2.c.weekendBoth'), kind: 'other', icon: 'morning', plan: { cello: 'other', reading: 'other' } },
        { label: t('l2.c.weekendRead'), kind: 'other', icon: 'pillow', plan: { cello: 'rest', reading: 'other' } },
        { label: t('l2.c.restBoth'), kind: 'rest', icon: 'rest', plan: { cello: 'rest', reading: 'rest' } },
      ];
    }
    if (day.tired) {
      return [
        { label: t('l2.c.both'), kind: 'moment', icon: 'cello', plan: { cello: 'moment', reading: 'moment' }, tired: true },
        { label: t('l2.c.justRead'), kind: 'moment', icon: 'book', plan: { cello: 'rest', reading: 'moment' }, tired: true },
        { label: t('l2.c.restBoth'), kind: 'rest', icon: 'rest', plan: { cello: 'rest', reading: 'rest' } },
      ];
    }
    return null;
  }

  function runDay(index) {
    clearTimeout(timer);
    if (index > DAYS.length - 1) { done(); return; }
    if (index === WEEK_ONE_END + 1 && !checked) { showCheck(); return; }
    const asks = Object.fromEntries(ROUTINES.map(routine => [routine, routineOptions(routine, index, plan[routine].moment, { ask: 'events', snag: 'cello' })]));
    const asked = ROUTINES.filter(routine => asks[routine]);
    if (!asked.length) { quietDay(index); return; }
    eventDay(index, asks, asked);
  }

  function autoPlan(index, routines) {
    const decided = {};
    const details = {};
    for (const routine of routines) {
      const { how, tired } = autoHow(plan[routine].moment, index);
      decided[routine] = how;
      details[routine] = { tired: Boolean(tired) };
    }
    return { decided, details };
  }

  function live(index, decision) {
    decisions[index] = decision;
    const now = life();
    const entry = now.log.at(-1);
    panel.update(now, { current: index + 1, moves: movesFor(entry) });
    return entry;
  }

  function quietLine(routine, item) {
    const values = { Routine: RoutineWord(routine), routine: t(`l2.routine.${routine}`), moment: momentYour(plan[routine].moment) };
    const key = item.how === 'moment' && item.tired ? 'tired' : item.how;
    const move = item.moved === 'up' ? (item.after - item.before < 0.06 ? 'small' : 'up') : item.moved === 'down' ? 'down' : 'still';
    return `<li class="l2-quiet-line">${routineIcon(routine)}<span>${esc(t(`l2.c.line.${key}`, values))}</span>
      <span class="l2-move" data-move="${move}">${esc(t(`l2.start.delta.${move}`))}</span></li>`;
  }

  function quietDay(index) {
    const { decided, details } = autoPlan(index, ROUTINES);
    const entry = live(index, { plan: decided, options: { details } });
    const soccer = soccerLine(entry);
    addCard(ui.feed, `${dayHead(index, { next: nextLines(index) })}
      <ul class="l2-quiet">${ROUTINES.map(routine => quietLine(routine, entry.routines[routine])).join('')}</ul>
      ${soccer ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(soccer)}</span></p>` : ''}`, { className: 'l2-day-card is-quiet', focus: false, day: index });
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: ROUTINES.map(routine => t(`l2.c.line.${entry.routines[routine].how === 'moment' && entry.routines[routine].tired ? 'tired' : entry.routines[routine].how}`, { Routine: RoutineWord(routine), routine: t(`l2.routine.${routine}`), moment: momentYour(plan[routine].moment) })).join(' ') }));
    setAuto(false);
    schedule();
  }

  function eventDay(index, asks, asked) {
    setAuto(true);
    const both = asked.length === 2 ? combined(index) : null;
    const rows = both
      ? [{ key: 'both', options: both }]
      : asked.map(routine => ({ key: routine, options: asks[routine] }));
    const unasked = ROUTINES.filter(routine => !asked.includes(routine));
    const rowMarkup = row => `<div class="l2-ask-row" data-row="${row.key}">
        ${row.key === 'both' ? '' : `<p class="l2-ask-name">${routineIcon(row.key)}<span>${esc(t(`l2.Routine.${row.key}`))} · ${esc(momentYour(plan[row.key].moment))}</span></p>`}
        ${optionsMarkup(row.options)}</div>`;
    const card = addCard(ui.feed, `${dayHead(index, { next: nextLines(index) })}
      <p class="l2-ask">${esc(t('l2.c.ask'))}</p>
      ${rows.map(rowMarkup).join('')}
      <div class="l2-result" data-role="result"></div>`, { className: 'l2-day-card', day: index });
    const answers = {};
    card.addEventListener('click', event => {
      const button = event.target.closest('.l2-opt');
      if (!button || button.disabled || card.classList.contains('is-answered')) return;
      const rowEl = button.closest('.l2-ask-row');
      const row = rows.find(item => item.key === rowEl.dataset.row);
      markChosen(rowEl, button);
      answers[row.key] = row.options[Number(button.dataset.option)];
      if (Object.keys(answers).length < rows.length) {
        rowEl.nextElementSibling?.querySelector('.l2-opt')?.focus();
        return;
      }
      card.classList.add('is-answered');
      card.querySelectorAll('.l2-opt').forEach(other => { other.disabled = true; });
      resolve(index, card, rows, answers, unasked);
    });
  }

  function resolve(index, card, rows, answers, unasked) {
    const { decided, details } = autoPlan(index, unasked);
    const extra = [];
    if (answers.both) {
      for (const routine of ROUTINES) {
        decided[routine] = answers.both.plan[routine];
        details[routine] = { tired: Boolean(answers.both.tired), icon: answers.both.alt ?? (answers.both.plan[routine] === 'rest' ? 'restSmall' : undefined) };
      }
    } else {
      for (const routine of ROUTINES) {
        const answer = answers[routine];
        if (!answer) continue;
        decided[routine] = answer.how;
        details[routine] = { tired: Boolean(answer.tired), icon: answer.alt };
        extra.push(...(answer.extra ?? []));
      }
    }
    const entry = live(index, { plan: decided, options: { details, extra } });
    const lines = bothLine(entry, index)
      ? [`<p>${esc(bothLine(entry, index))}</p>`, ...ROUTINES.map(routine => startChip(routine, entry.routines[routine]))]
      : ROUTINES.map(routine => `<div class="l2-result-row"><p>${esc(resultLine(routine, entry.routines[routine], index))}</p>${startChip(routine, entry.routines[routine])}</div>`);
    const soccer = soccerLine(entry);
    const result = card.querySelector('[data-role="result"]');
    result.innerHTML = `${lines.join('')}
      ${soccer ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(soccer)}</span></p>` : ''}
      <button type="button" class="btn btn-primary l2-continue">${esc(t('l2.c.resume'))}</button>`;
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: bothLine(entry, index) || ROUTINES.map(routine => resultLine(routine, entry.routines[routine], index)).join(' ') }));
    const next = result.querySelector('.l2-continue');
    next.addEventListener('click', () => { next.disabled = true; setAuto(false); runDay(index + 1); });
    next.focus({ preventScroll: true });
    revealEnd(ui.feed, card);
  }


  /** One sentence when both routines went the same way (a day off, rest, a new time). */
  function bothLine(entry, index) {
    const [a, b] = ROUTINES.map(routine => entry.routines[routine]);
    if (a.how !== b.how || !['skip', 'rest', 'other'].includes(a.how)) return '';
    if (a.how === 'skip') return a.moved === 'down' && b.moved === 'down' ? t('l2.res.slip.both') : a.moved === b.moved ? t('l2.res.skip.both') : '';
    if (a.how === 'rest') return t(['weekend', 'sunday'].includes(DAYS[index].kind) ? 'l2.res.restWeekend.both' : 'l2.res.rest.both');
    return t('l2.res.other.both');
  }

  // ——— The plan check ———
  function showCheck() {
    setAuto(true);
    const now = life();
    const row = routine => {
      const summary = weekSummary(now, routine);
      const moment = plan[routine].moment;
      const snag = summary.snags.length ? `<p class="l2-check-snag">${esc(t('l2.check.snag', { days: listOf(summary.snags.map(day => t(`l2.wd.${day}`))) }))}</p>` : '';
      return `<div class="l2-check-row" data-routine="${routine}">
        <p class="l2-ask-name">${routineIcon(routine)}<span>${esc(t(`l2.check.word.${summary.word}`, { moment: `${RoutineWord(routine)} · ${momentYour(moment)}` }))}</span></p>
        ${snag}
        <div class="l2-chips" role="group" aria-label="${esc(t('l2.c.check.move', { routine: t(`l2.routine.${routine}`) }))}">${chips(routine, 'moment')}</div>
        <p class="l2-check-result" data-role="moved"></p>
      </div>`;
    };
    const card = addCard(ui.feed, `<p class="kicker">${esc(t('l2.check.kicker'))}</p>
      <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.check.heading'))}</h2>
      ${ROUTINES.map(row).join('')}
      <p class="l2-intro">${esc(t('l2.c.check.ask'))}</p>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="week2">${esc(t('l2.check.go'))}</button></div>`, { className: 'l2-check' });
    for (const routine of ROUTINES) {
      card.querySelector(`.l2-chip-choice[data-routine="${routine}"][data-value="${plan[routine].moment}"]`).setAttribute('aria-pressed', 'true');
    }
    const original = { cello: plan.cello.moment, reading: plan.reading.moment };
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, value } = chip.dataset;
        plan[routine].moment = value;
        card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"]`).forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
        const moved = card.querySelector(`.l2-check-row[data-routine="${routine}"] [data-role="moved"]`);
        moved.textContent = value === original[routine] ? t('l2.c.check.kept') : t('l2.c.check.moved', { Routine: RoutineWord(routine), moment: momentYour(value) });
        announce(ui.live, moved.textContent);
        return;
      }
      if (event.target.closest('[data-action="week2"]')) {
        checked = true;
        setAuto(false);
        runDay(WEEK_ONE_END + 1);
      }
    });
  }

  function done() {
    auto.hidden = true;
    const now = life();
    panel.update(now, { current: -1 });
    finish(ui.feed, now, ROUTINES, { onAgain: reset });
    announce(ui.live, t('l2.end.heading'));
  }

  reset();
}
