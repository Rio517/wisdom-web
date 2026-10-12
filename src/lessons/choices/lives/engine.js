// The lives engine (design 001 v13, round 4): reads the lives store (README.md
// in this folder), checks it, and grows a new life from any fork of a written
// one. Pure: no DOM. Used by the opening, the tree page and `npm run lives:check`.
// It reads no YAML itself: `yaml.js` parses the files (Node, the tree page), and
// the site ships the store already parsed (tooling/lives-data.mjs), so no parser reaches the browser.
import { IntlMessageFormat } from 'intl-messageformat';

export const TOKENS = ['name', 'his', 'him', 'himself'];
export const KINDS = ['start', 'choice', 'lucky', 'setback', 'event'];
export const LABEL_MAX = 22;
export const LINE_MAX_WORDS = 12;
export const END_AGES = [38, 45];
export const STEP_COUNT = [12, 17];
/** A run: 3 to 5 steps over 1 or 2 years; its tree-page name a noun phrase of at most 4 words and 30 characters. */
export const RUN_STEPS = [3, 5];
export const RUN_SPANS = [1, 2];
export const RUN_LABEL_MAX = 30;
export const RUN_LABEL_WORDS = 4;
/**
 * Words that judge a choice instead of telling it (rule: choices are actions,
 * never verdicts). A choice's label, line or `if` with one of these is warned.
 */
export const VERDICT_WORDS = ['bad', 'waste', 'wastes', 'wasted', 'too much', 'too many', 'gone', 'lazy', 'wrong', 'mistake', 'foolish', 'reckless', 'careless', 'silly'];
// "had gone" is a journey ("had gone to university"), not a verdict.
const VERDICT = new RegExp(`\\b(${VERDICT_WORDS.join('|').replace(/ /g, '\\s+').replace(/\bgone\b/, '(?<!\\bhad )gone')})\\b`, 'i');
/**
 * Drinking and drugs may be named as a setback, in general words only: never a
 * particular drug, never how it is used or what it does to the body.
 */
export const NAMED_DRUGS = ['cocaine', 'heroin', 'cannabis', 'marijuana', 'meth', 'ecstasy', 'mdma', 'lsd', 'ketamine', 'fentanyl', 'opioids?', 'overdoses?', 'injects?', 'snorts?', 'needles?'];
const DRUG = new RegExp(`\\b(${NAMED_DRUGS.join('|')})\\b`, 'i');
/** The tag of a drinking or drug setback (see the README's hard-things rule). */
export const SUBSTANCE = 'substance';
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

/** The years between forks, as in the Explore chapter's life tree (`gapFor` in src/lessons/choices/journey-explore.js). */
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
const isRunPath = path => /(^|\/)runs\//.test(path);

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
    inRun: object.inRun === true, // happens only as a step of a run, never on its own in a grown life
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
        run: entry.run === undefined || entry.run === null ? null : String(entry.run),
        raw: step,
      };
    }),
  };
}

function normalRun(raw, file, index) {
  const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    id: typeof object.id === 'string' ? object.id : String(object.id ?? ''),
    label: object.label,
    steps: list(object.steps).map(String),
    span: object.span,
    file,
    index,
    raw,
  };
}

/**
 * Read the store. `files` maps each path (any prefix, ending in
 * `nodes/<area>.yaml`, `runs/<area>.yaml` or `baselines/<person>.yaml`) to its
 * contents: already parsed, or text that `parse` reads (yaml.js passes js-yaml's
 * `load`). A file that doesn't parse is listed in `parseErrors` and left out.
 */
export function loadStore(files, parse = data => data) {
  const entries = files instanceof Map ? [...files] : Array.isArray(files) ? files : Object.entries(files);
  const store = {
    nodes: new Map(), list: [], baselines: new Map(), baselineList: [], runs: new Map(), runList: [], files: [], parseErrors: [], duplicates: [],
  };
  const sorted = [...entries].sort(([a], [b]) => fileName(a).localeCompare(fileName(b)));
  for (const [path, text] of sorted) {
    const file = fileName(path);
    const kind = isBaselinePath(path) ? 'baseline' : isRunPath(path) ? 'runs' : 'nodes';
    const entry = { path, file, kind, count: 0 };
    store.files.push(entry);
    let data;
    try {
      data = typeof text === 'string' || text === undefined || text === null ? parse(String(text ?? '')) : text;
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
    } else if (kind === 'runs') {
      const items = data === null || data === undefined ? [] : Array.isArray(data) ? data : null;
      if (!items) {
        entry.error = 'A runs file must be a list of runs (each starting with "- id:").';
        store.parseErrors.push({ file, line: 1, message: entry.error });
        continue;
      }
      items.forEach((raw, index) => {
        const run = normalRun(raw, file, index);
        store.runList.push(run);
        if (store.runs.has(run.id)) store.duplicates.push({ kind: 'run', id: run.id, file, first: store.runs.get(run.id).file });
        else store.runs.set(run.id, run);
      });
      entry.count = items.length;
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
/**
 * An empty path: the names it holds (each with the steps that gave it), the nodes it took and their
 * ages, and the nodes it may never take (`barred`: a grown life's other choices at the forks it passed).
 */
export function newPath() {
  return { held: new Map(), taken: new Set(), barred: new Set(), count: 0, ages: [] };
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
  if (path.barred?.has(node.id)) return { rule: 'passed', text: 'it was another choice at a fork the life passed' };
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
  if (age < node.lo || age > node.hi || path.taken.has(node.id) || path.barred.has(node.id)) return false;
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
/**
 * Who a life is about: name and pronoun, and for a store in another language
 * (`store.words`, see `applyWords`) its locale and lead pronouns.
 */
export const personOf = (baseline, store = null) => ({
  name: baseline?.name ?? '', pronoun: baseline?.pronoun === 'she' ? 'she' : 'he', words: store?.words ?? null,
});
const formats = new Map();
/** An ICU message of another language's store texts, formatted once per text. */
function icu(text, locale, values) {
  let format = formats.get(`${locale}\u0001${text}`);
  if (!format) { format = new IntlMessageFormat(text, locale); formats.set(`${locale}\u0001${text}`, format); }
  return String(format.format(values));
}
/**
 * A store text for a person. `lead`: a `{name}` that starts it becomes He or
 * She (every story line after the first). `capital`: the first letter is
 * capitalized (lines and labels; not the `if` inside "What if …?").
 * English texts use the tokens {name}, {his}, {him}, {himself}; another
 * language's are ICU messages with {name} and {gender, select, she {…} other {…}},
 * and its lead pronouns come with its texts (Spanish drops the subject).
 */
export function say(text, person, { lead = false, capital = true } = {}) {
  if (typeof text !== 'string') return '';
  let out;
  if (person?.words && person.words.locale !== 'en') {
    const { locale, lead: pronouns = {} } = person.words;
    let source = text;
    if (lead && /^\{name\}/.test(source)) source = `${pronouns[person.pronoun] ?? ''}${source.slice(6)}`.replace(/^\s+/, '');
    out = icu(source, locale, { name: person.name, gender: person.pronoun });
  } else {
    const forms = FORMS[person?.pronoun] ?? FORMS.he;
    out = lead ? text.replace(/^\{name\}/, forms.lead) : text;
    out = out.replace(/\{(name|his|him|himself)\}/g, (_, token) => (token === 'name' ? person.name : forms[token]));
  }
  return capital ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

// ——— The store's words in each language ———
/** The fields of a node, and of a baseline step, that carry words. */
export const NODE_WORDS = ['label', 'line', 'if'];
export const STEP_WORDS = ['label', 'line'];
/** A fingerprint of the English a translation came from (its fields, in order). */
export const fingerprint = (entry, fields) => hashString(fields.map(field => entry?.[field] ?? '').join('\u0001')).toString(36);
/**
 * The words of a store, apart from its structure: `{ nodes: { id: { label, line, if } },
 * baselines: { id: { node: { label, line } } } }` (a baseline step's own words, keyed by its node).
 * `files` are parsed store files (path → data), as `loadStore` takes them.
 */
export function wordsOf(files) {
  const words = { nodes: {}, baselines: {} };
  for (const [path, data] of Object.entries(files)) {
    if (/(^|\/)runs\//.test(path) || !data) continue;
    if (/(^|\/)baselines\//.test(path)) {
      const own = {};
      for (const step of list(data.steps)) {
        const fields = Object.fromEntries(STEP_WORDS.filter(field => typeof step?.[field] === 'string').map(field => [field, step[field]]));
        if (Object.keys(fields).length) own[step.node] = fields;
      }
      if (Object.keys(own).length) words.baselines[data.id ?? fileName(path).replace(/\.ya?ml$/, '')] = own;
    } else {
      for (const node of list(data)) words.nodes[node?.id] = Object.fromEntries(NODE_WORDS.filter(field => typeof node?.[field] === 'string').map(field => [field, node[field]]));
    }
  }
  return words;
}
/** The store's files without their words (what the site ships once for every language; run names are the tree page's only). */
export function structureOf(files) {
  const out = {};
  const strip = (object, fields) => Object.fromEntries(Object.entries(object ?? {}).filter(([key]) => !fields.includes(key)));
  for (const [path, data] of Object.entries(files)) {
    if (/(^|\/)runs\//.test(path)) out[path] = list(data).map(run => strip(run, ['label']));
    else if (/(^|\/)baselines\//.test(path)) out[path] = { ...data, steps: list(data?.steps).map(step => strip(step, STEP_WORDS)) };
    else out[path] = list(data).map(node => strip(node, NODE_WORDS));
  }
  return out;
}
/**
 * Put `words` (as `wordsOf` gives them, or a translation: the same shape, with `lead`)
 * into structure files. A missing translation falls back to `fallback` (English).
 */
export function applyWords(files, words, fallback = null) {
  const out = {};
  // An English text standing in for a missing translation is made an ICU message too.
  const asICU = text => text.replace(/\{(his|him|himself)\}/g, (_, token) => `{gender, select, she {${FORMS.she[token]}} other {${FORMS.he[token]}}}`);
  const pick = (own, base, fields) => {
    const merged = {};
    for (const field of fields) {
      const text = typeof own?.[field] === 'string' ? own[field] : typeof base?.[field] === 'string' ? asICU(base[field]) : null;
      if (text !== null) merged[field] = text;
    }
    return merged;
  };
  for (const [path, data] of Object.entries(files)) {
    if (/(^|\/)runs\//.test(path)) out[path] = data;
    else if (/(^|\/)baselines\//.test(path)) {
      const id = data?.id;
      out[path] = { ...data, steps: list(data?.steps).map(step => ({ ...step, ...pick(words.baselines?.[id]?.[step.node], fallback?.baselines?.[id]?.[step.node], STEP_WORDS) })) };
    } else out[path] = list(data).map(node => ({ ...node, ...pick(words.nodes?.[node.id], fallback?.nodes?.[node.id], NODE_WORDS) }));
  }
  return out;
}
/** Read the store in a language: structure files, its words, and for another language its locale and lead pronouns. */
export function loadWords(files, words, { locale = 'en', fallback = null } = {}) {
  const store = loadStore(applyWords(files, words, fallback));
  store.words = locale === 'en' ? null : { locale, lead: words.lead ?? {} };
  return store;
}
/** Every variable an ICU message uses (its argument names), or throws when it doesn't parse. */
function icuArguments(text, locale) {
  const found = new Set();
  const walk = elements => {
    for (const element of elements) {
      if (element.type !== 0 && typeof element.value === 'string') found.add(element.value);
      if (element.options) for (const option of Object.values(element.options)) walk(option.value);
    }
  };
  walk(new IntlMessageFormat(text, locale).getAst());
  return found;
}
/**
 * Check a translation of the store's words against the English: each text missing,
 * stale (its English changed since: the fingerprint `en` differs), with an unknown
 * variable, broken ICU, or a map label over `labelMax` characters (for a he and a she).
 */
export function checkWords(english, words, { locale, labelMax }) {
  const errors = [];
  const error = (where, message) => errors.push({ ...where, message: `${locale}: ${message}` });
  const one = (where, field, text, own) => {
    if (typeof text !== 'string' || !text.trim()) { error(where, `Missing translation of ${field}.`); return; }
    let names;
    try { names = icuArguments(text, locale); } catch (problem) { error(where, `Broken ICU in ${field}: ${problem.message} ("${text}").`); return; }
    for (const name of names) if (name !== 'name' && name !== 'gender') error(where, `Unknown token {${name}} in ${field}: use {name} and {gender, select, she {…} other {…}}.`);
    if (field === 'label') {
      for (const pronoun of ['he', 'she']) {
        const shown = say(text, { name: own ?? 'Sam', pronoun, words: { locale, lead: words.lead ?? {} } });
        if (shown.length > labelMax) { error(where, `Label "${shown}" is ${shown.length} characters (at most ${labelMax}).`); break; }
      }
    }
  };
  const entries = [
    ...Object.entries(english.nodes).map(([id, fields]) => ({ where: { node: id, file: `text/${locale}.yaml` }, fields, have: words.nodes?.[id], names: NODE_WORDS })),
    ...Object.entries(english.baselines).flatMap(([id, steps]) => Object.entries(steps).map(([node, fields]) => ({ where: { baseline: id, node, file: `text/${locale}.yaml` }, fields, have: words.baselines?.[id]?.[node], names: STEP_WORDS }))),
  ];
  for (const { where, fields, have, names } of entries) {
    if (!have) { error(where, 'Missing translation.'); continue; }
    if (have.en !== fingerprint(fields, names)) error(where, `Stale translation: the English changed since (${have.en ?? 'no fingerprint'} → ${fingerprint(fields, names)}).`);
    for (const field of names) if (typeof fields[field] === 'string') one(where, field, have[field]);
    for (const field of Object.keys(have)) if (field !== 'en' && !(field in fields)) error(where, `"${field}" has no English to translate.`);
  }
  for (const id of Object.keys(words.nodes ?? {})) if (!(id in english.nodes)) error({ node: id, file: `text/${locale}.yaml` }, 'A translation of a node the store no longer has.');
  return errors;
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
function stepOf(node, age, person, { lead, written = null, grown = false, picked = false, run = null } = {}) {
  return {
    id: node.id,
    run: run ?? written?.run ?? null, // the run this step is part of (a short burst of trying again), or null
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
  const pool = (store.byAge[age] ?? []).filter(other => other !== node && !other.inRun && !isSurprise(other) && allows(other, path, age));
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
  const person = personOf(baseline, store);
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
  markRuns(steps);
  return { id: baseline.id, name: person.name, pronoun: person.pronoun, person, end: baseline.end, file: baseline.file, steps };
}

/** Number each run's steps: `runStep` (0 for its first) and `runSize`, on the steps that carry a `run`. */
function markRuns(steps) {
  let start = -1;
  steps.forEach((step, index) => {
    if (!step.run) { start = -1; return; }
    if (start < 0 || steps[index - 1].run !== step.run) start = index;
    step.runStep = index - start;
  });
  for (let index = steps.length - 1, size = 0; index >= 0; index -= 1) {
    const step = steps[index];
    if (!step.run) { size = 0; continue; }
    size = index < steps.length - 1 && steps[index + 1].run === step.run ? size : step.runStep + 1;
    step.runSize = size;
  }
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
  surprise: 0.45, // about one fork in three (measured) is a lucky break or a setback: higher than a third, as the steps right after a pick or a run are plain…
  storyLean: 0.12, // …more often (+) when one follows the life's own story, less often (−) when none does…
  surpriseFrom: 8, // …from this age…
  quietYears: 4, // …and never in the last four years before the end
  answer: [0.4, 0.6], // after a surprise, the next step comes sooner: the gap × 0.4–0.6
  answerFirst: 0.7, // right after a setback, a step that answers it comes 1–2 years later this often (when one can)
  staleYears: 10, // an `after` match from a step more than this many years back, its area untouched since…
  stale: 0.1, // …weighs this much
  run: 0.5, // a life with no run yet starts one at a fork this often, when one fits there…
  runLastChance: 8, // …and always when fewer years than this are left before the quiet years
  followPick: 2, // after a pick, this many steps build on it (or on what built on it) whenever one can
  followRun: 1, // after a run, this many steps build on it whenever one can
  maxGap: 6, // a grown step comes at most this many years after the one before
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
/** A drinking or drug setback: always answered by help, 1–2 years later. */
const isSubstance = node => node.kind === 'setback' && node.gives.includes(SUBSTANCE);
const copyPath = path => ({ held: new Map([...path.held].map(([name, givers]) => [name, [...givers]])), taken: new Set(path.taken), barred: path.barred, count: path.count, ages: [...path.ages] });

/**
 * The ways `run` can start at `age` on `path` and finish by `limit`: each a
 * list of ages, one per step, starting at `age`. Steps come in order, the
 * same age as the one before or a year later, the last 1 to `span` years after
 * the first, and every step's rules hold in sequence.
 */
export function runFits(store, run, path, age, limit) {
  const nodes = run.steps.map(id => store.nodes.get(id));
  if (nodes.some(node => !node) || !allows(nodes[0], path, age)) return [];
  const span = Number.isInteger(run.span) ? run.span : 2;
  const fits = [];
  const walk = (ages, trial) => {
    const k = ages.length;
    if (k === nodes.length) { if (ages[k - 1] > ages[0]) fits.push(ages); return; }
    for (const step of [0, 1]) {
      const at = ages[k - 1] + step;
      if (at > age + span || at > limit) continue;
      if (!allows(nodes[k], trial, at)) continue;
      const next = copyPath(trial);
      takeStep(next, nodes[k], at);
      walk([...ages, at], next);
    }
  };
  const first = copyPath(path);
  takeStep(first, nodes[0], age);
  walk([age], first);
  return fits;
}

/**
 * When the reader's pick inside a written run is itself a middle step of a run,
 * that run carries on to its outcome: its later steps, in order, the same age
 * or a year apart, within `span` years of `age` and by `limit`. Returns
 * `{ run, nodes, ages }` or null.
 */
export function runAfter(store, node, path, age, limit) {
  for (const run of store.runs.values()) {
    const at = run.steps.indexOf(node.id);
    if (at < 1 || at >= run.steps.length - 1) continue;
    const rest = run.steps.slice(at + 1).map(id => store.nodes.get(id));
    if (rest.some(item => !item)) continue;
    const span = Number.isInteger(run.span) ? run.span : 2;
    let found = null;
    const walk = (ages, trial) => {
      if (found) return;
      const k = ages.length;
      if (k === rest.length) { found = ages; return; }
      const from = k ? ages[k - 1] : age;
      for (const step of k ? [0, 1] : [1, 0]) {
        const next = from + step;
        if (next > age + span || next > limit || !allows(rest[k], trial, next)) continue;
        const copy = copyPath(trial);
        takeStep(copy, rest[k], next);
        walk([...ages, next], copy);
      }
    };
    walk([], copyPath(path));
    if (found) return { run, nodes: rest, ages: found };
  }
  return null;
}

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
 * - An `after` match only through steps whose area the life left more than 10
 *   years ago (no later step shares a tag or builds on them) weighs ×0.1.
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
  const person = personOf(base, store);
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
  // The other choices at every fork the life has passed, the fork itself included, stay gray lines
  // on the map: the life never takes one of them later on (its name would show twice).
  for (let index = 0; index <= forkIndex; index += 1) for (const id of base.steps[index].alts) if (id !== alt) path.barred.add(id);
  path.barred.add(forkStep.node);
  // A pick inside a written run (not at its first step) is the person's own answer to the run's "no": it stays part of the run.
  const inRun = forkStep.run && forkIndex > 0 && base.steps[forkIndex - 1].run === forkStep.run ? forkStep.run : null;
  add(altNode, forkStep.age, { picked: true, grown: true, run: inRun });
  let hasRun = steps.some(step => step.run);
  let runGrown = null;
  // The thread the next steps must build on, when anything can: the pick for two
  // steps (and what builds on it), then a run's steps for one step after it.
  const pickIndex = steps.length - 1;
  let focus = { on: new Set([pickIndex]), left: GROW.followPick };
  // Does `node` build on a focus step: one of its `after` names was given by it? `narrow`: through a
  // name at most 1 node in 20 gives (so "journalism", not "job").
  const isNarrow = name => (store.givers.get(name)?.length ?? 0) <= store.nodes.size / 20;
  const onFocus = (node, narrow = false) => node.after.some(name => (!narrow || isNarrow(name)) && (path.held.get(name) ?? []).some(giver => focus.on.has(giver)));
  // A pick inside a written run that is a middle step of another run: that run carries on to its outcome.
  if (inRun) {
    const rest = runAfter(store, altNode, path, forkStep.age, base.end - GROW.quietYears);
    rest?.nodes.forEach((node, k) => {
      const others = othersAt(store, node, path, rest.ages[k], random);
      const step = add(node, rest.ages[k], { grown: true, run: inRun });
      step.others = others.map(other => ({ id: other.id, node: other, kind: other.kind, label: say(other.label, person) }));
    });
    // Then the thread goes on from the run, as after any run.
    if (rest) focus = { on: new Set(rest.nodes.map((_, k) => steps.length - rest.nodes.length + k).concat(steps.length - rest.nodes.length - 1)), left: GROW.followRun };
  }
  const end = base.end;
  const builds = node => node.after.length > 0 && chainFrom(node, path) >= path.count - 2;
  // A stale match (see GROW.staleYears) weighs less wherever a node is picked by its `after`.
  const fade = (node, age) => (isStale(node, path, age) ? GROW.stale : 1);
  // A weight for a node picked by its `after`, as for any plain step.
  const plainWeight = (node, age) => (!node.after.length ? node.weight : node.weight * (builds(node) ? 4 : chainFrom(node, path) >= 0 ? 2 * fade(node, age) : 1));
  // Start a run at `age`, if one fits before the quiet years: its steps are added at once.
  const startRun = (age, lastChance = false) => {
    const fitting = [];
    for (const run of store.runs.values()) {
      const fits = runFits(store, run, path, age, end - GROW.quietYears);
      if (fits.length) fitting.push({ run, fits, follows: onFocus(store.nodes.get(run.steps[0])) });
    }
    // Right after a pick or a run, a run that builds on it; any run only when time is running out.
    if (focus.left > 0) {
      const following = fitting.filter(entry => entry.follows);
      if (following.length) fitting.splice(0, fitting.length, ...following);
      else if (!lastChance) return false;
    }
    if (!fitting.length) return false;
    const at = pickWeighted(fitting, fitting.map(({ run }) => plainWeight(store.nodes.get(run.steps[0]), age)), random);
    if (at < 0) return false;
    const { run, fits } = fitting[at];
    // Prefer the ways that use the run's whole span.
    const full = fits.filter(ages => ages.at(-1) - ages[0] === Math.max(...fits.map(other => other.at(-1) - other[0])));
    const ages = full[Math.floor(random() * full.length)];
    run.steps.forEach((id, k) => {
      const node = store.nodes.get(id);
      const others = othersAt(store, node, path, ages[k], random);
      const step = add(node, ages[k], { grown: true, run: run.id });
      step.others = others.map(other => ({ id: other.id, node: other, kind: other.kind, label: say(other.label, person) }));
    });
    hasRun = true;
    runGrown = run.id;
    const first = steps.length - run.steps.length;
    focus = { on: new Set(run.steps.map((_, k) => first + k)), left: GROW.followRun };
    return true;
  };
  // `setback`: only a step that answers it will do (null when none can come at this age); `help`: only one that gives `helped`.
  const choose = (age, setback = null, help = false) => {
    const quiet = age > end - GROW.quietYears;
    let all = [];
    const pool = store.byAge[age] ?? [];
    for (let i = 0; i < pool.length; i += 1) if (!pool[i].inRun && allows(pool[i], path, age) && !(quiet && isSurprise(pool[i]))) all.push(pool[i]);
    if (!all.length) return null;
    // Right after a pick or a run, only what builds on it, when anything does (not for a setback's answer).
    let narrowly = null;
    if (!setback && focus.left > 0) {
      // Only when a plain step follows: a lucky break or a setback is never forced just because it fits.
      const following = all.filter(node => onFocus(node));
      if (following.some(node => !isSurprise(node))) all = following;
      narrowly = new Set(all.filter(node => onFocus(node, true)));
    }
    // A plain pick that follows the thread through a narrow name ("journalism", not "job") weighs ×3.
    const focusWeight = node => (narrowly?.has(node) ? 3 : 1);
    let chosen = null;
    let couldBuild = false;
    if (setback) {
      // The answers that name this setback come before those for any setback.
      const list = all.filter(node => answers(node, setback) && (!help || node.gives.includes('helped')));
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
        at = pickWeighted(building, building.map(node => node.weight * focusWeight(node)), random);
        chosen = building[at];
      } else {
        at = pickWeighted(plain, plain.map(node => plainWeight(node, age) * focusWeight(node)), random);
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

  let age = steps.at(-1).age;
  let early = false;
  for (let guard = 0; age < end && guard < 40; guard += 1) {
    const last = steps.at(-1).node;
    let found = null;
    let at = age;
    const substance = isSubstance(last);
    if (last.kind === 'setback' && (substance || random() < GROW.answerFirst)) {
      // Its answer, 1–2 years later (3–4 at most: a `within` match is never older). Drinking or drugs: help, 1–2 years later.
      const years = substance ? (random() < 0.5 ? [1, 2] : [2, 1]) : random() < 0.5 ? [1, 2, 3, 4] : [2, 1, 3, 4];
      for (let i = 0; i < years.length && !found; i += 1) {
        if (age + years[i] > end) continue;
        at = age + years[i];
        found = choose(at, last, substance);
      }
    }
    // Right after the pick, a step that follows it comes 1–3 years later, when one can
    // (so a follow-up with `within`, like taking up a place just offered, can come).
    if (!found && steps.length - 1 === pickIndex) {
      for (const years of [2, 1, 3]) {
        if (found || age + years > end - 1) continue;
        const next = choose(age + years);
        if (next && onFocus(next.node) && !isSurprise(next.node)) { found = next; at = age + years; }
      }
    }
    if (!found) {
      const factor = isSurprise(last) ? GROW.answer[0] + (GROW.answer[1] - GROW.answer[0]) * random() : 0.75 + 0.6 * random();
      const target = Math.min(end, age + Math.max(1, Math.min(GROW.maxGap, Math.round(gapFor(age) * factor))));
      // A life with no run yet: one starts here this often, or always when time is running out.
      const lastChance = end - GROW.quietYears - target < GROW.runLastChance;
      if (!hasRun && store.runs.size && target <= end - GROW.quietYears
        && (lastChance || random() < GROW.run) && startRun(target, lastChance)) {
        age = steps.at(-1).age;
        continue;
      }
      at = target;
      found = choose(at);
      if (!found && target < end) { at = target + 1; found = choose(at); }
      else if (!found && target - 1 > age) { at = target - 1; found = choose(at); }
    }
    if (!found) { early = true; break; }
    const following = focus.left > 0 && onFocus(found.node);
    const step = add(found.node, at, { grown: true });
    step.others = found.others.map(node => ({ id: node.id, node, kind: node.kind, label: say(node.label, person) }));
    step.couldBuild = found.couldBuild;
    if (focus.left > 0) {
      // A step that builds on the thread carries it on; one that couldn't still counts as a step.
      if (following) focus.on.add(steps.length - 1);
      focus.left -= 1;
    }
    age = at;
  }
  heights(steps).forEach((y, index) => { steps[index].y = y; });
  markRuns(steps);
  return {
    id: base.id, name: person.name, pronoun: person.pronoun, person, end, forkIndex, alt, seed,
    steps, endedEarly: early, lastAge: steps.at(-1).age, hasRun, runGrown,
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
    const run = step.run ? ` [run ${step.run} ${step.runStep + 1}/${step.runSize}]` : '';
    lines.push(`${mark} Age ${String(step.age).padStart(2)}  ${step.line}${kind}${run}`);
  });
  return lines.join('\n');
}

// ——— Checking the store ———
const WORDS = text => text.trim().split(/\s+/).filter(Boolean).length;
// Small words that may repeat from one line to the next.
const COMMON = new Set(['with', 'from', 'that', 'this', 'then', 'them', 'they', 'their', 'there', 'have', 'into', 'what', 'when', 'more', 'some', 'back', 'each', 'just', 'like', 'over', 'also', 'very', 'will', 'does', 'goes', 'gets', 'takes', 'makes', 'starts', 'about', 'after', 'again', 'every', 'other', 'first', 'still', 'only', 'for', 'her', 'his', 'him', 'herself', 'himself', 'she', 'he', 'and', 'the', 'one', 'two', 'new', 'own', 'year', 'years', 'time', 'day', 'days', 'helps', 'help', 'asks', 'luck', 'work', 'works', 'becomes']);
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
    else if (duplicate.kind === 'run') error({ file: duplicate.file, run: duplicate.id }, `Duplicate run id "${duplicate.id}" (also in ${duplicate.first}).`);
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
    if (/[.!?]\s+\{(his|him|himself)\}/.test(text)) error(where, `A sentence in ${field} starts with {his}, {him} or {himself}, which stays lower case: reword it.`);
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
    if (node.kind === 'choice') {
      for (const [field, text] of [['label', node.label], ['line', node.line], ['if', node.if]]) {
        const found = typeof text === 'string' && text.match(VERDICT);
        if (found) warn(where, `The choice's ${field} says "${found[0]}": a choice tells what the person does, not how it turns out. Put what goes wrong in the next step.`);
      }
    }
    for (const [field, text] of [['label', node.label], ['line', node.line], ['if', node.if]]) {
      const found = typeof text === 'string' && text.match(DRUG);
      if (found) error(where, `The ${field} says "${found[0]}": name drinking or drugs only in general words, never a particular drug or how it is used.`);
    }
    if (node.tags.includes(SUBSTANCE)) {
      if (node.kind !== 'setback') error(where, `Only a setback carries "${SUBSTANCE}" (drinking or drugs).`);
      const causes = node.after.filter(name => name !== 'setback' && name !== 'lucky');
      if (!causes.length || node.after.length !== causes.length) error(where, 'A drinking or drug setback needs its own cause in `after` (fame, a loss, stress), not just any step.');
      const leads = new Set(causes.flatMap(name => (store.givers.get(name) ?? []).map(giver => giver.id)));
      if (leads.size > 2) warn(where, `${leads.size} nodes lead to this drinking or drug setback (${[...leads].join(', ')}): at most one or two, after fame or a big loss.`);
      // Its own answer, so help can always come (a general "asks for help" may already be on the path).
      const helps = store.list.filter(other => other.gives.includes('helped') && other.within >= 1 && other.within <= 2
        && other.after.some(name => name !== 'setback' && node.gives.includes(name)));
      if (!helps.length) error(where, `Nothing answers this drinking or drug setback: it needs a node that gives "helped", with \`within\` 1 or 2, whose \`after\` names it or "${SUBSTANCE}".`);
    }
    if (node.kind !== 'choice' && node.if) warn(where, 'Only choices use "if"; this one is never asked.');
    if (raw.within !== undefined && (!Number.isInteger(raw.within) || raw.within < 0)) error(where, 'within must be a whole number of steps.');
    if (node.within && !node.after.length) error(where, '"within" needs an "after" list.');
    if (raw.weight !== undefined && !(Number.isFinite(raw.weight) && raw.weight > 0)) error(where, 'weight must be a number above 0.');
    if (node.by && node.by !== 'family') warn(where, `by: "${node.by}" (only "family" is used).`);
    if (raw.inRun !== undefined && typeof raw.inRun !== 'boolean') error(where, 'inRun must be true or false.');
    if (node.inRun && !store.runList.some(run => run.steps.includes(node.id))) error(where, 'inRun: true, but no run has this node as a step.');
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

  // Runs
  for (const run of store.runList) {
    const where = { file: run.file, run: run.id };
    const raw = run.raw && typeof run.raw === 'object' ? run.raw : {};
    if (!run.id || !CAMEL.test(run.id)) error(where, `Run id "${run.id}" must be camelCase.`);
    if (typeof run.label !== 'string' || !run.label) error(where, 'Missing label.');
    else if (run.label.length > RUN_LABEL_MAX) error(where, `Run label "${run.label}" is ${run.label.length} characters (at most ${RUN_LABEL_MAX}).`);
    else if (WORDS(run.label) > RUN_LABEL_WORDS) error(where, `Run label "${run.label}" is ${WORDS(run.label)} words: a run's name is a noun phrase of 1 to ${RUN_LABEL_WORDS} words ("New band").`);
    if (!Number.isInteger(raw.span) || raw.span < RUN_SPANS[0] || raw.span > RUN_SPANS[1]) error(where, `span must be ${RUN_SPANS[0]} or ${RUN_SPANS[1]} (years from its first step to its last), not ${JSON.stringify(raw.span ?? null)}.`);
    if (run.steps.length < RUN_STEPS[0] || run.steps.length > RUN_STEPS[1]) error(where, `${run.steps.length} steps: a run has ${RUN_STEPS[0]} to ${RUN_STEPS[1]}.`);
    const nodes = run.steps.map(id => store.nodes.get(id));
    run.steps.forEach((id, k) => { if (!nodes[k]) error(where, `Unknown node "${id}" in steps.`); });
    if (new Set(run.steps).size !== run.steps.length) error(where, 'A node comes at most once in a run.');
    if (nodes.some(node => !node) || run.steps.length < 2) continue;
    // The shape: it tries, meets a no (a setback), changes something and tries again, and does not end on the no.
    if (!['choice', 'event'].includes(nodes[0].kind)) error(where, `A run starts with a try (a choice or an event), not ${nodes[0].kind === 'lucky' ? 'a lucky break' : `a ${nodes[0].kind}`} (${nodes[0].id}).`);
    if (!nodes.slice(1, -1).some(node => node.kind === 'setback')) error(where, 'A run meets a no: a setback after its first step and before its last.');
    if (nodes.at(-1).kind === 'setback') error(where, 'A run ends in a success, a partial success or a change of course, not on a setback.');
    // The run is a path: each step after the first follows from the steps before it.
    const trial = newPath();
    takeStep(trial, nodes[0], nodes[0].lo);
    for (let k = 1; k < nodes.length; k += 1) {
      const node = nodes[k];
      for (const name of node.unless) if (trial.held.has(name)) error(where, `${node.id} can't follow ${run.steps.slice(0, k).join(', ')}: they give "${name}" (its unless).`);
      if (node.within && !node.after.some(name => trial.held.has(name))) error(where, `${node.id} comes "right after" (within ${node.within}) [${node.after.join(', ')}], which no earlier step of the run gives.`);
      takeStep(trial, node, node.lo);
    }
    // Some ages fit: in order, each inside its node's ages, all within the span.
    const span = Number.isInteger(raw.span) ? raw.span : RUN_SPANS[1];
    let fits = false;
    for (let first = nodes[0].lo; first <= nodes[0].hi && !fits; first += 1) {
      let at = first;
      fits = nodes.every((node, k) => { at = Math.max(k ? at : first, node.lo); return at <= node.hi && at <= first + span; });
    }
    if (!fits) error(where, `No ages fit: its steps' ages can't all fall within ${span} year${span === 1 ? '' : 's'} in order.`);
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
      const sameRun = index > 0 && step.run && step.run === baseline.steps[index - 1].run;
      if (!Number.isInteger(step.age)) error(at, `Step ${index + 1} (${step.node}) needs a whole age.`);
      else if (sameRun ? step.age < previous : step.age <= previous) error(at, `Step ${index + 1} (${step.node}) at ${step.age} comes after age ${previous}: ages must go up${sameRun ? ' (inside a run, two steps may share an age)' : ''}.`);
      if (Number.isInteger(step.age)) previous = step.age;
      if (!node) { error(at, `Unknown node "${step.node}" at step ${index + 1}.`); return; }
      if (index > 0) {
        const why = blocked(node, path, step.age);
        if (why) error(at, `${node.id} at ${step.age} isn't possible here: ${why.text}.`);
      }
      words(at, 'line', step.line, { line: true });
      words(at, 'label', step.label, { label: true });
      if (step.move !== undefined && step.move !== null && !(Number.isInteger(step.move) && step.move >= -3 && step.move <= 3)) error(at, 'move must be a whole number from -3 to 3.');
      if (node.kind === 'choice' && Number.isFinite(step.move) && step.move < 0) error(at, `${node.id} is a choice with move ${step.move}: a choice never drops the path. Put what goes wrong in the next step, a setback with its own cause.`);
      if (node.kind === 'choice') {
        for (const [field, text] of [['label', step.label], ['line', step.line]]) {
          const found = typeof text === 'string' && text.match(VERDICT);
          if (found) warn(at, `The choice's ${field} says "${found[0]}": a choice tells what the person does, not how it turns out.`);
        }
      }
      for (const [field, text] of [['label', step.label], ['line', step.line]]) {
        const found = typeof text === 'string' && text.match(DRUG);
        if (found) error(at, `The ${field} says "${found[0]}": name drinking or drugs only in general words.`);
      }
      if (step.run !== null && !store.runs.has(step.run)) error(at, `Unknown run "${step.run}".`);
      if (node.inRun && !step.run) error(at, `${node.id} happens only inside a run (inRun): mark the run's steps, or use another node.`);
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
        // Inside a run (not at its first step), a pick must carry a run on to an outcome.
        // (At its last step, a pick is another outcome: that is allowed.)
        const midRun = step.run && index > 0 && baseline.steps[index - 1].run === step.run && baseline.steps[index + 1]?.run === step.run;
        if (midRun && ![...store.runs.values()].some(run => { const k = run.steps.indexOf(altId); return k >= 1 && k < run.steps.length - 1; })) {
          error(at, `Alternative ${altId} sits inside run "${step.run}": it must be a middle step of some run (which then carries on to its outcome); or offer it at the run's first or last step.`);
        }
      }
      if (node.kind === 'lucky') lucky += 1;
      if (node.kind === 'setback') setbacks += 1;
      if (node.kind === 'choice' && node.by === 'family' && step.age < 8) family += 1;
      if (node.kind === 'choice' && node.by !== 'family') own += 1;
      take(node, step.age);
    });
    // Its run: exactly one, its steps in order and together, within its span.
    const runIds = [...new Set(baseline.steps.map(step => step.run).filter(Boolean))];
    if (!runIds.length) error(where, 'No run: a written life has exactly one (mark its steps with run: <id>).');
    if (runIds.length > 1) error(where, `${runIds.length} runs (${runIds.join(', ')}): a written life has exactly one.`);
    for (const id of runIds) {
      const run = store.runs.get(id);
      if (!run) continue;
      const at = baseline.steps.map((step, index) => (step.run === id ? index : -1)).filter(index => index >= 0);
      const marked = at.map(index => baseline.steps[index]);
      if (at.at(-1) - at[0] !== at.length - 1) error(where, `The steps of run "${id}" must come together, one after another.`);
      if (marked.map(step => step.node).join() !== run.steps.join()) error(where, `The steps marked run: ${id} are [${marked.map(step => step.node).join(', ')}]; the run is [${run.steps.join(', ')}].`);
      const years = marked.at(-1).age - marked[0].age;
      if (Number.isInteger(run.span) && years > run.span) error(where, `Run "${id}" takes ${years} years here; its span is ${run.span}.`);
      if (years < 1) error(where, `Run "${id}" happens all at one age: spread it over 1 to ${run.span} years.`);
    }
    // Drinking or drugs: always with a cause (its after) and answered by help 1–2 years later.
    baseline.steps.forEach((step, index) => {
      const node = store.nodes.get(step.node);
      if (!node || !node.tags.includes(SUBSTANCE)) return;
      const help = baseline.steps.slice(index + 1).find(later => store.nodes.get(later.node)?.gives.includes('helped'));
      if (!help || help.age - step.age > 2) error({ ...where, step: index, node: step.node }, 'A drinking or drug setback is answered by asking for help or being helped within 1–2 years (a step that gives "helped").');
    });
    if (!lucky) warn(where, 'No lucky break: a written life has at least one.');
    if (!setbacks) warn(where, 'No setback: a written life has at least one.');
    if (!family) warn(where, 'No family choice before 8.');
    if (own < 6) warn(where, `${own} of the person's own choices (at least six).`);
  }

  // A written life never takes, later on, a step that was another choice at one of its own forks: that
  // choice is still a gray line on the map there, so its name would show twice.
  for (const baseline of store.baselineList) {
    baseline.steps.forEach((step, index) => {
      for (const altId of step.alts) {
        const later = baseline.steps.findIndex((other, at) => at > index && other.node === altId);
        if (later >= 0) warn({ file: baseline.file, baseline: baseline.id, step: later, node: altId }, `${altId} at ${baseline.steps[later].age} was another choice at ${step.age} (${step.node}): its name shows twice on the map. Pick another step or another alternative.`);
      }
    });
  }

  // Two lines in a row of a written life don't repeat a content word (4+ letters; not a name or a small word).
  for (const baseline of store.baselineList) {
    if (!baseline.steps.every(step => store.nodes.has(step.node))) continue;
    const life = writtenLife(store, baseline);
    const words = line => new Set((line.toLowerCase().match(/[a-z']+/g) ?? []).filter(word => word.length >= 4 && !COMMON.has(word) && word !== life.name.toLowerCase()));
    for (let index = 1; index < life.steps.length; index += 1) {
      const before = words(life.steps[index - 1].line);
      const same = [...words(life.steps[index].line)].filter(word => before.has(word));
      if (same.length) warn({ file: baseline.file, baseline: baseline.id, step: index, node: life.steps[index].id }, `Repeats "${same.join('", "')}" from the line before: two lines in a row say it once.`);
    }
  }

  const substanceLives = store.baselineList.filter(baseline => baseline.steps.some(step => store.nodes.get(step.node)?.tags.includes(SUBSTANCE)));
  if (substanceLives.length > 1) warn({ file: substanceLives[1].file, baseline: substanceLives[1].id }, `${substanceLives.length} written lives have drinking or drugs (${substanceLives.map(item => item.id).join(', ')}): use it sparingly, in one.`);

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
      // Lives with a run (one kept from before the fork, or grown after it); `needsRun`: the fork came before any written run.
      run: grown.filter(life => life.hasRun).length / grown.length,
      needsRun: !store.baselines.get(baseline).steps.slice(0, forkIndex + 1).some((item, index) => item.run && index < forkIndex),
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
  const runsUsed = new Set();
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
      if (life.runGrown) runsUsed.add(life.runGrown);
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
  const runs = { used: runsUsed.size, total: store.runs.size, unused: [...store.runs.keys()].filter(id => !runsUsed.has(id)) };
  return { lives: forks.length ? lives : 0, early, tells, runs, used: all.reduce((sum, item) => sum + item.used, 0), total: all.reduce((sum, item) => sum + item.total, 0), files: all };
}
