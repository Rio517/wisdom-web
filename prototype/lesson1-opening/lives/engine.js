// The lives engine (design 001 v13, round 4): reads the lives store (README.md
// in this folder), checks it, and grows a new life from any fork of a written
// one. Pure: no DOM. Used by the opening, the tree page and `npm run lives:check`.
import { load } from 'js-yaml';

export const TOKENS = ['name', 'his', 'him', 'himself'];
export const KINDS = ['start', 'choice', 'lucky', 'setback', 'event'];
export const LABEL_MAX = 22;
export const LINE_MAX_WORDS = 12;
export const END_AGES = [38, 45];
export const STEP_COUNT = [12, 15];
const SURPRISES = new Set(['lucky', 'setback']);
const isSurprise = node => SURPRISES.has(node.kind);

// ——— Seeded randomness ———
/** A 32-bit hash of a string (FNV-1a with a final mix). */
export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
/** A number in [0, 1) fixed by `text`. */
export const hash01 = text => hashString(text) / 4294967296;
/** A seeded random source (mulberry32): call it for the next number in [0, 1). */
export function rng(seed) {
  let a = hashString(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A short random seed for a new grown life (kept in the URL so it can be shared). */
export const newSeed = () => Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0');

/** The years between forks, as in the Explore chapter's tree (explore-tree.js). */
export function gapFor(age) {
  if (age < 7) return 2.2;
  if (age < 12) return 2.7;
  if (age < 19) return 3;
  if (age < 26) return 3.8;
  if (age < 41) return 6;
  if (age < 56) return 8.5;
  return 11;
}

// ——— Loading ———
const list = value => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);
const fileName = path => path.split('/').pop();
const isBaselinePath = path => /(^|\/)baselines\//.test(path);

function lineOf(error) {
  const line = error?.mark?.line;
  return Number.isInteger(line) ? line + 1 : null;
}

function normalNode(raw, file, index) {
  const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const kind = object.kind ?? 'choice';
  const node = {
    id: typeof object.id === 'string' ? object.id : String(object.id ?? ''),
    label: object.label,
    line: object.line,
    if: object.if,
    kind,
    ages: Array.isArray(object.ages) ? object.ages : [],
    after: list(object.after).map(String),
    needs: list(object.needs).map(String),
    unless: list(object.unless).map(String),
    tags: list(object.tags).map(String),
    drops: list(object.drops).map(String),
    within: Number.isFinite(object.within) ? object.within : 0,
    move: Number.isFinite(object.move) ? object.move : 0,
    by: object.by ?? null,
    weight: Number.isFinite(object.weight) ? object.weight : 1,
    file,
    index,
    raw,
  };
  const lo = Number.isInteger(node.ages[0]) ? node.ages[0] : 0;
  const hi = Number.isInteger(node.ages[1]) ? node.ages[1] : -1;
  node.lo = lo; node.hi = hi;
  // What this node gives a life: its own id, its tags, and `lucky` or `setback` for its kind.
  node.gives = [...new Set([node.id, ...node.tags, ...(kind === 'lucky' ? ['lucky'] : kind === 'setback' ? ['setback'] : [])])];
  return node;
}

function normalBaseline(raw, file) {
  const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    id: String(object.id ?? fileName(file).replace(/\.ya?ml$/, '')),
    name: object.name,
    pronoun: object.pronoun,
    end: object.end,
    file,
    raw,
    steps: list(object.steps).map(step => {
      const entry = step && typeof step === 'object' ? step : {};
      return {
        node: String(entry.node ?? ''),
        age: entry.age,
        alts: list(entry.alts).map(String),
        line: entry.line,
        label: entry.label,
        move: entry.move,
        y: entry.y,
        echoes: entry.echoes === undefined ? null : list(entry.echoes).map(String),
        raw: step,
      };
    }),
  };
}

/**
 * Read the store from YAML texts. `files` maps each path (any prefix, ending in
 * `nodes/<area>.yaml` or `baselines/<person>.yaml`) to its text. A file that
 * doesn't parse is listed in `parseErrors` and left out.
 */
export function loadStore(files) {
  const entries = files instanceof Map ? [...files] : Array.isArray(files) ? files : Object.entries(files);
  const store = {
    nodes: new Map(), list: [], baselines: new Map(), baselineList: [], files: [], parseErrors: [], duplicates: [],
  };
  const sorted = [...entries].sort(([a], [b]) => fileName(a).localeCompare(fileName(b)));
  for (const [path, text] of sorted) {
    const file = fileName(path);
    const kind = isBaselinePath(path) ? 'baseline' : 'nodes';
    const entry = { path, file, kind, count: 0 };
    store.files.push(entry);
    let data;
    try {
      data = load(String(text ?? ''));
    } catch (error) {
      const line = lineOf(error);
      entry.error = `${error.reason ?? error.message.split('\n')[0]}${line ? ` (line ${line})` : ''}`;
      store.parseErrors.push({ file, line: lineOf(error), message: entry.error });
      continue;
    }
    if (kind === 'baseline') {
      if (data === null || data === undefined) continue;
      const baseline = normalBaseline(data, file);
      store.baselineList.push(baseline);
      if (store.baselines.has(baseline.id)) store.duplicates.push({ kind: 'baseline', id: baseline.id, file });
      else store.baselines.set(baseline.id, baseline);
      entry.count = 1;
    } else {
      const items = data === null || data === undefined ? [] : Array.isArray(data) ? data : null;
      if (!items) {
        entry.error = 'A nodes file must be a list of nodes (each starting with "- id:").';
        store.parseErrors.push({ file, line: 1, message: entry.error });
        continue;
      }
      items.forEach((raw, index) => {
        const node = normalNode(raw, file, index);
        store.list.push(node);
        if (store.nodes.has(node.id)) store.duplicates.push({ kind: 'node', id: node.id, file, first: store.nodes.get(node.id).file });
        else store.nodes.set(node.id, node);
      });
      entry.count = items.length;
    }
  }
  index(store);
  return store;
}

/** Who gives each name, and which nodes can happen at each age. */
function index(store) {
  store.givers = new Map();
  for (const node of store.nodes.values()) {
    for (const name of node.gives) {
      if (!store.givers.has(name)) store.givers.set(name, []);
      store.givers.get(name).push(node);
    }
  }
  store.byAge = [];
  for (let age = 0; age <= 100; age += 1) store.byAge.push([]);
  for (const node of store.nodes.values()) {
    if (node.kind === 'start') continue;
    for (let age = Math.max(0, node.lo); age <= Math.min(100, node.hi); age += 1) store.byAge[age].push(node);
  }
}

// ——— A path through the nodes ———
/** `within` also asks that the matching step came at most this many years before. */
export const WITHIN_YEARS = 4;
/** An empty path: the names it holds (each with the steps that gave it), the nodes it took and their ages. */
export function newPath() {
  return { held: new Map(), taken: new Set(), count: 0, ages: [] };
}
/** Add `node` as the next step, at `age`: it drops its `drops`, then gives its names. */
export function takeStep(path, node, age) {
  const index = path.count;
  path.ages.push(age);
  for (const name of node.drops) path.held.delete(name);
  for (const name of node.gives) {
    const givers = path.held.get(name);
    if (givers) givers.push(index); else path.held.set(name, [index]);
  }
  path.taken.add(node.id);
  path.count += 1;
  return index;
}

// A `within` match: among the last N steps, and at most WITHIN_YEARS before (when the ages are known).
const recent = (node, path, giver, age) => giver >= path.count - node.within
  && (path.ages[giver] === undefined || age === undefined || age - path.ages[giver] <= WITHIN_YEARS);
/**
 * Why `node` can't be the next step of `path` at `age`, or null when it can.
 * A node happens at most once in a life.
 */
export function blocked(node, path, age) {
  if (!(age >= node.lo && age <= node.hi)) return { rule: 'ages', text: `age ${age} is outside its ages [${node.lo}, ${node.hi}]` };
  if (path.taken.has(node.id)) return { rule: 'once', text: 'it is already on the path' };
  for (const name of node.unless) if (path.held.has(name)) return { rule: 'unless', text: `the path has "${name}" (unless)` };
  for (const name of node.needs) if (!path.held.has(name)) return { rule: 'needs', text: `the path lacks "${name}" (needs)` };
  if (node.after.length) {
    let any = false;
    for (const name of node.after) {
      const givers = path.held.get(name);
      if (!givers) continue;
      any = true;
      if (!node.within || recent(node, path, givers[givers.length - 1], age)) return null;
    }
    return any
      ? { rule: 'within', text: `none of [${node.after.join(', ')}] is among the last ${node.within} step${node.within === 1 ? '' : 's'} and at most ${WITHIN_YEARS} years before (within)` }
      : { rule: 'after', text: `none of [${node.after.join(', ')}] is on the path (after)` };
  }
  return null;
}
const allows = (node, path, age) => {
  // The hot loop of growing: the same rules as `blocked`, without the reasons.
  if (age < node.lo || age > node.hi || path.taken.has(node.id)) return false;
  for (let i = 0; i < node.unless.length; i += 1) if (path.held.has(node.unless[i])) return false;
  for (let i = 0; i < node.needs.length; i += 1) if (!path.held.has(node.needs[i])) return false;
  if (!node.after.length) return true;
  for (let i = 0; i < node.after.length; i += 1) {
    const givers = path.held.get(node.after[i]);
    if (givers && (!node.within || recent(node, path, givers[givers.length - 1], age))) return true;
  }
  return false;
};

/** The latest step (before this one) that gave each of `names`, newest first. */
function latestGivers(path, names) {
  const found = new Set();
  for (const name of names) {
    const givers = path.held.get(name);
    if (givers) found.add(givers[givers.length - 1]);
  }
  return [...found].sort((a, b) => b - a);
}
/** The newest earlier step that gave one of the node's `after` names, or -1 (a fresh start). */
function chainFrom(node, path) {
  let best = -1;
  for (const name of node.after) {
    const givers = path.held.get(name);
    if (givers && givers[givers.length - 1] > best) best = givers[givers.length - 1];
  }
  return best;
}
/** The steps a step pulses as it lands: its `echoes` (any earlier giver of each name), else what satisfied its `after`. */
function echoesOf(node, path, echoes) {
  if (echoes) {
    const found = new Set();
    for (const name of echoes) {
      const givers = path.historic.get(name);
      if (givers) found.add(givers[givers.length - 1]);
    }
    return [...found].sort((a, b) => b - a);
  }
  return latestGivers(path, node.after);
}

// ——— Words ———
const FORMS = {
  he: { his: 'his', him: 'him', himself: 'himself', lead: 'He' },
  she: { his: 'her', him: 'her', himself: 'herself', lead: 'She' },
};
export const personOf = baseline => ({ name: baseline?.name ?? '', pronoun: baseline?.pronoun === 'she' ? 'she' : 'he' });
/**
 * A store text for a person. `lead`: a `{name}` that starts it becomes He or
 * She (every story line after the first). `capital`: the first letter is
 * capitalized (lines and labels; not the `if` inside "What if …?").
 */
export function say(text, person, { lead = false, capital = true } = {}) {
  if (typeof text !== 'string') return '';
  const forms = FORMS[person?.pronoun] ?? FORMS.he;
  let out = lead ? text.replace(/^\{name\}/, forms.lead) : text;
  out = out.replace(/\{(name|his|him|himself)\}/g, (_, token) => (token === 'name' ? person.name : forms[token]));
  return capital ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

// ——— Heights ———
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
/** How far a `move` shifts the path: a tenth per point, and 0.42 for ±3. Up is better (a smaller y). */
export const shiftFor = move => -(Math.abs(move) >= 3 ? 0.42 * Math.sign(move) : move * 0.1);
/**
 * Heights for a life's steps, 0 (top) to 1 (bottom). A life starts at the
 * middle; each step moves it by its `move`; level choices wobble ±0.02 (by
 * id) without moving it; a grown step also drifts a tenth of the way back to
 * the middle; a written `y` (`fixedY`) sets the height exactly and the life
 * goes on from there.
 */
export function heights(steps) {
  let level = 0.5;
  return steps.map((step, index) => {
    const move = step.move ?? 0;
    if (index > 0) level += shiftFor(move);
    if (step.grown) level += (0.5 - level) * 0.1;
    level = clamp(level, 0.07, 0.93);
    let y = level;
    if (!move && step.kind === 'choice') y += (hash01(`wobble:${step.id}`) - 0.5) * 0.04;
    if (Number.isFinite(step.fixedY)) { y = step.fixedY; level = step.fixedY; }
    return y;
  });
}

// ——— A written life ———
function stepOf(node, age, person, { lead, written = null, grown = false, picked = false } = {}) {
  return {
    id: node.id,
    node,
    age,
    kind: node.kind,
    label: say(written?.label ?? node.label, person),
    line: say(written?.line ?? node.line, person, { lead }),
    move: Number.isFinite(written?.move) ? written.move : node.move,
    fixedY: Number.isFinite(written?.y) ? written.y : undefined,
    y: 0.5,
    byFamily: node.by === 'family',
    grown,
    picked,
    echoes: [],
    alts: [],
    others: [],
  };
}
/**
 * A path that also remembers every giver, dropped or not (for `echoes`), and
 * when each step's area was last touched (`fresh`): the step's own age, or the
 * age of a later step that shares one of its tags or builds on it.
 */
function historyPath() {
  const path = newPath();
  path.historic = new Map();
  path.fresh = [];
  const take = (node, age) => {
    for (const names of [node.tags, node.after]) {
      for (const name of names) {
        if (SURPRISES.has(name)) continue;
        for (const giver of path.historic.get(name) ?? []) path.fresh[giver] = age;
      }
    }
    const index = takeStep(path, node, age);
    path.fresh[index] = age;
    for (const name of node.gives) {
      if (!path.historic.has(name)) path.historic.set(name, []);
      path.historic.get(name).push(index);
    }
    return index;
  };
  return { path, take };
}

/** One or two other things (not luck or setbacks) that could have happened at `age` instead of `node`. */
function othersAt(store, node, path, age, random) {
  const pool = (store.byAge[age] ?? []).filter(other => other !== node && !isSurprise(other) && allows(other, path, age));
  const others = [];
  const want = random() < 0.5 ? 2 : 1;
  while (others.length < want && pool.length) {
    const at = pickWeighted(pool, pool.map(other => other.weight), random);
    if (at < 0) break;
    others.push(pool.splice(at, 1)[0]);
  }
  return others;
}

/**
 * A baseline as it is written: its steps with words for the person, heights,
 * echoes, and the alternatives at each choice (each with its "What if" words).
 * Unknown nodes are left out (the checker reports them).
 */
export function writtenLife(store, id) {
  const baseline = typeof id === 'string' ? store.baselines.get(id) : id;
  if (!baseline) return null;
  const person = personOf(baseline);
  const { path, take } = historyPath();
  const steps = [];
  for (const written of baseline.steps) {
    const node = store.nodes.get(written.node);
    if (!node || !Number.isFinite(written.age)) continue;
    const step = stepOf(node, written.age, person, { lead: steps.length > 0, written });
    step.echoes = echoesOf(node, path, written.echoes);
    step.alts = written.alts.map(altId => store.nodes.get(altId)).filter(Boolean).map(alt => ({
      id: alt.id, node: alt, kind: alt.kind, label: say(alt.label, person), whatIf: say(alt.if, person, { capital: false }), byFamily: alt.by === 'family',
    }));
    // A step with no alternatives still shows what else could have happened there (gray lines, not picked).
    if (steps.length && !step.alts.length && !isSurprise(node)) {
      step.others = othersAt(store, node, path, written.age, rng(`${baseline.id}:others:${steps.length}`))
        .map(other => ({ id: other.id, node: other, kind: other.kind, label: say(other.label, person) }));
    }
    take(node, written.age);
    steps.push(step);
  }
  heights(steps).forEach((y, index) => { steps[index].y = y; });
  return { id: baseline.id, name: person.name, pronoun: person.pronoun, person, end: baseline.end, file: baseline.file, steps };
}

// ——— Growing a new life from a fork ———
function pickWeighted(pool, weights, random) {
  let total = 0;
  for (const weight of weights) total += weight;
  if (total <= 0) return -1;
  let at = random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    at -= weights[i];
    if (at < 0) return i;
  }
  return pool.length - 1;
}

/** How a life grows (see `grow`). */
export const GROW = {
  build: 0.65, // when something builds on the last two steps, one of those is taken this often
  surprise: 1 / 3, // about one fork in three is a lucky break or a setback…
  storyLean: 0.12, // …more often (+) when one follows the life's own story, less often (−) when none does…
  surpriseFrom: 8, // …from this age…
  quietYears: 4, // …and never in the last four years before the end
  answer: [0.4, 0.6], // after a surprise, the next step comes sooner: the gap × 0.4–0.6
  answerFirst: 0.7, // right after a setback, a step that answers it comes 1–2 years later this often (when one can)
  staleYears: 12, // an `after` match from a step more than this many years back, its area untouched since…
  stale: 0.25, // …weighs this much
};

/** The newest age at which the path touched the area of a step that gave `name` (see `historyPath`). */
function nameAge(name, path) {
  let best = -Infinity;
  const givers = path.held.get(name);
  if (givers) for (const giver of givers) if (path.fresh[giver] > best) best = path.fresh[giver];
  return best;
}
/** Does `node` follow the path only through old steps whose area the life left long ago? */
function isStale(node, path, age) {
  if (!node.after.length) return false;
  for (const name of node.after) if (age - nameAge(name, path) <= GROW.staleYears) return false;
  return true;
}
/**
 * Is `node` part of the life's own story: its `after` matches a step still
 * fresh through a narrow name (one at most 1 node in 20 gives, so not `job`
 * or `setback`)?
 */
function ownChain(node, path, age, store) {
  for (const name of node.after) {
    if ((store.givers.get(name)?.length ?? 0) > store.nodes.size / 20) continue;
    if (age - nameAge(name, path) <= GROW.staleYears) return true;
  }
  return false;
}
/** Does `node` answer a setback: a `within` node whose `after` names the setback or one of its tags? */
const answers = (node, setback) => node.within > 0 && node.after.some(name => setback.gives.includes(name));

/**
 * Grow a life: the baseline's steps before `forkIndex`, then `alt` at the
 * fork's age, then new steps to the baseline's `end`. Each step after the
 * fork comes a gap of years later (the explorer's gaps × 0.75–1.35, and
 * × 0.4–0.6 right after a lucky break or a setback). Its candidates are the
 * nodes whose rules hold at that age.
 * - Right after a setback, about seven times in ten, a step that answers it
 *   (a `within` node whose `after` names it or one of its tags) comes 1–2
 *   years later, 3–4 at most; answers naming that setback ×3.
 * - From age 8 to four years before the end, about one fork in three is a
 *   lucky break or a setback, taking turns: more often when one follows the
 *   life's own story (`ownChain`), and those are taken first.
 * - Otherwise, when some candidates build on one of the last two steps, one of
 *   those is taken about two times in three; the rest of the time any
 *   candidate, weighted ×4 when it builds on the last two steps, ×2 on an
 *   older one.
 * - An `after` match only through steps whose area the life left more than 12
 *   years ago (no later step shares a tag or builds on them) weighs ×0.25.
 * No candidate: a year later; still none: the life ends early. Every grown
 * step carries 1–2 other candidates (`others`) for the gray lines. The same
 * `seed` grows the same life.
 */
export function grow(store, { baseline, forkIndex, alt, seed = '' }) {
  const base = typeof baseline === 'string' ? store.baselines.get(baseline) : baseline;
  if (!base) return null;
  const forkStep = base.steps[forkIndex];
  const altNode = store.nodes.get(alt);
  if (!forkStep || !altNode) return null;
  const person = personOf(base);
  const random = rng(`${base.id}:${forkIndex}:${alt}:${seed}`);
  const { path, take } = historyPath();
  const steps = [];
  let balance = 0; // lucky breaks minus setbacks so far, so they take turns
  const add = (node, age, options) => {
    const step = stepOf(node, age, person, { lead: steps.length > 0, ...options });
    step.echoes = echoesOf(node, path, options.written?.echoes ?? null);
    step.builds = node.after.length > 0 && chainFrom(node, path) >= path.count - 2;
    take(node, age);
    steps.push(step);
    if (node.kind === 'lucky') balance += 1;
    if (node.kind === 'setback') balance -= 1;
    return step;
  };
  for (let index = 0; index < forkIndex; index += 1) {
    const written = base.steps[index];
    const node = store.nodes.get(written.node);
    if (node) add(node, written.age, { written });
  }
  add(altNode, forkStep.age, { picked: true, grown: true });

  const end = base.end;
  const builds = node => node.after.length > 0 && chainFrom(node, path) >= path.count - 2;
  // A stale match (see GROW.staleYears) weighs less wherever a node is picked by its `after`.
  const fade = (node, age) => (isStale(node, path, age) ? GROW.stale : 1);
  // `setback`: only a step that answers it will do (null when none can come at this age).
  const choose = (age, setback = null) => {
    const quiet = age > end - GROW.quietYears;
    let all = [];
    const pool = store.byAge[age] ?? [];
    for (let i = 0; i < pool.length; i += 1) if (allows(pool[i], path, age) && !(quiet && isSurprise(pool[i]))) all.push(pool[i]);
    if (!all.length) return null;
    let chosen = null;
    let couldBuild = false;
    if (setback) {
      // The answers that name this setback come before those for any setback.
      const list = all.filter(node => answers(node, setback));
      if (!list.length) return null;
      chosen = list[pickWeighted(list, list.map(node => node.weight * (node.after.some(name => name !== 'setback' && setback.gives.includes(name)) ? 3 : 1)), random)];
    } else if (!quiet && age >= GROW.surpriseFrom) {
      // The life's own story first (see ownChain), then any surprise; lucky breaks and setbacks take turns.
      const surprises = all.filter(isSurprise);
      const chained = surprises.filter(node => ownChain(node, path, age, store));
      if (random() < GROW.surprise + (chained.length ? GROW.storyLean : -GROW.storyLean)) {
        const wanted = balance > 0 ? 'setback' : balance < 0 ? 'lucky' : random() < 0.5 ? 'lucky' : 'setback';
        const list = [chained.filter(node => node.kind === wanted), surprises.filter(node => node.kind === wanted), chained, surprises].find(items => items.length);
        if (list) {
          const at = pickWeighted(list, list.map(node => node.weight * fade(node, age)), random);
          if (at >= 0) chosen = list[at];
        }
      }
    }
    if (!chosen) {
      let plain = all.filter(node => !isSurprise(node));
      if (!plain.length) plain = all;
      const building = plain.filter(builds);
      couldBuild = building.length > 0;
      let at;
      if (building.length && random() < GROW.build) {
        at = pickWeighted(building, building.map(node => node.weight), random);
        chosen = building[at];
      } else {
        at = pickWeighted(plain, plain.map(node => (!node.after.length ? node.weight : node.weight * (builds(node) ? 4 : chainFrom(node, path) >= 0 ? 2 * fade(node, age) : 1))), random);
        chosen = plain[at];
      }
      if (!chosen) return null;
    }
    // The gray lines at this dot: one or two other things that could have happened here.
    const rest = all.filter(node => node !== chosen && !isSurprise(node));
    const pool2 = rest.length ? rest : all.filter(node => node !== chosen);
    const others = [];
    const want = random() < 0.5 ? 2 : 1;
    while (others.length < want && pool2.length) {
      const at = pickWeighted(pool2, pool2.map(node => node.weight), random);
      if (at < 0) break;
      others.push(pool2.splice(at, 1)[0]);
    }
    return { node: chosen, others, couldBuild };
  };

  let age = forkStep.age;
  let early = false;
  for (let guard = 0; age < end && guard < 40; guard += 1) {
    const last = steps.at(-1).node;
    let found = null;
    let at = age;
    if (last.kind === 'setback' && random() < GROW.answerFirst) {
      // Its answer, 1–2 years later (3–4 at most: a `within` match is never older).
      const years = random() < 0.5 ? [1, 2, 3, 4] : [2, 1, 3, 4];
      for (let i = 0; i < years.length && !found; i += 1) {
        if (age + years[i] > end) continue;
        at = age + years[i];
        found = choose(at, last);
      }
    }
    if (!found) {
      const factor = isSurprise(last) ? GROW.answer[0] + (GROW.answer[1] - GROW.answer[0]) * random() : 0.75 + 0.6 * random();
      const target = Math.min(end, age + Math.max(1, Math.round(gapFor(age) * factor)));
      at = target;
      found = choose(at);
      if (!found && target < end) { at = target + 1; found = choose(at); }
      else if (!found && target - 1 > age) { at = target - 1; found = choose(at); }
    }
    if (!found) { early = true; break; }
    const step = add(found.node, at, { grown: true });
    step.others = found.others.map(node => ({ id: node.id, node, kind: node.kind, label: say(node.label, person) }));
    step.couldBuild = found.couldBuild;
    age = at;
  }
  heights(steps).forEach((y, index) => { steps[index].y = y; });
  return {
    id: base.id, name: person.name, pronoun: person.pronoun, person, end, forkIndex, alt, seed,
    steps, endedEarly: early, lastAge: steps.at(-1).age,
  };
}

/** A grown life as plain text: who, the fork, then one "Age N  line" row per step. */
export function lifeText(life, store) {
  const base = store.baselines.get(life.id);
  const fork = life.steps[life.forkIndex];
  const own = store.nodes.get(base.steps[life.forkIndex].node);
  const lines = [`${life.name} — at ${fork.age}, "${fork.label}" instead of "${say(own?.label, life.person)}" (seed ${life.seed})${life.endedEarly ? ' — ENDS EARLY' : ''}`];
  life.steps.forEach((step, index) => {
    const mark = index === life.forkIndex ? '*' : step.grown ? ' ' : '·';
    const kind = step.kind === 'lucky' ? ' [luck]' : step.kind === 'setback' ? ' [setback]' : '';
    lines.push(`${mark} Age ${String(step.age).padStart(2)}  ${step.line}${kind}`);
  });
  return lines.join('\n');
}

// ——— Checking the store ———
const WORDS = text => text.trim().split(/\s+/).filter(Boolean).length;
const CAMEL = /^[a-z][A-Za-z0-9]*$/;
const YOU = /\b(you|your|yours|yourself|yourselves)\b/i;

/**
 * Every rule in the README: `{ errors, warnings }`, each item
 * `{ file, node?, baseline?, step?, message }`. With `lives` > 0 it also grows
 * that many lives from every alternative and warns about nodes where every
 * life through them ends early.
 */
export function check(store, { lives = 0 } = {}) {
  const errors = [];
  const warnings = [];
  const error = (where, message) => errors.push({ ...where, message });
  const warn = (where, message) => warnings.push({ ...where, message });

  for (const problem of store.parseErrors) error({ file: problem.file, line: problem.line }, `Can't read the file: ${problem.message}`);
  for (const duplicate of store.duplicates) {
    if (duplicate.kind === 'node') error({ file: duplicate.file, node: duplicate.id }, `Duplicate id "${duplicate.id}" (also in ${duplicate.first}).`);
    else error({ file: duplicate.file, baseline: duplicate.id }, `Duplicate baseline id "${duplicate.id}".`);
  }

  const names = new Set(['lucky', 'setback']);
  for (const node of store.nodes.values()) node.gives.forEach(name => names.add(name));
  const known = name => names.has(name);

  const words = (where, field, text, { label = false, line = false } = {}) => {
    if (text === undefined || text === null) return;
    if (typeof text !== 'string') { error(where, `"${field}" must be quoted text.`); return; }
    for (const match of text.matchAll(/\{([^}]*)\}/g)) if (!TOKENS.includes(match[1])) error(where, `Unknown token {${match[1]}} in ${field}: use {name}, {his}, {him} or {himself}.`);
    if (YOU.test(text)) error(where, `${field} speaks to the reader ("you"): tell it about the person.`);
    if (label && text.length > LABEL_MAX) error(where, `Label "${text}" is ${text.length} characters (at most ${LABEL_MAX}).`);
    if (line && WORDS(text) > LINE_MAX_WORDS) error(where, `Line "${text}" is ${WORDS(text)} words (at most ${LINE_MAX_WORDS}).`);
    if (line && /^\{name\}['’]s\b/.test(text)) error(where, `Line starts with {name}'s, which reads "He's" after the first line: start with {his}.`);
  };

  // Nodes
  for (const node of store.list) {
    const where = { file: node.file, node: node.id };
    const raw = node.raw && typeof node.raw === 'object' ? node.raw : {};
    if (!node.id || !CAMEL.test(node.id)) error(where, `Node id "${node.id}" must be camelCase (letters and digits, starting lower case).`);
    if (!KINDS.includes(node.kind)) error(where, `Unknown kind "${node.kind}": choice, lucky, setback or event.`);
    if (node.kind === 'start' && node.id !== 'born') error(where, 'Only "born" is a start.');
    if (raw.kind === undefined) error(where, 'Missing kind.');
    if (!node.label) error(where, 'Missing label.');
    if (!node.line) error(where, 'Missing line.');
    words(where, 'label', node.label, { label: true });
    words(where, 'line', node.line, { line: true });
    words(where, 'if', node.if);
    const [lo, hi] = node.ages;
    if (node.ages.length !== 2 || !Number.isInteger(lo) || !Number.isInteger(hi) || lo < 0 || hi > 100 || lo > hi) {
      error(where, `Bad ages ${JSON.stringify(raw.ages ?? null)}: two whole ages, [from, to], from ≤ to.`);
    }
    if (raw.move !== undefined && !Number.isInteger(raw.move)) error(where, `move must be a whole number from -3 to 3, not ${JSON.stringify(raw.move)}.`);
    if (node.kind === 'choice' && node.move !== 0) error(where, 'A choice never moves the path (move 0): choices are not ranked.');
    if (node.kind === 'lucky' && !(node.move >= 1 && node.move <= 3)) error(where, 'A lucky break lifts the path: move 1 to 3.');
    if (node.kind === 'setback' && !(node.move >= -3 && node.move <= -1)) error(where, 'A setback drops the path: move -1 to -3.');
    if (node.kind === 'event' && !(node.move >= -3 && node.move <= 3)) error(where, 'An event moves the path -3 to 3.');
    if (node.kind === 'choice' && !node.if) error(where, 'A choice needs an "if" (it completes "What if …?").');
    if (node.kind !== 'choice' && node.if) warn(where, 'Only choices use "if"; this one is never asked.');
    if (raw.within !== undefined && (!Number.isInteger(raw.within) || raw.within < 0)) error(where, 'within must be a whole number of steps.');
    if (node.within && !node.after.length) error(where, '"within" needs an "after" list.');
    if (raw.weight !== undefined && !(Number.isFinite(raw.weight) && raw.weight > 0)) error(where, 'weight must be a number above 0.');
    if (node.by && node.by !== 'family') warn(where, `by: "${node.by}" (only "family" is used).`);
    for (const field of ['after', 'needs', 'unless', 'drops']) {
      for (const name of node[field]) if (!known(name)) error(where, `Unknown name "${name}" in ${field}.`);
    }
    for (const tag of node.tags) {
      if (store.nodes.has(tag) && tag !== node.id) error(where, `Tag "${tag}" is named like the node "${tag}" (${store.nodes.get(tag).file}): rename the tag.`);
      if (tag === 'lucky' || tag === 'setback') warn(where, `"${tag}" is given by the kind; no need to tag it.`);
    }
  }

  // Duplicate labels
  const byLabel = new Map();
  for (const node of store.nodes.values()) {
    if (typeof node.label !== 'string') continue;
    const key = node.label.trim().toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, []);
    byLabel.get(key).push(node);
  }
  for (const group of byLabel.values()) {
    if (group.length > 1) for (const node of group) warn({ file: node.file, node: node.id }, `Label "${node.label}" is also used by ${group.filter(other => other !== node).map(other => other.id).join(', ')}.`);
  }

  // Nodes no life can reach (optimistic: ages and after/needs only).
  const earliest = reachable(store);
  for (const node of store.nodes.values()) {
    if (node.kind === 'start') continue;
    if (!earliest.has(node.id)) warn({ file: node.file, node: node.id }, 'No life can reach this node: nothing it needs can come before it in time.');
  }

  // Baselines
  for (const baseline of store.baselineList) {
    const where = { file: baseline.file, baseline: baseline.id };
    if (typeof baseline.name !== 'string' || !baseline.name) error(where, 'Missing name.');
    if (baseline.pronoun !== 'he' && baseline.pronoun !== 'she') error(where, 'pronoun must be he or she.');
    if (!Number.isInteger(baseline.end) || baseline.end < END_AGES[0] || baseline.end > END_AGES[1]) error(where, `end must be ${END_AGES[0]} to ${END_AGES[1]}, not ${JSON.stringify(baseline.end ?? null)}.`);
    const count = baseline.steps.length;
    if (count < STEP_COUNT[0] || count > STEP_COUNT[1]) error(where, `${count} steps: a written life has ${STEP_COUNT[0]} to ${STEP_COUNT[1]}.`);
    const first = baseline.steps[0];
    if (!first || first.node !== 'born' || first.age !== 0) error(where, 'The first step is { node: born, age: 0 }.');
    const last = baseline.steps.at(-1);
    if (last && Number.isInteger(baseline.end) && last.age !== baseline.end) error(where, `The last step is at ${last.age}, not at end (${baseline.end}).`);
    const { path, take } = historyPath();
    let previous = -1;
    let lucky = 0; let setbacks = 0; let own = 0; let family = 0;
    baseline.steps.forEach((step, index) => {
      const at = { ...where, step: index, node: step.node };
      const node = store.nodes.get(step.node);
      if (!Number.isInteger(step.age)) error(at, `Step ${index + 1} (${step.node}) needs a whole age.`);
      else if (step.age <= previous) error(at, `Step ${index + 1} (${step.node}) at ${step.age} comes after age ${previous}: ages must go up.`);
      if (Number.isInteger(step.age)) previous = step.age;
      if (!node) { error(at, `Unknown node "${step.node}" at step ${index + 1}.`); return; }
      if (index > 0) {
        const why = blocked(node, path, step.age);
        if (why) error(at, `${node.id} at ${step.age} isn't possible here: ${why.text}.`);
      }
      words(at, 'line', step.line, { line: true });
      words(at, 'label', step.label, { label: true });
      if (step.move !== undefined && step.move !== null && !(Number.isInteger(step.move) && step.move >= -3 && step.move <= 3)) error(at, 'move must be a whole number from -3 to 3.');
      if (step.y !== undefined && step.y !== null && !(Number.isFinite(step.y) && step.y >= 0 && step.y <= 1)) error(at, 'y must be from 0 (top) to 1 (bottom).');
      for (const name of step.echoes ?? []) {
        if (!path.historic.has(name)) error(at, `echoes "${name}", which no earlier step gives.`);
      }
      const KIND_NAMES = { lucky: 'a lucky break', setback: 'a setback', event: 'an event', start: 'the start' };
      if (step.alts.length && Number.isInteger(baseline.end) && baseline.end - step.age < 6) error(at, `Alternatives at ${step.age}, less than 6 years before end (${baseline.end}): nothing has room to grow.`);
      if (step.alts.length && node.kind !== 'choice') error(at, `Only choices have alternatives; ${node.id} is ${KIND_NAMES[node.kind] ?? node.kind}.`);
      const seen = new Set();
      for (const altId of step.alts) {
        const alt = store.nodes.get(altId);
        if (!alt) { error(at, `Unknown alternative "${altId}".`); continue; }
        if (seen.has(altId)) error(at, `Alternative "${altId}" is listed twice.`);
        seen.add(altId);
        if (altId === node.id) error(at, `"${altId}" is the step itself, not an alternative.`);
        if (alt.kind !== 'choice') error(at, `Alternative "${altId}" is not a choice.`);
        const why = blocked(alt, path, step.age);
        if (why) error(at, `Alternative ${altId} at ${step.age} isn't possible here: ${why.text}.`);
      }
      if (node.kind === 'lucky') lucky += 1;
      if (node.kind === 'setback') setbacks += 1;
      if (node.kind === 'choice' && node.by === 'family' && step.age < 8) family += 1;
      if (node.kind === 'choice' && node.by !== 'family') own += 1;
      take(node, step.age);
    });
    if (!lucky) warn(where, 'No lucky break: a written life has at least one.');
    if (!setbacks) warn(where, 'No setback: a written life has at least one.');
    if (!family) warn(where, 'No family choice before 8.');
    if (own < 6) warn(where, `${own} of the person's own choices (at least six).`);
  }

  if (lives > 0) warnings.push(...deadEnds(store, { lives }));
  return { errors, warnings };
}

/**
 * The earliest age each node can be on a path from Born, by its ages and
 * `after`/`needs` alone (optimistic: it ignores `unless`, `drops` and
 * `within`). A node missing from the map can never happen.
 */
export function reachable(store) {
  const earliest = new Map();
  for (const node of store.nodes.values()) if (node.kind === 'start') earliest.set(node.id, node.lo);
  let changed = true;
  for (let round = 0; changed && round < 60; round += 1) {
    changed = false;
    for (const node of store.nodes.values()) {
      if (node.kind === 'start' || node.hi < node.lo) continue;
      const soonest = name => {
        let best = Infinity;
        for (const giver of store.givers.get(name) ?? []) if (giver !== node && earliest.has(giver.id)) best = Math.min(best, earliest.get(giver.id) + 1);
        return best;
      };
      let at = Math.max(node.lo, 1);
      if (node.after.length) at = Math.max(at, Math.min(...node.after.map(soonest)));
      for (const name of node.needs) at = Math.max(at, soonest(name));
      if (at <= node.hi && (!earliest.has(node.id) || at < earliest.get(node.id))) {
        earliest.set(node.id, at);
        changed = true;
      }
    }
  }
  return earliest;
}

/** Every alternative of every baseline: `{ baseline, forkIndex, step, alt }`. */
export function forksOf(store) {
  const forks = [];
  for (const baseline of store.baselines.values()) {
    baseline.steps.forEach((step, forkIndex) => {
      for (const alt of step.alts) if (store.nodes.has(alt)) forks.push({ baseline: baseline.id, forkIndex, step, alt });
    });
  }
  return forks;
}

/** Nodes where every sampled life through them ends more than three years early. */
export function deadEnds(store, { lives = 20, seed = 'dead-ends' } = {}) {
  const through = new Map();
  for (const fork of forksOf(store)) {
    for (let i = 0; i < lives; i += 1) {
      const life = grow(store, { ...fork, seed: `${seed}-${i}` });
      if (!life) continue;
      const reached = life.lastAge >= life.end - 3;
      for (const step of life.steps.slice(fork.forkIndex + 1)) {
        const entry = through.get(step.id) ?? { lives: 0, reached: 0 };
        entry.lives += 1;
        if (reached) entry.reached += 1;
        through.set(step.id, entry);
      }
    }
  }
  const found = [];
  for (const [id, entry] of through) {
    if (entry.lives >= 3 && entry.reached === 0) {
      const node = store.nodes.get(id);
      found.push({ file: node.file, node: id, message: `Every life through this node (${entry.lives} grown) stops more than three years before its end: give it something that can follow.` });
    }
  }
  return found;
}

// ——— The variety report ———
const jaccard = (a, b) => {
  if (!a.size && !b.size) return 1;
  let both = 0;
  for (const item of a) if (b.has(item)) both += 1;
  return both / (a.size + b.size - both);
};
const mean = values => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

/**
 * For every alternative of every baseline, `lives` grown lives: how many reach
 * end−3, mean steps, distinct nodes used after the fork, mean pairwise overlap
 * (Jaccard) of the grown parts, and the mean end height against the fork's
 * other options (the step taken, regrown, and the other alternatives), the
 * share of lucky breaks and setbacks where one may come (`surprise`) and of
 * grown steps that build on one of the last two (`build`).
 * Heights are "rise": above the middle is positive.
 */
export function variety(store, { lives = 50, seed = 'variety' } = {}) {
  const rows = [];
  const endRise = new Map();
  const sample = (baseline, forkIndex, alt) => {
    const key = `${baseline}:${forkIndex}:${alt}`;
    if (endRise.has(key)) return endRise.get(key);
    const grown = [];
    for (let i = 0; i < lives; i += 1) grown.push(grow(store, { baseline, forkIndex, alt, seed: `${seed}-${i}` }));
    const result = { grown, rise: mean(grown.map(life => 0.5 - life.steps.at(-1).y)) };
    endRise.set(key, result);
    return result;
  };
  for (const fork of forksOf(store)) {
    const { baseline, forkIndex, step, alt } = fork;
    const { grown, rise } = sample(baseline, forkIndex, alt);
    const end = store.baselines.get(baseline).end;
    const sets = grown.map(life => new Set(life.steps.slice(forkIndex + 1).map(item => item.id)));
    let overlap = 0; let pairs = 0;
    for (let a = 0; a < sets.length; a += 1) for (let b = a + 1; b < sets.length; b += 1) { overlap += jaccard(sets[a], sets[b]); pairs += 1; }
    const distinct = new Set(sets.flatMap(set => [...set]));
    const others = [step.node, ...step.alts.filter(other => other !== alt && store.nodes.has(other))]
      .filter(other => store.nodes.has(other))
      .map(other => sample(baseline, forkIndex, other).rise);
    const othersRise = mean(others);
    const after = grown.flatMap(life => life.steps.slice(forkIndex + 1));
    const window = after.filter(item => item.age >= GROW.surpriseFrom && item.age <= end - GROW.quietYears);
    rows.push({
      baseline, forkIndex, age: step.age, step: step.node, alt,
      reach: grown.filter(life => life.lastAge >= end - 3).length / grown.length,
      steps: mean(grown.map(life => life.steps.length)),
      distinct: distinct.size,
      overlap: pairs && distinct.size ? overlap / pairs : null, // null: nothing grows after a fork at the end
      rise,
      othersRise,
      // Measured: lucky breaks and setbacks among the grown forks where one may come, and steps that build on the last two.
      surprise: window.length ? window.filter(item => isSurprise(item.node)).length / window.length : null,
      build: after.length ? after.filter(item => item.builds).length / after.length : null,
      flagged: others.length > 0 && Math.abs(rise - othersRise) > 0.12,
    });
  }
  return rows;
}

/** Across `lives` random lives (any baseline, fork, alternative and seed): which nodes are ever used, per file. */
export function coverage(store, { lives = 5000, seed = 'coverage' } = {}) {
  const forks = forksOf(store);
  const used = new Set();
  const random = rng(seed);
  let early = 0;
  // How grown lives tell: ending on a surprise, surprises from the life's own story, setbacks answered within 4 years.
  const tells = { endSurprise: 0, surprises: 0, ownStory: 0, setbacks: 0, answered: 0 };
  const narrow = name => !SURPRISES.has(name) && (store.givers.get(name)?.length ?? 0) <= store.nodes.size / 20;
  if (forks.length) {
    for (let i = 0; i < lives; i += 1) {
      const fork = forks[Math.floor(random() * forks.length)];
      const life = grow(store, { ...fork, seed: `${seed}-${i}` });
      if (!life) continue;
      if (life.lastAge < life.end - 3) early += 1;
      for (const step of life.steps) used.add(step.id);
      const { steps } = life;
      if (isSurprise(steps.at(-1).node)) tells.endSurprise += 1;
      for (let k = fork.forkIndex + 1; k < steps.length; k += 1) {
        const { node, age } = steps[k];
        if (!isSurprise(node)) continue;
        tells.surprises += 1;
        if (node.after.some(name => narrow(name) && steps.slice(0, k).some(step => step.node.gives.includes(name)))) tells.ownStory += 1;
        if (node.kind !== 'setback') continue;
        tells.setbacks += 1;
        if (steps.some((step, at) => at > k && step.age - age <= WITHIN_YEARS && step.node.after.some(name => node.gives.includes(name)))) tells.answered += 1;
      }
    }
  }
  const files = new Map();
  for (const node of store.nodes.values()) {
    if (node.kind === 'start') continue;
    const entry = files.get(node.file) ?? { file: node.file, total: 0, used: 0, unused: [] };
    entry.total += 1;
    if (used.has(node.id)) entry.used += 1; else entry.unused.push(node.id);
    files.set(node.file, entry);
  }
  const all = [...files.values()];
  return { lives: forks.length ? lives : 0, early, tells, used: all.reduce((sum, item) => sum + item.used, 0), total: all.reduce((sum, item) => sum + item.total, 0), files: all };
}
