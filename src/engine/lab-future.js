import { generateNetwork, projectScenario } from './path-network.js';

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const round = value => Math.round(value * 10000) / 10000;

function finalPastSlope(projection) {
  const past = projection?.past ?? [];
  for (let index = past.length - 1; index > 0; index -= 1) {
    const elapsed = past[index].age - past[index - 1].age;
    if (elapsed <= 0) continue;
    return (past[index].y - past[index - 1].y) / elapsed;
  }
  return 0;
}

function mappedFuture(local, network, projection, settings) {
  const bounds = network.bounds;
  const left = 40;
  const right = bounds.width - 40;
  const top = 18;
  const bottom = bounds.height - 18;
  const rootY = local.nodes.find(node => node.id === local.rootId).y;
  const today = projection.today;
  const past = projection.past ?? [];
  let tangent = 0;
  for (let index = past.length - 1; index > 0; index -= 1) {
    const dx = past[index].x - past[index - 1].x;
    if (dx <= 0) continue;
    tangent = clamp((past[index].y - past[index - 1].y) / dx, -0.35, 0.35);
    break;
  }
  const remainingWidth = right - today.x;
  const decay = Math.max(24, remainingWidth * 0.18);
  const remainingRatio = clamp((100 - projection.age) / 100, 0, 1);
  const horizon = network.maxAge;
  const ageTaper = clamp(Number.isFinite(settings.ageTaper) ? settings.ageTaper : 0, 0, 1);
  const verticalScale = 1 - ageTaper * (1 - remainingRatio) * 0.35;
  const nativeExit = local.config.boundaryMode === 'exit';
  const mapPoint = point => {
    if (point.x === left && point.y === rootY && point.age === 0) {
      return { x: today.x, y: today.y, age: projection.age };
    }
    if (nativeExit) {
      return {
        x: round(point.x - left + today.x),
        y: point.y,
        age: round(point.age + projection.age),
      };
    }
    const progress = (point.x - left) / (local.bounds.width - 80);
    const x = today.x + remainingWidth * progress;
    const distance = x - today.x;
    const baseline = clamp(
      today.y + tangent * distance * Math.exp(-distance / decay),
      top,
      bottom,
    );
    const availableScale = point.y <= rootY
      ? (baseline - top) / (rootY - top)
      : (bottom - baseline) / (bottom - rootY);
    const envelopeAmount = clamp(distance / 60, 0, 1);
    const easedEnvelope = envelopeAmount * envelopeAmount * (3 - 2 * envelopeAmount);
    const targetScale = Math.min(verticalScale, availableScale);
    const localScale = 1 + (targetScale - 1) * easedEnvelope;
    const y = baseline + (point.y - rootY) * localScale;
    const age = projection.age + point.age;
    return {
      x: round(clamp(x, today.x, right)),
      y: round(clamp(y, top, bottom)),
      age: round(clamp(age, projection.age, horizon)),
    };
  };
  const mapNode = node => ({
    ...node,
    ...mapPoint(node),
    outgoing: [...node.outgoing],
  });
  const mapChoice = choice => ({
    ...choice,
    ...mapPoint(choice),
    options: [...choice.options],
  });
  return {
    rootId: local.rootId,
    bounds: { ...bounds },
    maxAge: horizon,
    nodes: local.nodes.map(mapNode),
    edges: local.edges.map(edge => ({
      ...edge,
      ...(Number.isFinite(edge.reachableUntilAge) ? {
        reachableUntilAge: round(edge.reachableUntilAge + projection.age),
      } : {}),
      points: edge.points.map(mapPoint),
    })),
    choicePoints: local.choicePoints.map(mapChoice),
    config: { ...local.config },
  };
}

function futureTipLimit(requestedTips, remainingRatio, ageTaper, firstChildrenMax) {
  const minimum = Math.max(2, firstChildrenMax);
  const ceiling = Math.max(minimum, Math.min(90, Math.ceil(requestedTips * 0.6)));
  const exponent = 1 + ageTaper;
  return Math.min(ceiling, Math.max(
    minimum,
    Math.round(minimum + (ceiling - minimum) * remainingRatio ** exponent),
  ));
}

export function generateLabFuture(network, projection, settings = {}) {
  const age = projection?.age;
  const horizon = network?.maxAge;
  if (!projection?.today || projection.routeExited || !Number.isFinite(age)
      || !Number.isFinite(horizon) || age <= 0 || horizon - age < 1) return null;
  const config = network?.config;
  if (!config || !network?.bounds) return null;
  const requestedTips = Number.isFinite(settings.maxTips) ? settings.maxTips : config.maxTips;
  const remaining = horizon - age;
  const displayRatio = remaining / horizon;
  const remainingRatio = clamp((100 - age) / 100, 0, 1);
  const ageTaper = clamp(Number.isFinite(settings.ageTaper) ? settings.ageTaper : 0, 0, 1);
  const firstChildrenMax = Number.isInteger(settings.firstChildrenMax)
    ? settings.firstChildrenMax : config.firstChildrenMax ?? 2;
  const maxTips = futureTipLimit(requestedTips, remainingRatio, ageTaper, firstChildrenMax);
  const choiceSeed = typeof settings.choiceSeed === 'string' ? settings.choiceSeed : 'example';
  const boundaryMode = settings.boundaryMode ?? config.boundaryMode ?? 'contain';
  const local = generateNetwork({
    ...config,
    seed: `${network.seed}|future|${choiceSeed}|${age}`,
    width: 80 + (network.bounds.width - 80) * displayRatio,
    height: network.bounds.height,
    maxAge: remaining,
    maxTips,
    maxEdges: maxTips * 2 - 1,
    // A laminar fan opens over the first half of what is left and forks at once.
    envelopeAge: Math.max(8, remaining * 0.5),
    firstSplitAge: 0.12,
    openingBurst: clamp(Number.isFinite(settings.todayBurst) ? settings.todayBurst : 0, 0, 1),
    firstSplitAge: 0.12,
    growthMode: settings.growthMode ?? config.growthMode ?? 'legacy',
    firstChildrenMin: settings.firstChildrenMin ?? config.firstChildrenMin ?? 2,
    firstChildrenMax,
    laterChildrenMin: settings.laterChildrenMin ?? config.laterChildrenMin ?? 2,
    laterChildrenMax: settings.laterChildrenMax ?? config.laterChildrenMax ?? 2,
    ageOffset: age,
    ageHorizon: 100,
    ageTaper,
    burstSpan: Number.isFinite(settings.burstSpan) ? settings.burstSpan : config.burstSpan ?? 5,
    forkSpread: settings.forkSpread ?? config.forkSpread ?? null,
    wideForkLevels: settings.wideForkLevels ?? config.wideForkLevels ?? 1,
    laterBranchSpacing: settings.laterBranchSpacing ?? config.laterBranchSpacing ?? 12,
    boundaryMode,
    exitMargin: settings.exitMargin ?? config.exitMargin ?? 40,
    originY: boundaryMode === 'exit' ? projection.today.y : null,
    originSlope: boundaryMode === 'exit' ? finalPastSlope(projection) : 0,
  });
  return mappedFuture(local, network, projection, settings);
}

export function createLabSceneBuilder() {
  let optionsKey = null;
  let network = null;
  let sceneKey = null;
  let scene = null;
  return ({ options, settings = {}, age = 0 }) => {
    const nextOptionsKey = JSON.stringify(options);
    if (nextOptionsKey !== optionsKey) {
      network = generateNetwork(options);
      optionsKey = nextOptionsKey;
      sceneKey = null;
      scene = null;
    }
    const choiceSeed = typeof settings.choiceSeed === 'string' ? settings.choiceSeed : 'example';
    const nextSceneKey = JSON.stringify([
      optionsKey,
      age,
      choiceSeed,
      settings.todayBurst,
      settings.ageTaper,
      settings.burstSpan,
      settings.growthMode,
      settings.firstChildrenMin,
      settings.firstChildrenMax,
      settings.laterChildrenMin,
      settings.laterChildrenMax,
      settings.forkSpread,
      settings.wideForkLevels,
      settings.laterBranchSpacing,
      settings.boundaryMode,
      settings.exitMargin,
    ]);
    if (nextSceneKey !== sceneKey) {
      const projection = projectScenario(network, { age, choiceSeed });
      scene = {
        network,
        projection,
        future: generateLabFuture(network, projection, settings),
      };
      sceneKey = nextSceneKey;
    }
    return scene;
  };
}
