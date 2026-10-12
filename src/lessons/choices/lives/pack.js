// The lives store packed for the browser (design 001 v13, the integration round): the same
// nodes, runs and baselines, and one language's words, as positional JSON with one table of
// names, so the page loads a fraction of the bytes. `pack*` runs at build time
// (tooling/lives-data.mjs); `unpack*` gives back the files and words `loadWords` takes.
const KINDS = ['choice', 'lucky', 'setback', 'event', 'start'];
const LISTS = ['after', 'tags', 'unless', 'needs', 'drops'];
const list = value => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);

/** Store files without words (engine.js `structureOf`) → `{ names, areas, nodes, runs, baselines }`. */
export function packStructure(files) {
  const names = [];
  const at = new Map();
  const name = text => { const key = String(text); if (!at.has(key)) { at.set(key, names.length); names.push(key); } return at.get(key); };
  const nodeFiles = Object.entries(files).filter(([path]) => /(^|\/)nodes\//.test(path)).sort(([a], [b]) => a.localeCompare(b));
  for (const [, nodes] of nodeFiles) for (const node of list(nodes)) name(node.id);
  const nodes = nodeFiles.flatMap(([, items]) => list(items).map(node => [
    KINDS.indexOf(node.kind ?? 'choice'), ...(node.ages ?? [0, -1]), ...LISTS.map(field => list(node[field]).map(name)),
    node.within ?? 0, node.move ?? 0, node.weight ?? 1, node.by === 'family' ? 1 : 0, node.inRun ? 1 : 0, ...(node.withinYears !== undefined ? [node.withinYears] : []),
  ]));
  const areas = nodeFiles.map(([path, items]) => [path.split('/').pop().replace(/\.ya?ml$/, ''), list(items).length]);
  const runs = Object.entries(files).filter(([path]) => /(^|\/)runs\//.test(path)).sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([path, items]) => list(items).map(run => [path.split('/').pop().replace(/\.ya?ml$/, ''), run.id, run.span, list(run.steps).map(name)]));
  const baselines = Object.entries(files).filter(([path]) => /(^|\/)baselines\//.test(path)).sort(([a], [b]) => a.localeCompare(b)).map(([, data]) => ({
    id: data.id, name: data.name, pronoun: data.pronoun, end: data.end,
    steps: list(data.steps).map(step => {
      const extra = {};
      for (const field of ['move', 'y', 'run']) if (step[field] !== undefined && step[field] !== null) extra[field] = step[field];
      if (step.echoes !== undefined) extra.echoes = list(step.echoes).map(name);
      return [name(step.node), step.age, list(step.alts).map(name), ...(Object.keys(extra).length ? [extra] : [])];
    }),
  }));
  return { names, areas, nodes, runs, baselines };
}

/** The packed structure → store files (path → data) for `loadWords`. */
export function unpackStructure(packed) {
  const { names, areas, nodes, runs, baselines } = packed;
  const files = {};
  let index = 0;
  for (const [area, count] of areas) {
    files[`nodes/${area}.yaml`] = nodes.slice(index, index + count).map((row, k) => {
      const [kind, lo, hi, after, tags, unless, needs, drops, within, move, weight, family, inRun, withinYears] = row;
      const node = { id: names[index + k], kind: KINDS[kind], ages: [lo, hi], after: after.map(i => names[i]), tags: tags.map(i => names[i]), unless: unless.map(i => names[i]), needs: needs.map(i => names[i]), drops: drops.map(i => names[i]), within, move, weight };
      if (family) node.by = 'family';
      if (inRun) node.inRun = true;
      if (withinYears !== undefined) node.withinYears = withinYears;
      return node;
    });
    index += count;
  }
  for (const [area, id, span, steps] of runs) (files[`runs/${area}.yaml`] ??= []).push({ id, span, steps: steps.map(i => names[i]) });
  for (const baseline of baselines) {
    files[`baselines/${baseline.id}.yaml`] = {
      ...baseline,
      steps: baseline.steps.map(([node, age, alts, extra = {}]) => ({ node: names[node], age, alts: alts.map(i => names[i]), ...extra, ...(extra.echoes ? { echoes: extra.echoes.map(i => names[i]) } : {}) })),
    };
  }
  return files;
}

/** One language's words (`{ lead, nodes, baselines }`) → arrays in the packed nodes' order. */
export function packWords(words, packed) {
  const count = packed.nodes.length;
  const ids = packed.names.slice(0, count);
  const column = field => ids.map(id => words.nodes[id]?.[field] ?? 0);
  return { ...(words.lead ? { lead: words.lead } : {}), label: column('label'), line: column('line'), if: column('if'), baselines: words.baselines };
}

/** Packed words → `{ lead, nodes, baselines }` as `loadWords` takes them. */
export function unpackWords(packedWords, packed) {
  const nodes = {};
  packed.names.slice(0, packed.nodes.length).forEach((id, at) => {
    const entry = {};
    for (const field of ['label', 'line', 'if']) if (packedWords[field][at]) entry[field] = packedWords[field][at];
    nodes[id] = entry;
  });
  return { ...(packedWords.lead ? { lead: packedWords.lead } : {}), nodes, baselines: packedWords.baselines };
}
