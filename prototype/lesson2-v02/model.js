// Round v02 game model, shared by directions E, F and G. Pure functions: the
// same choices always replay to the same state.
//
// Fourteen days from round v01's model (prototype/lesson2/model.js): two
// weeks with weekends, one bad-luck day (practice is off on the first
// Thursday), one tired day (the first Friday) and one tempting day (a party
// on the second Monday). Each of the reader's three activities has its usual
// days, as a week often does: music or art on Monday and Friday, the sport on
// Tuesday, Thursday and Saturday, the quiet thing on Wednesday and Sunday.
//
// Starting depends on counts only, never on runs of days (v01's rule): how
// many times an activity happened on its usual day, how many times on another
// day, and how many times the reader chose something else on its day. Rest
// and bad luck never cost anything, the first two misses cost nothing, and a
// missed day never wipes anything. Each direction draws the count its own way.
// Skills grow with each start, a little less when tired. None of it is a
// measured rate.

export const KINDS = ['sport', 'art', 'quiet'];
export const CHOICES = {
  sport: ['soccer', 'gymnastics', 'swimming', 'basketball'],
  art: ['cello', 'piano', 'guitar', 'drawing'],
  quiet: ['reading', 'lego', 'chess', 'puzzles'],
};
export const NO_PICKS = { sport: null, art: null, quiet: null };
export const kindOf = activity => KINDS.find(kind => CHOICES[kind].includes(activity)) ?? null;

/** Two skills per activity, Lesson 1's skill boxes. */
export const SKILLS = {
  soccer: ['ballControl', 'passing'], gymnastics: ['balance', 'cartwheels'], swimming: ['strokes', 'breathing'], basketball: ['dribbling', 'shooting'],
  cello: ['readingMusic', 'bowing'], piano: ['readingMusic', 'bothHands'], guitar: ['chords', 'rhythm'], drawing: ['shapes', 'shading'],
  reading: ['speed', 'bigWords'], lego: ['building', 'ideas'], chess: ['openings', 'checkmates'], puzzles: ['patterns', 'patience'],
};

/** Direction E: the get-ready steps before the activity itself (icon and words key). */
export const STEPS = {
  soccer: ['kit', 'bag'], gymnastics: ['kit', 'bag'], swimming: ['kit', 'bag'], basketball: ['kit', 'bag'],
  cello: ['case', 'music'], guitar: ['case', 'music'], piano: ['lid', 'music'], drawing: ['paper', 'pencils'],
  reading: ['pillow', 'lamp'], lego: ['box', 'space'], chess: ['box', 'space'], puzzles: ['box', 'space'],
};
export const ALL_STEPS = 3; // two get-ready steps and the activity

// Other things a day can offer: their icon (Lesson 1's set) and whether they count as rest.
export const OTHERS = {
  videos: { icon: 'screen' }, game: { icon: 'screen' }, tag: { icon: 'friends' }, fort: { icon: 'fort' },
  party: { icon: 'party' }, rest: { icon: 'rest', rest: true }, nap: { icon: 'rest', rest: true },
};

const USUAL = { mon: 'art', tue: 'sport', wed: 'quiet', thu: 'sport', fri: 'art', sat: 'sport', sun: 'quiet' };
const day = (weekday, week, options, extra = {}) => ({ weekday, week, usual: USUAL[weekday], options, weekend: weekday === 'sat' || weekday === 'sun', ...extra });

export const DAYS = [
  day('mon', 1, ['art', 'videos', 'quiet']),
  day('tue', 1, ['game', 'sport', 'art']),
  day('wed', 1, ['tag', 'quiet', 'art']),
  day('thu', 1, ['art', 'fort', 'rest'], { chance: 'bad', off: true, line: 'off' }),
  day('fri', 1, ['nap', 'art', 'videos'], { tired: true, line: 'tired' }),
  day('sat', 1, ['sport', 'quiet', 'rest']),
  day('sun', 1, ['rest', 'quiet', 'art']),
  day('mon', 2, ['art', 'party', 'videos'], { line: 'party' }),
  day('tue', 2, ['quiet', 'sport', 'game']),
  day('wed', 2, ['quiet', 'tag', 'art']),
  day('thu', 2, ['fort', 'art', 'sport']),
  day('fri', 2, ['videos', 'art', 'rest']),
  day('sat', 2, ['sport', 'rest', 'quiet']),
  day('sun', 2, ['art', 'quiet', 'rest']),
];

export const FREE_MISSES = 2;
const round = value => Math.round(value * 1000) / 1000;
const SKILL_STEP = 0.13;
const TIRED = 0.7;

export const emptyTally = () => ({ usual: 0, other: 0, misses: 0, rests: 0, luck: 0 });

/**
 * How a choice lands for each activity on a day:
 * usual (on its usual day) · other (on another day) · miss (chose something
 * else on its day) · rest · luck (its usual day was called off) · none.
 */
export function outcome(index, option) {
  const today = DAYS[index];
  const result = {};
  for (const kind of KINDS) {
    if (option === kind) result[kind] = today.usual === kind && !today.off ? 'usual' : 'other';
    else if (today.usual !== kind) result[kind] = 'none';
    else if (today.off) result[kind] = 'luck';
    else if (OTHERS[option]?.rest) result[kind] = 'rest';
    else result[kind] = 'miss';
  }
  return result;
}

const TALLY = { usual: 'usual', other: 'other', miss: 'misses', rest: 'rests', luck: 'luck' };

function grow(levels, tired) {
  const next = { ...levels };
  Object.keys(next).forEach((id, position) => {
    const room = 1 - next[id];
    next[id] = round(Math.min(1, next[id] + SKILL_STEP * (position ? 0.8 : 1) * (0.35 + 0.65 * room) * (tired ? TIRED : 1)));
  });
  return next;
}

export function createState(picks) {
  return {
    tally: Object.fromEntries(KINDS.map(kind => [kind, emptyTally()])),
    skills: Object.fromEntries(KINDS.map(kind => [kind, Object.fromEntries((SKILLS[picks[kind]] ?? []).map(id => [id, 0]))])),
    log: [],
  };
}

/** Replay a list of option ids (null for a day not lived yet) from the start. */
export function replay(choices, picks) {
  const state = createState(picks);
  choices.forEach((option, index) => {
    if (option == null) return;
    const how = outcome(index, option);
    const before = Object.fromEntries(KINDS.map(kind => [kind, { ...state.tally[kind] }]));
    for (const kind of KINDS) {
      if (TALLY[how[kind]]) state.tally[kind][TALLY[how[kind]]] += 1;
      if (how[kind] === 'usual' || how[kind] === 'other') state.skills[kind] = grow(state.skills[kind], DAYS[index].tired);
    }
    state.log[index] = { option, how, before };
  });
  return state;
}

export const frontierIndex = choices => { const i = choices.findIndex(value => value == null); return i === -1 ? choices.length : i; };

/** The started activity of a day's choice, or null (rest, a miss, something else). */
export const startedKind = option => (KINDS.includes(option) ? option : null);

/** The next day after `index` that is `kind`'s usual day (not called off). */
export function nextUsual(index, kind) {
  for (let i = index + 1; i < DAYS.length; i += 1) if (DAYS[i].usual === kind && !DAYS[i].off) return i;
  return -1;
}

// ——— What each direction draws ———

/** E: taps to get going, 3 down to 1. After the two free misses at most one step comes back, ever. */
export function stepsLeft({ usual = 0, misses = 0 } = {}) {
  const back = misses > FREE_MISSES ? 1 : 0;
  return Math.min(ALL_STEPS, Math.max(1, ALL_STEPS - usual + back));
}

/** F: after two usual-day starts, the habit picks the activity on its day. Misses cost nothing. */
export const PICKS_FIRST_AFTER = 2;
export const habitPicks = ({ usual = 0 } = {}) => usual >= PICKS_FIRST_AFTER;
/** F: the fork's other branches (2, 1, 0) drop away as usual-day starts add up. */
export const branchesLeft = ({ usual = 0 } = {}) => Math.max(0, PICKS_FIRST_AFTER - usual);

/** G: Maya's place on the way to the activity, 0 to 4. Misses never move her back. */
export const WALK_STEPS = 4;
export const walkStep = ({ usual = 0 } = {}) => Math.min(WALK_STEPS, usual);

/** Stage words for screen readers (never on screen): 0 takes a push … 3 feels normal. */
export function stage(direction, tally) {
  if (direction === 'e') return ALL_STEPS - stepsLeft(tally) + (stepsLeft(tally) === 1 && tally.usual >= 3 ? 1 : 0);
  if (direction === 'f') return Math.min(3, tally.usual >= 4 ? 3 : tally.usual);
  const step = walkStep(tally);
  return step >= 4 ? 3 : step >= 2 ? 2 : step;
}

/** Did any activity get clearly easier? (The end card's first line.) */
export const startingGotEasier = state => KINDS.some(kind => state.tally[kind].usual >= 2);
