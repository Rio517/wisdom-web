// The lives store for the site, already parsed (design 001 v13, the Lesson 1 opening).
// A Vite plugin that reads src/lessons/choices/lives/ at build time and serves two kinds of module:
//   virtual:lives/structure      the nodes, runs and baselines without their words (one for every language)
//   virtual:lives/words/<locale> one language's words: English from the YAML, the others from text/<locale>.yaml
// Both packed as positional JSON (src/lessons/choices/lives/pack.js).
// So the browser gets JSON only: no YAML and no YAML parser. In dev, saving a store file reloads the page.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { structureOf, wordsOf, applyWords } from '../src/lessons/choices/lives/engine.js';
import { packStructure, packWords } from '../src/lessons/choices/lives/pack.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)), 'src/lessons/choices/lives');
const PREFIX = 'virtual:lives/';

/** The store's YAML files, parsed: path → data. */
export function readStoreFiles(dir = ROOT) {
  const files = {};
  for (const folder of ['nodes', 'runs', 'baselines']) {
    const path = join(dir, folder);
    if (!existsSync(path)) continue;
    for (const name of readdirSync(path).filter(file => /\.ya?ml$/.test(file)).sort()) files[`${folder}/${name}`] = load(readFileSync(join(path, name), 'utf8'));
  }
  return files;
}
/** One language's words: English from the store itself, another language from text/<locale>.yaml (fingerprints dropped). */
export function readWords(locale, dir = ROOT) {
  if (locale === 'en') return wordsOf(readStoreFiles(dir));
  const path = join(dir, 'text', `${locale}.yaml`);
  if (!existsSync(path)) return { nodes: {}, baselines: {} };
  const data = load(readFileSync(path, 'utf8')) ?? {};
  const strip = entry => Object.fromEntries(Object.entries(entry ?? {}).filter(([key]) => key !== 'en'));
  return {
    lead: data.lead ?? {},
    nodes: Object.fromEntries(Object.entries(data.nodes ?? {}).map(([id, entry]) => [id, strip(entry)])),
    baselines: Object.fromEntries(Object.entries(data.baselines ?? {}).map(([id, steps]) => [id, Object.fromEntries(Object.entries(steps ?? {}).map(([node, entry]) => [node, strip(entry)]))])),
  };
}

/**
 * The words the page can show, in `locale`: every node's map label; a story line only for a node
 * a written life tells (grown lives show labels only); a "What if" text only for a node offered as
 * an alternative. A missing translation is filled from the English (as an ICU message) here, at
 * build time, so the page loads one language's words and no fallback.
 */
export function shippedWords(locale, dir = ROOT) {
  const files = readStoreFiles(dir);
  const english = wordsOf(files);
  const own = readWords(locale, dir);
  const told = new Set(); const offered = new Set();
  for (const [path, data] of Object.entries(files)) {
    if (!/(^|\/)baselines\//.test(path)) continue;
    for (const step of data?.steps ?? []) { told.add(step.node); for (const alt of step.alts ?? []) offered.add(alt); }
  }
  // applyWords fills each field from the English where the translation lacks it.
  const merged = locale === 'en' ? null : applyWords(Object.fromEntries(Object.entries(files).filter(([path]) => /(^|\/)nodes\//.test(path) || /(^|\/)baselines\//.test(path)).map(([path, data]) => [path, /baselines/.test(path) ? data : data.map(node => ({ id: node.id }))])), own, english);
  const filled = merged ? wordsOf(merged) : english;
  const nodes = {};
  for (const [id, fields] of Object.entries(filled.nodes)) {
    nodes[id] = { label: fields.label };
    if (told.has(id) && fields.line) nodes[id].line = fields.line;
    if (offered.has(id) && fields.if) nodes[id].if = fields.if;
  }
  return { ...(locale === 'en' ? {} : { lead: own.lead ?? {} }), nodes, baselines: filled.baselines };
}

export default function livesData() {
  return {
    name: 'wisdom-lives-data',
    resolveId(id) { return id.startsWith(PREFIX) ? `\0${id}` : null; },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return null;
      const what = id.slice(PREFIX.length + 1);
      for (const folder of ['nodes', 'runs', 'baselines', 'text']) {
        const path = join(ROOT, folder);
        if (existsSync(path)) for (const name of readdirSync(path)) this.addWatchFile(join(path, name));
      }
      const structure = packStructure(structureOf(readStoreFiles()));
      const data = what === 'structure' ? structure : what.startsWith('words/') ? packWords(shippedWords(what.slice(6)), structure) : null;
      if (!data) return null;
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(data))});`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(ROOT) || !/\.ya?ml$/.test(file)) return undefined;
      for (const module of server.moduleGraph.idToModuleMap.values()) if (module.id?.startsWith(`\0${PREFIX}`)) server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
