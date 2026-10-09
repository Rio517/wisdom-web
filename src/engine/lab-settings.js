import { generateNetwork } from './path-network.js';

const MAX_SERIALIZED_LENGTH = 1600;
const VARIANTS = new Set(['retained', 'fading', 'hybrid']);
export const LAB_MAX_AGE = 70;
const TIMELINE_MID_AGE = 25;

// The accepted drawing (2026-09-14): laminar growth, a funnel after Today,
// a few paths that end. The lesson map takes the same values.
export const LAB_DEFAULTS = Object.freeze({
  seed: 'choices-network-1',
  choiceSeed: 'mika-example-14',
  variant: 'fading',
  growthMode: 'laminar',
  openingBurst: 1,
  todayBurst: 0.75,
  burstSpan: 3.5,
  ageTaper: 1,
  firstChildrenMin: 3,
  firstChildrenMax: 4,
  laterChildrenMin: 2,
  laterChildrenMax: 3,
  forkSpread: 150,
  wideForkLevels: 1,
  laterBranchSpacing: 12,
  splitProbability: 1,
  splitSpacing: 1,
  firstSplitAge: 0.1,
  endingRate: 0.01,
  fanOut: 0.85,
  centerBias: 0.5,
  bigForkChance: 0.25,
  bigForkAge: 8,
  maxTips: 67,
  turnStrength: 4.8,
  turnSpacing: 9,
  crowdingStrength: 2.75,
  crowdingRadius: 100,
  lineWidth: 2.4,
  grayOpacity: 0.75,
  fadeDistance: 650,
  fadeFloor: 0.6,
  todayFade: 40,
  edgeFade: 0.04,
  verticalFade: 0.16,
});

export const LAB_CONTROLS = Object.freeze([
  { field: 'openingBurst', label: 'Opening boost', min: 0, max: 1, step: 0.05, unit: '', group: 'Branching', help: 'How strongly branching accelerates near the beginning of the original field.' },
  { field: 'todayBurst', label: 'Today boost', min: 0, max: 1, step: 0.05, unit: '', group: 'Branching', help: 'Accelerates nearby branching after Today. Zero removes the boost, not the future.' },
  { field: 'burstSpan', label: 'Boost duration', min: 1, max: 12, step: 0.5, unit: 'years', group: 'Branching', help: 'How long the local boost takes to ease off. Organic uses a smooth decay, not a shared deadline.' },
  { field: 'ageTaper', label: 'Age taper', min: 0, max: 1, step: 0.05, unit: '', group: 'Branching', help: 'Makes later-life fans fewer and narrower. Zero disables this extra taper; the remaining timeline is still shorter.' },
  { field: 'splitProbability', label: 'Split chance', min: 0, max: 1, step: 0.01, unit: '', group: 'Branching', help: 'Raises how readily each line branches. Organic converts this to a chance per small step. Zero means no forks.' },
  { field: 'splitSpacing', label: 'Split spacing', min: 1, max: 18, step: 0.5, unit: 'years', group: 'Branching', help: 'Typical wait between attempts. Each branch picks its own interval.' },
  { field: 'firstSplitAge', label: 'First fork at', min: 0.1, max: 8, step: 0.01, unit: 'years', group: 'Branching', help: 'How long the beginning runs as one line before its first fork.' },
  { field: 'endingRate', label: 'Paths that end', min: 0, max: 0.06, step: 0.005, unit: '', group: 'Branching', help: 'Laminar only. The yearly chance a line ends at seventy. Shaped like a life table: a small bump in the first five years, very little through the middle, a rise from forty. Zero means none.' },
  { field: 'fanOut', label: 'Fan-out', min: 0, max: 1.5, step: 0.05, unit: '', group: 'Branching', help: 'Keeps the field widening after it opens, past the top and bottom of the drawing. Lines that leave give their place back, so splitting goes on through life. Zero keeps every line inside, running level.' },
  { field: 'centerBias', label: 'Middle forks', min: 0, max: 1, step: 0.05, unit: '', group: 'Branching', help: 'Favours forks in the middle band, so divisions show where readers look. Zero lets every line fork alike.' },
  { field: 'firstChildrenMin', label: 'First fork · minimum', min: 2, max: 8, step: 1, unit: '', group: 'Forks', help: 'Smallest number of outgoing branches at the beginning or Today’s first fork.' },
  { field: 'firstChildrenMax', label: 'First fork · maximum', min: 2, max: 8, step: 1, unit: '', group: 'Forks', help: 'Each first fork draws a count within this range.' },
  { field: 'laterChildrenMin', label: 'Later forks · minimum', min: 2, max: 8, step: 1, unit: '', group: 'Forks', help: 'Smallest admitted fork after the first. A full drawing may have no room for another fork.' },
  { field: 'laterChildrenMax', label: 'Later forks · maximum', min: 2, max: 8, step: 1, unit: '', group: 'Forks', help: 'Largest later fork, subject to the remaining drawing budget.' },
  { field: 'forkSpread', label: 'Opening spread', min: 30, max: 150, step: 5, unit: '°', group: 'Forks', help: 'The broad opening at Beginning or Today. Later forks use smaller, count-scaled fans, capped by this angle.' },
  { field: 'wideForkLevels', label: 'Wide opening rounds', min: 1, max: 3, step: 1, unit: '', group: 'Forks', help: '1 widens only the first fork. 2 also widens its children’s forks; 3 includes the next round. Counted along each path, not across the whole chart.' },
  { field: 'laterBranchSpacing', label: 'Later branch spacing', min: 3, max: 30, step: 1, unit: '°', group: 'Forks', help: 'Angle between neighbors after the opening rounds. At 12°: 2 branches span 12°, 3 span 24°, and 6 span 60°, where space allows.' },
  { field: 'bigForkChance', label: 'Big later forks', min: 0, max: 0.5, step: 0.01, unit: '', group: 'Forks', help: 'The chance a later fork opens wide, with more branches, like the first. Zero keeps the big fans at the beginning.' },
  { field: 'bigForkAge', label: 'Big forks from', min: 0, max: 40, step: 1, unit: 'years', group: 'Forks', help: 'The age from which big later forks may happen.' },
  { field: 'maxTips', label: 'Branch limit', min: 16, max: 150, step: 1, unit: 'ends', group: 'Forks', help: 'How many lines the drawing holds at once. A line that leaves the drawing gives its place back, so later ages keep forking. The Today fan uses a smaller, age-tapered budget.' },
  { field: 'turnStrength', label: 'Bend strength', min: 0, max: 12, step: 0.2, unit: '', group: 'Shape', help: 'How strongly each line chooses to rise or fall. Forks and crowding also affect its shape.' },
  { field: 'turnSpacing', label: 'Bend spacing', min: 3, max: 22, step: 0.5, unit: 'years', group: 'Shape', help: 'Typical wait before choosing a new direction. Larger values make longer sweeps.' },
  { field: 'crowdingStrength', label: 'Crowding correction', min: 0, max: 3, step: 0.05, unit: '', group: 'Shape', help: 'Pushes lines away from neighbors. Zero disables this push; crossings are still allowed.' },
  { field: 'crowdingRadius', label: 'Crowding radius', min: 20, max: 100, step: 1, unit: 'units', group: 'Shape', help: 'How far a line looks for neighbors, in map units. Larger values spread the influence.' },
  { field: 'lineWidth', label: 'Line width', min: 1.2, max: 4, step: 0.1, unit: 'px', group: 'Style', help: 'The flat stroke width in CSS pixels.' },
  { field: 'grayOpacity', label: 'Gray visibility', min: 0.1, max: 1, step: 0.01, unit: '', group: 'Style', help: 'How visible untaken routes are before any fading.' },
  { field: 'fadeDistance', label: 'Fade distance', min: 80, max: 650, step: 10, unit: 'units', group: 'Style', help: 'How far gray paths fade after a missed fork, down to the faded floor.' },
  { field: 'fadeFloor', label: 'Faded floor', min: 0, max: 1, step: 0.05, unit: '', group: 'Style', help: 'How visible an old alternative stays once its fade is done, so it and its later forks still reach Today. Zero removes it entirely.' },
  { field: 'todayFade', label: 'Today dissolve', min: 0, max: 300, step: 10, unit: 'units', group: 'Style', help: 'How far before Today the remaining gray dissolves into the line. Gray never crosses Today.' },
  { field: 'edgeFade', label: 'Edge fade', min: 0, max: 0.3, step: 0.01, unit: '', group: 'Style', help: 'How much of the right-hand end fades into the page. Zero leaves the ends visible.' },
  { field: 'verticalFade', label: 'Top and bottom fade', min: 0, max: 0.4, step: 0.01, unit: '', group: 'Style', help: 'How much of the top and bottom fades into the page, so lines that fan out dissolve rather than stop at an edge.' },
].map(Object.freeze));

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const round = value => Math.round(value * 10000) / 10000;

// A smooth time lens: more room for early years, with no kink at age 25.
export function timelinePositionForAge(age) {
  const value = clamp(Number.isFinite(age) ? age : 0, 0, LAB_MAX_AGE);
  const balance = TIMELINE_MID_AGE / (LAB_MAX_AGE - TIMELINE_MID_AGE);
  return value / (value + balance * (LAB_MAX_AGE - value));
}

export function ageForTimelinePosition(position) {
  const value = clamp(Number.isFinite(position) ? position : 0, 0, 1);
  const balance = TIMELINE_MID_AGE / (LAB_MAX_AGE - TIMELINE_MID_AGE);
  return LAB_MAX_AGE * balance * value / (1 - value + balance * value);
}

function safeString(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= 80 ? trimmed : fallback;
}

export function normalizeLabSettings(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const settings = {
    seed: safeString(source.seed, LAB_DEFAULTS.seed),
    choiceSeed: safeString(source.choiceSeed, LAB_DEFAULTS.choiceSeed),
    variant: VARIANTS.has(source.variant) ? source.variant : LAB_DEFAULTS.variant,
    growthMode: ['paced', 'organic', 'laminar'].includes(source.growthMode) ? source.growthMode : LAB_DEFAULTS.growthMode,
  };
  for (const control of LAB_CONTROLS) {
    const requested = source[control.field];
    let value = Number.isFinite(requested)
      ? clamp(requested, control.min, control.max)
      : LAB_DEFAULTS[control.field];
    if (control.field === 'maxTips' || control.field === 'wideForkLevels' || control.field.includes('Children')) value = Math.round(value);
    settings[control.field] = value;
  }
  for (const kind of ['first', 'later']) {
    settings[`${kind}ChildrenMax`] = Math.max(settings[`${kind}ChildrenMin`], settings[`${kind}ChildrenMax`]);
  }
  return Object.freeze(settings);
}

/**
 * The generator options for the lab's background field. `today` is the
 * selected age, when there is one: laminar growth opens its envelope and
 * spends its budget by then, so the field is full at the line.
 */
export function networkOptionsForLab(input = {}, { today = null } = {}) {
  const settings = normalizeLabSettings(input);
  return Object.freeze({
    seed: settings.seed,
    width: 1260,
    height: 740,
    maxAge: LAB_MAX_AGE,
    maxTips: settings.maxTips,
    // Room for the forks that lines leaving the drawing hand back.
    // Fan-out hands places back all life long, so it needs more edges.
    maxEdges: Math.min(1000, Math.round(settings.maxTips * (4 + 12 * settings.fanOut)) - 1),
    sampleAgeStep: settings.growthMode === 'organic' ? 0.5 : 1,
    growthMode: settings.growthMode,
    firstChildrenMin: settings.firstChildrenMin,
    firstChildrenMax: settings.firstChildrenMax,
    laterChildrenMin: settings.laterChildrenMin,
    laterChildrenMax: settings.laterChildrenMax,
    forkSpread: settings.forkSpread,
    wideForkLevels: settings.wideForkLevels,
    laterBranchSpacing: settings.laterBranchSpacing,
    boundaryMode: 'exit',
    exitMargin: 40,
    ageOffset: 0,
    ageHorizon: 100,
    ageTaper: settings.ageTaper,
    burstSpan: settings.burstSpan,
    splitProbability: settings.splitProbability,
    splitMin: round(settings.splitSpacing * 11 / 19),
    splitMax: round(settings.splitSpacing * 27 / 19),
    openingSplitMin: 1,
    openingSplitMax: 3,
    firstSplitAge: settings.firstSplitAge,
    envelopeAge: Number.isFinite(today) && today > 0 ? Math.max(4, today) : 25,
    settleYears: 6,
    waveStrength: settings.turnStrength / 4.8,
    // How fast the field opens, and how sharply the wide rounds push off.
    openingAngle: settings.forkSpread,
    endingRate: settings.endingRate,
    fanOut: settings.fanOut,
    centerBias: settings.centerBias,
    bigForkChance: settings.bigForkChance,
    bigForkAge: settings.bigForkAge,
    // The field may use the height; the waves keep off the last few pixels.
    yPadding: 8,
    openingBurst: settings.openingBurst,
    turnStrength: settings.turnStrength,
    turnMin: round(settings.turnSpacing * 0.5),
    turnMax: round(settings.turnSpacing * 14 / 9),
    crowdingStrength: settings.crowdingStrength,
    crowdingRadius: settings.crowdingRadius,
  });
}

function normalizeState(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const selected = source.selected === true;
  const requestedAge = Number.isFinite(source.age) ? source.age : 0;
  return Object.freeze({
    settings: normalizeLabSettings(source.settings),
    age: selected ? clamp(requestedAge, 0, LAB_MAX_AGE) : 0,
    selected,
  });
}

function serializedState(input) {
  const state = normalizeState(input);
  return JSON.stringify({ settings: state.settings, age: state.age, selected: state.selected });
}

export function readLabState(input) {
  try {
    const url = input instanceof URL ? input : new URL(input);
    const serialized = url.searchParams.get('lab');
    if (!serialized || serialized.length > MAX_SERIALIZED_LENGTH) return normalizeState();
    return normalizeState(JSON.parse(serialized));
  } catch {
    return normalizeState();
  }
}

export function labURL(state, input) {
  let url;
  try {
    url = input instanceof URL ? new URL(input.href) : new URL(input);
  } catch {
    throw new RangeError('lab URL must be absolute');
  }
  const serialized = serializedState(state);
  if (serialized.length > MAX_SERIALIZED_LENGTH) throw new RangeError('lab state exceeds URL budget');
  url.searchParams.set('lab', serialized);
  return url;
}

export function exportLabSettings(input) {
  const state = normalizeState(input);
  const networkOptions = networkOptionsForLab(state.settings);
  const network = generateNetwork(networkOptions);
  return JSON.stringify({
    schemaVersion: 1,
    algorithmVersion: network.version,
    settings: state.settings,
    age: state.age,
    selected: state.selected,
    networkOptions,
    resolvedConfig: network.config,
  }, null, 2);
}
