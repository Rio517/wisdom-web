// The hike's water, in the map's own units: the SVG viewBox, 1200 x 800, y down.
// Every version draws from these shapes, so only the water's look differs.

export const VIEW = { width: 1200, height: 800 };

// The far ridge (the first background band). The main stream comes over it at a saddle.
export const FAR_RIDGE = 'M-400 330 L0 330 L90 250 L170 300 L280 170 L380 280 L470 210 L560 300 L700 140 L820 260 L900 190 L1010 250 L1100 160 L1200 240 L1600 300 V1200 H-400 Z';
// The two crest lines either side of that saddle; water above them is behind the ridge.
export const SADDLE = [[280, 170], [380, 280], [470, 210]];

// Main stream: over the far ridge at the saddle, through the notch in the second ridge,
// under the bridge (628, 505), past the junction and out at the bottom edge.
const MAIN_KEYS = [
  [368, 240], [381, 284], [404, 322], [436, 352], [462, 384], [494, 412], [546, 434], [596, 456],
  [621, 481], [628, 505], [634, 548], [637, 600], [631, 650], [622, 694], [611, 742], [609, 800],
  [619, 870], [612, 950], [603, 1040],
];
// Side stream: from the pool at the waterfall's foot, leftwards, into the main stream below the bridge.
const SIDE_KEYS = [
  [1068, 556], [1030, 561], [996, 572], [966, 590], [928, 606], [880, 613], [832, 611], [788, 617],
  [748, 631], [712, 649], [678, 666], [648, 684], [622, 702],
];

// Width (map units) by depth: narrow at the ridge, widest at the bottom.
const MAIN_WIDTH = [[240, 5], [284, 6.5], [384, 11], [440, 15], [505, 25], [600, 29], [676, 30], [740, 38], [880, 44], [1060, 48]];
const SIDE_WIDTH = [[556, 10], [620, 12], [702, 15]];

export const POOL = { cx: 1084, cy: 554, rx: 56, ry: 14 };
export const LAKE = { cx: 1066, cy: 248, rx: 104, ry: 26 };
// The fall's sheet inside the rock: a slight trapezoid, widening at the foot.
export const FALL = { top: 392, bottom: 556, topLeft: 1070, topRight: 1098, footLeft: 1066, footRight: 1102 };
export const IMPACT = [1084, 552];
export const LAKE_RINGS = [[1028, 252], [1104, 244]];

const table = (rows, value) => {
  if (value <= rows[0][0]) return rows[0][1];
  for (let i = 1; i < rows.length; i += 1) {
    const [x1, y1] = rows[i];
    if (value <= x1) {
      const [x0, y0] = rows[i - 1];
      return y0 + (y1 - y0) * (value - x0) / (x1 - x0);
    }
  }
  return rows[rows.length - 1][1];
};

// Centripetal Catmull-Rom through the keys: no loops or overshoot where spacing changes.
function spline(keys, perSegment = 24) {
  const pts = [[2 * keys[0][0] - keys[1][0], 2 * keys[0][1] - keys[1][1]], ...keys];
  const n = keys.length;
  pts.push([2 * keys[n - 1][0] - keys[n - 2][0], 2 * keys[n - 1][1] - keys[n - 2][1]]);
  const out = [keys[0]];
  const knot = (a, b) => Math.max(1e-4, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5);
  for (let i = 1; i < pts.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let j = 1; j <= perSegment; j += 1) {
      const t = t1 + (t2 - t1) * (j / perSegment);
      const mix = (a, b, ta, tb) => [
        ((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta),
        ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta),
      ];
      const a1 = mix(p0, p1, 0, t1);
      const a2 = mix(p1, p2, t1, t2);
      const a3 = mix(p2, p3, t2, t3);
      const b1 = mix(a1, a2, 0, t2);
      const b2 = mix(a2, a3, t1, t3);
      out.push(mix(b1, b2, t1, t2));
    }
  }
  return out;
}

// Even spacing along the curve.
function resample(points, spacing) {
  const out = [{ x: points[0][0], y: points[0][1], s: 0 }];
  let carried = 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const length = Math.hypot(bx - ax, by - ay);
    let along = spacing - carried;
    while (along <= length) {
      const f = along / length;
      out.push({ x: ax + (bx - ax) * f, y: ay + (by - ay) * f, s: total + along });
      along += spacing;
    }
    carried = length - (along - spacing);
    total += length;
  }
  const [lx, ly] = points[points.length - 1];
  if (Math.hypot(lx - out[out.length - 1].x, ly - out[out.length - 1].y) > spacing * 0.3) out.push({ x: lx, y: ly, s: total });
  return out;
}

/**
 * A stream as evenly spaced samples. Each sample has a position, a unit normal,
 * its width `w`, a perspective `scale` (1 = near the bridge, smaller far away)
 * and `flow`, the distance downstream measured in near units, so a pattern with a
 * fixed period in `flow` shrinks and slows with distance.
 */
function buildStream(keys, widths, { wobble = 0.06, phase = 0 } = {}) {
  const samples = resample(spline(keys), 2.5);
  const n = samples.length;
  let flow = 0;
  samples.forEach((sample, i) => {
    const a = samples[Math.max(0, i - 2)];
    const b = samples[Math.min(n - 1, i + 2)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    sample.tx = (b.x - a.x) / length;
    sample.ty = (b.y - a.y) / length;
    sample.nx = -sample.ty;
    sample.ny = sample.tx;
    const base = table(widths, sample.y);
    // A little slow variation, so the banks never run as parallel as a road's.
    sample.w = base * (1 + wobble * Math.sin(sample.s / 41 + 0.7 + phase) + wobble * 0.6 * Math.sin(sample.s / 17 + 2.3 + phase));
    // Depth, not width, sets the perspective: both streams share it.
    sample.scale = table(MAIN_WIDTH, sample.y) / 30;
    if (i) flow += (sample.s - samples[i - 1].s) / Math.max(0.15, (sample.scale + samples[i - 1].scale) / 2);
    sample.flow = flow;
  });
  return { samples, length: samples[n - 1].s, flowLength: flow };
}

export const MAIN = buildStream(MAIN_KEYS, MAIN_WIDTH);
export const SIDE = buildStream(SIDE_KEYS, SIDE_WIDTH, { wobble: 0.05, phase: 1.9 });
export const STREAMS = [SIDE, MAIN];

/** Bank width (map units) for a stream of width `w`: thin far away, a little more up close. */
export const bankWidth = w => 0.6 + 0.12 * w;

/** A closed outline of a stream, inset from its banks by `inset` (map units, or a function of the sample). */
export function outline(stream, inset = 0) {
  const left = [];
  const right = [];
  for (const p of stream.samples) {
    const half = Math.max(0.2, p.w / 2 - (typeof inset === 'function' ? inset(p) : inset));
    left.push([p.x + p.nx * half, p.y + p.ny * half]);
    right.push([p.x - p.nx * half, p.y - p.ny * half]);
  }
  return [...left, ...right.reverse()];
}

/** A point `fraction` of the way along a stream, with its sample. */
export function along(stream, fraction) {
  const s = stream.length * Math.max(0, Math.min(1, fraction));
  const index = Math.min(stream.samples.length - 1, Math.round(s / 2.5));
  return stream.samples[index];
}

/** The far ridge's crest height at x near the saddle (water above it is hidden). */
export function crestY(x) {
  const [a, b, c] = SADDLE;
  if (x <= a[0] || x >= c[0]) return -Infinity;
  if (x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  return b[1] + (c[1] - b[1]) * (x - b[0]) / (c[0] - b[0]);
}

/** Circles [x, y, radius] that trees and labels keep clear of. */
export function keepClear(margin = 12) {
  const spots = [];
  for (const stream of STREAMS) {
    stream.samples.forEach((p, i) => { if (i % 4 === 0) spots.push([p.x, p.y, p.w / 2 + margin]); });
  }
  for (const pond of [POOL, LAKE]) {
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      spots.push([pond.cx + Math.cos(angle) * pond.rx * 0.8, pond.cy + Math.sin(angle) * pond.ry * 0.8, pond.ry * 0.2 + margin]);
    }
  }
  return spots;
}

/** The SVG layout transform for a box of `width` x `height` (preserveAspectRatio xMidYMid meet). */
export function fit(width, height) {
  const k = Math.min(width / VIEW.width, height / VIEW.height);
  return { k, ox: (width - VIEW.width * k) / 2, oy: (height - VIEW.height * k) / 2 };
}

/** The part of the map visible in a box, in map units. */
export function visibleBounds(width, height) {
  const { k, ox, oy } = fit(width, height);
  return { left: -ox / k, right: (width - ox) / k, top: -oy / k, bottom: (height - oy) / k };
}
