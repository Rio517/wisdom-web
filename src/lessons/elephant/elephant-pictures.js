// Lesson 3's pictures, one function a step, ported from the approved frames (prototype/lesson3-elephant/
// storyboard.js, design 004 v02, lane A). Each returns the stage's markup for a stage of w × h px: the
// drawing as SVG and its words as HTML (elephant-draw.js). Words come from the catalog (elephant.*).
import { t } from '../../i18n/runtime.js';
import {
  art, svg, label, chip, pair, riderAt, ground, horizon, sun, hills, tree, tuft, path, trace, arrowEnd, elephantPrints,
  stove, plank, plate, alfredo, dad, walker, bottle, maya, bench, car, jacket, friend, chalkGame,
  WATER_ICON, GROUND_GAP, FOREST, SAGE, RULE, LAKE, LAKE_SOFT, MIST, AHEAD,
} from './elephant-draw.js';

/**
 * Each step's elephant (shared/elephant.js poses, asset-factory request 2026-10-17-elephant). Every rider is
 * the neutral one (RIDER_LOOK, set in pair()); `riderPose` overrides the pose's own rider. `trunkOnPath`
 * where a front view's trunk tip rests on the path.
 */
export const POSES = {
  pair: { pose: 'stand' },
  quick: { pose: 'walk1' },
  slow: { pose: 'stand' },
  now: { pose: 'walk1' },
  reins: { pose: 'pulled', reins: true },
  path: { pose: 'toward1' },
  team: { pose: 'away1' },
  first: { pose: 'left', riderPose: 'explain' },
  keep: { pose: 'walk1' },
  next: { pose: 'toward1', trunkOnPath: true },
  partners: { pose: 'stand' },
};
const at = (id, extra = {}) => ({ ...POSES[id], ...extra });
const W = key => t(key);

// 01 · The hero: a big, calm elephant on the ground line, its small rider looking ahead; the path runs on over low hills.
function pairStep(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.8);
    const eh = Math.min(h * 0.36, w * 0.32); const s = eh / 64;
    const ex = Math.max(46 * s + 140, w * 0.4); const ey = gy;
    const rise = `M${ex + 20 * s} ${gy}C${w * 0.7} ${gy - h * 0.2} ${w * 0.86} ${gy - h * 0.22} ${w + 30} ${gy - h * 0.12}V${gy}Z`;
    const far = `M${w * 0.72} ${gy}C${w * 0.8} ${gy - h * 0.3} ${w * 0.95} ${gy - h * 0.32} ${w + 30} ${gy - h * 0.26}V${gy}Z`;
    const ahead = [[ex + 46 * s, gy + 20], [w * 0.7, gy + 6], [w * 0.8, gy - h * 0.1], [w * 0.92, gy - h * 0.165]];
    const r = riderAt(ex, ey, eh);
    const size = Math.round(Math.max(18, Math.min(22, h / 36)));
    label(r.x - 2 * s, r.y - 14 * s, W('elephant.beat.pair.rider'), { size, anchor: 'middle' });
    label(ex - 49 * s, ey - 33 * s, W('elephant.beat.pair.elephant'), { size, anchor: 'end' });
    return svg(w, h, `${sun(w * 0.14, h * 0.17, Math.min(w, h) * 0.05)}<path d="${far}" fill="${SAGE}" fill-opacity=".18"/><path d="${rise}" fill="${SAGE}" fill-opacity=".26"/>
      ${tree(w * 0.8, gy - h * 0.2, 0.8)}${tree(w * 0.94, gy - h * 0.25, 0.6)}
      ${ground(w, gy, h)}${trace(ahead, { color: AHEAD, dash: '0', width: 4 })}${tuft(w * 0.08, gy + 34)}${tuft(w * 0.66, gy + 50, 1.2)}
      ${pair(ex, ey, eh, at('pair'))}`);
  });
}

// 02 · Lesson 2's last picture again: Maya dribbles, eyes up, her elephant right behind her; two more quick moments ahead.
function quick(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.66);
    const mh = Math.max(110, Math.min(170, h * 0.21));
    const eh = mh * 1.05; const s = eh / 64;
    const ex = 46 * s + 26;
    const mx = ex + 39 * s + 22 + 0.42 * mh * 60 / 62;
    const sx = Math.max(mx + 0.58 * mh + 120, w * 0.64); const px = w - Math.max(90, w * 0.12);
    const stoveScale = Math.min(1.2, h / 640); const plankScale = Math.min(1.1, h / 700);
    label(mx + 6, gy + 44, W('elephant.beat.quick.feet'), { anchor: 'middle' });
    label(sx, gy + 44, W('elephant.beat.quick.pan'), { anchor: 'middle' });
    label(px, gy + 120, W('elephant.beat.quick.off'), { anchor: 'middle' });
    return svg(w, h, `${ground(w, gy, h)}${pair(ex, gy, eh, at('quick'))}
      ${maya(mx, gy, mh)}${stove(sx, gy, stoveScale)}${plank(px, gy + 6, plankScale)}`);
  });
}

// 03 · Lesson 1's trail map: the walked way to the big rock, the dotted what-if to the lake, the turn back.
function slow(w, h) {
  return art(() => {
    const cx0 = Math.max(28, w * 0.26); const cy0 = 28; const cw = w - cx0 - 28; const ch = h * 0.56;
    const P = (u, v) => [cx0 + u * cw, cy0 + v * ch];
    const trailhead = P(0.08, 0.86); const rock = P(0.46, 0.56); const lake = P(0.86, 0.2);
    const walked = [trailhead, P(0.22, 0.8), P(0.34, 0.66), rock];
    const whatIf = [rock, P(0.6, 0.48), P(0.7, 0.36), P(0.76, 0.3)];
    const back = [P(0.43, 0.66), P(0.33, 0.76), P(0.2, 0.88)];
    const trees = [[0.2, 0.5], [0.26, 0.42], [0.14, 0.6], [0.3, 0.34], [0.62, 0.74], [0.68, 0.66]].map(([u, v]) => { const [x, y] = P(u, v); return `<circle cx="${x}" cy="${y}" r="${Math.min(cw, ch) * 0.05}" fill="${SAGE}" fill-opacity=".35"/>`; }).join('');
    const stream = `<path d="M${P(0.52, 1).join(' ')}C${P(0.56, 0.86).join(' ')} ${P(0.5, 0.8).join(' ')} ${P(0.56, 0.68).join(' ')}S${P(0.64, 0.5).join(' ')} ${P(0.74, 0.42).join(' ')}" stroke="${LAKE_SOFT}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    label(P(0.62, 0.36)[0] - 6, P(0.62, 0.36)[1] - 12, W('elephant.beat.slow.whatif'), { anchor: 'end', onWhite: true });
    label(back[2][0] + 34, back[2][1] + 34, W('elephant.beat.slow.back'), { anchor: 'middle', onWhite: true });
    const map = `<rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="18" fill="white" stroke="${RULE}" stroke-width="1.5"/>${trees}${stream}
      <ellipse cx="${lake[0]}" cy="${lake[1]}" rx="${cw * 0.08}" ry="${ch * 0.08}" fill="${LAKE_SOFT}" stroke="${LAKE}" stroke-width="2"/>
      ${trace(walked, { dash: '0', width: 5 })}${trace(whatIf, { color: AHEAD, width: 4, dash: '2 9' })}
      ${trace(back, { width: 3.2, dash: '1 8' })}${arrowEnd(back)}
      <path d="M${rock[0] - 13} ${rock[1] + 6}c0-12 8-18 15-18s12 8 12 18z" fill="${MIST}"/>
      <circle cx="${trailhead[0]}" cy="${trailhead[1]}" r="7" fill="${FOREST}"/>
      ${bottle(whatIf[3][0] + 14, whatIf[3][1] + 4, { empty: true, s: 0.8 })}`;
    const gy = Math.round(h * 0.9);
    const eh = Math.min(h * 0.24, w * 0.2); const s = eh / 64;
    const ex = 46 * s + 24;
    const ds = (h * 0.2) / 72;
    const dx = ex + 39 * s + 40; const ax = dx + 34 * ds;
    chip(ax + 26 * ds + 110, gy - 46 * ds, W('elephant.beat.slow.card'), { icon: WATER_ICON });
    return svg(w, h, `${map}${ground(w, gy, h)}${pair(ex, gy, eh, at('slow'))}
      ${walker(dad(), dx, gy, ds)}${walker(alfredo(), ax, gy, ds)}`);
  });
}

// 03b · Now or later: the family waits in the car, its back door open; the pair walks over, the stuck jacket left for later.
function now(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.76);
    const eh = Math.min(h * 0.3, w * 0.26); const s = eh / 64;
    const cs = Math.min(1.7, (w * 0.56) / 300);
    const cx = w - 150 * cs - Math.max(28, w * 0.04);
    const ex = Math.max(46 * s + 30, cx - 150 * cs - 50 * s);
    const jx = ex - 4 * s; const jy = gy + Math.min(78, (h - gy) * 0.5);
    chip(cx + 40 * cs, gy - 116 * cs - 34, W('elephant.beat.now.car'));
    label(jx + 66, jy + 8, W('elephant.beat.now.zip'));
    return svg(w, h, `${sun(w * 0.16, h * 0.16, Math.min(w, h) * 0.045)}
      ${ground(w, gy, h)}
      ${car(cx, gy, cs)}
      ${pair(ex, gy, eh, at('now'))}
      ${jacket(jx, jy, Math.min(1.1, h / 700))}`);
  });
}

// The park, shared by steps 04 and 05: a chalk game on the path, a friend with the ball, a tree.
function park(w, h, { step05 = false } = {}) {
  return art(() => {
    const gy = Math.round(h * 0.34);
    const eh = Math.min(h * 0.3, w * 0.26); const s = eh / 64;
    const gs = Math.min(1.25, w / 820);
    const game = [w * 0.6, h * 0.8];
    const fx = w * 0.86; const fy = h * 0.72; const fh = eh * 0.74;
    const tx = w * 0.08; const ty = h * 0.56;
    const walk = [[-40, h * 0.92], [w * 0.3, h * 0.86], [game[0], game[1]], [w + 40, h * 0.74]];
    const away = [[w * 0.44, h * 0.85], [w * 0.37, h * 0.72], [w * 0.29, h * 0.62]];
    const tufts = [[0.3, 0.44], [0.52, 0.4], [0.7, 0.5], [0.5, 0.97], [0.94, 0.94], [0.08, 0.98]].map(([u, v]) => tuft(w * u, h * v)).join('');
    const base = `${sun(w * 0.8, h * 0.13, Math.min(w, h) * 0.045)}${hills(w, gy, h * 0.08)}${horizon(w, gy)}${tufts}
      ${path(walk, 74, 60)}${step05 ? path(away, 46, 40) : ''}${tree(tx, ty, 1.6)}
      ${chalkGame(game[0], game[1], gs, { changed: !step05 })}${friend(fx, fy, fh)}`;
    if (!step05) {
      const ex = Math.max(46 * s + 30, w * 0.27); const ey = h * 0.9;
      chip(game[0] + 30 * gs, game[1] - 40 * gs - 26, W('elephant.beat.reins.rules'));
      return svg(w, h, `${base}${pair(ex, ey, eh, at('reins'))}`);
    }
    const ee = eh * 0.8; const ex = w * 0.3; const ey = h * 0.62;
    label(ex - 4, ey + 34, W('elephant.beat.path.breath'), { anchor: 'middle' });
    chip(game[0], game[1] - 40 * gs - 26, W('elephant.beat.path.agree'));
    return svg(w, h, `${base}${pair(ex, ey, ee, at('path'))}`);
  });
}
// 04 · The pull: the friend draws a new rule; the elephant wants to yell, and the rider holds the reins.
const reins = (w, h) => park(w, h);
// 05 · Easier paths: a few steps away by the tree, calm, the friend waiting at the game.
const pathStep = (w, h) => park(w, h, { step05: true });

// 06 · Together up a gentle rise toward a lookout, the path behind them.
function team(w, h) {
  return art(() => {
    const line = `M0 ${h * 0.62}C${w * 0.38} ${h * 0.6} ${w * 0.62} ${h * 0.42} ${w} ${h * 0.36}`;
    const hill = `<path d="${line}" stroke="${SAGE}" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
    const route = [[-30, h * 0.9], [w * 0.22, h * 0.84], [w * 0.5, h * 0.76], [w * 0.7, h * 0.6], [w * 0.86, h * 0.47]];
    const eh = Math.min(h * 0.27, w * 0.24);
    const ex = w * 0.44; const ey = h * 0.77;
    const prints = elephantPrints([[-10, h * 0.9], [w * 0.16, h * 0.845], [ex - eh * 0.75, ey + 4]], { step: 30, side: 8, r: 6 });
    return svg(w, h, `${sun(w * 0.78, h * 0.15, Math.min(w, h) * 0.055)}${hill}${path(route, 62, 24)}${prints}
      ${tree(w * 0.93, h * 0.43, 1)}${bench(w * 0.8, h * 0.465)}${tuft(w * 0.3, h * 0.95)}${tuft(w * 0.64, h * 0.84)}${tuft(w * 0.12, h * 0.7)}
      ${pair(ex, ey, eh, at('team'))}`);
  });
}

// 07 · Optional: the elephant has already turned its back on a new food; the rider gives a reason.
function first(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.72);
    const eh = Math.min(h * 0.32, w * 0.28); const s = eh / 64;
    const ex = w * 0.56;
    const r = riderAt(ex, gy, eh);
    const ps = Math.min(1.3, h / 600);
    const px = Math.min(w - 50 * ps - 16, ex + 41 * s + 50 * ps + 24); // behind it: it has turned its back on the plate
    chip(r.x - 2 * s, r.y - 17 * s, W('elephant.beat.first.reason'));
    return svg(w, h, `${ground(w, gy, h)}${plate(px, gy, ps)}
      ${pair(ex, gy, eh, at('first'))}`);
  });
}

// 08 · The pair small on the open path, a wide landscape; the takeaways sit in the band below.
function keep(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.5);
    const eh = Math.min(h * 0.17, w * 0.13);
    return svg(w, h, `${sun(w * 0.82, h * 0.2, Math.min(w, h) * 0.06)}${hills(w, gy, h * 0.12)}${tree(w * 0.1, gy, 0.8)}${tree(w * 0.68, gy, 0.6)}
      ${horizon(w, gy)}${tuft(w * 0.16, h * 0.66)}${tuft(w * 0.74, h * 0.7)}${tuft(w * 0.5, h * 0.95)}
      ${path([[-40, h * 0.96], [w * 0.3, h * 0.86], [w * 0.62, h * 0.72], [w * 0.9, gy + 8]], 54, 10)}
      ${pair(w * 0.3, h * 0.87, eh, at('keep'))}`);
  });
}

// 09 · A well-worn trail, walked many times; the elephant on it.
function next(w, h) {
  return art(() => {
    const gy = Math.round(h * 0.42);
    const eh = Math.min(h * 0.27, w * 0.22);
    const route = [[-40, h * 0.86], [w * 0.3, h * 0.8], [w * 0.6, h * 0.68], [w * 0.86, h * 0.56], [w + 40, h * 0.52]];
    const ex = w * 0.38; const ey = h * 0.79;
    const ahead = elephantPrints([[ex + eh * 0.9, h * 0.755], [w * 0.6, h * 0.68], [w * 0.86, h * 0.56], [w + 30, h * 0.52]], { step: 30, side: 8, r: 6 });
    const behind = elephantPrints([[-30, h * 0.86], [ex - eh * 0.9, h * 0.8]], { step: 30, side: 8, r: 6 });
    const edges = [[0.08, 0.94], [0.2, 0.72], [0.5, 0.62], [0.7, 0.72], [0.74, 0.5], [0.94, 0.6], [0.56, 0.8], [0.3, 0.6]].map(([u, v]) => tuft(w * u, h * v)).join('');
    return svg(w, h, `${hills(w, gy, h * 0.08)}${horizon(w, gy)}${path(route, 76, 34)}${ahead}${behind}${edges}
      ${pair(ex, ey, eh, at('next'))}`);
  });
}

/** The activity's scene above the board: the pair in the middle, big and calm, on a low rise with hills behind. */
export function sortScene(w, h) {
  const gy = Math.round(h - 14);
  const eh = Math.min((gy - 28) * 0.8, w * 0.25); const s = eh / 64;
  const ex = w / 2 + 2 * s;
  return svg(w, h, `${sun(w * 0.84, gy * 0.32, Math.min(w, gy) * 0.07)}${hills(w, gy, gy * 0.2)}${horizon(w, gy)}
    ${tuft(w * 0.14, gy - 4)}${tuft(w * 0.8, gy - 4, 1.2)}${pair(ex, gy, eh, at('partners'))}`);
}

export const PICTURES = { pair: pairStep, quick, slow, now, reins, path: pathStep, team, first, keep, next };

/** The takeaways' small pictures: the pair, the elephant's prints again and again, a fork in the path. */
export const TAKEAWAY_ICONS = {
  team: `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/>${pair(22, 35, 20, { gap: GROUND_GAP })}</svg>`,
  learn: `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/>${elephantPrints([[6, 30], [40, 14]], { step: 9, side: 4, r: 3.4, color: FOREST, opacity: 0.85 })}</svg>`,
  paths: `<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="21" fill="${FOREST}" fill-opacity=".08"/><path d="M10 34C16 30 19 26 21 21M21 21C24 16 28 13 34 11M21 21C26 21 30 24 33 28" stroke="${FOREST}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M21 21C26 21 30 24 33 28" stroke="${SAGE}" stroke-width="3.4" fill="none" stroke-linecap="round"/></svg>`,
};
