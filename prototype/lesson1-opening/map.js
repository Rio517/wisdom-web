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

/**
 * Sam's route is one smooth curve through his points (a cubic Hermite spline
 * in x, so it only moves forward and never loops). The tangent at each point
 * follows the field's own lines there, unless that would fight a rise or a drop:
 * - inside a climb or a fall, the curve keeps the climb's slope;
 * - where a level stretch meets a climb or a fall, it eases in and out (an S,
 *   never a corner), so the years between the record deal and the split arc
 *   gently over;
 * - the drop is an S that bottoms out just before the setback marker, and the
 *   climb after it leaves gently: two shaping knots (not stops) sit just
 *   outside the marker, a little above it, so the bottom is a U, not a V.
 * Slopes are dy/dx in screen pixels.
 */
const LEVEL = 0.25; // a chord flatter than this (about 14 degrees) is a level stretch
function routeKnots(points, field, markerRadius) {
  const knots = [];
  points.forEach((point, index) => {
    const previous = points[index - 1];
    const drop = LIFE_STEPS[index].kind === 'drop';
    // Just outside the setback marker, on both sides, a tenth of the way back
    // up the fall (or the climb after it).
    if (drop && previous) {
      const gap = Math.min(markerRadius + 1, 0.4 * (point.x - previous.x));
      knots.push({ x: point.x - gap, y: point.y - 0.1 * (point.y - previous.y), step: null });
    }
    knots.push({ x: point.x, y: point.y, step: index, flow: field[index] ?? 0 });
    const next = points[index + 1];
    if (drop && next) {
      const gap = Math.min(markerRadius + 1, 0.4 * (next.x - point.x));
      knots.push({ x: point.x + gap, y: point.y + 0.1 * (next.y - point.y), step: null });
    }
  });
  const chord = knots.slice(1).map((knot, index) => (knot.y - knots[index].y) / Math.max(1e-6, knot.x - knots[index].x));
  const kind = slope => (Math.abs(slope) < LEVEL ? 0 : Math.sign(slope));
  const between = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
  knots.forEach((knot, index) => {
    const flow = knot.flow;
    const before = chord[index - 1]; const after = chord[index];
    // A shaping knot keeps the fall (or climb) monotone through it.
    if (knot.step === null) { knot.m = before * after > 0 ? 2 * before * after / (before + after) : 0; return; }
    // The setback itself: already turning up, so the drop's lowest point is just before it.
    if (LIFE_STEPS[knot.step].kind === 'drop' && after !== undefined) { knot.m = Math.min(0, 0.25 * after); return; }
    if (index === 0) { knot.m = between(flow, chord[0] - 0.2, chord[0] + 0.2); return; }
    if (index === knots.length - 1) { knot.m = between(flow, chord.at(-1) - 0.2, chord.at(-1) + 0.2); return; }
    const a = kind(before); const b = kind(after);
    if (!a && !b) { knot.m = between(flow, Math.min(before, after) - 0.12, Math.max(before, after) + 0.12); return; }
    if (a && a === b) { knot.m = 2 * before * after / (before + after); return; }
    if (a && b) { knot.m = between(flow, 0.1 * after, 0.3 * after); return; }
    // Easing into or out of a climb or a fall: the slope through both
    // neighbours (as a Catmull-Rom spline would, a little fuller), held to
    // half the climb.
    const level = a ? after : before; const steep = a ? before : after;
    const through = (knots[index + 1].y - knots[index - 1].y) / Math.max(1e-6, knots[index + 1].x - knots[index - 1].x);
    knot.m = between(1.3 * through, level, 0.5 * steep);
  });
  return knots;
}
/** The cubic Bézier controls from one knot to the next. */
function piece(start, end) {
  const handle = (end.x - start.x) / 3;
  return [start, { x: start.x + handle, y: start.y + start.m * handle }, { x: end.x - handle, y: end.y - end.m * handle }, end];
}
function tracePath(context, knots) {
  context.moveTo(knots[0].x, knots[0].y);
  for (let index = 1; index < knots.length; index += 1) {
    const [, c1, c2, end] = piece(knots[index - 1], knots[index]);
    context.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  }
}

/**
 * The same curve as tracePath, as one stretch per step that the traveller can
 * walk (one cubic piece, or two beside the setback), with a table from
 * distance along the line to a point on it, so a walk's eased progress is an
 * even distance along the line, not along x (the drop would otherwise be over
 * in a blink).
 */
function walkable(knots) {
  const stops = knots.map((knot, index) => (knot.step === null ? -1 : index)).filter(index => index >= 0);
  const cubic = (c, u) => {
    const v = 1 - u;
    return {
      x: v * v * v * c[0].x + 3 * v * v * u * c[1].x + 3 * v * u * u * c[2].x + u * u * u * c[3].x,
      y: v * v * v * c[0].y + 3 * v * v * u * c[1].y + 3 * v * u * u * c[2].y + u * u * u * c[3].y,
    };
  };
  return stops.slice(1).map((last, index) => {
    const first = stops[index];
    const pieces = [];
    for (let k = first; k < last; k += 1) pieces.push(piece(knots[k], knots[k + 1]));
    // Points along the step's stretch, evenly in the curve's parameter, with the distance to each.
    const samples = [knots[first]];
    const table = [0];
    pieces.forEach(c => {
      for (let i = 1; i <= 32; i += 1) {
        const point = cubic(c, i / 32);
        const previous = samples.at(-1);
        table.push(table.at(-1) + Math.hypot(point.x - previous.x, point.y - previous.y));
        samples.push(point);
      }
    });
    const length = table.at(-1);
    return {
      atFraction(fraction) {
        const target = Math.max(0, Math.min(1, fraction)) * length;
        let i = 1;
        while (i < table.length - 1 && table[i] < target) i += 1;
        const span = table[i] - table[i - 1] || 1;
        const along = (target - table[i - 1]) / span;
        return { x: samples[i - 1].x + (samples[i].x - samples[i - 1].x) * along, y: samples[i - 1].y + (samples[i].y - samples[i - 1].y) * along };
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
  /** The slope of the field's own lines around each point, nearer lines counting more. */
  function fieldSlopes(points, v) {
    if (!overview) overview = generateNetwork(networkOptionsForLab(LAB_DEFAULTS, { today: STORY_AGE }));
    const radius = 28;
    const sums = points.map(() => ({ slope: 0, weight: 0 }));
    const left = Math.min(...points.map(point => point.x)) - radius;
    const right = Math.max(...points.map(point => point.x)) + radius;
    for (const edge of overview.edges) {
      let previous = null;
      for (const raw of edge.points) {
        const point = v.world(raw);
        if (previous && point.x - previous.x > 0.5 && point.x > left && previous.x < right) {
          const mx = (point.x + previous.x) / 2; const my = (point.y + previous.y) / 2;
          const slope = (point.y - previous.y) / (point.x - previous.x);
          points.forEach((at, index) => {
            const distance = Math.hypot(mx - at.x, my - at.y);
            if (distance >= radius) return;
            const weight = 1 - distance / radius;
            sums[index].slope += weight * slope; sums[index].weight += weight;
          });
        }
        previous = point;
      }
    }
    return sums.map(({ slope, weight }) => (weight ? slope / weight : 0));
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
    const knots = routeKnots(points, fieldSlopes(points, v), 8.5 * sizeFactor());
    route = { key, points, box, knots, segments: walkable(knots) };
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
    const { points, knots } = lifeRoute();
    const frame = lifeFrame;
    const head = travellerAt(frame.pos);
    // The route so far, cut at the traveller (the route never runs backwards).
    if (frame.pos > 0) {
      lx.save();
      lx.beginPath(); lx.rect(0, 0, head.x + 0.5, r.height); lx.clip();
      lx.beginPath(); tracePath(lx, knots);
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
    lifeKnots: () => lifeRoute().knots,
    failed,
  };
}
