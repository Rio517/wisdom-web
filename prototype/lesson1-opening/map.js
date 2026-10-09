// Study copy of src/lessons/choices/journey-map.js for the Lesson 1 opening
// (design 001 v13). Same field, seed, renderer and cover; the Today canvas, the
// gray and green states and the key are gone. New: the `life` mode, which draws
// Sam's route over the field as a scenario annotation (the field itself is not
// changed), and the three chips of "Choices add up".
import { createExplorationSession } from '../../src/engine/choices-exploration.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../../src/engine/lab-settings.js';
import { generateNetwork } from '../../src/engine/path-network.js';
import { createLabRenderer, fitOverview } from '../../src/engine/lab-renderer.js';
import { canvasBitmap } from '../../src/engine/path-presentation.js';
import { wait } from '../../src/lessons/choices/journey-motion.js';
import { t } from '../../src/i18n/runtime.js';
import { LIFE_STEPS, FINAL_FRAME } from './life.js';

const STORY_AGE = 12;
const FOREST = '#285442';
const CLAY = '#9a5f3e';
const OPEN = '#4f7d5f'; // the lesson's "door that opens" green
const PAPER = '#fbfbf8';

/** The lesson's route curve: monotone cubic, forward only, no loops (journey-map.js). */
function tangents(points) {
  const slopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return point.x > previous.x ? (point.y - previous.y) / (point.x - previous.x) : 0;
  });
  return points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const before = slopes[index - 1]; const after = slopes[index];
    return before * after > 0 ? 2 * before * after / (before + after) : 0;
  });
}
function tracePath(context, points) {
  const tangent = tangents(points);
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]; const end = points[index];
    const handle = (end.x - start.x) / 3;
    if (handle <= 0) { context.lineTo(end.x, end.y); continue; }
    context.bezierCurveTo(start.x + handle, start.y + tangent[index - 1] * handle,
      end.x - handle, end.y - tangent[index] * handle, end.x, end.y);
  }
}

/**
 * The same curve as tracePath, as segments the traveller can walk: each one
 * a cubic with a table from arc length to t, so a walk's eased progress is
 * an even distance along the line, not along x (the drop would otherwise
 * be over in a blink).
 */
function walkable(points) {
  const tangent = tangents(points);
  return points.slice(1).map((end, index) => {
    const start = points[index];
    const handle = (end.x - start.x) / 3;
    const c = [start, { x: start.x + handle, y: start.y + tangent[index] * handle },
      { x: end.x - handle, y: end.y - tangent[index + 1] * handle }, end];
    const at = u => {
      const v = 1 - u;
      return {
        x: v * v * v * c[0].x + 3 * v * v * u * c[1].x + 3 * v * u * u * c[2].x + u * u * u * c[3].x,
        y: v * v * v * c[0].y + 3 * v * v * u * c[1].y + 3 * v * u * u * c[2].y + u * u * u * c[3].y,
      };
    };
    const table = [0];
    let previous = at(0);
    for (let i = 1; i <= 32; i += 1) {
      const point = at(i / 32);
      table.push(table[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
      previous = point;
    }
    const length = table[32];
    return {
      at,
      atFraction(fraction) {
        const target = Math.max(0, Math.min(1, fraction)) * length;
        let i = 1;
        while (i < 32 && table[i] < target) i += 1;
        const span = table[i] - table[i - 1] || 1;
        return at((i - 1 + (target - table[i - 1]) / span) / 32);
      },
    };
  });
}

export function createPathsScene(root, { edgeFade = null } = {}) {
  const stack = root.querySelector('.map-stack');
  const baseCanvas = root.querySelector('#map-base');
  const fxCanvas = root.querySelector('#map-fx');
  const callouts = root.querySelector('#map-callouts');
  const baseRenderer = createLabRenderer(baseCanvas);
  let fx = null;
  try { fx = fxCanvas.getContext('2d'); } catch { fx = null; }
  // Sam's route has its own canvas, only as big as the route: it redraws every
  // frame while he walks, and a full-stage layer would be re-sent each time.
  const lifeCanvas = document.createElement('canvas');
  lifeCanvas.className = 'map-life';
  lifeCanvas.setAttribute('aria-hidden', 'true');
  callouts.before(lifeCanvas);
  let lx = null;
  try { lx = lifeCanvas.getContext('2d'); } catch { lx = null; }
  const failed = baseRenderer.failed || !fx || !lx;

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

  // ——— Sam's route ———
  // x from age by the network's own mapping (path-network.js places every
  // point at an x that is linear in its age), read from the network's points
  // rather than restated here; y from the Beginning dot plus each step's offset.
  let ageToX = null;
  function xForAge(age) {
    if (!ageToX) {
      const points = data().network.edges.flatMap(edge => edge.points);
      const first = points.reduce((a, b) => (b.age < a.age ? b : a));
      const last = points.reduce((a, b) => (b.age > a.age ? b : a));
      const perYear = (last.x - first.x) / (last.age - first.age);
      ageToX = value => first.x + (value - first.age) * perYear;
    }
    return ageToX(age);
  }
  let route = null;
  function lifeRoute() {
    const r = rect();
    const key = `${r.width}x${r.height}`;
    if (route?.key === key) return route;
    const v = view();
    const begin = data().projection.past[0];
    const points = LIFE_STEPS.map(step => v.world({ x: xForAge(step.age), y: begin.y + step.y }));
    const pad = 32; // the widest pulse ring, with room to spare
    const left = Math.max(0, Math.floor(Math.min(...points.map(point => point.x)) - pad));
    const top = Math.max(0, Math.floor(Math.min(...points.map(point => point.y)) - pad));
    const box = { left, top, width: Math.min(r.width, Math.ceil(Math.max(...points.map(point => point.x)) + pad)) - left, height: Math.min(r.height, Math.ceil(Math.max(...points.map(point => point.y)) + pad)) - top };
    route = { key, points, box, segments: walkable(points) };
    return route;
  }
  function travellerAt(pos) {
    const { points, segments } = lifeRoute();
    if (pos <= 0) return points[0];
    const index = Math.min(segments.length - 1, Math.floor(pos));
    return segments[index].atFraction(pos - index);
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

  function sizeLife() {
    const { box } = lifeRoute();
    const style = lifeCanvas.style;
    const placed = `${box.left},${box.top},${box.width},${box.height}`;
    if (lifeCanvas.dataset.box !== placed) {
      lifeCanvas.dataset.box = placed;
      Object.assign(style, { left: `${box.left}px`, top: `${box.top}px`, right: 'auto', bottom: 'auto', width: `${box.width}px`, height: `${box.height}px` });
    }
    const bitmap = canvasBitmap(box, devicePixelRatio || 1);
    if (lifeCanvas.width !== bitmap.width || lifeCanvas.height !== bitmap.height) {
      lifeCanvas.width = bitmap.width; lifeCanvas.height = bitmap.height;
    }
    // Draw in the stack's own pixels; the canvas just sits at the box.
    lx.setTransform(bitmap.scale, 0, 0, bitmap.scale, -box.left * bitmap.scale, -box.top * bitmap.scale);
    lx.clearRect(box.left, box.top, box.width, box.height);
  }

  function stop(point, scale) {
    // A stop on the route: paper inside a forest ring, flat.
    if (scale <= 0) return;
    lx.beginPath(); lx.arc(point.x, point.y, 5 * scale, 0, Math.PI * 2);
    lx.fillStyle = PAPER; lx.fill();
    lx.lineWidth = 2.2 * Math.min(1, scale); lx.strokeStyle = FOREST; lx.stroke();
  }
  function marker(point, scale, kind) {
    // Luck or help (plus, green ring) and a setback (minus, clay ring): the lesson's "door that opens" style.
    if (scale <= 0) return;
    const color = kind === 'drop' ? CLAY : OPEN;
    const radius = 8.5 * scale;
    const arm = 3.8 * Math.min(1.1, scale);
    lx.beginPath(); lx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    lx.fillStyle = PAPER; lx.fill();
    lx.lineWidth = 2.5; lx.strokeStyle = color; lx.stroke();
    lx.beginPath(); lx.moveTo(point.x - arm, point.y); lx.lineTo(point.x + arm, point.y);
    if (kind !== 'drop') { lx.moveTo(point.x, point.y - arm); lx.lineTo(point.x, point.y + arm); }
    lx.lineCap = 'round'; lx.stroke();
  }

  function drawLife() {
    const r = rect();
    sizeLife();
    const { points } = lifeRoute();
    const frame = lifeFrame;
    const head = travellerAt(frame.pos);
    // The route so far, cut at the traveller (the route never runs backwards).
    if (frame.pos > 0) {
      lx.save();
      lx.beginPath(); lx.rect(0, 0, head.x + 0.5, r.height); lx.clip();
      lx.beginPath(); tracePath(lx, points);
      lx.strokeStyle = FOREST; lx.lineWidth = 3.8; lx.lineCap = 'round'; lx.lineJoin = 'round'; lx.stroke();
      lx.restore();
    }
    // Earlier steps this one builds on answer with one ring each.
    for (const { at, p } of frame.pulses) {
      const point = points[at];
      const eased = 1 - (1 - p) ** 2;
      lx.beginPath(); lx.arc(point.x, point.y, 7 + 15 * eased, 0, Math.PI * 2);
      lx.strokeStyle = FOREST; lx.globalAlpha = 0.6 * (1 - p); lx.lineWidth = 2; lx.stroke();
      lx.globalAlpha = 1;
    }
    // Stops under the traveller; luck, help and setbacks over it, so their mark
    // shows while Sam stands there.
    const k = sizeFactor();
    const events = [];
    LIFE_STEPS.forEach((step, index) => {
      const scale = frame.bloom[index];
      if (!scale) return;
      if (step.kind === 'lift' || step.kind === 'drop') events.push([points[index], scale * k, step.kind]);
      else stop(points[index], scale * k);
    });
    // The traveller: the Beginning dot's green, a size up.
    if (frame.traveller > 0) {
      lx.beginPath(); lx.arc(head.x, head.y, 6 * frame.traveller, 0, Math.PI * 2);
      lx.fillStyle = FOREST; lx.fill();
    }
    events.forEach(([point, scale, kind]) => marker(point, scale, kind));
  }
  // Marks a little smaller on a narrow stage, where the late years sit close together.
  const sizeFactor = () => Math.max(0.8, Math.min(1, rect().width / 950));

  function drawFx() {
    if (failed) return;
    fxCanvas.style.visibility = fxMode === 'cover' ? '' : 'hidden';
    lifeCanvas.style.visibility = fxMode === 'life' ? '' : 'hidden';
    if (fxMode === 'life') { drawLife(); return; }
    if (fxMode === 'none') return;
    sizeFx();
    if (fxMode === 'cover') {
      const r = rect();
      const birth = view().world(data().projection.past[0]);
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
    { step: 2, key: 'map.life.choice', tone: 'taken', tries: [{ dy: -16 }, { dy: 40 }] },
    { step: 5, key: 'map.life.luck', tone: 'possible', tries: [{ dy: -18 }, { dy: 42 }] },
    { step: 8, key: 'map.life.notHis', tone: 'closed', tries: [{ dy: 44 }, { dy: -18 }] },
  ];
  function renderCallouts(mode) {
    callouts.replaceChildren();
    if (failed || mode !== 'adds') return;
    const { points } = lifeRoute();
    const placed = [];
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
    const at = mode === 'cover' ? view().world(data().projection.past[0]) : lifeRoute().points.at(-1);
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
    renderCallouts(calloutMode);
    drawFx();
    if (fxModeValue === 'cover') startPulse('cover');
    else if (fxModeValue === 'life' && lifeFrame.resting) startPulse('life');
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
    for (const canvas of [baseCanvas, fxCanvas, lifeCanvas]) { canvas.style.opacity = ''; canvas.style.transition = ''; }
  }

  async function show(beatId, { from = null, animate = true, token } = {}) {
    current = beatId;
    restore();
    paintBase();
    if (beatId === 'adds') lifeFrame = FINAL_FRAME;
    if (!animate || failed) { setState(FINAL[beatId]); return; }
    if (beatId === 'life' && from === 'cover') {
      lifeFrame = { ...FINAL_FRAME, pos: 0, bloom: FINAL_FRAME.bloom.map(() => 0), traveller: 0, resting: false };
      setState({ ...FINAL.cover, fxModeValue: 'none' });
      stack.dataset.grow = 'hidden';
      void stack.offsetWidth;
      stack.dataset.grow = 'growing';
      await wait(2300, token);
      if (!token?.cancelled && current === 'life') { stack.dataset.grow = 'shown'; setState(FINAL.life); }
      return;
    }
    setState(FINAL[beatId]);
  }

  /** The player's sink: one moment of Sam's story. */
  function setLife(frame) {
    const wasResting = lifeFrame.resting;
    lifeFrame = frame;
    if (fxMode !== 'life') return;
    drawFx();
    if (frame.resting && !wasResting) startPulse('life');
    if (!frame.resting && wasResting) stopPulse();
  }

  /** The hike's arrival (§4): the field goes, then Sam's route. */
  function fadeField(duration) {
    leaving = true;
    callouts.querySelectorAll('.map-chip').forEach(element => element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    stopPulse();
    baseCanvas.style.transition = `opacity ${duration}ms ease`;
    baseCanvas.style.opacity = '0';
  }
  function fadeRoute(duration) {
    lifeCanvas.style.transition = `opacity ${duration}ms ease`;
    lifeCanvas.style.opacity = '0';
  }

  function resize() {
    size = null; route = null;
    if (!current || root.hidden || leaving) return;
    paintBase();
    setState(FINAL[current] ?? FINAL.life);
  }
  let resizeQueued = null;
  const idle = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 200));
  new ResizeObserver(() => {
    size = null; route = null;
    if (resizeQueued !== null) return;
    resizeQueued = idle(() => { resizeQueued = null; requestAnimationFrame(resize); }, { timeout: 900 });
  }).observe(stack);

  return {
    show, setLife, fadeField, fadeRoute, restore,
    /** Repaint now at the current size (the layout just changed and a story is about to start). */
    settle() { size = null; route = null; paintBase(); drawFx(); },
    hide() { stopPulse(); },
    lifePoints: () => lifeRoute().points,
    failed,
  };
}
