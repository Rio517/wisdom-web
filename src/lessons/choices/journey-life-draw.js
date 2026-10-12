// The life map's drawing (design 001 v13, the Lesson 1 opening; ported from
// prototype/lesson1-opening/life-map.js): where a life's gray lines go, the explorer's
// curves, strokes, dots, star and diamond, and the label placer. Pure layout and
// Canvas 2D; the map itself is journey-life-map.js, a changed life journey-life-whatif.js.
import { gapFor, hash01 } from './lives/engine.js';
import { FOREST, SAGE, MIST, CLAY, SUN } from './journey-colors.js';

const HALO = '#f2f5f0'; // the map's background (paper-deep)
const rgbOf = hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16));
/** `a` laid over the map's background at `amount`: a faded colour that is still fully opaque. */
export const mix = (a, amount, b = HALO) => `#${rgbOf(a).map((value, at) => Math.round(value * amount + rgbOf(b)[at] * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
export const TAIL = mix(MIST, 0.55); // the gray lives carrying on past a gray dot
export const AHEAD = mix(SAGE, 0.9); // the paths still ahead
// The person's own life after the fork, behind a changed one (round 7, level c: it stays readable,
// and second): a stronger sage line, its marks at 65%, and muted labels on its turns and its end.
export const LIGHT = mix(FOREST, 0.35, SAGE); // a real path behind a new life: sage, a third of the way to forest
const LIGHT_SUN = mix(SUN, 0.65);
const LIGHT_CLAY = mix(CLAY, 0.65);
const LIGHT_DOT = mix(FOREST, 0.65);
export const FONT = '"Avenir Next", AvenirNext, "Segoe UI", sans-serif';
export const MAX_AGE = 45; // the axis runs 0–45; the paths still ahead run on past it
export const TOP = 24;
export const BOTTOM = 56;
export const RIGHT = 56; // room past 45 for the paths still ahead
export const CHOSEN_SIZE = 15;
export const GRAY_SIZE = 13;
export const SMALL_SIZE = 13; // a route label's last resort (round 7): every step keeps its label
const OVER_GRAY = 30; // label cost of sitting over a gray choice or a path ahead
const OVER_TAIL = 14; // and over a fainter gray tail
export const LIVED = 4.4;
export const GRAY = 2.3;
export const THIN = 1.8;
export const DOT = 3.8;
export const RING = 2; // the ring of map colour around every mark
export const BAR = 100; // on a narrow stage the end card is a bar across the top: at least this much stays clear for it (its measured height + 10 px)

// ——— Where the gray lines go (a pure layout in ages and heights) ———
export const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
export const isSurprise = kind => kind === 'lucky' || kind === 'setback';

// ——— Runs (round 6): a short burst of trying again draws close together ———
// Round 6's option D: a run's steps spread evenly over its years, its middle steps carry no gray
// lines (the burst reads as one stroke) and its own strokes lean straight (no level S between its close dots).
const RUN_DIRECT = 0.75;
export const runEdge = (step, prev) => (inRun(step) && prev?.run === step.run ? RUN_DIRECT : 0);
export const RUN_GAP = 16; // px: two dots of a run never closer than this
export const RUN_DX = 24; // px: where a run is tighter than this a step, it spreads (round 7: room for every label), up to the next step
export const inRun = step => Boolean(step?.run);
export const runMiddle = step => inRun(step) && step.runStep > 0 && step.runStep < step.runSize - 1;
/** Where each step sits along the axis (`at`, in years): its age, or for a run's steps, spread over the run. */
export function placeAges(steps) {
  for (let i = 0; i < steps.length;) {
    const step = steps[i];
    step.at = step.age;
    if (!inRun(step)) { i += 1; continue; }
    let j = i;
    while (j + 1 < steps.length && steps[j + 1].run === step.run && steps[j + 1].runStep === steps[j].runStep + 1) j += 1;
    const n = j - i + 1;
    for (let k = 0; k < n; k += 1) {
      const own = steps[i + k];
      own.at = n > 1 ? step.age + ((steps[j].age - step.age) * k) / (n - 1) : step.age;
    }
    i = j + 1;
  }
  return steps;
}
/**
 * Keep a run's dots apart on the map: a dot closer than RUN_GAP to the one
 * before it moves up or down (the way its own step goes, else up) until it is
 * clear. Its height in the life is unchanged; only the drawing makes room.
 */
export function widenRuns(points, steps) {
  for (let i = 0; i < steps.length;) {
    if (!inRun(steps[i])) { i += 1; continue; }
    let j = i;
    while (j + 1 < steps.length && steps[j + 1].run === steps[i].run) j += 1;
    const n = j - i;
    if (n > 0 && (points[j].x - points[i].x) / n < RUN_DX) {
      const room = j + 1 < steps.length ? points[j + 1].x - RUN_DX - points[i].x : RUN_DX * n;
      const width = Math.max(points[j].x - points[i].x, Math.min(RUN_DX * n, room));
      for (let k = 1; k <= n; k += 1) points[i + k] = { x: points[i].x + (width * k) / n, y: points[i + k].y };
    }
    i = j + 1;
  }
  return points;
}
export function spaceRun(points, steps) {
  for (let index = 1; index < points.length; index += 1) {
    if (!inRun(steps[index]) || steps[index].run !== steps[index - 1].run) continue;
    const a = points[index - 1];
    const b = points[index];
    const way = b.y > a.y + 0.5 ? 1 : b.y < a.y - 0.5 ? -1 : steps[index].kind === 'setback' ? 1 : -1;
    // Clear of every dot before it (a run's steps can sit within a few px of each other along the axis).
    const clear = point => points.slice(0, index).every(other => Math.hypot(other.x - point.x, other.y - point.y) >= RUN_GAP);
    let point = b;
    for (let shift = 0; shift <= 120 && !clear(point); shift += 1) point = { x: b.x, y: b.y + way * shift };
    points[index] = point;
  }
  return points;
}

/** The gray lives a gray dot carries on into: one to three short lines, mostly two. */
export function tailsFor(key, age, y) {
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
export function aheadFor(key, age, y) {
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
export function grayItems(steps, k, scope) {
  const step = steps[k];
  const prev = steps[k - 1];
  const next = steps[k + 1];
  const base = `${scope}:${k}`;
  const moved = isSurprise(step.kind) || Boolean(step.move);
  const pickable = !step.grown && step.alts.length > 0;
  // A run's middle steps come too fast for other lives to branch off ('quiet'): the burst reads as one stroke.
  if (runMiddle(step) && !pickable) return [];
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
    const stepAt = step.at ?? step.age;
    const prevAt = prev.at ?? prev.age;
    const age = clamp(stepAt + (hash01(`${base}:${option.id}:age`) - 0.5) * 0.9, Math.min(prevAt + 0.7, stepAt), stepAt + 0.5);
    return {
      key, stepIndex: k, id: option.id ?? null, label: option.label ?? null, whatIf: option.whatIf ?? null, kind: option.kind ?? null,
      pickable: pickable && !option.without, age, y,
      bend: (hash01(`${base}:${option.id}:bend`) - 0.5) * 0.03,
      tails: tailsFor(`${scope}:${key}`, age, y),
    };
  });
}

// ——— Curves (the explorer's: level out of each dot, level into the next) ———
export function controls(edge) {
  const dx = edge.b.x - edge.a.x;
  const c1 = { x: edge.a.x + dx * 0.5, y: edge.a.y + edge.bend };
  const c2 = { x: edge.b.x - dx * 0.5, y: edge.b.y };
  if (!edge.direct) return [edge.a, c1, c2, edge.b];
  // A run's quick steps: the curve leans toward a straight stroke, so a burst reads as one quick zigzag.
  const dy = edge.b.y - edge.a.y;
  const k = edge.direct;
  return [edge.a, { x: c1.x + (edge.a.x + dx / 3 - c1.x) * k, y: c1.y + (edge.a.y + dy / 3 - c1.y) * k },
    { x: c2.x + (edge.a.x + (2 * dx) / 3 - c2.x) * k, y: c2.y + (edge.a.y + (2 * dy) / 3 - c2.y) * k }, edge.b];
}
export function pointOn(edge, at) {
  const [p0, p1, p2, p3] = controls(edge);
  const u = 1 - at;
  return {
    x: u * u * u * p0.x + 3 * u * u * at * p1.x + 3 * u * at * at * p2.x + at * at * at * p3.x,
    y: u * u * u * p0.y + 3 * u * u * at * p1.y + 3 * u * at * at * p2.y + at * at * at * p3.y,
  };
}
export const edgePoints = (edge, samples = 20) => Array.from({ length: samples + 1 }, (_, i) => pointOn(edge, i / samples));
/** The curve from its start to `at`, as one Bézier (de Casteljau), so a growing line is one stroke. */
export function trace(context, edge, at = 1) {
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
/** Where the fade starts at this stage size (the life map sets it as it lays out). */
export const setFadeFrom = x => { fadeFrom = x; };
const FADING = new Set([MIST, TAIL, SAGE, AHEAD]);
function strokeStyle(context, color) {
  if (!FADING.has(color) || !Number.isFinite(fadeFrom)) return color;
  const rgb = rgbOf(color);
  const gradient = context.createLinearGradient(fadeFrom, 0, fadeFrom + 54, 0);
  gradient.addColorStop(0, `rgb(${rgb})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  return gradient;
}
export function stroke(context, edges, color, width, at = 1) {
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
export function disc(context, point, radius, color) {
  if (radius <= 0) return;
  context.fillStyle = color;
  context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill();
}
// A small flat marker where a surprise happened: a star for a lucky break, a diamond for a setback.
export function shape(context, point, kind, scale) {
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
export function drawMark(context, mark, strokes, scale = 1) {
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
  disc(context, point, radius, light ? LIGHT_DOT : FOREST);
  context.restore();
}
export const near = (a, b) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
export function boundsOf(points, pad) {
  const xs = points.map(point => point.x); const ys = points.map(point => point.y);
  return { left: Math.min(...xs) - pad, top: Math.min(...ys) - pad, right: Math.max(...xs) + pad, bottom: Math.max(...ys) + pad };
}
export const edgeBounds = edge => controls(edge);
export const inside = (point, box, pad = 12) => point.x > box.left - pad && point.x < box.right + pad && point.y > box.top - pad && point.y < box.bottom + pad;

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
export function sampleGrid(edges, points = []) {
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
export function createPlacer({ width, height, measure, paths = [], dots = [], boxes = [], band = [], right = 2, soft = [[], []] }) {
  const onPath = sampleGrid(paths, dots);
  const nearSoft = soft.map(edges => sampleGrid(edges));
  const taken = [...boxes, ...band];
  const reserved = new Set(band); // the end card's band on a narrow stage: a last resort for a label
  const outside = box => box.left < 2 || box.right > width - right || box.top < 2 || box.bottom > height - 26;
  const clash = box => taken.some(o => box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top);
  const distance = (box, p) => Math.hypot(Math.max(box.left - p.x, 0, p.x - box.right), Math.max(box.top - p.y, 0, p.y - box.bottom));
  // A label must read as its own dot's: no other dot may sit nearer to it.
  const strayed = (box, own) => dots.some(p => p !== own && distance(box, p) + 2 < distance(box, own));
  // Round 7: every step keeps its label. When no spot near the line is clear, a label goes
  // further out, above or below its dot or a point of its line, with a leader to the dot: the
  // nearest box clear of the map's edge, every other label, every dot and every route line, whose
  // leader crosses no label and passes no other dot. Then the same with the line's clearance cut
  // from 8 px to 2 px. A leader shows whose label it is, so another dot may be a little nearer.
  const leaderClear = (from, to, home) => {
    for (let k = 1; k < 12; k += 1) {
      const x = from.x + ((to.x - from.x) * k) / 12;
      const y = from.y + ((to.y - from.y) * k) / 12;
      if (taken.some(o => x > o.left && x < o.right && y > o.top && y < o.bottom)) return false;
      if (dots.some(p => p !== home && Math.hypot(p.x - x, p.y - y) < 10)) return false;
    }
    return true;
  };
  const far = (text, textWidth, points, home, size = CHOSEN_SIZE, passes = [[4, false], [2, false], [2, true]]) => {
    // Every candidate box, nearest first: the search stops once no nearer one can beat the best.
    const anchors = [home, ...points.filter((_, i) => i % 2 === 0), ...[-250, -200, -150, -100, -50, 50, 100, 150].map(dx => ({ x: home.x + dx, y: home.y }))];
    const candidates = [];
    for (const anchor of anchors) {
      for (const dy of [-18, 26, -30, 38, -44, 52, -60, 68, -78, 86, -98, 106, -120, 128, -150, 158, -185, 192, -225, 232, -270, 276, 320]) {
        for (const shift of [0, -0.5, 0.5, -0.9, 0.9, -1.4, 1.4, -2, 2]) {
          const left = anchor.x - textWidth / 2 + shift * textWidth * 0.5;
          const baseline = anchor.y + dy;
          const box = { left: left - 4, right: left + textWidth + 4, top: baseline - size, bottom: baseline + 4 };
          // Out here a label may run over the paths still ahead (soft lines), up to the map's edge.
          if (box.left < 2 || box.right > width - 4 || box.top < 2 || box.bottom > height - 26) continue;
          candidates.push({ box, left, baseline, dy, dist: Math.hypot((box.left + box.right) / 2 - home.x, (box.top + box.bottom) / 2 - home.y) });
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    for (const [margin, useBand] of passes) {
      const clash = box => taken.some(o => (!useBand || !reserved.has(o)) && box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top);
      let best = null;
      for (const { box, left, baseline, dy, dist } of candidates) {
        if (best && dist >= best.cost) break;
        if (clash(box) || onPath(box, margin)) continue;
        // Clear of every mark, a star's points included.
        if (dots.some(p => p.x > box.left - 9 && p.x < box.right + 9 && p.y > box.top - 9 && p.y < box.bottom + 9)) continue;
        const cost = dist + (nearSoft[0](box, 3) ? OVER_GRAY : 0) + (nearSoft[1](box, 3) ? OVER_TAIL : 0);
        if (best && cost >= best.cost) continue;
        // The leader runs straight to the label, or to either of its near corners, whichever passes clear.
        const y = dy < 0 ? box.bottom - 2 : box.top + 2;
        const from = { x: home.x, y: home.y + Math.sign(y - home.y) * 5 };
        let via = null;
        let to = [Math.min(Math.max(home.x, box.left + 4), box.right - 4), box.left + 4, box.right - 4]
          .map(x => ({ x, y })).find(end => leaderClear(from, end, home));
        // Else an elbow: straight up or down from the dot to the label's middle, then across to its side.
        if (!to && (home.x < box.left - 6 || home.x > box.right + 6)) {
          const mid = (box.top + box.bottom) / 2;
          const corner = { x: home.x, y: mid };
          const side = { x: home.x < box.left ? box.left : box.right, y: mid };
          const start = { x: home.x, y: home.y + Math.sign(mid - home.y) * 5 };
          if (leaderClear(start, corner, home) && leaderClear(corner, side, home)) { to = side; via = corner; }
          if (to) { best = { cost: cost + 6, box, left, baseline, from: start, via, to }; continue; }
        }
        if (!to) continue;
        best = { cost, box, left, baseline, from, to };
      }
      if (best) {
        taken.push(best.box);
        const leader = best.via ? { from: best.from, via: best.via, to: best.to }
          : Math.hypot(best.to.x - best.from.x, best.to.y - best.from.y) > 8 ? { from: best.from, to: best.to } : null;
        return { text, left: best.left, baseline: best.baseline, box: best.box, leader, size };
      }
    }
    return null;
  };
  // The last search of all, so no step is ever left without its label: the nearest clear box anywhere on
  // the map (clear of the edge, every label, every route line and every mark), with a straight leader to
  // its dot that crosses no label. Then the same with the leader free to cross labels.
  const anywhere = (text, textWidth, home, size, useBand) => {
    const clash = box => taken.some(o => (!useBand || !reserved.has(o)) && box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top);
    const candidates = [];
    for (let baseline = size + 4; baseline <= height - 30; baseline += 4) {
      for (let left = 4; left + textWidth + 8 <= width - 4; left += 6) {
        const box = { left: left - 4, right: left + textWidth + 4, top: baseline - size, bottom: baseline + 4 };
        candidates.push({ box, left, baseline, dist: Math.hypot((box.left + box.right) / 2 - home.x, (box.top + box.bottom) / 2 - home.y) });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    for (const strictLeader of [true, false]) {
      for (const { box, left, baseline } of candidates) {
        if (clash(box) || onPath(box, 2)) continue;
        if (dots.some(p => p.x > box.left - 9 && p.x < box.right + 9 && p.y > box.top - 9 && p.y < box.bottom + 9)) continue;
        const y = home.y < box.top ? box.top + 2 : box.bottom - 2;
        const to = { x: Math.min(Math.max(home.x, box.left + 4), box.right - 4), y };
        const from = { x: home.x, y: home.y + Math.sign(to.y - home.y) * 5 };
        if (strictLeader && !leaderClear(from, to, home)) continue;
        taken.push(box);
        return { text, left, baseline, box, leader: { from, to }, size };
      }
    }
    return null;
  };
  return {
    onPath,
    reserve(box) { taken.push(box); },
    /** A route label along its edge (`points`, 21 of them, ending at its dot), or null when nowhere is clear. */
    chosen(text, points, own = points.at(-1), { last = true } = {}) {
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
      // Last of all, the same at the gray labels' size.
      // Outside the end card's band first, at the label's size and then at the gray labels' size; only then in the band
      // (a German bar can be taller than an English one, and the band is where the bar may go).
      if (!best) {
        const small = measure(text, `650 ${SMALL_SIZE}px ${FONT}`);
        const clear = [[4, false], [2, false]];
        return far(text, textWidth, points, home, CHOSEN_SIZE, clear) ?? far(text, small, points, home, SMALL_SIZE, clear)
          ?? (last ? anywhere(text, textWidth, home, CHOSEN_SIZE, false) ?? anywhere(text, small, home, SMALL_SIZE, false) : null)
          ?? far(text, textWidth, points, home, CHOSEN_SIZE, [[2, true]]) ?? far(text, small, points, home, SMALL_SIZE, [[2, true]])
          ?? (last ? anywhere(text, small, home, SMALL_SIZE, true) : null);
      }
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

export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// A label that had to move away keeps a short leader to its line, drawn with
// the label so the two show and hide together. The label is raised by 80% of
// its height (opening.css), so the leader is lowered by as much.
function leaderHTML(item) {
  if (!item.leader) return '';
  const { from, via, to } = item.leader;
  const segment = (a, b) => {
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return `<i class="life-leader" style="left:${(a.x - item.left).toFixed(1)}px;top:${(a.y - item.baseline + item.size * 0.8).toFixed(1)}px;width:${Math.hypot(b.x - a.x, b.y - a.y).toFixed(1)}px;transform:rotate(${angle.toFixed(4)}rad)"></i>`;
  };
  // An elbow leader (round 7) is two segments: down or up from the dot, then across to the label.
  return via ? segment(from, via) + segment(via, to) : segment(from, to);
}
export function labelHTML(item, className, extra = '') {
  if (!item) return '';
  const small = item.size !== CHOSEN_SIZE ? `;font-size:${item.size}px` : '';
  return `<span class="life-label ${className}" data-copy-ok="verb-heading" style="left:${item.left.toFixed(1)}px;top:${item.baseline.toFixed(1)}px${small}"${extra}>${escapeHTML(item.text)}${leaderHTML(item)}</span>`;
}
