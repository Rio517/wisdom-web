// Direction C · Plan, then live it. A Sunday-night board pins a moment and one
// thing to get ready for one routine (or, if the reader adds it, both). Then
// the days play by themselves, a quiet stretch to a card, and stop only when
// something happens: a weekend, a tired day, a party, bad luck, the plan
// check after the first week. The second weekend repeats the first one's
// answer unless the reader changes it.
import {
  mountFrame, createPanel, addCard, announce, dayHead, dayLabel, optionsMarkup, markChosen,
  startChip, startChips, moveChip, movesFor, moveOf, finish, t, esc, ICONS, weekday, momentYour,
  RoutineWord, listOf, nextChanceLine, revealEnd, readingTime,
} from './ui.js';
import { routineIcon } from './icons.js';
import { person } from '../../src/lessons/choices/journey-icons.js';
import { DAYS, MOMENTS, SETUPS, WEEK_ONE_END, momentFit, replay, weekSummary } from './model.js';
import { routineOptions, autoHow, resultLine, soccerLine } from './story.js';

const RESUME_MS = 1500;
const isWeekend = index => ['weekend', 'sunday'].includes(DAYS[index].kind);

export function start(app) {
  let ui;
  let panel;
  let plan;
  let decisions;
  let timer = 0;
  let paused = false;
  let auto = null;
  let checked = false;
  let moved = {}; // routines whose moment moved at the plan check
  let weekendAnswers = {}; // the first weekend's picks, by weekday

  const active = () => plan.routines;
  const otherOf = routine => (routine === 'cello' ? 'reading' : 'cello');
  // The bad-luck day hits cello when cello is in the plan, else the book.
  const snagRoutine = () => (active().includes('cello') ? 'cello' : 'reading');
  const life = () => replay(decisions);

  function reset() {
    clearTimeout(timer);
    plan = { pick: 'cello', both: false, routines: ['cello'], cello: { moment: null, setup: null }, reading: { moment: null, setup: null } };
    decisions = [];
    paused = false;
    checked = false;
    moved = {};
    weekendAnswers = {};
    ui = mountFrame(app, 'c', { onRestart: reset });
    ui.feed.insertAdjacentHTML('beforebegin', `<div class="l2-auto" hidden>
        <p class="l2-auto-text" data-role="auto-text">${esc(t('l2.c.playing'))}</p>
        <button type="button" class="pill-button" data-action="pause">${esc(t('l2.c.pause'))}</button>
        <button type="button" class="pill-button" data-action="step">${esc(t('l2.c.step'))}</button>
      </div>`);
    auto = ui.feed.previousElementSibling;
    auto.querySelector('[data-action="pause"]').addEventListener('click', togglePause);
    auto.querySelector('[data-action="step"]').addEventListener('click', () => { clearTimeout(timer); runDay(decisions.length); });
    buildPanel();
    showPlan();
  }

  function buildPanel() {
    panel = createPanel(ui.panel, { routines: active() });
    panel.update(life());
  }

  // ——— The Sunday board ———
  function chips(routine, field) {
    const values = field === 'moment' ? MOMENTS : SETUPS[routine];
    return values.map(value => `<button type="button" class="l2-chip-choice" data-routine="${routine}" data-field="${field}" data-value="${value}" aria-pressed="${plan[routine][field] === value}">
        ${ICONS[value]}<span>${esc(t(field === 'moment' ? `l2.moment.${value}` : `l2.setup.${value}`))}</span></button>`).join('');
  }

  function showPlan() {
    const pickChip = routine => `<button type="button" class="l2-chip-choice" data-field="pick" data-value="${routine}" aria-pressed="${plan.pick === routine}">
        ${routineIcon(routine)}<span>${esc(t(routine === 'cello' ? 'l2.plan.whatCello' : 'l2.plan.whatReading'))}</span></button>`;
    // With one routine the pick above names it; with two, each row says whose it is.
    const row = routine => `<div class="l2-board-row" data-routine="${routine}">
        ${active().length > 1 ? `<p class="l2-board-name">${routineIcon(routine)}<span>${esc(RoutineWord(routine))}</span></p>` : ''}
        <fieldset class="l2-choice"><legend>${esc(t('l2.c.moment'))}</legend><div class="l2-chips">${chips(routine, 'moment')}</div></fieldset>
        <fieldset class="l2-choice"><legend>${esc(t('l2.c.ready'))}</legend><div class="l2-chips">${chips(routine, 'setup')}</div></fieldset>
      </div>`;
    const card = addCard(ui.feed, `<div class="l2-plan-head">
        <div><p class="kicker">${esc(t('l2.c.kicker'))}</p>
        <h2 class="l2-situation" tabindex="-1" data-focus>${esc(t('l2.c.heading'))}</h2>
        <p class="l2-intro">${esc(t('l2.c.text'))}</p></div>
        <div class="l2-scene" aria-hidden="true">${person({ shirt: '#285442' })}<span class="l2-scene-item" data-for="cello"></span><span class="l2-scene-item" data-for="reading"></span></div>
      </div>
      <div class="l2-board">
        <fieldset class="l2-choice"><legend>${esc(t('l2.plan.what'))}</legend><div class="l2-chips">${pickChip('cello')}${pickChip('reading')}</div></fieldset>
        <div class="l2-board" data-role="rows"></div>
        <div><button type="button" class="pill-button l2-add" data-action="add" aria-pressed="false"></button></div>
      </div>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="go">${esc(t('l2.c.go'))}</button>
        <p class="l2-hint" role="alert" hidden>${esc(t('l2.plan.needs'))}</p></div>`, { className: 'l2-plan' });
    const add = card.querySelector('[data-action="add"]');
    function drawRows() {
      plan.routines = plan.both ? [plan.pick, otherOf(plan.pick)] : [plan.pick];
      card.querySelector('[data-role="rows"]').innerHTML = active().map(row).join('');
      add.textContent = t(`l2.c.add.${otherOf(plan.pick)}`);
      add.setAttribute('aria-pressed', String(plan.both));
      for (const routine of ['cello', 'reading']) {
        const setup = active().includes(routine) ? plan[routine].setup : null;
        card.querySelector(`.l2-scene-item[data-for="${routine}"]`).innerHTML = setup ? ICONS[setup] : '';
      }
      buildPanel();
    }
    drawRows();
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, field, value } = chip.dataset;
        card.querySelector('.l2-hint').hidden = true;
        if (field === 'pick') {
          plan.pick = value;
          card.querySelectorAll('.l2-chip-choice[data-field="pick"]').forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
          drawRows();
          return;
        }
        plan[routine][field] = value;
        card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"][data-field="${field}"]`)
          .forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
        if (field === 'setup') card.querySelector(`.l2-scene-item[data-for="${routine}"]`).innerHTML = ICONS[value];
        return;
      }
      if (event.target.closest('[data-action="add"]')) {
        plan.both = !plan.both;
        drawRows();
        return;
      }
      if (event.target.closest('[data-action="go"]')) {
        const missing = active().flatMap(routine => ['moment', 'setup'].filter(field => !plan[routine][field]).map(field => ({ routine, field })));
        if (missing.length) {
          card.querySelector('.l2-hint').hidden = false;
          card.querySelector(`.l2-chip-choice[data-routine="${missing[0].routine}"][data-field="${missing[0].field}"]`).focus();
          return;
        }
        add.disabled = true;
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
    else schedule(RESUME_MS);
  }

  function schedule(ms) {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => runDay(decisions.length), ms);
  }

  function setAuto(waiting) {
    auto.querySelector('[data-action="step"]').disabled = waiting;
    auto.querySelector('[data-action="pause"]').disabled = waiting;
  }

  /** "Next chance for cello: Tuesday, after your snack." after a skipped day. */
  function nextLines(index) {
    const last = decisions[index - 1];
    if (!last) return [];
    return active().filter(routine => last.plan[routine] === 'skip')
      .map(routine => nextChanceLine(index - 1, plan[routine].moment, index, routine));
  }

  function asksFor(index) {
    return Object.fromEntries(active().map(routine => [routine, routineOptions(routine, index, plan[routine].moment, { ask: 'events', snag: snagRoutine() })]));
  }

  const isQuiet = index => Object.values(asksFor(index)).every(options => !options);

  // Days where both routines are asked the same question get one row.
  function combined(index) {
    const day = DAYS[index];
    const fits = Object.fromEntries(active().map(routine => [routine, momentFit(plan[routine].moment, day)]));
    if (day.tempt === 'party') {
      const then = Object.fromEntries(active().map(routine => [routine, plan[routine].moment === 'snack' ? 'skip' : 'moment']));
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
    const asks = asksFor(index);
    const asked = active().filter(routine => asks[routine]);
    if (!asked.length) { quietStretch(index); return; }
    const both = asked.length === 2 ? combined(index) : null;
    const rows = both ? [{ key: 'both', options: both }] : asked.map(routine => ({ key: routine, options: asks[routine] }));
    const again = sameAsLastWeekend(index, rows);
    if (again) replayDay(index, rows, again);
    else eventDay(index, rows);
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

  // The first two starts at a moved moment are new: they grow like another time.
  function isFresh(routine, index) {
    if (!moved[routine] || index <= WEEK_ONE_END) return false;
    return decisions.slice(WEEK_ONE_END + 1, index).filter(decision => decision?.plan[routine] === 'moment').length < 2;
  }

  function live(index, decision) {
    const details = { ...decision.options.details };
    for (const [routine, how] of Object.entries(decision.plan)) {
      if (how === 'moment' && isFresh(routine, index)) details[routine] = { ...details[routine], fresh: true };
    }
    decisions[index] = { plan: decision.plan, options: { ...decision.options, details } };
    decisions.length = index + 1;
    return life().log.at(-1);
  }

  // ——— Quiet days: one card per stretch ———
  const lineKey = item => (item.how === 'moment' ? (item.tired ? 'tired' : item.fresh ? 'fresh' : 'moment') : item.how);
  const lineValues = routine => ({ Routine: RoutineWord(routine), routine: t(`l2.routine.${routine}`), moment: momentYour(plan[routine].moment) });

  function quietLine(routine, item) {
    const move = moveOf(item);
    return `<li class="l2-quiet-line">${routineIcon(routine)}<span>${esc(t(`l2.c.line.${lineKey(item)}`, lineValues(routine)))}</span>
      <span class="l2-move" data-move="${move}">${esc(t(`l2.start.delta.${move}`))}</span></li>`;
  }

  /** How a stretch went for one routine, as a key for its Starting chip. */
  function stretchMove(routine, entries) {
    const items = entries.map(entry => entry.routines[routine]);
    const starts = items.filter(item => item.how === 'moment');
    if (!starts.length) return { move: 'still', text: t('l2.start.delta.still') };
    const some = starts.length < items.length;
    if (starts.every(item => item.fresh)) return { move: 'small', text: t('l2.c.stretch.small') };
    if (starts[0].before === 0) {
      return starts.length === 1 ? { move: 'first', text: t('l2.start.delta.first') } : { move: 'first', text: t(some ? 'l2.c.stretch.firstSome' : 'l2.c.stretch.first') };
    }
    return { move: 'up', text: t(some ? 'l2.c.stretch.upSome' : 'l2.c.stretch.up') };
  }

  /** "Tuesday: Soccer happened…" for a day in a stretch that had more than the plan. */
  function dayNote(entry) {
    const parts = [];
    const soccer = soccerLine(entry);
    if (soccer) parts.push(soccer);
    const items = active().map(routine => entry.routines[routine]);
    if (items.some(item => item.how === 'gone')) parts.push(t('l2.c.note.gone'));
    else if (DAYS[entry.index].kind === 'soccer' && items.some(item => item.tired)) parts.push(t('l2.fit.tired.bed'));
    return parts.length ? t('l2.announce', { weekday: weekday(entry.index), result: parts.join(' ') }) : '';
  }

  function quietStretch(first) {
    let last = first;
    while (last + 1 < DAYS.length && last + 1 !== WEEK_ONE_END + 1 && isQuiet(last + 1)) last += 1;
    const next = nextLines(first);
    const entries = [];
    for (let index = first; index <= last; index += 1) {
      const { decided, details } = autoPlan(index, active());
      entries.push(live(index, { plan: decided, options: { details } }));
    }
    const now = life();
    let html;
    let spoken;
    let moves;
    if (first === last) {
      const entry = entries[0];
      const soccer = soccerLine(entry);
      html = `${dayHead(first, { routine: snagRoutine(), next })}
        <ul class="l2-quiet">${active().map(routine => quietLine(routine, entry.routines[routine])).join('')}</ul>
        ${soccer ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(soccer)}</span></p>` : ''}`;
      spoken = t('l2.announce', { weekday: weekday(first), result: [...active().map(routine => t(`l2.c.line.${lineKey(entry.routines[routine])}`, lineValues(routine))), soccer].join(' ') });
      moves = movesFor(entry);
    } else {
      const days = t('l2.c.days', { from: weekday(first), to: weekday(last) });
      const label = dayLabel(first) === weekday(first) ? days : t('l2.day.label', { weekday: days, week: t(`l2.week.${DAYS[first].week}`) });
      const items = active().map((routine, i) => t('l2.c.stretch.item', { routine: i === 0 ? RoutineWord(routine) : t(`l2.routine.${routine}`), moment: momentYour(plan[routine].moment) }));
      const heading = t('l2.c.stretch.plan', { items: listOf(items) });
      const lastItems = Object.fromEntries(active().map(routine => [routine, entries.at(-1).routines[routine]]));
      const how = Object.fromEntries(active().map(routine => [routine, stretchMove(routine, entries)]));
      const same = active().every(routine => how[routine].text === how[active()[0]].text);
      const chipsHtml = same
        ? moveChip(active(), lastItems, how[active()[0]].move, how[active()[0]].text)
        : `<div class="l2-start-chips">${active().map(routine => moveChip([routine], lastItems, how[routine].move, how[routine].text)).join('')}</div>`;
      const notes = entries.map(dayNote).filter(Boolean);
      html = `<p class="l2-day">${esc(label)}</p>
        ${next.map(line => `<p class="l2-next">${ICONS.clock}<span>${esc(line)}</span></p>`).join('')}
        <h2 class="l2-situation" tabindex="-1" data-focus>${esc(heading)}</h2>
        ${chipsHtml}
        ${notes.map(note => `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(note)}</span></p>`).join('')}`;
      spoken = [`${days}: ${heading}`, ...active().map(routine => how[routine].text), ...notes].join(' ');
      moves = Object.fromEntries(active().map(routine => [routine, how[routine].move]));
    }
    const card = addCard(ui.feed, html, { className: 'l2-day-card is-quiet', focus: false, day: first });
    panel.update(now, { current: last + 1, moves });
    announce(ui.live, spoken);
    setAuto(false);
    schedule(readingTime(card));
  }

  // ——— Days that ask ———
  const rowMarkup = row => `<div class="l2-ask-row" data-row="${row.key}">
      ${row.key === 'both' ? '' : `<p class="l2-ask-name">${routineIcon(row.key)}<span>${esc(RoutineWord(row.key))} · ${esc(momentYour(plan[row.key].moment))}</span></p>`}
      ${optionsMarkup(row.options)}</div>`;

  function eventDay(index, rows) {
    setAuto(true);
    const card = addCard(ui.feed, `${dayHead(index, { routine: snagRoutine(), next: nextLines(index) })}
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
      if (DAYS[index].week === 1 && isWeekend(index)) {
        weekendAnswers[DAYS[index].weekday] = {
          shape: rows.map(item => `${item.key}:${item.options.length}`).join(),
          picks: Object.fromEntries(rows.map(item => [item.key, item.options.indexOf(answers[item.key])])),
        };
      }
      resolve(index, card, answers, { replayed: false, rows });
    });
  }

  /** On the second weekend, the first weekend's answer, if the day asks the same thing. */
  function sameAsLastWeekend(index, rows) {
    if (DAYS[index].week !== 2 || !isWeekend(index)) return null;
    const last = weekendAnswers[DAYS[index].weekday];
    if (!last || last.shape !== rows.map(row => `${row.key}:${row.options.length}`).join()) return null;
    return Object.fromEntries(rows.map(row => [row.key, row.options[last.picks[row.key]]]));
  }

  function replayDay(index, rows, answers) {
    const card = addCard(ui.feed, `${dayHead(index, { routine: snagRoutine(), next: nextLines(index) })}
      <p class="l2-again">${esc(t('l2.c.again'))}</p>
      <div class="l2-result" data-role="result"></div>`, { className: 'l2-day-card', focus: false, day: index });
    resolve(index, card, answers, { replayed: true, rows });
  }

  function resolve(index, card, answers, { replayed, rows }) {
    const routines = active();
    const decided = {};
    const details = {};
    const extra = [];
    if (answers.both) {
      for (const routine of routines) {
        decided[routine] = answers.both.plan[routine];
        details[routine] = { tired: Boolean(answers.both.tired), icon: answers.both.alt ?? (answers.both.plan[routine] === 'rest' ? 'restSmall' : undefined) };
      }
    } else {
      const unasked = autoPlan(index, routines.filter(routine => !answers[routine]));
      Object.assign(decided, unasked.decided);
      Object.assign(details, unasked.details);
      for (const routine of routines) {
        const answer = answers[routine];
        if (!answer) continue;
        decided[routine] = answer.how;
        details[routine] = { tired: Boolean(answer.tired), icon: answer.alt };
        extra.push(...(answer.extra ?? []));
      }
    }
    const entry = live(index, { plan: decided, options: { details, extra } });
    panel.update(life(), { current: index + 1, moves: movesFor(entry) });
    const together = bothLine(entry, index);
    const sentences = together ? [together] : routines.map(routine => resultLine(routine, entry.routines[routine], index));
    const soccer = soccerLine(entry);
    const result = card.querySelector('[data-role="result"]');
    result.innerHTML = `${sentences.map(line => `<p>${esc(line)}</p>`).join('')}
      ${startChips(routines, entry.routines)}
      ${soccer ? `<p class="l2-soccer-line">${ICONS.soccerSmall}<span>${esc(soccer)}</span></p>` : ''}
      ${replayed ? `<button type="button" class="pill-button l2-change" data-action="change">${esc(t('l2.change'))}</button>` : ''}`;
    announce(ui.live, t('l2.announce', { weekday: weekday(index), result: [replayed ? t('l2.c.again') : '', ...sentences].filter(Boolean).join(' ') }));
    setAuto(false);
    if (replayed) {
      result.querySelector('[data-action="change"]').addEventListener('click', () => {
        clearTimeout(timer);
        decisions.length = index;
        panel.update(life(), { current: index });
        card.remove();
        eventDay(index, rows);
      });
      schedule(readingTime(card));
      return;
    }
    // The answer given, the days play on by themselves after time to read it; Pause stops them.
    auto.querySelector('[data-action="pause"]').focus({ preventScroll: true });
    revealEnd(ui.feed, card);
    schedule(readingTime(result));
  }

  /** One sentence when both routines went the same way (a day off, rest, a new time). */
  function bothLine(entry, index) {
    if (active().length < 2) return '';
    const [a, b] = active().map(routine => entry.routines[routine]);
    if (a.how !== b.how || !['skip', 'rest', 'other'].includes(a.how)) return '';
    if (a.how === 'skip') return a.moved === 'down' && b.moved === 'down' ? t('l2.res.slip.both') : a.moved === b.moved ? t('l2.res.skip.both') : '';
    if (a.how === 'rest') return t(isWeekend(index) ? 'l2.res.restWeekend.both' : 'l2.res.rest.both');
    return t(isWeekend(index) ? 'l2.res.weekend.both' : 'l2.res.other.both');
  }

  // ——— The plan check ———
  function showCheck() {
    setAuto(true);
    const now = life();
    const row = routine => {
      const moment = plan[routine].moment;
      const summary = weekSummary(now, routine, { moment });
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
      ${active().map(row).join('')}
      <p class="l2-intro">${esc(t(active().length > 1 ? 'l2.c.check.ask' : 'l2.check.ask'))}</p>
      <div class="l2-actions"><button type="button" class="btn btn-primary" data-action="week2">${esc(t('l2.check.go'))}</button></div>`, { className: 'l2-check' });
    const original = Object.fromEntries(active().map(routine => [routine, plan[routine].moment]));
    card.addEventListener('click', event => {
      const chip = event.target.closest('.l2-chip-choice');
      if (chip && !chip.disabled) {
        const { routine, value } = chip.dataset;
        plan[routine].moment = value;
        card.querySelectorAll(`.l2-chip-choice[data-routine="${routine}"]`).forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
        const result = card.querySelector(`.l2-check-row[data-routine="${routine}"] [data-role="moved"]`);
        result.textContent = value === original[routine] ? t('l2.c.check.kept') : t('l2.c.check.moved', { Routine: RoutineWord(routine), moment: momentYour(value) });
        announce(ui.live, result.textContent);
        return;
      }
      if (event.target.closest('[data-action="week2"]')) {
        checked = true;
        moved = Object.fromEntries(active().map(routine => [routine, plan[routine].moment !== original[routine]]));
        setAuto(false);
        runDay(WEEK_ONE_END + 1);
      }
    });
  }

  function done() {
    auto.hidden = true;
    const now = life();
    panel.update(now, { current: -1 });
    finish(ui.feed, now, active(), { onAgain: reset });
    announce(ui.live, t('l2.end.heading'));
  }

  reset();
}
