// The lives store in the browser: every YAML file in this folder as text, parsed
// and checked by the engine. Vite reloads the page when a file changes.
import { loadStore, check } from './engine.js';

const TEXTS = {
  ...import.meta.glob('./nodes/*.yaml', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('./baselines/*.yaml', { query: '?raw', import: 'default', eager: true }),
};
// The engine's test fixture (two written lives), for checks and captures: `?store=fixture`.
const FIXTURE = import.meta.glob('/tests/fixtures/lives/*/*.yaml', { query: '?raw', import: 'default' });

/**
 * A node file copied `times` over with new ids (guitar → guitarX1 …), so the
 * page can be measured with a store of about 400 nodes: `?store=fixture&scale=6`.
 */
function scaled(files, times) {
  const out = { ...files };
  for (const [path, text] of Object.entries(files)) {
    if (!/\/nodes\//.test(path)) continue;
    let all = text;
    for (let copy = 1; copy < times; copy += 1) {
      all += `\n${text.replace(/^- id: (\w+)/gm, (_, id) => `- id: ${id}X${copy}`).replace(/^- id: bornX\d+\n(?: {2}.*\n?)*/m, '')}`;
    }
    out[path] = all;
  }
  return out;
}

/** Read and check the store: `{ store, errors, warnings, ms }` (`ms`: parse, check and total time). */
export async function openStore({ fixture = false, scale = 1 } = {}) {
  let files = TEXTS;
  if (fixture) files = Object.fromEntries(await Promise.all(Object.entries(FIXTURE).map(async ([path, load]) => [path, await load()])));
  if (scale > 1) files = scaled(files, scale);
  const started = performance.now();
  const store = loadStore(files);
  const parsed = performance.now();
  const { errors, warnings } = check(store);
  const done = performance.now();
  return { store, errors, warnings, ms: { parse: parsed - started, check: done - parsed, total: done - started } };
}

/** The store the URL asks for (`?store=fixture`, `&scale=N`), or the real one. */
export function storeFromURL(search = location.search) {
  const params = new URLSearchParams(search);
  return { fixture: params.get('store') === 'fixture', scale: Math.max(1, Math.min(10, Number(params.get('scale')) || 1)) };
}
