// The lives store for the site, already parsed (design 001 v13, the Lesson 1 opening).
// A Vite plugin that reads src/lessons/choices/lives/ at build time and serves two kinds of module:
//   virtual:lives/structure      the nodes, runs and baselines without their words (one for every language)
//   virtual:lives/words/<locale> one language's words: English from the YAML, the others from text/<locale>.yaml
// So the browser gets JSON only: no YAML and no YAML parser. In dev, saving a store file reloads the page.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { structureOf, wordsOf } from '../src/lessons/choices/lives/engine.js';

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
      const data = what === 'structure' ? structureOf(readStoreFiles()) : what.startsWith('words/') ? readWords(what.slice(6)) : null;
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
