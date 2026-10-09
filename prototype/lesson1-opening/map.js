// Study copy of src/lessons/choices/journey-map.js for the Lesson 1 opening
// (design 001 v13). Same field, seed, renderer and cover; the Today canvas, the
// gray and green states and the key are gone. When Sam's story starts the field
// fades out and his life is drawn in the Explore chapter's language
// (life-map.js); "Choices add up" puts its three chips on that drawing.
import { createExplorationSession } from '../../src/engine/choices-exploration.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../../src/engine/lab-settings.js';
import { generateNetwork } from '../../src/engine/path-network.js';
import { createLabRenderer, fitOverview } from '../../src/engine/lab-renderer.js';
import { canvasBitmap } from '../../src/engine/path-presentation.js';
import { wait } from '../../src/lessons/choices/journey-motion.js';
import { t } from '../../src/i18n/runtime.js';
import { FINAL_FRAME } from './life.js';
import { createLifeMap } from './life-map.js';

const STORY_AGE = 12;
const FOREST = '#285442';

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
  let lifeFrame = FINAL_FRAME;
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

  // Sam's life: Born sits on the field's Beginning dot.
  const lifeMap = createLifeMap(stack, { origin: beginning, before: callouts, ...life });
  const failed = baseRenderer.failed || !fx || lifeMap.failed;
  const { axis } = lifeMap.layers;
  const lifeLayers = [axis, lifeMap.layers.grays, lifeMap.layers.dark, lifeMap.layers.live, lifeMap.layers.overlay];

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

  // The field shows on the cover and while it grows; Sam's story starts on an empty age line.
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
  function chip(text, point, tone, index, placed, { dx = 0, dy = -14 } = {}) {
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
    const box = { left: point.x + dx - 14, top: point.y + dy - height - 4, right: point.x + dx - 14 + width, bottom: point.y + dy - 4 };
    const r = rect();
    const fits = box.left >= 4 && box.right <= r.width - 4 && box.top >= 4 && box.bottom <= r.height - 40
      && !placed.some(other => box.left < other.right + 8 && box.right > other.left - 8 && box.top < other.bottom + 6 && box.bottom > other.top - 6);
    if (!fits) { element.remove(); return false; }
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
    return true;
  }

  // "His choice" on guitar, "Luck" on the radio play, "Not his choice" where the band splits.
  const ADDS = [
    { step: 2, key: 'map.life.choice', tone: 'taken', tries: [{ dy: -30 }, { dy: 54 }, { dy: -52 }, { dy: 76 }] },
    { step: 5, key: 'map.life.luck', tone: 'possible', tries: [{ dy: -30 }, { dy: 54 }, { dy: -52 }, { dy: 76 }] },
    { step: 8, key: 'map.life.notHis', tone: 'closed', tries: [{ dy: 54 }, { dy: 76 }, { dy: -30 }, { dy: -52 }] },
  ];
  function renderCallouts(mode) {
    callouts.replaceChildren();
    if (failed || mode !== 'adds') return;
    const points = lifeMap.points();
    const placed = lifeMap.occupied();
    ADDS.forEach((item, index) => {
      for (const offset of item.tries) {
        if (chip(t(item.key), points[item.step], item.tone, index, placed, offset)) break;
      }
    });
  }

  /**
   * A ring that breathes out from the Beginning (cover) or the route's end
   * (Sam resting), on the compositor: redrawing the canvas each frame for
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
    if (beatId === 'adds') { lifeFrame = FINAL_FRAME; lifeMap.setMode('adds'); }
    if (beatId === 'cover') setField('shown');
    if (!animate || failed) {
      if (beatId !== 'cover') setField('hidden');
      setState(FINAL[beatId]);
      return;
    }
    if (beatId === 'life' && from === 'cover') {
      lifeFrame = { ...FINAL_FRAME, index: -1, resting: false };
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

  /** The player's sink: one moment of Sam's story. */
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

  /** The hike's arrival (§4): the gray lives and the chips go, then Sam's route. */
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
