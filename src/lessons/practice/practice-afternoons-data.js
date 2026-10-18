// Ten afternoons (Lesson 2's activity): the days, their choices and what each choice grows. The
// skill model is Lesson 1's (journey-game.js): practice builds, related skills make later practice
// count for more, nothing shrinks and no numbers are shown. New here: no energy (rest never makes
// practice count for less), and on afternoon 7 a basketball box opens with a head start carried
// across from soccer (knowing where to stand and passing; dribbling with hands starts empty).
import { applyActivity } from '../choices/journey-game.js';

export const SKILLS = {
  soccer: ['ballControl', 'passing', 'positioning'],
  cello: ['reading', 'rhythm', 'fingers'],
  basketball: ['court', 'bPassing', 'dribbling'],
};
/** Each skill's catalog key (practice.skill.*): basketball's names are soccer's. */
export const SKILL_WORD = { court: 'positioning', bPassing: 'passing' };
const ALL = Object.values(SKILLS).flat();

// Which skill gives each skill a place to stand (Lesson 1's FOUNDATIONS, with basketball's).
export const FOUNDATIONS = {
  ballControl: 'ballControl', passing: 'ballControl', positioning: 'passing',
  reading: 'reading', rhythm: 'reading', fingers: 'rhythm',
  dribbling: 'dribbling', bPassing: 'dribbling', court: 'bPassing',
};

// What basketball brings from soccer when its box opens: a share of the soccer skill under it.
export const CARRY = [
  { id: 'court', from: 'positioning', share: 0.6 },
  { id: 'bPassing', from: 'passing', share: 0.55 },
];

export const ACTIVITIES = {
  soccerPractice: { icon: 'soccer', gains: { ballControl: 0.05, passing: 0.09, positioning: 0.09 } },
  trick: { icon: 'soccer', gains: { ballControl: 0.05, passing: 0.14, positioning: 0.1 } },
  match: { icon: 'soccer', gains: { ballControl: 0.05, passing: 0.09, positioning: 0.12 } },
  kickBall: { icon: 'ball', gains: { ballControl: 0.11 } },
  hallway: { icon: 'ball', gains: { ballControl: 0.1 } },
  celloPractice: { icon: 'cello', gains: { reading: 0.04, rhythm: 0.04, fingers: 0.1 } },
  celloLesson: { icon: 'cello', gains: { reading: 0.1, rhythm: 0.08, fingers: 0.05 } },
  basketball: { icon: 'basketball', gains: { court: 0.08, bPassing: 0.08, dribbling: 0.1 } },
  video: { icon: 'screen', rest: true },
  film: { icon: 'screen', rest: true },
  nap: { icon: 'rest', rest: true },
  rest: { icon: 'rest', rest: true },
  tag: { icon: 'friends', rest: true },
  friend: { icon: 'friends', rest: true },
  fort: { icon: 'fort', rest: true },
  comic: { icon: 'book', rest: true },
};

/** What a choice grows: soccer, cello, basketball, or rest (and fun). */
export function activityGroup(activity) {
  if (activity.rest) return 'rest';
  const skill = Object.keys(activity.gains)[0];
  return Object.keys(SKILLS).find(group => SKILLS[group].includes(skill));
}

/** The day basketball's box opens (0-based): afternoon 7. */
export const OPENS = 6;

export const DAYS = [
  { weekday: 'mon', options: ['soccerPractice', 'celloPractice', 'video'] },
  { weekday: 'tue', options: ['celloLesson', 'kickBall', 'nap'] },
  { weekday: 'wed', options: ['tag', 'celloPractice', 'kickBall'] },
  { weekday: 'thu', options: ['hallway', 'celloPractice', 'fort'] },
  { weekday: 'fri', options: ['soccerPractice', 'film', 'celloPractice'] },
  { weekday: 'mon', options: ['rest', 'soccerPractice', 'celloPractice'] },
  { weekday: 'wed', chance: 'new', options: ['basketball', 'kickBall', 'celloPractice'] },
  { weekday: 'thu', options: ['soccerPractice', 'friend', 'celloPractice'] },
  { weekday: 'fri', options: ['trick', 'celloPractice', 'rest'] },
  { weekday: 'sat', options: ['match', 'celloPractice', 'comic'] },
];

const round = value => Math.round(value * 1000) / 1000;

/** The part of basketball's skills that came from soccer, given soccer's levels when the box opens. */
export const carriedFrom = levels => Object.fromEntries(CARRY.map(item => [item.id, round((levels[item.from] ?? 0) * item.share)]));

/**
 * Every skill after the chosen afternoons (`choices`, one activity id per day; null for a day not yet
 * chosen; replay stops there). Pure, so changing an earlier afternoon recomputes every later one.
 * `carried` is basketball's head start, fixed on the day its box opened.
 */
export function replay(choices) {
  let state = { levels: Object.fromEntries(ALL.map(id => [id, 0])), energy: 3, fun: 0, history: [] };
  let carried = null;
  for (let day = 0; day < choices.length; day += 1) {
    if (day === OPENS) {
      carried = carriedFrom(state.levels);
      state = { ...state, levels: { ...state.levels, ...carried } };
    }
    const id = choices[day];
    if (id == null) break;
    state = applyActivity(state, id, { day, activities: ACTIVITIES, foundations: FOUNDATIONS, tiring: false }).state;
  }
  return { levels: state.levels, history: state.history, carried, open: carried !== null };
}

/** How many afternoons went to each kind of choice. */
export function counts(choices) {
  const out = { soccer: 0, cello: 0, basketball: 0, rest: 0 };
  for (const id of choices) if (id) out[activityGroup(ACTIVITIES[id])] += 1;
  return out;
}

/** The end card's lines: soccer and cello (which grew the most), then basketball's start. */
export function endLines(choices, levels, carried, t) {
  const tally = counts(choices);
  const line = (group, other) => {
    const count = tally[group];
    if (!count) return t(`practice.activity.end.${group}.none`);
    const shape = count > tally[other] ? 'most' : count < tally[other] ? 'less' : 'even';
    return t(`practice.activity.end.${group}.${shape}`, { count });
  };
  const head = carried && Object.values(carried).some(level => level > 0.02);
  return [line('soccer', 'cello'), line('cello', 'soccer'), t(`practice.activity.end.basketball.${head ? 'head' : 'fresh'}`)];
}

