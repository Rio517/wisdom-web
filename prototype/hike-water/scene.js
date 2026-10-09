// Alfredo's hike map with the new water geography. A study copy of
// src/lessons/choices/journey-hike.js: the story, trail, walkers, labels and
// beats are the same; the map is split into three stacked layers so a water
// layer can sit between them: background SVG, water, then everything else.
import { LEARNED } from '../../src/lessons/choices/journey-story.js';
import { t } from '../../src/i18n/runtime.js';
import { ICONS } from '../../src/lessons/choices/journey-icons.js';
import { tween, ease, wait } from '../../src/lessons/choices/journey-motion.js';
import { FAR_RIDGE, LAKE_SHORE, MAIN as STREAM, keepClear, outline } from './geometry.js';

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

// A footbridge seen from the side where the trail crosses the stream: a gently arched
// deck, three posts and a handrail. Its ends rest on the trail either side of the water.
function bridgeMarkup() {
  const [cx, cy] = [628, 505];
  const [dx, dy] = [0.9765, -0.2154]; // the trail's direction at the crossing
  const half = 25;
  const thick = 5;
  const L = [cx - dx * half, cy - dy * half + 1];
  const R = [cx + dx * half, cy + dy * half + 1];
  const C = [cx, cy - 10];
  const at = t => [0, 1].map(i => (1 - t) ** 2 * L[i] + 2 * (1 - t) * t * C[i] + t ** 2 * R[i]);
  const p = ([x, y], down = 0) => `${n1(x)} ${n1(y + down)}`;
  const deck = `M${p(L)} Q${p(C)} ${p(R)} L${p(R, thick)} Q${p(C, thick)} ${p(L, thick)} Z`;
  // The plank ends along the deck's edge.
  const planks = Array.from({ length: 11 }, (_, i) => at((i + 0.5) / 11)).map(b => `M${p(b, 1.6)} L${p(b, thick)}`).join(' ');
  const posts = [0.08, 0.5, 0.92].map(at);
  const tops = posts.map(([x, y]) => [x, y - 12]);
  const railControl = [2 * tops[1][0] - (tops[0][0] + tops[2][0]) / 2, 2 * tops[1][1] - (tops[0][1] + tops[2][1]) / 2];
  return `<g id="bridge">
    <path class="bridge-post" d="${posts.map((b, i) => `M${p(b)} L${p(tops[i])}`).join(' ')}"/>
    <path class="bridge-rail" d="M${p(tops[0])} Q${p(railControl)} ${p(tops[2])}"/>
    <path class="bridge-deck" d="${deck}"/>
    <path class="bridge-top" d="M${p(L, 1.2)} Q${p(C, 1.2)} ${p(R, 1.2)}"/>
    <path class="bridge-plank" d="${planks}"/>
  </g>`;
}

// The trailhead: a small plank cabin with a pitched roof, and a picnic table beside it.
function cabinMarkup() {
  return `<g id="cabin" transform="translate(56 652)">
    <rect class="cabin-chimney" x="12" y="-59" width="7" height="20"/><rect class="cabin-chimney-cap" x="11" y="-61" width="9" height="3"/>
    <path class="cabin-wall" d="M-26 0 V-31 L0 -50 L26 -31 V0 Z"/>
    <path class="cabin-plank" d="M-26 -8 H26 M-26 -16 H26 M-26 -24 H26 M-15 -32 H15 M-7 -40 H7"/>
    <path class="cabin-roof" d="M-34 -29 L0 -55 L34 -29 L30 -25.5 L0 -49 L-30 -25.5 Z"/>
    <rect class="cabin-door" x="-16" y="-20" width="10" height="20"/>
    <rect class="cabin-window" x="5" y="-24" width="13" height="11"/><path class="cabin-frame" d="M11.5 -24 V-13 M5 -18.5 H18"/>
  </g>
  <g id="picnic-table" transform="translate(30 690) scale(1.35)">
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

function walkersMarkup() {
  return `<g class="walkers" id="walkers"><g class="walker-flip" id="walker-flip"><g transform="scale(1.9)"><g class="walker-bob">
    <ellipse cx="0" cy="1" rx="17" ry="3.5" fill="#23302d" opacity=".12"/>
    <path d="M1 0 V-9 M7 0 V-9" stroke="#3b4a44" stroke-width="3" stroke-linecap="round"/>
    <rect x="-1.5" y="-24" width="11" height="16" rx="5" fill="#285442"/>
    <rect x="-5.5" y="-22" width="6" height="10" rx="2.5" fill="#6f917a"/>
    <circle cx="4" cy="-29" r="5.2" fill="#d9b18e"/>
    <path d="M-1.2 -30.5 a5.2 5.2 0 0 1 10.4 0 z" fill="#4a3526"/>
    <path d="M-12 0 V-7 M-7 0 V-7" stroke="#3b4a44" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="-14" y="-19" width="9.5" height="12.5" rx="4.5" fill="#e0a93b"/>
    <circle cx="-9.5" cy="-23.5" r="4.4" fill="#c99a74"/>
    <path d="M-13.9 -24.5 a4.4 4.4 0 0 1 8.8 0 z" fill="#2c2019"/>
  </g></g></g></g>`;
}

// Layer 1: the flat hills and the waterfall's rock. No water.
function backgroundSVG() {
  return `<svg class="hike-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="${FAR_RIDGE}" fill="#e2e9e2"/>
  <path d="M-400 420 L0 400 L120 330 L230 380 L340 300 L460 380 L600 290 L720 360 L850 290 L915 240 L1100 238 L1150 270 L1200 290 L1600 330 V1200 H-400 Z" fill="#d2ddd3"/>
  <path d="M-400 480 L0 470 C 200 430, 380 470, 560 430 S 900 380, 1200 420 L1600 440 V1200 H-400 Z" fill="#e5ece3"/>
  <path d="M-400 620 L0 610 C 250 580, 500 640, 760 600 S 1050 560, 1200 590 L1600 600 V1200 H-400 Z" fill="#edf2ea"/>
  <path class="lake-shore" d="M${LAKE_SHORE.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z"/>
  <g id="side-rock">
    <path d="M1134 566 C 1131 522, 1142 482, 1162 464 C 1175 453, 1190 456, 1195 473 C 1200 500, 1199 538, 1197 566 Z" fill="#b3c3b8"/>
    <path d="M1182 458 C 1193 466, 1199 508, 1197 566 H1181 C 1186 522, 1188 484, 1182 458 Z" fill="#a6b8ab"/>
    <path d="M1152 470 C 1160 458, 1178 451, 1190 459 C 1176 456, 1162 461, 1152 470 Z" fill="#c9d6cc"/>
  </g>
  <g id="falls-rock">
    <path d="M1016 564 C 1010 500, 1022 440, 1044 402 C 1048 392, 1053 385, 1060 381 L1064 389 Q1065 391 1068 391 L1100 391 Q1103 391 1104 389 L1109 379 C 1117 378, 1127 384, 1132 392 C 1154 422, 1162 500, 1158 564 Z" fill="#b3c3b8"/>
    <path d="M1120 384 C 1142 402, 1160 470, 1158 564 H1120 C 1126 500, 1128 430, 1120 384 Z" fill="#a6b8ab"/>
    <path d="M1044 402 C 1048 392, 1053 385, 1060 381 L1062.5 386 C 1055 390, 1049 395, 1044 402 Z M1109 379 C 1117 378, 1127 384, 1132 392 C 1124 387, 1116 385, 1107 384 Z" fill="#c9d6cc"/>
    <path d="M1061 566 L1064 391 L1104 391 L1107 566 Z" fill="#9fb2a6"/>
  </g>
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
  const turnPoint = main.getPointAtLength(mainLength * TURN);
  $('#turn-flag').setAttribute('transform', `translate(${turnPoint.x} ${turnPoint.y - 10})`);

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
      span.setAttribute('x', '30');
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
