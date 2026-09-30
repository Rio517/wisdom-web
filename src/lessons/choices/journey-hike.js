import { LEARNED } from './journey-story.js';
import { t } from '../../i18n/runtime.js';

const tx = key => String(t(key)).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
import { ICONS } from './journey-icons.js';
import { tween, ease, wait } from './journey-motion.js';

const MAIN = 'M110 660 C 180 650, 230 612, 300 596 S 410 566, 452 548 S 560 520, 628 505 C 690 492, 716 452, 748 420 S 800 360, 846 332 S 916 262, 968 246';
const ALT = 'M628 505 C 700 532, 790 562, 880 550 S 996 532, 1040 548';
const LOOPS = [
  'M150 742 a50 21 0 1 0 100 0 a50 21 0 1 0 -100 0',
  'M292 758 a52 21 0 1 0 104 0 a52 21 0 1 0 -104 0',
  'M442 742 a52 22 0 1 0 104 0 a52 22 0 1 0 -104 0',
];
const TURN = 0.4;

const TREE_SPOTS = [
  [196, 548, 1], [226, 532, .9], [258, 556, 1.1], [300, 520, .95], [338, 540, 1], [372, 510, 1.05], [520, 488, .9], [556, 470, 1],
  [406, 494, .85], [470, 470, .9], [236, 600, .8], [380, 610, .85], [520, 596, .8], [168, 590, .85], [700, 560, .9], [760, 596, .85],
  [820, 470, .8], [870, 452, .75], [690, 350, .7], [642, 372, .65], [590, 420, .8], [930, 430, .7], [980, 452, .75],
];

function tree([x, y, s], index) {
  const dark = index % 3 === 0;
  const fill = dark ? '#6f917a' : '#8daa91';
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -44 L15 -8 H-15 Z" fill="${fill}"/><path d="M0 -30 L18 4 H-18 Z" fill="${fill}"/><rect x="-2.5" y="4" width="5" height="8" fill="#7b6a55"/></g>`;
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
  return `<svg class="hike-map" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="M-400 330 L0 330 L90 250 L170 300 L280 170 L380 280 L470 210 L560 300 L700 140 L820 260 L900 190 L1010 250 L1100 160 L1200 240 L1600 300 V1200 H-400 Z" fill="#e2e9e2"/>
  <path d="M-400 420 L0 400 L120 330 L230 380 L340 300 L460 380 L600 290 L720 360 L850 290 L915 240 L1100 238 L1150 270 L1200 290 L1600 330 V1200 H-400 Z" fill="#d2ddd3"/>
  <ellipse cx="1010" cy="246" rx="92" ry="21" fill="#b7d3da"/>
  <path d="M950 244 h40 M1030 250 h30" stroke="#e3eff1" stroke-width="3" stroke-linecap="round"/>
  <path d="M-400 480 L0 470 C 200 430, 380 470, 560 430 S 900 380, 1200 420 L1600 440 V1200 H-400 Z" fill="#e5ece3"/>
  <path d="M1020 560 C 1012 500, 1024 440, 1046 400 C 1064 372, 1110 368, 1132 392 C 1152 420, 1160 500, 1156 560 Z" fill="#b3c3b8"/>
  <path d="M1046 400 C 1064 380, 1104 376, 1128 394" stroke="#9fb2a6" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M1070 392 C 1066 440, 1072 500, 1068 548 H1102 C 1098 500, 1104 440, 1098 390 Z" fill="#c9dfe4"/>
  <path d="M1076 404 V 540 M1086 398 V 540 M1094 404 V 540" class="falls-line"/>
  <ellipse cx="1082" cy="552" rx="54" ry="14" fill="#b7d3da"/>
  <path d="M-400 620 L0 610 C 250 580, 500 640, 760 600 S 1050 560, 1200 590 L1600 600 V1200 H-400 Z" fill="#edf2ea"/>
  <path d="M 770 240 C 730 320, 704 378, 690 430 S 610 478, 632 560 S 590 700, 624 820 S 640 1000, 610 1200" fill="none" stroke="#c9dfe4" stroke-width="26" stroke-linecap="round"/>
  <path d="M 770 240 C 730 320, 704 378, 690 430 S 610 478, 632 560 S 590 700, 624 820 S 640 1000, 610 1200" fill="none" stroke="#e1eef1" stroke-width="5" stroke-dasharray="16 22" stroke-linecap="round"/>
  ${TREE_SPOTS.map(tree).join('')}
  <path d="M372 540 c-5 -26 14 -40 36 -36 c19 4 26 21 19 36 z" fill="#aab4ad"/>
  <path d="M384 528 c7 -9 19 -12 29 -7" stroke="#c6cec8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g id="loops">${LOOPS.map((d, i) => `<path class="loop" id="loop-${i}" d="${d}"/>`).join('')}</g>
  <path class="trail-planned" d="${MAIN}"/>
  <path class="trail-dash" d="${MAIN}"/>
  <path class="trail-alt-plan" id="alt-plan" d="${ALT}"/>
  <path class="trail-walked first" id="walked-first" d="${MAIN}"/>
  <path class="trail-walked" id="walked-second" d="${MAIN}"/>
  <path class="trail-closed-seg" id="closed-seg" d="${MAIN}"/>
  <path class="trail-walked" id="walked-alt" d="${ALT}"/>
  <path class="trail-closed-seg" id="whatif" d="${MAIN}" style="stroke-dasharray: 3 9"/>
  <g transform="translate(628 505) rotate(-14)"><rect x="-22" y="-10" width="44" height="20" rx="3" fill="#b59a78"/><path d="M-22 -10 h44 M-22 10 h44" stroke="#7b6a55" stroke-width="3"/></g>
  <g transform="translate(66 650)"><path d="M-22 0 V-20 L0 -38 L22 -20 V0 Z" fill="#fbfbf8" stroke="#285442" stroke-width="3" stroke-linejoin="round"/><rect x="-6" y="-14" width="12" height="14" fill="#285442"/></g>
  <text class="place-label" x="66" y="684" text-anchor="middle">${tx('hike.trailhead')}</text>
  <text class="place-label" x="1010" y="206" text-anchor="middle">${tx('hike.lake')}</text>
  <text class="place-label small" x="398" y="494" text-anchor="middle" id="rock-label">${tx('hike.rock')}</text>
  <text class="place-label small" x="736" y="646">${tx('hike.stream')}</text>
  <text class="place-label" x="1082" y="598" text-anchor="middle" id="falls-label">${tx('hike.waterfall')}</text>
  <g id="loop-labels" class="fade-item"><path class="trail-dash" d="M112 664 C 120 700, 140 730, 150 742 M112 664 C 180 690, 260 730, 292 758 M112 664 C 240 680, 400 700, 442 742"/><text class="place-label small" x="200" y="784" text-anchor="middle">${tx('hike.loopPark')}</text><text class="place-label small" x="344" y="800" text-anchor="middle">${tx('hike.loopHill')}</text><text class="place-label small" x="494" y="784" text-anchor="middle">${tx('hike.loopRiver')}</text></g>
  <g id="turn-flag" class="fade-item"><path d="M0 0 V-40" stroke="#9a5f3e" stroke-width="3" stroke-linecap="round"/><path d="M0 -40 L24 -33 L0 -26 Z" fill="#9a5f3e"/><text class="place-label small clay" x="10" y="20" id="turn-flag-text">${tx('hike.halfWater')}</text></g>
  <g id="whatif-note" class="fade-item"><text class="place-label clay" x="860" y="300" text-anchor="end">${tx('hike.noWater')}</text></g>
  <g id="storm" class="fade-item">
    <path d="M740 262 a26 26 0 0 1 36 -34 a34 34 0 0 1 62 8 a24 24 0 0 1 20 42 h-104 a20 20 0 0 1 -14 -16z" fill="#9fb1b8"/>
    <g class="rain">${Array.from({ length: 12 }, (_, i) => `<line x1="${752 + i * 9}" y1="${286 + (i % 3) * 8}" x2="${746 + i * 9}" y2="${300 + (i % 3) * 8}"/>`).join('')}</g>
  </g>
  <g id="closed-sign" class="fade-item" transform="translate(760 402)">
    <path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#9a5f3e" stroke-width="5" stroke-linecap="round"/>
    <text class="place-label clay" x="22" y="-16">${tx('hike.trailClosed')}</text>
  </g>
  <g id="ranger" class="fade-item" transform="translate(560 478) scale(1.8)">
    <path d="M-3 0 V-8 M3 0 V-8" stroke="#3b4a44" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="-6" y="-22" width="12" height="15" rx="5" fill="#7b6a55"/>
    <circle cx="0" cy="-27" r="4.8" fill="#c99a74"/>
    <path d="M-9 -30 h18 M-5 -30 q5 -8 10 0" stroke="#4d5e36" stroke-width="3" fill="#4d5e36" stroke-linecap="round"/>
  </g>
  <text id="ranger-label" class="place-label small fade-item" x="560" y="412" text-anchor="middle">${tx('hike.ranger')}</text>
  <g id="ranger-bubble" class="fade-item" transform="translate(300 376)">
    <rect x="0" y="0" width="236" height="46" rx="16" fill="white" stroke="#dbe2da"/><path d="M204 45 l24 18 l-6 -18z" fill="white"/>
    <text x="118" y="29" text-anchor="middle" class="place-label small" style="fill:#23302d;stroke:none">${tx('hike.rangerTip')}</text>
  </g>
  <g id="picnic" class="fade-item" transform="translate(996 556)"><rect x="-26" y="-10" width="52" height="20" rx="3" fill="#e0a93b" transform="skewX(-20)"/><path d="M-24 0 h48 M-8 -10 v20 M8 -10 v20" stroke="#f7ead0" stroke-width="3" transform="skewX(-20)"/></g>
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
  const show = (selector, on) => $(selector).classList.toggle('shown', on);
  const loops = [...root.querySelectorAll('.loop')].map(path => ({ path, length: path.getTotalLength() }));

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
    retry: { at: ['main', 0, 1], first: [0, TURN], second: [0, 0], alt: 0, bottles: [4, 0.72], learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag'], loops: 0.35 },
    closed: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#storm', '#closed-sign', '#ranger', '#ranger-label'], closed: true, loops: 0.35 },
    respond: { learned: ['water', 'map', 'landmarks', 'rest'], shown: ['#turn-flag', '#closed-sign', '#picnic'], closed: true, alt: 1, loops: 0.35 },
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
    const loopAmount = state.loops ?? 0;
    loops.forEach(({ path, length }) => {
      path.style.strokeDasharray = loopAmount ? `${length} ${length}` : `0 ${length * 2}`;
      path.style.opacity = String(loopAmount || 0);
    });
    $('#turn-flag-text').textContent = id === 'retry' || id === 'closed' || id === 'respond' || id === 'sort'
      ? t('hike.turnedBack') : t('hike.halfWater');
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
        const { path, length } = loops[index];
        path.style.opacity = '1';
        walkers.classList.add('walking');
        const run = tween({ duration: 1300, easing: ease.inOut, update: t => {
          path.style.strokeDasharray = `${length * t} ${length * 2}`;
          const point = path.getPointAtLength(length * t);
          walkers.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
          const ahead = path.getPointAtLength(Math.min(length, length * t + 2));
          flip.setAttribute('transform', `scale(${ahead.x >= point.x ? 1 : -1} 1)`);
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
      loops.forEach(({ path }) => { path.style.opacity = '0.35'; });
      show('#loop-labels', false);
      if (!(await walk({ path: main, length: mainLength, from: 0, to: bridge - 0.012, duration: 4200, token, trace: $('#walked-second'), bottles: { count: 4, from: 1, to: 0.72 } }))) return;
      $('#turn-flag-text').textContent = t('hike.turnedBack');
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
