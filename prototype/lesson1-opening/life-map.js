// One life from the lives store, drawn in the Explore chapter's language
// (design 001 v13, round 4). The drawing and label code are study copies of
// src/lessons/choices/journey-explore.js: the same curves (they leave and reach
// every dot level, so each dot sits where lines split), the same strokes, dots,
// star and diamond, the same label placement and end card. New here:
// - the route is a written life (lives/engine.js `writtenLife`) on an age axis
//   from 0 to 45, with gray lines leaving every dot: the alternatives the reader
//   may pick, or other things that could have happened there;
// - it is played by the story's clock (life.js), one step at a time;
// - after the story, a choice can be changed (a gray label, or a ringed fork's
//   popover): the real path from that fork turns light and stays behind, and a
//   new life grows from the fork with the engine's `grow`, from a random seed.
// Drawing is split so a frame stays cheap: the gray lines and the routes are
// drawn once per step onto two stage-sized canvases, every dot, star and
// diamond onto a third above them (so a mark always sits on top of every line,
// cut clean by a ring of the map's colour), and only the step in motion is
// redrawn each frame, on a small canvas the size of that step. Labels, the
// choices to pick, the forks, their popover and the end card are HTML over the
// canvases.
import { canvasBitmap } from '../../src/engine/path-presentation.js';
import { ease, prefersReducedMotion } from '../../src/lessons/choices/journey-motion.js';
import { t } from '../../src/i18n/runtime.js';
import { gapFor, grow, hash01, heights, newSeed } from './lives/engine.js';
import { BORN_Y, END, finalFrame } from './life.js';

const FOREST = '#285442';
const SAGE = '#8daa91';
const MIST = '#c5cec8';
const CLAY = '#9a5f3e';
const SUN = '#e0a93b';
const HALO = '#f2f5f0'; // the map's background (paper-deep)
const rgbOf = hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16));
/** `a` laid over the map's background at `amount`: a faded colour that is still fully opaque. */
const mix = (a, amount, b = HALO) => `#${rgbOf(a).map((value, at) => Math.round(value * amount + rgbOf(b)[at] * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
const TAIL = mix(MIST, 0.55); // the gray lives carrying on past a gray dot
const AHEAD = mix(SAGE, 0.9); // the paths still ahead
const LIGHT = mix(SAGE, 0.7); // a real path behind a new life
const LIGHT_SUN = mix(SUN, 0.5);
const LIGHT_CLAY = mix(CLAY, 0.5);
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
const GRAY = 2.3;
const THIN = 1.8;
const DOT = 3.8;
const RING = 2; // the ring of map colour around every mark
const BAR = 100; // on a narrow stage the end card is a bar across the top: this much stays clear for it

// ——— Where the gray lines go (a pure layout in ages and heights) ———
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const isSurprise = kind => kind === 'lucky' || kind === 'setback';

/** The gray lives a gray dot carries on into: one to three short lines, mostly two. */
function tailsFor(key, age, y) {
  const n = hash01(`${key}:n`);
  const count = n < 0.2 ? 1 : n < 0.85 ? 2 : 3;
  const spreads = count === 1 ? [(hash01(`${key}:s`) - 0.5) * 0.08] : count === 2 ? [-0.045, 0.05] : [-0.075, 0, 0.07];
  return spreads.map((spread, j) => ({
    age: age + gapFor(age) * (0.8 + 0.5 * hash01(`${key}:g${j}`)),
    y: clamp(y + spread + (hash01(`${key}:y${j}`) - 0.5) * 0.02, 0.03, 0.97),
    bend: (hash01(`${key}:b${j}`) - 0.5) * 0.03,
  }));
}

/** The paths still ahead of a life's last dot: always a choice of two or three. */
function aheadFor(key, age, y) {
  const count = hash01(`${key}:count`) < 0.5 ? 2 : 3;
  return Array.from({ length: count }, (_, j) => ({
    age: age + 8.5 * 0.7 * (0.75 + 0.6 * hash01(`${key}:age${j}`)),
    y: clamp(y - 0.15 + 0.26 * (j / (count - 1)) + (hash01(`${key}:y${j}`) - 0.5) * 0.03, 0.04, 0.96),
    bend: (hash01(`${key}:b${j}`) - 0.5) * 0.03,
  }));
}

/**
 * The gray lines leaving the dot before step `k`: the step's alternatives
 * (which the reader may pick), or else one or two other things that could have
 * happened there, or, at a lucky break, a setback or an event that moved the
 * path, one line for the life going on without it. A level path spreads them
 * above and below; a path about to climb or fall puts them on the other side,
 * so they never cross the route's next stretch.
 */
function grayItems(steps, k, scope) {
  const step = steps[k];
  const prev = steps[k - 1];
  const next = steps[k + 1];
  const base = `${scope}:${k}`;
  const moved = isSurprise(step.kind) || Boolean(step.move);
  const pickable = !step.grown && step.alts.length > 0;
  let list = pickable ? step.alts : moved ? [] : step.others;
  if (!list.length) list = [{ id: null, without: true }];
  const dn = (next ? next.y : step.y) - step.y;
  const level = Math.abs(dn) < 0.04;
  const side0 = level ? (hash01(`${base}:side`) < 0.5 ? -1 : 1) : (dn < 0 ? 1 : -1);
  return list.map((option, i) => {
    const key = `${k}-${option.id ?? 'without'}`;
    let y;
    if (option.without) {
      const dy = step.y - prev.y;
      y = prev.y + (Math.abs(dy) > 0.01 ? -Math.sign(dy) : side0) * 0.06;
    } else {
      const side = level && i % 2 ? -side0 : side0;
      const rank = level ? Math.floor(i / 2) : i;
      const offset = 0.1 + 0.085 * rank + (hash01(`${base}:${option.id}:dy`) - 0.5) * 0.03;
      y = step.y + side * offset;
      if (y < 0.05 || y > 0.95) y = step.y - side * offset;
    }
    y = clamp(y, 0.04, 0.96);
    const age = clamp(step.age + (hash01(`${base}:${option.id}:age`) - 0.5) * 0.9, prev.age + 0.7, step.age + 0.5);
    return {
      key, stepIndex: k, id: option.id ?? null, label: option.label ?? null, whatIf: option.whatIf ?? null, kind: option.kind ?? null,
      pickable: pickable && !option.without, age, y,
      bend: (hash01(`${base}:${option.id}:bend`) - 0.5) * 0.03,
      tails: tailsFor(`${scope}:${key}`, age, y),
    };
  });
}

// ——— Curves (the explorer's: level out of each dot, level into the next) ———
function controls(edge) {
  const dx = edge.b.x - edge.a.x;
  return [edge.a, { x: edge.a.x + dx * 0.5, y: edge.a.y + edge.bend }, { x: edge.b.x - dx * 0.5, y: edge.b.y }, edge.b];
}
function pointOn(edge, at) {
  const [p0, p1, p2, p3] = controls(edge);
  const u = 1 - at;
  return {
    x: u * u * u * p0.x + 3 * u * u * at * p1.x + 3 * u * at * at * p2.x + at * at * at * p3.x,
    y: u * u * u * p0.y + 3 * u * u * at * p1.y + 3 * u * at * at * p2.y + at * at * at * p3.y,
  };
}
const edgePoints = (edge, samples = 20) => Array.from({ length: samples + 1 }, (_, i) => pointOn(edge, i / samples));
/** The curve from its start to `at`, as one Bézier (de Casteljau), so a growing line is one stroke. */
function trace(context, edge, at = 1) {
  const [p0, p1, p2, p3] = controls(edge);
  context.moveTo(p0.x, p0.y);
  if (at >= 1) { context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y); return; }
  if (at <= 0) return;
  const lerp = (a, b) => ({ x: a.x + (b.x - a.x) * at, y: a.y + (b.y - a.y) * at });
  const q0 = lerp(p0, p1); const q1 = lerp(p1, p2); const q2 = lerp(p2, p3);
  const r0 = lerp(q0, q1); const r1 = lerp(q1, q2);
  context.bezierCurveTo(q0.x, q0.y, r0.x, r0.y, lerp(r0, r1).x, lerp(r0, r1).y);
}
// Gray and light green lines that run on past the stage fade out at its right edge.
let fadeFrom = Infinity;
const FADING = new Set([MIST, TAIL, SAGE, AHEAD]);
function strokeStyle(context, color) {
  if (!FADING.has(color) || !Number.isFinite(fadeFrom)) return color;
  const rgb = rgbOf(color);
  const gradient = context.createLinearGradient(fadeFrom, 0, fadeFrom + 54, 0);
  gradient.addColorStop(0, `rgb(${rgb})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  return gradient;
}
function stroke(context, edges, color, width, at = 1) {
  if (!edges.length || at <= 0) return;
  context.save();
  context.strokeStyle = strokeStyle(context, color);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  for (const edge of edges) trace(context, edge, at);
  context.stroke();
  context.restore();
}
function disc(context, point, radius, color) {
  if (radius <= 0) return;
  context.fillStyle = color;
  context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill();
}
// A small flat marker where a surprise happened: a star for a lucky break, a diamond for a setback.
function shape(context, point, kind, scale) {
  const spikes = kind === 'lucky' ? 5 : 2;
  const outer = (kind === 'lucky' ? 10 : 8.5) * scale;
  const inner = (kind === 'lucky' ? 4.4 : 8.5) * scale;
  context.beginPath();
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (index * Math.PI) / spikes;
    context.lineTo(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius);
  }
  context.closePath();
}
const LAYER = { gray: 0, tail: 0, ahead: 1, light: 2, dark: 3 };
/**
 * One mark, over every line: a dot, star or diamond, fully opaque (a faded mark
 * is a pre-mixed colour, never see-through), inside a ring of the map's colour
 * that cuts any line passing behind it. A dot's own lines (those that leave or
 * reach it) are drawn again inside its ring, so they still meet it whole.
 * `strokes` are the lines drawn so far; `scale` grows a mark as it blooms.
 */
function drawMark(context, mark, strokes, scale = 1) {
  if (scale <= 0) return;
  const { point, kind, light } = mark;
  context.save();
  if (isSurprise(kind)) {
    shape(context, point, kind, scale);
    context.strokeStyle = HALO;
    context.lineWidth = RING * 2;
    context.lineJoin = 'round';
    context.stroke();
    context.fillStyle = kind === 'lucky' ? (light ? LIGHT_SUN : SUN) : (light ? LIGHT_CLAY : CLAY);
    context.fill();
    context.restore();
    return;
  }
  const radius = DOT * scale;
  disc(context, point, radius + RING, HALO);
  const own = strokes.filter(item => near(item.edge.a, point) || near(item.edge.b, point)).sort((a, b) => LAYER[a.layer] - LAYER[b.layer]);
  if (own.length) {
    context.save();
    context.beginPath(); context.arc(point.x, point.y, radius + RING + 0.5, 0, Math.PI * 2); context.clip();
    for (const item of own) stroke(context, [item.edge], item.color, item.width, item.at ?? 1);
    context.restore();
  }
  disc(context, point, radius, light ? LIGHT : FOREST);
  context.restore();
}
const near = (a, b) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
function boundsOf(points, pad) {
  const xs = points.map(point => point.x); const ys = points.map(point => point.y);
  return { left: Math.min(...xs) - pad, top: Math.min(...ys) - pad, right: Math.max(...xs) + pad, bottom: Math.max(...ys) + pad };
}
const edgeBounds = edge => controls(edge);
const inside = (point, box, pad = 12) => point.x > box.left - pad && point.x < box.right + pad && point.y > box.top - pad && point.y < box.bottom + pad;

// ——— Labels (the explorer's placement) ———
// Every spot the explorer tries for a chosen label, cheapest first: the first
// clear one is the one its search would pick. Here a label names the dot its
// line arrives at (the step at that age), so the spots start nearer the dot.
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
 * label never sits on a route or a dot). The route's labels also try to keep
 * off the gray and light green lines (`soft`) first, the nearer ones before the
 * fainter tails, and only sit over them where nothing else is clear. A label
 * that finds no clear room is left out, never cut: every label is whole.
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
  const nearSoft = soft.map(edges => sampleGrid(edges));
  const taken = [...boxes];
  const outside = box => box.left < 2 || box.right > width - right || box.top < 2 || box.bottom > height - 26;
  const clash = box => taken.some(o => box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top);
  const distance = (box, p) => Math.hypot(Math.max(box.left - p.x, 0, p.x - box.right), Math.max(box.top - p.y, 0, p.y - box.bottom));
  // A label must read as its own dot's: no other dot may sit nearer to it.
  const strayed = (box, own) => dots.some(p => p !== own && distance(box, p) + 2 < distance(box, own));
  return {
    onPath,
    reserve(box) { taken.push(box); },
    /** A route label along its edge (`points`, 21 of them, ending at its dot), or null when nowhere is clear. */
    chosen(text, points, own = points.at(-1)) {
      const textWidth = measure(text, `650 ${CHOSEN_SIZE}px ${FONT}`);
      const home = dots.find(p => near(p, own)) ?? own;
      let best = null;
      for (const spot of SPOTS) {
        if (best && spot.cost >= best.cost) break;
        const anchor = spot.dot ? own : points[spot.index];
        const baseline = spot.dot ? own.y + spot.dy : spot.side < 0 ? anchor.y - spot.gap - 4 : anchor.y + spot.gap + CHOSEN_SIZE;
        const left = spot.dot ? (spot.align === 'left' ? own.x + spot.dx : own.x + spot.dx - textWidth)
          : spot.align === 'center' ? anchor.x - textWidth / 2 : spot.align === 'left' ? anchor.x - 6 : anchor.x - textWidth + 6;
        const box = { left: left - 4, right: left + textWidth + 4, top: baseline - CHOSEN_SIZE, bottom: baseline + 4 };
        if (outside(box) || clash(box) || onPath(box) || strayed(box, home)) continue;
        const cost = spot.cost + (nearSoft[0](box, 3) ? OVER_GRAY : 0) + (nearSoft[1](box, 3) ? OVER_TAIL : 0);
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
    /** A gray choice's label, near the middle of its line, or null where none is clear (as in the explorer). */
    gray(text, points) {
      const textWidth = measure(text, `500 ${GRAY_SIZE}px ${FONT}`);
      for (const index of [12, 11, 13, 10, 14, 9, 15, 8, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 7]) {
        if (!points[index]) continue;
        for (const dy of [-8, 18, -16, 26]) {
          const baseline = points[index].y + dy;
          // The button's own box: 6 px padding and a 1.5 px border each side.
          const box = { left: points[index].x - textWidth / 2 - 8, right: points[index].x + textWidth / 2 + 8, top: baseline - GRAY_SIZE - 2, bottom: baseline + 7 };
          if (outside(box) || clash(box) || onPath(box)) continue;
          taken.push(box);
          return { text, size: GRAY_SIZE, center: points[index].x, baseline, box };
        }
      }
      return null;
    },
  };
}

const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function createLifeMap(stack, { origin, before = null, onPick = () => {}, onStep = () => {}, onDone = () => {}, onLeave = () => {} } = {}) {
  const make = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  const axis = make('div', 'life-axis');
  const graysCanvas = make('canvas', 'life-grays');
  const darkCanvas = make('canvas', 'life-dark');
  const marksCanvas = make('canvas', 'life-marks');
  const liveCanvas = make('canvas', 'life-live');
  const overlay = document.createElement('div');
  overlay.className = 'life-overlay';
  const card = document.createElement('div');
  card.className = 'explore-end life-end';
  card.hidden = true;
  const pop = document.createElement('div');
  pop.className = 'life-pop';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.dataset.localKeys = '';
  for (const element of [axis, graysCanvas, darkCanvas, marksCanvas, liveCanvas, overlay]) stack.insertBefore(element, before);
  const contexts = [graysCanvas, darkCanvas, marksCanvas, liveCanvas].map(canvas => { try { return canvas.getContext('2d'); } catch { return null; } });
  const [gx, dx, mx, lx] = contexts;
  const failed = contexts.some(context => !context);
  const boxOf = element => {
    const box = element.getBoundingClientRect();
    const home = stack.getBoundingClientRect();
    return { left: box.left - home.left, top: box.top - home.top, right: box.right - home.left, bottom: box.bottom - home.top };
  };
  const measure = (text, font) => { dx.save(); dx.font = font; const width = dx.measureText(text).width; dx.restore(); return width; };

  let model = null; // the life on the map and its gray lines (setLife)
  let size = null;
  let geo = null;
  let mode = 'story';
  let frame = null;
  let baked = -1; // steps drawn whole onto the gray, dark and marks canvases
  let aheadBaked = false;
  let lastPos = 0;
  let landFrom = null;
  let what = null;
  let liveBox = '';
  let shown = { labels: -1, alts: -1 };
  let visible = true;
  let strokes = []; // every line on the gray and dark canvases, for the marks above them
  let marks = []; // every mark on the marks canvas
  let openFork = null;

  const rect = () => {
    if (!size) size = { width: stack.clientWidth, height: stack.clientHeight };
    return size;
  };

  /** The life to draw (`writtenLife`) and the store to grow new lives from. */
  function setLife(life, store) {
    stopWhat();
    closePop();
    const items = life.steps.flatMap((_, k) => (k ? grayItems(life.steps, k, life.id) : []));
    model = {
      life, store, items,
      picks: items.filter(item => item.pickable).sort((a, b) => a.age - b.age),
      forks: [...new Set(items.filter(item => item.pickable).map(item => item.stepIndex))].sort((a, b) => a - b),
      ahead: aheadFor(`${life.id}:ahead`, life.steps.at(-1).age, life.steps.at(-1).y),
    };
    geo = null;
    sizedFor = '';
    baked = -1; aheadBaked = false; lastPos = 0; landFrom = null;
    card.innerHTML = `<h2 tabindex="-1">${escapeHTML(t('opening.end.heading'))}</h2>
      <p>${escapeHTML(t('opening.end.gray', { name: life.name }))}</p>
      <div class="end-buttons"><button type="button" class="solid-pill" data-life="choose">${escapeHTML(t('opening.end.change', { pronoun: life.pronoun }))}</button>
      <button type="button" class="pill-button" data-life="another">${escapeHTML(t('opening.end.another'))}</button></div>`;
  }

  // ——— Where everything sits at this stage size ———
  function geometry() {
    const r = rect();
    const key = `${model.life.id}|${r.width}x${r.height}`;
    if (geo?.key === key) return geo;
    const o = origin();
    // A narrow stage keeps a band clear at the top for the end card's bar: the
    // route stays below it (its highest point is about 0.45 of the span above
    // Born) and no label goes in it.
    const bar = r.width < 800 ? BAR : 0;
    const span = Math.min(r.height - TOP - BOTTOM, bar ? (o.y - bar - 8) / 0.45 : Infinity);
    fadeFrom = r.width - 64;
    // Even years: a later life has as many steps as its childhood, so it gets the same room.
    const X = age => o.x + (age / MAX_AGE) * (r.width - o.x - RIGHT);
    const Y = y => o.y + (y - BORN_Y) * span;
    const at = (age, y) => ({ x: X(age), y: Y(y) });
    const steps = model.life.steps;
    const points = steps.map(step => at(step.age, step.y));
    const edges = points.map((point, index) => (index ? { a: points[index - 1], b: point, bend: 0 } : null));
    const alts = model.items.map(item => {
      const node = at(item.age, item.y);
      return {
        item, node,
        edge: { a: points[item.stepIndex - 1], b: node, bend: item.bend * span },
        tails: item.tails.map(tail => ({ a: node, b: at(tail.age, tail.y), bend: tail.bend * span })),
      };
    });
    const altsOf = steps.map((_, index) => alts.filter(entry => entry.item.stepIndex === index));
    const ahead = model.ahead.map(item => ({ a: points[END], b: at(item.age, item.y), bend: item.bend * span }));

    // Labels: the route's in age order (an earlier label never moves when a
    // later one arrives), then the gray choices, which give way to them.
    const band = bar ? [{ left: 0, right: r.width, top: 0, bottom: bar }] : [];
    const placer = createPlacer({ width: r.width, height: r.height, measure, paths: edges.slice(1), dots: points, right: 46, boxes: band,
      soft: [[...alts.map(entry => entry.edge), ...ahead], alts.flatMap(entry => entry.tails)] });
    const labels = steps.map((step, index) => placer.chosen(step.label, index ? edgePoints(edges[index]) : Array(21).fill(points[0]), points[index]));
    // The tail nearest its own height carries a gray label on if the line itself is crowded.
    const altLine = entry => {
      const tail = [...entry.tails].sort((a, b) => Math.abs(a.b.y - entry.node.y) - Math.abs(b.b.y - entry.node.y))[0];
      return [...edgePoints(entry.edge), ...(tail ? edgePoints(tail).slice(1) : [])];
    };
    const grayLabels = alts.map(entry => (entry.item.pickable ? placer.gray(entry.item.label, altLine(entry)) : null));
    geo = { key, span, X, Y, at, points, edges, alts, altsOf, ahead, labels, grayLabels, placer, band };
    buildOverlay();
    applyMode();
    return geo;
  }

  // ——— HTML over the canvases: labels, the choices to pick, forks, pulses, the end card ———
  let labelEls = [];
  let altEls = [];
  let forkEls = [];
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
    const steps = model.life.steps;
    overlay.innerHTML = `${g.labels.map((item, index) => labelHTML(item, 'is-dark', ` data-step="${index}"`)).join('')}
      ${g.alts.map((entry, index) => {
        const spot = g.grayLabels[index];
        if (!spot) return '';
        const step = steps[entry.item.stepIndex];
        return `<button type="button" class="life-alt" data-alt="${escapeHTML(entry.item.key)}" tabindex="-1" style="left:${spot.center.toFixed(1)}px;top:${spot.baseline.toFixed(1)}px"
          aria-label="${escapeHTML(t('opening.alt.label', { choice: spot.text, instead: step.label, age: step.age }))}"><span>${escapeHTML(spot.text)}</span></button>`;
      }).join('')}
      ${model.forks.map(index => `<button type="button" class="life-fork" data-step="${index}" data-local-keys tabindex="-1" aria-haspopup="dialog" aria-expanded="false"
        aria-label="${escapeHTML(t('opening.fork.label', { age: steps[index].age, choice: steps[index].label }))}" style="left:${g.points[index].x.toFixed(1)}px;top:${g.points[index].y.toFixed(1)}px"></button>`).join('')}
      <i class="life-pulse"></i><i class="life-pulse"></i>`;
    overlay.prepend(card);
    overlay.append(pop);
    labelEls = [...overlay.querySelectorAll('.life-label.is-dark')];
    altEls = [...overlay.querySelectorAll('.life-alt')];
    forkEls = [...overlay.querySelectorAll('.life-fork')];
    pulseEls = [...overlay.querySelectorAll('.life-pulse')];
    whatEls = [];
    shown = { labels: -1, alts: -1 };
    axis.innerHTML = `${[5, 10, 15, 20, 25, 30, 35, 40, 45].map(age => {
      const x = g.X(age);
      if (x < 64 || x > rect().width - 12) return '';
      return `<span class="life-tick" style="left:${x.toFixed(1)}px"><b>${age}</b></span>`;
    }).join('')}<span class="life-axis-name">${escapeHTML(t('explore.age'))}</span>`;
  }
  const itemFor = key => model.items.find(item => item.key === key);

  function showLabels(count, altCount) {
    if (count !== shown.labels) {
      shown.labels = count;
      labelEls.forEach(element => element.classList.toggle('is-shown', Number(element.dataset.step) < count));
    }
    if (altCount !== shown.alts) {
      shown.alts = altCount;
      altEls.forEach(element => element.classList.toggle('is-shown', itemFor(element.dataset.alt).stepIndex < altCount));
    }
  }

  // ——— Canvases ———
  function sizeCanvas(canvas, context, box) {
    const bitmap = canvasBitmap(box, devicePixelRatio || 1);
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) { canvas.width = bitmap.width; canvas.height = bitmap.height; }
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, -box.left * bitmap.scale, -box.top * bitmap.scale);
    context.clearRect(box.left, box.top, box.width, box.height);
  }
  const whole = () => ({ left: 0, top: 0, width: rect().width, height: rect().height });
  let sizedFor = ''; // the stage size the base canvases were last drawn at
  function clearBase() {
    const r = rect();
    sizedFor = `${model.life.id}|${r.width}x${r.height}`;
    sizeCanvas(graysCanvas, gx, whole());
    sizeCanvas(darkCanvas, dx, whole());
    sizeCanvas(marksCanvas, mx, whole());
    baked = -1; aheadBaked = false;
    strokes = []; marks = [];
  }
  /** Draw lines onto a base canvas and remember them for the marks above. */
  function lay(layer, edges, color, width) {
    stroke(layer === 'dark' || layer === 'light' ? dx : gx, edges, color, width);
    for (const edge of edges) strokes.push({ edge, color, width, layer });
  }
  function paintMarks() {
    sizeCanvas(marksCanvas, mx, whole());
    for (const mark of marks) drawMark(mx, mark, strokes);
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
    return { left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height };
  }
  /** The marks under the live canvas, drawn again over the lines in motion (`moving`: those lines and how far they've grown). */
  function marksOver(box, moving) {
    const all = [...strokes, ...moving];
    for (const mark of marks) if (inside(mark.point, box)) drawMark(lx, mark, all);
  }
  const markFor = (point, kind, light = false) => ({ point, kind, light });

  // One step of the route, whole: the gray lines leaving the dot before it, then the line to its dot.
  function bakeStep(index) {
    const g = geometry();
    const steps = model.life.steps;
    if (index > 0) {
      for (const entry of g.altsOf[index]) {
        lay('gray', [entry.edge], MIST, GRAY);
        lay('tail', entry.tails, TAIL, THIN);
      }
      lay('dark', [g.edges[index]], FOREST, LIVED);
    }
    marks.push(markFor(g.points[index], steps[index].kind));
  }
  function bakeAhead() {
    const g = geometry();
    lay('ahead', g.ahead, AHEAD, 3);
    aheadBaked = true;
  }
  function bakeTo(count, ahead) {
    const r = rect();
    // The first drawing at a stage size sizes the canvases first.
    if (sizedFor !== `${model.life.id}|${r.width}x${r.height}` || count < baked + 1 || (aheadBaked && !ahead)) clearBase();
    const before = baked;
    for (let index = baked + 1; index < count; index += 1) bakeStep(index);
    baked = Math.max(baked, count - 1);
    const grew = ahead && !aheadBaked;
    if (grew) bakeAhead();
    if (baked !== before || grew || !marks.length) paintMarks();
  }

  // The traveller: moving, a dot with a soft halo; resting, a slightly larger dot.
  function traveller(context, point, moving, scale = 1) {
    if (moving) disc(context, point, 13 * scale, 'rgba(40,84,66,.16)');
    disc(context, point, (moving ? 7 : 7.5) * scale, FOREST);
  }

  // ——— The story, one frame at a time ———
  function drawStory() {
    const g = geometry();
    const f = frame;
    if (!f) return;
    const steps = model.life.steps;
    const index = Math.min(f.index, END + 1);
    if (f.landing !== null) {
      bakeTo(END + 1, true);
      showLabels(END + 1, END + 1);
      if (landFrom === null) landFrom = lastPos;
      const pos = landFrom + (END - landFrom) * f.landing;
      const at = positionAt(pos);
      const box = useLive(boundsOf([at, g.points[END]], 16));
      marksOver(box, []);
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
        const box = useLive(boundsOf([...g.ahead.flatMap(edgeBounds), end], 16));
        stroke(lx, g.ahead, AHEAD, 3, f.sprout);
        marksOver(box, g.ahead.map(edge => ({ edge, color: AHEAD, width: 3, layer: 'ahead', at: f.sprout })));
      } else {
        const box = useLive(boundsOf([end], 16));
        marksOver(box, []);
      }
      traveller(lx, end, false);
      lastPos = END;
      return;
    }
    const step = steps[index];
    const here = g.points[index];
    if (index === 0) {
      useLive(boundsOf([here], 16));
      drawMark(lx, markFor(here, step.kind), strokes, f.bloom);
      traveller(lx, here, false, f.appear);
      lastPos = 0;
      return;
    }
    const edge = g.edges[index];
    const items = g.altsOf[index];
    const box = useLive(boundsOf([...edgeBounds(edge), ...items.flatMap(entry => [...edgeBounds(entry.edge), ...entry.tails.flatMap(edgeBounds)])], 16));
    // The gray lines grow from the dot it leaves, as it leaves it.
    const moving = [];
    for (const entry of items) {
      stroke(lx, [entry.edge], MIST, GRAY, f.sprout);
      stroke(lx, entry.tails, TAIL, THIN, f.tails);
      moving.push({ edge: entry.edge, color: MIST, width: GRAY, layer: 'gray', at: f.sprout });
    }
    stroke(lx, [edge], FOREST, LIVED, f.walk);
    moving.push({ edge, color: FOREST, width: LIVED, layer: 'dark', at: f.walk });
    marksOver(box, moving);
    // The new dot blooms as the traveller arrives; a star or diamond over the traveller, so it shows while he stands there.
    if (!isSurprise(step.kind)) drawMark(lx, markFor(here, step.kind), [...strokes, ...moving], f.bloom);
    traveller(lx, pointOn(edge, f.walk), f.walk < 1);
    if (isSurprise(step.kind)) drawMark(lx, markFor(here, step.kind), strokes, f.bloom);
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
    altEls.forEach(element => { element.disabled = !picking; });
    forkEls.forEach(element => { element.tabIndex = mode === 'choosing' ? 0 : -1; element.disabled = mode !== 'choosing'; });
    if (mode !== 'choosing') closePop();
  }
  function setMode(next) {
    mode = next;
    applyMode();
    if (next === 'ended') showCard(); else { card.hidden = true; altEls.forEach(element => element.classList.remove('is-under-card')); }
  }

  // ——— A fork's popover: its other choices as chips ———
  function openPop(stepIndex) {
    const g = geometry();
    const step = model.life.steps[stepIndex];
    const fork = forkEls.find(element => Number(element.dataset.step) === stepIndex);
    if (!fork) return;
    closePop();
    openFork = fork;
    fork.setAttribute('aria-expanded', 'true');
    const title = t('opening.fork.title', { age: step.age, choice: step.label });
    pop.setAttribute('aria-label', title);
    pop.innerHTML = `<p class="life-pop-title">${escapeHTML(title)}</p><div class="life-chips">${model.picks.filter(item => item.stepIndex === stepIndex)
      .map(item => `<button type="button" class="life-chip" data-alt="${escapeHTML(item.key)}">${escapeHTML(item.label)}</button>`).join('')}</div>`;
    pop.hidden = false;
    pop.style.cssText = 'visibility:hidden;left:0;top:0';
    // Below the fork, or above it when that runs off the stage; always inside it.
    const r = rect();
    const width = pop.offsetWidth; const height = pop.offsetHeight;
    const point = g.points[stepIndex];
    let top = point.y + 24;
    if (top + height > r.height - 8) top = point.y - 24 - height;
    top = clamp(top, 8, Math.max(8, r.height - height - 8));
    const left = clamp(point.x - 28, 8, Math.max(8, r.width - width - 8));
    pop.style.cssText = `left:${left.toFixed(1)}px;top:${top.toFixed(1)}px`;
    pop.querySelector('.life-chip')?.focus({ preventScroll: true });
  }
  function closePop({ focusFork = false } = {}) {
    if (pop.hidden) return;
    // Hidden, not emptied: taking out the focused chip would make the browser restyle the page then and there.
    pop.hidden = true;
    const fork = openFork;
    openFork = null;
    fork?.setAttribute('aria-expanded', 'false');
    if (focusFork) fork?.focus({ preventScroll: true });
  }
  overlay.addEventListener('click', event => {
    const fork = event.target.closest('.life-fork');
    if (fork && !fork.disabled) {
      if (openFork === fork) closePop({ focusFork: true }); else openPop(Number(fork.dataset.step));
    }
  });
  overlay.addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const chip = event.target.closest('.life-chip');
    const fork = event.target.closest('.life-fork');
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (chip && keys[event.key]) {
      const chips = [...pop.querySelectorAll('.life-chip')];
      chips[(chips.indexOf(chip) + keys[event.key] + chips.length) % chips.length].focus({ preventScroll: true });
      event.preventDefault();
    } else if (chip && event.key === 'Escape') {
      closePop({ focusFork: true });
      event.preventDefault();
    } else if (fork && keys[event.key]) {
      // The forks in age order.
      const next = forkEls[forkEls.indexOf(fork) + keys[event.key]];
      next?.focus({ preventScroll: true });
      event.preventDefault();
    } else if (fork && event.key === 'Escape') {
      event.preventDefault();
      onLeave();
    }
  });
  // A tab or click away closes the popover.
  // A press inside the popover keeps the focus where it is: Safari doesn't focus a pressed button, so
  // the chip would lose focus, the popover would close (below) and the click would land on the map.
  pop.addEventListener('mousedown', event => event.preventDefault());
  pop.addEventListener('focusout', event => {
    if (!pop.hidden && !pop.contains(event.relatedTarget) && event.relatedTarget !== openFork) closePop();
  });
  document.addEventListener('pointerdown', event => {
    if (!pop.hidden && !pop.contains(event.target) && !event.target.closest?.('.life-fork')) closePop();
  });

  // While the end card shows, grow one life no one sees, so the engine is warm and the first
  // pick costs what later ones do.
  let warmFor = null;
  function warmUp() {
    const first = model?.picks[0];
    if (!first || warmFor === model.life.id) return;
    warmFor = model.life.id;
    const run = () => { if (model?.life.id === warmFor) grow(model.store, { baseline: model.life.id, forkIndex: first.stepIndex, alt: first.id, seed: 'warm-up' }); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 }); else setTimeout(run, 300);
  }
  // The end card: lower right as in the explorer, unless that covers the route
  // or its labels; then the clear corner; on a stage too small for both, a bar.
  function showCard() {
    warmUp();
    const g = geometry();
    const r = rect();
    card.hidden = false;
    card.classList.remove('is-bar');
    card.style.cssText = 'visibility:hidden';
    const width = card.offsetWidth; const height = card.offsetHeight;
    const close = (box, others) => others.some(other => box.left < other.right + 6 && box.right > other.left - 6 && box.top < other.bottom + 6 && box.bottom > other.top - 6);
    const dark = labelEls.filter(element => element.classList.contains('is-shown')).map(boxOf);
    const gray = altEls.filter(element => element.classList.contains('is-shown')).map(boxOf);
    // Never over the route, its dots, its labels or the paths still ahead; gray lines may pass under, as in the explorer.
    const blocked = (box, strict) => g.placer.onPath(box) || close(box, dark) || (strict && close(box, gray))
      || [...g.points, ...g.ahead.map(edge => edge.b)].some(point => point.x > box.left - 18 && point.x < box.right + 18 && point.y > box.top - 18 && point.y < box.bottom + 18);
    const spots = [
      { right: 22, bottom: 44 }, { right: 22, bottom: 96 }, { left: 16, bottom: 44 }, { left: 16, top: 16 }, { right: 22, top: 16 },
    ].map(spot => ({ ...spot, box: {
      left: spot.left ?? r.width - spot.right - width, top: spot.top ?? r.height - spot.bottom - height,
      right: (spot.left ?? r.width - spot.right - width) + width, bottom: (spot.top ?? r.height - spot.bottom - height) + height,
    } }));
    // A gray label the card has to cover steps out of sight (its ring and popover still offer it), as
    // gray labels step aside for dark ones.
    const coverGray = box => altEls.forEach(element => element.classList.toggle('is-under-card', element.classList.contains('is-shown') && close(box, [boxOf(element)])));
    const spot = spots.find(item => !blocked(item.box, true)) ?? spots.find(item => !blocked(item.box, false));
    if (spot) {
      card.style.cssText = `left:${spot.box.left}px;top:${spot.box.top}px;right:auto;bottom:auto`;
      coverGray(spot.box);
      return;
    }
    // A stage too small for a card gets a bar across the map's empty top, or else its foot.
    card.classList.add('is-bar');
    card.style.cssText = 'visibility:hidden';
    const barHeight = card.offsetHeight;
    const bar = top => ({ left: 12, right: r.width - 12, top, bottom: top + barHeight });
    const top = [12, r.height - 30 - barHeight].find(y => !blocked(bar(y), false)) ?? r.height - 30 - barHeight;
    card.style.cssText = `top:${top}px;bottom:auto`;
    coverGray(bar(top));
  }

  // ——— A life the person could have lived ———
  /**
   * Pick an alternative: the real path from that fork turns light and stays
   * behind, and a new life grows from the fork along the choice to the life's
   * end, at the explorer's walking speed. A new `seed` grows a different life
   * each time; `reduced` shows it at once.
   */
  function pick(altKey, { reduced = prefersReducedMotion(), silent = false, seed = newSeed() } = {}) {
    const item = itemFor(altKey);
    if (!item?.pickable) return null;
    stopWhat();
    closePop();
    const g = geometry();
    const steps = model.life.steps;
    const k = item.stepIndex;
    const life = grow(model.store, { baseline: model.life.id, forkIndex: k, alt: item.id, seed });
    if (!life) return null;
    // The new life leaves from where its gray line ended, and goes on from there.
    life.steps[k].fixedY = item.y;
    heights(life.steps).forEach((y, index) => { life.steps[index].y = y; });
    const entry = g.alts.find(other => other.item.key === altKey);
    const grown = life.steps.slice(k);
    const nodes = grown.map((step, index) => ({ ...step, point: index ? g.at(step.age, step.y) : entry.node }));
    // Each new dot sits only where its own lines split: none lands on the real
    // path behind it, and the new life's last dot keeps clear of it.
    const realLine = g.edges.slice(k).flatMap(edge => edgePoints(edge, 30));
    const clearOf = (point, clearance) => {
      for (const q of realLine) {
        const dx = q.x - point.x;
        if (dx < clearance && dx > -clearance && Math.hypot(dx, q.y - point.y) < clearance) return false;
      }
      return true;
    };
    const r = rect();
    nodes.forEach((node, index) => {
      const clearance = index === nodes.length - 1 ? 30 : 18;
      if (!index || clearOf(node.point, clearance)) return;
      // Up or down, away from the real path on the side the dot is on; beside a
      // steep stretch of it, a little earlier or later instead. Never past a neighbour.
      const nearest = realLine.reduce((best, q) => (Math.hypot(q.x - node.point.x, q.y - node.point.y) < Math.hypot(best.x - node.point.x, best.y - node.point.y) ? q : best));
      const away = node.point.y > nearest.y ? 1 : -1;
      const side = node.point.x > nearest.x ? 1 : -1;
      const lo = nodes[index - 1].point.x + 14;
      const hi = index < nodes.length - 1 ? g.at(nodes[index + 1].age, nodes[index + 1].y).x - 14 : r.width - RIGHT;
      for (let shift = 2; shift <= 90; shift += 2) {
        const moved = [[0, away], [0, -away], [side, 0], [-side, 0]]
          .filter(([sx]) => !sx || shift <= 28)
          .map(([sx, sy]) => ({ x: node.point.x + sx * shift, y: node.point.y + sy * shift }))
          .find(point => point.y > TOP && point.y < r.height - BOTTOM && point.x > lo && point.x < hi && clearOf(point, clearance));
        if (moved) { node.point = moved; return; }
      }
    });
    const edges = nodes.map((node, index) => (index ? { a: nodes[index - 1].point, b: node.point, bend: 0 } : entry.edge));
    // The gray lines at each new dot: other things that could have happened there
    // (the first fork's are the person's own other choices, already on the map).
    const siblings = nodes.map((node, index) => (index ? grayItems(life.steps, k + index, `${model.life.id}:${seed}`).map(other => {
      const end = g.at(other.age, other.y);
      return {
        edge: { a: nodes[index - 1].point, b: end, bend: other.bend * g.span },
        tails: other.tails.map(tail => ({ a: end, b: g.at(tail.age, tail.y), bend: tail.bend * g.span })),
      };
    }) : []));
    const last = nodes.at(-1);
    const ahead = aheadFor(`${model.life.id}:${seed}:ahead`, last.age, last.y).map(next => ({ a: last.point, b: g.at(next.age, next.y), bend: next.bend * g.span }));
    // Labels for the new life, clear of what stays on the map.
    const visibleBoxes = () => [...g.band, ...[...labelEls.filter(element => Number(element.dataset.step) < k),
      ...altEls.filter(element => { const other = itemFor(element.dataset.alt); return other.stepIndex <= k && other.key !== altKey; })].map(boxOf)];
    const soft = [[...siblings.flat().map(sibling => sibling.edge), ...ahead], siblings.flat().flatMap(sibling => sibling.tails)];
    // The new life's labels are placed in age order, a few each frame while it
    // starts to grow (or at once when it must show whole), so a pick stays one short task.
    const placers = () => {
      const boxes = visibleBoxes();
      return [
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes, soft,
          paths: [...g.edges.slice(1), ...edges], dots: [...g.points, ...nodes.map(node => node.point)] }),
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes,
          paths: [...g.edges.slice(1, k), ...edges], dots: [...g.points.slice(0, k), ...nodes.map(node => node.point)] }),
      ];
    };
    what = { item, k, fork: k - 1, life, seed, nodes, edges, siblings, ahead, labels: [], placers, reached: 0, frame: null, labelFrame: null, drawn: false, done: false, silent };
    setMode('whatif');
    overlay.querySelectorAll('.life-label.is-what').forEach(element => element.remove());
    whatEls = [];
    // The later labels and choices step aside; the real path stays, light, behind the new one.
    labelEls.forEach(element => element.classList.toggle('is-shown', Number(element.dataset.step) < k));
    altEls.forEach(element => {
      const other = itemFor(element.dataset.alt);
      element.classList.toggle('is-shown', other.stepIndex <= k && other.key !== altKey);
    });
    shown = { labels: -1, alts: -1 };
    pulses([]);
    if (!silent) onPick({ item, age: steps[k].age, life, nodes, seed });
    if (reduced) { finishWhat(); what.silent = false; return what; }
    // The map behind it changes over the next two frames (the gray lines, then
    // the routes), the new life starts to grow, and its labels follow, one a frame.
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

  /** The map behind a new life: `grays`, `dark` or both canvases (the marks follow the dark one). */
  function redrawWhat(part = 'both') {
    const g = geometry();
    const steps = model.life.steps;
    const k = what.k;
    baked = -1; aheadBaked = false;
    if (part !== 'dark') {
      sizeCanvas(graysCanvas, gx, whole());
      strokes = strokes.filter(item => item.layer === 'dark' || item.layer === 'light');
      // The gray lines up to the fork (the picked one becomes the new life's first line).
      for (let index = 1; index <= k; index += 1) {
        for (const entry of g.altsOf[index]) {
          if (entry.item.key === what.item.key) continue;
          lay('gray', [entry.edge], MIST, GRAY);
          lay('tail', entry.tails, TAIL, THIN);
        }
      }
      for (let index = 1; index <= what.reached; index += 1) bakeWhatEdge(index, 'grays');
    }
    if (part === 'grays') return;
    sizeCanvas(darkCanvas, dx, whole());
    sizedFor = `${model.life.id}|${rect().width}x${rect().height}`;
    strokes = strokes.filter(item => item.layer !== 'dark' && item.layer !== 'light');
    marks = [];
    // The real path from the fork: light, behind.
    lay('light', g.edges.slice(k), LIGHT, LIVED);
    g.points.slice(k).forEach((point, offset) => marks.push(markFor(point, steps[k + offset].kind, true)));
    // The path up to the fork, as it was.
    lay('dark', g.edges.slice(1, k), FOREST, LIVED);
    for (let index = 0; index < k; index += 1) marks.push(markFor(g.points[index], steps[index].kind));
    for (let index = 1; index <= what.reached; index += 1) bakeWhatEdge(index, 'dark', false);
    paintMarks();
  }
  // The new life's edges are what.edges[0] (fork → the choice) to what.edges[n-1].
  function walkWhat(index) {
    if (!what) return;
    const run = what;
    if (index > run.edges.length) { growAhead(run); return; }
    const from = index === 1 ? model.life.steps[run.fork].age : run.nodes[index - 2].age;
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
    const box = useLive(boundsOf([...edgeBounds(edge), ...sibs.flatMap(sibling => [...edgeBounds(sibling.edge), ...sibling.tails.flatMap(edgeBounds)])], 16));
    const moving = [];
    for (const sibling of sibs) {
      stroke(lx, [sibling.edge], MIST, GRAY, p);
      stroke(lx, sibling.tails, TAIL, THIN, Math.max(0, p * 2 - 1));
      moving.push({ edge: sibling.edge, color: MIST, width: GRAY, layer: 'gray', at: p });
    }
    stroke(lx, [edge], FOREST, LIVED, p);
    moving.push({ edge, color: FOREST, width: LIVED, layer: 'dark', at: p });
    marksOver(box, moving);
    traveller(lx, pointOn(edge, p), p < 1);
    if (p >= 1) drawMark(lx, markFor(node.point, node.kind), [...strokes, ...moving]);
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
  function bakeWhatEdge(index, part = 'both', paint = true) {
    const node = what.nodes[index - 1];
    if (part !== 'dark') {
      for (const sibling of what.siblings[index - 1]) {
        lay('gray', [sibling.edge], MIST, GRAY);
        lay('tail', sibling.tails, TAIL, THIN);
      }
    }
    if (part === 'grays') return;
    lay('dark', [what.edges[index - 1]], FOREST, LIVED);
    marks.push(markFor(node.point, node.kind));
    if (paint) paintMarks();
  }
  function growAhead(run) {
    const last = run.nodes.at(-1).point;
    const started = performance.now();
    const tick = now => {
      if (what !== run) return;
      const p = Math.min(1, (now - started) / 600);
      const box = useLive(boundsOf([...run.ahead.flatMap(edgeBounds), last], 16));
      stroke(lx, run.ahead, AHEAD, 3, p);
      marksOver(box, run.ahead.map(edge => ({ edge, color: AHEAD, width: 3, layer: 'ahead', at: p })));
      traveller(lx, last, false);
      if (p < 1) { run.frame = requestAnimationFrame(tick); return; }
      run.frame = null;
      endWhat(run);
    };
    run.frame = requestAnimationFrame(tick);
  }
  // The traveller rests on the new life's last dot.
  function restWhat(run) {
    const box = useLive(boundsOf([run.nodes.at(-1).point], 16));
    marksOver(box, []);
    traveller(lx, run.nodes.at(-1).point, false);
  }
  function endWhat(run) {
    lay('ahead', run.ahead, AHEAD, 3);
    paintMarks();
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

  /** Back to the written life exactly as the story left it. */
  function restore(nextMode = 'ended') {
    stopWhat();
    clearBase();
    frame = finalFrame();
    shown = { labels: -1, alts: -1 };
    drawStory();
    setMode(nextMode);
  }

  return {
    failed,
    get mode() { return mode; },
    get what() { return what; },
    get life() { return model?.life ?? null; },
    setLife,
    /** The story's sink: one moment of the life. */
    setFrame(next) {
      frame = next;
      if (failed || !model || mode === 'whatif') return;
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
      if (failed || !model) return;
      const placed = geo?.key;
      size = null;
      const r = rect();
      const key = `${model.life.id}|${r.width}x${r.height}`;
      // A second call for the same size (the observer after a settle) has nothing to redo.
      if (placed === key && sizedFor === key) return;
      closePop();
      geo = null; liveBox = '';
      geometry();
      if (what) {
        finishWhat();
        const { item, seed } = what;
        stopWhat();
        pick(item.key, { reduced: true, silent: true, seed });
        return;
      }
      clearBase();
      drawStory();
      setMode(mode);
    },
    setVisible(value) { visible = value; },
    get visible() { return visible; },
    points: () => geometry().points,
    endPoint: () => (what ? what.nodes.at(-1).point : geometry().points[END]),
    /** What the map's chips must stay clear of: the labels (in "Choices add up" the gray choices' labels step back). */
    occupied: () => [...labelEls, ...(mode === 'adds' ? [] : altEls)].filter(element => element.classList.contains('is-shown')).map(boxOf),
    /**
     * The dark labels showing, with their step and their box as laid out (not as drawn, which a
     * transition may be moving), for "Choices add up", which may step some back.
     */
    darkLabels: () => {
      const g = geometry();
      return labelEls.filter(element => element.classList.contains('is-shown')).map(element => {
        const step = Number(element.dataset.step);
        return { element, step, box: g.labels[step]?.box ?? boxOf(element) };
      });
    },
    layers: { axis, grays: graysCanvas, dark: darkCanvas, marks: marksCanvas, live: liveCanvas, overlay },
    card,
    /** Every alternative the reader may pick, in age order: `{ key, stepIndex, id, label, whatIf }`. */
    picks: () => model?.picks ?? [],
    forks: () => forkEls,
    openFork: openPop,
    closeFork: closePop,
    focusFirstFork() { forkEls.find(element => !element.disabled)?.focus({ preventScroll: true }); },
    onCard(handler) { card.addEventListener('click', event => { const action = event.target.closest('[data-life]')?.dataset.life; if (action) handler(action); }); },
    onAlt(handler) { overlay.addEventListener('click', event => { const button = event.target.closest('.life-alt, .life-chip'); if (button && !button.disabled) handler(button.dataset.alt); }); },
    geometry,
  };
}
