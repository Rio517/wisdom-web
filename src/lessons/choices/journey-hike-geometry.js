// The shapes of Alfredo's hike map, in the map's own units: the SVG viewBox,
// 1200 x 800, y down. The flat SVG layers and the water layer (WebGL, or the
// still Canvas 2D drawing without it) all draw from these numbers, so they stay
// aligned at every size: `fit` is the one mapping from map units to the box.

export const VIEW = { width: 1200, height: 800 };

// The far ridge (the first background band).
export const FAR_RIDGE = 'M-400 330 L0 330 L90 250 L170 300 L280 170 L380 280 L470 210 L560 300 L700 140 L820 260 L900 190 L1010 250 L1100 160 L1200 240 L1600 300 V1200 H-400 Z';
// The green hill (the third band). The main stream starts at its crest.
const HILL_CURVES = [[[0, 470], [200, 430], [380, 470], [560, 430]], [[560, 430], [740, 390], [900, 380], [1200, 420]]];
export const HILL = 'M-400 480 L0 470 C 200 430, 380 470, 560 430 S 900 380, 1200 420 L1600 440 V1200 H-400 Z';
// The near ground (the last band). The falls' rocks stand on it.
const GROUND_CURVES = [[[0, 610], [250, 580], [500, 640], [760, 600]], [[760, 600], [1020, 560], [1050, 560], [1200, 590]]];
export const GROUND = 'M-400 620 L0 610 C 250 580, 500 640, 760 600 S 1050 560, 1200 590 L1600 600 V1200 H-400 Z';

// The falls group (both rocks, the notch, the sheet and the pool) sits this far
// below where the round's prototype had it, so the rocks stand on the ground.
export const FALLS_DROP = 12.5;

// Main stream: from behind the hill's crest, down under the bridge (628, 505), past
// the junction and out at the bottom edge. The first key is behind the crest.
const MAIN_KEYS = [
  [594, 408], [597, 424], [600, 440], [607, 457], [617, 474], [624, 490],
  [628, 505], [634, 548], [637, 600], [631, 650], [622, 694], [611, 742], [609, 800],
  [619, 870], [612, 950], [603, 1040],
];
// Side stream: out of the pool's front lip at the waterfall's foot, down the hill leftwards,
// into the main stream below the bridge.
const SIDE_KEYS = [
  [1058.5, 545], [1044, 553], [1024, 563], [994, 578.5], [964, 594.5], [928, 609.8], [880, 614.5], [832, 611.4], [788, 617],
  [748, 631], [712, 649], [678, 666], [648, 684], [622, 702],
];

// Width (map units) by depth: narrow at the hill's crest, widest at the bottom.
const MAIN_WIDTH = [[422, 8], [450, 13], [478, 19], [505, 25], [600, 29], [676, 30], [740, 38], [880, 44], [1060, 48]];
const SIDE_WIDTH = [[546, 10], [624, 12], [702, 15]];

// The near ground rises in front of the falls and hides the rocks' feet along a level
// edge at about this height (`RISE` in journey-hike.js).
export const RISE_LEVEL = 526;
// The pool at the fall rock's foot, seen low (about 4.4:1). Its back runs along the rock's
// foot, drawn a little over it so no ground shows between rock and water, and curves down
// to the pool's two ends, where the rock's foot comes down to meet it (`RISE` dips there),
// so the rock stands round the back of the water like a bowl. Its front is rounded. POOL_SHORE is its one outline: both water renderers, the
// foam and the trees' keep-clear use it. POOL_BANK is the bank's share at each of its
// points: none along the rock or where the side stream leaves, the full bank band round
// the rest of the front.
const POOL_BACK = RISE_LEVEL - 2.4;
const POOL_CORNER = 9; // how far the back curves down to the pool's two ends
const POOL_FRONT = 16; // from the ends' level to the front lip
export const POOL = { cx: 1085, cy: POOL_BACK + (POOL_CORNER + POOL_FRONT) / 2, rx: 55, ry: (POOL_CORNER + POOL_FRONT) / 2, ends: POOL_BACK + POOL_CORNER };
export const POOL_SHORE = Array.from({ length: 96 }, (_, i) => {
  const angle = (i / 96) * Math.PI * 2;
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  // Front (s > 0) a little squarer than an ellipse, so it stays full out to the ends;
  // back flatter than an ellipse, curving down mostly near the ends.
  const x = POOL.cx + POOL.rx * Math.sign(c) * Math.abs(c) ** 0.8;
  return [x, POOL.ends + (s > 0 ? POOL_FRONT * s ** 0.8 * (1 + 0.04 * Math.sin(angle * 3 + 0.8)) : -POOL_CORNER * (-s) ** 0.6)];
});
// The fall pours from the floor of a notch in the rock's top and drops straight into
// the back of the pool, a few units in front of the rock, ending inside the water. A
// little wider at the lip, then narrower, then wider again at the foot. The notch and
// the darker channel in the rock behind it follow the sheet's edges, `margin` outside
// them on both sides.
export const FALL = { top: 391 + FALLS_DROP, bottom: POOL_BACK + 8.5, lip: [1066, 1102], neck: [1070, 1098], neckAt: 0.12, foot: [1066, 1102], margin: 3.5 };
export const IMPACT = [1084, POOL_BACK + 7];

/** The fall's left and right edges at `f` (0 at the lip, 1 at the foot). */
export function fallEdges(f) {
  const { lip, neck, neckAt, foot } = FALL;
  if (f <= neckAt) {
    const u = f / neckAt;
    const e = u * u * (3 - 2 * u);
    return [lip[0] + (neck[0] - lip[0]) * e, lip[1] + (neck[1] - lip[1]) * e];
  }
  const u = (f - neckAt) / (1 - neckAt);
  return [neck[0] + (foot[0] - neck[0]) * u, neck[1] + (foot[1] - neck[1]) * u];
}

// Mirror Lake: in the land below the dip in the skyline, seen at a low angle (about
// 5:1), with an uneven shore. Clockwise on screen from the west end: near shore, east
// end, far shore. The trail ends at the near shore's west part.
const LAKE_KEYS = [
  [888, 291], [898, 299], [914, 305], [936, 309], [962, 311], [990, 310], [1012, 313], [1040, 314], [1068, 311],
  [1092, 305], [1110, 298], [1118, 289], [1112, 280], [1094, 274], [1068, 271], [1046, 273], [1024, 270],
  [998, 268], [968, 270], [942, 274], [916, 279], [898, 285],
];

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
  const mix = (a, b, ta, tb, t) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
  for (let i = 1; i < pts.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let j = 1; j <= perSegment; j += 1) {
      const t = t1 + (t2 - t1) * (j / perSegment);
      const a1 = mix(p0, p1, 0, t1, t);
      const a2 = mix(p1, p2, t1, t2, t);
      const a3 = mix(p2, p3, t2, t3, t);
      out.push(mix(mix(a1, a2, 0, t2, t), mix(a2, a3, t1, t3, t), t1, t2, t));
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

// The same spline through a closed loop of keys, evenly resampled; no repeated end point.
function closedCurve(keys, spacing) {
  const n = keys.length;
  const perSegment = 24;
  const open = spline([keys[n - 2], keys[n - 1], ...keys, keys[0], keys[1]], perSegment);
  // Keep the part from the first key round to the first key again.
  const loop = open.slice(2 * perSegment, (n + 2) * perSegment + 1);
  const even = resample(loop, spacing).map(({ x, y }) => [x, y]);
  if (Math.hypot(even[0][0] - even[even.length - 1][0], even[0][1] - even[even.length - 1][1]) < spacing * 0.5) even.pop();
  return even;
}

/** A closed outline moved inwards by `inset` map units (negative moves it out), or by `inset(i)` at point i. */
export function insetLoop(points, inset) {
  const by = typeof inset === 'function' ? inset : () => inset;
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % n];
    area += ax * by - bx * ay;
  }
  const turn = Math.sign(area) || 1;
  return points.map((p, i) => {
    const a = points[(i + n - 1) % n];
    const b = points[(i + 1) % n];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    // Inward normal: to the left of travel for a positive (clockwise on screen) loop.
    return [p[0] - (b[1] - a[1]) / length * turn * by(i), p[1] + (b[0] - a[0]) / length * turn * by(i)];
  });
}

export const LAKE_SHORE = closedCurve(LAKE_KEYS, 3);
export const LAKE = (() => {
  const xs = LAKE_SHORE.map(p => p[0]);
  const ys = LAKE_SHORE.map(p => p[1]);
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { cx: (left + right) / 2, cy: (top + bottom) / 2, rx: (right - left) / 2, ry: (bottom - top) / 2 };
})();
export const LAKE_RINGS = [[952, 291], [1046, 290]];

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
    sample.nx = -(b.y - a.y) / length;
    sample.ny = (b.x - a.x) / length;
    // A little slow variation, so the banks never run as parallel as a road's.
    sample.w = table(widths, sample.y) * (1 + wobble * Math.sin(sample.s / 41 + 0.7 + phase) + wobble * 0.6 * Math.sin(sample.s / 17 + 2.3 + phase));
    // Depth, not width, sets the perspective: both streams share it.
    sample.scale = table(MAIN_WIDTH, sample.y) / 30;
    if (i) flow += (sample.s - samples[i - 1].s) / Math.max(0.15, (sample.scale + samples[i - 1].scale) / 2);
    sample.flow = flow;
  });
  return { samples, flowLength: flow };
}

export const MAIN = buildStream(MAIN_KEYS, MAIN_WIDTH);
export const SIDE = buildStream(SIDE_KEYS, SIDE_WIDTH, { wobble: 0.05, phase: 1.9 });
export const STREAMS = [SIDE, MAIN];

const smooth = (a, b, x) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
// Where the side stream leaves the pool: the first point of its middle line outside the
// pool's outline, and a radius round it in which neither the pool nor the stream draws a
// bank, so the two waters run into each other.
const insidePool = (x, y) => {
  let inside = false;
  for (let i = 0, j = POOL_SHORE.length - 1; i < POOL_SHORE.length; j = i, i += 1) {
    const [[xi, yi], [xj, yj]] = [POOL_SHORE[i], POOL_SHORE[j]];
    if ((yi > y) !== (yj > y) && x < xi + (xj - xi) * (y - yi) / (yj - yi)) inside = !inside;
  }
  return inside;
};
const mouth = SIDE.samples.find(p => !insidePool(p.x, p.y));
export const POOL_MOUTH = [mouth.x, mouth.y, mouth.w * 0.8];
export const POOL_BANK = POOL_SHORE.map(([x, y]) => smooth(POOL.ends - 1, POOL.ends + 5, y)
  * smooth(POOL_MOUTH[2] * 0.6, POOL_MOUTH[2] * 1.6, Math.hypot(x - POOL_MOUTH[0], y - POOL_MOUTH[1])));

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

// A band's top edge as a polyline, for its height at any x.
function edgeLine(curves) {
  const points = [];
  for (const [a, b, c, d] of curves) {
    for (let i = points.length ? 1 : 0; i <= 120; i += 1) {
      const t = i / 120;
      const u = 1 - t;
      const mix = k => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k];
      points.push([mix(0), mix(1)]);
    }
  }
  return x => {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      if (x <= x1) {
        const [x0, y0] = points[i - 1];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return points[points.length - 1][1];
  };
}

/** The green hill's crest height at `x` (water above it is behind the hill). */
export const hillCrestY = edgeLine(HILL_CURVES);
/** The near ground's edge at `x`: a rock standing on the ground has its base below it. */
export const groundY = edgeLine(GROUND_CURVES);
// Three points on the crest around the stream's source, for the shaders' clip.
export const SOURCE_CREST = [-30, 0, 30].map(dx => [MAIN_KEYS[1][0] + dx, hillCrestY(MAIN_KEYS[1][0] + dx)]);

/** Circles [x, y, radius] that trees and labels keep clear of. */
export function keepClear(margin = 12) {
  const spots = [];
  for (const stream of STREAMS) {
    stream.samples.forEach((p, i) => { if (i % 4 === 0 && p.y > hillCrestY(p.x)) spots.push([p.x, p.y, p.w / 2 + margin]); });
  }
  POOL_SHORE.forEach((p, i) => { if (i % 3 === 0) spots.push([p[0], p[1], margin + 2]); });
  LAKE_SHORE.forEach((p, i) => { if (i % 4 === 0) spots.push([p[0], p[1], margin + 4]); });
  return spots;
}

/** The SVG layout transform for a box of `width` x `height` (preserveAspectRatio xMidYMid meet). */
export function fit(width, height) {
  const k = Math.min(width / VIEW.width, height / VIEW.height);
  return { k, ox: (width - VIEW.width * k) / 2, oy: (height - VIEW.height * k) / 2 };
}

/**
 * A trail drawn as absolute `M`, `C` and `S` commands, sampled finely enough to find the point at any
 * fraction of its length without asking the page (the browser's own lookups are slow). Fractions match
 * the browser's, so a figure placed here stands at the tip of a dash drawn there.
 */
export function pathTrack(d, perCurve = 48) {
  const xs = [];
  const ys = [];
  let [x, y] = [0, 0];
  let control = null;
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    for (let i = 1; i <= perCurve; i += 1) {
      const t = i / perCurve;
      const u = 1 - t;
      xs.push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3);
      ys.push(u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
    }
    control = [x2, y2];
    [x, y] = [x3, y3];
  };
  for (const [, command, args] of d.matchAll(/([MCS])([^MCS]*)/g)) {
    const n = args.match(/-?\d*\.?\d+/g).map(Number);
    if (command === 'M') { [x, y] = n; xs.push(x); ys.push(y); control = null; }
    if (command === 'C') for (let i = 0; i < n.length; i += 6) cubic(...n.slice(i, i + 6));
    if (command === 'S') {
      for (let i = 0; i < n.length; i += 4) {
        const [cx, cy] = control ? [2 * x - control[0], 2 * y - control[1]] : [x, y];
        cubic(cx, cy, ...n.slice(i, i + 4));
      }
    }
  }
  const at = new Float64Array(xs.length);
  for (let i = 1; i < xs.length; i += 1) at[i] = at[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  const length = at[at.length - 1];
  /** The point at `fraction` (0 to 1) of the way along. */
  const point = fraction => {
    const s = Math.max(0, Math.min(1, fraction)) * length;
    let [lo, hi] = [0, at.length - 1];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (at[mid] <= s) lo = mid; else hi = mid; }
    const u = (s - at[lo]) / (at[hi] - at[lo] || 1);
    return { x: xs[lo] + (xs[hi] - xs[lo]) * u, y: ys[lo] + (ys[hi] - ys[lo]) * u };
  };
  return { length, point };
}
