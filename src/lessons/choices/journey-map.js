// The paths map: the field of possible lives from one Beginning (the cover), and
// on Lesson 1 one life from the lives store drawn over it in the Explore
// chapter's language (journey-life-map.js, design 001 v13).
// - The home page plays the cover, the field growing and a traveller to Today
//   (`cover`, `many`, `travel`; it has a #map-today canvas).
// - Lesson 1 plays the cover, then the field fades out and a life plays on an age
//   line (`life`), then "Choices add up" puts three chips on it (`adds`); the
//   takeaways show the same life again (`takeaways`).
import { createExplorationSession } from '../../engine/choices-exploration.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../../engine/lab-settings.js';
import { generateNetwork } from '../../engine/path-network.js';
import { createLabRenderer, fitOverview } from '../../engine/lab-renderer.js';
import { canvasBitmap } from '../../engine/path-presentation.js';
import { tween, ease, wait } from './journey-motion.js';
import { t } from '../../i18n/runtime.js';
import { FOREST } from './journey-colors.js';
import { addsSteps, finalFrame } from './journey-life-player.js';
import { createLifeMap } from './journey-life-map.js';

const STORY_AGE = 12;

function tracePath(context, points) {
  const slopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return point.x > previous.x ? (point.y - previous.y) / (point.x - previous.x) : 0;
  });
  const tangent = index => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const before = slopes[index - 1]; const after = slopes[index];
    return before * after > 0 ? 2 * before * after / (before + after) : 0;
  };
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]; const end = points[index];
    const handle = (end.x - start.x) / 3;
    if (handle <= 0) { context.lineTo(end.x, end.y); continue; }
    context.bezierCurveTo(start.x + handle, start.y + tangent(index - 1) * handle,
      end.x - handle, end.y - tangent(index) * handle, end.x, end.y);
  }
}

function pointAtAge(points, age) {
  if (age <= points[0].age) return points[0];
  for (let index = 1; index < points.length; index += 1) {
    const end = points[index];
    if (age > end.age) continue;
    const start = points[index - 1];
    const amount = end.age === start.age ? 0 : (age - start.age) / (end.age - start.age);
    return { age, x: start.x + (end.x - start.x) * amount, y: start.y + (end.y - start.y) * amount };
  }
  return points.at(-1);
}

/**
 * `life` (Lesson 1) adds the life map, with its callbacks (journey-life-map.js).
 * `edgeFade` overrides the right-hand fade, for a full-width stage where the
 * line ends would otherwise stand as a wall.
 */
export function createPathsScene(root, { edgeFade = null, life = null } = {}) {
  const stack = root.querySelector('.map-stack');
  const baseCanvas = root.querySelector('#map-base');
  const todayCanvas = root.querySelector('#map-today');
  const fxCanvas = root.querySelector('#map-fx');
  const callouts = root.querySelector('#map-callouts');
  const baseRenderer = createLabRenderer(baseCanvas);
  const todayRenderer = todayCanvas ? createLabRenderer(todayCanvas) : null;
  let fx = null;
  try { fx = fxCanvas.getContext('2d'); } catch { fx = null; }

  let snapshot = null;
  let overview = null;
  let current = null;
  let travel = 1; // traveller progress 0..1 while animating
  let pulse = null;
  let fxMode = 'none';
  let lifeFrame = finalFrame();
  // The Canvas renderer's own labels, in the page's language.
  const renderSettings = { ...LAB_DEFAULTS, ...(edgeFade === null ? {} : { edgeFade }), labels: { beginning: t('map.beginning'), today: age => t('map.today', { age }) } };

  const data = () => {
    if (!snapshot) snapshot = createExplorationSession({ age: STORY_AGE }).snapshot();
    return snapshot;
  };
  // The stack's layout size, kept from the resize observer: reading it every
  // frame would force a layout while the narration's lines arrive. Layout size,
  // which a transform (a scene fading in at 98.5%) doesn't change.
  let size = null;
  const rect = () => {
    if (!size) size = { width: stack.clientWidth, height: stack.clientHeight };
    return size;
  };
  const view = () => fitOverview(data().network.bounds, rect(), undefined, data().network.maxAge);
  const beginning = () => view().world(data().projection.past[0]);

  // Lesson 1's life: Born sits on the field's Beginning dot.
  const lifeMap = life ? createLifeMap(stack, { origin: beginning, before: callouts, ...life }) : null;
  const failed = baseRenderer.failed || (todayRenderer?.failed ?? false) || !fx || Boolean(lifeMap?.failed);
  const lifeLayers = lifeMap ? Object.values(lifeMap.layers) : [];
  const axis = lifeMap?.layers.axis ?? null;

  // Each canvas depends only on the stage's size, so a beat change that keeps
  // the size reuses it; repainting on every beat cost a long frame right as
  // an animation started. The Today canvas (home page) is painted only once a
  // beat shows it (the cover and the first grow don't).
  const painted = { base: '', today: '' };
  function paintBase(withToday = true) {
    if (failed) return;
    const r = rect();
    const key = `${Math.round(r.width)}x${Math.round(r.height)}@${devicePixelRatio || 1}`;
    if (painted.base !== key) {
      painted.base = key;
      if (!overview) overview = generateNetwork(networkOptionsForLab(LAB_DEFAULTS, { today: STORY_AGE }));
      baseRenderer.paint(overview, data().projection, renderSettings, false);
    }
    if (!todayRenderer) return;
    if (withToday && painted.today !== key) {
      painted.today = key;
      todayRenderer.paint(data().network, data().projection, renderSettings, true);
    }
    if (!withToday && painted.today !== key) prepareToday();
  }

  // Paint the Today canvas ahead, in a quiet moment while nothing grows, so
  // the step that shows it doesn't stall on a full paint (a long frame at
  // the start of the home page's travel).
  let todayQueued = false;
  function prepareToday() {
    if (todayQueued) return;
    todayQueued = true;
    const idle = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 300));
    const attempt = () => idle(() => {
      if (stack.dataset.grow === 'growing') { attempt(); return; }
      todayQueued = false;
      if (!root.hidden) paintBase(true);
    }, { timeout: 2500 });
    attempt();
  }

  function sizeFx() {
    const r = rect();
    const bitmap = canvasBitmap(r, devicePixelRatio || 1);
    // Reallocate only when the size changes; the traveller redraws every frame.
    if (fxCanvas.width !== bitmap.width || fxCanvas.height !== bitmap.height) {
      fxCanvas.width = bitmap.width; fxCanvas.height = bitmap.height;
    }
    fx.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    fx.clearRect(0, 0, r.width, r.height);
    return r;
  }

  // Lesson 1: the field shows on the cover and while it grows; the story starts on an empty age line.
  function setField(state, duration = 0) {
    stack.dataset.field = state;
    baseCanvas.style.transition = duration ? `opacity ${duration}ms ease` : 'none';
    baseCanvas.style.opacity = state === 'shown' ? '' : '0';
    if (!axis) return;
    axis.style.transition = duration ? `opacity ${duration}ms ease` : 'none';
    axis.style.opacity = state === 'shown' ? '0' : '1';
  }

  function drawFx() {
    if (failed) return;
    // An empty full-size canvas still costs the compositor a layer each
    // frame, so it is hidden while there is nothing on it.
    fxCanvas.style.visibility = fxMode === 'none' || fxMode === 'life' ? 'hidden' : '';
    if (lifeMap) {
      lifeLayers.forEach(layer => { layer.style.visibility = fxMode === 'life' ? '' : 'hidden'; });
      lifeMap.setVisible(fxMode === 'life');
      if (fxMode === 'life') { lifeMap.setFrame(lifeFrame); return; }
    }
    if (fxMode === 'none') return;
    const r = sizeFx();
    if (fxMode === 'cover') {
      const birth = beginning();
      fx.beginPath(); fx.arc(birth.x, birth.y, 4.5, 0, Math.PI * 2); fx.fillStyle = FOREST; fx.fill();
      fx.fillStyle = '#5a6961'; fx.font = '500 15px "Avenir Next", AvenirNext, "Segoe UI", sans-serif';
      fx.textAlign = 'center'; fx.fillText(t('map.beginning'), birth.x, Math.min(birth.y + 40, r.height - 8));
      return;
    }
    if (fxMode === 'travel') {
      const v = view();
      const past = data().projection.past;
      const headScreen = v.world(pointAtAge(past, STORY_AGE * travel));
      fx.save();
      fx.beginPath(); fx.rect(0, 0, headScreen.x + 0.5, r.height); fx.clip();
      fx.beginPath(); tracePath(fx, past.map(v.world));
      fx.strokeStyle = FOREST; fx.lineWidth = 3.8; fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.stroke();
      fx.restore();
      // The traveller starts at the Beginning dot's size and arrives at Today's,
      // so neither end pops; no halo, which smeared over the lines.
      const radius = 4 + 2 * Math.min(1, travel * 4);
      fx.beginPath(); fx.arc(headScreen.x, headScreen.y, radius, 0, Math.PI * 2); fx.fillStyle = FOREST; fx.fill();
    }
  }

  // ——— "Choices add up": three chips on the life, with collision avoidance ———
  const hits = (box, other) => box.left < other.right + 8 && box.right > other.left - 8 && box.top < other.bottom + 6 && box.bottom > other.top - 6;
  const crosses = (box, other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top;
  // The farther tries "Choices add up" may use, after an item's own (out to 140 px from the dot),
  // and the short slides along the route, after no slide at all.
  const FARTHER = [{ dy: -96 }, { dy: 120 }, { dy: -118 }, { dy: 140 }, { dy: -140 }, { dy: 165 }, { dy: -165 }, { dy: 195 }, { dy: -195 }];
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
    // The map's visible part (beside the narration the stage runs on under the column).
    const r = { width: callouts.clientWidth, height: callouts.clientHeight };
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
    if (!lifeMap?.life) return;
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
    const chosen = [];
    items.forEach((item, index) => {
      for (const step of [item.step, ...(item.alternates ?? [])]) {
        const box = chip(t(item.key, { pronoun: lifeMap.life.pronoun }), points[step], item.tone, index, { placed, tries: item.tries, labels: others, dots: points, onPath, card });
        if (box) { chosen.push({ ...item, step }); break; }
      }
    });
    lifeMap.life.addsChosen = chosen.length === items.length ? chosen : null;
  }

  /**
   * A ring that breathes out from the Beginning (cover), Today (home page) or
   * the route's end (the traveller resting), on the compositor: redrawing the
   * canvas each frame for it cost a frame's budget on slow machines.
   */
  function startPulse(mode) {
    stopPulse();
    if (failed || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const at = mode === 'cover' ? beginning() : mode === 'life' ? lifeMap.endPoint() : view().world(data().projection.today);
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

  function setState({ grow, state = 'overview', fxModeValue, calloutMode }) {
    stack.dataset.grow = grow;
    stack.dataset.state = state;
    fxMode = fxModeValue;
    drawFx();
    renderCallouts(calloutMode);
    if (fxModeValue === 'cover') startPulse('cover');
    else if (fxModeValue === 'life' && lifeFrame.resting && lifeMap.mode !== 'whatif') startPulse('life');
    else stopPulse();
  }

  const FINAL = {
    cover: { grow: 'hidden', fxModeValue: 'cover', calloutMode: 'none' },
    // The home page: the field, then a traveller to Today.
    many: { grow: 'shown', fxModeValue: 'none', calloutMode: 'none' },
    travel: { grow: 'shown', state: 'today', fxModeValue: 'none', calloutMode: 'none' },
    // Lesson 1: the life, "Choices add up", and the same life in the takeaways.
    life: { grow: 'shown', fxModeValue: 'life', calloutMode: 'none' },
    adds: { grow: 'shown', fxModeValue: 'life', calloutMode: 'adds' },
    takeaways: { grow: 'shown', fxModeValue: 'life', calloutMode: 'none' },
  };
  const onLife = beatId => Boolean(lifeMap) && (beatId === 'life' || beatId === 'adds' || beatId === 'takeaways');

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
    paintBase(!lifeMap && beatId === 'travel');
    // "Choices add up" and the takeaways show the whole life; gray choices' labels step back.
    if (lifeMap && (beatId === 'adds' || beatId === 'takeaways')) { lifeFrame = finalFrame(); lifeMap.setMode('adds'); }
    if (lifeMap && beatId === 'cover') setField('shown');
    if (!animate || failed) {
      if (onLife(beatId)) setField('hidden');
      setState(FINAL[beatId]);
      return;
    }
    if (from === 'cover' && (beatId === 'many' || beatId === 'life')) {
      if (beatId === 'life') {
        lifeFrame = { ...finalFrame(), index: -1, resting: false };
        lifeMap.setMode('story');
        setField('shown');
      }
      setState({ ...FINAL.cover, fxModeValue: 'none' });
      stack.dataset.grow = 'hidden';
      void stack.offsetWidth;
      stack.dataset.grow = 'growing';
      await wait(2300, token);
      if (!token?.cancelled && current === beatId) { stack.dataset.grow = 'shown'; if (beatId === 'life') setState(FINAL.life); }
      return;
    }
    if (beatId === 'travel' && (from === 'many' || from === 'cover')) {
      setState({ ...FINAL.many });
      fxMode = 'travel';
      const run = tween({ duration: 2600, easing: ease.inOut, update: value => { travel = value; drawFx(); } });
      token?.onCancel(() => run.cancel());
      const completed = await run.promise;
      if (!completed || token?.cancelled || current !== 'travel') return;
      stack.dataset.state = 'today';
      await wait(650, token);
      if (!token?.cancelled && current === 'travel') { fxMode = 'none'; drawFx(); }
      return;
    }
    if (onLife(beatId)) setField('hidden');
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

  /** The hike's arrival: the gray lives and the chips go, then the route. */
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
    paintBase(!lifeMap && current === 'travel');
    lifeMap?.resize();
    if (fxMode === 'travel') { drawFx(); return; }
    setState(FINAL[current] ?? FINAL.cover);
  }
  // Repaint on a quiet moment, not the next frame: until then the canvases
  // stretch their last bitmap to the new box (the map is fitted to width and
  // height separately, so that is nearly the same picture). A layout change
  // during an animation then doesn't stall it with a full repaint.
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
    settle() { size = null; paintBase(false); lifeMap?.resize(); drawFx(); },
    hide() { stopPulse(); },
    life: lifeMap,
    lifeMode(mode) {
      lifeMap.setMode(mode);
      if (mode === 'whatif') stopPulse();
      else if (fxMode === 'life' && lifeFrame.resting) startPulse('life');
    },
    /** After a picked life has grown: the traveller rests at its end. */
    restAtEnd() { if (fxMode === 'life') startPulse('life'); },
    lifePoints: () => lifeMap?.points() ?? [],
    failed,
  };
}
