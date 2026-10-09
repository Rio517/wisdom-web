// Direction D's model: fourteen days, the reader's three activities, and how
// easy each home activity has become to start. Pure and count-based, so the
// same days in any order end in the same place, and nothing ever goes down.
// No words here: labels and situations live in copy.json under l2.d.*.

/** The three kinds, in the panel's order. */
export const KINDS = ['instrument', 'quiet', 'sport'];
/** The two kinds the reader starts at home; the sport is started for them. */
export const HOME = ['instrument', 'quiet'];

export const CHOICES = {
  instrument: ['cello', 'piano', 'guitar'],
  quiet: ['reading', 'drawing', 'chess'],
  sport: ['soccer', 'gymnastics', 'swimming'],
};
export const DEFAULT_PICKS = { instrument: 'cello', quiet: 'reading', sport: 'soccer' };

/** Two skills per activity (labels: l2.d.skill.<id>). */
export const SKILLS = {
  soccer: ['ballControl', 'passing'],
  gymnastics: ['balance', 'cartwheels'],
  swimming: ['strokes', 'breathing'],
  cello: ['readingMusic', 'fingers'],
  piano: ['readingMusic', 'bothHands'],
  guitar: ['chords', 'rhythm'],
  reading: ['pages', 'bigWords'],
  drawing: ['shapes', 'shading'],
  chess: ['openings', 'checkmates'],
};

/** Each home activity's usual time; the day's option carries its time as a caption. */
export const USUAL = { instrument: 'snack', quiet: 'bed' };

const I = time => ({ id: 'instrument', time });
const Q = { id: 'quiet', time: 'bed' };
const S = event => ({ id: 'sport', event });
const F = (id, icon) => ({ id, icon });

/** Sport on Tuesday, Thursday and Saturday; the first Thursday is cancelled, the second brings a new trick. */
export const DAYS = [
  { weekday: 'mon', options: [I('snack'), Q, F('videos', 'screen')] },
  { weekday: 'tue', options: [S('practice'), I('dinner'), F('game', 'screen')] },
  { weekday: 'wed', options: [F('tag', 'friends'), I('snack'), Q] },
  { weekday: 'thu', chance: 'unlucky', options: [I('snack'), F('fort', 'fort'), Q] },
  { weekday: 'fri', options: [F('nap', 'rest'), I('snack'), Q] },
  { weekday: 'sat', options: [S('match'), I('lunch'), Q] },
  { weekday: 'sun', options: [F('rest', 'rest'), I('breakfast'), Q] },
  { weekday: 'mon', options: [F('party', 'party'), I('snack'), Q] },
  { weekday: 'tue', options: [S('practice'), I('dinner'), Q] },
  { weekday: 'wed', chance: 'unlucky', options: [F('sleep', 'rest'), F('film', 'screen'), Q] },
  { weekday: 'thu', chance: 'lucky', options: [S('practice'), I('dinner'), Q] },
  { weekday: 'fri', options: [F('cousins', 'friends'), I('snack'), Q] },
  { weekday: 'sat', options: [S('match'), Q, F('lazy', 'rest')] },
  { weekday: 'sun', options: [F('rest', 'rest'), I('breakfast'), Q] },
].map((day, index) => ({
  chance: null,
  ...day,
  index,
  week: index < 7 ? 1 : 2,
  weekend: day.weekday === 'sat' || day.weekday === 'sun',
}));

export const isKind = id => KINDS.includes(id);

// ——— Starting ———
// A start at the usual time is a full notch (0.14), any other start half of
// one. Misses, rest and bad luck add nothing and take nothing away.
export function startingLevel(usual, other) {
  return Math.min(1, ((2 * usual + other) * 7) / 100);
}

/** 0 takes a push · 1 a little easier · 2 getting easier · 3 feels normal (l2.start.stage.*). */
export function startingStage(level) {
  if (level >= 1) return 3;
  if (level >= 0.5) return 2;
  if (level > 0) return 1;
  return 0;
}

/** The Light look's notch, 0–4: the icon's brightness and the disc behind it. */
export const lightStep = level => Math.min(4, Math.ceil(level * 4 - 1e-9));

// ——— Skills ———
// One start grows a bar by step × (0.35 + 0.65 × room), Lesson 1's ease-out.
// That is L + s(1 − 0.65 L), so (1/0.65 − L) shrinks by (1 − 0.65 s) each
// time: the level depends only on how many starts there were, not their order.
const K = 0.65;
/** Per-skill step: the second skill of each pair grows a little slower, so the two bars differ. */
export const STEPS = [0.12, 0.1];
export const LUCKY = 1.6;

export function skillLevel(step, normal, lucky) {
  return Math.min(1, (1 - (1 - K * step) ** normal * (1 - K * step * LUCKY) ** lucky) / K);
}

function emptyCounts() {
  return Object.fromEntries(KINDS.map(kind => [kind, { usual: 0, other: 0, normal: 0, lucky: 0 }]));
}

function levelsFrom(counts, picks) {
  const starting = Object.fromEntries(HOME.map(kind => [kind, startingLevel(counts[kind].usual, counts[kind].other)]));
  const skills = Object.fromEntries(KINDS.map(kind => {
    const { normal, lucky } = counts[kind];
    return [kind, Object.fromEntries(SKILLS[picks[kind]].map((id, i) => [id, skillLevel(STEPS[i], normal, lucky)]))];
  }));
  return { starting, skills };
}

/**
 * Replay a list of choices (an option id per day, or null for a day not lived
 * yet) over the days. Returns the end levels and, per lived day, what moved:
 * `move` is 'started' (a first start), 'easier' (the path moved) or null.
 */
export function replay(choices, picks = DEFAULT_PICKS, days = DAYS) {
  const counts = emptyCounts();
  const history = [];
  let before = levelsFrom(counts, picks);
  days.forEach((day, index) => {
    const id = choices[index] ?? null;
    if (id == null) { history.push(null); return; }
    const option = day.options.find(item => item.id === id);
    if (!option) throw new Error(`Day ${index + 1} has no option "${id}"`);
    if (isKind(id)) {
      const count = counts[id];
      if (HOME.includes(id)) count[option.time === USUAL[id] ? 'usual' : 'other'] += 1;
      count[id === 'sport' && day.chance === 'lucky' ? 'lucky' : 'normal'] += 1;
    }
    const after = levelsFrom(counts, picks);
    const entry = { day: index, id, kind: isKind(id) ? id : null, activity: isKind(id) ? picks[id] : null, option, grew: [], move: null, stage: null };
    if (entry.kind) {
      entry.grew = Object.keys(after.skills[id]).filter(skill => after.skills[id][skill] > before.skills[id][skill] + 1e-9);
      if (HOME.includes(id)) {
        const from = before.starting[id];
        const to = after.starting[id];
        entry.move = to > from + 1e-9 ? (from === 0 ? 'started' : 'easier') : null;
        entry.stage = startingStage(to);
      }
    }
    history.push(entry);
    before = after;
  });
  return { ...before, history };
}

/** The first day not lived yet (or the number of days, when every day is lived). */
export function frontierIndex(choices) {
  const index = choices.findIndex(id => id == null);
  return index === -1 ? choices.length : index;
}

/** The end card's heading: did any home path reach its middle? */
export const startingGotEasier = starting => HOME.some(kind => starting[kind] >= 0.5);
