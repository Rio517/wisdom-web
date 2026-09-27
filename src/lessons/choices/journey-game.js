// A deliberately small, illustrative skill model for the guided journey.
// It shows an idea—practice builds, and related skills make later practice
// count for more—without claiming real rates. No numbers are shown to readers.

export const SKILL_GROUPS = {
  soccer: {
    label: 'Soccer',
    skills: [
      { id: 'ballControl', label: 'Ball control' },
      { id: 'passing', label: 'Passing' },
      { id: 'positioning', label: 'Positioning' },
    ],
  },
  cello: {
    label: 'Cello',
    skills: [
      { id: 'reading', label: 'Reading music' },
      { id: 'rhythm', label: 'Rhythm' },
      { id: 'fingers', label: 'Finger skill' },
    ],
  },
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

export const TRANSFERS = {
  basketball: {
    label: 'Basketball',
    from: 'soccer',
    skills: [
      { id: 'court', label: 'Court sense', source: 'positioning', share: 0.6, note: 'Knowing where to stand carries across.' },
      { id: 'bPassing', label: 'Passing', source: 'passing', share: 0.55, note: 'Seeing a teammate who is free carries across.' },
      { id: 'dribbling', label: 'Dribbling with hands', source: 'ballControl', share: 0.12, note: 'Hands instead of feet—mostly new.' },
    ],
  },
  guitar: {
    label: 'Guitar',
    from: 'cello',
    skills: [
      { id: 'gReading', label: 'Reading music', source: 'reading', share: 0.7, note: 'Notes on the page are the same.' },
      { id: 'gRhythm', label: 'Rhythm', source: 'rhythm', share: 0.7, note: 'Keeping the beat carries across.' },
      { id: 'gFingers', label: 'Finger skill', source: 'fingers', share: 0.35, note: 'Pressing strings helps, but frets and strumming are new.' },
    ],
  },
};

export const ACTIVITIES = {
  soccerPractice: { label: 'Go to soccer practice', icon: 'soccer', group: 'soccer', gains: { ballControl: 0.05, passing: 0.09, positioning: 0.09 } },
  drillPractice: { label: 'Go to practice', icon: 'soccer', group: 'soccer', gains: { ballControl: 0.05, passing: 0.14, positioning: 0.1 } },
  kickBall: { label: 'Kick the ball against the wall', icon: 'ball', group: 'soccer', gains: { ballControl: 0.11 } },
  hallwayDribble: { label: 'Dribble a ball in the hallway', icon: 'ball', group: 'soccer', gains: { ballControl: 0.1 } },
  celloPractice: { label: 'Practise cello for 15 minutes', icon: 'cello', group: 'cello', gains: { reading: 0.04, rhythm: 0.04, fingers: 0.1 } },
  celloSolo: { label: 'Practise cello on your own', icon: 'cello', group: 'cello', gains: { reading: 0.05, rhythm: 0.04, fingers: 0.1 } },
  celloLesson: { label: 'Go to your cello lesson', icon: 'cello', group: 'cello', gains: { reading: 0.1, rhythm: 0.08, fingers: 0.05 } },
  video: { label: 'Goof off with videos', icon: 'screen', rest: true },
  nap: { label: 'Take a nap', icon: 'rest', rest: true },
  tag: { label: 'Play tag with friends', icon: 'friends', rest: true },
  fort: { label: 'Build a blanket fort', icon: 'fort', rest: true },
  game: { label: 'Play the new video game', icon: 'screen', rest: true },
  rest: { label: 'Rest', icon: 'rest', rest: true },
  comic: { label: 'Read a comic', icon: 'book', rest: true },
  friend: { label: 'Go to your friend’s house', icon: 'friends', rest: true },
};

export const DAYS = [
  { label: 'Monday', situation: 'Soccer practice is at four. Your cello is leaning in the corner.', options: ['soccerPractice', 'celloPractice', 'video'] },
  { label: 'Tuesday', situation: 'Cello lesson today. School was long and you’re a bit tired.', options: ['celloLesson', 'kickBall', 'nap'] },
  { label: 'Wednesday', situation: 'Your friends are playing tag in the park.', options: ['tag', 'celloPractice', 'kickBall'] },
  { label: 'Thursday', situation: 'Rain! Soccer practice is cancelled.', chance: 'Chance', options: ['hallwayDribble', 'celloPractice', 'fort'] },
  { label: 'Friday', situation: 'Soccer practice—and a new video game just came out.', options: ['soccerPractice', 'game', 'celloPractice'] },
  { label: 'Monday', situation: 'You slept badly and you’re really tired.', options: ['rest', 'soccerPractice', 'celloPractice'] },
  { label: 'Tuesday', situation: 'Your cello teacher is ill. No lesson today.', chance: 'Chance', options: ['celloSolo', 'kickBall', 'comic'] },
  { label: 'Wednesday', situation: 'Soccer practice. A friend asks you to come over instead.', options: ['soccerPractice', 'friend', 'celloPractice'] },
  { label: 'Thursday', situation: 'Your coach is teaching a new passing drill today.', chance: 'Lucky break', options: ['drillPractice', 'celloPractice', 'rest'] },
  { label: 'Friday', situation: 'Last afternoon! There’s a match on Saturday and a cello concert next month.', options: ['soccerPractice', 'celloPractice', 'rest'] },
];

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

export function levelWord(level) {
  if (level < 0.06) return 'Just starting';
  if (level < 0.25) return 'Learning';
  if (level < 0.5) return 'Getting there';
  if (level < 0.75) return 'Getting good';
  return 'Strong';
}

export function transferLevels(levels, transferId) {
  const transfer = TRANSFERS[transferId];
  return Object.fromEntries(transfer.skills.map(skill => [skill.id, round((levels[skill.source] ?? 0) * skill.share)]));
}

export function summarize(state) {
  const counts = { soccer: 0, cello: 0, rest: 0, tired: 0 };
  for (const entry of state.history) {
    const activity = ACTIVITIES[entry.activity];
    if (activity.rest) counts.rest += 1;
    else counts[activity.group] += 1;
    if (entry.tired) counts.tired += 1;
  }
  const lines = [];
  if (counts.soccer && counts.cello) lines.push(`You split your time: ${counts.soccer} for soccer, ${counts.cello} for cello. Both grew—neither as far as if you had picked one.`);
  else if (counts.soccer) lines.push(`You gave ${counts.soccer} afternoons to soccer. It grew a lot; the cello waited.`);
  else if (counts.cello) lines.push(`You gave ${counts.cello} afternoons to the cello. It grew a lot; soccer waited.`);
  else lines.push('You rested every afternoon. Nothing new was built—but you can start any day.');
  if (counts.rest) lines.push(`You rested or played ${counts.rest === 1 ? 'once' : `${counts.rest} times`}. Fun and rest matter too.`);
  if (counts.tired) lines.push(`${counts.tired === 1 ? 'Once' : `${counts.tired} times`} you practised while worn out, so less of it stuck.`);
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
