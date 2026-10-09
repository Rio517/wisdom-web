import { LEARNED } from './journey-story.js';
import { t } from '../../i18n/runtime.js';

const tx = key => String(t(key)).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
import { ICONS } from './journey-icons.js';
import { tween, ease, wait } from './journey-motion.js';

const MAIN = 'M110 660 C 180 650, 230 612, 300 596 S 410 566, 452 548 S 560 520, 628 505 C 690 492, 716 452, 748 420 S 800 360, 846 332 S 916 262, 968 246';
// The Waterfall Trail follows the stream's west bank up to the pool.
const ALT = 'M628 505 C 592 488, 540 470, 520 430 S 500 360, 524 338';
// Water: the fall drops into the pool, and the pool feeds the stream that passes under the bridge.
const STREAM = 'M606 336 C 596 372, 664 404, 652 446 S 618 486 630 516 S 596 690 626 830 S 640 1000 610 1200';
const TRAILHEAD = [112, 664];
// Practice walks: each starts and ends at the trailhead, out along a short path to a loop and back.
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
// Keep trees clear of the trails, the stream and the drawn features, so none sit under a walker or a label.
const NO_TREE_BOXES = [[500, 205, 700, 350], [400, 590, 560, 700], [945, 215, 1175, 285], [15, 585, 185, 700], [100, 690, 640, 800], [700, 505, 1000, 580]];

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

function sceneSVG() {
  const trees = [...TREE_SPOTS].sort((a, b) => a[1] - b[1]).map(tree).join('');
  return `<svg class="hike-map" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="M-400 330 L0 330 L90 250 L170 300 L280 170 L380 280 L470 210 L560 300 L700 140 L820 260 L900 190 L1010 250 L1100 160 L1200 240 L1600 300 V1200 H-400 Z" fill="#e2e9e2"/>
  <path d="M-400 420 L0 400 L120 330 L230 380 L340 300 L460 380 L600 290 L720 360 L850 290 L915 240 L1100 238 L1150 270 L1200 290 L1600 330 V1200 H-400 Z" fill="#d2ddd3"/>
  <ellipse class="water-fill" cx="1066" cy="248" rx="104" ry="26"/>
  <path d="M1000 246 h44 M1086 254 h34" class="water-glint"/>
  <path d="M-400 480 L0 470 C 200 430, 380 470, 560 430 S 900 380, 1200 420 L1600 440 V1200 H-400 Z" fill="#e5ece3"/>
  <path d="M-400 620 L0 610 C 250 580, 500 640, 760 600 S 1050 560, 1200 590 L1600 600 V1200 H-400 Z" fill="#edf2ea"/>
  <g id="falls">
    <path d="M514 328 L526 258 H690 L704 328 Z" fill="#b3c3b8"/>
    <path d="M526 258 L548 220 L600 208 L650 212 L682 232 L690 258 Z" fill="#c9d6cc"/>
    <path d="M646 258 H690 L704 328 H660 Z" fill="#a6b8ab"/>
    <path class="water-fill-flat" d="M590 252 H626 V332 H590 Z"/>
    <path d="M599 256 V322 M608 262 V322 M617 256 V322" class="falls-line"/>
  </g>
  <path id="stream-edge" d="${STREAM}" class="stream-edge"/>
  <path id="stream-line" d="${STREAM}" class="stream-water"/>
  <path d="${STREAM}" class="stream-flow"/>
  <ellipse class="water-fill" cx="606" cy="326" rx="80" ry="19"/>
  <ellipse cx="608" cy="313" rx="28" ry="6" fill="#fbfbf8"/><path d="M548 334 h22 M650 336 h24 M590 340 h16" class="water-glint"/>
  ${trees}
  <g id="rock" transform="translate(0 26)">
    <path d="M424 656 L436 618 L466 596 L506 600 L534 624 L544 656 Z" fill="#9aa59d"/>
    <path d="M436 618 L466 596 L506 600 L486 626 Z" fill="#b9c2bb"/>
    <path d="M486 626 L506 600 L534 624 L544 656 L500 656 Z" fill="#838f88"/>
    <path d="M404 656 L412 642 L430 642 L436 656 Z" fill="#9aa59d"/>
  </g>
  <g id="loops">${LOOP_SPOTS.map((spot, i) => `<path class="loop" id="loopc-${i}" d="${connectorPath(spot)}"/><path class="loop" id="loop-${i}" d="${loopPath(spot)}"/>`).join('')}</g>
  <path class="trail-edge" d="${MAIN}"/>
  <path class="trail-planned" d="${MAIN}"/>
  <path class="trail-dash" d="${MAIN}"/>
  <g class="trail-alt-plan" id="alt-plan"><path class="trail-edge" d="${ALT}"/><path class="trail-planned" d="${ALT}"/><path class="trail-dash" d="${ALT}"/></g>
  <path class="trail-walked first" id="walked-first" d="${MAIN}"/>
  <path class="trail-walked" id="walked-second" d="${MAIN}"/>
  <path class="trail-closed-seg" id="closed-seg" d="${MAIN}"/>
  <path class="trail-walked" id="walked-alt" d="${ALT}"/>
  <path class="trail-closed-seg" id="whatif" d="${MAIN}" style="stroke-dasharray: 3 9"/>
  <g transform="translate(628 505) rotate(-14)"><rect x="-24" y="-11" width="48" height="22" rx="3" fill="#b59a78"/><path d="M-24 -11 h48 M-24 11 h48" stroke="#7b6a55" stroke-width="3"/><path d="M-12 -11 v22 M0 -11 v22 M12 -11 v22" stroke="#7b6a55" stroke-width="1.5"/></g>
  <g transform="translate(66 650)"><path d="M-22 0 V-20 L0 -38 L22 -20 V0 Z" fill="#fbfbf8" stroke="#285442" stroke-width="3" stroke-linejoin="round"/><rect x="-6" y="-14" width="12" height="14" fill="#285442"/></g>
  <text class="place-label" x="84" data-x="84" y="584" text-anchor="middle">${tx('hike.trailhead')}</text>
  <text class="place-label" x="1066" data-x="1066" y="204" text-anchor="middle">${tx('hike.lake')}</text>
  <text class="place-label small" x="412" data-x="412" y="672" text-anchor="end" id="rock-label">${tx('hike.rock')}</text>
  <text class="place-label small" x="650" data-x="650" y="716">${tx('hike.stream')}</text>
  <text class="place-label" x="610" data-x="610" y="190" text-anchor="middle" id="falls-label">${tx('hike.waterfall')}</text>
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
  <g id="picnic" class="fade-item" transform="translate(484 352)"><rect x="-26" y="-10" width="52" height="20" rx="3" fill="#e0a93b" transform="skewX(-20)"/><path d="M-24 0 h48 M-8 -10 v20 M8 -10 v20" stroke="#f7ead0" stroke-width="3" transform="skewX(-20)"/></g>
  ${walkersMarkup()}
</svg>`;
}

export function createHikeScene(root) {
  root.innerHTML = `${sceneSVG()}
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
  // A practice walk goes out along the connector, once round the loop, and back the same way.
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

  // Keep trees off the trails, the stream and the drawn features.
  {
    const near = [[main, 16], [altPath, 16], [$('#stream-line'), 30]].flatMap(([path, margin]) => {
      const length = path.getTotalLength();
      return Array.from({ length: Math.ceil(length / 12) + 1 }, (_, i) => {
        const point = path.getPointAtLength(Math.min(length, i * 12));
        return [point.x, point.y, margin];
      });
    });
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
    const sequential = animate && from;
    if (beatId === 'halfway' && sequential && from === 'plan') {
      applyState('plan');
      if (!(await walk({ path: main, length: mainLength, from: 0, to: TURN, duration: 3200, token, trace: main, bottles: { count: 2, from: 1, to: 0.5 } }))) return;
      show('#turn-flag', true);
      return;
    }
    if (beatId === 'turnback' && sequential && from === 'halfway') {
      applyState('halfway');
      if (!(await walk({ path: main, length: mainLength, from: TURN, to: 0, duration: 2600, token, facing: -1, bottles: { count: 2, from: 0.5, to: 0.08 } }))) return;
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
      place(main, mainLength, 0, 1);
      return;
    }
    if (beatId === 'retry' && sequential && from === 'practice') {
      applyState('practice');
      setLoops(0);
      show('#loop-labels', false);
      if (!(await walk({ path: main, length: mainLength, from: 0, to: bridge - 0.012, duration: 4200, token, trace: $('#walked-second'), bottles: { count: 4, from: 1, to: 0.72 } }))) return;
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
      show('#ranger-bubble', false);
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
  return { show: showBeat, choose, hide() {}, current: () => current, sortBoard: $('#sort-board') };
}
