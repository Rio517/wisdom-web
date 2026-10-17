// Drawing for the Lesson 2 paper frames: Maya's life map in Lesson 1's map language,
// footprints, Maya, the elephant placeholder and the small scenes. Every drawing is SVG in
// pixel units (the viewBox is the stage's own size), so text keeps its real size.
// Flat: uniform strokes, token colours and Lesson 1's map mixes, no shadows or volume.
import { person, ICONS } from '../../src/lessons/choices/journey-icons.js';
import { TAIL, AHEAD, LIVED, GRAY, DOT, RING, mix } from '../../src/lessons/choices/journey-life-draw.js';
import { FOREST, SAGE, MIST, CLAY, SUN } from '../../src/lessons/choices/journey-colors.js';

export const INK = '#23302d';
export const QUIET = '#5a6961';
export const RULE = '#dbe2da';
export const PAPER = '#fbfbf8';
export const PAPER_DEEP = '#f2f5f0';
export const LAKE = '#5f8fa3';
export const LAKE_SOFT = '#d6e6ea';
export const CLAY_SOFT = '#f1e2d8';
export const SUN_SOFT = '#f7ead0';
export const WOOD = '#8a5a33';
export { FOREST, SAGE, MIST, CLAY, SUN, TAIL, AHEAD };

const f = v => +v.toFixed(1);
export const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const svg = (w, h, body, extra = '') => `<svg class="pic" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

/** A label in the map's style: forest, semibold, a ring of map colour so it reads over lines. */
export function label(x, y, text, { size = 15, color = FOREST, anchor = 'start', weight = 600, halo = PAPER_DEEP, family = 'guide' } = {}) {
  const font = family === 'field' ? 'var(--font-field)' : 'var(--font-guide)';
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" style="font: ${weight} ${size}px ${font}" fill="${color}"
    ${halo ? `stroke="${halo}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"` : ''}>${esc(text)}</text>`;
}

// ——— Curves ———
/** A smooth path through points (Catmull-Rom as cubic Béziers). */
export function smooth(points) {
  if (points.length < 2) return '';
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]; const p1 = points[i]; const p2 = points[i + 1]; const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
/** Points along the same Catmull-Rom curve, for footprints and lenses. */
export function sampleSmooth(points, per = 24) {
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]; const p1 = points[i]; const p2 = points[i + 1]; const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < per; k += 1) {
      const t = k / per; const u = 1 - t;
      out.push([0, 1].map(a => u * u * u * p1[a] + 3 * u * u * t * c1[a] + 3 * u * t * t * c2[a] + t * t * t * p2[a]));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
const bezier = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)} C${f(x0 + (x1 - x0) * 0.5)} ${f(y0)} ${f(x1 - (x1 - x0) * 0.5)} ${f(y1)} ${f(x1)} ${f(y1)}`;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ——— Maya's life map ———
export const MAX_AGE = 20;
// Maya's lived route in ages and heights (0 top, 1 bottom of the plot): level to school, then a long
// gentle climb through the soccer seasons, a small bend where basketball begins, today at twelve.
const ROUTE = [[0, 0.56], [2, 0.57], [3.5, 0.6], [5, 0.6], [6.5, 0.6], [8, 0.58], [9, 0.555], [10, 0.525], [11, 0.48], [11.5, 0.44], [12, 0.41]];
export const TODAY = 12;
export const MARKS = [
  { age: 0, key: 'born', side: -1 },
  { age: 5, key: 'school', side: 1 },
  { age: 8, key: 'team', side: 1 },
  { age: 11, key: 'basket', side: -1 },
];
const GRAY_STARTS = [[0.8, -1], [1.6, 1], [2.6, -1], [3.4, 1], [4.4, -1], [5, 1], [6, -1], [6.8, 1], [7.5, -1], [8, 1], [8.8, -1], [9.6, 1], [10.4, -1], [11, 1], [11.6, -1]];

/** The plot's frame for a stage of w × h. */
export function mapFrame(w, h, { left = 64, right = 30, top = 46, bottom = 64 } = {}) {
  const x = age => left + (age / MAX_AGE) * (w - left - right);
  const y = height => top + height * (h - top - bottom);
  return { w, h, x, y, left, right, top, bottom, xy: ([age, height]) => [x(age), y(height)] };
}
const routeAt = age => {
  for (let i = 0; i < ROUTE.length - 1; i += 1) {
    if (age <= ROUTE[i + 1][0]) { const t = (age - ROUTE[i][0]) / (ROUTE[i + 1][0] - ROUTE[i][0]); return ROUTE[i][1] + t * (ROUTE[i + 1][1] - ROUTE[i][1]); }
  }
  return ROUTE[ROUTE.length - 1][1];
};
export const routePoints = frame => ROUTE.map(frame.xy);
/** Points of the lived route between two ages, densely sampled, in the frame's pixels. */
export function routeStretch(frame, from, to) {
  return sampleSmooth(routePoints(frame), 40).filter(([px]) => px >= frame.x(from) - 0.01 && px <= frame.x(to) + 0.01);
}

/** Gray untaken branches and sage futures, as a seeded forward-only network. */
function branchField(frame, seed = 7) {
  const random = rng(seed);
  const gray = []; const ahead = [];
  const grow = (age, height, dir, depth, list, odds) => {
    if (age >= MAX_AGE + 1.5 || depth > 3) return;
    const span = 1.6 + random() * 2.6;
    const rise = dir * (0.05 + random() * 0.11) / (depth * 0.6 + 1);
    const end = Math.max(0.04, Math.min(0.96, height + rise));
    const toAge = Math.min(MAX_AGE + 1.5, age + span);
    list.push({ d: bezier(frame.x(age), frame.y(height), frame.x(toAge), frame.y(end)), depth });
    if (random() < odds[0]) grow(toAge, end, dir, depth + 1, list, odds);
    if (random() < odds[1]) grow(toAge, end, -dir, depth + 1, list, odds);
  };
  for (const [age, dir] of GRAY_STARTS) grow(age, routeAt(age), dir, 0, gray, [0.62, 0.5]);
  const todayHeight = routeAt(TODAY);
  [[-1, 0.13], [1, 0.02], [1, 0.14]].forEach(([dir, lift]) => {
    const toAge = TODAY + 2.2 + random() * 1.2; const end = todayHeight + dir * lift;
    ahead.push({ d: bezier(frame.x(TODAY), frame.y(todayHeight), frame.x(toAge), frame.y(end)), depth: 0 });
    grow(toAge, end, dir, 1, ahead, [0.7, 0.35]);
  });
  return { gray, ahead };
}

let maskId = 0;
/** Maya's whole map: axis, gray field, futures, the lived route, dots and labels.
 *  `words` gives the label text by key; `stretch` draws the route between two ages as small footprints;
 *  `fieldOnly` keeps just the gray paths (for the hero lens); `thin` keeps strokes at screen width
 *  when the map is drawn scaled (a mini map or a lens), with `grayWidth` for the lens. */
export function lifeMap(frame, words, { labels = true, axisLabels = labels, futures = true, stretch = null, extra = '', seed = 7, fieldOnly = false, thin = false, grayWidth = null } = {}) {
  const { w, h, x, y } = frame;
  const field = branchField(frame, seed);
  const id = `edge-fade-${++maskId}`;
  const fadeFrom = x(MAX_AGE - 2.5) / w;
  const ve = thin ? ' vector-effect="non-scaling-stroke"' : '';
  const axis = [5, 10, 15, 20].map(age => `<path d="M${f(x(age))} ${frame.top - 24}V${h - frame.bottom + 8}" stroke="${RULE}" stroke-width="1.5" stroke-dasharray="1.5 6" stroke-linecap="round"${ve}/>
      ${axisLabels ? label(x(age), h - 24, String(age), { color: QUIET, anchor: 'middle', halo: null, weight: 500 }) : ''}`).join('');
  const grays = field.gray.map(b => `<path d="${b.d}" stroke="${b.depth === 0 ? MIST : TAIL}" stroke-width="${grayWidth ?? (b.depth === 0 ? GRAY : GRAY - 0.4)}" fill="none" stroke-linecap="round"${ve}/>`).join('');
  const aheads = futures ? field.ahead.map(b => `<path d="${b.d}" stroke="${AHEAD}" stroke-width="${b.depth === 0 ? 3.4 : 2.6}" fill="none" stroke-linecap="round"${ve}/>`).join('') : '';
  const mask = `<defs><linearGradient id="${id}-g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="white"/><stop offset="${f(fadeFrom * 100) / 100}" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
      <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#${id}-g)"/></mask></defs>`;
  if (fieldOnly) return `${mask}${axis}<g mask="url(#${id})">${grays}</g>`;
  const pts = routePoints(frame);
  const line = list => `<path d="M${list.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}" stroke="${FOREST}" stroke-width="${LIVED}" fill="none" stroke-linecap="round" stroke-linejoin="round"${ve}/>`;
  let route;
  if (stretch) {
    const dense = sampleSmooth(pts, 40);
    route = `${line(dense.filter(([px]) => px <= x(stretch[0])))}${line(dense.filter(([px]) => px >= x(stretch[1])))}${footprints(routeStretch(frame, stretch[0], stretch[1]), { size: 0.5, step: 10, side: 3.4 })}`;
  } else {
    route = `<path d="${smooth(pts)}" stroke="${FOREST}" stroke-width="${LIVED}" fill="none" stroke-linecap="round" stroke-linejoin="round"${ve}/>`;
  }
  const dots = MARKS.map(m => `<circle cx="${f(x(m.age))}" cy="${f(y(routeAt(m.age)))}" r="${DOT + RING}" fill="${PAPER_DEEP}"/><circle cx="${f(x(m.age))}" cy="${f(y(routeAt(m.age)))}" r="${DOT}" fill="${FOREST}"/>`).join('');
  const today = [x(TODAY), y(routeAt(TODAY))];
  const todayDot = `<circle cx="${f(today[0])}" cy="${f(today[1])}" r="13" fill="${FOREST}" fill-opacity=".1"/><circle cx="${f(today[0])}" cy="${f(today[1])}" r="7" fill="${FOREST}"/>`;
  const markLabels = labels ? MARKS.map(m => {
    const px = x(m.age); const py = y(routeAt(m.age));
    const anchor = m.age === 0 ? 'start' : 'middle';
    return label(m.age === 0 ? px - 6 : px, py + (m.side < 0 ? -18 : 34), words[m.key], { anchor });
  }).join('') : '';
  return `${mask}${axis}${axisLabels ? label(frame.left - 40, h - 24, words.axis, { color: QUIET, halo: null, weight: 600 }) : ''}
    <g mask="url(#${id})">${grays}${aheads}</g>${route}${dots}${todayDot}${markLabels}${extra}`;
}
export const routeHeightAt = routeAt;

/** The rectangle round the soccer years on a map frame; with `aspect`, its width over height. */
export function stretchBox(frame, from = 8.2, to = 10.4, aspect = null) {
  const ys = routeStretch(frame, from, to).map(p => p[1]);
  const pad = 16;
  let bw = frame.x(to) - frame.x(from) + pad * 2;
  let bh = Math.max(...ys) - Math.min(...ys) + pad * 2 + 12;
  if (aspect) { if (bw / bh > aspect) bh = bw / aspect; else bw = bh * aspect; }
  const cx = (frame.x(from) + frame.x(to)) / 2; const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

// ——— Footprints ———
// One child's shoe print, toe towards +x, about 26 units long: a sole and a heel, flat.
const PRINT = 'M-11.4 0C-11.4 -3.6 -8.8 -4.6 -6 -4.4C-3.4 -4.2 -1.6 -3.3 .8 -4.7C4.6 -6.8 13.4 -6.4 13.8 0C13.4 6.4 4.6 6.8 .8 4.7C-1.6 3.3 -3.4 4.2 -6 4.4C-8.8 4.6 -11.4 3.6 -11.4 0Z';
/** One print at a placed spot (from `footprints(..., { at })`), filled or as a dashed outline. */
export function printAt(p, { size = 1, color = FOREST, outline = null } = {}) {
  const deg = p.angle * 180 / Math.PI + (p.index % 2 ? 1 : -1) * 5;
  const place = `transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(deg)}) scale(${size})"`;
  return outline
    ? `<path d="${PRINT}" ${place} fill="none" stroke="${outline}" stroke-width="${f(1.8 / size)}" stroke-dasharray="${f(3.2 / size)} ${f(2.6 / size)}"/>`
    : `<path d="${PRINT}" ${place} fill="${color}"/>`;
}
/** Footprints along a polyline: one every `step` px, alternating sides. Returns SVG; `at` collects every spot,
 *  drawn or not; `count` stops drawing after that many; `skip` leaves spots empty (a rest day). */
export function footprints(points, { size = 1, step = 26, side = 8, color = FOREST, count = Infinity, outline = null, at = null, skip = new Set() } = {}) {
  let out = ''; let travelled = 0; let next = step * 0.5; let index = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]; const [x1, y1] = points[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    while (seg > 0 && travelled + seg >= next) {
      const t = (next - travelled) / seg;
      const px = x0 + (x1 - x0) * t; const py = y0 + (y1 - y0) * t;
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const s = index % 2 ? 1 : -1;
      const spot = { x: px - Math.sin(angle) * side * s, y: py + Math.cos(angle) * side * s, angle, index, cx: px, cy: py };
      if (at) at.push(spot);
      if (index < count && !skip.has(index)) out += printAt(spot, { size, color, outline });
      index += 1; next += step;
    }
    travelled += seg;
  }
  return out;
}

// ——— Figures and things ———
/** Maya (Lesson 1's figure, journey-icons.js), feet at (x, y), `height` px tall. */
export function maya(x, y, height, { shirt = FOREST, ball = true, flip = false } = {}) {
  const inner = person({ shirt, ball }).replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const s = height / 62;
  const width = (ball ? 60 : 47) * s;
  return `<g transform="translate(${f(flip ? x + width * 0.42 : x - width * 0.42)} ${f(y - 61.5 * s)}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
}
/** The elephant's stand-in: a plain gray shape, never mentioned. The real art comes from asset-studio. */
export function elephant(x, y, height = 46) {
  const s = height / 46;
  return `<g class="elephant-placeholder" transform="translate(${f(x)} ${f(y)}) scale(${f(s * 100) / 100})" fill="${MIST}">
    <ellipse cx="0" cy="-22" rx="22" ry="16"/><circle cx="21" cy="-28" r="12"/><circle cx="15" cy="-28" r="8" fill="${TAIL}"/>
    <path d="M30 -24C35 -18 35 -9 32 -4" stroke="${MIST}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="-16" y="-12" width="9" height="12" rx="3"/><rect x="5" y="-12" width="9" height="12" rx="3"/></g>`;
}
export const ground = (w, y, h) => `<rect x="0" y="${f(y)}" width="${w}" height="${f(h)}" fill="${SAGE}" fill-opacity=".22"/><path d="M0 ${f(y)}H${w}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>`;
export const goal = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 0V-58H96V0" stroke="white" stroke-width="7"/><path d="M0 0V-58H96V0" stroke="${INK}" stroke-width="2"/>
    <path d="M10 -50L18 -6M30 -52L34 -6M50 -52V-6M70 -52L66 -6M88 -50L80 -6M6 -38H92M6 -22H90" stroke="${MIST}" stroke-width="1.5"/></g>`;
export const cone = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-9 0L-3 -20H3L9 0Z" fill="${SUN}"/><path d="M-12 0H12" stroke="${SUN}" stroke-width="3" stroke-linecap="round"/><path d="M-5.6 -9H5.6" stroke="white" stroke-width="2.4"/></g>`;
export const rainCloud = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-34 0A16 16 0 0 1 -26 -30A22 22 0 0 1 14 -36A18 18 0 0 1 38 -4A10 10 0 0 1 30 0Z" fill="${LAKE}"/>
    ${[-24, -8, 8, 24].map((dx, i) => `<path d="M${dx} 10L${dx - 6} ${26 + (i % 2) * 8}" stroke="${LAKE}" stroke-width="3" stroke-linecap="round"/>`).join('')}
    ${[-16, 0, 16].map(dx => `<path d="M${dx} 38L${dx - 6} 54" stroke="${LAKE}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`;
export const wall = (x, y, w = 120, h = 96) => {
  let bricks = '';
  for (let row = 0; row * 16 < h; row += 1) {
    const yy = y - h + row * 16;
    bricks += `<path d="M${x} ${yy}H${x + w}" stroke="${CLAY}" stroke-opacity=".45" stroke-width="1.5"/>`;
    for (let bx = (row % 2) * 20; bx < w; bx += 40) bricks += `<path d="M${x + bx} ${yy}V${yy + 16}" stroke="${CLAY}" stroke-opacity=".45" stroke-width="1.5"/>`;
  }
  return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${CLAY_SOFT}"/>${bricks}<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="none" stroke="${CLAY}" stroke-opacity=".6" stroke-width="1.5"/>`;
};
export const bench = (x, y) => `<g fill="${WOOD}"><rect x="${x}" y="${y - 26}" width="92" height="7" rx="3"/><rect x="${x + 8}" y="${y - 19}" width="6" height="19" rx="2"/><rect x="${x + 78}" y="${y - 19}" width="6" height="19" rx="2"/></g>`;
export const flag = (x, y, color = SAGE) => `<path d="M${x} ${y}V${y - 46}" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="M${x + 1.5} ${y - 46}L${x + 26} ${y - 38}L${x + 1.5} ${y - 30}Z" fill="${color}"/>`;
export const hoop = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <rect x="-4" y="-150" width="8" height="150" rx="3" fill="${QUIET}"/><rect x="-36" y="-176" width="72" height="48" rx="5" fill="white" stroke="${INK}" stroke-width="2"/>
    <rect x="-14" y="-160" width="28" height="20" fill="none" stroke="${INK}" stroke-width="1.5"/>
    <path d="M-18 -134H18" stroke="${CLAY}" stroke-width="4" stroke-linecap="round"/><path d="M-16 -132L-10 -112H10L16 -132M-6 -132L-4 -112M6 -132L4 -112" stroke="${MIST}" stroke-width="1.5" fill="none"/></g>`;
export const basketball = (x, y, r = 14) => `<svg x="${f(x - r)}" y="${f(y - r)}" width="${2 * r}" height="${2 * r}" viewBox="7 7 34 34">${ICONS.basketball.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
export const chalkboard = (x, y) => `<rect x="${x - 70}" y="${y - 150}" width="140" height="96" rx="8" fill="#1d3f31"/><rect x="${x - 70}" y="${y - 150}" width="140" height="96" rx="8" fill="none" stroke="${WOOD}" stroke-width="5"/>
    <path d="M${x - 46} ${y - 124}h18M${x - 37} ${y - 133}v18M${x - 16} ${y - 120}l10 -8m-10 0l10 8M${x + 10} ${y - 124}h28M${x - 46} ${y - 88}q12 -22 24 0t24 0t24 0" stroke="white" stroke-opacity=".85" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="${x - 6}" y="${y - 54}" width="12" height="54" fill="${WOOD}"/><path d="M${x - 40} ${y}L${x - 6} ${y - 40}M${x + 40} ${y}L${x + 6} ${y - 40}" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>`;
export const lift = mix;
