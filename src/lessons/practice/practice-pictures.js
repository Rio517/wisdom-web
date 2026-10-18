// Lesson 2's eleven pictures, one function a step (ported from the approved paper frames,
// prototype/lesson2-practice/storyboard.js and parts.js). Each returns the stage's markup for a
// stage of w × h px: an SVG drawing with its labels as HTML (practice-draw.js), and HTML parts
// such as Lesson 1's skill box and weeks lane. Words come from the catalog (practice.*).
import { t } from '../../i18n/runtime.js';
import { ICONS, person } from '../choices/journey-icons.js';
import { levelWord } from '../choices/journey-game.js';
import { escapeHTML } from '../choices/journey-shell.js';
import {
  svg, label, collect, labelsHTML, textWidth, mapFrame, lifeMap, stretchBox, routeStretch, footprints, sampleSmooth, printAt, pathD,
  maya, mayaSpan, elephantSlot, ground, goal, cone, rainCloud, wall, bench, flag, hoop, basketball, chalkboard, star, diamond, routeHeightAt,
  TODAY, MAX_AGE, STRETCH, FOREST, SAGE, SUN, QUIET, AHEAD, RULE, PAPER_DEEP,
} from './practice-draw.js';

const figure = h => Math.max(96, Math.min(150, h * 0.19));
const W = key => t(key);
export const mapWords = () => ({ axis: W('practice.map.age'), born: W('practice.map.born'), school: W('practice.map.school'), team: W('practice.map.team'), basket: W('practice.map.basket') });
const art = (draw, extra = '') => { const { markup, labels } = collect(draw); return `${markup}<div class="pl-labels" aria-hidden="true">${labelsHTML(labels)}</div>${extra}`; };

const GROUP_ICON = { soccer: 'soccerSmall', cello: 'celloSmall', basketball: 'basketball' };
/** Lesson 1's skill box (journey-skills.js markup and classes); setSkillBox() can update it. */
export function skillBox({ group, title, rows, note = '', isNew = false, id = '' }) {
  return `<section class="skill-box${isNew ? ' is-new' : ''}"${id ? ` id="${id}"` : ''} data-group="${group}" aria-label="${escapeHTML(t('skills.boxLabel', { title }))}">
    <header><h3>${ICONS[GROUP_ICON[group]] ?? ''}<span class="box-title">${escapeHTML(title)}</span></h3><span class="box-note">${escapeHTML(note)}</span></header>
    ${rows.map(row => `<div class="skill-row"${row.id ? ` data-skill="${row.id}"` : ''}>
      <span class="skill-name">${escapeHTML(row.name)}</span>
      <div class="meter" data-group="${group}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((row.level ?? 0) * 100)}" aria-label="${escapeHTML(row.name)}">
        <i class="carried" style="--level:${row.carried ?? 0}"></i><i class="fill" style="--level:${row.level ?? 0};--from:${row.carried ?? 0}"></i><i class="ghost" hidden></i></div>
      <span class="skill-meta"><span class="skill-word">${escapeHTML(row.word ?? levelWord(row.level ?? 0))}</span></span>
    </div>`).join('')}
  </section>`;
}
const headStart = level => t('skills.headStartShort', { word: levelWord(level) });

// 01 · Maya at the start of a long path; what she wants is far and pale, the first step is at her feet.
function want(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.64); const mh = figure(h) * 1.35;
    const mx = w * 0.17;
    // The elephant past the bench; the bench keeps its width, so on a narrower stage it steps right.
    const ex = Math.max(w * 0.59, w * 0.46 + 92 + 46 * 44 / 64 + 7);
    const path = [[mx + 46, gy + 26], [w * 0.42, gy + 10], [w * 0.62, gy - 26], [w * 0.8, gy - 70], [w * 0.88, gy - 96]];
    const at = []; footprints(sampleSmooth(path, 16), { step: 34, side: 10, at });
    const first = at[0];
    label(w * 0.885, gy - 150, W('practice.beat.want.far'), { anchor: 'middle', tone: 'quiet', max: Math.min(200, w * 0.22) });
    label(first.x + 6, first.y + 36, W('practice.beat.want.near'), { anchor: 'middle', at: 'below', max: 180 });
    return svg(w, h, `${ground(w, gy, h - gy)}
      <path d="M${w * 0.7} ${gy}C${w * 0.78} ${gy - 120} ${w * 0.98} ${gy - 120} ${w + 40} ${gy - 40}V${gy}Z" fill="${SAGE}" fill-opacity=".22"/>
      <path d="${pathD(path)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      ${flag(w * 0.885, gy - 96)}${bench(w * 0.46, gy - 4)}${elephantSlot(ex, gy - 2, 44, { clear: [[w * 0.46, w * 0.46 + 92], mayaSpan(mx, mh)] })}
      ${maya(mx, gy + 4, mh)}${printAt(first, { size: 1.6, outline: FOREST })}`);
  });
}

// 02 · Four moments on one ground line, joined by her footprints.
function again(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.6); const mh = figure(h) * 1.1;
    const xs = [0.14, 0.38, 0.62, 0.86].map(v => v * w);
    const props = [
      goal(xs[0] - 128 * Math.min(1, w / 1000), gy, 0.95 * Math.min(1, w / 1000)),
      rainCloud(xs[1] + 4, gy - mh - 40, 1),
      `${cone(xs[2] - 70, gy)}${cone(xs[2] + 62, gy)}`,
      wall(xs[3] + 40, gy, Math.min(110, w * 0.1), 104),
    ];
    const prints = footprints([[24, gy + 30], [w - 24, gy + 30]], { size: 0.9, step: 30, side: 7 });
    ['practice', 'rain', 'eyes', 'wall'].forEach((key, i) => label(xs[i], gy + 62, W(`practice.print.${key}`), { anchor: 'middle', at: 'below', max: w * 0.21 }));
    return svg(w, h, `${ground(w, gy, h - gy)}${props.join('')}${elephantSlot(xs[3] - 92, gy, 40, { clear: [mayaSpan(xs[2], mh), [xs[2] + 50, xs[2] + 74]] })}
      ${xs.map(x => maya(x, gy, mh)).join('')}${prints}`);
  });
}

// 03 · Lesson 1's lane: the weeks almost full, the bars barely started.
function weeksRow(name, on) {
  return `<div class="calendar-row"><small>${escapeHTML(name)}</small><span class="calendar-track">${on.map(v => `<span class="week" data-on="${Boolean(v)}"></span>`).join('')}</span></div>`;
}
function quiet(w, h) {
  const box = skillBox({ group: 'soccer', title: W('game.group.soccer'), rows: [
    { name: W('practice.skill.ballControl'), level: 0.1 },
    { name: W('practice.skill.passing'), level: 0.03 },
    { name: W('practice.skill.positioning'), level: 0.03 },
  ] });
  const width = Math.min(w - 48, 860);
  const season = n => t('skills.season', { n });
  return `<div class="pl-over pl-lane" style="left:${(w - width) / 2}px; width:${width}px">
      <article class="solo-lane">
        <div class="lane-who">${person({ shirt: FOREST, ball: true })}</div>
        <div class="calendar"><p class="calendar-title">${escapeHTML(W('practice.beat.quiet.weeks'))}</p>
          <div class="calendar-rows">${weeksRow(season(1), [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1])}${weeksRow(season(2), Array(12).fill(0))}${weeksRow(season(3), Array(12).fill(0))}</div></div>
        <div class="lane-box">${box}</div>
      </article><svg class="pl-elephant" width="110" height="52" viewBox="0 0 110 52" aria-hidden="true" focusable="false">${elephantSlot(70, 46, 40)}</svg></div>`;
}

/** Where the hero's two pictures go: the map, small, top left; the lens below it, the stage's width. */
export function lensLayout(w, h) {
  const scale = 0.36;
  const mini = { x: 22, y: 20, w: w * scale, h: h * scale, scale };
  const lens = { x: 22, y: mini.y + mini.h + 40, w: w - 44 };
  lens.h = h - lens.y - 22;
  return { mini, lens, aspect: lens.w / lens.h };
}

// 04 · Maya's whole map, the soccer years boxed (the shape the lens will open to).
function mapBox(w, h, { labels = true } = {}) {
  const frame = mapFrame(w, h);
  const box = stretchBox(frame, STRETCH, lensLayout(w, h).aspect);
  return { frame, box, body: `${lifeMap(frame, mapWords(), { labels })}
    <rect class="hero-box" x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="10" fill="none" stroke="${QUIET}" stroke-width="2"/>` };
}
const map = (w, h) => art(() => svg(w, h, mapBox(w, h).body));

/**
 * 05 · The hero: the map goes small in the corner and its box opens into a lens. The lens is that
 * box, magnified: the same gray paths, and the green line turns out to be footprints, some labelled
 * with the choice they were. Built in layers so the zoom from step 04 can move them
 * (practice-scenes.js): the map (with 04's labels, which fade), the mini map's frame and the lines
 * joining it to the lens, and the lens with its own labels.
 */
const STEP_WORDS = ['practice', 'again', 'rain', 'wall', 'eyes', 'practice', 'wall', 'again'];
function steps(w, h) {
  const { mini, lens, aspect } = lensLayout(w, h);
  const full = mapFrame(w, h);
  const box = stretchBox(full, STRETCH, aspect);
  const k = lens.w / box.w;
  const zoom = ([px, py]) => [(px - box.x) * k, (py - box.y) * k];
  const trail = routeStretch(full, 7.4, 11.2).filter((_, i) => i % 2 === 0).map(zoom);
  const at = [];
  const size = Math.max(1, Math.min(1.35, k * 0.18)); const stepPx = 30 * size; const side = 9.5 * size;
  const prints = footprints(trail, { size, step: stepPx, side, at });
  // Labels: beyond the footprint's own side of the trail, with a short leader, never over another label.
  const words = STEP_WORDS.map(key => W(`practice.print.${key}`));
  const placed = []; const leaders = []; const lensLabels = [];
  const inside = p => p.x > 70 && p.x < lens.w - 70 && p.y > 50 && p.y < lens.h - 50;
  let n = 0;
  for (const p of at.filter(inside).filter((_, i) => i % 3 === 1)) {
    if (n >= words.length) break;
    const text = words[n];
    const sideSign = p.index % 2 ? 1 : -1;
    const nx = -Math.sin(p.angle) * sideSign; const ny = Math.cos(p.angle) * sideSign;
    const reach = 44 * size;
    const lx = p.cx + nx * reach; const ly = p.cy + ny * reach + (ny > 0 ? 14 : -2);
    const width = textWidth(text) + 4;
    const b = { l: lx - width / 2, r: lx + width / 2, t: ly - 15, b: ly + 4 };
    if (b.l < 8 || b.r > lens.w - 8 || b.t < 8 || b.b > lens.h - 8) continue;
    if (placed.some(o => !(b.r < o.l - 14 || b.l > o.r + 14 || b.b < o.t - 6 || b.t > o.b + 6))) continue;
    placed.push(b); n += 1;
    const from = [p.cx + nx * 17 * size, p.cy + ny * 17 * size]; const to = [p.cx + nx * (reach - 18), p.cy + ny * (reach - 18)];
    leaders.push(`<path d="M${from[0].toFixed(1)} ${from[1].toFixed(1)}L${to[0].toFixed(1)} ${to[1].toFixed(1)}" stroke="${FOREST}" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round"/>`);
    lensLabels.push({ x: lx, y: ly, text, anchor: 'middle', at: 'baseline', chip: true });
  }
  const ten = zoom([full.x(10), 0])[0];
  const mb = { x: mini.x + box.x * mini.scale, y: mini.y + box.y * mini.scale, w: box.w * mini.scale, h: box.h * mini.scale };
  const clip = `pl-lens-${Math.round(w)}-${Math.round(h)}`;
  // The whole map at full size; the hero scales it into the mini (its strokes keep their width).
  const { markup: mapSvg, labels: mapLabels } = collect(() => svg(w, h, mapBox(w, h).body));
  const mapLayer = `<div class="hero-map" style="width:${w}px;height:${h}px;--mini-x:${mini.x}px;--mini-y:${mini.y}px;--mini-s:${mini.scale}">
      ${mapSvg.replace('<svg class="pic"', '<svg class="pic hero-map-pic"')}<div class="pl-labels hero-map-labels" aria-hidden="true">${labelsHTML(mapLabels)}</div></div>`;
  const back = svg(w, h, `<rect x="${mini.x}" y="${mini.y}" width="${mini.w.toFixed(1)}" height="${mini.h.toFixed(1)}" rx="14" fill="${PAPER_DEEP}" stroke="${RULE}" stroke-width="1.5"/>`);
  const front = svg(w, h, `<path d="M${mb.x.toFixed(1)} ${(mb.y + mb.h).toFixed(1)}L${lens.x + 24} ${lens.y.toFixed(1)}M${(mb.x + mb.w).toFixed(1)} ${(mb.y + mb.h).toFixed(1)}L${lens.x + lens.w - 24} ${lens.y.toFixed(1)}" stroke="${QUIET}" stroke-width="1.5"/>`);
  const t0 = `translate(${(-box.x * k).toFixed(2)} ${(-box.y * k).toFixed(2)}) scale(${k.toFixed(4)})`;
  const lensSvg = `<svg class="pic" width="${lens.w}" height="${lens.h.toFixed(1)}" viewBox="0 0 ${lens.w} ${lens.h.toFixed(1)}" aria-hidden="true" focusable="false">
    <defs><clipPath id="${clip}"><rect width="${lens.w}" height="${lens.h.toFixed(1)}" rx="24"/></clipPath></defs>
    <rect width="${lens.w}" height="${lens.h.toFixed(1)}" rx="24" fill="${PAPER_DEEP}"/>
    <g clip-path="url(#${clip})"><g transform="${t0}">${collect(() => lifeMap(full, {}, { fieldOnly: true, thin: true, grayWidth: 7, axisLabels: false })).markup}</g>
      ${leaders.join('')}${prints}</g>
    <rect x="1" y="1" width="${lens.w - 2}" height="${(lens.h - 2).toFixed(1)}" rx="23" fill="none" stroke="${QUIET}" stroke-width="2"/></svg>`;
  const tenLabel = ten > 30 && ten < lens.w - 30 ? [{ x: ten + 12, y: lens.h - 16, text: '10', anchor: 'start', at: 'baseline', tone: 'quiet' }] : [];
  const lensLayer = `<div class="hero-lens" style="left:${lens.x}px;top:${lens.y.toFixed(1)}px;width:${lens.w}px;height:${lens.h.toFixed(1)}px;--from-x:${(box.x - lens.x).toFixed(1)}px;--from-y:${(box.y - lens.y).toFixed(1)}px;--from-s:${(box.w / lens.w).toFixed(4)}">
      ${lensSvg}<div class="pl-labels hero-lens-labels" aria-hidden="true">${labelsHTML([...tenLabel, ...lensLabels])}</div></div>`;
  return `<div class="hero" data-hero>
    <div class="hero-back">${back}</div>${mapLayer}<div class="hero-front">${front}</div>${lensLayer}</div>`;
}

// 06 · Three blocks like steps, each resting on the one before; Maya on the top one.
function builds(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.82);
    const u = Math.min(w * 0.15, 150); const bh = Math.min(h * 0.12, 84);
    const x0 = w * 0.5 - 1.5 * u;
    const blocks = [
      { x: x0, w: 3 * u, y: gy - bh, fill: FOREST, tone: 'white', key: 'lookingUp' },
      { x: x0 + 0.8 * u, w: 2.2 * u, y: gy - 2 * bh, fill: SAGE, tone: 'ink', key: 'passing' },
      { x: x0 + 1.6 * u, w: 1.4 * u, y: gy - 3 * bh, fill: SUN, tone: 'ink', key: 'positioning' },
    ];
    const blockArt = blocks.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${bh}" rx="10" fill="${b.fill}"/>`).join('');
    blocks.forEach((b, i) => {
      // Each word sits at the left of the part of its block not covered by the next one.
      const visible = i < 2 ? blocks[i + 1].x - b.x : b.w;
      label(b.x + 18, b.y + bh / 2, W(`practice.skill.${b.key}`), { at: 'center', tone: b.tone, max: visible - 30 });
    });
    const walk = blocks.map((b, i) => footprints([[b.x + 12, b.y - 13], [i < 2 ? blocks[i + 1].x - 4 : b.x + b.w * 0.4, b.y - 13]], { size: 0.8, step: 26, side: 5 })).join('');
    const lead = footprints([[x0 - 240, gy - 12], [x0 - 6, gy - 12]], { size: 0.8, step: 26, side: 5 });
    return svg(w, h, `<path d="M0 ${gy}H${w}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>${blockArt}${lead}${walk}
      ${elephantSlot(x0 - 120, gy, 40)}${maya(x0 + 2.45 * u, gy - 3 * bh, figure(h) * 0.95)}`);
  });
}

// 07 · Someone else's trail of small choices, ending at a chalkboard.
function maths(w, h) {
  return art(() => {
    const end = [w * 0.8, h * 0.6];
    const trail = sampleSmooth([[w * 0.04, h * 0.78], [w * 0.22, h * 0.7], [w * 0.4, h * 0.76], [w * 0.56, h * 0.66], [end[0] - 70, end[1] + 10]], 16);
    const at = [];
    const prints = footprints(trail, { size: 0.95, step: 30, side: 9, at });
    const keys = ['class', 'homework', 'again', 'hard', 'class', 'homework'];
    const picks = keys.map((_, i) => at[Math.round(1 + i * (at.length - 3) / (keys.length - 1))]);
    picks.forEach((p, i) => {
      const above = i % 2 === 0;
      label(p.x, p.y + (above ? -30 : 30), W(`practice.maths.${keys[i]}`), { anchor: 'middle', at: above ? 'above' : 'below', max: Math.max(110, w * 0.13) });
    });
    label(end[0], end[1] + 18, W('practice.maths.end'), { anchor: 'middle', at: 'below', size: 17 });
    return svg(w, h, `<path d="M${end[0] - 120} ${end[1]}H${end[0] + 120}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2"/>${chalkboard(end[0], end[1])}${prints}`);
  });
}

// 08 · Maya at eleven at the hoop; Lesson 1's basketball box with soccer's stripes.
function newBall(w, h) {
  const gy = Math.round(h * 0.78); const mh = figure(h) * 1.15;
  const box = skillBox({ group: 'basketball', title: W('game.group.basketball'), rows: [
    { name: W('practice.skill.positioning'), level: 0.42, carried: 0.36, word: headStart(0.42) },
    { name: W('practice.skill.passing'), level: 0.24, carried: 0.2, word: headStart(0.24) },
    { name: W('practice.skill.dribbling'), level: 0.04 },
  ] });
  const bw = Math.min(380, w * 0.42);
  const mx = w * 0.3;
  return `${svg(w, h, `${ground(w, gy, h - gy)}${elephantSlot(w * 0.075, gy, 40, { clear: [[w * 0.15 - 5, w * 0.15 + 5], mayaSpan(mx, mh, { ball: false })] })}${hoop(w * 0.15, gy, Math.min(1.25, h / 620))}
      ${maya(mx, gy, mh, { ball: false })}${basketball(mx + mh * 0.44, gy - mh * 0.5, mh * 0.13)}`)}
    <div class="pl-over pl-boxed" style="right:${Math.max(24, w * 0.06)}px; width:${bw}px; top:${Math.max(20, h * 0.26)}px">${box}<p class="box-key">${escapeHTML(W('practice.stripes'))}</p></div>`;
}

// 09 · The map's paths ahead: a later start with its own footprints, luck and a setback.
function late(w, h) {
  return art(() => {
    const frame = mapFrame(w, h);
    const ty = frame.y(routeHeightAt(TODAY));
    const later = [[frame.x(TODAY), ty], [frame.x(14), ty + 70], [frame.x(16.5), ty + 120], [frame.x(MAX_AGE + 0.5), ty + 150]];
    const laterPts = sampleSmooth(later, 20);
    const fromAge = frame.x(14.6);
    const prints = footprints(laterPts.filter(p => p[0] > fromAge && p[0] < frame.x(MAX_AGE - 0.6)), { size: 0.5, step: 11, side: 3.2 });
    const up = [[frame.x(TODAY), ty], [frame.x(15), ty - 90], [frame.x(MAX_AGE + 0.5), ty - 150]];
    const starAt = sampleSmooth(up, 20).find(p => p[0] > frame.x(15.2));
    const mid = [[frame.x(TODAY), ty], [frame.x(15.5), ty + 6], [frame.x(MAX_AGE + 0.5), ty - 20]];
    const diaAt = sampleSmooth(mid, 20).find(p => p[0] > frame.x(16.4));
    const startAt = laterPts.find(p => p[0] > fromAge);
    const room = frame.x(MAX_AGE) - frame.x(14);
    label(starAt[0], starAt[1] - 18, W('practice.beat.late.lucky'), { anchor: 'middle', at: 'above', max: room });
    label(diaAt[0], diaAt[1] + 16, W('practice.beat.late.setback'), { anchor: 'middle', at: 'below', max: room });
    label(startAt[0] - 8, startAt[1] + 22, W('practice.beat.late.later'), { anchor: 'middle', at: 'below', max: room });
    const extra = `<path d="${pathD(later)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="${pathD(up)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="${pathD(mid)}" stroke="${AHEAD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>${prints}
      ${star(starAt[0], starAt[1], 11)}${diamond(diaAt[0], diaAt[1], 9)}
      <circle cx="${frame.x(TODAY)}" cy="${ty}" r="7" fill="${FOREST}"/>`;
    return svg(w, h, lifeMap(frame, mapWords(), { extra, futures: false }));
  });
}

// 10 · The map once more; the soccer years drawn as the footprints they are.
const keep = (w, h) => art(() => svg(w, h, lifeMap(mapFrame(w, h), mapWords(), { stretch: [8, TODAY] })));

// 11 · Maya dribbling with her trail behind her; the elephant's slot is right behind her now.
function next(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.7); const mh = figure(h) * 1.2;
    const mx = w * 0.5;
    const prints = footprints([[-10, gy + 20], [mx - 70, gy + 20]], { size: 0.8, step: 24, side: 6 });
    return svg(w, h, `${ground(w, gy, h - gy)}${goal(w * 0.8, gy, 1.05)}${cone(w * 0.68, gy)}${cone(w * 0.72, gy)}
      ${prints}${elephantSlot(mx - 120, gy, 74)}${maya(mx, gy, mh)}`);
  });
}

export const PICTURES = { want, again, quiet, map, steps, builds, maths, basketball: newBall, late, keep, next };

/** The takeaways' icons: Lesson 1's two, and a pair of footprints for "Start any time". */
export const TAKEAWAY_ICONS = {
  big: ICONS.add,
  build: ICONS.build,
  start: `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="#28544214"/>${printAt({ x: 16, y: 27, angle: -1.2, index: 0 }, { size: 0.62 })}${printAt({ x: 27, y: 18, angle: -1.2, index: 1 }, { size: 0.62, color: SAGE })}</svg>`,
};
