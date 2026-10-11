// Study copy of src/lessons/choices/journey-map.js for the Lesson 1 opening
// (design 001 v13). Same field, seed, renderer and cover; the Today canvas, the
// gray and green states and the key are gone. When the story starts the field
// fades out and a life from the lives store is drawn in the Explore chapter's
// language (life-map.js); "Choices add up" puts its three chips on that drawing.
import { createExplorationSession } from '../../src/engine/choices-exploration.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../../src/engine/lab-settings.js';
import { generateNetwork } from '../../src/engine/path-network.js';
import { createLabRenderer, fitOverview } from '../../src/engine/lab-renderer.js';
import { canvasBitmap } from '../../src/engine/path-presentation.js';
import { wait } from '../../src/lessons/choices/journey-motion.js';
import { t } from '../../src/i18n/runtime.js';
import { finalFrame } from './life.js';
import { createLifeMap } from './life-map.js';

const STORY_AGE = 12;
const FOREST = '#285442';

/**
 * The three steps "Choices add up" names on a life: a choice of the person's
 * own that builds on an earlier one ("His choice"), the first lucky break
 * ("Luck") and the first setback ("Not his choice").
 */
export function addsSteps(life) {
  const steps = life.steps;
  const own = steps.findIndex(step => step.kind === 'choice' && !step.byFamily && step.age >= 8 && step.echoes.length);
  const found = [
    { step: own >= 0 ? own : steps.findIndex(step => step.kind === 'choice' && !step.byFamily && step.age >= 8), key: 'map.life.choice', tone: 'taken', tries: [{ dy: -30 }, { dy: 54 }, { dy: -52 }, { dy: 76 }, { dy: -74 }, { dy: 98 }] },
    { step: steps.findIndex(step => step.kind === 'lucky'), key: 'map.life.luck', tone: 'possible', tries: [{ dy: -30 }, { dy: 54 }, { dy: -52 }, { dy: 76 }, { dy: -74 }, { dy: 98 }] },
    { step: steps.findIndex(step => step.kind === 'setback'), key: 'map.life.notHis', tone: 'closed', tries: [{ dy: 54 }, { dy: 76 }, { dy: -30 }, { dy: -52 }, { dy: 98 }, { dy: -74 }] },
  ];
  return found.filter(item => item.step > 0);
}

export function createPathsScene(root, { edgeFade = null, life = {} } = {}) {
  const stack = root.querySelector('.map-stack');
  const baseCanvas = root.querySelector('#map-base');
  const fxCanvas = root.querySelector('#map-fx');
  const callouts = root.querySelector('#map-callouts');
  const baseRenderer = createLabRenderer(baseCanvas);
  let fx = null;
  try { fx = fxCanvas.getContext('2d'); } catch { fx = null; }

  let snapshot = null;
  let overview = null;
  let current = null;
  let pulse = null;
  let fxMode = 'none';
  let lifeFrame = finalFrame();
  const renderSettings = { ...LAB_DEFAULTS, ...(edgeFade === null ? {} : { edgeFade }), labels: { beginning: t('map.beginning'), today: age => t('map.today', { age }) } };

  const data = () => {
    if (!snapshot) snapshot = createExplorationSession({ age: STORY_AGE }).snapshot();
    return snapshot;
  };
  // The stack's layout size, kept from the resize observer: reading it every
  // frame would force a layout while the narration's lines arrive.
  let size = null;
  const rect = () => {
    if (!size) size = { width: stack.clientWidth, height: stack.clientHeight };
    return size;
  };
  const view = () => fitOverview(data().network.bounds, rect(), undefined, data().network.maxAge);
  const beginning = () => view().world(data().projection.past[0]);

  // The life: Born sits on the field's Beginning dot.
  const lifeMap = createLifeMap(stack, { origin: beginning, before: callouts, ...life });
  const failed = baseRenderer.failed || !fx || lifeMap.failed;
  const { axis } = lifeMap.layers;
  const lifeLayers = [axis, lifeMap.layers.grays, lifeMap.layers.dark, lifeMap.layers.marks, lifeMap.layers.live, lifeMap.layers.overlay];

  const painted = { base: '' };
  function paintBase() {
    if (failed) return;
    const r = rect();
    const key = `${Math.round(r.width)}x${Math.round(r.height)}@${devicePixelRatio || 1}`;
    if (painted.base === key) return;
    painted.base = key;
    if (!overview) overview = generateNetwork(networkOptionsForLab(LAB_DEFAULTS, { today: STORY_AGE }));
    baseRenderer.paint(overview, data().projection, renderSettings, false);
  }

  function sizeFx() {
    const r = rect();
    const bitmap = canvasBitmap(r, devicePixelRatio || 1);
    if (fxCanvas.width !== bitmap.width || fxCanvas.height !== bitmap.height) {
      fxCanvas.width = bitmap.width; fxCanvas.height = bitmap.height;
    }
    fx.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    fx.clearRect(0, 0, r.width, r.height);
    return r;
  }

  // The field shows on the cover and while it grows; the story starts on an empty age line.
  function setField(state, duration = 0) {
    stack.dataset.field = state;
    baseCanvas.style.transition = duration ? `opacity ${duration}ms ease` : 'none';
    baseCanvas.style.opacity = state === 'shown' ? '' : '0';
    axis.style.transition = duration ? `opacity ${duration}ms ease` : 'none';
    axis.style.opacity = state === 'shown' ? '0' : '1';
  }

  function drawFx() {
    if (failed) return;
    fxCanvas.style.visibility = fxMode === 'cover' ? '' : 'hidden';
    lifeLayers.forEach(layer => { layer.style.visibility = fxMode === 'life' ? '' : 'hidden'; });
    lifeMap.setVisible(fxMode === 'life');
    if (fxMode === 'life') { lifeMap.setFrame(lifeFrame); return; }
    if (fxMode === 'none') return;
    sizeFx();
    if (fxMode === 'cover') {
      const r = rect();
      const birth = beginning();
      fx.beginPath(); fx.arc(birth.x, birth.y, 4.5, 0, Math.PI * 2); fx.fillStyle = FOREST; fx.fill();
      fx.fillStyle = '#5a6961'; fx.font = '500 15px "Avenir Next", AvenirNext, "Segoe UI", sans-serif';
      fx.textAlign = 'center'; fx.fillText(t('map.beginning'), birth.x, Math.min(birth.y + 40, r.height - 8));
    }
  }

  // ——— Chips (the lesson's chip(), with its collision avoidance) ———
  const hits = (box, other) => box.left < other.right + 8 && box.right > other.left - 8 && box.top < other.bottom + 6 && box.bottom > other.top - 6;
  const crosses = (box, other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top;
  // The farther tries "Choices add up" may use, after an item's own (out to 140 px from the dot),
  // and the short slides along the route, after no slide at all.
  const FARTHER = [{ dy: -96 }, { dy: 120 }, { dy: -118 }, { dy: 140 }, { dy: -140 }];
  const SLIDES = [0, 20, -20, 40, -40];
  // A chip near its dot, inside the map, clear of the other chips, of every dot (its pin crosses
  // none but its own) and of the steps' labels: first also clear of the route, then over it; then,
  // with `labels` ({ box, element } of other steps' labels it may cover), the try that covers the
  // fewest of them: those step back. Each try runs right from the dot, then left, then centred on
  // it, slid along the route as little as it can be, and keeps the dot under the chip for its pin.
  function chip(text, point, tone, index, { placed, tries, labels = [], dots = [], onPath = () => false, card = null }) {
    const element = document.createElement('div');
    element.className = 'map-chip';
    element.dataset.tone = tone;
    element.style.visibility = 'hidden';
    const label = document.createElement('span');
    label.textContent = text;
    element.append(label);
    callouts.append(element);
    const width = label.offsetWidth;
    const height = label.offsetHeight;
    const r = rect();
    const all = [...tries, ...FARTHER.filter(far => !tries.some(own => own.dy === far.dy))];
    const offsets = SLIDES.flatMap(dx => ['start', 'end', 'middle'].flatMap(align => all.map(offset => ({ ...offset, dx, align }))));
    const boxAt = ({ dx = 0, dy = -14, align = 'start' }) => {
      const left = point.x + dx + (align === 'end' ? 14 - width : align === 'middle' ? -width / 2 : -14);
      return { left, top: point.y + dy - height - 4, right: left + width, bottom: point.y + dy - 4 };
    };
    const inside = box => box.left >= 4 && box.right <= r.width - 4 && box.top >= 4 && box.bottom <= r.height - 40
      && point.x >= box.left + 10 && point.x <= box.right - 10;
    // The pin: from the chip's edge to the dot.
    const pinOf = box => ({ left: point.x - 1, right: point.x + 1, top: Math.min(box.bottom, point.y + 5), bottom: Math.max(box.top, point.y - 5) });
    const dotBox = dot => ({ left: dot.x - 7, right: dot.x + 7, top: dot.y - 7, bottom: dot.y + 7 });
    const others = dots.filter(dot => dot !== point).map(dotBox);
    const own = dotBox(point);
    const onDots = box => crosses(box, own) || others.some(dot => crosses(box, dot) || crosses(pinOf(box), dot));
    const offCard = box => !card || !hits(box, card);
    const fits = box => inside(box) && offCard(box) && !onDots(box);
    const blocks = (box, other) => hits(box, other) || crosses(pinOf(box), other);
    const clear = (test, clash = blocks) => offsets.find(offset => { const box = boxAt(offset); return fits(box) && test(box) && !placed.some(other => clash(box, other)); });
    // Last before stepping labels back: the pin may cross a label or a chip (never a dot).
    let at = clear(box => !onPath(box)) ?? clear(() => true) ?? clear(() => true, hits);
    let covered = [];
    if (!at && labels.length) {
      const boxes = new Set(labels.map(item => item.box));
      let fewest = Infinity;
      for (const offset of offsets) {
        const box = boxAt(offset);
        if (!fits(box) || placed.some(other => !boxes.has(other) && hits(box, other))) continue;
        const under = labels.filter(item => hits(box, item.box));
        if (under.length < fewest) { fewest = under.length; at = offset; covered = under; }
      }
    }
    if (!at) { element.remove(); return null; }
    const { dy = -14 } = at;
    const box = boxAt(at);
    for (const item of covered) {
      item.element.classList.add('is-stepped-back');
      placed.splice(placed.indexOf(item.box), 1);
      labels.splice(labels.indexOf(item), 1);
    }
    placed.push(box);
    element.style.visibility = '';
    element.style.left = `${box.left}px`;
    element.style.top = `${box.top}px`;
    element.style.animationDelay = `${index * 90}ms`;
    const pin = document.createElement('i');
    pin.style.left = `${point.x - box.left}px`;
    if (dy > 0) { pin.style.top = 'auto'; pin.style.bottom = '100%'; pin.style.height = `${Math.max(3, dy - height - 4)}px`; }
    else pin.style.height = `${Math.max(6, -dy + 4)}px`;
    element.append(pin);
    return box;
  }

  const boxIn = element => {
    const outer = stack.getBoundingClientRect(); const inner = element.getBoundingClientRect();
    return { left: inner.left - outer.left, right: inner.right - outer.left, top: inner.top - outer.top, bottom: inner.bottom - outer.top };
  };
  function renderCallouts(mode) {
    callouts.replaceChildren();
    if (!lifeMap.life) return;
    lifeMap.darkLabels().forEach(item => item.element.classList.remove('is-stepped-back'));
    if (failed || mode !== 'adds') return;
    const points = lifeMap.points();
    // The chips stay clear of the steps' labels (the gray choices' labels step back here). Where
    // a life's labels leave no clear room by a named step, the labels of other steps in the chip's
    // way step back too (their dots and lines stay); the three named steps keep theirs.
    const labels = lifeMap.darkLabels();
    const placed = labels.map(item => item.box);
    const items = addsSteps(lifeMap.life);
    const named = new Set(items.map(item => item.step));
    const others = labels.filter(item => !named.has(item.step));
    const { onPath } = lifeMap.geometry().placer;
    const card = lifeMap.card.hidden ? null : boxIn(lifeMap.card);
    items.forEach((item, index) => {
      chip(t(item.key, { pronoun: lifeMap.life.pronoun }), points[item.step], item.tone, index, { placed, tries: item.tries, labels: others, dots: points, onPath, card });
    });
  }

  /**
   * A ring that breathes out from the Beginning (cover) or the route's end
   * (the traveller resting), on the compositor: redrawing the canvas each frame for
   * it cost a frame's budget on slow machines.
   */
  function startPulse(mode) {
    stopPulse();
    if (failed || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const at = mode === 'cover' ? beginning() : lifeMap.endPoint();
    const ring = document.createElement('i');
    ring.className = 'map-pulse';
    ring.setAttribute('aria-hidden', 'true');
    Object.assign(ring.style, {
      position: 'absolute', left: `${at.x - 16}px`, top: `${at.y - 16}px`, width: '32px', height: '32px',
      borderRadius: '50%', border: '1.5px solid rgba(40,84,66,.4)', pointerEvents: 'none',
    });
    stack.append(ring);
    ring.animate([{ transform: 'scale(.5)', opacity: 1 }, { transform: 'scale(2)', opacity: 0 }],
      { duration: 1800, iterations: Infinity, easing: 'cubic-bezier(.2, .6, .4, 1)' });
    pulse = ring;
  }
  function stopPulse() { pulse?.remove(); pulse = null; }

  function setState({ grow, fxModeValue, calloutMode }) {
    stack.dataset.grow = grow;
    fxMode = fxModeValue;
    drawFx();
    renderCallouts(calloutMode);
    if (fxModeValue === 'cover') startPulse('cover');
    else if (fxModeValue === 'life' && lifeFrame.resting && lifeMap.mode !== 'whatif') startPulse('life');
    else stopPulse();
  }

  const FINAL = {
    cover: { grow: 'hidden', fxModeValue: 'cover', calloutMode: 'none' },
    life: { grow: 'shown', fxModeValue: 'life', calloutMode: 'none' },
    adds: { grow: 'shown', fxModeValue: 'life', calloutMode: 'adds' },
  };

  // True from the hike's arrival until the paths show again: a resize then (the stage takes the
  // hike's height below 990px) must not bring the chips back or repaint a field that is fading out.
  let leaving = false;
  function restore() {
    leaving = false;
    delete stack.dataset.leaving;
    stack.style.removeProperty('--fade');
    for (const canvas of [baseCanvas, fxCanvas]) { canvas.style.opacity = ''; canvas.style.transition = ''; }
  }

  async function show(beatId, { from = null, animate = true, token } = {}) {
    current = beatId;
    restore();
    paintBase();
    if (beatId === 'adds') { lifeFrame = finalFrame(); lifeMap.setMode('adds'); }
    if (beatId === 'cover') setField('shown');
    if (!animate || failed) {
      if (beatId !== 'cover') setField('hidden');
      setState(FINAL[beatId]);
      return;
    }
    if (beatId === 'life' && from === 'cover') {
      lifeFrame = { ...finalFrame(), index: -1, resting: false };
      lifeMap.setMode('story');
      setField('shown');
      setState({ ...FINAL.cover, fxModeValue: 'none' });
      stack.dataset.grow = 'hidden';
      void stack.offsetWidth;
      stack.dataset.grow = 'growing';
      await wait(2300, token);
      if (!token?.cancelled && current === 'life') { stack.dataset.grow = 'shown'; setState(FINAL.life); }
      return;
    }
    if (beatId !== 'cover') setField('hidden');
    setState(FINAL[beatId]);
  }

  /** The player's sink: one moment of the story. */
  function setLife(frame) {
    const wasResting = lifeFrame.resting;
    lifeFrame = frame;
    if (fxMode !== 'life') return;
    lifeMap.setFrame(frame);
    if (frame.resting && !wasResting) startPulse('life');
    if (!frame.resting && wasResting) stopPulse();
  }

  /** The story starts: the field fades out while the age line comes in. */
  function beginStory(duration = 600) {
    setField('hidden', duration);
  }

  /** The hike's arrival (§4): the gray lives and the chips go, then the route. */
  function fadeField(duration) {
    leaving = true;
    callouts.querySelectorAll('.map-chip').forEach(element => element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    stopPulse();
    stack.style.setProperty('--fade', `${duration}ms`);
    stack.dataset.leaving = 'field';
    baseCanvas.style.transition = `opacity ${duration}ms ease`;
    baseCanvas.style.opacity = '0';
  }
  function fadeRoute(duration) {
    stack.style.setProperty('--fade', `${duration}ms`);
    stack.dataset.leaving = 'route';
  }

  function resize() {
    size = null;
    if (!current || root.hidden || leaving) return;
    paintBase();
    lifeMap.resize();
    setState(FINAL[current] ?? FINAL.life);
  }
  let resizeQueued = null;
  const idle = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 200));
  new ResizeObserver(() => {
    size = null;
    if (resizeQueued !== null) return;
    resizeQueued = idle(() => { resizeQueued = null; requestAnimationFrame(resize); }, { timeout: 900 });
  }).observe(stack);

  return {
    show, setLife, beginStory, fadeField, fadeRoute, restore,
    /** Repaint now at the current size (the layout just changed and a story is about to start). */
    settle() { size = null; paintBase(); lifeMap.resize(); drawFx(); },
    hide() { stopPulse(); },
    life: lifeMap,
    lifeMode(mode) {
      lifeMap.setMode(mode);
      if (mode === 'whatif') stopPulse();
      else if (fxMode === 'life' && lifeFrame.resting) startPulse('life');
    },
    /** After a picked life has grown: the traveller rests at its end. */
    restAtEnd() { if (fxMode === 'life') startPulse('life'); },
    lifePoints: () => lifeMap.points(),
    failed,
  };
}
