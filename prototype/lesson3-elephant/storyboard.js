// Lesson 3 · The elephant and the rider, every step as one frame (design 004, v01). Static pictures:
// the only thing that moves is Back/Next, which scrolls to the neighbouring frame.
import { step, word } from './copy.js';
import { mount, buildFrames, ui } from './shell.js';
import {
  svg, label, chip, leader, pair, riderAt, ground, horizon, sun, hills, tree, tuft, path, paths, trace, arrowEnd, elephantPrints,
  gameScreen, gameBox, table, stove, plank, plate, alfredo, dad, walker, bottle, maya, bench,
  WATER_ICON, GROUND_GAP, FOREST, SAGE, MIST, QUIET, LAKE, LAKE_SOFT, RULE, AHEAD,
} from './scenes.js';

const W = (id, key) => word(id, key);
export const STORY_CHAPTERS = [step('01').chapter, step('02').chapter, step('04').chapter, step('06').chapter, word('A1', 'chapter'), step('08').chapter];

// 01 · The hero: a big, calm elephant on the ground line, its small rider looking ahead; the path runs on over low hills.
function meet(w, h) {
  const gy = Math.round(h * 0.8);
  const eh = Math.min(h * 0.36, w * 0.32); const s = eh / 64;
  const ex = Math.max(46 * s + 140, w * 0.4); const ey = gy;
  const rise = `M${ex + 20 * s} ${gy}C${w * 0.7} ${gy - h * 0.2} ${w * 0.86} ${gy - h * 0.22} ${w + 30} ${gy - h * 0.12}V${gy}Z`;
  const far = `M${w * 0.72} ${gy}C${w * 0.8} ${gy - h * 0.3} ${w * 0.95} ${gy - h * 0.32} ${w + 30} ${gy - h * 0.26}V${gy}Z`;
  const ahead = [[ex + 46 * s, gy + 20], [w * 0.7, gy + 6], [w * 0.8, gy - h * 0.1], [w * 0.92, gy - h * 0.165]];
  const r = riderAt(ex, ey, eh);
  const riderChip = [r.x + 30 * s, r.y - 10 * s];
  const bodyChip = [ex - 46 * s - 50, ey - 50 * s];
  return svg(w, h, `${sun(w * 0.14, h * 0.17, Math.min(w, h) * 0.05)}<path d="${far}" fill="${SAGE}" fill-opacity=".18"/><path d="${rise}" fill="${SAGE}" fill-opacity=".26"/>
    ${tree(w * 0.8, gy - h * 0.2, 0.8)}${tree(w * 0.94, gy - h * 0.25, 0.6)}
    ${ground(w, gy, h)}${trace(ahead, { color: AHEAD, dash: '0', width: 4 })}${tuft(w * 0.08, gy + 34)}${tuft(w * 0.66, gy + 50, 1.2)}
    ${pair(ex, ey, eh)}
    ${leader(riderChip[0] - 22, riderChip[1] + 6, r.x + 3 * s, r.y - 4 * s)}${chip(riderChip[0], riderChip[1], W('01', 'rider'))}
    ${leader(bodyChip[0] + 30, bodyChip[1] + 6, ex - 34 * s, ey - 40 * s)}${chip(bodyChip[0], bodyChip[1], W('01', 'elephant'))}`);
}

// 02 · Lesson 2's last picture again: Maya dribbles, eyes up, her elephant right behind her; two more quick moments ahead.
function quick(w, h) {
  const gy = Math.round(h * 0.66);
  const mh = Math.max(110, Math.min(170, h * 0.21));
  const eh = mh * 1.05; const s = eh / 64;
  const ex = 46 * s + 26;
  const mx = ex + 39 * s + 22 + 0.42 * mh * 60 / 62;
  const sx = Math.max(mx + 0.58 * mh + 120, w * 0.64); const px = w - Math.max(90, w * 0.12);
  return svg(w, h, `${ground(w, gy, h)}${pair(ex, gy, eh, { rider: false, pose: 'walk1', gap: 'var(--color-paper-deep)' })}
    ${maya(mx, gy, mh)}${stove(sx, gy, Math.min(1.2, h / 640))}${plank(px, gy + 6, Math.min(1.1, h / 700))}
    ${label(mx + 6, gy + 44, W('02', 'feet'), { anchor: 'middle' })}
    ${label(sx, gy + 44, W('02', 'pan'), { anchor: 'middle' })}
    ${label(px, gy + 120, W('02', 'off'), { anchor: 'middle' })}`);
}

// 03 · Lesson 1's trail map: the walked way to the big rock, the dotted what-if to the lake, the turn back.
function slow(w, h) {
  const cx0 = Math.max(28, w * 0.26); const cy0 = 28; const cw = w - cx0 - 28; const ch = h * 0.56;
  const P = (u, v) => [cx0 + u * cw, cy0 + v * ch];
  const trailhead = P(0.08, 0.86); const rock = P(0.46, 0.56); const lake = P(0.86, 0.2);
  const walked = [trailhead, P(0.22, 0.8), P(0.34, 0.66), rock];
  const whatIf = [rock, P(0.6, 0.48), P(0.7, 0.36), P(0.76, 0.3)];
  const back = [P(0.43, 0.66), P(0.33, 0.76), P(0.2, 0.88)];
  const trees = [[0.2, 0.5], [0.26, 0.42], [0.14, 0.6], [0.3, 0.34], [0.62, 0.74], [0.68, 0.66]].map(([u, v]) => { const [x, y] = P(u, v); return `<circle cx="${x}" cy="${y}" r="${Math.min(cw, ch) * 0.05}" fill="${SAGE}" fill-opacity=".35"/>`; }).join('');
  const stream = `<path d="M${P(0.52, 1).join(' ')}C${P(0.56, 0.86).join(' ')} ${P(0.5, 0.8).join(' ')} ${P(0.56, 0.68).join(' ')}S${P(0.64, 0.5).join(' ')} ${P(0.74, 0.42).join(' ')}" stroke="${LAKE_SOFT}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  const map = `<rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="18" fill="white" stroke="${RULE}" stroke-width="1.5"/>${trees}${stream}
    <ellipse cx="${lake[0]}" cy="${lake[1]}" rx="${cw * 0.08}" ry="${ch * 0.08}" fill="${LAKE_SOFT}" stroke="${LAKE}" stroke-width="2"/>
    ${trace(walked, { dash: '0', width: 5 })}${trace(whatIf, { color: AHEAD, width: 4, dash: '2 9' })}
    ${trace(back, { width: 3.2, dash: '1 8' })}${arrowEnd(back)}
    <path d="M${rock[0] - 13} ${rock[1] + 6}c0-12 8-18 15-18s12 8 12 18z" fill="${MIST}"/>
    <circle cx="${trailhead[0]}" cy="${trailhead[1]}" r="7" fill="${FOREST}"/>
    ${bottle(whatIf[3][0] + 14, whatIf[3][1] + 4, { empty: true, s: 0.8 })}
    ${label(P(0.62, 0.36)[0] - 6, P(0.62, 0.36)[1] - 12, W('03', 'whatif'), { anchor: 'end', halo: 'white' })}
    ${label(back[2][0] + 34, back[2][1] + 34, W('03', 'back'), { anchor: 'middle', halo: 'white' })}`;
  const gy = Math.round(h * 0.9);
  const eh = Math.min(h * 0.24, w * 0.2); const s = eh / 64;
  const ex = 46 * s + 24;
  const ds = (h * 0.2) / 72;
  const dx = ex + 39 * s + 40; const ax = dx + 34 * ds;
  return svg(w, h, `${map}${ground(w, gy, h)}${pair(ex, gy, eh, { gap: 'var(--color-paper-deep)' })}
    ${walker(dad(), dx, gy, ds)}${walker(alfredo(), ax, gy, ds)}
    ${chip(ax + 26 * ds + 110, gy - 46 * ds, W('03', 'card'), { icon: WATER_ICON })}`);
}

// ——— The fork, shared by steps 04 and 05 and activities A and C ———
export function forkGeometry(w, h) {
  const gy = Math.round(h * 0.3);
  const eh = Math.min(h * 0.26, w * 0.22);
  const F = [w * 0.36, h * 0.71];
  const T = [w * 0.86, h * 0.43]; const S = [w * 0.86, h * 0.79];
  const trunk = [[-40, h * 0.8], [w * 0.16, h * 0.76], F];
  const main = [F, [w * 0.56, h * 0.57], [w * 0.74, h * 0.47], [T[0] - 60, T[1] + 4]];
  const side = [F, [w * 0.54, h * 0.78], [w * 0.7, h * 0.8], [S[0] - 50, S[1]]];
  const spots = { fork: [w * 0.3, h * 0.72], turn: [w * 0.5, h * 0.6], drift: [w * 0.66, h * 0.8], home: [w * 0.67, h * 0.545] };
  const reinsTrace = [[w * 0.4, h * 0.68], [w * 0.46, h * 0.625], [w * 0.5, h * 0.64], [w * 0.52, h * 0.71], [w * 0.54, h * 0.785]];
  const turnTrace = [[w * 0.4, h * 0.68], [w * 0.44, h * 0.64], [w * 0.47, h * 0.62]];
  const pathTrace = [[w * 0.36, h * 0.71], [w * 0.46, h * 0.62], [w * 0.5, h * 0.59], [w * 0.53, h * 0.57]];
  return { gy, eh, F, T, S, trunk, main, side, spots, reinsTrace, turnTrace, pathTrace };
}
/**
 * The fork scene, seen from a little above: the ground is the stage, the paths are the lessons' ground colour.
 * `game`: 'screen' or 'box'; `books`: 'bag' or 'out'; `at`: where the elephant stands; `traces`: any of
 * 'reins' (dotted, the pull and the drift back), 'reinsFaint', 'path' (the easy way home).
 */
export function forkScene(w, h, { game = 'screen', books = 'bag', at = 'fork', pose = 'stand', reins = false, traces = [], words = {} } = {}) {
  const g = forkGeometry(w, h);
  const ps = Math.min(1.2, h / 680);
  const sideFaint = game === 'box';
  const [ex, ey] = g.spots[at];
  const tr = [];
  if (traces.includes('reinsFaint')) tr.push(trace(g.reinsTrace, { color: QUIET, opacity: 0.6 }), arrowEnd(g.reinsTrace, { color: QUIET }));
  if (traces.includes('reins')) tr.push(trace(g.reinsTrace), arrowEnd(g.reinsTrace));
  if (traces.includes('turn')) tr.push(trace(g.turnTrace), arrowEnd(g.turnTrace));
  if (traces.includes('path')) tr.push(trace(g.pathTrace, { dash: '10 9', width: 3.6 }), arrowEnd(g.pathTrace));
  const wordAt = [];
  if (words.game) wordAt.push(chip(g.S[0], g.S[1] - (sideFaint ? 46 : 96) * ps - 26, words.game));
  if (words.home) wordAt.push(chip(g.T[0], g.T[1] - (books === 'out' ? 92 : 106) * ps - 26, words.home));
  if (words.reins) { const p = g.reinsTrace[4]; wordAt.push(label(p[0] - 10, p[1] + 52, words.reins, { color: QUIET, anchor: 'middle' })); }
  if (words.path) { const p = g.pathTrace[1]; wordAt.push(label(p[0] - 30, p[1] - 30, words.path, { anchor: 'end' })); }
  const tufts = [[0.08, 0.5], [0.2, 0.62], [0.52, 0.44], [0.3, 0.9], [0.62, 0.92], [0.42, 0.38]].map(([u, v]) => tuft(w * u, h * v)).join('');
  const overgrown = sideFaint ? [[0.6, 0.79], [0.7, 0.81], [0.78, 0.79], [0.66, 0.77]].map(([u, v]) => tuft(w * u, h * v, 1.2)).join('') : '';
  const ways = sideFaint
    ? `${paths([[g.trunk, 62, 58], [g.main, 58, 34, false]])}${paths([[g.side, 50, 36, false]], { opacity: 0.1 })}`
    : paths([[g.trunk, 62, 58], [g.main, 58, 34, false], [g.side, 50, 36, false]]);
  return svg(w, h, `${sun(w * 0.62, h * 0.12, Math.min(w, h) * 0.045)}${hills(w, g.gy, h * 0.07)}${horizon(w, g.gy)}${tufts}
    ${ways}${overgrown}
    ${table(g.T[0], g.T[1], ps, { books })}${game === 'screen' ? gameScreen(g.S[0], g.S[1], ps) : gameBox(g.S[0], g.S[1], ps)}
    ${tr.join('')}${pair(ex, ey, g.eh, { pose, reins })}${wordAt.join('')}`);
}

// 04 · The pull: the elephant at the fork, nearer the game; the dotted line turns toward homework, then back.
const reinsStep = (w, h) => forkScene(w, h, { reins: true, traces: ['reins'], words: { game: W('04', 'game'), home: W('04', 'home') } });
// 05 · The game put away, the books out: the elephant walks the main path, no pulling.
const pathStep = (w, h) => forkScene(w, h, { game: 'box', books: 'out', at: 'home', pose: 'walk1', traces: ['path'], words: { game: W('05', 'away'), home: W('05', 'ready') } });

// 06 · Together up a gentle rise toward a lookout, the path behind them.
function team(w, h) {
  const line = `M0 ${h * 0.62}C${w * 0.38} ${h * 0.6} ${w * 0.62} ${h * 0.42} ${w} ${h * 0.36}`;
   const hill = `<path d="${line}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
  const route = [[-30, h * 0.9], [w * 0.22, h * 0.84], [w * 0.5, h * 0.76], [w * 0.7, h * 0.6], [w * 0.86, h * 0.47]];
  const eh = Math.min(h * 0.27, w * 0.24);
  const ex = w * 0.44; const ey = h * 0.77;
  const prints = elephantPrints([[-10, h * 0.9], [w * 0.16, h * 0.845], [ex - eh * 0.75, ey + 4]], { step: 30, side: 8, r: 6 });
  return svg(w, h, `${sun(w * 0.78, h * 0.15, Math.min(w, h) * 0.055)}${hill}${path(route, 62, 24)}${prints}
    ${tree(w * 0.93, h * 0.43, 1)}${bench(w * 0.8, h * 0.465)}${tuft(w * 0.3, h * 0.95)}${tuft(w * 0.64, h * 0.84)}${tuft(w * 0.12, h * 0.7)}
    ${pair(ex, ey, eh, { pose: 'walk2' })}`);
}

// 07 · Optional: the elephant has already turned its back on a new food; the rider gives a reason.
function first(w, h) {
  const gy = Math.round(h * 0.72);
  const eh = Math.min(h * 0.32, w * 0.28); const s = eh / 64;
  const ex = w * 0.56;
  const r = riderAt(ex, gy, eh);
  const say = [Math.min(w - 90, r.x + 110), r.y - 40];
  const px = Math.max(80, ex - 46 * s - 100);
  return svg(w, h, `${ground(w, gy, h)}${plate(px, gy, Math.min(1.3, h / 600))}
    ${pair(ex, gy, eh)}
    ${leader(say[0] - 40, say[1] + 12, r.x + 4 * s, r.y - 6 * s)}${chip(say[0], say[1], W('07', 'reason'))}`);
}

// 08 · The pair small on the open path, a wide landscape; the takeaways sit in the band below.
function keep(w, h) {
  const gy = Math.round(h * 0.5);
  const eh = Math.min(h * 0.17, w * 0.13);
  return svg(w, h, `${sun(w * 0.82, h * 0.2, Math.min(w, h) * 0.06)}${hills(w, gy, h * 0.12)}${tree(w * 0.1, gy, 0.8)}${tree(w * 0.68, gy, 0.6)}
    ${horizon(w, gy)}${tuft(w * 0.16, h * 0.66)}${tuft(w * 0.74, h * 0.7)}${tuft(w * 0.5, h * 0.95)}
    ${path([[-40, h * 0.96], [w * 0.3, h * 0.86], [w * 0.62, h * 0.72], [w * 0.9, gy + 8]], 54, 10)}
    ${pair(w * 0.3, h * 0.87, eh, { pose: 'walk1' })}`);
}

// 09 · A well-worn trail, walked many times; the elephant on it.
function next(w, h) {
  const gy = Math.round(h * 0.42);
  const eh = Math.min(h * 0.27, w * 0.22);
  const route = [[-40, h * 0.86], [w * 0.3, h * 0.8], [w * 0.6, h * 0.68], [w * 0.86, h * 0.56], [w + 40, h * 0.52]];
  const ex = w * 0.38; const ey = h * 0.79;
  const ahead = elephantPrints([[ex + eh * 0.9, h * 0.755], [w * 0.6, h * 0.68], [w * 0.86, h * 0.56], [w + 30, h * 0.52]], { step: 30, side: 8, r: 6 });
  const behind = elephantPrints([[-30, h * 0.86], [ex - eh * 0.9, h * 0.8]], { step: 30, side: 8, r: 6 });
  const edges = [[0.08, 0.94], [0.2, 0.72], [0.5, 0.62], [0.7, 0.72], [0.74, 0.5], [0.94, 0.6], [0.56, 0.8], [0.3, 0.6]].map(([u, v]) => tuft(w * u, h * v)).join('');
  return svg(w, h, `${hills(w, gy, h * 0.08)}${horizon(w, gy)}${path(route, 76, 34)}${ahead}${behind}${edges}
    ${pair(ex, ey, eh, { pose: 'walk1' })}`);
}

const ITEMS = [
  { id: 'story-01', copy: '01', stage: meet },
  { id: 'story-02', copy: '02', stage: quick },
  { id: 'story-03', copy: '03', stage: slow },
  { id: 'story-04', copy: '04', stage: reinsStep },
  { id: 'story-05', copy: '05', stage: pathStep },
  { id: 'story-06', copy: '06', stage: team },
  { id: 'story-07', copy: '07', stage: first, kicker: W('07', 'kicker') },
  { id: 'story-08', copy: '08', stage: keep },
  { id: 'story-09', copy: '09', stage: next, nextLabel: W('09', 'button') },
];
export const STAGES = { meet, quick, slow, reinsStep, pathStep, team, first, keep, next };

/** The takeaways' small pictures: the pair, the elephant's prints again and again, a fork in the path. */
export const TAKEAWAY_ICONS = [
  `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/>${pair(22, 35, 20, { gap: GROUND_GAP })}</svg>`,
  `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/>${elephantPrints([[6, 30], [40, 14]], { step: 9, side: 4, r: 3.4, color: FOREST, opacity: 0.85 })}</svg>`,
  `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/><path d="M10 34C16 30 19 26 21 21M21 21C24 16 28 13 34 11M21 21C26 21 30 24 33 28" stroke="${FOREST}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M21 21C26 21 30 24 33 28" stroke="${SAGE}" stroke-width="3.4" fill="none" stroke-linecap="round"/></svg>`,
];

export function start(root) {
  // The trail's Activity stop sits between One team and Takeaways, so story 07's Next goes to it.
  const items = ITEMS.map(item => (item.copy === '07' ? { ...item, nextLabel: ui('lesson.ui.nextChapter').replace('{chapter}', word('A1', 'chapter')) } : item));
  mount(root, buildFrames(items, STORY_CHAPTERS), TAKEAWAY_ICONS);
}
