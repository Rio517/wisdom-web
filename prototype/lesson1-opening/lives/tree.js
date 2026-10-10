// The lives tree: a read-only view of the lives store (the nodes and written
// lives behind the Lesson 1 opening). It draws the nodes as a nested tree,
// lists the written lives, grows sample lives from any fork and shows every
// problem the checker finds. Nothing here writes: edit the YAML files and the
// dev server reloads the page.
import { openStore, storeFromURL } from './store.js';
import { writtenLife, grow, newSeed } from './engine.js';

// ——— Keys ———
// Every full row in the tree has one key: a node id, or one of these groups.
const ROOT = 'born';
const FRESH = 'group:fresh';
const LOOSE = 'group:loose';
const BANDS = [
  { key: 'band:0', from: -Infinity, to: 7, label: '0–7', note: 'family' },
  { key: 'band:8', from: 8, to: 12, label: '8–12' },
  { key: 'band:13', from: 13, to: 17, label: '13–17' },
  { key: 'band:18', from: 18, to: 25, label: '18–25' },
  { key: 'band:26', from: 26, to: Infinity, label: '26+' },
];
const KIND_NAMES = { start: 'Start', choice: 'Choice', lucky: 'Lucky break', setback: 'Setback', event: 'Event' };
const GROW_COUNT = 5;
const DEPTH_CAP = 60; // the tree of full rows has no cycles; this only guards against a bug
const FLASH_MS = 1800;

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const fileShort = file => String(file ?? '').replace(/\.ya?ml$/, '');
const isGroup = key => key === FRESH || key === LOOSE || key.startsWith('band:');
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const roundMs = value => (value < 10 ? value.toFixed(1) : String(Math.round(value)));

const source = storeFromURL();
const STATE_KEY = `lives-tree:${source.fixture ? 'fixture' : 'store'}:${source.scale}`;

let model = null;
const view = {
  open: new Set([ROOT, FRESH]), // rows showing what follows them
  auto: new Set([ROOT, FRESH]), // open rows that were opened for the reader (by a filter, a link or Expand all): no details
  saved: null, // the open rows from before a filter, restored when it clears
  filter: { query: '', file: '', kind: '' },
  matches: new Set(),
  visible: new Set(),
  life: null,
  touched: null, // the last node looked at, shown again when a filter clears
};

// ——— The model: what follows what, and where each node is shown in full ———
function buildModel({ store, errors, warnings, ms }) {
  const nodes = [...store.nodes.values()];
  const order = (a, b) => a.lo - b.lo || a.hi - b.hi
    || String(a.label ?? '').localeCompare(String(b.label ?? '')) || a.id.localeCompare(b.id);

  // `next`: under each node, the nodes that can follow it (its id or a tag it gives is in their `after`).
  const next = new Map(nodes.map(node => [node.id, []]));
  let links = 0;
  for (const child of nodes) {
    if (child.id === ROOT) continue;
    const parents = new Set();
    for (const name of child.after) for (const giver of store.givers.get(name) ?? []) if (giver !== child) parents.add(giver);
    for (const parent of parents) next.get(parent.id)?.push(child);
    links += parents.size;
  }
  for (const list of next.values()) list.sort(order);

  const bandOf = node => BANDS.find(band => node.lo >= band.from && node.lo <= band.to) ?? BANDS[0];
  const fresh = nodes.filter(node => node.id !== ROOT && !node.after.length).sort(order);
  const bands = BANDS.map(band => ({ ...band, nodes: fresh.filter(node => bandOf(node) === band) }));

  // `home`: the row each node is shown in full under: the first parent met going
  // down the tree level by level (the shallowest place, then the earliest).
  const home = new Map();
  const queue = [];
  let head = 0;
  const place = (node, parent) => {
    if (node.id === ROOT || home.has(node.id)) return;
    home.set(node.id, parent);
    queue.push(node);
  };
  const spread = () => {
    while (head < queue.length) {
      const node = queue[head++];
      for (const child of next.get(node.id) ?? []) place(child, node.id);
    }
  };
  for (const node of next.get(ROOT) ?? []) place(node, ROOT);
  for (const band of bands) for (const node of band.nodes) place(node, band.key);
  spread();
  // Nodes whose `after` never leads back to Born (an unknown name, or a loop of their own).
  const loose = [];
  for (const node of [...nodes].sort(order)) {
    if (node.id === ROOT || home.has(node.id)) continue;
    loose.push(node);
    place(node, LOOSE);
    spread();
  }

  // Which written lives use each node, as a step or as an alternative.
  const uses = new Map();
  const use = (id, entry) => { if (!uses.has(id)) uses.set(id, []); uses.get(id).push(entry); };
  const lives = [];
  const seenLives = new Set();
  for (const baseline of store.baselineList) {
    if (seenLives.has(baseline.id)) continue;
    seenLives.add(baseline.id);
    lives.push(baseline);
    baseline.steps.forEach((step, index) => {
      use(step.node, { life: baseline, index, age: step.age, alt: false });
      for (const alt of step.alts) use(alt, { life: baseline, index, age: step.age, alt: true });
    });
  }

  // Checker items by where they point: a node, a step of a written life, or a whole life.
  const byNode = new Map();
  const byStep = new Map();
  const byLife = new Map();
  const push = (map, key, item) => { if (!map.has(key)) map.set(key, []); map.get(key).push(item); };
  const items = [...errors.map(item => ({ ...item, level: 'error' })), ...warnings.map(item => ({ ...item, level: 'warning' }))];
  for (const item of items) {
    if (item.baseline !== undefined && item.baseline !== null) {
      if (Number.isInteger(item.step)) push(byStep, `${item.baseline}:${item.step}`, item);
      else push(byLife, item.baseline, item);
    } else if (item.node) push(byNode, item.node, item);
  }

  return {
    store, errors, warnings, ms, next, links, fresh, bands, home, loose, uses, lives, byNode, byStep, byLife,
    bandByKey: new Map(bands.map(band => [band.key, band])),
  };
}

function parentOf(key) {
  if (key === ROOT) return null;
  if (key === FRESH || key === LOOSE) return ROOT;
  if (key.startsWith('band:')) return FRESH;
  return model.home.get(key) ?? null;
}
/** The keys from the root down to `key`, `key` last. */
function chain(key) {
  const out = [];
  const seen = new Set();
  for (let at = key; at && !seen.has(at); at = parentOf(at)) { seen.add(at); out.unshift(at); }
  return out;
}
function keyLabel(key) {
  if (key === FRESH) return 'Can start fresh';
  if (key === LOOSE) return 'Not reachable from Born';
  const band = model.bandByKey.get(key);
  if (band) return `Can start fresh, ${band.label}`;
  return model.store.nodes.get(key)?.label ?? (key === ROOT ? 'Born' : key);
}
function groupCount(key) {
  if (key === ROOT) return model.store.nodes.size;
  if (key === FRESH) return model.fresh.length;
  if (key === LOOSE) return model.loose.length;
  return model.bandByKey.get(key)?.nodes.length ?? 0;
}

// ——— Filters ———
const filtering = () => Boolean(view.filter.query.trim() || view.filter.file || view.filter.kind);

function computeVisible() {
  const { file, kind } = view.filter;
  const query = view.filter.query.trim().toLowerCase();
  view.matches = new Set();
  view.visible = new Set();
  for (const node of model.store.nodes.values()) {
    if (file && node.file !== file) continue;
    if (kind && node.kind !== kind) continue;
    if (query && !(String(node.label ?? '').toLowerCase().includes(query) || node.id.toLowerCase().includes(query))) continue;
    if (node.id !== ROOT && !model.home.has(node.id)) continue;
    view.matches.add(node.id);
    for (const key of chain(node.id)) view.visible.add(key);
  }
}

/** Open the rows that lead to every match (kids only, no details). */
function openToMatches() {
  const ancestors = new Set();
  for (const id of view.matches) for (const key of chain(id).slice(0, -1)) ancestors.add(key);
  view.open = new Set(ancestors);
  view.auto = new Set(ancestors);
}

function applyFilter() {
  const was = Boolean(view.saved);
  if (filtering()) {
    if (!was) view.saved = { open: [...view.open], auto: [...view.auto] };
    computeVisible();
    openToMatches();
    renderTree();
  } else {
    if (was) {
      view.open = new Set(view.saved.open);
      view.auto = new Set(view.saved.auto);
      view.saved = null;
    }
    renderTree();
    if (was && view.touched) reveal(view.touched, { focus: false });
  }
  $('#clear').hidden = !filtering();
  save();
}

function clearFilters() {
  view.filter = { query: '', file: '', kind: '' };
  $('#search').value = '';
  $('#file-filter').value = '';
  $('#kind-filter').value = '';
  applyFilter();
}

// ——— Glyphs and small pieces ———
function glyph(kind) {
  const name = KIND_NAMES[kind] ?? String(kind);
  const id = KIND_NAMES[kind] ? kind : 'choice';
  return `<svg class="glyph" role="img" aria-label="${esc(name)}"><use href="#g-${id}"/></svg>`;
}
const ages = node => (node.hi < node.lo ? '?' : node.lo === node.hi ? String(node.lo) : `${node.lo}–${node.hi}`);
function livesUsing(id) {
  const names = new Set((model.uses.get(id) ?? []).map(entry => entry.life.name ?? entry.life.id));
  return [...names];
}
function marked(text) {
  const query = view.filter.query.trim();
  const plain = String(text ?? '');
  if (!query) return esc(plain);
  const at = plain.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return esc(plain);
  return `${esc(plain.slice(0, at))}<mark>${esc(plain.slice(at, at + query.length))}</mark>${esc(plain.slice(at + query.length))}`;
}
/** Store text with its `{tokens}` picked out. */
const withTokens = text => esc(text).replace(/\{([^}]*)\}/g, '<span class="tok">{$1}</span>');
function flagHTML(items) {
  if (!items?.length) return '';
  const errors = items.filter(item => item.level === 'error').length;
  const level = errors ? 'error' : 'warning';
  const count = errors || items.length;
  return `<span class="flag flag-${level}">${plural(count, level)}</span>`;
}

// ——— The tree ———
function entriesOf(key) {
  let out;
  if (key === ROOT) {
    out = (model.next.get(ROOT) ?? []).map(node => ({ node, full: model.home.get(node.id) === ROOT }));
    if (model.fresh.length) out.push({ group: FRESH });
    if (model.loose.length) out.push({ group: LOOSE });
  } else if (key === FRESH) {
    out = model.bands.filter(band => band.nodes.length).map(band => ({ group: band.key }));
  } else if (key === LOOSE) {
    out = model.loose.map(node => ({ node, full: true }));
  } else if (model.bandByKey.has(key)) {
    out = model.bandByKey.get(key).nodes.map(node => ({ node, full: true }));
  } else {
    out = (model.next.get(key) ?? []).map(node => ({ node, full: model.home.get(node.id) === key }));
  }
  if (!filtering()) return out;
  return out.filter(entry => (entry.group ? view.visible.has(entry.group) : entry.full && view.visible.has(entry.node.id)));
}

function itemHTML(entry, path, depth) {
  if (entry.group) return groupHTML(entry.group, path, depth);
  if (!entry.full || path.has(entry.node.id) || depth > DEPTH_CAP) return linkHTML(entry.node);
  return nodeHTML(entry.node, path, depth);
}

function openHTML(key, path, depth) {
  const node = isGroup(key) ? null : model.store.nodes.get(key);
  const detail = node && !view.auto.has(key) ? detailHTML(node) : '';
  path.add(key);
  const items = entriesOf(key).map(entry => itemHTML(entry, path, depth + 1)).join('');
  path.delete(key);
  const empty = !items && node && !detail ? '<p class="nothing-next">Nothing follows this node yet.</p>' : '';
  return `${detail}${empty}${items ? `<ul class="kids">${items}</ul>` : ''}`;
}

function nodeHTML(node, path, depth) {
  const open = view.open.has(node.id);
  const kids = node.id === ROOT ? 1 : model.next.get(node.id)?.length ?? 0;
  const lives = livesUsing(node.id);
  const state = filtering() ? (view.matches.has(node.id) ? ' match' : ' context') : '';
  const idHint = filtering() && view.filter.query.trim() && !String(node.label ?? '').toLowerCase().includes(view.filter.query.trim().toLowerCase())
    ? ` <code class="row-id">${marked(node.id)}</code>` : '';
  const row = `<button type="button" class="row${kids ? '' : ' leaf'}${state}" data-act="toggle" data-key="${esc(node.id)}" aria-expanded="${open}">`
    + `<span class="caret" aria-hidden="true"></span>${glyph(node.kind)}`
    + `<span class="label">${marked(node.label ?? node.id)}${idHint}</span>`
    + `${node.by === 'family' ? '<span class="family">family</span>' : ''}${flagHTML(model.byNode.get(node.id))}`
    + `<span class="ages">${ages(node)}</span><span class="file">${esc(fileShort(node.file))}</span>`
    + `<span class="uses"${lives.length ? ` title="${esc(lives.join(', '))}"` : ''}>${lives.length ? plural(lives.length, 'life', 'lives') : ''}</span>`
    + '</button>';
  return `<li class="item" data-key="${esc(node.id)}">${row}${open ? openHTML(node.id, path, depth) : ''}</li>`;
}

function groupHTML(key, path, depth) {
  const open = view.open.has(key);
  const band = model.bandByKey.get(key);
  const label = band ? `${band.label}${band.note ? ` <span class="note">${band.note}</span>` : ''}` : esc(keyLabel(key));
  const row = `<button type="button" class="row group-row${key === LOOSE ? ' loose' : ''}" data-act="toggle" data-key="${key}" aria-expanded="${open}">`
    + `<span class="caret" aria-hidden="true"></span><span class="label">${label}</span>`
    + `<span class="count">${plural(groupCount(key), 'node')}</span></button>`;
  return `<li class="item group" data-key="${key}">${row}${open ? openHTML(key, path, depth) : ''}</li>`;
}

function linkHTML(node) {
  const under = keyLabel(model.home.get(node.id));
  return `<li class="item link"><button type="button" class="row link-row" data-act="go" data-id="${esc(node.id)}">`
    + `<span class="caret" aria-hidden="true">↪</span>${glyph(node.kind)}`
    + `<span class="label">${esc(node.label ?? node.id)} <span class="under">(under ${esc(under)})</span></span>`
    + `<span class="ages">${ages(node)}</span><span class="file">${esc(fileShort(node.file))}</span><span class="uses"></span></button></li>`;
}

function nameChip(name) {
  const node = model.store.nodes.get(name);
  if (node) return `<button type="button" class="chip node-chip" data-act="go" data-id="${esc(name)}">${glyph(node.kind)}${esc(name)}</button>`;
  const givers = model.store.givers.get(name)?.length ?? 0;
  if (givers || name === 'lucky' || name === 'setback') {
    return `<span class="chip tag-chip" title="A tag, given by ${plural(givers, 'node')}">#${esc(name)}<span class="chip-n">${givers}</span></span>`;
  }
  return `<span class="chip bad-chip" title="No node or tag has this name">${esc(name)}?</span>`;
}

function detailHTML(node) {
  const rows = [];
  const row = (name, value) => rows.push(`<div><dt>${name}</dt><dd>${value}</dd></div>`);
  const chips = names => names.map(nameChip).join('');
  const facts = [`<code>${esc(node.id)}</code>`, esc(KIND_NAMES[node.kind] ?? node.kind)];
  if (node.by === 'family') facts.push('chosen by family');
  if (node.kind !== 'choice' && node.kind !== 'start') facts.push(`move ${node.move > 0 ? '+' : ''}${node.move}`);
  if (node.weight !== 1) facts.push(`weight ${node.weight}`);
  facts.push(`ages ${ages(node)}`, esc(`nodes/${node.file}`));
  row('Node', `<span class="facts">${facts.join(' · ')}</span>`);
  row('After', node.after.length ? `<span class="rule-note">any one</span>${chips(node.after)}` : '<span class="rule-note">nothing: a fresh start</span>');
  if (node.needs.length) row('Needs', `<span class="rule-note">all</span>${chips(node.needs)}`);
  if (node.unless.length) row('Unless', `<span class="rule-note">none of</span>${chips(node.unless)}`);
  if (node.within) row('Within', `an <code>after</code> match among the last ${plural(node.within, 'step')}, at most 4 years back`);
  if (node.drops.length) row('Drops', chips(node.drops));
  if (node.tags.length) row('Tags', chips(node.tags));
  const uses = model.uses.get(node.id) ?? [];
  row('Written lives', uses.length
    ? uses.map(entry => `<button type="button" class="chip life-chip" data-act="step" data-life="${esc(entry.life.id)}" data-step="${entry.index}">${esc(entry.life.name ?? entry.life.id)}${entry.alt ? ', other choice' : ''} at ${esc(entry.age)}</button>`).join('')
    : '<span class="rule-note">none</span>');
  const problems = model.byNode.get(node.id) ?? [];
  return '<div class="detail">'
    + `<p class="d-line">${withTokens(node.line ?? '')}</p>`
    + (node.if ? `<p class="d-if">What if ${withTokens(node.if)}?</p>` : '')
    + `<dl>${rows.join('')}</dl>`
    + (problems.length ? `<ul class="d-problems">${problems.map(item => `<li class="p-${item.level}"><strong>${item.level === 'error' ? 'Error' : 'Warning'}</strong> ${esc(item.message)}</li>`).join('')}</ul>` : '')
    + '</div>';
}

function renderTree() {
  const tree = $('#tree');
  if (filtering() && !view.matches.size) {
    tree.innerHTML = '<p class="nothing">No node matches. <button type="button" class="link-btn" data-act="clear">Clear the search and filters</button></p>';
  } else {
    const path = new Set();
    const root = model.store.nodes.get(ROOT);
    tree.innerHTML = `<ul class="kids root">${root ? nodeHTML(root, path, 0) : groupHTML(ROOT, path, 0)}</ul>`;
  }
  renderStatus();
}

function renderStatus() {
  const total = model.store.nodes.size;
  $('#tree-status').textContent = filtering()
    ? `${plural(view.matches.size, 'node')} of ${total} ${view.matches.size === 1 ? 'matches' : 'match'}`
    : `${plural(total, 'node')} · ${model.links} links · ${model.fresh.length} fresh starts`;
}

const findItem = key => $('#tree').querySelector(`li[data-key="${CSS.escape(key)}"]`);

/** Set a row to `closed`, `auto` (what follows, no details) or `full` (details and what follows). */
function setOpen(key, mode) {
  view.open.delete(key);
  view.auto.delete(key);
  if (mode !== 'closed') view.open.add(key);
  if (mode === 'auto') view.auto.add(key);
  const item = findItem(key);
  if (item) {
    for (const child of [...item.children]) if (!child.classList.contains('row')) child.remove();
    item.querySelector(':scope > .row')?.setAttribute('aria-expanded', String(mode !== 'closed'));
    if (mode !== 'closed') {
      const path = new Set(chain(key).slice(0, -1));
      item.insertAdjacentHTML('beforeend', openHTML(key, path, path.size));
    }
  }
  save();
}

function toggle(key) {
  const hasDetail = !isGroup(key) && model.store.nodes.has(key);
  const state = !view.open.has(key) ? 'closed' : view.auto.has(key) && hasDetail ? 'auto' : 'full';
  setOpen(key, state === 'full' ? 'closed' : 'full');
  if (!isGroup(key)) view.touched = key;
}

function flash(element) {
  if (!element) return;
  element.classList.remove('flash');
  void element.offsetWidth;
  element.classList.add('flash');
  setTimeout(() => element.classList.remove('flash'), FLASH_MS);
}

/** Show a node's full row: open the rows above it, open it, scroll to it and light it up. */
function reveal(id, { focus = true } = {}) {
  if (id !== ROOT && !model.home.has(id)) return;
  if (filtering() && !view.visible.has(id)) {
    view.touched = null;
    clearFilters();
  }
  const keys = chain(id);
  for (const key of keys.slice(0, -1)) if (!view.open.has(key)) setOpen(key, 'auto');
  if (!view.open.has(id) || view.auto.has(id)) setOpen(id, 'full');
  view.touched = id;
  const row = findItem(id)?.querySelector(':scope > .row');
  if (!row) return;
  row.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  if (focus) row.focus({ preventScroll: true });
  flash(row);
}

function expandAll() {
  const keys = [ROOT, FRESH, LOOSE, ...BANDS.map(band => band.key)];
  for (const [id, kids] of model.next) if (kids.length && (id === ROOT || model.home.has(id))) keys.push(id);
  view.open = new Set(keys);
  view.auto = new Set(keys);
  const started = performance.now();
  renderTree();
  $('#tree-status').textContent += ` · all open in ${roundMs(performance.now() - started)} ms`;
  save();
}

function collapseAll() {
  view.open = new Set([ROOT]);
  view.auto = new Set([ROOT]);
  renderTree();
  save();
}

// Arrow keys move between rows; right opens, left closes or goes to the row above.
function onTreeKey(event) {
  const row = event.target.closest?.('.row');
  if (!row || !$('#tree').contains(row)) return;
  const rows = () => [...$('#tree').querySelectorAll('.row')];
  const move = offset => {
    const list = rows();
    const next = list[list.indexOf(row) + offset];
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }); }
  };
  const key = row.dataset.key;
  if (event.key === 'ArrowDown') move(1);
  else if (event.key === 'ArrowUp') move(-1);
  else if (event.key === 'Home') rows()[0]?.focus();
  else if (event.key === 'End') rows().at(-1)?.focus();
  else if (event.key === 'ArrowRight') {
    if (key && row.getAttribute('aria-expanded') === 'false') { setOpen(key, isGroup(key) ? 'auto' : 'full'); findItem(key)?.querySelector(':scope > .row')?.focus(); } else move(1);
  } else if (event.key === 'ArrowLeft') {
    if (key && row.getAttribute('aria-expanded') === 'true') { setOpen(key, 'closed'); findItem(key)?.querySelector(':scope > .row')?.focus(); } else row.closest('li')?.parentElement?.closest('li')?.querySelector(':scope > .row')?.focus();
  } else return;
  event.preventDefault();
}

// ——— The checker ———
function problemHTML(item) {
  const where = [];
  const life = item.baseline !== undefined && item.baseline !== null ? model.store.baselines.get(item.baseline) : null;
  if (life && Number.isInteger(item.step)) where.push(`<button type="button" class="chip life-chip" data-act="step" data-life="${esc(life.id)}" data-step="${item.step}">${esc(life.name ?? life.id)}, step ${item.step + 1}</button>`);
  else if (life) where.push(`<button type="button" class="chip life-chip" data-act="life" data-life="${esc(life.id)}">${esc(life.name ?? life.id)}</button>`);
  if (item.node && model.store.nodes.has(item.node) && (item.node === ROOT || model.home.has(item.node))) {
    const node = model.store.nodes.get(item.node);
    where.push(`<button type="button" class="chip node-chip" data-act="go" data-id="${esc(item.node)}">${glyph(node.kind)}${esc(item.node)}</button>`);
  }
  const file = `<span class="chip file-chip">${esc(item.file ?? '')}${item.line ? `, line ${item.line}` : ''}</span>`;
  return `<li class="problem p-${item.level}"><p><strong>${item.level === 'error' ? 'Error' : 'Warning'}</strong> ${esc(item.message)}</p><p class="where">${file}${where.join('')}</p></li>`;
}

function renderChecker() {
  const { errors, warnings, store } = model;
  const counts = `<span class="count count-error${errors.length ? '' : ' none'}">${plural(errors.length, 'error')}</span>`
    + `<span class="count count-warning${warnings.length ? '' : ' none'}">${plural(warnings.length, 'warning')}</span>`;
  $('#head-counts').innerHTML = `<a href="#checker">${counts}</a>`;
  if (!errors.length && !warnings.length) {
    $('#checker-body').innerHTML = `<p class="counts-line">${counts}</p><p class="all-clear">No problems in ${plural(store.nodes.size, 'node')} and ${plural(model.lives.length, 'written life', 'written lives')}.</p>`;
    return;
  }
  const list = [...errors.map(item => ({ ...item, level: 'error' })), ...warnings.map(item => ({ ...item, level: 'warning' }))];
  $('#checker-body').innerHTML = `<p class="counts-line">${counts}</p><ol class="problems">${list.map(problemHTML).join('')}</ol>`;
}

// ——— Written lives ———
function renderWho() {
  $('#who').innerHTML = model.lives.map(life => {
    const problems = [...(model.byLife.get(life.id) ?? []), ...life.steps.flatMap((_, index) => model.byStep.get(`${life.id}:${index}`) ?? [])];
    const errors = problems.filter(item => item.level === 'error').length;
    return `<button type="button" class="who-btn" data-act="life" data-life="${esc(life.id)}" aria-pressed="${life.id === view.life}">`
      + `${esc(life.name ?? life.id)}<span class="who-end">to ${esc(life.end ?? '?')}</span>`
      + `${errors ? `<span class="who-flag" title="${plural(errors, 'error')}">${errors}<span class="visually-hidden"> ${errors === 1 ? 'error' : 'errors'}</span></span>` : ''}</button>`;
  }).join('') || '<p class="rule-note">No written lives yet.</p>';
}

function stepHTML(life, raw, index, step) {
  const problems = model.byStep.get(`${life.id}:${index}`) ?? [];
  const problemList = problems.length ? `<ul class="d-problems">${problems.map(item => `<li class="p-${item.level}"><strong>${item.level === 'error' ? 'Error' : 'Warning'}</strong> ${esc(item.message)}</li>`).join('')}</ul>` : '';
  if (!step) {
    return `<li class="step missing" data-step="${index}"><span class="s-age">${esc(raw.age ?? '?')}</span><span class="s-mark"></span>`
      + `<div class="s-body"><p class="s-head"><span class="s-label">${esc(raw.node)}</span> <span class="rule-note">not drawn: no such node, or no age</span></p>${problemList}</div></li>`;
  }
  const canGo = step.id === ROOT || model.home.has(step.id);
  const label = canGo ? `<button type="button" class="s-label link-btn" data-act="go" data-id="${esc(step.id)}">${esc(step.label)}</button>` : `<span class="s-label">${esc(step.label)}</span>`;
  const alts = step.alts.length
    ? `<ul class="alts" aria-label="Other choices here">${step.alts.map(alt => `<li class="alt">`
      + `<div class="alt-head">${glyph(alt.kind)}<button type="button" class="s-label link-btn" data-act="go" data-id="${esc(alt.id)}">${esc(alt.label)}</button>`
      + (alt.whatIf ? `<span class="alt-if">What if ${esc(alt.whatIf)}?</span>` : '<span class="alt-if"></span>')
      + `<button type="button" class="grow-btn" data-act="grow" data-life="${esc(life.id)}" data-step="${index}" data-alt="${esc(alt.id)}">Grow ${GROW_COUNT} lives</button></div>`
      + '<div class="grown" aria-live="polite"></div></li>').join('')}</ul>`
    : '';
  return `<li class="step${problems.some(item => item.level === 'error') ? ' has-error' : ''}" data-step="${index}">`
    + `<span class="s-age">${esc(raw.age)}</span><span class="s-mark">${glyph(step.kind)}</span>`
    + `<div class="s-body"><p class="s-head">${label}${step.byFamily ? '<span class="family">family</span>' : ''}</p>`
    + `<p class="s-line">${esc(step.line)}</p>${problemList}${alts}</div></li>`;
}

function renderLife() {
  const holder = $('#life');
  const life = model.lives.find(item => item.id === view.life);
  if (!life) { holder.innerHTML = model.lives.length ? '<p class="rule-note">Pick a life to see its steps.</p>' : ''; return; }
  let written;
  try {
    written = writtenLife(model.store, life);
  } catch (error) {
    holder.innerHTML = `<p class="fatal">This life can't be drawn: ${esc(error.message)}</p>`;
    return;
  }
  let drawn = 0;
  const steps = life.steps.map((raw, index) => {
    const known = model.store.nodes.has(raw.node) && Number.isFinite(raw.age);
    return stepHTML(life, raw, index, known ? written.steps[drawn++] : null);
  });
  const lifeProblems = model.byLife.get(life.id) ?? [];
  holder.innerHTML = `<div class="life-head"><h3>${esc(life.name ?? life.id)}</h3>`
    + `<p>${esc(life.pronoun ?? '?')} · to ${esc(life.end ?? '?')} · ${plural(life.steps.length, 'step')} · <span class="chip file-chip">baselines/${esc(life.file)}</span></p></div>`
    + (lifeProblems.length ? `<ul class="d-problems">${lifeProblems.map(item => `<li class="p-${item.level}"><strong>${item.level === 'error' ? 'Error' : 'Warning'}</strong> ${esc(item.message)}</li>`).join('')}</ul>` : '')
    + `<ol class="steps">${steps.join('')}</ol>`;
}

function selectLife(id, { step = null, scroll = false } = {}) {
  if (!model.lives.some(life => life.id === id)) return;
  if (view.life !== id) {
    view.life = id;
    renderWho();
    renderLife();
    save();
  }
  if (step === null && !scroll) return;
  const target = step === null ? $('#life') : $('#life').querySelector(`[data-step="${step}"]`);
  if (!target) return;
  target.scrollIntoView({ block: step === null ? 'start' : 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  if (step !== null) flash(target);
}

function grownHTML(life, number) {
  if (!life) return `<article class="grown-life"><p class="rule-note">Life ${number}: nothing can grow from here.</p></article>`;
  const from = Math.max(0, life.steps.findIndex(step => step.picked));
  const lines = life.steps.slice(from).map(step => {
    const mark = step.kind === 'lucky' ? '<span class="g-mark g-lucky">lucky</span>' : step.kind === 'setback' ? '<span class="g-mark g-setback">setback</span>' : '';
    return `<li${step.picked ? ' class="fork"' : ''}><span class="g-age">${esc(step.age)}</span><span class="g-dash" aria-hidden="true">—</span>${glyph(step.kind)}<span class="g-line">${esc(step.line)}${mark}</span></li>`;
  }).join('');
  const ending = life.endedEarly ? `<span class="g-early">ends early, at ${esc(life.lastAge)}</span>` : `<span class="g-end">to ${esc(life.end)}</span>`;
  return `<article class="grown-life"><h4>Life ${number}${ending}<span class="g-seed">seed ${esc(life.seed)}</span></h4><ol>${lines}</ol></article>`;
}

function growFive(button) {
  const life = model.lives.find(item => item.id === button.dataset.life);
  const out = button.closest('.alt')?.querySelector('.grown');
  if (!life || !out) return;
  const lives = [];
  for (let number = 1; number <= GROW_COUNT; number += 1) {
    let grown = null;
    try { grown = grow(model.store, { baseline: life, forkIndex: Number(button.dataset.step), alt: button.dataset.alt, seed: newSeed() }); } catch { grown = null; }
    lives.push(grownHTML(grown, number));
  }
  out.innerHTML = lives.join('');
  button.textContent = `Grow ${GROW_COUNT} more`;
}

// ——— Head, controls and saved state ———
function renderHead() {
  const { store, ms } = model;
  const nodeFiles = store.files.filter(file => file.kind === 'nodes').length;
  $('#stats').textContent = `${plural(store.nodes.size, 'node')} in ${plural(nodeFiles, 'file')} · ${plural(model.lives.length, 'written life', 'written lives')} · read and checked in ${roundMs(ms.total)} ms`;
  $(source.fixture ? '#use-fixture' : '#use-real').setAttribute('aria-current', 'page');
  const root = source.fixture ? 'tests/fixtures/lives/' : 'prototype/lesson1-opening/lives/';
  for (const span of document.querySelectorAll('[data-root]')) span.textContent = root;
  document.title = `Lives tree${source.fixture ? ' (fixture)' : ''} · Lesson 1 opening · Wisdom`;
}

function renderControls() {
  const files = model.store.files.filter(file => file.kind === 'nodes');
  $('#file-filter').insertAdjacentHTML('beforeend', files.map(file => `<option value="${esc(file.file)}">${esc(fileShort(file.file))} (${file.count})</option>`).join(''));
  $('#search').value = view.filter.query;
  $('#file-filter').value = view.filter.file;
  $('#kind-filter').value = view.filter.kind;
  // A filter saved before a file was renamed or removed: drop it.
  if ($('#file-filter').value !== view.filter.file || $('#kind-filter').value !== view.filter.kind) {
    view.filter.file = $('#file-filter').value;
    view.filter.kind = $('#kind-filter').value;
    if (filtering()) computeVisible(); else if (view.saved) { view.open = new Set(view.saved.open); view.auto = new Set(view.saved.auto); view.saved = null; }
  }
  $('#clear').hidden = !filtering();
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
function saveNow() {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      open: [...view.open], auto: [...view.auto], saved: view.saved, filter: view.filter, life: view.life, touched: view.touched,
      scroll: { tree: $('.tree-pane').scrollTop, side: $('.side-pane').scrollTop, page: scrollY },
    }));
  } catch { /* storage off: the page still works, it just forgets */ }
}
function restore() {
  let state = null;
  try { state = JSON.parse(sessionStorage.getItem(STATE_KEY) ?? 'null'); } catch { state = null; }
  if (state && typeof state === 'object') {
    if (Array.isArray(state.open)) view.open = new Set(state.open);
    if (Array.isArray(state.auto)) view.auto = new Set(state.auto);
    if (state.saved?.open) view.saved = state.saved;
    if (state.filter) view.filter = { query: String(state.filter.query ?? ''), file: String(state.filter.file ?? ''), kind: String(state.filter.kind ?? '') };
    if (typeof state.life === 'string') view.life = state.life;
    if (typeof state.touched === 'string') view.touched = state.touched;
    view.scroll = state.scroll;
  }
  view.open.add(ROOT);
  if (!model.lives.some(life => life.id === view.life)) view.life = model.lives[0]?.id ?? null;
  if (filtering()) {
    if (!view.saved) view.saved = { open: [...view.open], auto: [...view.auto] };
    computeVisible();
  } else view.saved = null;
}
function restoreScroll() {
  const scroll = view.scroll;
  if (!scroll) return;
  $('.tree-pane').scrollTop = scroll.tree ?? 0;
  $('.side-pane').scrollTop = scroll.side ?? 0;
  if (scroll.page) scrollTo(0, scroll.page);
}

function wire() {
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-act]');
    if (!target) return;
    const act = target.dataset.act;
    if (act === 'toggle') toggle(target.dataset.key);
    else if (act === 'go') reveal(target.dataset.id);
    else if (act === 'life') selectLife(target.dataset.life, { scroll: !target.closest('#who') });
    else if (act === 'step') selectLife(target.dataset.life, { step: Number(target.dataset.step) });
    else if (act === 'grow') growFive(target);
    else if (act === 'expand-all') expandAll();
    else if (act === 'collapse-all') collapseAll();
    else if (act === 'clear') clearFilters();
  });
  $('#tree').addEventListener('keydown', onTreeKey);
  let typing = 0;
  $('#search').addEventListener('input', event => {
    clearTimeout(typing);
    typing = setTimeout(() => { view.filter.query = event.target.value; applyFilter(); }, 120);
  });
  $('#search').addEventListener('keydown', event => {
    if (event.key === 'Escape' && event.target.value) { event.preventDefault(); clearTimeout(typing); event.target.value = ''; view.filter.query = ''; applyFilter(); }
  });
  $('#file-filter').addEventListener('change', event => { view.filter.file = event.target.value; applyFilter(); });
  $('#kind-filter').addEventListener('change', event => { view.filter.kind = event.target.value; applyFilter(); });
  addEventListener('pagehide', saveNow);
  for (const pane of [$('.tree-pane'), $('.side-pane'), window]) pane.addEventListener('scroll', save, { passive: true });
}

async function init() {
  let opened;
  try {
    opened = await openStore(source);
    model = buildModel(opened);
  } catch (error) {
    $('#tree').innerHTML = `<p class="fatal">The store didn't load: ${esc(error?.message ?? error)}</p>`;
    $('#stats').textContent = 'The store didn\'t load.';
    return;
  }
  const started = performance.now();
  restore();
  renderHead();
  renderControls();
  renderChecker();
  renderTree();
  renderWho();
  renderLife();
  const drawn = performance.now() - started;
  $('#stats').textContent += ` · page drawn in ${roundMs(drawn)} ms`;
  document.documentElement.dataset.drawnMs = drawn.toFixed(1);
  restoreScroll();
  wire();
}

init();
