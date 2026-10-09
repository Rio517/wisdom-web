// Sam's life drawn in the Explore chapter's language (design 001 v13, round 3).
// The drawing and label code are study copies of src/lessons/choices/journey-explore.js:
// the same curves (they leave and reach every dot level, so each dot sits where
// lines split), the same strokes, dots, star and diamond, the same label
// placement and end card. New here:
// - the route is Sam's authored life on an age axis from 0 to 45, with the
//   choices he didn't make leaving every dot in gray;
// - it is played by the story's clock (life.js), one step at a time;
// - after the story, a gray choice can be picked: his real path from that fork
//   turns light and stays behind, and a new life grows from the fork with the
//   explorer's tree (explore-tree.js), seeded by the choice, to age 41.
// Drawing is split so a frame stays cheap: the gray lines and the dark route are
// drawn once per step onto two stage-sized canvases, and only the step in
// motion is redrawn each frame, on a small canvas the size of that step. Labels,
// the choices to pick, rings and the end card are HTML over the canvases.
import { canvasBitmap } from '../../src/engine/path-presentation.js';
import { hash, stepLabel } from '../../src/lessons/choices/journey-choices.js';
import { ease, prefersReducedMotion } from '../../src/lessons/choices/journey-motion.js';
import { t } from '../../src/i18n/runtime.js';
import { createLifeTree, isSurprise } from './explore-tree.js';
import { LIFE_STEPS, BORN_Y, END, walkEase } from './life.js';

const FOREST = '#285442';
const SAGE = '#8daa91';
const MIST = '#c5cec8';
const CLAY = '#9a5f3e';
const SUN = '#e0a93b';
const HALO = '#f2f5f0';
const FONT = '"Avenir Next", AvenirNext, "Segoe UI", sans-serif';
const MAX_AGE = 45; // the axis runs 0–45; the paths still ahead run on past it
const TOP = 24;
const BOTTOM = 56;
const RIGHT = 56; // room past 45 for the paths still ahead
const CHOSEN_SIZE = 15;
const GRAY_SIZE = 13;
const OVER_GRAY = 30; // label cost of sitting over a gray choice or a path ahead
const OVER_TAIL = 14; // and over a fainter gray tail
const LIVED = 4.4;
/** The steps whose choice the reader can change: choir (6), guitar (10), the band (14), fame (23), asking for help (27). */
export const CHANGEABLE = [1, 2, 3, 7, 9];

/** Every gray choice on Sam's route, in age order. Those with an `id` can be picked. */
export const ALTS = LIFE_STEPS.flatMap((step, stepIndex) => (step.alts ?? []).map((alt, k) => ({
  ...alt,
  stepIndex,
  key: alt.id ?? `${step.key}-${k}`,
  side: alt.y < step.y ? -1 : 1,
  bend: (hash(`sam-${alt.id ?? `${step.key}-${k}`}:bend`) - 0.5) * 0.03,
})));
export const PICKS = ALTS.filter(alt => alt.id).sort((a, b) => a.age - b.age);

// The seed each picked life grows from, checked so that, like any explorer life,
// each goes up and down, and their ends spread around Sam's: two end higher
// than his, one a little lower, the rest lower. "Saves money" ends lower than his,
// and the two other ways forward at 27 climb back from the low point too.
const SEEDS = {
  football: 'sam-football-27',
  drums: 'sam-drums-26',
  savesMoney: 'sam-savesMoney-13',
  movesHome: 'sam-movesHome-9',
  officeJob: 'sam-officeJob-34',
};

// A what-if is told about Sam, so its labels never speak to "you": a step takes
// the opening's third-person words where it has them, and a step or example
// choice still addressed to the reader is left out of the pool.
const whatIfLabel = id => (t.has(`opening.whatif.step.${id}`) ? t(`opening.whatif.step.${id}`) : stepLabel(id));
const personNeutral = words => !/\b(you|your|yours|yourself)\b/i.test(words);
const trees = new Map();
function treeFor(alt) {
  if (!trees.has(alt.key)) {
    const band = alt.band ? { lo: alt.band[0], hi: alt.band[1] }
      : alt.side < 0 ? { lo: alt.y - 0.13, hi: alt.y + 0.015 } : { lo: alt.y - 0.015, hi: alt.y + 0.13 };
    trees.set(alt.key, createLifeTree({
      seed: SEEDS[alt.key] ?? `sam-${alt.key}`,
      start: { age: alt.age, y: alt.y, step: alt.step, label: alt.id ? t(`map.life.alt.${alt.id}`) : null, byFamily: alt.byFamily },
      end: LIFE_STEPS[END].age,
      taken: LIFE_STEPS.slice(0, alt.stepIndex).map(step => step.step).filter(Boolean),
      firstBand: band,
      firstGap: alt.gap ?? 1,
      spread: 0.26,
      settle: 0.5,
      label: whatIfLabel,
      keep: personNeutral,
    }));
  }
  return trees.get(alt.key);
}
const lives = new Map();
/** The life a pick plays by itself: the tree's own nodes, from the alternative to 41. */
export function lifeFor(altKey) {
  const alt = ALTS.find(item => item.key === altKey);
  if (!alt?.id) return null;
  if (!lives.has(altKey)) lives.set(altKey, treeFor(alt).autoPath());
  return lives.get(altKey);
}
// The paths still ahead of a life's last dot: always a choice of two or three, never a single surprise.
const aheads = new Map();
function aheadTree(seed, age, y) {
  const key = `${seed}|${age}|${y}`;
  if (!aheads.has(key)) aheads.set(key, createLifeTree({ seed, start: { age, y, kind: 'ahead' }, end: 70, firstBand: { lo: y - 0.15, hi: y + 0.11 }, firstGap: 0.7 }));
  return aheads.get(key);
}
// The lives to pick grow while the reader reads the end card, one per idle moment, so a pick only lays one out.
let warmed = false;
function warmLives() {
  if (warmed) return;
  warmed = true;
  const idle = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 60));
  const keys = PICKS.map(alt => alt.key);
  const next = () => { const key = keys.shift(); if (!key) return; lifeFor(key); idle(next, { timeout: 2000 }); };
  idle(next, { timeout: 2000 });
}

// ——— Curves (the explorer's: level out of each dot, level into the next) ———
function controls(edge) {
  const dx = edge.b.x - edge.a.x;
  return [edge.a, { x: edge.a.x + dx * 0.5, y: edge.a.y + edge.bend }, { x: edge.b.x - dx * 0.5, y: edge.b.y }, edge.b];
}
function pointOn(edge, t) {
  const [p0, p1, p2, p3] = controls(edge);
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}
const edgePoints = (edge, samples = 20) => Array.from({ length: samples + 1 }, (_, i) => pointOn(edge, i / samples));
/** The curve from its start to `t`, as one Bézier (de Casteljau), so a growing line is one stroke. */
function trace(context, edge, t = 1) {
  const [p0, p1, p2, p3] = controls(edge);
  context.moveTo(p0.x, p0.y);
  if (t >= 1) { context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y); return; }
  if (t <= 0) return;
  const lerp = (a, b) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const q0 = lerp(p0, p1); const q1 = lerp(p1, p2); const q2 = lerp(p2, p3);
  const r0 = lerp(q0, q1); const r1 = lerp(q1, q2);
  context.bezierCurveTo(q0.x, q0.y, r0.x, r0.y, lerp(r0, r1).x, lerp(r0, r1).y);
}
// Gray and light green lines that run on past the stage fade out at its right edge.
let fadeFrom = Infinity;
const FADES = { [MIST]: [197, 206, 200], [SAGE]: [141, 170, 145] };
function strokeStyle(context, color) {
  const rgb = FADES[color];
  if (!rgb || !Number.isFinite(fadeFrom)) return color;
  const gradient = context.createLinearGradient(fadeFrom, 0, fadeFrom + 54, 0);
  gradient.addColorStop(0, `rgb(${rgb})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  return gradient;
}
function stroke(context, edges, color, width, alpha = 1, t = 1, dash = null) {
  if (!edges.length || t <= 0 || alpha <= 0) return;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = strokeStyle(context, color);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (dash) context.setLineDash(dash);
  context.beginPath();
  for (const edge of edges) trace(context, edge, t);
  context.stroke();
  context.restore();
}
function dot(context, point, radius, color, alpha = 1) {
  if (radius <= 0) return;
  context.save(); context.globalAlpha = alpha; context.fillStyle = color;
  context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill(); context.restore();
}
// A small flat marker where a surprise happened: a star for a lucky break, a diamond for a setback.
function marker(context, point, kind, scale = 1, alpha = 1) {
  if (scale <= 0) return;
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = kind === 'lucky' ? SUN : CLAY;
  context.strokeStyle = HALO;
  context.lineWidth = 2;
  context.beginPath();
  const spikes = kind === 'lucky' ? 5 : 2;
  const outer = (kind === 'lucky' ? 10 : 8.5) * scale;
  const inner = (kind === 'lucky' ? 4.4 : 8.5) * scale;
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (index * Math.PI) / spikes;
    context.lineTo(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius);
  }
  context.closePath();
  context.stroke();
  context.fill();
  context.restore();
}
const markerKind = kind => (kind === 'lucky' || kind === 'roadblock' ? kind : null);
const markerRadius = kind => (kind === 'lucky' ? 10 : 8.5);
function boundsOf(points, pad) {
  const xs = points.map(point => point.x); const ys = points.map(point => point.y);
  return { left: Math.min(...xs) - pad, top: Math.min(...ys) - pad, right: Math.max(...xs) + pad, bottom: Math.max(...ys) + pad };
}
const edgeBounds = edge => controls(edge);

// ——— Labels (the explorer's placement) ———
// Every spot the explorer tries for a chosen label, cheapest first: the first
// clear one is the one its search would pick. Here a label names the dot its
// line arrives at (Sam's step at that age), so the spots start nearer the dot.
const SPOTS = (() => {
  const list = [];
  [14, 13, 15, 12, 16, 11, 17, 10, 18, 9, 19, 8, 7, 6, 5, 4, 3, 2, 1].forEach((index, rank) => {
    for (const side of [-1, 1]) {
      for (const gap of [11, 22, 36, 54, 78, 104, 132]) {
        for (const align of ['center', 'left', 'right']) list.push({ index, side, gap, align, cost: rank * 2 + gap + (align === 'center' ? 0 : 6) + (side > 0 ? 2 : 0) });
      }
    }
  });
  // Beside the dot itself, clear of the lines that leave and reach it level.
  for (const [dx, dy, align] of [[12, 24, 'left'], [-12, 24, 'right'], [12, -14, 'left'], [-12, -14, 'right'], [-14, 5, 'right']]) {
    list.push({ dot: true, dx, dy, align, cost: 21 });
  }
  return list.sort((a, b) => a.cost - b.cost);
})();

/**
 * Places labels clear of each other and of the lines given as `paths` (a
 * label never sits on the dark route or a dot). Sam's labels also try to keep
 * off the gray and light green lines (`soft`) first, the nearer ones before the
 * fainter tails, and only sit over them where nothing else is clear.
 * `measure(text, font)` is a canvas measureText.
 */
function sampleGrid(edges, points = []) {
  const CELL = 16;
  const grid = new Map();
  const add = s => {
    const key = `${Math.floor(s.x / CELL)},${Math.floor(s.y / CELL)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(s);
  };
  for (const edge of edges) {
    const dense = edgePoints(edge, 40);
    for (let i = 1; i < dense.length; i += 1) {
      const a = dense[i - 1]; const b = dense[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let k = 0; k < steps; k += 1) add({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps });
    }
    add(dense.at(-1));
  }
  points.forEach(add);
  // True when the line (or a dot) comes within `margin` pixels of the box.
  return (box, margin = 8) => {
    for (let cx = Math.floor((box.left - margin - 1) / CELL); cx <= Math.floor((box.right + margin + 1) / CELL); cx += 1) {
      for (let cy = Math.floor((box.top - margin - 1) / CELL); cy <= Math.floor((box.bottom + margin + 1) / CELL); cy += 1) {
        if (grid.get(`${cx},${cy}`)?.some(s => s.x > box.left - margin && s.x < box.right + margin && s.y > box.top - margin && s.y < box.bottom + margin)) return true;
      }
    }
    return false;
  };
}
function createPlacer({ width, height, measure, paths = [], dots = [], boxes = [], right = 2, soft = [[], []] }) {
  const onPath = sampleGrid(paths, dots);
  const near = soft.map(edges => sampleGrid(edges));
  const taken = [...boxes];
  const outside = box => box.left < 2 || box.right > width - right || box.top < 2 || box.bottom > height - 26;
  const clash = box => taken.some(o => box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top);
  const distance = (box, p) => Math.hypot(Math.max(box.left - p.x, 0, p.x - box.right), Math.max(box.top - p.y, 0, p.y - box.bottom));
  // A label must read as its own dot's: no other dot may sit nearer to it.
  const strayed = (box, own) => dots.some(p => p !== own && distance(box, p) + 2 < distance(box, own));
  return {
    onPath,
    reserve(box) { taken.push(box); },
    /** A chosen-path label along its edge (`points`, 21 of them, ending at its dot), or null when nowhere is clear. */
    chosen(text, points, own = points.at(-1)) {
      const width = measure(text, `650 ${CHOSEN_SIZE}px ${FONT}`);
      const home = dots.find(p => Math.abs(p.x - own.x) < 0.5 && Math.abs(p.y - own.y) < 0.5) ?? own;
      // The explorer's cheapest clear spot, where sitting over a gray line costs extra.
      let best = null;
      for (const spot of SPOTS) {
        if (best && spot.cost >= best.cost) break;
        const anchor = spot.dot ? own : points[spot.index];
        const baseline = spot.dot ? own.y + spot.dy : spot.side < 0 ? anchor.y - spot.gap - 4 : anchor.y + spot.gap + CHOSEN_SIZE;
        const left = spot.dot ? (spot.align === 'left' ? own.x + spot.dx : own.x + spot.dx - width)
          : spot.align === 'center' ? anchor.x - width / 2 : spot.align === 'left' ? anchor.x - 6 : anchor.x - width + 6;
        const box = { left: left - 4, right: left + width + 4, top: baseline - CHOSEN_SIZE, bottom: baseline + 4 };
        if (outside(box) || clash(box) || onPath(box) || strayed(box, home)) continue;
        const cost = spot.cost + (near[0](box, 3) ? OVER_GRAY : 0) + (near[1](box, 3) ? OVER_TAIL : 0);
        if (!best || cost < best.cost) best = { cost, spot, anchor, box, left, baseline };
      }
      if (!best) return null;
      const { spot, anchor, box, left, baseline } = best;
      taken.push(box);
      const leader = !spot.dot && spot.gap > 14 ? {
        from: { x: anchor.x, y: anchor.y + spot.side * 5 },
        to: { x: Math.min(Math.max(anchor.x, box.left + 4), box.right - 4), y: spot.side < 0 ? box.bottom - 2 : box.top + 2 },
      } : null;
      return { text, left, baseline, box, leader, size: CHOSEN_SIZE };
    },
    /**
     * A gray choice's label, near the middle of its line, or null where none is
     * clear (as in the explorer). `force` always finds one: the choices to pick.
     */
    gray(text, points, { force = false } = {}) {
      const width = measure(text, `500 ${GRAY_SIZE}px ${FONT}`);
      const at = (anchor, dy) => {
        const baseline = anchor.y + dy;
        // The button's own box: 6 px padding and a 1.5 px border each side.
        return { left: anchor.x - width / 2, baseline, box: { left: anchor.x - width / 2 - 8, right: anchor.x + width / 2 + 8, top: baseline - GRAY_SIZE - 2, bottom: baseline + 7 } };
      };
      let fallback = null;
      // Near the middle of its line first (as in the explorer), then on along the life it leads to.
      for (const index of [12, 11, 13, 10, 14, 9, 15, 8, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 7]) {
        if (!points[index]) continue;
        for (const dy of [-8, 18, -16, 26]) {
          const spot = at(points[index], dy);
          if (outside(spot.box) || clash(spot.box)) continue;
          fallback ??= spot;
          if (onPath(spot.box)) continue;
          taken.push(spot.box);
          return { text, size: GRAY_SIZE, ...spot };
        }
      }
      if (!force) return null;
      const spot = fallback ?? at(points[12], -8);
      taken.push(spot.box);
      return { text, size: GRAY_SIZE, forced: true, ...spot };
    },
  };
}

const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function createLifeMap(stack, { origin, before = null, onPick = () => {}, onStep = () => {}, onDone = () => {} } = {}) {
  const make = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  const axis = make('div', 'life-axis');
  const graysCanvas = make('canvas', 'life-grays');
  const darkCanvas = make('canvas', 'life-dark');
  const liveCanvas = make('canvas', 'life-live');
  const overlay = document.createElement('div');
  overlay.className = 'life-overlay';
  const card = document.createElement('div');
  card.className = 'explore-end life-end';
  card.hidden = true;
  card.innerHTML = `<h2 tabindex="-1">${escapeHTML(t('opening.end.heading'))}</h2>
    <p>${escapeHTML(t('opening.end.gray'))}</p>
    <div class="end-buttons"><button type="button" class="solid-pill" data-life="choose">${escapeHTML(t('opening.end.change'))}</button></div>`;
  for (const element of [axis, graysCanvas, darkCanvas, liveCanvas, overlay]) stack.insertBefore(element, before);
  const contexts = [graysCanvas, darkCanvas, liveCanvas].map(canvas => { try { return canvas.getContext('2d'); } catch { return null; } });
  const [gx, dx, lx] = contexts;
  const failed = contexts.some(context => !context);
  const boxOf = element => {
    const box = element.getBoundingClientRect();
    const home = stack.getBoundingClientRect();
    return { left: box.left - home.left, top: box.top - home.top, right: box.right - home.left, bottom: box.bottom - home.top };
  };
  const measure = (text, font) => { dx.save(); dx.font = font; const width = dx.measureText(text).width; dx.restore(); return width; };

  let size = null;
  let geo = null;
  let mode = 'story';
  let frame = null;
  let baked = -1; // steps drawn whole onto the gray and dark canvases
  let aheadBaked = false;
  let lastPos = 0;
  let landFrom = null;
  let what = null;
  let liveBox = '';
  let shown = { labels: -1, alts: -1 };
  let visible = true;

  const rect = () => {
    if (!size) size = { width: stack.clientWidth, height: stack.clientHeight };
    return size;
  };

  // ——— Where everything sits at this stage size ———
  function geometry() {
    const r = rect();
    const key = `${r.width}x${r.height}`;
    if (geo?.key === key) return geo;
    const o = origin();
    // A narrow stage keeps a band clear at the top for the end card's bar.
    const span = r.height - TOP - BOTTOM - (r.width < 800 ? 44 : 0);
    fadeFrom = r.width - 64;
    // Even years: Sam's later life has as many steps as his childhood, so it gets the same room.
    const X = age => o.x + (age / MAX_AGE) * (r.width - o.x - RIGHT);
    const Y = y => o.y + (y - BORN_Y) * span;
    const at = (age, y) => ({ x: X(age), y: Y(y) });
    const points = LIFE_STEPS.map(step => at(step.age, step.y));
    const edges = points.map((point, index) => (index ? { a: points[index - 1], b: point, bend: 0 } : null));
    const alts = ALTS.map(alt => {
      const node = at(alt.age, alt.y);
      const edge = { a: points[alt.stepIndex - 1], b: node, bend: alt.bend * span };
      // Gray lives run on past 41 too: an alternative too late for a fork of its own gets the paths ahead.
      const own = treeFor(alt).children('r');
      const next = own.length ? own : aheadTree(`sam-${alt.key}`, alt.age, alt.y).children('r');
      const tails = next.map(child => ({ a: node, b: at(child.age, child.y ?? child.ay), bend: child.bend * span }));
      return { alt, node, edge, tails };
    });
    const altsOf = LIFE_STEPS.map((_, index) => alts.filter(item => item.alt.stepIndex === index));
    const ahead = aheadEdges(aheadTree('sam-ahead', LIFE_STEPS[END].age, LIFE_STEPS[END].y), points[END], at, span);

    // Labels: Sam's in age order (an earlier label never moves when a later one
    // arrives), then the gray choices, which give way to them.
    const placer = createPlacer({ width: r.width, height: r.height, measure, paths: edges.slice(1), dots: points, right: 46,
      soft: [[...alts.map(item => item.edge), ...ahead.first], alts.flatMap(item => item.tails)] });
    const labels = LIFE_STEPS.map((step, index) => placer.chosen(t(`map.life.${step.key}`), index ? edgePoints(edges[index]) : Array(21).fill(points[0]), points[index]));
    // The tail nearest its own height carries a gray label on if the line itself is crowded.
    const altLine = item => {
      const tail = [...item.tails].sort((a, b) => Math.abs(a.b.y - item.node.y) - Math.abs(b.b.y - item.node.y))[0];
      return [...edgePoints(item.edge), ...(tail ? edgePoints(tail).slice(1) : [])];
    };
    const grayLabels = alts.map(item => (item.alt.id ? placer.gray(t(`map.life.alt.${item.alt.id}`), altLine(item)) : null));
    // Every choice to pick gets a button. One whose label found no clear room
    // shows only while choosing, and Sam's labels in its way step aside then.
    const buttons = createPlacer({ width: r.width, height: r.height, measure, paths: edges.slice(1), dots: points, right: 46, boxes: grayLabels.filter(Boolean).map(item => item.box) });
    const pickLabels = alts.map((item, index) => (item.alt.id ? grayLabels[index] ?? { ...buttons.gray(t(`map.life.alt.${item.alt.id}`), altLine(item), { force: true }), tight: true } : null));
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const yields = labels.map(label => Boolean(label) && pickLabels.some(item => item?.tight && overlaps(label.box, item.box)));
    geo = { key, span, X, Y, at, points, edges, alts, altsOf, ahead, labels, grayLabels: pickLabels, yields, placer };
    buildOverlay();
    applyMode();
    return geo;
  }

  function aheadEdges(tree, from, at, span) {
    const first = tree.children('r');
    return {
      first: first.map(child => ({ a: from, b: at(child.age, child.ay), bend: child.bend * span })),
      second: [],
    };
  }

  // ——— HTML over the canvases: labels, the choices to pick, rings, pulses, the end card ———
  let labelEls = [];
  let altEls = [];
  let ringEls = [];
  let pulseEls = [];
  let whatEls = [];
  // A label that had to move away keeps a short leader to its line, drawn with
  // the label so the two show and hide together. The label is raised by 80% of
  // its height (opening.css), so the leader is lowered by as much.
  function leaderHTML(item) {
    if (!item.leader) return '';
    const { from, to } = item.leader;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    return `<i class="life-leader" style="left:${(from.x - item.left).toFixed(1)}px;top:${(from.y - item.baseline + item.size * 0.8).toFixed(1)}px;width:${Math.hypot(to.x - from.x, to.y - from.y).toFixed(1)}px;transform:rotate(${angle.toFixed(4)}rad)"></i>`;
  }
  function labelHTML(item, className, extra = '') {
    if (!item) return '';
    return `<span class="life-label ${className}" style="left:${item.left.toFixed(1)}px;top:${item.baseline.toFixed(1)}px"${extra}>${escapeHTML(item.text)}${leaderHTML(item)}</span>`;
  }
  function buildOverlay() {
    const g = geo;
    overlay.innerHTML = `${g.labels.map((item, index) => labelHTML(item, g.yields[index] ? 'is-dark is-yielding' : 'is-dark', ` data-step="${index}"`)).join('')}
      ${CHANGEABLE.map(index => `<i class="life-ring" data-step="${index}" style="left:${g.points[index].x.toFixed(1)}px;top:${g.points[index].y.toFixed(1)}px"></i>`).join('')}
      ${g.alts.map((item, index) => {
        const spot = g.grayLabels[index];
        if (!spot) return '';
        const step = LIFE_STEPS[item.alt.stepIndex];
        return `<button type="button" class="life-alt${spot.tight ? ' is-tight' : ''}" data-alt="${item.alt.key}" tabindex="-1" style="left:${(spot.left + measureHalf(spot)).toFixed(1)}px;top:${spot.baseline.toFixed(1)}px"
          aria-label="${escapeHTML(t('opening.alt.label', { choice: spot.text, instead: t(`map.life.${step.key}`), age: step.age }))}"><span>${escapeHTML(spot.text)}</span></button>`;
      }).join('')}
      <i class="life-pulse"></i><i class="life-pulse"></i>`;
    overlay.prepend(card);
    labelEls = [...overlay.querySelectorAll('.life-label.is-dark')];
    altEls = [...overlay.querySelectorAll('.life-alt')];
    ringEls = [...overlay.querySelectorAll('.life-ring')];
    pulseEls = [...overlay.querySelectorAll('.life-pulse')];
    whatEls = [];
    shown = { labels: -1, alts: -1 };
    axis.innerHTML = `${[5, 10, 15, 20, 25, 30, 35, 40, 45].map(age => {
      const x = g.X(age);
      if (x < 64 || x > rect().width - 12) return '';
      return `<span class="life-tick" style="left:${x.toFixed(1)}px"><b>${age}</b></span>`;
    }).join('')}<span class="life-axis-name">${escapeHTML(t('explore.age'))}</span>`;
  }
  const measureHalf = spot => measure(spot.text, `500 ${GRAY_SIZE}px ${FONT}`) / 2;

  function showLabels(count, altCount) {
    if (count !== shown.labels) {
      shown.labels = count;
      labelEls.forEach(element => element.classList.toggle('is-shown', Number(element.dataset.step) < count));
    }
    if (altCount !== shown.alts) {
      shown.alts = altCount;
      altEls.forEach(element => {
        const alt = ALTS.find(item => item.key === element.dataset.alt);
        element.classList.toggle('is-shown', alt.stepIndex < altCount);
      });
    }
  }

  // ——— Canvases ———
  function sizeCanvas(canvas, context, box) {
    const bitmap = canvasBitmap(box, devicePixelRatio || 1);
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) { canvas.width = bitmap.width; canvas.height = bitmap.height; }
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, -box.left * bitmap.scale, -box.top * bitmap.scale);
    context.clearRect(box.left, box.top, box.width, box.height);
  }
  let sizedFor = ''; // the stage size the gray and dark canvases were last drawn at
  function clearBase() {
    const r = rect();
    sizedFor = `${r.width}x${r.height}`;
    sizeCanvas(graysCanvas, gx, { left: 0, top: 0, width: r.width, height: r.height });
    sizeCanvas(darkCanvas, dx, { left: 0, top: 0, width: r.width, height: r.height });
    baked = -1; aheadBaked = false;
  }
  /** Move the live canvas over `box` (stage pixels) and clear it. */
  function useLive(bounds) {
    const r = rect();
    const box = {
      left: Math.max(0, Math.floor(bounds.left)), top: Math.max(0, Math.floor(bounds.top)),
    };
    box.width = Math.max(1, Math.min(r.width, Math.ceil(bounds.right)) - box.left);
    box.height = Math.max(1, Math.min(r.height, Math.ceil(bounds.bottom)) - box.top);
    const placed = `${box.left},${box.top},${box.width},${box.height}`;
    if (placed !== liveBox) {
      liveBox = placed;
      Object.assign(liveCanvas.style, { left: `${box.left}px`, top: `${box.top}px`, right: 'auto', bottom: 'auto', width: `${box.width}px`, height: `${box.height}px` });
    }
    sizeCanvas(liveCanvas, lx, box);
  }

  // One step of Sam's route, whole: the gray choices he didn't make, then the line to his dot.
  function bakeStep(index) {
    const g = geometry();
    if (index > 0) {
      for (const item of g.altsOf[index]) {
        stroke(gx, [item.edge], MIST, 2.3);
        stroke(gx, item.tails, MIST, 1.8, 0.55);
      }
      stroke(dx, [g.edges[index]], FOREST, LIVED);
      const previous = LIFE_STEPS[index - 1];
      if (markerKind(previous.kind)) marker(dx, g.points[index - 1], previous.kind);
    }
    const step = LIFE_STEPS[index];
    if (markerKind(step.kind)) marker(dx, g.points[index], step.kind);
    else dot(dx, g.points[index], 3.8, FOREST);
  }
  function bakeAhead() {
    const g = geometry();
    stroke(gx, g.ahead.first, SAGE, 3, 0.9);
    stroke(gx, g.ahead.second, SAGE, 2.2, 0.5);
    aheadBaked = true;
  }
  function bakeTo(count, ahead) {
    const r = rect();
    // The first drawing at a stage size sizes the canvases first.
    if (sizedFor !== `${r.width}x${r.height}` || count < baked + 1 || (aheadBaked && !ahead)) clearBase();
    for (let index = baked + 1; index < count; index += 1) bakeStep(index);
    baked = Math.max(baked, count - 1);
    if (ahead && !aheadBaked) bakeAhead();
  }

  // The traveller: moving, a dot with a soft halo; resting, a slightly larger dot.
  function traveller(context, point, moving, scale = 1) {
    if (moving) dot(context, point, 13 * scale, 'rgba(40,84,66,.16)');
    dot(context, point, (moving ? 7 : 7.5) * scale, FOREST);
  }

  // ——— Sam's story, one frame at a time ———
  function drawStory() {
    const g = geometry();
    const f = frame;
    if (!f) return;
    const index = Math.min(f.index, END + 1);
    if (f.landing !== null) {
      bakeTo(END + 1, true);
      showLabels(END + 1, END + 1);
      if (landFrom === null) landFrom = lastPos;
      const pos = landFrom + (END - landFrom) * f.landing;
      const at = positionAt(pos);
      useLive(boundsOf([at, g.points[END]], 16));
      traveller(lx, at, f.landing < 1);
      lastPos = pos;
      pulses([]);
      return;
    }
    landFrom = null;
    const close = f.index > END;
    bakeTo(close ? END + 1 : index, close && f.sprout >= 1);
    showLabels(close ? END + 1 : index + (f.label ? 1 : 0), close ? END + 1 : index + (f.label ? 1 : 0));
    pulses(f.pulses);
    if (f.index < 0) { useLive({ left: 0, top: 0, right: 1, bottom: 1 }); lastPos = 0; return; }
    const end = g.points[END];
    if (close) {
      if (f.sprout < 1) {
        useLive(boundsOf([...g.ahead.first.flatMap(edgeBounds), end], 16));
        stroke(lx, g.ahead.first, SAGE, 3, 0.9, f.sprout);
        stroke(lx, g.ahead.second, SAGE, 2.2, 0.5, Math.max(0, f.sprout * 2 - 1));
      } else {
        useLive(boundsOf([end], 16));
      }
      traveller(lx, end, false);
      lastPos = END;
      return;
    }
    const step = LIFE_STEPS[index];
    const here = g.points[index];
    if (index === 0) {
      useLive(boundsOf([here], 16));
      dot(lx, here, 3.8 * f.bloom, FOREST);
      traveller(lx, here, false, f.appear);
      lastPos = 0;
      return;
    }
    const edge = g.edges[index];
    const items = g.altsOf[index];
    useLive(boundsOf([...edgeBounds(edge), ...items.flatMap(item => [...edgeBounds(item.edge), ...item.tails.flatMap(edgeBounds)])], 16));
    // The choices he didn't make grow from the dot he leaves, as he leaves it.
    for (const item of items) {
      stroke(lx, [item.edge], MIST, 2.3, 1, f.sprout);
      stroke(lx, item.tails, MIST, 1.8, 0.55, f.tails);
    }
    stroke(lx, [edge], FOREST, LIVED, 1, f.walk);
    const previous = LIFE_STEPS[index - 1];
    if (markerKind(previous.kind)) marker(lx, g.points[index - 1], previous.kind);
    else dot(lx, g.points[index - 1], 3.8, FOREST);
    if (!markerKind(step.kind)) dot(lx, here, 3.8 * f.bloom, FOREST);
    const head = pointOn(edge, f.walk);
    traveller(lx, head, f.walk < 1);
    // Luck and setbacks over the traveller, so their mark shows while Sam stands there.
    if (markerKind(step.kind)) marker(lx, here, step.kind, f.bloom);
    lastPos = index - 1 + f.walk;
  }
  function positionAt(pos) {
    const g = geometry();
    if (pos <= 0) return g.points[0];
    const index = Math.min(END, Math.floor(pos) + 1);
    return pointOn(g.edges[index], Math.min(1, pos - (index - 1)));
  }
  // Earlier steps this one builds on answer with one ring each.
  function pulses(list) {
    const g = geometry();
    pulseEls.forEach((element, order) => {
      const item = list[order];
      if (!item) { if (element.style.opacity !== '0') element.style.opacity = '0'; return; }
      const point = g.points[item.at];
      const eased = 1 - (1 - item.p) ** 2;
      const radius = 7 + 15 * eased;
      Object.assign(element.style, { left: `${point.x}px`, top: `${point.y}px`, width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: String(0.6 * (1 - item.p)) });
    });
  }

  // ——— Modes ———
  function applyMode() {
    stack.dataset.life = mode;
    const picking = mode === 'ended' || mode === 'choosing' || mode === 'whatif';
    altEls.forEach(element => { element.tabIndex = mode === 'choosing' ? 0 : -1; element.disabled = !picking; });
    ringEls.forEach(element => element.classList.toggle('is-shown', mode === 'choosing'));
  }
  function setMode(next) {
    mode = next;
    applyMode();
    if (next === 'ended') { showCard(); warmLives(); } else card.hidden = true;
  }

  // The end card: lower right as in the explorer, unless that covers the route
  // or its labels; then the clear corner; on a stage too small for both, a bar.
  function showCard() {
    const g = geometry();
    const r = rect();
    card.hidden = false;
    card.classList.remove('is-bar');
    card.style.cssText = 'visibility:hidden';
    const width = card.offsetWidth; const height = card.offsetHeight;
    const near = (box, others) => others.some(other => box.left < other.right + 6 && box.right > other.left - 6 && box.top < other.bottom + 6 && box.bottom > other.top - 6);
    const dark = labelEls.filter(element => element.classList.contains('is-shown')).map(boxOf);
    const gray = altEls.filter(element => element.classList.contains('is-shown') && !element.classList.contains('is-tight')).map(boxOf);
    // Never over Sam's route, its dots, its labels or the paths still ahead; gray lines may pass under, as in the explorer.
    const blocked = (box, strict) => g.placer.onPath(box) || near(box, dark) || (strict && near(box, gray))
      || [...g.points, ...g.ahead.first.map(edge => edge.b)].some(point => point.x > box.left - 18 && point.x < box.right + 18 && point.y > box.top - 18 && point.y < box.bottom + 18);
    const spots = [
      { right: 22, bottom: 44 }, { right: 22, bottom: 96 }, { left: 16, bottom: 44 }, { left: 16, top: 16 }, { right: 22, top: 16 },
    ].map(spot => ({ ...spot, box: {
      left: spot.left ?? r.width - spot.right - width, top: spot.top ?? r.height - spot.bottom - height,
      right: (spot.left ?? r.width - spot.right - width) + width, bottom: (spot.top ?? r.height - spot.bottom - height) + height,
    } }));
    const spot = spots.find(item => !blocked(item.box, true)) ?? spots.find(item => !blocked(item.box, false));
    if (spot) {
      card.style.cssText = `left:${spot.box.left}px;top:${spot.box.top}px;right:auto;bottom:auto`;
      return;
    }
    // A stage too small for a card gets a bar across the map's empty top, or else its foot.
    card.classList.add('is-bar');
    card.style.cssText = 'visibility:hidden';
    const barHeight = card.offsetHeight;
    const bar = top => ({ left: 12, right: r.width - 12, top, bottom: top + barHeight });
    const top = [12, r.height - 30 - barHeight].find(y => !blocked(bar(y), false)) ?? r.height - 30 - barHeight;
    card.style.cssText = `top:${top}px;bottom:auto`;
  }

  // ——— A life Sam could have lived ———
  /**
   * Pick a gray choice: his real path from that fork turns light and stays
   * behind, and a new life grows from the fork along the choice to 41, at the
   * explorer's walking speed. `reduced` shows it at once.
   */
  function pick(altKey, { reduced = prefersReducedMotion(), silent = false } = {}) {
    const alt = ALTS.find(item => item.key === altKey);
    if (!alt?.id) return null;
    stopWhat();
    const g = geometry();
    const life = lifeFor(altKey);
    const tree = treeFor(alt);
    const fork = alt.stepIndex - 1;
    const item = g.alts.find(entry => entry.alt.key === altKey);
    const nodes = [{ ...life[0], point: item.node }, ...life.slice(1).map(node => ({ ...node, point: g.at(node.age, node.y ?? node.ay) }))];
    // Each new dot sits only where its own lines split: none lands on Sam's light
    // path behind it, and the new life's last dot keeps clear of his.
    const samLine = g.edges.slice(alt.stepIndex).flatMap(edge => edgePoints(edge, 30));
    const gapTo = point => Math.min(...samLine.map(q => Math.hypot(q.x - point.x, q.y - point.y)));
    nodes.forEach((node, index) => {
      const clearance = index === nodes.length - 1 ? 30 : 18;
      if (!index || gapTo(node.point) >= clearance) return;
      const r = rect();
      // Up or down, away from his path on the side the dot is on; beside a
      // steep stretch of it, a little earlier or later instead. Never past a neighbour.
      const nearest = samLine.reduce((best, q) => (Math.hypot(q.x - node.point.x, q.y - node.point.y) < Math.hypot(best.x - node.point.x, best.y - node.point.y) ? q : best));
      const away = node.point.y > nearest.y ? 1 : -1;
      const side = node.point.x > nearest.x ? 1 : -1;
      const lo = nodes[index - 1].point.x + 14;
      const hi = index < nodes.length - 1 ? nodes[index + 1].point.x - 14 : r.width - RIGHT;
      for (let shift = 2; shift <= 90; shift += 2) {
        const moved = [[0, away], [0, -away], [side, 0], [-side, 0]]
          .filter(([sx]) => !sx || shift <= 28)
          .map(([sx, sy]) => ({ x: node.point.x + sx * shift, y: node.point.y + sy * shift }))
          .find(point => point.y > TOP && point.y < r.height - BOTTOM && point.x > lo && point.x < hi && gapTo(point) >= clearance);
        if (moved) { node.point = moved; return; }
      }
    });
    const edges = nodes.map((node, index) => (index ? { a: nodes[index - 1].point, b: node.point, bend: node.bend * g.span } : item.edge));
    // The other options at each fork of the new life (the first fork's are Sam's own).
    // Options that were closed to him are left out: here only the open ones show.
    const siblings = nodes.map((node, index) => {
      if (!index) return [];
      const open = tree.children(life[index - 1].id).filter(child => child.id !== node.id && !child.closed).map(child => {
        const edge = { a: nodes[index - 1].point, b: g.at(child.age, child.y ?? child.ay), bend: child.bend * g.span };
        return { edge, tails: tree.children(child.id).filter(next => next.y !== null).map(next => ({ a: edge.b, b: g.at(next.age, next.y), bend: next.bend * g.span })) };
      });
      if (open.length || !isSurprise(node)) return open;
      // A surprise has no options, but as on Sam's route a gray line still leaves
      // the dot before it: the life as it would have gone on without the surprise.
      const before = life[index - 1];
      const fromY = before.y ?? before.ay;
      const y = Math.min(0.94, Math.max(0.06, fromY + (node.kind === 'lucky' ? 0.07 : -0.07)));
      const edge = { a: nodes[index - 1].point, b: g.at(Math.min(LIFE_STEPS[END].age + 0.3, node.age + 0.4), y), bend: 0 };
      const tails = aheadTree(`sam-${altKey}-${index}`, node.age + 0.4, y).children('r').map(next => ({ a: edge.b, b: g.at(next.age, next.ay), bend: next.bend * g.span }));
      return [{ edge, tails }];
    });
    const last = nodes.at(-1);
    const ahead = aheadEdges(aheadTree(`sam-ahead-${altKey}`, last.age, last.y ?? last.ay), last.point, g.at, g.span);
    // Labels for the new life, clear of what stays on the map.
    const visibleBoxes = () => [...labelEls.filter(element => Number(element.dataset.step) < alt.stepIndex), ...altEls.filter(element => {
      const other = ALTS.find(entry => entry.key === element.dataset.alt);
      return other.stepIndex <= alt.stepIndex && other.key !== altKey;
    })].map(boxOf);
    const r = rect();
    const soft = [[...siblings.flat().map(sibling => sibling.edge), ...ahead.first], siblings.flat().flatMap(sibling => sibling.tails)];
    // The new life's labels are placed in age order, a few each frame while it
    // starts to grow (or at once when it must show whole), so a pick stays one short task.
    const placers = () => {
      const boxes = visibleBoxes();
      return [
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes, soft,
          paths: [...g.edges.slice(1), ...edges], dots: [...g.points, ...nodes.map(node => node.point)] }),
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes,
          paths: [...g.edges.slice(1, alt.stepIndex), ...edges], dots: [...g.points.slice(0, alt.stepIndex), ...nodes.map(node => node.point)] }),
      ];
    };
    what = { alt, fork, nodes, edges, siblings, ahead, labels: [], placers, reached: 0, frame: null, labelFrame: null, drawn: false, done: false, silent };
    setMode('whatif');
    overlay.querySelectorAll('.life-label.is-what').forEach(element => element.remove());
    whatEls = [];
    // Sam's later labels and choices step aside; his path stays, light, behind the new one.
    labelEls.forEach(element => element.classList.toggle('is-shown', Number(element.dataset.step) < alt.stepIndex));
    altEls.forEach(element => {
      const other = ALTS.find(entry => entry.key === element.dataset.alt);
      element.classList.toggle('is-shown', other.stepIndex <= alt.stepIndex && other.key !== altKey);
    });
    shown = { labels: -1, alts: -1 };
    pulses([]);
    if (!silent) onPick({ alt, age: LIFE_STEPS[alt.stepIndex].age, nodes });
    if (reduced) { finishWhat(); what.silent = false; return what; }
    // The map behind it changes over the next two frames (the gray lines, then
    // his path), the new life starts to grow, and its labels follow, one a frame.
    const run = what;
    run.frame = requestAnimationFrame(() => {
      if (what !== run) return;
      redrawWhat('grays');
      run.frame = requestAnimationFrame(() => {
        run.frame = null;
        if (what !== run) return;
        redrawWhat('dark');
        run.drawn = true;
        walkWhat(1);
        run.labelFrame = requestAnimationFrame(() => placeSome(run));
      });
    });
    return what;
  }
  // The map behind a new life, at once (it must show whole before its frames came).
  function drawn(run) {
    if (run.drawn) return;
    run.drawn = true;
    redrawWhat();
  }
  // Labels for the new life up to node `upTo`, clear of what stays on the map.
  function placeLabels(run, upTo) {
    if (run.labels.length > upTo) return;
    run.place ??= run.placers();
    const [placer, loose] = run.place;
    let html = '';
    for (let index = run.labels.length; index <= upTo && index < run.edges.length; index += 1) {
      const text = run.nodes[index].label;
      const points = edgePoints(run.edges[index]);
      const spot = placer.chosen(text, points) ?? loose.chosen(text, points);
      if (spot) { placer.reserve(spot.box); loose.reserve(spot.box); }
      run.labels.push(spot);
      html += labelHTML(spot, 'is-dark is-what', ` data-what="${index}"`);
    }
    if (!html) return;
    overlay.insertAdjacentHTML('beforeend', html);
    whatEls = [...overlay.querySelectorAll('.life-label.is-what')];
  }
  // One label a frame until all are placed: long before the traveller reaches the first.
  function placeSome(run) {
    if (what !== run || run.labels.length >= run.edges.length) { run.labelFrame = null; return; }
    placeLabels(run, run.labels.length);
    run.labelFrame = requestAnimationFrame(() => placeSome(run));
  }

  /** The map behind a new life: `grays`, `dark` or both canvases. */
  function redrawWhat(part = 'both') {
    const g = geometry();
    const r = rect();
    const k = what.alt.stepIndex;
    baked = -1; aheadBaked = false;
    if (part !== 'dark') {
      sizeCanvas(graysCanvas, gx, { left: 0, top: 0, width: r.width, height: r.height });
      // Sam's gray choices up to the fork (the picked one becomes the new life's first line).
      for (let index = 1; index <= k; index += 1) {
        for (const item of g.altsOf[index]) {
          if (item.alt.key === what.alt.key) continue;
          stroke(gx, [item.edge], MIST, 2.3);
          stroke(gx, item.tails, MIST, 1.8, 0.55);
        }
      }
      for (let index = 1; index <= what.reached; index += 1) bakeWhatEdge(index, 'grays');
    }
    if (part === 'grays') return;
    sizeCanvas(darkCanvas, dx, { left: 0, top: 0, width: r.width, height: r.height });
    sizedFor = `${r.width}x${r.height}`;
    // His real path from the fork: light, behind.
    stroke(dx, g.edges.slice(k), SAGE, LIVED, 0.7);
    g.points.slice(k).forEach((point, offset) => {
      const kind = markerKind(LIFE_STEPS[k + offset].kind);
      if (kind) marker(dx, point, kind, 1, 0.5); else dot(dx, point, 3.8, SAGE, 0.7);
    });
    // His path up to the fork, as it was.
    stroke(dx, g.edges.slice(1, k), FOREST, LIVED);
    for (let index = 0; index < k; index += 1) {
      const step = LIFE_STEPS[index];
      if (markerKind(step.kind)) marker(dx, g.points[index], step.kind); else dot(dx, g.points[index], 3.8, FOREST);
    }
    for (let index = 1; index <= what.reached; index += 1) bakeWhatEdge(index, 'dark');
  }
  // The new life's edges are what.edges[0] (fork → the choice) to what.edges[n-1].
  function walkWhat(index) {
    if (!what) return;
    const run = what;
    if (index > run.edges.length) { growAhead(run); return; }
    const edge = run.edges[index - 1];
    const from = index === 1 ? LIFE_STEPS[what.fork].age : run.nodes[index - 2].age;
    const years = run.nodes[index - 1].age - from;
    const duration = Math.min(1500, 700 + years * 70);
    const started = performance.now();
    const tick = now => {
      if (what !== run) return;
      const p = Math.min(1, (now - started) / duration);
      drawWhatEdge(index, ease.inOut(p));
      if (p < 1) { run.frame = requestAnimationFrame(tick); return; }
      arrive(run, index);
      run.frame = setTimeout(() => { run.frame = null; walkWhat(index + 1); }, 320);
    };
    run.frame = requestAnimationFrame(tick);
  }
  function drawWhatEdge(index, p) {
    const edge = what.edges[index - 1];
    const node = what.nodes[index - 1];
    const sibs = what.siblings[index - 1];
    const from = index === 1 ? geometry().points[what.fork] : what.nodes[index - 2].point;
    const fromKind = index === 1 ? LIFE_STEPS[what.fork].kind : what.nodes[index - 2].kind;
    useLive(boundsOf([...edgeBounds(edge), ...sibs.flatMap(sibling => [...edgeBounds(sibling.edge), ...(sibling.tails ?? []).flatMap(edgeBounds)])], 16));
    for (const sibling of sibs) {
      stroke(lx, [sibling.edge], MIST, 2.3, 1, p);
      stroke(lx, sibling.tails, MIST, 1.8, 0.55, Math.max(0, p * 2 - 1));
    }
    stroke(lx, [edge], FOREST, LIVED, 1, p);
    if (markerKind(fromKind)) marker(lx, from, fromKind); else dot(lx, from, 3.8, FOREST);
    const head = pointOn(edge, p);
    traveller(lx, head, p < 1);
    if (markerKind(node.kind) && p >= 1) marker(lx, node.point, node.kind);
  }
  // Edge `index` (1-based) leads to node `index - 1`; arriving bakes it, shows its label and tells the narration.
  function arrive(run, index) {
    drawn(run);
    placeLabels(run, index - 1);
    run.reached = index;
    bakeWhatEdge(index);
    whatEls.find(element => Number(element.dataset.what) === index - 1)?.classList.add('is-shown');
    if (!run.silent) onStep(run.nodes[index - 1], index - 1);
  }
  function bakeWhatEdge(index, part = 'both') {
    const node = what.nodes[index - 1];
    if (part !== 'dark') {
      for (const sibling of what.siblings[index - 1]) {
        stroke(gx, [sibling.edge], MIST, 2.3);
        stroke(gx, sibling.tails, MIST, 1.8, 0.55);
      }
    }
    if (part === 'grays') return;
    stroke(dx, [what.edges[index - 1]], FOREST, LIVED);
    const from = index === 1 ? geometry().points[what.fork] : what.nodes[index - 2].point;
    const fromKind = index === 1 ? LIFE_STEPS[what.fork].kind : what.nodes[index - 2].kind;
    if (markerKind(fromKind)) marker(dx, from, fromKind); else dot(dx, from, 3.8, FOREST);
    if (markerKind(node.kind)) marker(dx, node.point, node.kind); else dot(dx, node.point, 3.8, FOREST);
  }
  function growAhead(run) {
    const last = run.nodes.at(-1).point;
    const started = performance.now();
    const tick = now => {
      if (what !== run) return;
      const p = Math.min(1, (now - started) / 600);
      useLive(boundsOf([...run.ahead.first.flatMap(edgeBounds), last], 16));
      stroke(lx, run.ahead.first, SAGE, 3, 0.9, p);
      stroke(lx, run.ahead.second, SAGE, 2.2, 0.5, Math.max(0, p * 2 - 1));
      traveller(lx, last, false);
      if (p < 1) { run.frame = requestAnimationFrame(tick); return; }
      run.frame = null;
      endWhat(run);
    };
    run.frame = requestAnimationFrame(tick);
  }
  // The traveller rests on the new life's last dot; a surprise there keeps its mark on top.
  function restWhat(run) {
    const last = run.nodes.at(-1);
    useLive(boundsOf([last.point], 16));
    traveller(lx, last.point, false);
    if (markerKind(last.kind)) marker(lx, last.point, last.kind);
  }
  function endWhat(run) {
    stroke(gx, run.ahead.first, SAGE, 3, 0.9);
    stroke(gx, run.ahead.second, SAGE, 2.2, 0.5);
    restWhat(run);
    run.done = true;
    if (!run.silent) onDone(run);
  }
  /** The new life at once: reduced motion, or a tap while it grows. */
  function finishWhat() {
    if (!what || what.done) return;
    const run = what;
    if (run.frame !== null) { cancelAnimationFrame(run.frame); clearTimeout(run.frame); run.frame = null; }
    if (run.labelFrame !== null) { cancelAnimationFrame(run.labelFrame); run.labelFrame = null; }
    drawn(run);
    placeLabels(run, run.edges.length - 1);
    for (let index = run.reached + 1; index <= run.edges.length; index += 1) arrive(run, index);
    endWhat(run);
  }
  function stopWhat() {
    if (!what) return;
    if (what.frame !== null) { cancelAnimationFrame(what.frame); clearTimeout(what.frame); }
    if (what.labelFrame !== null) cancelAnimationFrame(what.labelFrame);
    what = null;
    whatEls.forEach(element => element.remove());
    whatEls = [];
  }

  /** Back to Sam's life exactly as the story left it. */
  function restore(nextMode = 'ended') {
    stopWhat();
    clearBase();
    frame = { index: END + 1, walk: 1, appear: 1, bloom: 1, sprout: 1, tails: 1, label: true, pulses: [], resting: true, landing: null };
    shown = { labels: -1, alts: -1 };
    drawStory();
    setMode(nextMode);
  }

  function redraw() {
    if (failed || !visible) return;
    if (what) {
      redrawWhat();
      what.drawn = true;
      if (!what.done) drawWhatEdge(what.reached + 1, 0);
      else { stroke(gx, what.ahead.first, SAGE, 3, 0.9); stroke(gx, what.ahead.second, SAGE, 2.2, 0.5); restWhat(what); }
      return;
    }
    drawStory();
  }

  return {
    failed,
    get mode() { return mode; },
    get what() { return what; },
    /** The story's sink: one moment of Sam's life. */
    setFrame(next) {
      frame = next;
      if (failed || mode === 'whatif') return;
      geometry();
      drawStory();
    },
    setMode(next) {
      if (next !== 'whatif' && what) restore(next);
      else setMode(next);
    },
    pick,
    finishWhat,
    restore,
    /** The stage changed size: everything is placed again. */
    resize() {
      const placed = geo?.key;
      size = null;
      const r = rect();
      // A second call for the same size (the observer after a settle) has nothing to redo.
      if (failed || (placed === `${r.width}x${r.height}` && sizedFor === placed)) return;
      geo = null; liveBox = '';
      geometry();
      if (what) {
        finishWhat();
        const key = what.alt.key;
        stopWhat();
        pick(key, { reduced: true, silent: true });
        return;
      }
      clearBase();
      drawStory();
      setMode(mode);
    },
    setVisible(value) { visible = value; },
    points: () => geometry().points,
    endPoint: () => (what ? what.nodes.at(-1).point : geometry().points[END]),
    /** What the map's chips must stay clear of: Sam's labels (in "Choices add up" the gray choices' labels step back). */
    occupied: () => [...labelEls, ...(mode === 'adds' ? [] : altEls)].filter(element => element.classList.contains('is-shown')).map(boxOf),
    layers: { axis, grays: graysCanvas, dark: darkCanvas, live: liveCanvas, overlay },
    card,
    altButtons: () => altEls,
    focusFirstPick() { altEls.filter(element => !element.disabled && element.classList.contains('is-shown')).sort((a, b) => ALTS.findIndex(x => x.key === a.dataset.alt) - ALTS.findIndex(x => x.key === b.dataset.alt))[0]?.focus({ preventScroll: true }); },
    onCard(handler) { card.addEventListener('click', event => { const action = event.target.closest('[data-life]')?.dataset.life; if (action) handler(action); }); },
    onAlt(handler) { overlay.addEventListener('click', event => { const button = event.target.closest('.life-alt'); if (button && !button.disabled) handler(button.dataset.alt); }); },
    geometry,
  };
}
