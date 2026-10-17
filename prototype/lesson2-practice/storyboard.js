// Lesson 2 · Practice, every step as one frame (design 003, v03). Static pictures: the only
// thing that moves is Back/Next, which scrolls to the neighbouring frame.
import { ICONS } from '../../src/lessons/choices/journey-icons.js';
import { step, word } from './copy.js';
import { mount, ui } from './shell.js';
import {
  esc, svg, label, mapFrame, lifeMap, routeStretch, footprints, sampleSmooth, printAt, maya, elephant, ground, goal, cone,
  rainCloud, wall, bench, flag, hoop, basketball, chalkboard, routeHeightAt, TODAY, MAX_AGE,
  FOREST, SAGE, SUN, QUIET, AHEAD, INK, PAPER_DEEP,
} from './draw.js';
import { skillBox, weeksRow, mayaHTML, star, diamond, mapWithBox, heroLens, buildFrames, MAP_WORDS } from './parts.js';

export const STORY_CHAPTERS = [step('01').chapter, step('04').chapter, step('08').chapter, word('A1', 'chapter'), step('10').chapter];
const W = (id, key) => word(id, key);
const figure = h => Math.max(96, Math.min(150, h * 0.19));

// 01 · Maya at the start of a long path; what she wants is far and pale, the first step is at her feet.
function want(w, h) {
  const gy = Math.round(h * 0.64); const mh = figure(h) * 1.35;
  const mx = w * 0.17;
  const path = [[mx + 46, gy + 26], [w * 0.42, gy + 10], [w * 0.62, gy - 26], [w * 0.8, gy - 70], [w * 0.88, gy - 96]];
  const at = []; footprints(sampleSmooth(path, 16), { step: 34, side: 10, at });
  const first = at[0];
  return svg(w, h, `${ground(w, gy, h - gy)}
    <path d="M${w * 0.7} ${gy}C${w * 0.78} ${gy - 120} ${w * 0.98} ${gy - 120} ${w + 40} ${gy - 40}V${gy}Z" fill="${SAGE}" fill-opacity=".22"/>
    <path d="${pathD(path)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-dasharray="0"/>
    ${flag(w * 0.885, gy - 96)}${label(w * 0.885, gy - 156, W('01', 'far'), { anchor: 'middle', color: QUIET, weight: 500, halo: null })}
    ${bench(w * 0.46, gy - 4)}${elephant(w * 0.59, gy - 2, 44)}
    ${maya(mx, gy + 4, mh)}
    ${printAt(first, { size: 1.6, outline: FOREST })}
    ${label(first.x + 6, first.y + 52, W('01', 'near'), { anchor: 'middle', halo: null })}`);
}
const pathD = points => `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}${sampleSmooth(points, 16).slice(1).map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')}`;

// 02 · Four moments on one ground line, joined by her footprints.
function again(w, h) {
  const gy = Math.round(h * 0.6); const mh = figure(h) * 1.1;
  const xs = [0.15, 0.39, 0.63, 0.86].map(v => v * w);
  const props = [
    goal(xs[0] - 128, gy, 0.95),
    rainCloud(xs[1] + 4, gy - mh - 40, 1),
    `${cone(xs[2] - 70, gy)}${cone(xs[2] + 66, gy)}${cone(xs[2] + 116, gy)}`,
    `${wall(xs[3] + 44, gy, Math.min(110, w * 0.1), 104)}`,
  ];
  const trail = [[24, gy + 30], [w - 24, gy + 30]];
  const prints = footprints(trail, { size: 0.9, step: 30, side: 7 });
  const labels = ['m1', 'm2', 'm3', 'm4'].map((key, i) => label(xs[i], gy + 82, W('02', key), { anchor: 'middle', halo: PAPER_DEEP }));
  return svg(w, h, `${ground(w, gy, h - gy)}${props.join('')}${elephant(xs[3] - 92, gy, 40)}
    ${xs.map(x => maya(x, gy, mh)).join('')}${prints}${labels.join('')}`);
}

// 03 · Lesson 1's lane: the weeks almost full, the bars barely started.
function quiet(w, h) {
  const box = skillBox({ group: 'soccer', title: W('03', 'box'), rows: [
    { name: W('03', 's1'), level: 0.1, word: W('03', 'w1') },
    { name: W('03', 's2'), level: 0.03, word: W('03', 'w2') },
    { name: W('03', 's3'), level: 0.03, word: W('03', 'w3') },
  ] });
  const width = Math.min(w - 64, 860);
  return `${svg(w, h, elephant(w * 0.5 + width / 2 - 40, h * 0.5 + 150, 40))}
    <div class="over" style="left:${(w - width) / 2}px; width:${width}px; top:50%; transform: translateY(-58%)">
      <article class="solo-lane">
        <div class="lane-who">${mayaHTML()}</div>
        <div class="calendar"><p class="calendar-title">${esc(W('03', 'weeks'))}</p>
          <div class="calendar-rows">${weeksRow(W('03', 'season'), [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1])}${weeksRow(W('03', 'season2'), Array(12).fill(0))}${weeksRow(W('03', 'season3'), Array(12).fill(0))}</div></div>
        <div class="lane-box">${box}</div>
      </article></div>`;
}

// 04 · Maya's whole map, the soccer years boxed.
const map = (w, h) => mapWithBox(w, h).svg;

// 05 · The hero: the box opens into a lens; the line is footprints.
const steps = (w, h) => heroLens(w, h, ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map(k => W('05', k)), { every: 3, firstLabel: 1 });

// 06 · Three blocks like steps, each resting on the one before; Maya on the top one.
function builds(w, h) {
  const gy = Math.round(h * 0.82);
  const u = Math.min(w * 0.15, 150); const bh = Math.min(h * 0.12, 84);
  const x0 = w * 0.5 - 1.5 * u;
  const blocks = [
    { x: x0, w: 3 * u, y: gy - bh, fill: FOREST, ink: 'white', key: 'b1' },
    { x: x0 + 0.8 * u, w: 2.2 * u, y: gy - 2 * bh, fill: SAGE, ink: INK, key: 'b2' },
    { x: x0 + 1.6 * u, w: 1.4 * u, y: gy - 3 * bh, fill: SUN, ink: INK, key: 'b3' },
  ];
  const art = blocks.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${bh}" rx="10" fill="${b.fill}"/>`).join('');
  const words = blocks.map((b, i) => label(b.x + (i === 2 ? b.w / 2 : 0.4 * u), b.y + bh / 2 + 6, W('06', b.key), { anchor: 'middle', color: b.ink, halo: null, size: 16 })).join('');
  // Footprints along each step's top, seen from above as on the map.
  const walk = blocks.map((b, i) => footprints([[b.x + 12, b.y - 13], [i < 2 ? blocks[i + 1].x - 4 : b.x + b.w * 0.4, b.y - 13]], { size: 0.8, step: 26, side: 5, color: FOREST })).join('');
  const lead = footprints([[x0 - 240, gy - 12], [x0 - 6, gy - 12]], { size: 0.8, step: 26, side: 5 });
  return svg(w, h, `<path d="M0 ${gy}H${w}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>${art}${words}${lead}${walk}
    ${elephant(x0 - 120, gy, 40)}${maya(x0 + 2.45 * u, gy - 3 * bh, figure(h) * 0.95)}`);
}

// 07 · Someone else's trail of small choices, ending at a chalkboard.
function maths(w, h) {
  const end = [w * 0.8, h * 0.6];
  const trail = sampleSmooth([[w * 0.04, h * 0.78], [w * 0.22, h * 0.7], [w * 0.4, h * 0.76], [w * 0.56, h * 0.66], [end[0] - 70, end[1] + 10]], 16);
  const at = [];
  const prints = footprints(trail, { size: 0.95, step: 30, side: 9, at });
  const keys = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
  const picks = keys.map((_, i) => at[Math.round(1 + i * (at.length - 3) / (keys.length - 1))]);
  const words = picks.map((p, i) => { const side = i % 2 ? 1 : -1; return label(p.x, p.y + side * 40 + (side > 0 ? 6 : 0), W('07', keys[i]), { anchor: 'middle' }); }).join('');
  return svg(w, h, `<path d="M${end[0] - 120} ${end[1] + 0}H${end[0] + 120}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>${chalkboard(end[0], end[1])}
    ${prints}${words}${label(end[0], end[1] + 34, W('07', 'end'), { anchor: 'middle', size: 17 })}`);
}

// 08 · Maya at eleven at the hoop; Lesson 1's basketball box with soccer's stripes.
function newBall(w, h) {
  const gy = Math.round(h * 0.78); const mh = figure(h) * 1.15;
  const box = skillBox({ group: 'basketball', title: W('08', 'box'), rows: [
    { name: W('08', 's1'), level: 0.42, carried: 0.36, word: W('08', 'w1') },
    { name: W('08', 's2'), level: 0.24, carried: 0.2, word: W('08', 'w2') },
    { name: W('08', 's3'), level: 0.04, carried: 0.0, word: W('08', 'w3') },
  ] });
  const bw = Math.min(360, w * 0.4);
  const mx = w * 0.3;
  return `${svg(w, h, `${ground(w, gy, h - gy)}${elephant(w * 0.075, gy, 40)}${hoop(w * 0.15, gy, Math.min(1.25, h / 620))}
      ${maya(mx, gy, mh, { ball: false, shirt: FOREST })}${basketball(mx + mh * 0.44, gy - mh * 0.5, mh * 0.13)}`)}
    <div class="over" style="right:${Math.max(28, w * 0.06)}px; width:${bw}px; top:${h * 0.3}px">${box}<p class="box-key">${esc(W('08', 'key'))}</p></div>`;
}

// 09 · The map's paths ahead: a later start with its own footprints, luck and a setback.
function late(w, h) {
  const frame = mapFrame(w, h);
  const ty = frame.y(routeHeightAt(TODAY));
  const later = [[frame.x(TODAY), ty], [frame.x(14), ty + 70], [frame.x(16.5), ty + 120], [frame.x(MAX_AGE + 0.5), ty + 150]];
  const laterPts = sampleSmooth(later, 20);
  const fromAge = frame.x(14.6);
  const prints = footprints(laterPts.filter(p => p[0] > fromAge && p[0] < frame.x(MAX_AGE - 0.6)), { size: 0.5, step: 11, side: 3.2 });
  const up = [[frame.x(TODAY), ty], [frame.x(15), ty - 90], [frame.x(MAX_AGE + 0.5), ty - 150]];
  const upPts = sampleSmooth(up, 20);
  const starAt = upPts.find(p => p[0] > frame.x(15.2));
  const mid = [[frame.x(TODAY), ty], [frame.x(15.5), ty + 6], [frame.x(MAX_AGE + 0.5), ty - 20]];
  const midPts = sampleSmooth(mid, 20);
  const diaAt = midPts.find(p => p[0] > frame.x(16.4));
  const startAt = laterPts.find(p => p[0] > fromAge);
  const extra = `<path d="${pathD(later)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="${pathD(up)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="${pathD(mid)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>${prints}
    ${star(starAt[0], starAt[1], 11)}${label(starAt[0], starAt[1] - 20, W('09', 'lucky'), { anchor: 'middle' })}
    ${diamond(diaAt[0], diaAt[1], 9)}${label(diaAt[0], diaAt[1] + 30, W('09', 'setback'), { anchor: 'middle' })}
    ${label(startAt[0] - 8, startAt[1] + 38, W('09', 'late'), { anchor: 'middle' })}
    <circle cx="${frame.x(TODAY)}" cy="${ty}" r="7" fill="${FOREST}"/>`;
  return svg(w, h, lifeMap(frame, MAP_WORDS(), { extra, futures: false }));
}

// 10 · The map once more; the soccer years drawn as the footprints they are.
const keep = (w, h) => svg(w, h, lifeMap(mapFrame(w, h), MAP_WORDS(), { stretch: [8, TODAY] }));

// 11 · Maya dribbling with her trail behind her; the gray shape is right behind her now.
function next(w, h) {
  const gy = Math.round(h * 0.7); const mh = figure(h) * 1.2;
  const mx = w * 0.5;
  const prints = footprints([[-10, gy + 20], [mx - 70, gy + 20]], { size: 0.8, step: 24, side: 6 });
  return svg(w, h, `${ground(w, gy, h - gy)}${goal(w * 0.8, gy, 1.05)}${cone(w * 0.68, gy)}${cone(w * 0.72, gy)}
    ${prints}${elephant(mx - 120, gy, 74)}${maya(mx, gy, mh)}`);
}

const ITEMS = [
  { id: 'story-01', copy: '01', stage: want },
  { id: 'story-02', copy: '02', stage: again },
  { id: 'story-03', copy: '03', stage: quiet },
  { id: 'story-04', copy: '04', stage: map },
  { id: 'story-05', copy: '05', stage: steps },
  { id: 'story-06', copy: '06', stage: builds },
  { id: 'story-07', copy: '07', stage: maths },
  { id: 'story-08', copy: '08', stage: newBall },
  { id: 'story-09', copy: '09', stage: late, nextLabel: ui('lesson.ui.nextChapter').replace('{chapter}', word('A1', 'chapter')) },
  { id: 'story-10', copy: '10', stage: keep },
  { id: 'story-11', copy: '11', stage: next, nextLabel: word('11', 'button') },
];
export const STAGES = { want, again, quiet, map, steps, builds, maths, newBall, late, keep, next };
export const TAKEAWAY_ICONS = { big: ICONS.add, build: ICONS.build,
  start: `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="#28544214"/>${printAt({ x: 16, y: 27, angle: -1.2, index: 0 }, { size: 0.62 })}${printAt({ x: 27, y: 18, angle: -1.2, index: 1 }, { size: 0.62, color: SAGE })}</svg>` };

export function start(root) {
  mount(root, buildFrames(ITEMS, STORY_CHAPTERS), TAKEAWAY_ICONS);
}
