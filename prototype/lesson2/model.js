// Lesson 2 game model, shared by the three directions. Pure functions only:
// the same day decisions always replay to the same state.
//
// The Starting track depends on counts, never on order: how many times a
// routine happened at its moment (with its set-up ready), how many times at
// another time, and how many days the reader chose to skip it. There is no
// consecutive-day state anywhere. Rest, bad luck and a moment that didn't come
// never set Starting back; the first two skips change nothing; only after
// that does each further skip let it slip a little.
//
// Skills reuse Lesson 1's model (journey-game.js). Neither is a real rate.

import { applyActivity, createSkillState, MAX_ENERGY } from '../../src/lessons/choices/journey-game.js';

export const ROUTINES = ['cello', 'reading'];
export const MOMENTS = ['snack', 'dinner', 'bed'];
export const SETUPS = { cello: ['stand', 'music'], reading: ['pillow', 'table'] };

// The same fourteen days in every direction. `kind` decides whether a
// weekday moment can happen; events add a situation on top.
export const DAYS = [
  { id: 'd1', weekday: 'mon', week: 1, kind: 'school' },
  { id: 'd2', weekday: 'tue', week: 1, kind: 'soccer' },
  { id: 'd3', weekday: 'wed', week: 1, kind: 'school', tempt: 'tag' },
  { id: 'd4', weekday: 'thu', week: 1, kind: 'school', chance: 'bad', event: 'rain' },
  { id: 'd5', weekday: 'fri', week: 1, kind: 'school', tired: true },
  { id: 'd6', weekday: 'sat', week: 1, kind: 'weekend', match: true },
  { id: 'd7', weekday: 'sun', week: 1, kind: 'sunday' },
  { id: 'd8', weekday: 'mon', week: 2, kind: 'school', tempt: 'party' },
  { id: 'd9', weekday: 'tue', week: 2, kind: 'soccer' },
  { id: 'd10', weekday: 'wed', week: 2, kind: 'school', chance: 'bad', event: 'snag' },
  { id: 'd11', weekday: 'thu', week: 2, kind: 'soccer', chance: 'lucky', event: 'trick' },
  { id: 'd12', weekday: 'fri', week: 2, kind: 'school', tempt: 'cousins', busy: 'dinner' },
  { id: 'd13', weekday: 'sat', week: 2, kind: 'weekend', match: true },
  { id: 'd14', weekday: 'sun', week: 2, kind: 'sunday', last: true },
];
export const WEEK_ONE_END = 6; // index of the first Sunday: the plan check follows it

/** Does soccer happen today? The coach sets it; rain can cancel it. */
export const soccerToday = day => (day.kind === 'soccer' || day.match) && day.event !== 'rain';

/**
 * How a weekday moment fits a day:
 * ok · tired (it comes, but you're worn out) · gone (it doesn't come) ·
 * busy (it comes, but something else fills it) · weekend (no school rhythm).
 */
export function momentFit(moment, day) {
  if (day.kind === 'weekend') return 'weekend';
  if (day.kind === 'sunday') return moment === 'snack' ? 'weekend' : 'ok';
  if (day.kind === 'soccer') return moment === 'snack' ? 'gone' : moment === 'bed' ? 'tired' : (day.tired ? 'tired' : 'ok');
  if (day.busy === moment) return 'busy';
  if (day.tired) return 'tired';
  return 'ok';
}

/** The next day (after `index`) on which `moment` comes: "Next chance: Tuesday, after your snack". */
export function nextChance(index, moment) {
  for (let i = index + 1; i < DAYS.length; i += 1) {
    const fit = momentFit(moment, DAYS[i]);
    if (fit === 'ok' || fit === 'tired') return { index: i, weekday: DAYS[i].weekday, moment };
  }
  return null;
}

// ——— Starting ———
export const STEP = { moment: 0.13, other: 0.035 };
export const FREE_SKIPS = 2;
export const SLIP = 0.035;
export const STAGES = [0, 0.2, 0.45, 0.7]; // takes a push · a little easier · getting easier · feels normal

export const emptyTally = () => ({ moment: 0, other: 0, skips: 0, rests: 0, luck: 0, gone: 0 });

/** Starting level, 0..1, from counts alone. */
export function startingLevel({ moment = 0, other = 0, skips = 0 } = {}) {
  const grown = 1 - ((1 - STEP.moment) ** moment) * ((1 - STEP.other) ** other);
  return Math.max(0, round(grown - SLIP * Math.max(0, skips - FREE_SKIPS)));
}

export function startingStage(level) {
  let stage = 0;
  STAGES.forEach((threshold, index) => { if (level >= threshold) stage = index; });
  return stage;
}

// ——— Skills and the book ———
const SKILL_SCALE = { cello: 0.9, soccer: 1.15 };
const ACTIVITY = { cello: 'celloPractice', soccer: 'soccerPractice', trick: 'drillPractice', hallway: 'hallwayDribble' };
const BOOK_STEP = 0.105;
const TIRED_BOOK = 0.7;
export const BOOK_STAGES = [0, 0.12, 0.4, 0.65, 0.95]; // first pages · into the story · past the middle · nearly the end · finished

export function bookStage(level) {
  let stage = 0;
  BOOK_STAGES.forEach((threshold, index) => { if (level >= threshold) stage = index; });
  return stage;
}

const round = value => Math.round(value * 1000) / 1000;

function practise(levels, what, tired) {
  const group = what === 'cello' ? 'cello' : 'soccer';
  const state = { ...createSkillState(levels), energy: tired ? 0 : MAX_ENERGY };
  const { state: next, result } = applyActivity(state, ACTIVITY[what], { scale: SKILL_SCALE[group] });
  return { levels: next.levels, gains: result.gains };
}

export function createLife() {
  return {
    levels: createSkillState().levels,
    book: 0,
    tally: { cello: emptyTally(), reading: emptyTally() },
    log: [],
  };
}

const DONE = new Set(['moment', 'other']);
const TALLY_KEY = { moment: 'moment', other: 'other', skip: 'skips', rest: 'rests', luck: 'luck', gone: 'gone' };

/**
 * Live one day. `plan` maps each routine in play to how it went:
 * moment (at its moment, set-up ready) · other (another time) · skip (chose
 * something else) · rest · luck (circumstance) · gone (the moment didn't come).
 * `extra` lists soccer-side activities the reader chose (hallway dribbling).
 */
export function liveDay(life, index, plan, { extra = [], tired = DAYS[index].tired, details = {} } = {}) {
  const day = DAYS[index];
  let levels = { ...life.levels };
  let book = life.book;
  const tally = { cello: { ...life.tally.cello }, reading: { ...life.tally.reading } };
  const routines = {};
  const gains = {};
  for (const [routine, how] of Object.entries(plan)) {
    const before = startingLevel(tally[routine]);
    tally[routine][TALLY_KEY[how]] += 1;
    const after = startingLevel(tally[routine]);
    const isTired = DONE.has(how) && Boolean(details[routine]?.tired ?? tired);
    if (DONE.has(how)) {
      if (routine === 'cello') {
        const result = practise(levels, 'cello', isTired);
        levels = result.levels;
        Object.assign(gains, result.gains);
      } else {
        book = round(Math.min(1, book + BOOK_STEP * (isTired ? TIRED_BOOK : 1)));
      }
    }
    routines[routine] = {
      ...details[routine],
      how, before, after, tired: isTired,
      stageBefore: startingStage(before), stageAfter: startingStage(after),
      moved: after > before ? 'up' : after < before ? 'down' : 'still',
    };
  }
  const soccer = [];
  if (soccerToday(day)) soccer.push(day.event === 'trick' ? 'trick' : 'soccer');
  for (const what of extra) soccer.push(what);
  for (const what of soccer) {
    const result = practise(levels, what, false);
    levels = result.levels;
    Object.assign(gains, result.gains);
  }
  const entry = { index, day: day.id, routines, soccer, extra, gains };
  return { levels, book, tally, log: [...life.log, entry] };
}

/** Replay a list of { plan, options } day decisions from the start. */
export function replay(decisions) {
  let life = createLife();
  decisions.forEach((decision, index) => {
    if (decision) life = liveDay(life, index, decision.plan, decision.options);
  });
  return life;
}

/** Week-one words for the plan check: how often the moment came and was used. */
export function weekSummary(life, routine, { from = 0, to = WEEK_ONE_END } = {}) {
  const entries = life.log.filter(entry => entry.index >= from && entry.index <= to && entry.routines[routine]);
  const chances = entries.filter(entry => !['rest', 'luck'].includes(entry.routines[routine].how) && DAYS[entry.index].kind !== 'weekend' && !(DAYS[entry.index].kind === 'sunday' && entry.routines[routine].how !== 'moment'));
  const used = chances.filter(entry => entry.routines[routine].how === 'moment').length;
  const snags = entries.filter(entry => entry.routines[routine].how === 'gone').map(entry => DAYS[entry.index].weekday);
  let word = 'none';
  if (chances.length && used === chances.length) word = 'all';
  else if (used >= chances.length * 0.6) word = 'most';
  else if (used > 0) word = 'some';
  return { word, snags: [...new Set(snags)] };
}
