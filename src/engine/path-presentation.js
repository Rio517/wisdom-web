const VARIANTS = new Set(['retained', 'fading', 'hybrid']);

export function normalizePresentation(input = {}) {
  const settings = input && typeof input === 'object' ? input : {};
  return {
    variant: VARIANTS.has(settings.variant) ? settings.variant : 'retained',
    lineWidth: Number.isFinite(settings.lineWidth) && settings.lineWidth > 0
      ? settings.lineWidth : 2.2,
    historyLineWidth: Number.isFinite(settings.historyLineWidth) && settings.historyLineWidth > 0
      ? settings.historyLineWidth : 3.5,
    fadeDistance: Number.isFinite(settings.fadeDistance) && settings.fadeDistance > 0
      ? settings.fadeDistance : 240,
    fadeFloor: Number.isFinite(settings.fadeFloor)
      ? Math.max(0, Math.min(1, settings.fadeFloor)) : 0,
  };
}

export function backingScale(devicePixelRatio) {
  return Math.min(3, Math.max(2, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 2));
}

export function canvasBitmap(rect, devicePixelRatio) {
  const scale = backingScale(devicePixelRatio);
  return {
    scale,
    width: Math.max(1, Math.round((Number.isFinite(rect?.width) ? rect.width : 0) * scale)),
    height: Math.max(1, Math.round((Number.isFinite(rect?.height) ? rect.height : 0) * scale)),
  };
}

function alphaHex(alpha) {
  return Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
}

export function fadeColors(color, floor = 0) {
  const flat = /^#[\da-f]{6}$/i.test(color) ? color : '#c5cec8';
  return {
    full: flat,
    floor: `${flat}${alphaHex(floor)}`,
    clear: `${flat}00`,
  };
}

function missedForkX(network, age) {
  const width = network?.bounds?.width;
  const maxAge = network?.maxAge;
  if (!Number.isFinite(width) || width <= 80 || !Number.isFinite(maxAge) || maxAge <= 0) return null;
  return 40 + (width - 80) * age / maxAge;
}

function hybridContextEdges(network, segments, limit = 4) {
  const untakenById = new Map(segments
    .filter(segment => segment.state === 'untaken')
    .map(segment => [segment.edgeId ?? segment.id, segment]));
  const edges = Array.isArray(network?.edges) ? network.edges : [];
  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  const incomingByNode = new Map(edges.map(edge => [edge.to, edge]));
  const untakenFromNodes = new Set([...untakenById.keys()]
    .map(id => edgeById.get(id)?.from)
    .filter(Boolean));
  const terminals = [...untakenById.keys()].map(id => edgeById.get(id))
    .filter(edge => edge && !untakenFromNodes.has(edge.to))
    .map(edge => ({
      id: edge.id,
      y: edge.points.at(-1)?.y ?? 0,
    }))
    .sort((first, second) => first.y - second.y || first.id.localeCompare(second.id));
  if (!terminals.length) return new Set();

  const selected = [terminals[0]];
  if (terminals.length > 1) selected.push(terminals.at(-1));
  while (selected.length < Math.min(limit, terminals.length)) {
    const selectedIds = new Set(selected.map(item => item.id));
    const next = terminals.filter(item => !selectedIds.has(item.id))
      .map(item => ({
        ...item,
        separation: Math.min(...selected.map(chosen => Math.abs(item.y - chosen.y))),
      }))
      .sort((first, second) => second.separation - first.separation
        || first.id.localeCompare(second.id))[0];
    selected.push(next);
  }

  const context = new Set();
  for (const terminal of selected) {
    let edge = edgeById.get(terminal.id);
    while (edge && untakenById.has(edge.id) && !context.has(edge.id)) {
      context.add(edge.id);
      edge = incomingByNode.get(edge.from);
    }
  }
  return context;
}

export function buildPathPresentation(network, segments, input) {
  const settings = normalizePresentation(input);
  const sourceSegments = Array.isArray(segments) ? segments : [];
  const contextEdges = settings.variant === 'hybrid'
    ? hybridContextEdges(network, sourceSegments)
    : new Set();
  const paths = sourceSegments.map(segment => {
    let fade = null;
    if (settings.variant !== 'retained' && segment.state === 'untaken'
        && Number.isFinite(segment.untakenAtAge)) {
      const originX = missedForkX(network, segment.untakenAtAge);
      if (originX !== null) {
        const hold = Math.min(24, settings.fadeDistance * 0.1);
        // Fading keeps whatever floor is asked for, so an early missed fork
        // and its later forks stay faintly present instead of vanishing
        // long before Today. Quiet context keeps only its few context routes.
        fade = {
          startX: originX + hold,
          endX: originX + settings.fadeDistance,
          floor: settings.variant === 'hybrid'
            ? (contextEdges.has(segment.edgeId ?? segment.id) ? 0.35 : 0)
            : settings.fadeFloor,
        };
      }
    }
    return {
      edgeId: segment.edgeId ?? segment.id,
      state: segment.state,
      points: segment.points,
      fade,
    };
  });
  return { settings, paths, contextEdgeIds: [...contextEdges].sort() };
}
