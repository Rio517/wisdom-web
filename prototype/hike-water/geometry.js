// The hike's water, in the map's own units: the SVG viewBox, 1200 x 800, y down.
// Every version draws from these shapes, so only the water's look differs.

export const VIEW = { width: 1200, height: 800 };

// The far ridge (the first background band).
export const FAR_RIDGE = 'M-400 330 L0 330 L90 250 L170 300 L280 170 L380 280 L470 210 L560 300 L700 140 L820 260 L900 190 L1010 250 L1100 160 L1200 240 L1600 300 V1200 H-400 Z';
// The green hill (the third background band). The main stream starts at its crest.
const HILL_CURVES = [[[0, 470], [200, 430], [380, 470], [560, 430]], [[560, 430], [740, 390], [900, 380], [1200, 420]]];
export const HILL = 'M-400 480 L0 470 C 200 430, 380 470, 560 430 S 900 380, 1200 420 L1600 440 V1200 H-400 Z';

// Main stream: from behind the hill's crest, down under the bridge (628, 505), past
// the junction and out at the bottom edge. The first key is behind the crest.
const MAIN_KEYS = [
  [594, 408], [597, 424], [600, 440], [607, 457], [617, 474], [624, 490],
  [628, 505], [634, 548], [637, 600], [631, 650], [622, 694], [611, 742], [609, 800],
  [619, 870], [612, 950], [603, 1040],
];
// Side stream: from the pool at the waterfall's foot, leftwards, into the main stream below the bridge.
const SIDE_KEYS = [
  [1068, 556], [1030, 561], [996, 572], [966, 590], [928, 606], [880, 613], [832, 611], [788, 617],
  [748, 631], [712, 649], [678, 666], [648, 684], [622, 702],
];

// Width (map units) by depth: narrow at the hill's crest, widest at the bottom.
const MAIN_WIDTH = [[422, 8], [450, 13], [478, 19], [505, 25], [600, 29], [676, 30], [740, 38], [880, 44], [1060, 48]];
const SIDE_WIDTH = [[556, 10], [620, 12], [702, 15]];

export const POOL = { cx: 1084, cy: 554, rx: 56, ry: 14 };
// The fall pours from the floor of a notch in the rock's top (y 391) and runs the full
// height into the pool, ending inside its surface. A little wider at the lip, then
// narrower, then wider again at the foot. The notch and the darker channel in the
// rock behind it follow the sheet's edges, `margin` outside them on both sides.
export const FALL = { top: 391, bottom: 551, lip: [1066, 1102], neck: [1070, 1098], neckAt: 0.12, foot: [1066, 1102], margin: 3.5 };
export const IMPACT = [1084, 551];

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

// The same spline through a closed loop of keys, evenly resampled; no repeated end point.
function closedCurve(keys, spacing) {
  const n = keys.length;
  const wrapped = [keys[n - 2], keys[n - 1], ...keys, keys[0], keys[1]];
  const open = spline(wrapped);
  // Keep the part from the first key round to the first key again.
  const perSegment = 24;
  const start = 2 * perSegment;
  const end = start + n * perSegment;
  const loop = open.slice(start, end + 1).map(([x, y]) => [x, y]);
  const even = resample(loop, spacing).map(({ x, y }) => [x, y]);
  if (Math.hypot(even[0][0] - even[even.length - 1][0], even[0][1] - even[even.length - 1][1]) < spacing * 0.5) even.pop();
  return even;
}

/** A closed outline moved inwards by `inset` map units (negative moves it out). */
export function insetLoop(points, inset) {
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
    const tx = (b[0] - a[0]) / length;
    const ty = (b[1] - a[1]) / length;
    // Inward normal: to the left of travel for a positive (clockwise on screen) loop.
    const nx = -ty * turn;
    const ny = tx * turn;
    return [p[0] + nx * inset, p[1] + ny * inset];
  });
}

/** An ellipse as a closed outline. */
export function ellipseLoop({ cx, cy, rx, ry }, segments = 72) {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  });
}

export const LAKE_SHORE = closedCurve(LAKE_KEYS, 3);
export const LAKE = (() => {
  const xs = LAKE_SHORE.map(p => p[0]);
  const ys = LAKE_SHORE.map(p => p[1]);
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { cx: (left + right) / 2, cy: (top + bottom) / 2, rx: (right - left) / 2, ry: (bottom - top) / 2, left, right, top, bottom };
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

// The hill's crest as a polyline, for clipping the stream behind it.
const HILL_CREST = (() => {
  const points = [];
  for (const [a, b, c, d] of HILL_CURVES) {
    for (let i = points.length ? 1 : 0; i <= 120; i += 1) {
      const t = i / 120;
      const u = 1 - t;
      const mix = k => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k];
      points.push([mix(0), mix(1)]);
    }
  }
  return points;
})();

/** The green hill's crest height at `x` (water above it is behind the hill). */
export function hillCrestY(x) {
  if (x <= HILL_CREST[0][0]) return HILL_CREST[0][1];
  for (let i = 1; i < HILL_CREST.length; i += 1) {
    const [x1, y1] = HILL_CREST[i];
    if (x <= x1) {
      const [x0, y0] = HILL_CREST[i - 1];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return HILL_CREST[HILL_CREST.length - 1][1];
}
// Three points on the crest around the stream's source, for the shaders' clip.
export const SOURCE_CREST = [-30, 0, 30].map(dx => [MAIN_KEYS[1][0] + dx, hillCrestY(MAIN_KEYS[1][0] + dx)]);
/** Whether a point of the main stream shows, below the hill's crest. */
export const belowCrest = (x, y) => y > hillCrestY(x);

/** Circles [x, y, radius] that trees and labels keep clear of. */
export function keepClear(margin = 12) {
  const spots = [];
  for (const stream of STREAMS) {
    stream.samples.forEach((p, i) => { if (i % 4 === 0 && belowCrest(p.x, p.y)) spots.push([p.x, p.y, p.w / 2 + margin]); });
  }
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    spots.push([POOL.cx + Math.cos(angle) * POOL.rx * 0.8, POOL.cy + Math.sin(angle) * POOL.ry * 0.8, POOL.ry * 0.2 + margin]);
  }
  LAKE_SHORE.forEach((p, i) => { if (i % 4 === 0) spots.push([p[0], p[1], margin + 4]); });
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
