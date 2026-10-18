// Drawing for Lesson 3's pictures, ported from the approved frames (prototype/lesson3-elephant/scenes.js,
// design 004 v02, lane A): the elephant and its rider (shared/elephant.js, imported unchanged), soft flat
// scenery in the tokens' greens, and the few things a step's example needs. Each picture is SVG in the
// stage's own pixels; its words are HTML laid over it (Lesson 2's .pl-label, practice.css), so they keep
// the 15 px floor. Flat: token colours, uniform strokes, no shadows or volume.
import { elephant, elephantWithRider, rider } from '../shared/elephant.js';
import { person, alfredo, dad } from '../choices/journey-icons.js';
import { escapeHTML } from '../choices/journey-shell.js';
import { svg, textWidth, sampleSmooth, footprints, maya, bench } from '../practice/practice-draw.js';
import { FOREST, SAGE, MIST, CLAY, SUN, INK, QUIET, RULE, PAPER, PAPER_DEEP, LAKE, SUN_SOFT, CELLO as WOOD } from '../choices/journey-colors.js';
import { AHEAD } from '../choices/journey-life-draw.js';

export { svg, maya, bench, alfredo, dad, elephant, rider, FOREST, SAGE, MIST, SUN, INK, QUIET, PAPER, PAPER_DEEP, RULE, LAKE, AHEAD };
export const LAKE_SOFT = '#d6e6ea'; // tokens.css lake-soft
const f = v => +(+v).toFixed(1);

// The colour under the elephant's legs: the stage.
export const GROUND_GAP = 'var(--color-paper-deep)';
// Paths are the lessons' ground colour, sage at 22% on the stage.
export const TRAIL = { color: SAGE, opacity: 0.22 };

// ——— Words: HTML over the drawing ———
let collected = null;
/** Draw `draw()` while collecting its words; returns the SVG markup followed by the words as HTML. */
export function art(draw) {
  collected = [];
  try {
    const markup = draw();
    return `${markup}<div class="pl-labels" aria-hidden="true">${collected.map(labelHTML).join('')}</div>`;
  } finally { collected = null; }
}
function labelHTML(item) {
  const classes = ['pl-label', `is-${item.anchor}`, `at-${item.at}`, item.chip && 'el-chip', item.onWhite && 'is-on-white', item.max && 'can-wrap'].filter(Boolean).join(' ');
  const style = `left:${f(item.x)}px;top:${f(item.y)}px${item.size ? `;font-size:${item.size}px` : ''}${item.max ? `;max-width:${Math.round(item.max)}px` : ''}`;
  return `<span class="${classes}" style="${style}">${item.icon ?? ''}${escapeHTML(item.text)}</span>`;
}
/** A plain label in the lessons' style, its baseline at y (`anchor` start, middle or end). */
export function label(x, y, text, { size = 16, anchor = 'start', onWhite = false, max = 0 } = {}) {
  collected?.push({ x, y, text, size, anchor, at: 'baseline', onWhite, max });
}
/** A label on a white chip, centred on (x, y); `icon` is inline SVG shown before the words. */
export function chip(x, y, text, { size = 16, icon = '' } = {}) {
  collected?.push({ x, y, text, size, anchor: 'middle', at: 'center', chip: true, icon: icon ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg>` : '' });
}
/** A chip's width, for placing it beside a figure. */
export const chipWidth = (text, size = 16, icon = false) => textWidth(text, size, 600) + 26 + (icon ? 26 : 0);

// ——— The pair ———
/**
 * The elephant, feet at (x, y), its body `height` px tall (64 units), facing right. `rider` puts the rider on
 * its neck; `reins` adds the head strap and the slack rein; `gap` is the colour under its legs.
 */
export function pair(x, y, height, { pose = 'stand', rider: withRider = true, reins = false, gap = GROUND_GAP } = {}) {
  const s = height / 64;
  const body = withRider ? elephantWithRider({ pose, reins }) : elephant({ pose });
  return `<g style="--elephant-gap: ${gap}" transform="translate(${f(x)} ${f(y)}) scale(${+s.toFixed(4)})">${body}</g>`;
}
/** Where the rider sits, in px, for labels. */
export const riderAt = (x, y, height) => { const s = height / 64; return { x: x + 1 * s, y: y - 74 * s }; };

// ——— Ground, sky, paths ———
export const ground = (w, y, h) => `<rect x="0" y="${f(y)}" width="${w}" height="${f(h - y)}" fill="${SAGE}" fill-opacity=".22"/><path d="M0 ${f(y)}H${w}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>`;
/** A horizon line for scenes seen from above, where the ground is the stage itself. */
export const horizon = (w, y) => `<path d="M0 ${f(y)}H${w}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>`;
export const sun = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${SUN_SOFT}"/>`;
/** Low hills along the horizon, flat sage at two strengths. */
export function hills(w, gy, h = 60) {
  const far = `M0 ${f(gy)}C${f(w * 0.12)} ${f(gy - h * 0.9)} ${f(w * 0.3)} ${f(gy - h * 1.1)} ${f(w * 0.46)} ${f(gy - h * 0.4)}C${f(w * 0.56)} ${f(gy - h * 0.9)} ${f(w * 0.78)} ${f(gy - h * 1.3)} ${w} ${f(gy - h * 0.5)}V${f(gy)}Z`;
  const near = `M${f(w * 0.22)} ${f(gy)}C${f(w * 0.34)} ${f(gy - h * 0.55)} ${f(w * 0.5)} ${f(gy - h * 0.6)} ${f(w * 0.62)} ${f(gy)}Z`;
  return `<path d="${far}" fill="${SAGE}" fill-opacity=".2"/><path d="${near}" fill="${SAGE}" fill-opacity=".28"/>`;
}
export const tree = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M0 0V-26" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-40" r="18" fill="${SAGE}"/><circle cx="-11" cy="-30" r="11" fill="${SAGE}"/><circle cx="11" cy="-31" r="12" fill="${SAGE}"/></g>`;
export const tuft = (x, y, s = 1) => `<path d="M${f(x - 6 * s)} ${f(y)}L${f(x - 3 * s)} ${f(y - 9 * s)}M${f(x)} ${f(y)}V${f(y - 12 * s)}M${f(x + 6 * s)} ${f(y)}L${f(x + 3 * s)} ${f(y - 9 * s)}" stroke="${SAGE}" stroke-width="2" stroke-linecap="round"/>`;

/** The shapes of one band through points, `w0` wide at the start and `w1` at the end. */
function band(points, w0, w1 = w0, startCap = true) {
  const pts = sampleSmooth(points, 20);
  const left = []; const right = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(pts.length - 1, i + 1)]; const o = pts[Math.max(0, i - 1)];
    const a = Math.atan2(q[1] - o[1], q[0] - o[0]);
    const half = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    left.push([p[0] + Math.sin(a) * half, p[1] - Math.cos(a) * half]);
    right.push([p[0] - Math.sin(a) * half, p[1] + Math.cos(a) * half]);
  });
  const ring = [...left, ...right.reverse()];
  const a = pts[0]; const b = pts[pts.length - 1];
  return `<path d="M${ring.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z"/>${startCap ? `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="${f(w0 / 2)}"/>` : ''}<circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(w1 / 2)}"/>`;
}
/** A path on the ground, drawn as one flat shape. */
export const path = (points, w0, w1 = w0) => `<g fill="${TRAIL.color}" opacity="${TRAIL.opacity}">${band(points, w0, w1)}</g>`;
/** A dotted (or, with dash '0', solid) line along points. */
export function trace(points, { color = FOREST, width = 3.2, dash = '1 9' } = {}) {
  const pts = sampleSmooth(points, 20);
  return `<path d="M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dash}"/>`;
}
/** An arrowhead at the end of a trace, pointing along its last stretch. */
export function arrowEnd(points, { color = FOREST, size = 9 } = {}) {
  const pts = sampleSmooth(points, 20);
  const [x1, y1] = pts[pts.length - 1]; const [x0, y0] = pts[pts.length - 4];
  const a = Math.atan2(y1 - y0, x1 - x0);
  const p = (r, t) => `${f(x1 + Math.cos(a + t) * r)} ${f(y1 + Math.sin(a + t) * r)}`;
  return `<path d="M${p(size, 2.5)}L${f(x1)} ${f(y1)}L${p(size, -2.5)}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}
/** The elephant's round prints along a line, two rows, in the path's shade. */
export function elephantPrints(points, { step = 34, side = 9, r = 7, color = SAGE, opacity = 0.55 } = {}) {
  const at = []; footprints(sampleSmooth(points, 20), { step, side, at });
  return at.map(p => `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(r)}" ry="${f(r * 0.62)}" fill="${color}" fill-opacity="${opacity}"/>`).join('');
}

// ——— Things along the way ———
/** A stove with a hot pan, feet at (x, y). */
export const stove = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
  <rect x="-44" y="-70" width="88" height="70" rx="6" fill="${RULE}"/><rect x="-36" y="-56" width="72" height="44" rx="4" fill="${MIST}"/>
  <circle cx="-26" cy="-63" r="3" fill="${INK}"/><circle cx="-16" cy="-63" r="3" fill="${INK}"/>
  <rect x="-30" y="-86" width="50" height="14" rx="5" fill="${INK}"/><path d="M20 -80H46" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  ${[-18, -4, 10].map(dx => `<path d="M${dx} -94c-5 -6 5 -10 0 -18" stroke="${SUN}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
/** A stream with a wobbly plank over it, centred at (x, y). */
export const plank = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
  <path d="M-40 -2C-34 30 -52 60 -44 96H44C36 60 54 30 40 -2Z" fill="${LAKE_SOFT}"/><path d="M-14 14c5 4 10 4 15 0M-6 40c5 4 10 4 15 0M-18 66c5 4 10 4 15 0" stroke="${LAKE}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g transform="rotate(-7)"><rect x="-58" y="-8" width="116" height="9" rx="3" fill="${WOOD}"/></g>
  <path d="M-64 -20c-4 4 -4 10 0 14M64 -26c4 4 4 10 0 14" stroke="${QUIET}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
/** A plate on a low table with an odd new food on it, feet at (x, y). */
export const plate = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
  <rect x="-46" y="-44" width="92" height="7" rx="3" fill="${WOOD}"/><path d="M-38 -37V0M38 -37V0" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="0" cy="-48" rx="34" ry="5" fill="white" stroke="${RULE}" stroke-width="1.5"/>
  <path d="M-18 -50c-2-8 6-14 12-10 4-6 14-4 14 4 6 0 8 6 4 8z" fill="${SAGE}"/><circle cx="-4" cy="-56" r="2.4" fill="${FOREST}"/><circle cx="6" cy="-58" r="2" fill="${FOREST}"/></g>`;
export const walker = (body, x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${+s.toFixed(3)})">${body}</g>`;
/** A small water bottle, full or empty (an outline), base at (x, y). */
export const bottle = (x, y, { empty = false, s = 1 } = {}) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
  <rect x="-9" y="-34" width="18" height="34" rx="6" fill="${empty ? 'white' : LAKE}" stroke="${LAKE}" stroke-width="2"/><rect x="-5" y="-41" width="10" height="7" rx="2" fill="${LAKE}"/></g>`;
export const WATER_ICON = `<path d="M12 3c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12z" fill="${LAKE}"/>`;

/** A family car seen from the side, wheels on (x, y), facing right; its back door stands open, two grown-ups in front. */
export function car(x, y, s = 1) {
  const head = cx => `<circle cx="${cx}" cy="-88" r="9" fill="${LAKE}"/><path d="M${cx - 13} -76a13 11 0 0 1 26 0z" fill="${LAKE}"/>`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
    <path d="M-150 -26V-58C-150 -66 -144 -70 -136 -71L-104 -74 -76 -108C-71 -114 -65 -116 -58 -116H58C66 -116 72 -112 76 -106L100 -74 136 -70C144 -69 150 -63 150 -55V-26C150 -20 146 -16 140 -16H-140C-146 -16 -150 -20 -150 -26Z" fill="${LAKE}"/>
    <path d="M4 -104H58C63 -104 66 -102 69 -98L86 -74H4Z" fill="${LAKE_SOFT}"/>${head(32)}${head(62)}
    <path d="M-66 -104H-8V-24H-92V-74Z" fill="${PAPER_DEEP}"/>
    <path d="M-8 -108L22 -100V-30L-8 -22Z" fill="${LAKE}" stroke="${PAPER}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-3 -100L17 -95V-76L-3 -78Z" fill="${LAKE_SOFT}"/>
    <circle cx="-88" cy="-16" r="24" fill="${INK}"/><circle cx="-88" cy="-16" r="10" fill="${MIST}"/>
    <circle cx="92" cy="-16" r="24" fill="${INK}"/><circle cx="92" cy="-16" r="10" fill="${MIST}"/>
    <rect x="140" y="-58" width="10" height="10" rx="3" fill="${SUN}"/></g>`;
}
/** A child's jacket lying flat, its zip stuck halfway, centred at (x, y). */
export const jacket = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
  <path d="M-34 -30L-14 -38H14L34 -30 52 -6 40 2 30 -10V22H-30V-10L-40 2-52 -6Z" fill="${CLAY}"/>
  <path d="M0 -36V22" stroke="${PAPER}" stroke-opacity=".5" stroke-width="2.4"/><path d="M0 -6V22" stroke="${INK}" stroke-opacity=".35" stroke-width="2.4" stroke-dasharray="2 3"/>
  <rect x="-4" y="-10" width="8" height="11" rx="2" fill="${SUN}"/></g>`;
/** A friend in Maya's drawing language (person()), with a lake shirt and a ball, facing left, feet at (x, y). */
export function friend(x, y, height) {
  const inner = person({ shirt: LAKE, hair: CLAY, ball: true }).replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const s = height / 62;
  return `<g transform="translate(${f(x + 60 * s * 0.42)} ${f(y - 61.5 * s)}) scale(${f(-s)} ${f(s)})">${inner}</g>`;
}
/** A chalk game on the park path, seen from a little above, centred at (x, y); `changed` adds the friend's new yellow line. */
export function chalkGame(x, y, s = 1, { changed = false } = {}) {
  const line = (d, color = 'white', wd = 4) => `<path d="${d}" stroke="${color}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
    ${line('M-120 -26L120 -26 150 26H-150Z')}${line('M-40 -26L-50 26M40 -26L50 26')}
    <circle cx="-88" cy="0" r="8" fill="white"/><circle cx="88" cy="0" r="8" fill="white"/>
    ${changed ? line('M-14 -40C-4 -14 4 12 18 40', SUN, 5) : ''}</g>`;
}
