import { comparisonRoutes, makeMap, motionFrame, OVERVIEW, pointOnRoute } from './model.js';
import {
  buildPathPresentation,
  canvasBitmap,
  fadeColors,
} from '../src/engine/path-presentation.js';

const blendBox = (from, to, amount) => Object.fromEntries(
  Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * amount]),
);
const clamp = value => Math.max(0, Math.min(1, value));

const LABEL_EDGE = 6;
const LABEL_GAP = 6;

const overlaps = (first, second, gap = 0) => !(
  first.x + first.width + gap <= second.x
  || second.x + second.width + gap <= first.x
  || first.y + first.height + gap <= second.y
  || second.y + second.height + gap <= first.y
);

function labelCandidates(endpoint, size, bounds) {
  // A placement must match the measured DOM box; never pretend its text shrank.
  const { width, height } = size;
  if (width > bounds.width - LABEL_EDGE * 2 || height > bounds.height - LABEL_EDGE * 2) return [];
  const maxX = bounds.width - LABEL_EDGE - width;
  const maxY = bounds.height - LABEL_EDGE - height;
  const candidates = [];
  const add = (x, y) => {
    const candidate = { x, y, width, height };
    if (x < LABEL_EDGE || y < LABEL_EDGE || x > maxX || y > maxY) return;
    if (endpoint.x >= x - 4 && endpoint.x <= x + width + 4
      && endpoint.y >= y - 4 && endpoint.y <= y + height + 4) return;
    if (!candidates.some(item => Math.abs(item.x - x) < 0.1 && Math.abs(item.y - y) < 0.1)) candidates.push(candidate);
  };

  for (const gap of [12, 30, 50]) {
    add(endpoint.x + gap, endpoint.y - height / 2);
    add(endpoint.x - gap - width, endpoint.y - height / 2);
    add(endpoint.x - width / 2, endpoint.y + gap);
    add(endpoint.x - width / 2, endpoint.y - gap - height);
    add(endpoint.x + gap, endpoint.y + gap);
    add(endpoint.x + gap, endpoint.y - gap - height);
    add(endpoint.x - gap - width, endpoint.y + gap);
    add(endpoint.x - gap - width, endpoint.y - gap - height);
  }

  const gridX = [0, 0.25, 0.5, 0.75, 1].map(amount => LABEL_EDGE + (maxX - LABEL_EDGE) * amount);
  const gridY = [0, 1 / 6, 1 / 3, 0.5, 2 / 3, 5 / 6, 1]
    .map(amount => LABEL_EDGE + (maxY - LABEL_EDGE) * amount);
  for (const y of gridY) for (const x of gridX) add(x, y);

  return candidates.sort((first, second) => {
    const distance = item => Math.hypot(
      item.x + item.width / 2 - endpoint.x,
      item.y + item.height / 2 - endpoint.y,
    );
    return distance(first) - distance(second);
  });
}

function leaderToLabel(endpoint, label) {
  const center = { x: label.x + label.width / 2, y: label.y + label.height / 2 };
  const dx = center.x - endpoint.x;
  const dy = center.y - endpoint.y;
  const edgeScale = 1 / Math.max(
    Math.abs(dx) / (label.width / 2),
    Math.abs(dy) / (label.height / 2),
  );
  const end = {
    x: center.x - dx * edgeScale,
    y: center.y - dy * edgeScale,
  };
  const leaderX = end.x - endpoint.x;
  const leaderY = end.y - endpoint.y;
  return {
    end,
    length: Math.hypot(leaderX, leaderY),
    angle: Math.atan2(leaderY, leaderX) * 180 / Math.PI,
  };
}

export function layoutOutcomeLabels(endpoints, obstacles, bounds, labelSizes) {
  const candidates = endpoints.map((endpoint, index) => labelCandidates(
    endpoint,
    labelSizes[index] ?? { width: 148, height: 42 },
    bounds,
  ).filter(label => obstacles.every(obstacle => !overlaps(label, obstacle, LABEL_GAP))));
  const chosen = Array(endpoints.length);

  function solve(remaining, gap) {
    if (!remaining.length) return true;
    const ranked = remaining.map(index => ({
      index,
      available: candidates[index].filter(label => chosen.every(other => !other || !overlaps(label, other, gap))),
    })).sort((first, second) => first.available.length - second.available.length);
    const next = ranked[0];
    for (const label of next.available) {
      chosen[next.index] = label;
      if (solve(remaining.filter(index => index !== next.index), gap)) return true;
      chosen[next.index] = undefined;
    }
    return false;
  }

  const remaining = endpoints.map((_, index) => index);
  if (!solve(remaining, LABEL_GAP) && !solve(remaining, 0)) {
    // Keep only collision-free callouts when the full set cannot fit. The same
    // named outcomes remain available in the semantic list below the map.
    for (const index of remaining) {
      chosen[index] = candidates[index].find(label => chosen.every(other => !other || !overlaps(label, other, LABEL_GAP))) ?? null;
    }
  }

  return endpoints.map((endpoint, index) => {
    const label = chosen[index] ?? null;
    return {
      endpoint: { ...endpoint },
      label,
      leader: label ? leaderToLabel(endpoint, label) : null,
    };
  });
}

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

export function createMapView({
  canvas,
  overlay,
  onInspect,
  onPreview,
  lessMotion,
  getScenario = () => ({}),
  getPresentation = () => ({}),
}) {
  let context;
  try {
    context = canvas?.getContext?.('2d');
  } catch {
    context = null;
  }
  if (!context) return { failed: true, show() {}, cancel() {} };

  let animation = 0;
  let currentState = null;
  let currentTransform = null;
  let previewAge = null;
  const targets = new Map();
  const markerLayer = document.createElement('div');
  markerLayer.className = 'map-marker-layer';
  overlay.append(markerLayer);
  const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const cancel = () => { cancelAnimationFrame(animation); animation = 0; };
  const viewportFor = (state, scenario) => {
    if (state.overview || !state.selected) return OVERVIEW;
    return state.inspect !== null
      ? makeMap(state.inspect, scenario).focus
      : makeMap(state.age, scenario).focus;
  };

  function resize() {
    cancel();
    const rect = canvas.getBoundingClientRect();
    const bitmap = canvasBitmap(rect, window.devicePixelRatio);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
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

  function route(points, stroke, width, dash = [], progress = 1, fade = null) {
    const visible = partialPoints(points, progress);
    if (visible.length < 2) return;
    context.beginPath();
    visible.forEach((point, index) => {
      const target = currentTransform.world(point);
      if (index === 0) context.moveTo(target.x, target.y);
      else context.lineTo(target.x, target.y);
    });
    if (fade) {
      const start = currentTransform.world({ x: fade.startX, y: 0 }).x;
      const end = currentTransform.world({ x: fade.endX, y: 0 }).x;
      const gradient = context.createLinearGradient(start, 0, end, 0);
      const colors = fadeColors(stroke, fade.floor);
      gradient.addColorStop(0, colors.full);
      gradient.addColorStop(1, fade.floor > 0 ? colors.floor : colors.clear);
      context.strokeStyle = gradient;
    } else {
      context.strokeStyle = stroke;
    }
    context.lineWidth = width;
    context.setLineDash(dash);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    context.setLineDash([]);
  }

  function ensureTargets(map) {
    if (targets.size) return;
    for (const anchor of map.anchors) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-target';
      button.dataset.age = anchor.age;
      button.addEventListener('click', () => onInspect(anchor.age));
      button.addEventListener('pointerenter', () => onPreview(anchor.age));
      button.addEventListener('pointerleave', () => {
        if (document.activeElement !== button) onPreview(null);
      });
      button.addEventListener('focus', () => onPreview(anchor.age));
      button.addEventListener('blur', () => requestAnimationFrame(() => {
        if (!document.activeElement?.classList.contains('map-target')) onPreview(null);
      }));
      overlay.append(button);
      targets.set(anchor.age, button);
    }
  }

  function renderOverlay(map, state, travel, scenario) {
    ensureTargets(map);
    const active = state.inspect ?? state.age;
    for (const anchor of map.anchors) {
      const position = currentTransform.world(anchor);
      const button = targets.get(anchor.age);
      const returning = state.selected && state.inspect !== null && anchor.age === state.age;
      const reviewing = state.selected && anchor.age <= state.age && anchor.age !== active;
      button.setAttribute('aria-label', returning ? `Return to today, age ${anchor.age}` : `${reviewing ? 'Review' : 'Explore'} age ${anchor.age}`);
      button.setAttribute('aria-pressed', String(state.selected && anchor.age === active));
      button.dataset.selected = String(state.selected);
      button.dataset.pending = String(anchor.age === state.age && travel < 1);
      button.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
      const offscreen = position.x < 22 || position.y < 22 || position.x > currentTransform.rect.width - 22 || position.y > currentTransform.rect.height - 22;
      const allowed = !state.selected || anchor.age <= state.age || (state.age === 8 && anchor.age === 12);
      button.hidden = !allowed || offscreen;
    }
    const beginning = currentTransform.world(map.spine[0]);
    const birthLabel = document.createElement('span');
    birthLabel.className = 'beginning-marker';
    birthLabel.textContent = 'A beginning';
    birthLabel.style.transform = `translate(${beginning.x}px, ${beginning.y - 22}px) translate(0, -100%)`;
    const labels = [birthLabel];
    if (state.selected) {
      const today = currentTransform.world(map.anchor);
      const label = document.createElement('span');
      label.className = 'today-marker';
      label.textContent = `Today · ${state.age}`;
      label.style.transform = `translate(${today.x}px, ${currentTransform.rect.height - 2}px) translate(-50%, -100%)`;
      labels.push(label);
    }
    if (state.inspect === 12) {
      const routes = comparisonRoutes(state.comparison, scenario);
      const endpoints = routes.map(item => currentTransform.world(item.points.at(-1)));
      const callouts = routes.map(item => {
        const leader = document.createElement('span');
        leader.className = 'route-leader';
        leader.dataset.status = item.status;
        leader.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'route-label';
        label.dataset.outcome = item.id;
        label.dataset.status = item.status;
        label.textContent = item.label;
        label.setAttribute('aria-hidden', 'true');
        return { leader, label };
      });
      labels.push(...callouts.flatMap(({ leader, label }) => [leader, label]));
      markerLayer.replaceChildren(...labels);

      const canvasRect = canvas.getBoundingClientRect();
      const localRect = node => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.left - canvasRect.left,
          y: rect.top - canvasRect.top,
          width: rect.width,
          height: rect.height,
        };
      };
      const obstacles = [...targets.values()].filter(button => !button.hidden).map(localRect);
      const todayLabel = markerLayer.querySelector('.today-marker');
      if (todayLabel) obstacles.push(localRect(todayLabel));
      const sizes = callouts.map(({ label }) => {
        const rect = label.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      const placements = layoutOutcomeLabels(endpoints, obstacles, currentTransform.rect, sizes);
      callouts.forEach(({ leader, label }, index) => {
        const placement = placements[index];
        if (!placement.label) {
          leader.hidden = true;
          label.hidden = true;
          return;
        }
        const centerX = placement.label.x + placement.label.width / 2;
        const centerY = placement.label.y + placement.label.height / 2;
        leader.style.width = `${placement.leader.length}px`;
        leader.style.transform = `translate(${placement.endpoint.x}px, ${placement.endpoint.y}px) rotate(${placement.leader.angle}deg)`;
        label.style.transform = `translate(${centerX}px, ${centerY}px) translate(-50%, -50%)`;
      });
      return;
    }
    markerLayer.replaceChildren(...labels);
  }

  function paint(state, travel, zoom, comparisonProgress) {
    const scenario = getScenario() ?? {};
    const map = makeMap(state.age, scenario);
    const focus = viewportFor(state, scenario);
    const viewport = state.selected && !state.overview && state.inspect !== 12
      ? blendBox(OVERVIEW, focus, zoom)
      : focus;
    currentTransform = transformFor(viewport);
    context.clearRect(0, 0, currentTransform.rect.width, currentTransform.rect.height);

    const future = token('--color-wisdom-route-future');
    const untaken = token('--color-wisdom-route-untaken');
    const active = token('--color-wisdom-route-active');
    const divider = token('--color-wisdom-today');
    // Draw each edge once. A graph edge carries its state from ancestry, not
    // from its birth date or from a duplicated root-to-leaf polyline.
    const segments = state.selected ? map.segments : map.network.edges;
    const presentation = buildPathPresentation(map.network, segments, getPresentation());
    const fan = state.selected ? map.fan : null;
    if (fan) {
      // The accepted drawing: gray ends at Today, dissolving into the line,
      // and the futures are the fan. Gray goes down first, alone, so the
      // dissolve mask touches nothing else.
      const todayX = currentTransform.world(map.anchor).x;
      context.save();
      context.beginPath();
      context.rect(0, 0, todayX, currentTransform.rect.height);
      context.clip();
      for (const path of presentation.paths) {
        if (path.state !== 'untaken') continue;
        route(path.points, untaken, presentation.settings.lineWidth, [], 1, path.fade);
      }
      context.globalCompositeOperation = 'destination-in';
      const dissolve = context.createLinearGradient(todayX - 40 * currentTransform.scale, 0, todayX, 0);
      dissolve.addColorStop(0, '#000');
      dissolve.addColorStop(1, '#0000');
      context.fillStyle = dissolve;
      context.fillRect(0, 0, todayX, currentTransform.rect.height);
      context.restore();
      for (const edge of fan.edges) route(edge.points, future, presentation.settings.lineWidth);
    } else {
      for (const path of presentation.paths) {
        if (state.selected && path.state === 'completed') continue;
        route(
          path.points,
          state.selected && path.state === 'untaken' ? untaken : future,
          presentation.settings.lineWidth,
          [],
          1,
          path.fade,
        );
      }
    }
    if (state.selected) {
      if (travel < 1) {
        const traveled = partialPoints(map.past, travel);
        route(
          [traveled.at(-1), ...map.past.slice(traveled.length - 1)],
          future,
          presentation.settings.lineWidth,
        );
      }
      route(map.past, active, presentation.settings.historyLineWidth, [], travel);
    }
    // Alpha-only boundary masks soften the outer field, never shade individual paths.
    const { width, height } = currentTransform.rect;
    context.save();
    context.globalCompositeOperation = 'destination-in';
    const horizontal = context.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, '#000');
    horizontal.addColorStop(0.79, '#000');
    horizontal.addColorStop(0.97, '#0000');
    horizontal.addColorStop(1, '#0000');
    context.fillStyle = horizontal;
    context.fillRect(0, 0, width, height);
    const vertical = context.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0, '#0000');
    vertical.addColorStop(0.08, '#000');
    vertical.addColorStop(0.87, '#000');
    vertical.addColorStop(0.97, '#0000');
    vertical.addColorStop(1, '#0000');
    context.fillStyle = vertical;
    context.fillRect(0, 0, width, height);
    context.restore();

    if (state.inspect === 12) {
      const colors = { available: active, 'needs-work': untaken, missed: token('--color-wisdom-route-missed') };
      for (const item of comparisonRoutes(state.comparison, scenario)) route(item.points, colors[item.status], 3.5, item.status === 'needs-work' ? [3, 5] : item.status === 'missed' ? [7, 4] : [], comparisonProgress);
    }

    const birth = currentTransform.world(map.spine[0]);
    context.beginPath();
    context.fillStyle = active;
    context.arc(birth.x, birth.y, 4, 0, Math.PI * 2);
    context.fill();
    if (state.selected) {
      const guide = currentTransform.world(map.anchor);
      context.strokeStyle = divider;
      context.lineWidth = 1.25;
      context.setLineDash([3, 5]);
      context.beginPath();
      context.moveTo(guide.x, 18);
      context.lineTo(guide.x, currentTransform.rect.height - 36);
      context.stroke();
      context.setLineDash([]);
      const traveler = currentTransform.world(pointOnRoute(map.past, travel));
      context.beginPath();
      context.fillStyle = active;
      context.arc(traveler.x, traveler.y, 6, 0, Math.PI * 2);
      context.fill();
    }
    renderOverlay(map, state, travel, scenario);
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
    const liveRect = canvas.getBoundingClientRect();
    const world = currentTransform.source({ x: event.clientX - liveRect.left, y: event.clientY - liveRect.top });
    const map = makeMap(currentState.age, getScenario() ?? {});
    const distance = map.past.slice(1).reduce((nearest, point, index) => Math.min(nearest, nearestDistance(world, map.past[index], point)), Infinity);
    if (distance > 14 / currentTransform.scale) {
      if (previewAge !== null) { previewAge = null; onPreview(null); }
      return;
    }
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
