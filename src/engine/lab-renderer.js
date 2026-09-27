import { buildPathPresentation, canvasBitmap, fadeColors } from './path-presentation.js';
import { LAB_MAX_AGE, ageForTimelinePosition, timelinePositionForAge } from './lab-settings.js';

// The bottom keeps the Beginning and Today labels clear, no more.
const PADDING = Object.freeze({ left: 30, right: 30, top: 10, bottom: 28 });
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function safeBounds(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y)
    && Number.isFinite(value.width) && value.width > 80
    && Number.isFinite(value.height) && value.height > 0
    ? value
    : { x: 0, y: 0, width: 1260, height: 740 };
}

export function fitOverview(inputBounds, rect, padding = PADDING, maxAge = null) {
  const bounds = safeBounds(inputBounds);
  const width = Math.max(1, Number.isFinite(rect?.width) ? rect.width : 1);
  const height = Math.max(1, Number.isFinite(rect?.height) ? rect.height : 1);
  const availableWidth = Math.max(1, width - padding.left - padding.right);
  const availableHeight = Math.max(1, height - padding.top - padding.bottom);
  const ageLens = maxAge === LAB_MAX_AGE;
  const scale = ageLens ? availableWidth / bounds.width
    : Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
  const scaleY = ageLens ? availableHeight / bounds.height : scale;
  const x = padding.left + (availableWidth - bounds.width * scale) / 2 - bounds.x * scale;
  const y = padding.top + (availableHeight - bounds.height * scaleY) / 2 - bounds.y * scaleY;
  const startX = bounds.x + 40;
  const span = bounds.width - 80;
  const lensX = sourceX => {
    const fraction = (sourceX - startX) / span;
    return !ageLens || fraction < 0 || fraction > 1 ? sourceX
      : startX + timelinePositionForAge(fraction * maxAge) * span;
  };
  const sourceX = displayX => {
    const fraction = (displayX - startX) / span;
    return !ageLens || fraction < 0 || fraction > 1 ? displayX
      : startX + ageForTimelinePosition(fraction) / maxAge * span;
  };
  return {
    scale, x, y,
    world(point) { return { x: lensX(point.x) * scale + x, y: point.y * scaleY + y }; },
    source(point) { return { x: sourceX((point.x - x) / scale), y: (point.y - y) / scaleY }; },
  };
}

export function ageForClientX(clientX, rect, inputBounds, maxAge) {
  const bounds = safeBounds(inputBounds);
  const view = fitOverview(bounds, rect, PADDING, maxAge);
  const localX = (Number.isFinite(clientX) ? clientX : rect?.left ?? 0) - (rect?.left ?? 0);
  const worldX = view.source({ x: localX, y: 0 }).x;
  const age = (worldX - bounds.x - 40) / (bounds.width - 80) * maxAge;
  const limit = Number.isFinite(maxAge) ? maxAge : 100;
  const bounded = clamp(Number.isFinite(age) ? age : 0, 0, limit);
  if (bounded < 1e-9) return 0;
  if (limit - bounded < 1e-9) return limit;
  return bounded;
}

function settingsFor(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    ...source,
    lineWidth: Number.isFinite(source.lineWidth) && source.lineWidth > 0 ? source.lineWidth : 2.2,
    fadeDistance: Number.isFinite(source.fadeDistance) && source.fadeDistance > 0
      ? source.fadeDistance : 240,
    fadeFloor: clamp(Number.isFinite(source.fadeFloor) ? source.fadeFloor : 0, 0, 1),
    todayFade: clamp(Number.isFinite(source.todayFade) ? source.todayFade : 0, 0, 300),
    grayOpacity: clamp(Number.isFinite(source.grayOpacity) ? source.grayOpacity : 0.58, 0, 1),
    edgeFade: clamp(Number.isFinite(source.edgeFade) ? source.edgeFade : 0.16, 0, 0.3),
  };
}

function pointAtAge(points, age) {
  if (!Array.isArray(points) || !points.length) return null;
  if (age <= points[0].age) return { ...points[0] };
  for (let index = 1; index < points.length; index += 1) {
    const end = points[index];
    if (age > end.age) continue;
    const start = points[index - 1];
    const amount = end.age === start.age ? 0 : (age - start.age) / (end.age - start.age);
    return {
      age,
      x: start.x + (end.x - start.x) * amount,
      y: start.y + (end.y - start.y) * amount,
    };
  }
  return { ...points.at(-1) };
}

function inertRenderer() {
  return { failed: true, paint() {}, ageAt() { return 0; } };
}

function traceCurvedRoute(context, points) {
  const slopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return point.x > previous.x ? (point.y - previous.y) / (point.x - previous.x) : 0;
  });
  const tangents = points.map((point, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const before = slopes[index - 1];
    const after = slopes[index];
    // A shared tangent rounds each join. The harmonic mean stays bounded
    // by twice either neighboring slope, keeping controls inside the segment.
    return before * after > 0 ? 2 * before * after / (before + after) : 0;
  });
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const handle = (end.x - start.x) / 3;
    if (handle <= 0) {
      context.lineTo(end.x, end.y);
      continue;
    }
    context.bezierCurveTo(
      start.x + handle, start.y + tangents[index - 1] * handle,
      end.x - handle, end.y - tangents[index] * handle,
      end.x, end.y,
    );
  }
}

export function createLabRenderer(canvas) {
  let context;
  try {
    context = canvas?.getContext?.('2d');
  } catch {
    context = null;
  }
  if (!context) return inertRenderer();

  let lastNetwork = null;
  let currentView = null;

  /**
   * A flat alpha profile along x, in source units: `stops` are {x, alpha}
   * pairs in increasing x, full colour before the first and the last alpha
   * after the last. Drawn as one linear gradient, so a route is still one
   * stroke.
   */
  function route(points, color, width, { alpha = 1, dash = [], fade = null } = {}) {
    if (!Array.isArray(points) || points.length < 2) return;
    context.save();
    context.beginPath();
    traceCurvedRoute(context, points.map(point => currentView.world(point)));
    if (fade?.stops?.length >= 2) {
      const startX = currentView.world({ x: fade.stops[0].x, y: 0 }).x;
      const endX = currentView.world({ x: fade.stops.at(-1).x, y: 0 }).x;
      const gradient = context.createLinearGradient(startX, 0, endX, 0);
      const span = Math.max(1e-6, endX - startX);
      const colors = fadeColors(color);
      for (const stop of fade.stops) {
        const at = clamp((currentView.world({ x: stop.x, y: 0 }).x - startX) / span, 0, 1);
        gradient.addColorStop(at, stop.alpha >= 1 ? colors.full
          : stop.alpha <= 0 ? colors.clear : fadeColors(color, stop.alpha).floor);
      }
      context.strokeStyle = gradient;
    } else {
      context.strokeStyle = color;
    }
    context.globalAlpha = alpha;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash(dash);
    context.stroke();
    context.restore();
  }

  /**
   * Where a gray route is visible before Today. Two things act on it and the
   * fainter wins: after its missed fork it fades over the fade distance down
   * to the faded floor (an old alternative and its later forks stay faintly
   * present rather than vanishing long before the line), and everything
   * dissolves into Today over the Today-dissolve distance. Gray is clipped at
   * Today as well, so the profile always ends at zero there.
   */
  function grayProfile(forkFade, todayX, settings) {
    const dissolve = settings.todayFade > 0
      ? settings.todayFade
      : Math.min(48, Math.max(12, settings.fadeDistance * 0.18));
    const dissolveStart = todayX - dissolve;
    const fromFork = x => {
      if (!forkFade || x <= forkFade.startX) return 1;
      if (x >= forkFade.endX) return forkFade.floor;
      return 1 + (forkFade.floor - 1) * (x - forkFade.startX) / (forkFade.endX - forkFade.startX);
    };
    const towardToday = x => (x <= dissolveStart ? 1 : x >= todayX ? 0 : (todayX - x) / dissolve);
    const breakpoints = [...new Set([
      forkFade?.startX, forkFade?.endX, dissolveStart, todayX,
    ].filter(x => Number.isFinite(x) && x <= todayX))].sort((a, b) => a - b);
    const stops = breakpoints.map(x => ({ x, alpha: Math.min(fromFork(x), towardToday(x)) }));
    // Once the profile reaches zero it stays there; nothing after adds a stop.
    const firstClear = stops.findIndex(stop => stop.alpha <= 0);
    const trimmed = firstClear >= 0 ? stops.slice(0, firstClear + 1) : stops;
    if (trimmed.length < 2) {
      return { stops: [{ x: dissolveStart, alpha: 1 }, { x: todayX, alpha: 0 }] };
    }
    return { stops: trimmed };
  }

  function boundaryMask(rect, bounds, amount) {
    if (amount <= 0) return;
    const fieldLeft = currentView.world({ x: bounds.x + 40, y: bounds.y }).x;
    const fieldRight = currentView.world({ x: bounds.x + bounds.width - 40, y: bounds.y }).x;
    const fieldTop = currentView.world({ x: bounds.x, y: bounds.y }).y;
    const fieldBottom = currentView.world({ x: bounds.x, y: bounds.y + bounds.height }).y;
    context.save();
    context.globalCompositeOperation = 'destination-in';
    const horizontal = context.createLinearGradient(
      fieldRight - (fieldRight - fieldLeft) * amount,
      0,
      fieldRight,
      0,
    );
    horizontal.addColorStop(0, '#000');
    horizontal.addColorStop(1, '#0000');
    context.fillStyle = horizontal;
    context.fillRect(0, 0, rect.width, rect.height);
    const vertical = context.createLinearGradient(0, fieldTop, 0, fieldBottom);
    vertical.addColorStop(0, '#0000');
    vertical.addColorStop(amount, '#000');
    vertical.addColorStop(1 - amount, '#000');
    vertical.addColorStop(1, '#0000');
    context.fillStyle = vertical;
    context.fillRect(0, 0, rect.width, rect.height);
    context.restore();
  }

  function dot(point, radius, color = '#285442') {
    if (!point) return;
    const target = currentView.world(point);
    context.save();
    context.beginPath();
    context.fillStyle = color;
    context.arc(target.x, target.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function label(text, x, y, align = 'left') {
    context.save();
    context.fillStyle = '#596860';
    context.font = '400 14px "Avenir Next", AvenirNext, "Segoe UI", sans-serif';
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(text, x, y);
    context.restore();
  }

  function paint(network, projection, inputSettings = {}, selected = false, future = null) {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = canvas.ownerDocument?.defaultView?.devicePixelRatio
      ?? globalThis.window?.devicePixelRatio ?? 1;
    const bitmap = canvasBitmap(rect, pixelRatio);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const bounds = safeBounds(network?.bounds);
    currentView = fitOverview(bounds, rect, PADDING, network?.maxAge);
    lastNetwork = { bounds, maxAge: network?.maxAge ?? 100 };
    const settings = settingsFor(inputSettings);
    const todayAnchor = projection?.routeExited ? {
      x: bounds.x + 40 + (bounds.width - 80) * projection.age / network.maxAge,
      y: bounds.y + bounds.height / 2,
    } : projection?.today;

    if (selected) {
      const presentation = buildPathPresentation(
        network,
        projection?.segments,
        settings,
      );
      const todayX = todayAnchor.x;
      const todayCanvasX = currentView.world(todayAnchor).x;
      context.save();
      context.beginPath();
      context.rect(0, 0, todayCanvasX, rect.height);
      context.clip();
      for (const path of presentation.paths.filter(item => item.state === 'untaken')) {
        route(path.points, '#bcc6c0', settings.lineWidth, {
          alpha: settings.grayOpacity,
          fade: grayProfile(path.fade, todayX, settings),
        });
      }
      context.restore();
      const possiblePaths = Array.isArray(future?.edges)
        ? future.edges
        : presentation.paths.filter(item => item.state === 'possible');
      for (const path of possiblePaths) {
        route(path.points, '#8daa91', settings.lineWidth);
      }
    } else {
      for (const edge of network?.edges ?? []) route(edge.points, '#8daa91', settings.lineWidth);
    }

    boundaryMask(rect, bounds, settings.edgeFade);

    if (selected) {
      route(
        projection?.past,
        '#285442',
        Math.max(3.5, settings.lineWidth * 1.45),
      );
    }

    const birth = projection?.spine?.[0] ?? network?.edges?.[0]?.points?.[0];
    dot(birth, 4);
    if (birth) {
      const position = currentView.world(birth);
      const todayX = selected && todayAnchor
        ? currentView.world(todayAnchor).x : Infinity;
      if (todayX - position.x >= 100) {
        label('Beginning', position.x, rect.height - 14, 'center');
      }
    }

    if (selected && todayAnchor) {
      const today = currentView.world(todayAnchor);
      context.save();
      context.strokeStyle = '#6b7b70';
      context.lineWidth = 1.5;
      context.setLineDash([3, 5]);
      context.beginPath();
      context.moveTo(today.x, PADDING.top);
      context.lineTo(today.x, rect.height - 34);
      context.stroke();
      context.restore();

      for (const age of [12, 25, 40, 60]) {
        if (age >= projection.age || age > (projection.routeEndAge ?? Infinity)) continue;
        dot(pointAtAge(projection.spine, age), 3);
      }
      if (!projection.routeExited) dot(projection.today, 6);
      label(`Today · ${projection.age}`, today.x, rect.height - 14, 'center');
    }

    canvas.dataset.age = String(projection?.age ?? 0);
    canvas.dataset.ready = 'true';
  }

  function ageAt(clientX) {
    if (!lastNetwork) return 0;
    return ageForClientX(
      clientX,
      canvas.getBoundingClientRect(),
      lastNetwork.bounds,
      lastNetwork.maxAge,
    );
  }

  return { paint, ageAt };
}
