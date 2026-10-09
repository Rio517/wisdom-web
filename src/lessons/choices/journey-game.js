// A deliberately small, illustrative skill model for the guided journey.
// It shows an idea—practice builds, and related skills make later practice
// count for more—without claiming real rates. No numbers are shown to readers.

import { t as runtimeT } from '../../i18n/runtime.js';

// Labels are read from the message catalog (game.*). The getters use the
// page's language; build-time code passes an explicit translator to the helpers.
const withLabel = (item, key) => Object.defineProperty(item, 'label', { get: () => runtimeT(key), enumerable: true });

export const SKILL_GROUPS = {
  soccer: withLabel({ skills: ['ballControl', 'passing', 'positioning'].map(id => withLabel({ id }, `game.skill.${id}`)) }, 'game.group.soccer'),
  cello: withLabel({ skills: ['reading', 'rhythm', 'fingers'].map(id => withLabel({ id }, `game.skill.${id}`)) }, 'game.group.cello'),
};

// Which skill gives each skill “a place to stand”.
export const FOUNDATIONS = {
  ballControl: 'ballControl',
  passing: 'ballControl',
  positioning: 'passing',
  reading: 'reading',
  rhythm: 'reading',
  fingers: 'rhythm',
};

const transferSkill = skill => Object.defineProperty(withLabel(skill, `game.skill.${skill.id}`), 'note',
  { get: () => runtimeT(`game.skill.${skill.id}.carry`), enumerable: true });

export const TRANSFERS = {
  basketball: withLabel({
    from: 'soccer',
    skills: [
      { id: 'court', source: 'positioning', share: 0.6 },
      { id: 'bPassing', source: 'passing', share: 0.55 },
      { id: 'dribbling', source: 'ballControl', share: 0.12 },
    ].map(transferSkill),
  }, 'game.group.basketball'),
  guitar: withLabel({
    from: 'cello',
    skills: [
      { id: 'gReading', source: 'reading', share: 0.7 },
      { id: 'gRhythm', source: 'rhythm', share: 0.7 },
      { id: 'gFingers', source: 'fingers', share: 0.35 },
    ].map(transferSkill),
  }, 'game.group.guitar'),
};

const ACTIVITY_DATA = {
  soccerPractice: { icon: 'soccer', group: 'soccer', gains: { ballControl: 0.05, passing: 0.09, positioning: 0.09 } },
  drillPractice: { icon: 'soccer', group: 'soccer', gains: { ballControl: 0.05, passing: 0.14, positioning: 0.1 } },
  kickBall: { icon: 'ball', group: 'soccer', gains: { ballControl: 0.11 } },
  hallwayDribble: { icon: 'ball', group: 'soccer', gains: { ballControl: 0.1 } },
  celloPractice: { icon: 'cello', group: 'cello', gains: { reading: 0.04, rhythm: 0.04, fingers: 0.1 } },
  celloSolo: { icon: 'cello', group: 'cello', gains: { reading: 0.05, rhythm: 0.04, fingers: 0.1 } },
  celloLesson: { icon: 'cello', group: 'cello', gains: { reading: 0.1, rhythm: 0.08, fingers: 0.05 } },
  video: { icon: 'screen', rest: true },
  nap: { icon: 'rest', rest: true },
  tag: { icon: 'friends', rest: true },
  fort: { icon: 'fort', rest: true },
  game: { icon: 'screen', rest: true },
  rest: { icon: 'rest', rest: true },
  comic: { icon: 'book', rest: true },
  friend: { icon: 'friends', rest: true },
};
export const ACTIVITIES = Object.fromEntries(Object.entries(ACTIVITY_DATA)
  .map(([id, activity]) => [id, withLabel({ ...activity }, `game.activity.${id}`)]));

const DAY_DATA = [
  { weekday: 'mon', options: ['soccerPractice', 'celloPractice', 'video'] },
  { weekday: 'tue', options: ['celloLesson', 'kickBall', 'nap'] },
  { weekday: 'wed', options: ['tag', 'celloPractice', 'kickBall'] },
  { weekday: 'thu', chance: 'chance', options: ['hallwayDribble', 'celloPractice', 'fort'] },
  { weekday: 'fri', options: ['soccerPractice', 'game', 'celloPractice'] },
  { weekday: 'mon', options: ['rest', 'soccerPractice', 'celloPractice'] },
  { weekday: 'tue', chance: 'chance', options: ['celloSolo', 'kickBall', 'comic'] },
  { weekday: 'wed', options: ['soccerPractice', 'friend', 'celloPractice'] },
  { weekday: 'thu', chance: 'lucky', options: ['drillPractice', 'celloPractice', 'rest'] },
  { weekday: 'fri', chance: 'lucky', options: ['soccerPractice', 'celloPractice', 'rest'] },
];

/** A day's words in a given language: weekday, situation, and the chance tag if any. */
export function dayText(index, t = runtimeT) {
  const day = DAY_DATA[index];
  return {
    label: t(`game.weekday.${day.weekday}`),
    situation: t(`game.day${index + 1}.situation`),
    chance: day.chance ? t(`game.chance.${day.chance}`) : undefined,
  };
}

export const DAYS = DAY_DATA.map((day, index) => Object.defineProperties({ options: day.options, weekday: day.weekday }, {
  label: { get: () => dayText(index).label, enumerable: true },
  situation: { get: () => dayText(index).situation, enumerable: true },
  chance: { get: () => dayText(index).chance, enumerable: true },
}));

/** Every day with its options' labels, for the text version of the lesson. */
export function daysWithLabels(t = runtimeT) {
  return DAY_DATA.map((day, index) => ({
    ...dayText(index, t),
    options: day.options.map(id => ({ id, label: t(`game.activity.${id}`) })),
  }));
}

export const MAX_ENERGY = 3;
export const GAME_SCALE = 1.5;
export const MAYA_SCALE = 0.5;
const ALL_SKILLS = Object.values(SKILL_GROUPS).flatMap(group => group.skills.map(skill => skill.id));
const round = value => Math.round(value * 1000) / 1000;

export function createSkillState(levels = {}) {
  return {
    levels: Object.fromEntries(ALL_SKILLS.map(id => [id, levels[id] ?? 0])),
    energy: MAX_ENERGY,
    fun: 0,
    history: [],
  };
}

/** How much a foundation multiplies new practice: slow at first, then faster. */
export function boostFor(foundationLevel) {
  return 0.5 + 1.6 * Math.max(0, Math.min(1, foundationLevel));
}

export function applyActivity(state, activityId, { day = null, scale = GAME_SCALE } = {}) {
  const activity = ACTIVITIES[activityId];
  if (!activity) throw new Error(`Unknown activity ${activityId}`);
  const levels = { ...state.levels };
  const gains = {};
  const boosts = [];
  let energy = state.energy;
  let tired = false;
  let fun = state.fun;
  if (activity.rest) {
    energy = Math.min(MAX_ENERGY, energy + 2);
    fun += 1;
  } else {
    tired = energy <= 0;
    const tiredFactor = tired ? 0.45 : 1;
    for (const [skill, base] of Object.entries(activity.gains)) {
      const foundation = FOUNDATIONS[skill];
      const multiplier = boostFor(state.levels[foundation]);
      const room = 1 - levels[skill];
      const gain = round(Math.min(room, base * scale * multiplier * tiredFactor * (0.35 + 0.65 * room)));
      levels[skill] = round(levels[skill] + gain);
      gains[skill] = gain;
      if (multiplier >= 1.1 && gain > 0) boosts.push({ skill, from: foundation });
    }
    energy = Math.max(0, energy - 1);
  }
  const entry = { day, activity: activityId, gains, boosts, tired, rest: Boolean(activity.rest) };
  return {
    state: { levels, energy, fun, history: [...state.history, entry] },
    result: entry,
  };
}

/**
 * Recompute a full skill state from a sequence of afternoon choices.
 * `choiceIds` holds one activity id per day, in order; `null`/`undefined`
 * marks a day not yet chosen. Replay stops at the first unchosen day, so a
 * sparse trailing tail is fine but a chosen day may not follow an unchosen
 * one. Pure: the same choices always replay to the same state, which lets a
 * reader edit an earlier day and have every later day recompute from it.
 */
export function replayChoices(choiceIds = []) {
  let state = createSkillState();
  for (let day = 0; day < choiceIds.length; day += 1) {
    const activityId = choiceIds[day];
    if (activityId == null) break;
    state = applyActivity(state, activityId, { day }).state;
  }
  return state;
}

export function levelWord(level, t = runtimeT) {
  if (level < 0.06) return t('game.level.starting');
  if (level < 0.25) return t('game.level.learning');
  if (level < 0.5) return t('game.level.gettingThere');
  if (level < 0.75) return t('game.level.good');
  return t('game.level.strong');
}

export function transferLevels(levels, transferId) {
  const transfer = TRANSFERS[transferId];
  return Object.fromEntries(transfer.skills.map(skill => [skill.id, round((levels[skill.source] ?? 0) * skill.share)]));
}

export function summarize(state, t = runtimeT) {
  const counts = { soccer: 0, cello: 0, rest: 0, tired: 0 };
  for (const entry of state.history) {
    const activity = ACTIVITIES[entry.activity];
    if (activity.rest) counts.rest += 1;
    else counts[activity.group] += 1;
    if (entry.tired) counts.tired += 1;
  }
  const lines = [];
  if (counts.soccer && counts.cello) lines.push(t('game.summary.split', { soccer: counts.soccer, cello: counts.cello }));
  else if (counts.soccer) lines.push(t('game.summary.soccerOnly', { count: counts.soccer }));
  else if (counts.cello) lines.push(t('game.summary.celloOnly', { count: counts.cello }));
  else lines.push(t('game.summary.none'));
  if (counts.rest) lines.push(t('game.summary.rest', { count: counts.rest }));
  if (counts.tired) lines.push(t('game.summary.tired', { count: counts.tired }));
  return { counts, lines };
}

/** Maya’s two paths: a season is twelve weeks; each week she practises or doesn’t. */
export const MAYA_PATTERNS = {
  a: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  b: [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
};

export function mayaSeasons({ seasons = 3, pattern, activities = ['soccerPractice', 'kickBall', 'soccerPractice'] }) {
  let state = createSkillState();
  const snapshots = [{ levels: { ...state.levels }, weeks: [] }];
  for (let season = 0; season < seasons; season += 1) {
    const weeks = [];
    pattern.forEach((practised, week) => {
      weeks.push(practised);
      if (!practised) return;
      state = { ...state, energy: MAX_ENERGY };
      state = applyActivity(state, activities[week % activities.length], { scale: MAYA_SCALE }).state;
    });
    snapshots.push({ levels: { ...state.levels }, weeks });
  }
  return snapshots;
}

/** A season of practice on skills without a modelled foundation chain (e.g. a new sport). */
export function practiseSeason(levels, pattern = MAYA_PATTERNS.a, base = 0.05) {
  const next = { ...levels };
  for (const practised of pattern) {
    if (!practised) continue;
    for (const id of Object.keys(next)) {
      const room = 1 - next[id];
      next[id] = round(next[id] + Math.min(room, base * boostFor(next[id]) * (0.35 + 0.65 * room)));
    }
  }
  return next;
}
