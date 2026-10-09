// Version A: flat water in Canvas 2D. Layered flat fills (a darker bank, a
// lighter body) and slow flat motion: light dashes drifting downstream, streaks
// falling down the sheet, rings on the pool and the lake. Its still frame is
// also what versions B and C show when WebGL is not available, so it follows
// every change to their shapes.
import { MAIN, SIDE, STREAMS, POOL, LAKE_SHORE, FALL, IMPACT, LAKE_RINGS, HILL, bankWidth, outline, insetLoop, fallEdges, fit } from './geometry.js';
import { waterColors, cssColor } from './water-colors.js';

const TAU = Math.PI * 2;
const polygon = points => {
  const path = new Path2D();
  points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
  path.closePath();
  return path;
};
const ellipse = (cx, cy, rx, ry) => {
  const path = new Path2D();
  path.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  return path;
};
const fallEdge = (y, side) => fallEdges(Math.max(0, Math.min(1, (y - FALL.top) / (FALL.bottom - FALL.top))))[side < 0 ? 0 : 1];
// The sheet's outline, inset from its sides by `inset` and starting `top` below the lip.
const fallOutline = (inset, top = 0) => {
  const rows = Array.from({ length: 17 }, (_, i) => FALL.top + top + (FALL.bottom - FALL.top - top) * (i / 16));
  return [...rows.map(y => [fallEdge(y, -1) + inset, y]), ...rows.reverse().map(y => [fallEdge(y, 1) - inset, y])];
};

// Drift speed downstream, in near map units per second. The walkers move at about 130.
export const FLOW_SPEED = 24;
// Dash lanes across a stream: position across (-1..1), period and dash length (flow units), phase.
const LANES = [
  { across: -0.5, period: 132, dash: 20, phase: 0, minWidth: 11 },
  { across: 0.04, period: 158, dash: 30, phase: 61, minWidth: 0 },
  { across: 0.46, period: 118, dash: 16, phase: 97, minWidth: 11 },
];
const FALL_COLUMNS = [0.2, 0.42, 0.6, 0.8];

export function createFlatWater(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const colors = waterColors();
  const fill = name => cssColor(colors[name]);
  // The main stream is clipped to the green hill, so it starts at the hill's crest.
  const hill = new Path2D(HILL);
  const streams = STREAMS.map(stream => ({
    stream,
    clip: stream === MAIN,
    bank: polygon(outline(stream)),
    body: polygon(outline(stream, p => bankWidth(p.w))),
    flows: Float32Array.from(stream.samples, p => p.flow),
  }));
  const poolBank = bankWidth(POOL.ry * 2) * 0.8;
  const fallShape = polygon(fallOutline(0));
  const fallBody = polygon(fallOutline(1.4, 1.2));
  const lakeShore = polygon(LAKE_SHORE);
  const lakeBody = polygon(insetLoop(LAKE_SHORE, 3.2));
  const poolBody = ellipse(POOL.cx, POOL.cy, POOL.rx - poolBank, POOL.ry - poolBank);
  // Pool rings stay off the sheet: the pool's body less the fall (even-odd).
  const poolRingClip = new Path2D();
  poolRingClip.addPath(poolBody);
  poolRingClip.addPath(fallShape);

  const cache = document.createElement('canvas');
  const cacheCtx = cache.getContext('2d');
  let view = null;

  const toMap = context => {
    const { k, ox, oy, sx, sy } = view;
    context.setTransform(k * sx, 0, 0, k * sy, ox * sx, oy * sy);
  };

  function drawStatic(c) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cache.width, cache.height);
    toMap(c);
    // Every bank first, then every body, so the side stream and the pool join the
    // main stream without a bank line across the water.
    for (const layer of ['bank', 'body']) {
      c.fillStyle = fill(layer === 'bank' ? 'bank' : 'body');
      for (const piece of streams) {
        c.save();
        if (piece.clip) c.clip(hill);
        c.fill(piece[layer]);
        c.restore();
      }
      c.fill(layer === 'bank' ? ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry) : poolBody);
    }
    // The fall's sheet over the pool, so the pool's far rim never shows through its foot.
    c.fillStyle = fill('bank');
    c.fill(fallShape);
    c.fillStyle = fill('fall');
    c.fill(fallBody);
    // White water where it lands, spreading out over the pool.
    c.fillStyle = fill('foam');
    c.fill(ellipse(IMPACT[0], IMPACT[1] + 1.5, 23, 5));
    c.fill(ellipse(IMPACT[0] - 30, IMPACT[1] + 4.5, 7, 1.9));
    c.fill(ellipse(IMPACT[0] + 31, IMPACT[1] + 5, 8, 1.9));
    c.fill(ellipse(IMPACT[0] - 12, IMPACT[1] + 8, 6, 1.4));
    // Mirror Lake.
    c.fillStyle = fill('bank');
    c.fill(lakeShore);
    c.fillStyle = fill('body');
    c.fill(lakeBody);
  }

  // Index of the first sample at or after a flow distance.
  const indexAt = (flows, value) => {
    let lo = 0;
    let hi = flows.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (flows[mid] < value) lo = mid + 1; else hi = mid;
    }
    return lo;
  };

  function drawDashes(c, piece, time) {
    const { stream, flows } = piece;
    const samples = stream.samples;
    const end = stream === SIDE ? stream.flowLength - 14 : stream.flowLength;
    c.save();
    if (piece.clip) c.clip(hill);
    c.strokeStyle = fill('light');
    c.lineCap = 'round';
    for (const lane of LANES) {
      let start = ((lane.phase + time * FLOW_SPEED) % lane.period) - lane.period;
      for (; start < end; start += lane.period) {
        const a = Math.max(2, start);
        const b = Math.min(end, start + lane.dash);
        if (b <= a) continue;
        const i0 = indexAt(flows, a);
        const i1 = Math.min(samples.length - 1, Math.max(i0 + 1, indexAt(flows, b)));
        const mid = samples[(i0 + i1) >> 1];
        if (mid.w < lane.minWidth) continue;
        c.lineWidth = Math.max(0.9, 1.9 * mid.scale);
        c.beginPath();
        for (let i = i0; i <= i1; i += 1) {
          const p = samples[i];
          const offset = lane.across * Math.max(0, p.w / 2 - bankWidth(p.w) - 1.2);
          const x = p.x + p.nx * offset;
          const y = p.y + p.ny * offset;
          if (i === i0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
    }
    c.restore();
  }

  function drawFall(c, time) {
    c.strokeStyle = fill('foam');
    c.lineCap = 'round';
    c.lineWidth = 1.7;
    const period = 62;
    FALL_COLUMNS.forEach((f, column) => {
      const dash = 18 + column * 4;
      let y = FALL.top + ((column * 23 + time * 22) % period) - period;
      c.beginPath();
      for (; y < FALL.bottom; y += period) {
        const a = Math.max(FALL.top + 3, y);
        const b = Math.min(FALL.bottom - 11, y + dash);
        if (b <= a) continue;
        const xa = fallEdge(a, -1) + (fallEdge(a, 1) - fallEdge(a, -1)) * f;
        const xb = fallEdge(b, -1) + (fallEdge(b, 1) - fallEdge(b, -1)) * f;
        c.moveTo(xa, a);
        c.lineTo(xb, b);
      }
      c.stroke();
    });
  }

  function drawRings(c, time) {
    c.lineWidth = 1.3;
    // Pool: rings spread from where the fall lands.
    c.save();
    c.clip(poolRingClip, 'evenodd');
    for (let i = 0; i < 2; i += 1) {
      const phase = (time / 4.2 + i / 2) % 1;
      c.strokeStyle = cssColor(colors.ring, 0.75 * (1 - phase) * Math.min(1, phase * 6));
      c.beginPath();
      c.ellipse(IMPACT[0], IMPACT[1] + 1, 20 + phase * 30, 5 + phase * 6.5, 0, 0, TAU);
      c.stroke();
    }
    c.restore();
    // Lake: two slow rings, out of step.
    c.save();
    c.clip(lakeBody);
    LAKE_RINGS.forEach(([x, y], i) => {
      const phase = (time / 5.6 + i * 0.45) % 1;
      c.strokeStyle = cssColor(colors.ring, 0.7 * (1 - phase) * Math.min(1, phase * 6));
      c.beginPath();
      c.ellipse(x, y, 4 + phase * 36, 1.2 + phase * 8, 0, 0, TAU);
      c.stroke();
    });
    c.restore();
  }

  return {
    kind: 'flat',
    resize(width, height, dpr) {
      const { k, ox, oy } = fit(width, height);
      for (const target of [canvas, cache]) {
        target.width = Math.max(1, Math.round(width * dpr));
        target.height = Math.max(1, Math.round(height * dpr));
      }
      // Pixels per CSS pixel on each axis, after rounding the buffer to whole pixels.
      view = { k, ox, oy, sx: canvas.width / width, sy: canvas.height / height };
      drawStatic(cacheCtx);
    },
    draw(time) {
      if (!view) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cache, 0, 0);
      toMap(ctx);
      for (const piece of streams) drawDashes(ctx, piece, time);
      drawFall(ctx, time);
      drawRings(ctx, time);
    },
    info: () => ({ kind: 'flat' }),
    dispose() {},
  };
}
