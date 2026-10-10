// Alfredo's hike map. Three stacked layers share one box and one coordinate
// system (the 1200 x 800 viewBox, see journey-hike-geometry.js): the flat
// background (hills and the falls' rocks), the water (journey-hike-water.js,
// loaded once the hike is shown), then the trail, trees, people and labels.
import { LEARNED } from './journey-story.js';
import { t } from '../../i18n/runtime.js';
import { ICONS, alfredo, dad } from './journey-icons.js';
import { tween, ease, wait } from './journey-motion.js';
import { FAR_RIDGE, HILL, GROUND, FALL, FALLS_DROP, POOL, RISE_LEVEL, LAKE_SHORE, MAIN as STREAM, fallEdges, groundY, hillCrestY, keepClear, outline, pathTrack } from './journey-hike-geometry.js';

// Everything above the green hill's crest: where the trail's far stretch shows.
const ABOVE_HILL = `M-400 -400 L1600 -400 L1600 440 L${Array.from({ length: 121 }, (_, i) => 1200 - i * 10).map(x => `${x} ${hillCrestY(x).toFixed(1)}`).join(' L')} L-400 480 Z`;

const tx = key => String(t(key)).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const n1 = value => value.toFixed(1);

// Cubic segments (` C ...`) through `points` (Catmull-Rom), carrying on from the first point.
const through = points => points.slice(0, -1).map((p, i) => {
  const [a, b, c] = [points[Math.max(0, i - 1)], points[i + 1], points[Math.min(points.length - 1, i + 2)]];
  const c1 = [p[0] + (b[0] - a[0]) / 6, p[1] + (b[1] - a[1]) / 6];
  const c2 = [b[0] - (c[0] - p[0]) / 6, b[1] - (c[1] - p[1]) / 6];
  return ` C ${[c1, c2, b].map(([x, y]) => `${n1(x)} ${n1(y)}`).join(', ')}`;
}).join('');
// The trail from the trailhead, over the bridge (628, 505), up to the green hill's crest. It goes over
// the hill and on behind it (never drawn), comes back into view on the far right, beside the falls'
// rock, and climbs in two switchbacks to a small clearing on Mirror Lake's right-hand shore.
const FAR_KEYS = [
  [1182, 448], [1173, 422], [1146, 395], [1128, 378], [1125, 370], [1133, 364], [1160, 349], [1170, 342],
  [1172, 334], [1163, 327], [1142, 312], [1132, 302],
];
const MAIN = 'M110 660 C 180 650, 230 612, 300 596 S 410 566, 452 548 S 560 520, 628 505 C 690 492, 735 476, 772 452 S 830 406, 854 386'
  + ` C 880 368, 1196 486, ${FAR_KEYS[0].join(' ')}${through(FAR_KEYS)}`;
const MAIN_LENGTH = pathTrack(MAIN).length;
// The Waterfall Trail leaves the bridge eastwards, above the side stream, to a lookout beside the falls.
const ALT = 'M628 505 C 668 498, 712 497, 756 503 S 880 522, 930 525 S 974 528, 989 530';
// Where the pair stands at the trailhead (map units along the trail): clear of the cabin. The walked
// line still starts at the trail's start, and the practice walks start and end where they stand.
const HOME = 22;
// Halfway, as a fraction of the trail, and where the second walk stops short of the bridge
// (map units): both kept where they were before the trail went over the hill.
const TURN = 355.4 / MAIN_LENGTH;
const BRIDGE_GAP = 10.7;
// Practice walks: out along a short path to a loop and back.
const LOOP_SPOTS = [[190, 735], [340, 738], [490, 735]];
const LOOP_RX = 58;
const LOOP_RY = 26;
const loopPath = ([cx, cy]) => {
  const top = cy - LOOP_RY;
  return `M${cx} ${top} A${LOOP_RX} ${LOOP_RY} 0 1 1 ${cx} ${cy + LOOP_RY} A${LOOP_RX} ${LOOP_RY} 0 1 1 ${cx} ${top}`;
};
const connectorPath = ([x, y], [cx, cy]) => `M${n1(x)} ${n1(y)} C ${n1(x + (cx - x) * 0.35)} 668, ${cx - 50} ${cy - LOOP_RY}, ${cx} ${cy - LOOP_RY}`;

const TREE_SPOTS = [
  [196, 548, 1], [226, 532, .9], [258, 556, 1.1], [300, 520, .95], [338, 540, 1], [372, 510, 1.05], [520, 488, .9], [556, 470, 1],
  [406, 494, .85], [470, 470, .9], [236, 600, .8], [380, 610, .85], [520, 596, .8], [168, 590, .85], [700, 560, .9], [760, 596, .85],
  [820, 470, .8], [870, 452, .75], [690, 350, .7], [642, 372, .65], [590, 420, .8], [930, 430, .7], [980, 452, .75],
  [1040, 500, 1], [1092, 470, .9], [1136, 522, 1.1], [1010, 548, .85], [1104, 430, .8], [1150, 464, .9], [960, 566, .9], [900, 600, .85],
  [96, 520, .9], [64, 560, .8], [150, 500, .8], [262, 480, .7], [330, 466, .7],
];
// Keep trees clear of the trails, the water and the drawn features (lake, rocks, trailhead, loops, ranger).
// The ranger's speech bubble, beside him at the bridge.
const BUBBLE_X = 716;
const NO_TREE_BOXES = [[400, 590, 560, 700], [880, 250, 1130, 325], [0, 548, 190, 700], [100, 690, 640, 800], [700, 505, 1000, 580], [1004, 360, 1200, 600]];

// The trail narrows with distance: full width at the trailhead, half at the lake.
const NEAR_Y = 660;
const FAR_Y = 309;
const taper = y => 1 - 0.5 * Math.min(1, Math.max(0, (NEAR_Y - y) / (NEAR_Y - FAR_Y)));
const TRAIL_HALF = 5.5; // half the trail's width at the trailhead
const TRAIL_EDGE = 2; // its darker edge

// The trailhead's yard: bare ground seen at a low angle (about 4:1, with a gently uneven edge) under
// the cabin and the picnic table. The trail opens into it like a path into a yard: one shape in the
// trail's own colour with the trail's edge round it, the smooth union of the yard and the trail's
// first stretch (`blend` sets how far the join flares).
const YARD = { cx: 85, cy: 673.5, rx: 75, ry: 19.5, blend: 36 };
function yardShapes(start) {
  const { cx, cy, rx, ry, blend } = YARD;
  // Distance (map units, close to the edge) outside the yard's uneven ellipse.
  const yard = (x, y) => {
    const qx = (x - cx) / rx;
    const qy = (y - cy) / ry;
    const q = Math.hypot(qx, qy) || 1e-6;
    const a = Math.atan2(qy, qx);
    const edge = 1 + 0.022 * Math.sin(3 * a + 0.6) + 0.014 * Math.sin(5 * a + 2.1);
    return (q - edge) * q / (Math.hypot(qx / rx, qy / ry) || 1e-6);
  };
  // Distance from the trail's centre line, and its taper there.
  const [minX, maxX, minY, maxY] = [Math.min(...start.map(p => p.x)), Math.max(...start.map(p => p.x)), Math.min(...start.map(p => p.y)), Math.max(...start.map(p => p.y))];
  const trail = (x, y) => {
    if (x < minX - 40 || x > maxX + 40 || y < minY - 40 || y > maxY + 40) return [1e3, 1];
    let best = Infinity;
    let k = 1;
    for (let i = 1; i < start.length; i += 1) {
      const a = start[i - 1];
      const b = start[i];
      const [dx, dy] = [b.x - a.x, b.y - a.y];
      const u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const d = Math.hypot(x - a.x - dx * u, y - a.y - dy * u);
      if (d < best) { best = d; k = taper(a.y + dy * u); }
    }
    return [best, k];
  };
  const smin = (a, b) => {
    const h = Math.max(blend - Math.abs(a - b), 0) / blend;
    return Math.min(a, b) - h * h * blend / 4;
  };
  // Negative inside: the fill, and the fill with its edge.
  const fill = (x, y) => { const [d, k] = trail(x, y); return smin(yard(x, y), d - TRAIL_HALF * k); };
  const edged = (x, y) => { const [d, k] = trail(x, y); return smin(yard(x, y) - TRAIL_EDGE, d - (TRAIL_HALF + TRAIL_EDGE) * k); };
  // The union is star-shaped about the yard's centre: walk out along rays to where it ends.
  const REACH = 240;
  const contour = field => {
    const points = [];
    for (let i = 0; i < 240; i += 1) {
      const angle = (i / 240) * Math.PI * 2;
      const [ux, uy] = [Math.cos(angle), Math.sin(angle)];
      // Far enough to leave the trail's first stretch at its far end.
      let inner = 0;
      let outer = REACH;
      for (let r = 0; r < REACH;) {
        const d = field(cx + ux * r, cy + uy * r);
        if (d > 0) { outer = r; break; }
        inner = r;
        r += Math.max(0.6, -d * 0.7);
      }
      for (let j = 0; j < 8; j += 1) {
        const mid = (inner + outer) / 2;
        if (field(cx + ux * mid, cy + uy * mid) > 0) outer = mid; else inner = mid;
      }
      points.push(`${n1(cx + ux * inner)} ${n1(cy + uy * inner)}`);
    }
    return `M${points.join(' L')} Z`;
  };
  return { fill: contour(fill), edge: contour(edged), outside: p => yard(p.x, p.y) };
}

// The footbridge where the trail crosses the stream, in a three-quarter view drawn
// flat: a plank deck along the trail's direction, gently arched, with a near rail
// and a far rail (higher on screen and a little shorter), three posts each. The
// deck is a little wider than the trail, whose ends run under it on both banks.
function bridgeMarkup() {
  const [cx, cy] = [628, 505];
  const [dx, dy] = [0.9765, -0.2154]; // the trail's direction at the crossing
  const [nx, ny] = [-dy, dx]; // across the trail, towards the viewer
  const half = { near: 25, far: 23 };
  const width = 6.6; // half the deck's width
  const arch = 4.2;
  const face = 2.6; // the near edge's visible thickness
  const at = (s, side) => {
    const h = side > 0 ? half.near : half.far;
    return [cx + dx * h * s + nx * width * side, cy + dy * h * s + ny * width * side - arch * (1 - s * s)];
  };
  const p = ([x, y], down = 0) => `${n1(x)} ${n1(y + down)}`;
  const steps = Array.from({ length: 13 }, (_, i) => -1 + i / 6);
  const edge = (side, down = 0) => steps.map(s => p(at(s, side), down));
  const deck = `M${edge(-1).join(' L')} L${edge(1).reverse().join(' L')} Z`;
  const faceBand = `M${edge(1).join(' L')} L${edge(1, face).reverse().join(' L')} Z`;
  const planks = Array.from({ length: 11 }, (_, i) => -1 + (2 * (i + 1)) / 12).map(s => `M${p(at(s, -1))} L${p(at(s, 1))}`).join(' ');
  const posts = [-0.9, 0, 0.9];
  const rail = (side, height, foot) => ({
    stems: posts.map(s => `M${p(at(s, side), foot)} L${p(at(s, side), -height)}`).join(' '),
    rail: `M${steps.filter(s => Math.abs(s) <= 0.9 + 1e-6).map(s => p(at(s, side), -height)).join(' L')}`,
  });
  const far = rail(-1, 13, 1.5);
  const near = rail(1, 16, face);
  return `<g id="bridge">
    <path class="bridge-post far" d="${far.stems}"/><path class="bridge-rail far" d="${far.rail}"/>
    <path class="bridge-face" d="${faceBand}"/>
    <path class="bridge-deck" d="${deck}"/>
    <path class="bridge-plank" d="${planks}"/>
    <path class="bridge-post" d="${near.stems}"/><path class="bridge-rail" d="${near.rail}"/>
  </g>`;
}

// A small plank cabin and a picnic table on the yard.
function cabinMarkup() {
  return `<g id="cabin" transform="translate(56 662)">
    <rect class="cabin-chimney" x="12" y="-59" width="7" height="20"/><rect class="cabin-chimney-cap" x="11" y="-61" width="9" height="3"/>
    <path class="cabin-wall" d="M-26 0 V-31 L0 -50 L26 -31 V0 Z"/>
    <path class="cabin-plank" d="M-26 -8 H26 M-26 -16 H26 M-26 -24 H26 M-15 -32 H15 M-7 -40 H7"/>
    <path class="cabin-roof" d="M-34 -29 L0 -55 L34 -29 L30 -25.5 L0 -49 L-30 -25.5 Z"/>
    <rect class="cabin-door" x="-16" y="-20" width="10" height="20"/>
    <rect class="cabin-window" x="5" y="-24" width="13" height="11"/><path class="cabin-frame" d="M11.5 -24 V-13 M5 -18.5 H18"/>
  </g>
  <g id="picnic-table" transform="translate(90 688) scale(1.2)">
    <path class="table-leg" d="M-3 -11.5 L-11 0 M3 -11.5 L11 0 M-14 -6.8 H14"/>
    <rect class="table-wood" x="-10" y="-14" width="20" height="3"/>
    <rect class="table-wood" x="-18" y="-8.2" width="8" height="2.6"/><rect class="table-wood" x="10" y="-8.2" width="8" height="2.6"/>
  </g>`;
}

// The lake's far shore: a strip of the land around it laid over the water's far edge,
// so the lake sits in the land with the ground rising behind it. Its lower edge is
// the waterline.
const FAR_BANK = (() => {
  const east = LAKE_SHORE.reduce((best, p, i) => (p[0] > LAKE_SHORE[best][0] ? i : best), 0);
  const far = [...LAKE_SHORE.slice(east), LAKE_SHORE[0]];
  const n = far.length - 1;
  const ramp = i => Math.min(1, Math.min(i, n - i) / (n * 0.12));
  const waterline = far.map(([x, y], i) => [x, y + ramp(i) * (4 + 1.6 * Math.sin(x / 17) + 1.1 * Math.sin(x / 7.3))]);
  const line = points => points.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L');
  return {
    land: `M${line(waterline)} L${line(far.map(([x, y]) => [x, y - 16]).reverse())} Z`,
    waterline: `M${line(waterline)}`,
  };
})();

// Small trees on the lake's far shore, standing just behind the water.
const SHORE_TREES = [[910, 281, 0.5], [929, 277, 0.42], [1080, 272, 0.44], [1099, 276, 0.52]];
const shoreTree = ([x, y, s], i) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -44 L15 -8 H-15 Z M0 -30 L18 4 H-18 Z" fill="${i % 2 ? '#8daa91' : '#6f917a'}"/></g>`;

function tree([x, y, s]) {
  const index = TREE_SPOTS.findIndex(spot => spot[0] === x && spot[1] === y);
  const fill = index % 3 === 0 ? '#6f917a' : '#8daa91';
  return `<g class="tree" data-x="${x}" data-y="${y}" data-s="${s}" transform="translate(${x} ${y}) scale(${s})"><path d="M0 -44 L15 -8 H-15 Z" fill="${fill}"/><path d="M0 -30 L18 4 H-18 Z" fill="${fill}"/><rect x="-2.5" y="4" width="5" height="8" fill="#7b6a55"/></g>`;
}

function walkersMarkup() {
  return `<g class="walkers" id="walkers"><g class="walker-flip" id="walker-flip">
    <g transform="translate(8 0)">${dad()}</g><g transform="translate(-11 1.5)">${alfredo()}</g>
  </g></g>`;
}

// The falls group: the fall's rock and a smaller second rock standing partly behind it on
// the right. They are drawn where the round's prototype had them and moved down together
// by FALLS_DROP (FALL, the pool and the water are already moved), and their bases reach a
// little below the near ground's edge, so they stand on the ground.
function fallsMarkup() {
  const top = FALL.top - FALLS_DROP;
  const bottom = FALL.bottom - FALLS_DROP;
  const { margin } = FALL;
  // A rock's base from x0 to x1: never above `floor`, and 3 units below the ground's edge.
  const base = (x0, x1, floor) => {
    const steps = Math.ceil(Math.abs(x1 - x0) / 4);
    return Array.from({ length: steps + 1 }, (_, i) => {
      const x = x0 + (x1 - x0) * (i / steps);
      return `${n1(x)} ${n1(Math.max(floor, groundY(x) + 3 - FALLS_DROP))}`;
    }).join(' L');
  };
  // The notch is cut into the rock's top where the fall pours out: the sheet's top edge is
  // flush with its floor, and the notch and the darker channel below follow the sheet's
  // edges, FALL.margin outside them on both sides.
  const left = FALL.lip[0] - margin;
  const right = FALL.lip[1] + margin;
  const r = 1.8;
  const body = `M1016 564 C 1010 500, 1022 440, 1044 402 C 1049 391, 1055 383, ${left - 2.6} 380.6 Q${left} 380 ${left} 383.2`
    + ` L${left} ${top - r} Q${left} ${top} ${left + r} ${top} L${right - r} ${top} Q${right} ${top} ${right} ${top - r}`
    + ` L${right} 381.6 Q${right} 378.8 ${right + 2.6} 378.7 C 1117 378, 1127 384, 1132 392 C 1154 422, 1162 500, 1158 564 L${base(1158, 1016, 564)} Z`;
  const caps = `M1044 402 C 1049 391, 1055 383, ${left - 2.6} 380.6 Q${left} 380 ${left} 383.2 L${left} 386 C ${left - 6} 386.4, 1050 393, 1044 402 Z`
    + ` M${right} 385 L${right} 381.6 Q${right} 378.8 ${right + 2.6} 378.7 C 1117 378, 1127 384, 1132 392 C 1124 387.5, 1116 385, ${right} 385 Z`;
  const rows = Array.from({ length: 17 }, (_, i) => i / 16);
  const edge = (f, side) => fallEdges(f)[side] + (side ? margin : -margin);
  const y = f => top + (bottom - top) * f;
  const channel = `M${rows.map(f => `${n1(edge(f, 0))} ${n1(y(f))}`).join(' L')} L${n1(edge(1, 0))} 566`
    + ` L${n1(edge(1, 1))} 566 L${rows.slice().reverse().map(f => `${n1(edge(f, 1))} ${n1(y(f))}`).join(' L')} Z`;
  return `<g id="falls-rocks" transform="translate(0 ${FALLS_DROP})">
    <path d="M1124 566 C 1122 522, 1134 484, 1156 463 C 1166 453, 1178 446, 1187 451 C 1195 458, 1197 515, 1195 566 L${base(1195, 1124, 566)} Z" fill="#b3c3b8"/>
    <path d="M1184 449 C 1193 458, 1197 512, 1195 566 L${base(1195, 1180, 566)} L1180 566 C 1185 520, 1188 480, 1184 449 Z" fill="#a6b8ab"/>
    <path d="M1146 474 C 1158 459, 1172 447, 1185 450 C 1172 451, 1160 458, 1148 476 Z" fill="#c9d6cc"/>
    <path d="${body}" fill="#b3c3b8"/>
    <path d="M1120 384 C 1142 402, 1160 470, 1158 564 L${base(1158, 1120, 564)} L1120 564 C 1126 500, 1128 430, 1120 384 Z" fill="#a6b8ab"/>
    <path d="${caps}" fill="#c9d6cc"/>
    <path d="${channel}" fill="#9fb2a6"/>
  </g>`;
}

// The near ground rises in front of the falls: its edge runs level on both sides of the pool,
// hiding the rocks' lower third, so the pool lies on flat ground on top of the hill. To the left it slopes down
// into the ground's own edge. Same colour as the ground, so there is no seam.
const RISE = (() => {
  const base = x => RISE_LEVEL + 0.8 * Math.sin(x / 23 + 1.2) + 0.5 * Math.sin(x / 9.1);
  // Under the pool and just past its two ends the edge comes down to the ends' level, so the
  // rock's foot meets the water's rounded ends with no ground between them.
  const level = x => {
    const u = Math.max(0, Math.min(1, 1 - (Math.abs(x - POOL.cx) - POOL.rx) / 14));
    return base(x) + (POOL.ends + 1.2 - base(x)) * u * u * (3 - 2 * u);
  };
  const flat = Array.from({ length: 51 }, (_, i) => 1004 + i * 4).map(x => `${n1(x)} ${n1(level(x))}`).join(' L');
  return `M820 ${n1(groundY(820) + 1)} C 880 ${n1(groundY(880))}, 948 ${n1(level(960) + 10)}, 1004 ${n1(level(1004))} L${flat} L1600 ${RISE_LEVEL} V1200 H820 Z`;
})();

// Mirror Lake's clearing, where the far stretch ends: the trailhead yard's bare ground, far
// away (about 6:1, a gently uneven edge), with a tiny picnic table and a few small trees.
const LAKE_YARD = { cx: 1140, cy: 299, rx: 29, ry: 5 };
const lakeYard = grow => {
  const { cx, cy, rx, ry } = LAKE_YARD;
  return `M${Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const edge = 1 + 0.05 * Math.sin(3 * a + 0.6) + 0.03 * Math.sin(5 * a + 2.1);
    return `${n1(cx + Math.cos(a) * (rx * edge + grow))} ${n1(cy + Math.sin(a) * (ry * edge + grow * 0.6))}`;
  }).join(' L')} Z`;
};
const LAKE_YARD_TREES = [[1131, 296, 0.38], [1160, 296, 0.46], [1171, 299, 0.36]];

// Layer 1: the flat hills, the trail's far stretch (behind the green hill), the lake's shore band
// and clearing, and the falls' rocks with the ground rising in front of them. No water.
function backgroundSVG() {
  return `<svg class="hike-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="${FAR_RIDGE}" fill="#e2e9e2"/>
  <path d="M-400 420 L0 400 L120 330 L230 380 L340 300 L460 380 L600 290 L720 360 L850 290 L915 240 L1100 238 L1150 270 L1200 290 L1600 330 V1200 H-400 Z" fill="#d2ddd3"/>
  <g id="trail-far"></g>
  <path d="${HILL}" fill="#e5ece3"/>
  <path d="${GROUND}" fill="#edf2ea"/>
  <path class="lake-shore" d="M${LAKE_SHORE.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z"/>
  <path class="far-yard-edge" d="${lakeYard(0.9)}"/><path class="far-yard" d="${lakeYard(0)}"/>
  ${fallsMarkup()}
  <path d="${RISE}" fill="#edf2ea"/>
</svg>`;
}

// Layer 3: trees, trails, people, labels and everything the story shows on top of the water.
function foregroundSVG() {
  const trees = [...TREE_SPOTS].sort((a, b) => a[1] - b[1]).map(tree).join('');
  return `<svg class="hike-map" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  ${trees}
  <g id="rock" transform="translate(0 26)">
    <path d="M424 656 L436 618 L466 596 L506 600 L534 624 L544 656 Z" fill="#9aa59d"/>
    <path d="M436 618 L466 596 L506 600 L486 626 Z" fill="#b9c2bb"/>
    <path d="M486 626 L506 600 L534 624 L544 656 L500 656 Z" fill="#838f88"/>
    <path d="M404 656 L412 642 L430 642 L436 656 Z" fill="#9aa59d"/>
  </g>
  <path class="lake-far-bank" d="${FAR_BANK.land}"/><path class="lake-waterline" d="${FAR_BANK.waterline}"/>
  <g class="shore-trees">${SHORE_TREES.map(shoreTree).join('')}</g>
  <g id="lake-yard">
    ${LAKE_YARD_TREES.filter(([, y]) => y < LAKE_YARD.cy).map(shoreTree).join('')}
    <g transform="translate(1146 301) scale(0.23)">
      <path class="table-leg" d="M-3 -11.5 L-11 0 M3 -11.5 L11 0 M-14 -6.8 H14"/>
      <rect class="table-wood" x="-10" y="-14" width="20" height="3"/>
      <rect class="table-wood" x="-18" y="-8.2" width="8" height="2.6"/><rect class="table-wood" x="10" y="-8.2" width="8" height="2.6"/>
    </g>
    ${LAKE_YARD_TREES.filter(([, y]) => y >= LAKE_YARD.cy).map(shoreTree).join('')}
  </g>
  <defs>
    <clipPath id="hike-near" clipPathUnits="userSpaceOnUse"><path d="${HILL}"/></clipPath>
    <clipPath id="hike-far" clipPathUnits="userSpaceOnUse"><path d="${ABOVE_HILL}"/></clipPath>
    <mask id="hike-dry" maskUnits="userSpaceOnUse" x="-400" y="-400" width="2000" height="1600"><rect x="-400" y="-400" width="2000" height="1600" fill="white"/><path class="mask-cut" fill="black"/></mask>
    <mask id="hike-trail" maskUnits="userSpaceOnUse" x="-400" y="-400" width="2000" height="1600"><g class="mask-trail" fill="white"></g><path class="mask-cut" fill="black"/></mask>
  </defs>
  <g mask="url(#hike-dry)">
    <g id="trail-main" clip-path="url(#hike-near)"></g>
    <g class="trail-alt-plan" id="alt-plan"></g>
  </g>
  <g id="loops">${LOOP_SPOTS.map((_, i) => `<path class="loop" id="loopc-${i}"/><path class="loop" id="loop-${i}"/>`).join('')}</g>
  <g mask="url(#hike-trail)">
    <path class="trail-walked first" id="walked-first" d="${MAIN}"/>
    <path class="trail-walked" id="walked-second" d="${MAIN}"/>
    <circle class="trail-start" id="trail-start" cx="110" cy="660" r="2.6"/>
    <path class="trail-closed-seg" id="closed-seg" d="${MAIN}"/>
    <path class="trail-walked" id="walked-alt" d="${ALT}"/>
    <path class="trail-closed-seg" id="whatif" d="${MAIN}" style="stroke-dasharray: 3 9"/>
  </g>
  ${bridgeMarkup()}
  ${cabinMarkup()}
  <text class="place-label" x="62" data-x="62" y="578" text-anchor="middle">${tx('hike.trailhead')}</text>
  <text class="place-label" x="1003" data-x="1003" y="254" text-anchor="middle">${tx('hike.lake')}</text>
  <text class="place-label small" x="412" data-x="412" y="672" text-anchor="end" id="rock-label">${tx('hike.rock')}</text>
  <text class="place-label small" x="652" data-x="652" y="792" id="stream-label">${tx('hike.stream')}</text>
  <text class="place-label" x="1102" data-x="1102" y="620" text-anchor="middle" id="falls-label">${tx('hike.waterfall')}</text>
  <g id="loop-labels" class="fade-item">${LOOP_SPOTS.map(([cx, cy], i) => `<text class="place-label small" x="${cx}" y="${cy + LOOP_RY + 30}" text-anchor="middle">${tx(['hike.loopPark', 'hike.loopHill', 'hike.loopRiver'][i])}</text>`).join('')}</g>
  <g id="turn-flag" class="fade-item"><path d="M0 0 V-40" stroke="#9a5f3e" stroke-width="3" stroke-linecap="round"/><path d="M0 -40 L24 -33 L0 -26 Z" fill="#9a5f3e"/><text class="place-label small clay" x="30" y="54" text-anchor="middle" id="turn-flag-text"></text></g>
  <g id="whatif-note" class="fade-item"><text class="place-label clay" x="900" y="238" text-anchor="end">${tx('hike.noWater')}</text></g>
  <g id="storm" class="fade-item">
    <path d="M740 262 a26 26 0 0 1 36 -34 a34 34 0 0 1 62 8 a24 24 0 0 1 20 42 h-104 a20 20 0 0 1 -14 -16z" fill="#9fb1b8"/>
    <g class="rain">${Array.from({ length: 12 }, (_, i) => `<line x1="${752 + i * 9}" y1="${286 + (i % 3) * 8}" x2="${746 + i * 9}" y2="${300 + (i % 3) * 8}"/>`).join('')}</g>
  </g>
  <g id="closed-sign" class="fade-item" transform="translate(760 402)">
    <path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#9a5f3e" stroke-width="5" stroke-linecap="round"/>
    <text class="place-label clay" x="30" y="8">${tx('hike.trailClosed')}</text>
  </g>
  <g id="ranger" class="fade-item" transform="translate(684 566) scale(1.8)">
    <path d="M-3 0 V-8 M3 0 V-8" stroke="#3b4a44" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="-6" y="-22" width="12" height="15" rx="5" fill="#7b6a55"/>
    <circle cx="0" cy="-27" r="4.8" fill="#c99a74"/>
    <path d="M-9 -30 h18 M-5 -30 q5 -8 10 0" stroke="#4d5e36" stroke-width="3" fill="#4d5e36" stroke-linecap="round"/>
  </g>
  <text id="ranger-label" class="place-label small fade-item" x="684" y="612" text-anchor="middle">${tx('hike.ranger')}</text>
  <g id="ranger-bubble" class="fade-item" transform="translate(${BUBBLE_X} 532)">
    <rect id="bubble-rect" x="20" y="0" width="236" height="46" rx="16" fill="#fbfbf8" stroke="#c5cec8" stroke-width="2"/><path d="M24 14 l-22 14 l24 4z" fill="#fbfbf8"/>
    <text id="bubble-text" x="138" y="30" text-anchor="middle" class="place-label small bubble">${tx('hike.rangerTip')}</text>
  </g>
  <g id="picnic" class="fade-item" transform="translate(952 556)"><rect x="-26" y="-10" width="52" height="20" rx="3" fill="#e0a93b" transform="skewX(-20)"/><path d="M-24 0 h48 M-8 -10 v20 M8 -10 v20" stroke="#f7ead0" stroke-width="3" transform="skewX(-20)"/></g>
  ${walkersMarkup()}
</svg>`;
}

export function createHikeScene(root) {
  root.innerHTML = `${backgroundSVG()}
  <canvas class="hike-water" aria-hidden="true" data-ready="false"></canvas>
  ${foregroundSVG()}
  <div class="backpack" aria-hidden="true">
    <h2>${ICONS.backpack} ${tx('hike.backpack')}</h2>
    <div class="water"><div class="bottles" id="bottles"></div><span id="water-label">${tx('hike.water')}</span></div>
    <ul class="learned" id="learned"></ul>
  </div>
  <div class="sort-board" id="sort-board" hidden></div>`;
  const $ = selector => root.querySelector(selector);
  const main = $('#walked-first');
  const mainLength = main.getTotalLength();
  const altPath = $('#walked-alt');
  const altLength = altPath.getTotalLength();
  const walkers = $('#walkers');
  const flip = $('#walker-flip');
  const startDot = $('#trail-start');
  const bottlesEl = $('#bottles');
  const learnedEl = $('#learned');
  // Points along the trails come from their own samples: the browser's lookups are slow.
  const tracks = new Map([[main, pathTrack(MAIN)], [altPath, pathTrack(ALT)]]);
  const pointOn = (path, fraction) => tracks.get(path).point(fraction);
  const home = HOME / mainLength;
  const homePoint = pointOn(main, home);
  // Where the trail goes over the green hill's crest, and where it comes back into view on the far
  // side (map units along it). Between the two it is behind the hill.
  let crestS = mainLength;
  let emergeS = mainLength;
  for (let s = 0; s <= mainLength; s += 0.5) {
    const p = pointOn(main, s / mainLength);
    const behind = p.y > hillCrestY(p.x);
    if (crestS === mainLength && p.x > 700 && !behind) crestS = s;
    if (crestS < mainLength && behind) emergeS = s;
  }
  const hiddenAt = s => s > crestS - 6 && s < emergeS + 4;
  const isFar = s => s >= emergeS;

  // The trail as tapered ribbons (edge, path, centre dashes) opening into the yard at the
  // trailhead, plus the masks that taper the walked lines and leave the water clear under
  // the bridge.
  {
    const sample = (path, length) => {
      const count = Math.max(2, Math.ceil(length / 3));
      const pts = Array.from({ length: count + 1 }, (_, i) => ({ ...pointOn(path, i / count), s: (length * i) / count }));
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(count, i + 1)];
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        p.nx = -(b.y - a.y) / d;
        p.ny = (b.x - a.x) / d;
      });
      return { pts, length, step: length / count };
    };
    const side = (p, h, sign) => `${n1(p.x + p.nx * h * sign)} ${n1(p.y + p.ny * h * sign)}`;
    // A filled band of half-width `width(k)`, with round ends; `k` is the depth at each point.
    const band = ({ pts }, width, depth = p => taper(p.y)) => {
      const half = p => width(depth(p));
      const edges = [...pts.map(p => side(p, half(p), 1)), ...pts.slice().reverse().map(p => side(p, half(p), -1))];
      const ends = [pts[0], pts[pts.length - 1]].map(p => `<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(half(p))}"/>`).join('');
      return `<path d="M${edges.join(' L')} Z"/>${ends}`;
    };
    const dashes = ({ pts, length, step }, from = 4) => {
      const at = s => {
        const f = Math.max(0, Math.min(pts.length - 1, s / step));
        const [a, b] = [pts[Math.floor(f)], pts[Math.ceil(f)]];
        const u = f - Math.floor(f);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, nx: a.nx + (b.nx - a.nx) * u, ny: a.ny + (b.ny - a.ny) * u };
      };
      const parts = [];
      for (let s = from; s < length - 3;) {
        const k = taper(at(s).y);
        const end = Math.min(length - 3, s + 9 * k);
        const h = Math.max(0.7, 1.3 * k);
        const row = [at(s), at((s + end) / 2), at(end)];
        parts.push(`M${[...row.map(p => side(p, h, 1)), ...row.reverse().map(p => side(p, h, -1))].join(' L')} Z`);
        s += 18 * k;
      }
      return `<path class="trail-dash-fill" d="${parts.join(' ')}"/>`;
    };
    const trail = (line, yard) => `<g class="trail-edge-fill">${yard ? `<path d="${yard.edge}"/>` : ''}${band(line, k => (TRAIL_HALF + TRAIL_EDGE) * k)}</g>`
      + `<g class="trail-planned-fill">${yard ? `<path d="${yard.fill}"/>` : ''}${band(line, k => TRAIL_HALF * k)}</g>`
      // In the yard the trail has no centre line: its dashes start where it leaves.
      + dashes(line, yard ? line.pts.find(p => yard.outside(p) > TRAIL_HALF + YARD.blend / 2).s : 4);
    const mainLine = sample(main, mainLength);
    const altLine = sample(altPath, altLength);
    // The near stretch runs a little past the crest, which cuts it; the far stretch starts a little
    // below the crest, which hides its start. Nothing in between is drawn.
    const near = { ...mainLine, pts: mainLine.pts.filter(p => p.s <= crestS + 10), length: crestS };
    const far = { ...mainLine, pts: mainLine.pts.filter(p => p.s >= emergeS - 10) };
    const yard = yardShapes(mainLine.pts.filter((p, i) => p.s <= 140 && i % 4 === 0));
    $('#trail-main').innerHTML = trail(near, yard);
    $('#alt-plan').innerHTML = trail(altLine);
    // The far stretch, behind the hill: about 30% of the trailhead's width, lighter, no centre line.
    const farDepth = p => 0.27 + 0.06 * Math.min(1, Math.max(0, (p.y - 300) / 140));
    root.querySelector('#trail-far').innerHTML = `<g class="far-trail-edge">${band(far, k => (TRAIL_HALF + TRAIL_EDGE * 0.5) * k, farDepth)}</g>`
      + `<g class="far-trail">${band(far, k => TRAIL_HALF * k, farDepth)}</g>`;
    const walkedBand = k => 2.5 * k + 0.3;
    $('.mask-trail').innerHTML = `<g clip-path="url(#hike-near)">${band(near, walkedBand)}</g>${band(altLine, walkedBand)}`
      + `<g clip-path="url(#hike-far)">${band(far, walkedBand, farDepth)}</g>`;
    const crossing = outline({ samples: STREAM.samples.filter(p => p.y > 430 && p.y < 590) }, -0.4);
    const cut = `M${crossing.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z`;
    root.querySelectorAll('.mask-cut').forEach(node => node.setAttribute('d', cut));
  }

  // Where the bridge sits along the main trail.
  let bridge = 0.5;
  {
    let best = Infinity;
    for (let i = 0; i <= 400; i += 1) {
      const point = pointOn(main, i / 400);
      const distance = Math.hypot(point.x - 628, point.y - 505);
      if (distance < best) { best = distance; bridge = i / 400; }
    }
  }
  // The Halfway flag stands on the trail's far edge just ahead of where the pair stops,
  // so it shows beside them rather than behind them. Its words stay under the stopping point.
  const turnPoint = pointOn(main, TURN);
  const flagPoint = pointOn(main, TURN + 30 / mainLength);
  const flagShift = [flagPoint.x - turnPoint.x, flagPoint.y - 8 - (turnPoint.y - 10)];
  const flagTextX = n1(30 - flagShift[0]);
  $('#turn-flag').setAttribute('transform', `translate(${n1(flagPoint.x)} ${n1(flagPoint.y - 8)})`);
  $('#turn-flag-text').setAttribute('y', n1(54 - flagShift[1]));
  // The closed sign stands on the closed stretch, between the bridge and the crest.
  const signPoint = pointOn(main, (bridge * mainLength + crestS) / 2 / mainLength);
  $('#closed-sign').setAttribute('transform', `translate(${n1(signPoint.x)} ${n1(signPoint.y)})`);

  const setTrace = (element, length, from, to) => {
    const visible = Math.max(0, (to - from) * length);
    // One dash from `from` to `to`. An empty one would still draw its round cap as a dot.
    element.style.strokeDasharray = `${visible} ${length * 2}`;
    element.style.strokeDashoffset = String(-from * length);
    element.style.visibility = visible > 0 ? '' : 'hidden';
    // The dot marks where the walked line starts, once there is one.
    if (element === main) startDot.style.visibility = element.style.visibility;
  };
  // On the main trail the pair goes out of sight over the crest, and on the far stretch, near the
  // lake, they are drawn at 40% of their size.
  const place = (path, fraction, facing = 1) => {
    const point = pointOn(path, fraction);
    const s = path === main ? fraction * mainLength : 0;
    walkers.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})${isFar(s) ? ' scale(0.4)' : ''}`);
    walkers.style.visibility = hiddenAt(s) ? 'hidden' : '';
    flip.setAttribute('transform', `scale(${facing} 1)`);
  };
  // The flag text wraps to two balanced lines so it never runs across the map.
  const setFlagText = (key) => {
    const text = $('#turn-flag-text');
    const words = String(t(key)).split(' ');
    let cut = Math.ceil(words.length / 2);
    if (words.length > 2) {
      const total = words.join(' ').length;
      let run = 0;
      cut = words.findIndex(word => (run += word.length + 1) >= total / 2) + 1;
    }
    const lines = words.length > 1 ? [words.slice(0, cut).join(' '), words.slice(cut).join(' ')] : [words[0]];
    text.replaceChildren(...lines.map((line, i) => {
      const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      span.setAttribute('x', flagTextX);
      if (i) span.setAttribute('dy', '1.15em');
      span.textContent = line;
      return span;
    }));
  };
  const show = (selector, on) => $(selector).classList.toggle('shown', on);
  // A practice walk goes out along the connector, once round the loop, and back the same way,
  // starting and ending where the pair stands.
  const loops = LOOP_SPOTS.map((spot, i) => {
    const path = $(`#loop-${i}`);
    const conn = $(`#loopc-${i}`);
    path.setAttribute('d', loopPath(spot));
    conn.setAttribute('d', connectorPath([homePoint.x, homePoint.y], spot));
    return { path, length: path.getTotalLength(), conn, connLength: conn.getTotalLength() };
  });
  const loopTotal = loop => loop.connLength * 2 + loop.length;
  const loopAt = (loop, f) => {
    const s = Math.max(0, Math.min(1, f)) * loopTotal(loop);
    if (s <= loop.connLength) return loop.conn.getPointAtLength(s);
    if (s <= loop.connLength + loop.length) return loop.path.getPointAtLength(s - loop.connLength);
    return loop.conn.getPointAtLength(loopTotal(loop) - s);
  };
  const drawLoop = (loop, f) => {
    const s = f * loopTotal(loop);
    loop.conn.style.strokeDasharray = `${Math.min(s, loop.connLength)} ${loop.connLength * 2}`;
    loop.path.style.strokeDasharray = `${Math.max(0, Math.min(s - loop.connLength, loop.length))} ${loop.length * 2}`;
  };
  const setLoops = (amount) => loops.forEach(loop => {
    drawLoop(loop, amount ? 1 : 0);
    loop.conn.style.opacity = loop.path.style.opacity = String(amount);
  });

  // Keep trees off the trails, the water and the drawn features.
  {
    const near = [main, altPath].flatMap(path => {
      const length = tracks.get(path).length;
      return Array.from({ length: Math.ceil(length / 12) + 1 }, (_, i) => {
        const point = pointOn(path, (i * 12) / length);
        return path === main && hiddenAt(i * 12) ? null : [point.x, point.y, 16];
      }).filter(Boolean);
    }).concat(keepClear(12));
    root.querySelectorAll('.tree').forEach(node => {
      const x = Number(node.dataset.x), y = Number(node.dataset.y), s = Number(node.dataset.s);
      const [left, right, top, bottom] = [x - 20 * s, x + 20 * s, y - 46 * s, y + 14 * s];
      const onTrail = near.some(([px, py, m]) => px > left - m && px < right + m && py > top - m && py < bottom + m);
      const inBox = NO_TREE_BOXES.some(([bl, bt, br, bb]) => right > bl && left < br && bottom > bt && top < bb);
      if (onTrail || inBox) node.remove();
    });
  }

  // Labels stay readable at any stage size: 16px and 15px on screen, whatever the map scale.
  const svg = $('svg.hike-map');
  const bubbleText = $('#bubble-text');
  const bubbleRect = $('#bubble-rect');
  function layout() {
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const k = Math.min(box.width / 1200, box.height / 800);
    svg.style.setProperty('--lbl', `${(16 / k).toFixed(1)}px`);
    svg.style.setProperty('--lbl-s', `${(15 / k).toFixed(1)}px`);
    // Keep fixed labels fully inside the visible map: slide a label inward when its box would cross an edge.
    const pad = 8 / k;
    const left = 600 - box.width / k / 2 + pad;
    const right = 600 + box.width / k / 2 - pad;
    for (const label of svg.querySelectorAll('text[data-x]')) {
      label.setAttribute('x', label.dataset.x);
      const { x, width } = label.getBBox();
      const shift = x < left ? left - x : x + width > right ? right - (x + width) : 0;
      if (shift) label.setAttribute('x', String(Number(label.dataset.x) + shift));
    }
    const size = bubbleText.getBBox();
    if (size.width) {
      const width = Math.ceil(size.width + 36);
      // A long tip slides the bubble a little left, over its tail, rather than past the map's edge.
      const over = BUBBLE_X + 20 + width + 1 - (600 + box.width / k / 2 - 2 / k);
      const left = 20 - Math.min(14, Math.max(0, over));
      bubbleRect.setAttribute('x', String(left));
      bubbleRect.setAttribute('width', String(width));
      bubbleRect.setAttribute('height', String(Math.ceil(size.height + 18)));
      bubbleText.setAttribute('x', String(left + width / 2));
      bubbleText.setAttribute('y', String(Math.ceil(size.height + 18) / 2 + size.height * 0.3));
    }
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(layout).observe(svg);
  layout();

  // The water layer loads the first time the hike is shown.
  let water = null;
  let waterRequested = false;
  let covered = false;
  function showWater(beatId) {
    // The sorting board covers the whole map: the water rests behind it.
    covered = beatId === 'sort';
    water?.update();
    if (waterRequested) return;
    waterRequested = true;
    import('./journey-hike-water.js')
      .then(({ startWater }) => { water = startWater($('canvas.hike-water'), { covered: () => covered }); })
      .catch(() => {});
  }

  let learned = [];
  function renderLearned(ids, fresh = []) {
    learned = ids;
    learnedEl.innerHTML = ids.length
      ? ids.map(id => `<li class="${fresh.includes(id) ? 'is-new' : ''}">${ICONS[LEARNED[id].icon === 'rest' ? 'restSmall' : LEARNED[id].icon]}${LEARNED[id].label}</li>`).join('')
      : `<li class="learned-empty" style="background:none;padding:0;color:#5a6961">${tx('hike.learnedEmpty')}</li>`;
  }
  function renderBottles(count, fill) {
    if (bottlesEl.children.length !== count) {
      bottlesEl.innerHTML = Array.from({ length: count }, () => '<span class="bottle"><i></i></span>').join('');
    }
    for (const bottle of bottlesEl.children) {
      bottle.style.setProperty('--fill', String(Math.max(0, fill)));
      bottle.dataset.low = String(fill <= 0.25);
    }
    $('#water-label').textContent = t(fill <= 0.12 ? 'hike.waterEmpty' : fill <= 0.55 ? 'hike.waterHalf' : 'hike.water');
  }

  const STATE = {
    plan: { at: ['main', home, 1], first: [0, 0], second: [0, 0], alt: 0, bottles: [2, 1], learned: [], shown: [] },
    halfway: { at: ['main', TURN, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [2, 0.5], learned: [], shown: ['#turn-flag'] },
    turnback: { at: ['main', home, -1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [2, 0.08], learned: ['water'], shown: ['#turn-flag'] },
    practice: { at: ['main', home, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [4, 1], learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#loop-labels'], loops: 1 },
    retry: { at: ['main', home, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [4, 0.72], learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag'], loops: 0 },
    closed: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#storm', '#closed-sign', '#ranger', '#ranger-label'], closed: true, loops: 0 },
    respond: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#closed-sign', '#picnic'], closed: true, alt: 1, loops: 0 },
  };
  const shortOfBridge = bridge - BRIDGE_GAP / mainLength;
  STATE.retry.at = ['main', shortOfBridge, 1];
  STATE.retry.second = [0, shortOfBridge];
  STATE.closed = { ...STATE.retry, ...STATE.closed };
  STATE.respond = { ...STATE.retry, ...STATE.respond, at: ['alt', 1, 1], bottles: [4, 0.5] };
  STATE.sort = STATE.respond;

  const FADE_ITEMS = ['#turn-flag', '#loop-labels', '#storm', '#closed-sign', '#ranger', '#ranger-label', '#ranger-bubble', '#picnic', '#whatif-note'];

  function applyState(id) {
    const state = STATE[id];
    const [track, fraction, facing] = state.at;
    if (track === 'alt') place(altPath, fraction, facing);
    else place(main, fraction, facing);
    setTrace(main, mainLength, ...state.first);
    setTrace($('#walked-second'), mainLength, ...state.second);
    setTrace(altPath, altLength, 0, state.alt);
    $('#alt-plan').style.opacity = state.alt ? '1' : '0';
    const closed = $('#closed-seg');
    setTrace(closed, mainLength, bridge + 0.02, 1);
    closed.style.opacity = state.closed ? '1' : '0';
    setTrace($('#whatif'), mainLength, TURN, 1);
    $('#whatif').style.opacity = '0';
    for (const selector of FADE_ITEMS) show(selector, state.shown.includes(selector));
    renderBottles(...state.bottles);
    if (learned.join() !== state.learned.join()) renderLearned(state.learned);
    setLoops(state.loops ?? 0);
    setFlagText(id === 'retry' || id === 'closed' || id === 'respond' || id === 'sort' ? 'hike.turnedBack' : 'hike.halfWater');
    walkers.classList.remove('walking');
  }

  // The walked line grows from `traceFrom` to `to` while the pair walks from `from` to `to`.
  async function walk({ path, length, from, to, duration, token, trace, traceFrom = 0, bottles, facing = 1 }) {
    walkers.classList.add('walking');
    const run = tween({
      duration, easing: ease.inOut,
      update: t => {
        place(path, from + (to - from) * t, facing);
        if (trace) setTrace(trace, length, traceFrom, facing > 0 ? traceFrom + (to - traceFrom) * t : Math.max(from, to));
        if (bottles) renderBottles(bottles.count, bottles.from + (bottles.to - bottles.from) * t);
      },
    });
    token?.onCancel(() => run.cancel());
    const done = await run.promise;
    walkers.classList.remove('walking');
    return done && !token?.cancelled;
  }

  let current = null;
  async function showBeat(beatId, { from = null, animate = true, token } = {}) {
    current = beatId;
    showWater(beatId);
    const sequential = animate && from;
    if (beatId === 'halfway' && sequential && from === 'plan') {
      applyState('plan');
      if (!(await walk({ path: main, length: mainLength, from: home, to: TURN, duration: 3200, token, trace: main, bottles: { count: 2, from: 1, to: 0.5 } }))) return;
      show('#turn-flag', true);
      return;
    }
    if (beatId === 'turnback' && sequential && from === 'halfway') {
      applyState('halfway');
      if (!(await walk({ path: main, length: mainLength, from: TURN, to: home, duration: 2600, token, facing: -1, bottles: { count: 2, from: 0.5, to: 0.08 } }))) return;
      renderLearned(['water'], ['water']);
      return;
    }
    if (beatId === 'practice' && sequential && from === 'turnback') {
      applyState('turnback');
      renderBottles(4, 1);
      const order = ['map', 'landmarks', 'rest'];
      for (let index = 0; index < loops.length; index += 1) {
        const loop = loops[index];
        loop.conn.style.opacity = loop.path.style.opacity = '1';
        walkers.classList.add('walking');
        let facing = 1;
        const run = tween({ duration: 2200, easing: ease.inOut, update: t => {
          drawLoop(loop, t);
          const point = loopAt(loop, t);
          walkers.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
          const ahead = loopAt(loop, t + 0.01);
          if (Math.abs(ahead.x - point.x) > 0.4) facing = ahead.x > point.x ? 1 : -1;
          flip.setAttribute('transform', `scale(${facing} 1)`);
        } });
        token?.onCancel(() => run.cancel());
        if (!(await run.promise) || token?.cancelled) return;
        renderLearned(['water', ...order.slice(0, index + 1)], [order[index]]);
        await wait(180, token);
      }
      walkers.classList.remove('walking');
      show('#loop-labels', true);
      await wait(250, token);
      if (token?.cancelled) return;
      place(main, home, 1);
      return;
    }
    if (beatId === 'retry' && sequential && from === 'practice') {
      applyState('practice');
      setLoops(0);
      show('#loop-labels', false);
      if (!(await walk({ path: main, length: mainLength, from: home, to: shortOfBridge, duration: 4200, token, trace: $('#walked-second'), bottles: { count: 4, from: 1, to: 0.72 } }))) return;
      setFlagText('hike.turnedBack');
      return;
    }
    if (beatId === 'closed' && sequential && from === 'retry') {
      applyState('retry');
      show('#storm', true);
      if (!(await wait(700, token))) return;
      const closed = $('#closed-seg');
      closed.style.opacity = '1';
      show('#closed-sign', true);
      if (!(await wait(500, token))) return;
      show('#ranger', true); show('#ranger-label', true);
      return;
    }
    if (beatId === 'respond' && sequential && from === 'closed') {
      applyState('closed');
      show('#storm', false);
      $('#alt-plan').style.opacity = '1';
      // The ranger has helped: he goes as they set off, as in the settled picture.
      for (const selector of ['#ranger-bubble', '#ranger', '#ranger-label']) show(selector, false);
      if (!(await walk({ path: altPath, length: altLength, from: 0, to: 1, duration: 3200, token, trace: altPath, bottles: { count: 4, from: 0.72, to: 0.5 } }))) return;
      show('#picnic', true);
      return;
    }
    applyState(beatId);
  }

  function choose(beatId, optionId) {
    if (beatId === 'halfway') {
      $('#whatif').style.opacity = optionId === 'continue' ? '1' : '0';
      show('#whatif-note', optionId === 'continue');
    }
    if (beatId === 'closed') {
      show('#ranger-bubble', optionId === 'ask');
      show('#ranger-label', optionId !== 'ask');
      $('#alt-plan').style.opacity = optionId === 'ask' ? '1' : '0';
      const closed = $('#closed-seg');
      closed.classList.remove('alarm');
      if (optionId === 'sneak') { void closed.getBBox(); closed.classList.add('alarm'); }
    }
  }

  renderLearned([]);
  applyState('plan');
  // For checks and screenshots: stand the pair at a distance (map units) along the main trail.
  root.hikeCheck = { crestS, emergeS, length: mainLength, place: s => place(main, s / mainLength, 1) };
  return { show: showBeat, choose, hide() {}, current: () => current, sortBoard: $('#sort-board') };
}
