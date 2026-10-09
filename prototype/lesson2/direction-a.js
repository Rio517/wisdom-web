// Direction A · One routine, two backdrops. The reader picks one thing to
// start at home (cello, or a story they chose), its moment and one thing to
// get ready, then lives each afternoon. Soccer runs on its own: a coach and a
// lift start it, which is the contrast with the routine that is up to you.
import {
  mountFrame, createPanel, addCard, announce, dayHead, cueLine, optionsMarkup, markChosen,
  startChip, movesFor, finish, t, esc, ICONS, weekday, momentYour, listOf, nextChanceLine, revealEnd, readingTime,
} from './ui.js';
import { person } from '../../src/lessons/choices/journey-icons.js';
import { DAYS, MOMENTS, SETUPS, WEEK_ONE_END, momentFit, replay, weekSummary, startingLevel, startingStage } from './model.js';
import { routineOptions, resultLine, soccerLine } from './story.js';

const ADVANCE_MS = 1500;

export function start(app) {
  let ui;
  let panel;
  let plan;
  let decisions;
  let timer = 0;
  let checked = false;
  let cueShown = '';
  let feltStage = -1;
  let freshLeft = 0; // starts still to come at a moved moment that count as new

  const life = () => replay(decisions);

  function reset() {
    clearTimeout(timer);
    plan = { routine: 'cello', moment: null, setup: null };
    decisions = [];
    checked = false;
    cueShown = '';
    feltStage = -1;
    freshLeft = 0;
    ui = mountFrame(app, 'a', { onRestart: reset });
    showPlan();
  }

  function buildPanel() {
    panel = createPanel(ui.panel, { routines: [plan.routine], soccerSetUp: true });
    panel.update(life(), { current: -1 });
  }

  // ——— The plan ———
  const chip = (field, value, label, icon) => `<button type="button" class="l2-chip-choice" data-field="${field}" data-value="${value}" aria-pressed="${plan[field] === value}">
      ${ICONS[icon]}<span>${esc(label)}</span></button>`;
  const setupChips = () => SETUPS[plan.routine].map(value => chip('setup', value, t(`l2.setup.${value}`), value)).join('');

  function showPlan() {
    buildPanel();
    const card = addCard(ui.feed, `<div class="l2-plan-head">
        <div><p class="kicker">${esc(t('l2.a.kicker'))}</p>
        <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.a.heading'))}</h2>
        <p class="l2-intro">${esc(t('l2.a.text'))}</p></div>
        <div class="l2-scene" aria-hidden="true">${person({ shirt: '#285442', ball: true })}<span class="l2-scene-item" data-for="setup"></span></div>
      </div>
      <div class="l2-board">
        <fieldset class="l2-choice"><legend>${esc(t('l2.plan.what'))}</legend><div class="l2-chips">
          ${chip('routine', 'cello', t('l2.plan.whatCello'), 'cello')}${chip('routine', 'reading', t('l2.plan.whatReading'), 'book')}</div></fieldset>
        <fieldset class="l2-choice"><legend>${esc(t('l2.plan.when'))}</legend><div class="l2-chips">
          ${MOMENTS.map(value => chip('moment', value, t(`l2.moment.${value}`), value)).join('')}</div></fieldset>
        <fieldset class="l2-choice"><legend>${esc(t('l2.plan.ready'))}</legend><div class="l2-chips" data-role="setups">${setupChips()}</div></fieldset>
      </div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="go">${esc(t('l2.plan.go'))}</button>
        <p class="l2-hint" role="alert" hidden>${esc(t('l2.plan.needs'))}</p></div>`, { className: 'l2-plan' });
    card.addEventListener('click', event => {
      const button = event.target.closest('.l2-chip-choice');
      if (button && !button.disabled) {
        const { field, value } = button.dataset;
        plan[field] = value;
        card.querySelectorAll(`.l2-chip-choice[data-field="${field}"]`).forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        if (field === 'routine') {
          plan.setup = null;
          card.querySelector('[data-role="setups"]').innerHTML = setupChips();
          card.querySelector('[data-for="setup"]').innerHTML = '';
          buildPanel();
        }
        if (field === 'setup') card.querySelector('[data-for="setup"]').innerHTML = ICONS[value];
        card.querySelector('.l2-hint').hidden = true;
        return;
      }
      if (event.target.closest('[data-action="go"]')) {
        const missing = ['moment', 'setup'].find(field => !plan[field]);
        if (missing) {
          card.querySelector('.l2-hint').hidden = false;
          card.querySelector(`.l2-chip-choice[data-field="${missing}"]`).focus();
          return;
        }
        showDay(0);
      }
    });
  }

  // ——— A day ———
  function fitLine(index) {
    const day = DAYS[index];
    const fit = momentFit(plan.moment, day);
    if (fit === 'gone') return t(`l2.fit.gone.${plan.moment}`);
    if (fit === 'busy') return t(`l2.fit.busy.${plan.moment}`);
    if (fit === 'tired' && day.kind === 'soccer') return t(`l2.fit.tired.${plan.moment}`);
    if (fit === 'weekend') return t(day.kind === 'sunday' ? 'l2.fit.sundaySnack' : 'l2.fit.weekend');
    return '';
  }

  function showDay(index) {
    clearTimeout(timer);
    if (index === WEEK_ONE_END + 1 && !checked) { showCheck(); return; }
    if (index >= DAYS.length) { done(); return; }
    const routine = plan.routine;
    const now = life();
    panel.update(now, { current: index });
    const fit = momentFit(plan.moment, DAYS[index]);
    const last = decisions[index - 1];
    const next = last?.plan[routine] === 'skip' ? nextChanceLine(index - 1, plan.moment, index) : '';
    if (fit === 'gone') { goneDay(index, next); return; }
    const options = routineOptions(routine, index, plan.moment);
    const comes = fit === 'ok' || fit === 'tired';
    // The feeling shows when it changes, and the cue when the plan is new.
    const stage = startingStage(startingLevel(now.tally[routine]));
    const feel = comes && DAYS[index].event !== 'snag' && stage !== feltStage ? `<p class="l2-feel">${esc(t(`l2.feel.${stage}`))}</p>` : '';
    if (feel) feltStage = stage;
    const cuePlan = `${plan.moment}/${plan.setup}`;
    const cue = cuePlan !== cueShown ? cueLine(routine, plan.moment, plan.setup) : '';
    cueShown = cuePlan;
    const note = fitLine(index);
    const card = addCard(ui.feed, `${dayHead(index, { routine, next })}
      ${note ? `<p class="l2-fit">${esc(note)}</p>` : ''}
      ${cue}
      ${feel}
      ${optionsMarkup(options)}
      <div class="l2-result" data-role="result"></div>`, { className: 'l2-day-card', day: index });
    card.addEventListener('click', event => {
      const button = event.target.closest('.l2-opt');
      if (!button || button.disabled || card.classList.contains('is-answered')) return;
      card.classList.add('is-answered');
      markChosen(card, button);
      card.querySelectorAll('.l2-opt').forEach(other => { other.disabled = true; });
      choose(index, card, options[Number(button.dataset.option)]);
    });
  }

  /** A day the moment can't come (the snack is eaten in the car) plays by itself. */
  function goneDay(index, next) {
    const routine = plan.routine;
    decisions[index] = { plan: { [routine]: 'gone' }, options: { extra: [], details: {} } };
    const now = life();
    const entry = now.log.at(-1);
    panel.update(now, { current: index, moves: movesFor(entry) });
    const soccer = soccerLine(entry, { again: false });
    const card = addCard(ui.feed, `${dayHead(index, { routine, next })}
      <p class="l2-fit">${esc(fitLine(index))}</p>
      <div class="l2-result">${startChip(routine, entry.routines[routine])}${soccerMarkup(soccer)}</div>`, { className: 'l2-day-card', day: index });
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: `${fitLine(index)} ${soccer}`.trim() }));
    timer = setTimeout(() => showDay(index + 1), readingTime(card));
  }

  const soccerMarkup = line => (line ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(line)}</span></p>` : '');

  function choose(index, card, option) {
    const routine = plan.routine;
    // The first two starts at a moved moment are new: they grow like another time.
    const fresh = option.how === 'moment' && freshLeft > 0;
    if (fresh) freshLeft -= 1;
    decisions[index] = {
      plan: { [routine]: option.how },
      options: { extra: option.extra ?? [], details: { [routine]: { tired: Boolean(option.tired), icon: option.alt, fresh } } },
    };
    const now = life();
    const entry = now.log.at(-1);
    panel.update(now, { current: index, moves: movesFor(entry) });
    const item = entry.routines[routine];
    const soccer = soccerLine(entry, { again: false });
    const hallway = (option.extra ?? []).includes('hallway') ? `<p class="l2-soccer-line">${ICONS.ball}<span>${esc(t('l2.res.hallway'))}</span></p>` : '';
    card.querySelector('[data-role="result"]').innerHTML = `<p>${esc(resultLine(routine, item, index))}</p>
      ${startChip(routine, item)}
      ${soccerMarkup(soccer)}${hallway}`;
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: `${resultLine(routine, item, index)} ${soccer}`.trim() }));
    revealEnd(ui.feed, card);
    timer = setTimeout(() => showDay(index + 1), ADVANCE_MS);
  }

  // ——— The plan check ———
  function showCheck() {
    const now = life();
    panel.update(now, { current: -1 });
    const summary = weekSummary(now, plan.routine, { moment: plan.moment });
    const original = plan.moment;
    const snag = summary.snags.length ? `<p class="l2-check-snag">${esc(t('l2.check.snag', { days: listOf(summary.snags.map(day => t(`l2.wd.${day}`))) }))}</p>` : '';
    const card = addCard(ui.feed, `<p class="kicker">${esc(t('l2.check.kicker'))}</p>
      <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.check.heading'))}</h2>
      <div class="l2-check-row">
        <p class="l2-ask-name">${ICONS[plan.moment]}<span>${esc(t(`l2.check.word.${summary.word}`, { moment: t(`l2.moment.${plan.moment}`) }))}</span></p>
        ${snag}
        <p class="l2-intro">${esc(t('l2.check.ask'))}</p>
        <div class="l2-chips" role="group" aria-label="${esc(t('l2.check.pick'))}">${MOMENTS.map(value => chip('moment', value, t(`l2.moment.${value}`), value)).join('')}</div>
        <p class="l2-check-result" data-role="moved"></p>
      </div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="week2">${esc(t('l2.check.go'))}</button></div>`, { className: 'l2-check' });
    card.addEventListener('click', event => {
      const button = event.target.closest('.l2-chip-choice');
      if (button && !button.disabled) {
        plan.moment = button.dataset.value;
        card.querySelectorAll('.l2-chip-choice').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        const moved = card.querySelector('[data-role="moved"]');
        moved.textContent = plan.moment === original
          ? t('l2.check.keepResult', { moment: momentYour(plan.moment) })
          : t('l2.check.moveResult', { moment: momentYour(plan.moment) });
        announce(ui.live, moved.textContent);
        return;
      }
      if (event.target.closest('[data-action="week2"]')) {
        checked = true;
        if (plan.moment !== original) freshLeft = 2;
        showDay(WEEK_ONE_END + 1);
      }
    });
  }

  function done() {
    const now = life();
    panel.update(now, { current: -1 });
    finish(ui.feed, now, [plan.routine], { onAgain: reset });
    announce(ui.live, t('l2.end.heading'));
  }

  reset();
}
