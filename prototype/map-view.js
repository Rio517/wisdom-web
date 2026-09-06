import { comparisonRoutes, makeMap, motionFrame, OVERVIEW, pointOnRoute } from './model.js';

const blendBox = (from, to, amount) => Object.fromEntries(
  Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * amount]),
);
const clamp = value => Math.max(0, Math.min(1, value));

function nearestDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const progress = length ? clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / length) : 0;
  return Math.hypot(point.x - (start.x + dx * progress), point.y - (start.y + dy * progress));
}

function partialPoints(points, progress) {
  if (progress >= 1) return points;
  if (progress <= 0) return points.slice(0, 1);
  const total = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(
    point.x - points[index].x, point.y - points[index].y,
  ), 0);
  const target = total * progress;
  const partial = [points[0]];
  let travelled = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    if (travelled + length >= target) return [...partial, pointOnRoute([points[index - 1], points[index]], (target - travelled) / length)];
    partial.push(points[index]);
    travelled += length;
  }
  return partial;
}

export function createMapView({ canvas, overlay, onInspect, onPreview, lessMotion }) {
  const context = canvas?.getContext?.('2d');
  if (!context) return { show() {}, cancel() {} };

  let animation = 0;
  let currentState = null;
  let currentTransform = null;
  let previewAge = null;
  const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const cancel = () => { cancelAnimationFrame(animation); animation = 0; };
  const viewportFor = state => {
    if (state.overview || !state.selected) return OVERVIEW;
    return state.inspect === 12 ? makeMap(12).focus : makeMap(state.age).focus;
  };

  function resize() {
    cancel();
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (currentState) paint(currentState, 1, 1, 1);
  }

  function transformFor(viewport) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / viewport.width, rect.height / viewport.height);
    return {
      scale,
      x: (rect.width - viewport.width * scale) / 2 - viewport.x * scale,
      y: (rect.height - viewport.height * scale) / 2 - viewport.y * scale,
      rect,
      world(point) { return { x: point.x * scale + this.x, y: point.y * scale + this.y }; },
      source(point) { return { x: (point.x - this.x) / this.scale, y: (point.y - this.y) / this.scale }; },
    };
  }

  function route(points, stroke, width, dash = [], progress = 1) {
    const visible = partialPoints(points, progress);
    if (visible.length < 2) return;
    context.beginPath();
    visible.forEach((point, index) => {
      const target = currentTransform.world(point);
      if (index === 0) context.moveTo(target.x, target.y);
      else context.lineTo(target.x, target.y);
    });
    context.strokeStyle = stroke;
    context.lineWidth = width;
    context.setLineDash(dash);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    context.setLineDash([]);
  }

  function renderOverlay(map, state) {
    const active = state.inspect ?? state.age;
    const fragment = document.createDocumentFragment();
    for (const anchor of map.anchors) {
      const position = currentTransform.world(anchor);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-target';
      button.dataset.age = anchor.age;
      const reviewing = state.selected && anchor.age <= state.age && anchor.age !== active;
      button.setAttribute('aria-label', `${reviewing ? 'Review' : 'Explore'} age ${anchor.age}`);
      button.setAttribute('aria-pressed', String(anchor.age === active));
      button.textContent = anchor.age === active ? `Age ${anchor.age}` : String(anchor.age);
      button.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
      const offscreen = position.x < 22 || position.y < 22 || position.x > currentTransform.rect.width - 22 || position.y > currentTransform.rect.height - 22;
      const allowed = !state.selected || anchor.age <= state.age || (state.age === 8 && anchor.age === 12);
      button.hidden = !allowed || offscreen;
      button.addEventListener('click', () => onInspect(anchor.age));
      fragment.append(button);
    }
    overlay.replaceChildren(fragment);
  }

  function paint(state, travel, zoom, comparisonProgress) {
    const map = makeMap(state.age);
    const focus = viewportFor(state);
    const viewport = state.selected && !state.overview && state.inspect !== 12
      ? blendBox(OVERVIEW, focus, zoom)
      : focus;
    currentTransform = transformFor(viewport);
    context.clearRect(0, 0, currentTransform.rect.width, currentTransform.rect.height);

    const future = token('--color-wisdom-route-future');
    const untaken = token('--color-wisdom-route-untaken');
    const active = token('--color-wisdom-route-active');
    const divider = token('--color-wisdom-rule');
    for (const branch of map.branches) route(branch.points, state.selected && branch.state === 'untaken' ? untaken : future, 1.35, state.selected && branch.state === 'untaken' ? [2, 5] : []);
    route(map.future, future, 2);
    if (state.selected) {
      route(map.past, future, 2);
      route(map.past, active, 3.2, [], travel);
      const guide = currentTransform.world(map.anchor);
      context.strokeStyle = divider;
      context.lineWidth = 1.5;
      context.setLineDash([2, 6]);
      context.beginPath();
      context.moveTo(guide.x, 18);
      context.lineTo(guide.x, currentTransform.rect.height - 18);
      context.stroke();
      context.setLineDash([]);
      const traveler = currentTransform.world(pointOnRoute(map.past, travel));
      context.beginPath();
      context.fillStyle = active;
      context.arc(traveler.x, traveler.y, 6, 0, Math.PI * 2);
      context.fill();
    }
    if (state.inspect === 12) {
      const colors = { available: active, 'needs-work': untaken, missed: token('--color-wisdom-route-missed') };
      for (const item of comparisonRoutes(state.comparison)) route(item.points, colors[item.status], 3, item.status === 'needs-work' ? [3, 5] : item.status === 'missed' ? [7, 4] : [], comparisonProgress);
    }
    renderOverlay(map, state);
    canvas.dataset.motion = !state.selected ? 'ready' : comparisonProgress < 1 ? 'comparing' : travel < 1 ? 'traveling' : zoom < 1 ? 'focusing' : 'settled';
  }

  function show(state, animate = false) {
    cancel();
    currentState = state;
    if (!animate || lessMotion()) { paint(state, 1, 1, 1); return; }
    const started = performance.now();
    const tick = now => {
      const elapsed = now - started;
      const frame = state.inspect === 12
        ? { travel: 1, zoom: 1, comparison: clamp(elapsed / 250), settled: elapsed >= 250 }
        : { ...motionFrame(elapsed), comparison: 1 };
      paint(state, frame.travel, frame.zoom, frame.comparison);
      if (!frame.settled) animation = requestAnimationFrame(tick);
      else animation = 0;
    };
    tick(started);
  }

  canvas.addEventListener('pointermove', event => {
    if (!currentState || !currentTransform || !currentState.selected) return;
    const world = currentTransform.source({ x: event.clientX - currentTransform.rect.left, y: event.clientY - currentTransform.rect.top });
    const map = makeMap(currentState.age);
    const distance = map.past.slice(1).reduce((nearest, point, index) => Math.min(nearest, nearestDistance(world, map.past[index], point)), Infinity);
    if (distance > 14 / currentTransform.scale) return;
    const age = map.anchors.filter(anchor => anchor.age <= currentState.age).reduce((nearest, anchor) => (
      Math.abs(anchor.x - world.x) < Math.abs(nearest.x - world.x) ? anchor : nearest
    ), map.anchors[0]).age;
    if (previewAge !== age) { previewAge = age; onPreview(age); }
  });
  canvas.addEventListener('pointerleave', () => { if (previewAge !== null) { previewAge = null; onPreview(null); } });
  new ResizeObserver(resize).observe(canvas);
  resize();
  return { show, cancel };
}
