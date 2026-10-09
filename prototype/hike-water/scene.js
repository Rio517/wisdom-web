// Alfredo's hike map with the new water geography. A study copy of
// src/lessons/choices/journey-hike.js: the story, trail, walkers, labels and
// beats are the same; the map is split into three stacked layers so a water
// layer can sit between them: background SVG, water, then everything else.
import { LEARNED } from '../../src/lessons/choices/journey-story.js';
import { t } from '../../src/i18n/runtime.js';
import { ICONS } from '../../src/lessons/choices/journey-icons.js';
import { tween, ease, wait } from '../../src/lessons/choices/journey-motion.js';
import { FAR_RIDGE, HILL, FALL, LAKE_SHORE, MAIN as STREAM, fallEdges, keepClear, outline } from './geometry.js';

const tx = key => String(t(key)).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const MAIN = 'M110 660 C 180 650, 230 612, 300 596 S 410 566, 452 548 S 560 520, 628 505 C 690 492, 716 452, 748 420 S 800 360, 846 332 S 884 316, 905 309';
// The Waterfall Trail leaves the bridge eastwards, above the side stream, to a lookout beside the falls.
const ALT = 'M628 505 C 668 498, 712 497, 756 503 S 880 522, 930 525 S 984 528, 1002 530';
const TRAILHEAD = [112, 664];
const LOOP_SPOTS = [[190, 735], [340, 738], [490, 735]];
const LOOP_RX = 58;
const LOOP_RY = 26;
const loopPath = ([cx, cy]) => {
  const top = cy - LOOP_RY;
  return `M${cx} ${top} A${LOOP_RX} ${LOOP_RY} 0 1 1 ${cx} ${cy + LOOP_RY} A${LOOP_RX} ${LOOP_RY} 0 1 1 ${cx} ${top}`;
};
const connectorPath = ([cx, cy]) => {
  const top = cy - LOOP_RY;
  return `M${TRAILHEAD[0]} ${TRAILHEAD[1]} C ${TRAILHEAD[0] + (cx - TRAILHEAD[0]) * 0.35} 668, ${cx - 50} ${top}, ${cx} ${top}`;
};
const TURN = 0.4;

const TREE_SPOTS = [
  [196, 548, 1], [226, 532, .9], [258, 556, 1.1], [300, 520, .95], [338, 540, 1], [372, 510, 1.05], [520, 488, .9], [556, 470, 1],
  [406, 494, .85], [470, 470, .9], [236, 600, .8], [380, 610, .85], [520, 596, .8], [168, 590, .85], [700, 560, .9], [760, 596, .85],
  [820, 470, .8], [870, 452, .75], [690, 350, .7], [642, 372, .65], [590, 420, .8], [930, 430, .7], [980, 452, .75],
  [1040, 500, 1], [1092, 470, .9], [1136, 522, 1.1], [1010, 548, .85], [1104, 430, .8], [1150, 464, .9], [960, 566, .9], [900, 600, .85],
  [96, 520, .9], [64, 560, .8], [150, 500, .8], [262, 480, .7], [330, 466, .7],
];
// Keep trees clear of the trails, the water and the drawn features (lake, rock, trailhead, loops, ranger).
const NO_TREE_BOXES = [[400, 590, 560, 700], [880, 250, 1130, 325], [0, 548, 190, 700], [100, 690, 640, 800], [700, 505, 1000, 580], [1004, 360, 1200, 580]];

// The trail narrows with distance: full width at the trailhead, half at the lake.
const NEAR_Y = 660;
const FAR_Y = 309;
const taper = y => 1 - 0.5 * Math.min(1, Math.max(0, (NEAR_Y - y) / (NEAR_Y - FAR_Y)));
const n1 = value => value.toFixed(1);

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
  const rail = (side, height, foot) => {
    const tops = steps.filter(s => Math.abs(s) <= 0.9 + 1e-6).map(s => p(at(s, side), -height));
    const stems = posts.map(s => `M${p(at(s, side), foot)} L${p(at(s, side), -height)}`).join(' ');
    return { stems, rail: `M${tops.join(' L')}` };
  };
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

// The trailhead: a flat dirt clearing seen at a low angle (about 4:1, with a gently
// uneven edge) under a small plank cabin, a picnic table and the trail's start.
const CLEARING = { cx: 85, cy: 673.5, rx: 75, ry: 19.5 };
function clearingPath() {
  const { cx, cy, rx, ry } = CLEARING;
  const points = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    const r = 1 + 0.022 * Math.sin(3 * a + 0.6) + 0.014 * Math.sin(5 * a + 2.1);
    return `${n1(cx + Math.cos(a) * rx * r)} ${n1(cy + Math.sin(a) * ry * r)}`;
  });
  return `M${points.join(' L')} Z`;
}
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
  const ease = i => Math.min(1, Math.min(i, n - i) / (n * 0.12));
  const waterline = far.map(([x, y], i) => [x, y + ease(i) * (4 + 1.6 * Math.sin(x / 17) + 1.1 * Math.sin(x / 7.3))]);
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

// Alfredo and his dad in the lessons' figure style (as Maya): a big round head, two ink
// dot eyes, one hair shape, a T-shirt, round-capped limbs, dark rounded shoes and a
// flat ground shadow. Drawn in map units, feet on the trail at (0, 0), facing right.
// Each leg and the near arm swing about their hip or shoulder while the pair walks.
const INK = '#23302d';
const swing = (x, y, phase, body, rest = 0) => `<g transform="translate(${x} ${y}) rotate(${rest})"><g class="hw-swing ${phase}">${body}</g></g>`;
const shoe = (x, y, r) => `<path d="M${x} ${y}h${(r * 1.9).toFixed(1)}" stroke="${INK}" stroke-width="${r * 2}" stroke-linecap="round"/>`;

// Alfredo, about 49 units tall: head about 38% of his height. Yellow T-shirt, dark shorts.
function alfredoMarkup() {
  const skin = '#c99a74';
  const leg = `<path d="M0 5.6 V14.6" stroke="${skin}" stroke-width="4" stroke-linecap="round"/>${shoe(0.2, 16, 2)}<path d="M0 -0.4 V6.6" stroke="#3b4a44" stroke-width="5.8" stroke-linecap="round"/>`;
  return `<g class="hw-figure" id="alfredo">
    ${swing(-2.2, -18, 'b', leg, 7)}${swing(2.4, -18, 'a', leg, -6)}
    <path d="M0.4 -31.5 V-28" stroke="${skin}" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M-5.3 -29.6 Q0 -30.9 5.4 -29.6 L8.2 -25.2 L6 -23.8 L5.9 -19 Q5.9 -16.6 3.8 -16.6 H-3.8 Q-5.9 -16.6 -5.9 -19 L-6.1 -23.8 L-8 -25.2 Z" fill="#e0a93b"/>
    ${swing(5, -26.6, 'b', `<path d="M0 0 Q2.2 4.6 1.4 9" stroke="${skin}" stroke-width="4" stroke-linecap="round" fill="none"/>`)}
    <circle cx="0.8" cy="-38.8" r="8.6" fill="${skin}"/>
    <path d="M8.9 -41.4 C 9.6 -44.4 8 -47.2 5.3 -48 C 4.4 -49.8 1.6 -50.2 -0.3 -49.2 C -2.4 -50.1 -5.4 -49.6 -6.4 -47.6 C -9.2 -46.8 -10.4 -43.8 -9.6 -41.1 C -10.4 -38.8 -9.8 -36.4 -8.2 -35 L -6.2 -34.6 C -5.6 -37.2 -4.4 -39.4 -2.6 -40.6 C 0.2 -41.2 2.6 -42.6 3.6 -44.4 C 4.6 -42.6 6.6 -41.4 8.9 -41.4 Z" fill="#2c2019"/>
    <path d="${dots([[1.5, -37.4], [6.2, -37.4]], 1.05)}" fill="${INK}"/>
  </g>`;
}

// His dad, about 72 units tall (1.5 times Alfredo): head about 27% of his height, a short
// beard, a green T-shirt, long dark trousers and a backpack.
function dadMarkup() {
  const skin = '#d9b18e';
  const leg = `<path d="M0 0 V26.4" stroke="#3b4a44" stroke-width="5.4" stroke-linecap="round"/>${shoe(0.4, 28.6, 2.3)}`;
  return `<g class="hw-figure" id="dad">
    ${swing(-2.4, -31, 'a', leg, 5)}${swing(2.6, -31, 'b', leg, -4.5)}
    <path d="M0.6 -54 V-49" stroke="${skin}" stroke-width="4.4" stroke-linecap="round"/>
    <rect x="-13.2" y="-50.6" width="10.4" height="20" rx="4" fill="#6f917a"/>
    <rect x="-13.2" y="-41.6" width="6.4" height="8.4" rx="2.4" fill="#8daa91"/>
    <path d="M-6.6 -50.4 Q0 -52.2 6.8 -50.4 L10.2 -45 L7.6 -43.2 L7.2 -31.8 Q7.2 -29.4 4.8 -29.4 H-4.6 Q-7 -29.4 -7 -31.8 L-7.2 -43.2 L-8.4 -44.6 Z" fill="#285442"/>
    <path d="M-4 -50.6 Q2.6 -53 4.6 -43.4" stroke="#6f917a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    ${swing(6.4, -46.4, 'a', `<path d="M0 0 Q2.8 6.4 1.6 13.2" stroke="${skin}" stroke-width="4.2" stroke-linecap="round" fill="none"/>`)}
    <circle cx="1" cy="-61.6" r="9.4" fill="${skin}"/>
    <path d="M10.2 -64 C 10 -69.4 5.8 -72.4 0.6 -72.2 C -5.4 -72 -9.6 -67.6 -9.8 -62 C -9.9 -59 -9 -56.6 -7.4 -55 L -5.6 -55.2 C -6 -57.4 -5.6 -60.2 -4 -62 C -1 -62.6 2.6 -63.4 5.2 -65.4 C 6.8 -64.4 8.4 -64 10.2 -64 Z M -6.2 -57.4 C -4.6 -56.2 -2.4 -55.6 0.4 -56.2 C 2.4 -56.8 3.4 -57.6 4.8 -57.4 C 6.6 -57.2 8.6 -57.6 10.1 -58.8 C 9.6 -55.4 7.4 -52.8 4.4 -52.3 C 0.4 -51.6 -4 -53.6 -6.2 -57.4Z" fill="#4a3526"/>
    <path d="${dots([[1.8, -60.4], [7, -60.4]], 1.15)}" fill="${INK}"/>
  </g>`;
}

const dots = (centres, r) => centres.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');

function walkersMarkup() {
  return `<g class="walkers" id="walkers"><g class="walker-flip" id="walker-flip">
    <path d="M-5 0.6a13 2.6 0 1 0 26 0a13 2.6 0 1 0-26 0z M-20.6 2.1a9.6 2.2 0 1 0 19.2 0a9.6 2.2 0 1 0-19.2 0z" fill="${INK}" opacity=".13"/>
    <g class="hw-bob"><g transform="translate(8 0)">${dadMarkup()}</g>
    <g transform="translate(-11 1.5)">${alfredoMarkup()}</g>
  </g></g></g>`;
}

// The second rock: a smaller boulder standing behind the fall's rock on the right.
// Its left third is hidden, and its top runs behind the fall rock's edge at a clear angle.
function sideRockMarkup() {
  return `<g id="side-rock">
    <path d="M1124 566 C 1122 522, 1134 484, 1156 463 C 1166 453, 1178 446, 1187 451 C 1195 458, 1197 515, 1195 566 Z" fill="#b3c3b8"/>
    <path d="M1184 449 C 1193 458, 1197 512, 1195 566 H1180 C 1185 520, 1188 480, 1184 449 Z" fill="#a6b8ab"/>
    <path d="M1146 474 C 1158 459, 1172 447, 1185 450 C 1172 451, 1160 458, 1148 476 Z" fill="#c9d6cc"/>
  </g>`;
}

// The fall's rock. A notch is cut into its top where the fall pours out: the sheet's top
// edge is flush with the notch floor, and the notch and the darker channel below it
// follow the sheet's edges, FALL.margin outside them on both sides.
function fallsRockMarkup() {
  const { top, bottom, margin } = FALL;
  const left = FALL.lip[0] - margin;
  const right = FALL.lip[1] + margin;
  const r = 1.8;
  const body = `M1016 564 C 1010 500, 1022 440, 1044 402 C 1049 391, 1055 383, ${left - 2.6} 380.6 Q${left} 380 ${left} 383.2`
    + ` L${left} ${top - r} Q${left} ${top} ${left + r} ${top} L${right - r} ${top} Q${right} ${top} ${right} ${top - r}`
    + ` L${right} 381.6 Q${right} 378.8 ${right + 2.6} 378.7 C 1117 378, 1127 384, 1132 392 C 1154 422, 1162 500, 1158 564 Z`;
  const caps = `M1044 402 C 1049 391, 1055 383, ${left - 2.6} 380.6 Q${left} 380 ${left} 383.2 L${left} 386 C ${left - 6} 386.4, 1050 393, 1044 402 Z`
    + ` M${right} 385 L${right} 381.6 Q${right} 378.8 ${right + 2.6} 378.7 C 1117 378, 1127 384, 1132 392 C 1124 387.5, 1116 385, ${right} 385 Z`;
  // The channel: the sheet's edges moved out by the margin, from the notch floor to the rock's foot.
  const rows = Array.from({ length: 17 }, (_, i) => i / 16);
  const edge = (f, side) => fallEdges(f)[side] + (side ? margin : -margin);
  const y = f => top + (bottom - top) * f;
  const channel = `M${rows.map(f => `${n1(edge(f, 0))} ${n1(y(f))}`).join(' L')} L${n1(edge(1, 0))} 566`
    + ` L${n1(edge(1, 1))} 566 L${rows.slice().reverse().map(f => `${n1(edge(f, 1))} ${n1(y(f))}`).join(' L')} Z`;
  return `<g id="falls-rock">
    <path d="${body}" fill="#b3c3b8"/>
    <path d="M1120 384 C 1142 402, 1160 470, 1158 564 H1120 C 1126 500, 1128 430, 1120 384 Z" fill="#a6b8ab"/>
    <path d="${caps}" fill="#c9d6cc"/>
    <path class="falls-channel" d="${channel}" fill="#9fb2a6"/>
  </g>`;
}

// Layer 1: the flat hills and the waterfall's rock. No water.
function backgroundSVG() {
  return `<svg class="hike-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="${FAR_RIDGE}" fill="#e2e9e2"/>
  <path d="M-400 420 L0 400 L120 330 L230 380 L340 300 L460 380 L600 290 L720 360 L850 290 L915 240 L1100 238 L1150 270 L1200 290 L1600 330 V1200 H-400 Z" fill="#d2ddd3"/>
  <path d="${HILL}" fill="#e5ece3"/>
  <path d="M-400 620 L0 610 C 250 580, 500 640, 760 600 S 1050 560, 1200 590 L1600 600 V1200 H-400 Z" fill="#edf2ea"/>
  <path class="lake-shore" d="M${LAKE_SHORE.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z"/>
  ${sideRockMarkup()}
  ${fallsRockMarkup()}
</svg>`;
}

// Layer 3: trees, trails, people, labels and everything the story shows on top of the water.
function foregroundSVG() {
  const trees = [...TREE_SPOTS].sort((a, b) => a[1] - b[1]).map(tree).join('');
  return `<svg class="hike-map" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path class="trailhead-clearing" d="${clearingPath()}"/>
  ${trees}
  <g id="rock" transform="translate(0 26)">
    <path d="M424 656 L436 618 L466 596 L506 600 L534 624 L544 656 Z" fill="#9aa59d"/>
    <path d="M436 618 L466 596 L506 600 L486 626 Z" fill="#b9c2bb"/>
    <path d="M486 626 L506 600 L534 624 L544 656 L500 656 Z" fill="#838f88"/>
    <path d="M404 656 L412 642 L430 642 L436 656 Z" fill="#9aa59d"/>
  </g>
  <g id="loops">${LOOP_SPOTS.map((spot, i) => `<path class="loop" id="loopc-${i}" d="${connectorPath(spot)}"/><path class="loop" id="loop-${i}" d="${loopPath(spot)}"/>`).join('')}</g>
  <path class="lake-far-bank" d="${FAR_BANK.land}"/><path class="lake-waterline" d="${FAR_BANK.waterline}"/>
  <g class="shore-trees">${SHORE_TREES.map(shoreTree).join('')}</g>
  <defs>
    <mask id="hw-dry" maskUnits="userSpaceOnUse" x="-400" y="-400" width="2000" height="1600"><rect x="-400" y="-400" width="2000" height="1600" fill="white"/><path class="mask-cut" fill="black"/></mask>
    <mask id="hw-trail" maskUnits="userSpaceOnUse" x="-400" y="-400" width="2000" height="1600"><g class="mask-trail" fill="white"></g><path class="mask-cut" fill="black"/></mask>
  </defs>
  <g mask="url(#hw-dry)">
    <g id="trail-main"></g>
    <g class="trail-alt-plan" id="alt-plan"></g>
  </g>
  <g mask="url(#hw-trail)">
    <path class="trail-walked first" id="walked-first" d="${MAIN}"/>
    <path class="trail-walked" id="walked-second" d="${MAIN}"/>
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
  <text class="place-label" x="1102" data-x="1102" y="608" text-anchor="middle" id="falls-label">${tx('hike.waterfall')}</text>
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
  <g id="ranger-bubble" class="fade-item" transform="translate(716 532)">
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
  const bottlesEl = $('#bottles');
  const learnedEl = $('#learned');

  // The trail as tapered ribbons (edge, path, centre dashes), plus the masks that
  // taper the walked lines and leave the water clear under the bridge.
  {
    const sample = path => {
      const length = path.getTotalLength();
      const count = Math.max(2, Math.ceil(length / 3));
      const pts = Array.from({ length: count + 1 }, (_, i) => {
        const { x, y } = path.getPointAtLength((length * i) / count);
        return { x, y };
      });
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
    // A filled band of half-width `width(k)`, with round ends.
    const band = ({ pts }, width, cls) => {
      const half = p => width(taper(p.y));
      const edges = [...pts.map(p => side(p, half(p), 1)), ...pts.slice().reverse().map(p => side(p, half(p), -1))];
      const ends = [pts[0], pts[pts.length - 1]].map(p => `<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(half(p))}"/>`).join('');
      return `<g class="${cls}"><path d="M${edges.join(' L')} Z"/>${ends}</g>`;
    };
    const dashes = ({ pts, length, step }) => {
      const at = s => {
        const f = Math.max(0, Math.min(pts.length - 1, s / step));
        const [a, b] = [pts[Math.floor(f)], pts[Math.ceil(f)]];
        const u = f - Math.floor(f);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, nx: a.nx + (b.nx - a.nx) * u, ny: a.ny + (b.ny - a.ny) * u };
      };
      const parts = [];
      for (let s = 4; s < length - 3;) {
        const k = taper(at(s).y);
        const end = Math.min(length - 3, s + 9 * k);
        const h = Math.max(0.7, 1.3 * k);
        const row = [at(s), at((s + end) / 2), at(end)];
        parts.push(`M${[...row.map(p => side(p, h, 1)), ...row.reverse().map(p => side(p, h, -1))].join(' L')} Z`);
        s += 18 * k;
      }
      return `<path class="trail-dash-fill" d="${parts.join(' ')}"/>`;
    };
    const trail = path => {
      const line = sample(path);
      return band(line, k => 7.5 * k, 'trail-edge-fill') + band(line, k => 5.5 * k, 'trail-planned-fill') + dashes(line);
    };
    $('#trail-main').innerHTML = trail(main);
    $('#alt-plan').innerHTML = trail(altPath);
    $('.mask-trail').innerHTML = [main, altPath].map(path => band(sample(path), k => 2.5 * k + 0.3, '')).join('');
    const crossing = outline({ samples: STREAM.samples.filter(p => p.y > 430 && p.y < 590) }, -0.4);
    const cut = `M${crossing.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z`;
    root.querySelectorAll('.mask-cut').forEach(node => node.setAttribute('d', cut));
  }

  // Where the bridge sits along the main trail.
  let bridge = 0.5;
  {
    let best = Infinity;
    for (let i = 0; i <= 400; i += 1) {
      const point = main.getPointAtLength(mainLength * i / 400);
      const distance = Math.hypot(point.x - 628, point.y - 505);
      if (distance < best) { best = distance; bridge = i / 400; }
    }
  }
  // The halfway flag stands on the trail's far edge just ahead of where the pair stops,
  // so it shows beside them rather than behind them. Its words stay where they were,
  // under the stopping point.
  const turnPoint = main.getPointAtLength(mainLength * TURN);
  const flagPoint = main.getPointAtLength(mainLength * TURN + 30);
  const flagShift = [flagPoint.x - turnPoint.x, flagPoint.y - 8 - (turnPoint.y - 10)];
  const flagTextX = String(n1(30 - flagShift[0]));
  $('#turn-flag').setAttribute('transform', `translate(${n1(flagPoint.x)} ${n1(flagPoint.y - 8)})`);
  $('#turn-flag-text').setAttribute('y', n1(54 - flagShift[1]));

  const setTrace = (element, length, from, to) => {
    const visible = Math.max(0, (to - from) * length);
    element.style.strokeDasharray = `0 ${from * length} ${visible} ${length * 2}`;
  };
  const place = (path, length, fraction, facing = 1) => {
    const point = path.getPointAtLength(length * Math.max(0, Math.min(1, fraction)));
    walkers.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
    flip.setAttribute('transform', `scale(${facing} 1)`);
  };
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
  const loops = LOOP_SPOTS.map((_, i) => {
    const path = $(`#loop-${i}`);
    const conn = $(`#loopc-${i}`);
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
    const near = [[main, 16], [altPath, 16]].flatMap(([path, margin]) => {
      const length = path.getTotalLength();
      return Array.from({ length: Math.ceil(length / 12) + 1 }, (_, i) => {
        const point = path.getPointAtLength(Math.min(length, i * 12));
        return [point.x, point.y, margin];
      });
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
      bubbleRect.setAttribute('width', String(width));
      bubbleRect.setAttribute('height', String(Math.ceil(size.height + 18)));
      bubbleText.setAttribute('x', String(20 + width / 2));
      bubbleText.setAttribute('y', String(Math.ceil(size.height + 18) / 2 + size.height * 0.3));
    }
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(layout).observe(svg);
  layout();

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
    plan: { at: ['main', 0, 1], first: [0, 0], second: [0, 0], alt: 0, bottles: [2, 1], learned: [], shown: [] },
    halfway: { at: ['main', TURN, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [2, 0.5], learned: [], shown: ['#turn-flag'] },
    turnback: { at: ['main', 0, -1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [2, 0.08], learned: ['water'], shown: ['#turn-flag'] },
    practice: { at: ['main', 0, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [4, 1], learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#loop-labels'], loops: 1 },
    retry: { at: ['main', 0, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [4, 0.72], learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag'], loops: 0 },
    closed: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#storm', '#closed-sign', '#ranger', '#ranger-label'], closed: true, loops: 0 },
    respond: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#closed-sign', '#picnic'], closed: true, alt: 1, loops: 0 },
  };
  STATE.retry.at = ['main', bridge - 0.012, 1];
  STATE.retry.second = [0, bridge];
  STATE.closed = { ...STATE.retry, ...STATE.closed };
  STATE.respond = { ...STATE.retry, ...STATE.respond, at: ['alt', 1, 1], bottles: [4, 0.5] };
  STATE.sort = STATE.respond;

  const FADE_ITEMS = ['#turn-flag', '#loop-labels', '#storm', '#closed-sign', '#ranger', '#ranger-label', '#ranger-bubble', '#picnic', '#whatif-note'];

  function applyState(id) {
    const state = STATE[id];
    const [track, fraction, facing] = state.at;
    if (track === 'alt') place(altPath, altLength, fraction, facing);
    else place(main, mainLength, fraction, facing);
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

  async function walk({ path, length, from, to, duration, token, trace, traceFrom = 0, bottles, facing = 1 }) {
    walkers.classList.add('walking');
    const run = tween({
      duration, easing: ease.inOut,
      update: t => {
        const f = from + (to - from) * t;
        place(path, length, f, facing);
        if (trace) setTrace(trace, length, traceFrom, Math.max(traceFrom, facing > 0 ? f : Math.max(from, to)));
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
    if (beatId === 'halfway' && animate && from === 'plan') {
      applyState('plan');
      if (!(await walk({ path: main, length: mainLength, from: 0, to: TURN, duration: 3200, token, trace: main, bottles: { count: 2, from: 1, to: 0.5 } }))) return;
      show('#turn-flag', true);
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
    }
  }

  renderLearned([]);
  applyState('plan');
  return {
    show: showBeat, choose, current: () => current, beats: Object.keys(STATE),
    water: $('canvas.hike-water'), svg,
  };
}
