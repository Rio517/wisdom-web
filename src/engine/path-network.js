import { generateLaminarNetwork } from './path-laminar.js';

const DEFAULTS = Object.freeze({
  seed: 'wisdom-path-network',
  maxAge: 100,
  width: 1260,
  height: 740,
  splitMin: 5.5,
  splitMax: 13.5,
  splitProbability: 0.78,
  openingSplitMin: null,
  openingSplitMax: null,
  openingBurst: 0,
  firstSplitAge: null,
  growthMode: 'legacy',
  firstChildrenMin: 2,
  firstChildrenMax: 2,
  laterChildrenMin: 2,
  laterChildrenMax: 2,
  ageOffset: 0,
  ageHorizon: 100,
  ageTaper: 0,
  burstSpan: 5,
  forkSpread: null,
  wideForkLevels: 1,
  laterBranchSpacing: 12,
  boundaryMode: 'contain',
  exitMargin: 40,
  originY: null,
  originSlope: 0,
  maxTips: 76,
  maxEdges: 300,
  envelopeAge: 25,
  settleYears: 6,
  waveStrength: 1,
  openingAngle: 120,
  endingRate: 0,
  fanOut: 0,
  centerBias: 0,
  bigForkChance: 0,
  bigForkAge: 10,
  sampleAgeStep: 1,
  turnMin: 4.5,
  turnMax: 14,
  turnStrength: 4.8,
  maxSlope: 7.2,
  crowdingStrength: 1.15,
  crowdingRadius: 58,
  crowdingSplitSuppression: 0.22,
  boundaryStrength: 1.35,
  yPadding: 18,
});

const round = value => Math.round(value * 10000) / 10000;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

/**
 * Tunable generation controls are listed in DEFAULTS. splitMin/splitMax are
 * elapsed-age intervals, not fixed positions. splitProbability is evaluated
 * independently for every branch. maxTips and maxEdges are resource guards,
 * not statements about how many opportunities a life contains. maxTips bounds
 * the lines inside the drawing at once: with boundaryMode 'exit', a line
 * that leaves the drawing frees its place, and paced and organic growth then
 * take branches in order of age, so a freed place goes to the lines alive at
 * that age rather than to the youngest generation (algorithm version 2). The years-based
 * model accepts maxAge >= 1 and event intervals >= 0.001; a conservative global
 * event estimate rejects combinations that would make occupancy scans runaway.
 * openingBurst is an opt-in 0..1 intensity: it shortens independent early
 * split clocks and strengthens early departures while retaining later capacity.
 */
function normalizeOptions(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new RangeError('generateNetwork options must be an object');
  }
  const options = { ...DEFAULTS, ...input };
  if (typeof options.seed !== 'string' || options.seed.length === 0) {
    throw new RangeError('seed must be a non-empty string');
  }
  if (!['legacy', 'paced', 'organic', 'laminar'].includes(options.growthMode)) {
    throw new RangeError('growthMode must be legacy, paced, organic, or laminar');
  }
  if (!['contain', 'exit'].includes(options.boundaryMode)) {
    throw new RangeError('boundaryMode must be contain or exit');
  }

  const finite = [
    'maxAge', 'width', 'height', 'splitMin', 'splitMax', 'splitProbability',
    'openingBurst', 'ageOffset', 'ageHorizon', 'ageTaper', 'burstSpan',
    'laterBranchSpacing', 'exitMargin', 'originSlope',
    'envelopeAge', 'settleYears', 'waveStrength', 'openingAngle', 'endingRate',
    'fanOut', 'centerBias', 'bigForkChance', 'bigForkAge',
    'maxTips', 'maxEdges', 'sampleAgeStep', 'turnMin', 'turnMax', 'turnStrength',
    'maxSlope', 'crowdingStrength', 'crowdingRadius', 'crowdingSplitSuppression',
    'boundaryStrength', 'yPadding',
  ];
  for (const name of finite) {
    if (!Number.isFinite(options[name])) throw new RangeError(`${name} must be finite`);
  }
  if (options.maxAge < 1) throw new RangeError('maxAge must be at least 1');
  if (options.maxAge > 10000) throw new RangeError('maxAge must not exceed 10000');
  if (options.width <= 80 || options.width > 100000) {
    throw new RangeError('width must be greater than 80 and at most 100000');
  }
  if (options.height <= 40 || options.height > 100000) {
    throw new RangeError('height must be greater than 40 and at most 100000');
  }
  if (options.exitMargin < 0 || options.exitMargin > options.height) {
    throw new RangeError('exitMargin must be between zero and height');
  }
  const minimumOriginY = options.boundaryMode === 'exit' ? -options.exitMargin : 0;
  const maximumOriginY = options.boundaryMode === 'exit'
    ? options.height + options.exitMargin
    : options.height;
  if (options.originY !== null
      && (!Number.isFinite(options.originY)
        || options.originY < minimumOriginY
        || options.originY > maximumOriginY)) {
    throw new RangeError('originY must be null or within the active boundary range');
  }
  if (Math.abs(options.originSlope) > options.height) {
    throw new RangeError('originSlope magnitude must not exceed height');
  }
  if (options.splitMin < 0.001 || options.splitMax < options.splitMin) {
    throw new RangeError('splitMin and splitMax must be at least 0.001 and ordered');
  }
  if (options.splitProbability < 0 || options.splitProbability > 1) {
    throw new RangeError('splitProbability must be between zero and one');
  }
  if (options.envelopeAge <= 0 || options.settleYears < 0 || options.waveStrength < 0
      || options.openingAngle <= 0 || options.openingAngle > 180 || options.endingRate < 0) {
    throw new RangeError('envelopeAge must be positive; settleYears and waveStrength non-negative; openingAngle within 0–180');
  }
  if (options.fanOut < 0 || options.fanOut > 3 || options.centerBias < 0 || options.centerBias > 1
      || options.bigForkChance < 0 || options.bigForkChance > 1 || options.bigForkAge < 0) {
    throw new RangeError('fanOut must be 0–3; centerBias and bigForkChance 0–1; bigForkAge non-negative');
  }
  if (options.openingBurst < 0 || options.openingBurst > 1) {
    throw new RangeError('openingBurst must be between zero and one');
  }
  if (options.firstSplitAge !== null
      && (!Number.isFinite(options.firstSplitAge)
        || options.firstSplitAge < 0.001
        || options.firstSplitAge >= options.maxAge)) {
    throw new RangeError('firstSplitAge must be null or at least 0.001 and less than maxAge');
  }
  if (options.forkSpread !== null
      && (!Number.isFinite(options.forkSpread)
        || options.forkSpread < 15
        || options.forkSpread > 160)) {
    throw new RangeError('forkSpread must be null or between 15 and 160 degrees');
  }
  if (!Number.isInteger(options.wideForkLevels)
      || options.wideForkLevels < 1
      || options.wideForkLevels > 3) {
    throw new RangeError('wideForkLevels must be an integer from 1 to 3');
  }
  if (options.laterBranchSpacing < 3 || options.laterBranchSpacing > 30) {
    throw new RangeError('laterBranchSpacing must be between 3 and 30 degrees');
  }
  for (const name of [
    'firstChildrenMin', 'firstChildrenMax', 'laterChildrenMin', 'laterChildrenMax',
  ]) {
    if (!Number.isInteger(options[name]) || options[name] < 2 || options[name] > 8) {
      throw new RangeError(`${name} must be an integer from 2 to 8`);
    }
  }
  if (options.firstChildrenMax < options.firstChildrenMin
      || options.laterChildrenMax < options.laterChildrenMin) {
    throw new RangeError('child-count minimums and maximums must be ordered');
  }
  if (options.ageOffset < 0 || options.ageHorizon <= 0 || options.ageTaper < 0
      || options.ageTaper > 1 || options.burstSpan <= 0) {
    throw new RangeError('age controls must have a non-negative offset, positive horizon and span, and taper from zero to one');
  }
  if (options.growthMode !== 'legacy'
      && options.ageOffset + options.maxAge > options.ageHorizon + 1e-9) {
    throw new RangeError('opt-in growth must fit within ageHorizon after ageOffset');
  }
  const hasOpeningMin = options.openingSplitMin !== null;
  const hasOpeningMax = options.openingSplitMax !== null;
  if (hasOpeningMin !== hasOpeningMax
      || (hasOpeningMin && (!Number.isFinite(options.openingSplitMin)
        || !Number.isFinite(options.openingSplitMax)
        || options.openingSplitMin < 0.001
        || options.openingSplitMax < options.openingSplitMin))) {
    throw new RangeError(
      'openingSplitMin and openingSplitMax must both be null or at least 0.001 and ordered',
    );
  }
  if (!Number.isInteger(options.maxTips) || options.maxTips < 1 || options.maxTips > 151) {
    throw new RangeError('maxTips must be an integer from 1 to 151');
  }
  if (!Number.isInteger(options.maxEdges) || options.maxEdges < 1 || options.maxEdges > 1000) {
    throw new RangeError('maxEdges must be an integer from 1 to 1000');
  }
  if (options.sampleAgeStep < 0.001 || options.sampleAgeStep > options.maxAge) {
    throw new RangeError('sampleAgeStep must be at least 0.001 and no greater than maxAge');
  }
  if (options.turnMin < 0.001 || options.turnMax < options.turnMin) {
    throw new RangeError('turnMin and turnMax must be at least 0.001 and ordered');
  }
  if (options.turnStrength < 0 || options.maxSlope <= 0 || options.crowdingStrength < 0
      || options.crowdingRadius <= 0 || options.crowdingSplitSuppression < 0
      || options.boundaryStrength < 0) {
    throw new RangeError('geometry strengths must be non-negative and radii/slopes positive');
  }
  if (options.yPadding < 0 || options.yPadding * 2 >= options.height) {
    throw new RangeError('yPadding must leave drawable height');
  }
  const splitWorkInterval = options.growthMode === 'organic'
    ? Math.min(options.sampleAgeStep, 0.5)
    : options.splitMin;
  const openingWorkInterval = options.growthMode === 'legacy'
    ? options.openingSplitMin ?? Infinity
    : Infinity;
  const burstWorkInterval = options.growthMode === 'legacy' && options.openingBurst > 0
    ? options.splitMin * (1 - 0.75 * (1 - (1 - options.openingBurst) ** 2))
    : Infinity;
  const smallestEventInterval = Math.min(
    options.sampleAgeStep,
    options.turnMin,
    splitWorkInterval,
    openingWorkInterval,
    burstWorkInterval,
  );
  if (options.maxAge / smallestEventInterval > 4096) {
    throw new RangeError('generation controls exceed the per-edge event budget');
  }
  const effectiveTipLimit = Math.min(options.maxTips, Math.floor((options.maxEdges + 1) / 2));
  const estimatedTotalEvents = effectiveTipLimit * options.maxAge / smallestEventInterval;
  const usesForkCurves = options.growthMode !== 'legacy' && options.forkSpread !== null;
  const estimatedForkEvents = !usesForkCurves
    ? 0
    : effectiveTipLimit * 60;
  const totalWorkLimit = usesForkCurves ? 40000 : 30000;
  if (estimatedTotalEvents + estimatedForkEvents > totalWorkLimit) {
    throw new RangeError('generation controls exceed the total work budget');
  }
  return options;
}

function ageWeight(options, localAge) {
  if (options.ageTaper === 0) return 1;
  const absoluteAge = options.ageOffset + localAge;
  const remaining = clamp((options.ageHorizon - absoluteAge) / options.ageHorizon, 0, 1);
  const tapered = 0.2 + 0.8 * remaining ** 2;
  return 1 + (tapered - 1) * options.ageTaper;
}

function organicProbability(options, localAge, dt, density) {
  if (options.splitProbability === 0) return 0;
  if (options.splitProbability === 1) return 1;
  const meanInterval = (options.splitMin + options.splitMax) / 2;
  const baseRate = -Math.log1p(-options.splitProbability) / meanInterval;
  const burstProgress = clamp(localAge / options.burstSpan, 0, 1);
  const smoothBurst = 1 - burstProgress ** 2 * (3 - 2 * burstProgress);
  const impulseSpan = Math.min(1, options.burstSpan * 0.25);
  const impulseProgress = clamp(localAge / impulseSpan, 0, 1);
  const smoothImpulse = 1 - impulseProgress ** 2 * (3 - 2 * impulseProgress);
  const burstBoost = 1 + options.openingBurst * (52 * smoothImpulse + 5 * smoothBurst);
  const densityDivisor = 1 + options.crowdingSplitSuppression * density;
  const rate = baseRate * burstBoost * ageWeight(options, localAge) / densityDivisor;
  return -Math.expm1(-rate * dt);
}

function organicAttempt(options, branchId, attemptIndex, localAge, step, density) {
  const probability = organicProbability(options, localAge, step, density);
  const draw = randomUnit(`${options.seed}|topology|${branchId}|attempt|${attemptIndex}`);
  if (draw >= probability) {
    return { age: Math.min(options.maxAge, localAge + step), willSplit: false };
  }
  if (probability >= 1 - Number.EPSILON) {
    return {
      age: Math.min(options.maxAge, localAge + Math.max(1e-6, step * draw)),
      willSplit: true,
    };
  }
  const rate = -Math.log1p(-probability) / step;
  const wait = -Math.log1p(-draw) / rate;
  return {
    age: Math.min(options.maxAge, localAge + Math.max(1e-6, Math.min(step, wait))),
    willSplit: true,
  };
}

export function splitProbabilityForStep(input, localAge, dt, density = 0) {
  const options = normalizeOptions(input ?? {});
  if (options.growthMode !== 'organic') {
    throw new RangeError('splitProbabilityForStep requires organic growthMode');
  }
  if (!Number.isFinite(localAge) || localAge < 0 || localAge > options.maxAge
      || !Number.isFinite(dt) || dt <= 0
      || !Number.isFinite(density) || density < 0) {
    throw new RangeError('localAge, dt, and density must be finite and within range');
  }
  return organicProbability(options, localAge, dt, density);
}

function hash32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function randomUnit(key) {
  let value = hash32(key);
  value += 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

const randomRange = (key, minimum, maximum) => minimum + randomUnit(key) * (maximum - minimum);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value) || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function localNeighbours(occupancy, x, ignoredOwners, radius) {
  const xRadius = Math.max(16, radius * 0.42);
  const nearestByOwner = new Map();
  let candidates = occupancy;
  if (occupancy.byX) {
    candidates = [];
    const firstBucket = Math.floor((x - xRadius) / occupancy.bucketWidth);
    const lastBucket = Math.floor((x + xRadius) / occupancy.bucketWidth);
    for (let bucket = firstBucket; bucket <= lastBucket; bucket += 1) {
      candidates.push(...(occupancy.byX.get(bucket) ?? []));
    }
  }
  for (const occupied of candidates) {
    if (ignoredOwners.has(occupied.owner)) continue;
    const xDistance = Math.abs(occupied.x - x);
    if (xDistance > xRadius) continue;
    const previous = nearestByOwner.get(occupied.owner);
    if (!previous || xDistance < previous.xDistance) {
      nearestByOwner.set(occupied.owner, { ...occupied, xDistance });
    }
  }
  return { xRadius, neighbours: [...nearestByOwner.values()] };
}

function crowdingAt(occupancy, x, y, ignoredOwners, radius, tieDirection) {
  const { xRadius, neighbours } = localNeighbours(occupancy, x, ignoredOwners, radius);
  let force = 0;
  let density = 0;
  for (const occupied of neighbours) {
    const yDistance = y - occupied.y;
    const distance = Math.abs(yDistance);
    if (distance >= radius) continue;
    const weight = (1 - distance / radius) * (1 - occupied.xDistance / xRadius);
    density += weight;
    force += (distance < 0.001 ? tieDirection : Math.sign(yDistance)) * weight;
  }
  // A dense pocket should not multiply acceleration until every route becomes
  // a long saturated diagonal. Use the crowd as one directional signal; its
  // density separately reduces optional splitting below.
  force /= Math.max(1, density);
  return { force, density };
}

function addOccupancy(occupancy, edge) {
  for (const point of edge.points) {
    const occupied = { owner: edge.id, x: point.x, y: point.y };
    if (occupancy.byX) {
      const bucket = Math.floor(point.x / occupancy.bucketWidth);
      if (!occupancy.byX.has(bucket)) occupancy.byX.set(bucket, []);
      occupancy.byX.get(bucket).push(occupied);
    }
    occupancy.push(occupied);
  }
}

function edgeCapacityAllowsSplit(frontierCount, options) {
  return frontierCount < options.maxTips && (2 * (frontierCount + 1) - 1) <= options.maxEdges;
}

function openingBurstMix(options, age) {
  if (options.openingBurst === 0) return 0;
  const fullStrengthUntil = options.maxAge * 0.12;
  const openingEndsAt = options.maxAge * 0.25;
  const ageFade = age <= fullStrengthUntil
    ? 1
    : clamp((openingEndsAt - age) / (openingEndsAt - fullStrengthUntil), 0, 1);
  return (1 - (1 - options.openingBurst) ** 2) * ageFade;
}

function splitIntervalBounds(options, branch, splitIndex, age) {
  const isRootFirstSplit = branch.branchId === 'r' && splitIndex === 0;
  if (isRootFirstSplit && options.openingSplitMin !== null) {
    return [options.openingSplitMin, options.openingSplitMax];
  }
  const burstMix = openingBurstMix(options, age);
  if (burstMix === 0) return [options.splitMin, options.splitMax];
  const burstMin = options.openingSplitMin ?? options.splitMin * 0.25;
  const burstMax = options.openingSplitMax ?? options.splitMax * 0.25;
  return [
    options.splitMin + (burstMin - options.splitMin) * burstMix,
    options.splitMax + (burstMax - options.splitMax) * burstMix,
  ];
}

function openingCapacityAllowsSplit(frontierCount, options, age) {
  if (options.openingBurst === 0 || age >= options.maxAge * 0.25) return true;
  const openingTipLimit = Math.max(
    2,
    Math.floor(options.maxTips * (0.12 + 0.12 * options.openingBurst)),
  );
  return frontierCount < openingTipLimit;
}

function pacedBurstMix(options, branch, localAge = branch.age) {
  if (options.openingBurst === 0) return 0;
  const depthStrength = branch.depth <= 2
    ? 1
    : clamp((5 - branch.depth) / 3, 0, 1);
  const durationProgress = clamp(localAge / options.burstSpan, 0, 1);
  const durationStrength = 1 - durationProgress * durationProgress
    * (3 - 2 * durationProgress);
  return (1 - (1 - options.openingBurst) ** 2) * depthStrength * durationStrength;
}

function growthSplitIntervalBounds(options, branch, splitIndex, age) {
  if (options.growthMode === 'legacy') {
    return splitIntervalBounds(options, branch, splitIndex, age);
  }
  const isRootFirstSplit = branch.branchId === 'r' && splitIndex === 0;
  const burstMix = pacedBurstMix(options, branch, age);
  const openingMin = options.openingSplitMin ?? options.splitMin * 0.25;
  const openingMax = options.openingSplitMax ?? options.splitMax * 0.25;
  const burstMin = openingMin * 0.3;
  const burstMax = openingMax * 0.4;
  let minimum = isRootFirstSplit && options.openingSplitMin !== null
    ? options.openingSplitMin
    : options.splitMin + (burstMin - options.splitMin) * burstMix;
  let maximum = isRootFirstSplit && options.openingSplitMax !== null
    ? options.openingSplitMax
    : options.splitMax + (burstMax - options.splitMax) * burstMix;
  const pace = branch.depth <= 2 ? 1 : ageWeight(options, age);
  minimum /= pace;
  maximum /= pace;
  return [minimum, maximum];
}

function childCountForSplit(options, branch, frontierCount, edgeCount, queuedCount) {
  if (options.growthMode === 'legacy') return 2;
  const isFirstFork = branch.branchId === 'r';
  const minimum = isFirstFork ? options.firstChildrenMin : options.laterChildrenMin;
  const maximum = isFirstFork ? options.firstChildrenMax : options.laterChildrenMax;
  const tipCapacity = options.maxTips - frontierCount + 1;
  const edgeCapacity = options.maxEdges - edgeCount - queuedCount - 1;
  const available = Math.min(maximum, tipCapacity, edgeCapacity);
  if (available < minimum) return 0;
  const requested = minimum + Math.floor(randomUnit(
    `${options.seed}|topology|${branch.branchId}|children`,
  ) * (maximum - minimum + 1));
  return Math.min(requested, available);
}

function separatedDivergences(options, branch, childCount, age) {
  const burstMix = options.growthMode === 'organic'
    ? options.openingBurst * Math.max(0, 1 - age / options.burstSpan)
    : pacedBurstMix(options, branch, age);
  const taper = ageWeight(options, age);
  const desired = [];
  for (let child = 0; child < childCount; child += 1) {
    const childId = `${branch.branchId}${child}`;
    const sign = randomUnit(`${options.seed}|geometry|${childId}|fork-direction`) < 0.5 ? -1 : 1;
    const magnitude = (1.32 + randomUnit(
      `${options.seed}|geometry|${childId}|fork-strength`,
    ) * 1.55) * (1 + burstMix * 4) * taper;
    desired.push({ child, value: sign * magnitude });
  }
  const rawMean = desired.reduce((total, item) => total + item.value, 0) / desired.length;
  desired.sort((first, second) => first.value - second.value || first.child - second.child);
  const minimumGap = (0.8 + burstMix * 1.2) * taper;
  for (let index = 1; index < desired.length; index += 1) {
    desired[index].value = Math.max(
      desired[index].value,
      desired[index - 1].value + minimumGap,
    );
  }
  const correction = desired.reduce((total, item) => total + item.value, 0) / desired.length
    - rawMean;
  const byChild = Array(childCount);
  for (const item of desired) byChild[item.child] = item.value - correction;
  return byChild;
}

function forkTargetSlopes(options, branch, childCount, parentSlope, turnIndex) {
  if (options.forkSpread === null || options.growthMode === 'legacy') return null;
  const xPerAge = (options.width - 80) / options.maxAge;
  const coneHalfAngle = Math.min(75, options.forkSpread / 2);
  const usesWideAperture = branch.depth < options.wideForkLevels;
  const aperture = usesWideAperture
    ? options.forkSpread
    : Math.min(options.forkSpread, (childCount - 1) * options.laterBranchSpacing);
  const continuesOpeningDirection = branch.forkTargetSlope !== null && turnIndex === 0;
  const centerSlope = continuesOpeningDirection ? branch.forkTargetSlope : parentSlope;
  const centerAngle = branch.depth === 0
    ? 0
    : clamp(Math.atan(centerSlope / xPerAge) * 180 / Math.PI, -coneHalfAngle, coneHalfAngle);
  const firstAngle = Math.max(-coneHalfAngle, centerAngle - aperture / 2);
  const lastAngle = Math.min(coneHalfAngle, centerAngle + aperture / 2);
  const spacing = (lastAngle - firstAngle) / Math.max(1, childCount - 1);
  const slots = [];
  for (let slot = 0; slot < childCount; slot += 1) {
    const edgeSlot = slot === 0 || slot === childCount - 1;
    const jitter = edgeSlot ? 0 : randomRange(
      `${options.seed}|geometry|${branch.branchId}|fork-angle-jitter|${slot}`,
      -spacing * 0.16,
      spacing * 0.16,
    );
    const angle = clamp(
      firstAngle + spacing * slot + jitter,
      -coneHalfAngle,
      coneHalfAngle,
    );
    slots.push(angle);
  }
  return slots.map(angle => Math.tan(angle * Math.PI / 180) * xPerAge);
}

const smoothstep = progress => progress * progress * (3 - 2 * progress);

function edgeSteeringProfile(options, branchId) {
  const drawableHeight = options.height - options.yPadding * 2;
  const baseClearance = Math.min(100, options.height * 0.16, drawableHeight * 0.44);
  const clearance = side => Math.min(
    drawableHeight * 0.44,
    baseClearance * randomRange(
      `${options.seed}|geometry|${branchId}|edge-clearance|${side}`,
      0.68,
      1.32,
    ),
  );
  return {
    topZone: options.yPadding + clearance('top'),
    bottomZone: options.height - options.yPadding - clearance('bottom'),
    topInwardAngle: randomRange(
      `${options.seed}|geometry|${branchId}|edge-heading|top`, 7, 18,
    ) * Math.PI / 180,
    bottomInwardAngle: -randomRange(
      `${options.seed}|geometry|${branchId}|edge-heading|bottom`, 7, 18,
    ) * Math.PI / 180,
  };
}

function edgeSteeringBounds(options, profile = null) {
  const edgeZone = Math.min(100, options.height * 0.16);
  const lowerZone = profile?.topZone ?? options.yPadding + edgeZone;
  const upperZone = profile?.bottomZone ?? options.height - options.yPadding - edgeZone;
  return { lowerZone, upperZone };
}

function steerSlopeFromEdges(options, requestedSlope, y, profile = null) {
  if (options.boundaryMode === 'exit') return requestedSlope;
  const xPerAge = (options.width - 80) / options.maxAge;
  let angle = Math.atan(requestedSlope / xPerAge);
  const { lowerZone, upperZone } = edgeSteeringBounds(options, profile);
  const topInwardAngle = profile?.topInwardAngle ?? 12 * Math.PI / 180;
  const bottomInwardAngle = profile?.bottomInwardAngle ?? -12 * Math.PI / 180;
  if (y < lowerZone) {
    const progress = smoothstep(clamp(
      (lowerZone - y) / Math.max(1e-9, lowerZone - options.yPadding), 0, 1,
    ));
    angle += (topInwardAngle - angle) * progress;
  } else if (y > upperZone) {
    const progress = smoothstep(clamp(
      (y - upperZone) / Math.max(1e-9, options.height - options.yPadding - upperZone), 0, 1,
    ));
    angle += (bottomInwardAngle - angle) * progress;
  }
  return Math.tan(clamp(angle, -80 * Math.PI / 180, 80 * Math.PI / 180)) * xPerAge;
}

function forkCurveSlope(options, branch, travelledDistance, y, edgeProfile) {
  const xPerAge = (options.width - 80) / options.maxAge;
  const entryAngle = Math.atan(branch.forkEntrySlope / xPerAge);
  const forkAngle = Math.atan(branch.forkTargetSlope / xPerAge);
  const progress = smoothstep(clamp(
    travelledDistance / branch.forkSteeringDistance, 0, 1,
  ));
  const angle = entryAngle + (forkAngle - entryAngle) * progress;
  return steerSlopeFromEdges(options, Math.tan(angle) * xPerAge, y, edgeProfile);
}

function forkSteeringDistance(options, entrySlope, targetSlope) {
  const xPerAge = (options.width - 80) / options.maxAge;
  const entryAngle = Math.atan(entrySlope / xPerAge);
  const targetAngle = Math.atan(targetSlope / xPerAge);
  const angleChange = Math.abs(targetAngle - entryAngle);
  return angleChange < 1e-6 ? 0 : 18 + angleChange * 18;
}

function nextEdgeSteeringAge(options, age, y, slope, step, maxAge, profile) {
  if (Math.abs(slope) < 1e-9) return Infinity;
  const { lowerZone, upperZone } = edgeSteeringBounds(options, profile);
  const movesUp = slope < 0;
  const distance = movesUp ? y - lowerZone : upperZone - y;
  if (distance <= 0) return Math.min(maxAge, age + step);
  const timeToZone = distance / Math.abs(slope);
  if (timeToZone >= options.sampleAgeStep) return Infinity;
  return Math.min(maxAge, age + Math.max(step, timeToZone));
}

/** Generate a deterministic forward-only tree covering the complete age span. */
export function generateNetwork(input = {}) {
  const options = normalizeOptions(input);
  if (options.growthMode === 'laminar') return deepFreeze(generateLaminarNetwork(options));
  const xForAge = age => 40 + (options.width - 80) * age / options.maxAge;
  const originY = options.originY ?? options.height / 2;
  const rootId = 'n-root';
  const nodes = [{ id: rootId, age: 0, x: 40, y: round(originY), outgoing: [] }];
  const nodeById = new Map([[rootId, nodes[0]]]);
  const edges = [];
  const choicePoints = [];
  const occupancy = [];
  if (options.openingBurst > 0) {
    Object.defineProperties(occupancy, {
      byX: { value: new Map() },
      bucketWidth: { value: 16 },
    });
  }
  const queue = [{
    branchId: 'r',
    depth: 0,
    sourceId: rootId,
    age: 0,
    y: originY,
    slope: options.originSlope,
    ancestors: new Set(),
    divergence: 0,
    forkTargetSlope: null,
    forkEntrySlope: null,
    forkSteeringDistance: 0,
  }];
  let frontierCount = 1;

  // Growth takes branches generation by generation, except where lines can
  // leave the drawing and hand their place back: there the independent-clock
  // modes take the branch that starts youngest, so the budget is spent in
  // the order of life — a place freed by a line leaving at thirty goes to a
  // line alive at thirty, not to the next-queued child of the opening. Queue
  // order breaks ties, so a run is still one drawing.
  const inAgeOrder = options.growthMode !== 'legacy' && options.boundaryMode === 'exit';
  const nextBranch = () => {
    if (!inAgeOrder) return queue.shift();
    let pick = 0;
    for (let index = 1; index < queue.length; index += 1) {
      if (queue[index].age < queue[pick].age) pick = index;
    }
    return queue.splice(pick, 1)[0];
  };

  while (queue.length > 0) {
    const branch = nextBranch();
    const edgeId = `e-${branch.branchId}`;
    const ignoredOwners = new Set(branch.ancestors);
    const points = [{ x: round(xForAge(branch.age)), y: round(branch.y), age: branch.age }];
    let age = branch.age;
    let y = branch.y;
    let slope = branch.slope;
    let turnIndex = 0;
    let splitIndex = 0;
    let targetSlope = branch.forkTargetSlope ?? randomRange(
      `${options.seed}|geometry|${branch.branchId}|target|0`,
      -options.turnStrength, options.turnStrength,
    );
    let nextTurn = age + randomRange(`${options.seed}|geometry|${branch.branchId}|turn|0`,
      options.turnMin, options.turnMax);
    const usesExactFirstSplit = options.growthMode !== 'organic'
      && branch.branchId === 'r' && options.firstSplitAge !== null;
    const [firstSplitMin, firstSplitMax] = growthSplitIntervalBounds(
      options, branch, 0, age,
    );
    let nextSplit = usesExactFirstSplit
      ? options.firstSplitAge
      : age + randomRange(`${options.seed}|topology|${branch.branchId}|interval|0`,
        firstSplitMin, firstSplitMax);
    const organicStep = Math.min(options.sampleAgeStep, 0.5);
    let organicAttemptIndex = 0;
    const initialOrganicDensity = options.growthMode === 'organic'
      ? crowdingAt(occupancy, xForAge(age), y, ignoredOwners,
        options.crowdingRadius,
        randomUnit(`${options.seed}|geometry|${branch.branchId}|crowding-tie`) < 0.5 ? -1 : 1)
        .density
      : 0;
    let scheduledOrganic = options.growthMode === 'organic'
      ? organicAttempt(
        options, branch.branchId, organicAttemptIndex, age, organicStep, initialOrganicDensity,
      )
      : { age: Infinity, willSplit: false };
    let nextOrganicAttempt = scheduledOrganic.age;
    const xPerAge = (options.width - 80) / options.maxAge;
    const hasForkCurve = branch.forkTargetSlope !== null;
    const edgeProfile = hasForkCurve && options.boundaryMode === 'contain'
      ? edgeSteeringProfile(options, branch.branchId)
      : null;
    const forkCurveStep = Math.min(options.sampleAgeStep, 2.5 / xPerAge);
    let forkTravelledDistance = 0;
    let nextForkCurveSample = branch.forkTargetSlope === null
      || branch.forkSteeringDistance === 0
      ? Infinity
      : Math.min(options.maxAge, branch.age + forkCurveStep);
    let didSplit = false;
    let didExit = false;
    let splitChildCount = 0;
    let splitDensity = 0;
    let iterations = 0;
    let departing = branch.age > 0;
    const departureEnd = departing
      ? age + Math.min(
        options.sampleAgeStep * 0.18,
        nextTurn - age,
        nextSplit - age,
        options.maxAge - age,
      )
      : Infinity;

    while (age < options.maxAge) {
      iterations += 1;
      if (iterations > 8192) throw new RangeError('generation exceeded its per-edge event budget');
      const nextEdgeSample = branch.forkTargetSlope === null || options.boundaryMode === 'exit'
        ? Infinity
        : nextEdgeSteeringAge(
          options, age, y, slope, forkCurveStep, options.maxAge, edgeProfile,
        );
      const nextAge = Math.min(
        options.maxAge,
        age + options.sampleAgeStep,
        nextTurn,
        options.growthMode === 'organic' ? nextOrganicAttempt : nextSplit,
        nextForkCurveSample,
        nextEdgeSample,
        departing ? departureEnd : Infinity,
      );
      const elapsed = nextAge - age;
      if (elapsed <= 1e-9) {
        if (nextTurn <= age + 1e-9) {
          turnIndex += 1;
          targetSlope = randomRange(
            `${options.seed}|geometry|${branch.branchId}|target|${turnIndex}`,
            -options.turnStrength, options.turnStrength,
          );
          nextTurn = age + randomRange(
            `${options.seed}|geometry|${branch.branchId}|turn|${turnIndex}`,
            options.turnMin, options.turnMax,
          );
        }
        if (nextSplit <= age + 1e-9) {
          splitIndex += 1;
          const [intervalMin, intervalMax] = growthSplitIntervalBounds(
            options, branch, splitIndex, age,
          );
          nextSplit = age + randomRange(
            `${options.seed}|topology|${branch.branchId}|interval|${splitIndex}`,
            intervalMin, intervalMax,
          );
        }
        continue;
      }

      const x = xForAge(nextAge);
      const previousX = xForAge(age);
      const previousY = y;
      const previousSlope = slope;
      const tieDirection = randomUnit(`${options.seed}|geometry|${branch.branchId}|crowding-tie`) < 0.5
        ? -1 : 1;
      const crowding = crowdingAt(occupancy, x, y, ignoredOwners,
        options.crowdingRadius, tieDirection);
      const { lowerZone, upperZone } = edgeSteeringBounds(options, edgeProfile);
      let boundaryForce = 0;
      if (options.boundaryMode === 'contain') {
        if (y < lowerZone) boundaryForce = (lowerZone - y) / (lowerZone - options.yPadding);
        else if (y > upperZone) boundaryForce = -(y - upperZone) / (options.height - options.yPadding - upperZone);
      }

      const yearsSinceFork = nextAge - branch.age;
      const predictedTravel = forkTravelledDistance + Math.hypot(
        x - previousX,
        slope * elapsed,
      );
      const forkCurveActive = hasForkCurve
        && forkTravelledDistance < branch.forkSteeringDistance;
      const departureScale = hasForkCurve && departing
        ? 0
        : departing && openingBurstMix(options, branch.age) > 0 ? 0.35 : 1;
      if (forkCurveActive && !departing) {
        slope = forkCurveSlope(options, branch, predictedTravel, y, edgeProfile);
      } else {
        const effectiveTarget = hasForkCurve
          ? steerSlopeFromEdges(options, targetSlope, y, edgeProfile)
          : targetSlope;
        const relaxation = Math.min(1, elapsed * 0.18) * departureScale;
        slope += (effectiveTarget - slope) * relaxation;
      }
      const crowdingCorrection = crowding.force
        * options.crowdingStrength * elapsed * departureScale;
      slope += crowdingCorrection;
      slope += boundaryForce * options.boundaryStrength * elapsed * departureScale;
      if (branch.divergence !== 0) {
        const fade = Math.max(0, 1 - yearsSinceFork / 8);
        const rampDuration = 0.5 + openingBurstMix(options, branch.age) * 2;
        const ramp = Math.min(1, yearsSinceFork / rampDuration);
        slope += branch.divergence * ramp * fade * elapsed * departureScale;
      }
      if (hasForkCurve) {
        slope = steerSlopeFromEdges(
          options, slope - crowdingCorrection, y, edgeProfile,
        ) + crowdingCorrection;
      }
      const forkSlopeLimit = hasForkCurve
        ? Math.max(options.maxSlope, Math.abs(previousSlope),
          forkCurveActive ? Math.abs(slope) : 0)
        : options.maxSlope;
      slope = clamp(slope, -forkSlopeLimit, forkSlopeLimit);
      y += slope * elapsed;
      if (options.boundaryMode === 'exit'
          && (y <= -options.exitMargin || y >= options.height + options.exitMargin)) {
        const exitY = y <= -options.exitMargin
          ? (options.exitMargin === 0 ? 0 : -options.exitMargin)
          : options.height + options.exitMargin;
        let exitProgress = clamp(
          (exitY - previousY) / Math.max(1e-9, Math.abs(y - previousY))
            * Math.sign(y - previousY),
          0,
          1,
        );
        if (exitProgress <= 1e-9 && points.length === 1) {
          exitProgress = Math.min(1, 0.001 / elapsed);
        }
        age += elapsed * exitProgress;
        y = exitY;
        points.push({ x: round(xForAge(age)), y: round(y), age });
        didExit = true;
        break;
      }
      if (options.boundaryMode === 'contain' && y < options.yPadding) {
        y = options.yPadding;
        slope = Math.abs(slope) * 0.45;
      } else if (options.boundaryMode === 'contain' && y > options.height - options.yPadding) {
        y = options.height - options.yPadding;
        slope = -Math.abs(slope) * 0.45;
      }
      age = nextAge;
      points.push({ x: round(x), y: round(y), age });
      departing = false;
      if (forkCurveActive) {
        forkTravelledDistance += Math.hypot(x - previousX, y - previousY);
      }

      if (Math.abs(age - nextForkCurveSample) <= 1e-8) {
        nextForkCurveSample = forkTravelledDistance < branch.forkSteeringDistance
          && age + forkCurveStep < options.maxAge - 1e-9
          ? age + forkCurveStep
          : Infinity;
      }

      if (Math.abs(age - nextTurn) <= 1e-8) {
        turnIndex += 1;
        targetSlope = randomRange(`${options.seed}|geometry|${branch.branchId}|target|${turnIndex}`,
          -options.turnStrength, options.turnStrength);
        nextTurn = age + randomRange(`${options.seed}|geometry|${branch.branchId}|turn|${turnIndex}`,
          options.turnMin, options.turnMax);
      }

      const reachedSplitAttempt = options.growthMode === 'organic'
        ? Math.abs(age - nextOrganicAttempt) <= 1e-8
        : Math.abs(age - nextSplit) <= 1e-8;
      if (reachedSplitAttempt) {
        const remaining = options.maxAge - age;
        splitDensity = crowding.density;
        const suppression = 1 + options.crowdingSplitSuppression * splitDensity;
        const burstMix = options.growthMode === 'paced'
          ? pacedBurstMix(options, branch, age)
          : openingBurstMix(options, age);
        const burstProbability = Math.min(
          1,
          options.splitProbability * (1 + burstMix * 0.28),
        );
        const pacedLaunchWindow = options.growthMode === 'paced'
          && branch.depth <= 2
          && options.openingBurst > 0
          && age < options.burstSpan;
        const pacedSuppression = pacedLaunchWindow
          ? 1
          : 1 + options.crowdingSplitSuppression * splitDensity;
        const pacedAgeWeight = options.growthMode === 'paced' && branch.depth <= 2
          ? 1
          : ageWeight(options, age);
        const threshold = options.growthMode === 'organic'
          ? Number(scheduledOrganic.willSplit)
          : options.growthMode === 'paced'
            ? burstProbability * pacedAgeWeight / pacedSuppression
            : burstProbability / suppression;
        const attemptIndex = options.growthMode === 'organic' ? organicAttemptIndex : splitIndex;
        const attemptKind = options.growthMode === 'organic' ? 'attempt' : 'split';
        const roll = options.growthMode === 'organic' ? 0 : randomUnit(
          `${options.seed}|topology|${branch.branchId}|${attemptKind}|${attemptIndex}`,
        );
        const guaranteesExactRootSplit = usesExactFirstSplit && splitIndex === 0
          && options.splitProbability > 0;
        const childCount = childCountForSplit(
          options, branch, frontierCount, edges.length, queue.length,
        );
        const capacityAllowsSplit = options.growthMode === 'legacy'
          ? edgeCapacityAllowsSplit(frontierCount, options)
          : childCount > 0;
        const openingAllowsSplit = options.growthMode === 'legacy'
          ? openingCapacityAllowsSplit(frontierCount, options, age)
          : true;
        const remainingGuardStep = options.growthMode === 'organic'
          ? organicStep
          : options.sampleAgeStep;
        if (remaining >= remainingGuardStep * 1.5
            && capacityAllowsSplit
            && openingAllowsSplit
            && (guaranteesExactRootSplit || roll < threshold)) {
          didSplit = true;
          splitChildCount = childCount;
          break;
        }
        if (options.growthMode === 'organic') {
          organicAttemptIndex += 1;
          scheduledOrganic = organicAttempt(
            options, branch.branchId, organicAttemptIndex, age, organicStep, splitDensity,
          );
          nextOrganicAttempt = scheduledOrganic.age;
        } else {
          splitIndex += 1;
          const [intervalMin, intervalMax] = growthSplitIntervalBounds(
            options, branch, splitIndex, age,
          );
          nextSplit = age + randomRange(
            `${options.seed}|topology|${branch.branchId}|interval|${splitIndex}`,
            intervalMin, intervalMax,
          );
        }
      }
    }

    const targetId = didSplit ? `n-${branch.branchId}` : `n-${branch.branchId}-tip`;
    const target = {
      id: targetId,
      age,
      x: round(xForAge(age)),
      y: round(y),
      outgoing: [],
    };
    if (options.boundaryMode === 'exit' && !didSplit) {
      target.terminationReason = didExit ? 'boundary-exit' : 'horizon';
      // A line that has left the drawing no longer occupies a place in it:
      // its slot goes back to the budget, so lines still inside can keep
      // forking at later ages instead of the whole field being spent by the
      // opening generations. Lines that reach the horizon keep their place.
      if (didExit) frontierCount -= 1;
    }
    nodes.push(target);
    nodeById.set(targetId, target);
    const edge = { id: edgeId, from: branch.sourceId, to: targetId, points };
    edges.push(edge);
    nodeById.get(branch.sourceId).outgoing.push(edgeId);
    addOccupancy(occupancy, edge);

    if (didSplit) {
      frontierCount += splitChildCount - 1;
      const ancestorEdges = new Set([...branch.ancestors, edgeId]);
      let firstChildDivergenceSign = null;
      const optInDivergences = options.growthMode === 'legacy'
        ? null
        : separatedDivergences(options, branch, splitChildCount, age);
      const optInForkSlopes = forkTargetSlopes(
        options, branch, splitChildCount, slope, turnIndex,
      );
      const childEdgeIds = [];
      for (let child = 0; child < splitChildCount; child += 1) {
        const childId = `${branch.branchId}${child}`;
        let divergence;
        if (options.growthMode === 'legacy') {
          let divergenceSign = randomUnit(
            `${options.seed}|geometry|${childId}|fork-direction`,
          ) < 0.5 ? -1 : 1;
          const resolvesExactRootCollision = options.firstSplitAge !== null
            && branch.branchId === 'r'
            && child === 1
            && divergenceSign === firstChildDivergenceSign;
          if (resolvesExactRootCollision) divergenceSign *= -1;
          if (child === 0) firstChildDivergenceSign = divergenceSign;
          const divergenceMagnitude = (1.32 + randomUnit(
            `${options.seed}|geometry|${childId}|fork-strength`,
          ) * 1.55) * (1 + openingBurstMix(options, age) * 4);
          divergence = divergenceSign * divergenceMagnitude;
        } else {
          divergence = optInDivergences[child];
        }
        queue.push({
          branchId: childId,
          depth: branch.depth + 1,
          sourceId: targetId,
          age,
          y,
          slope,
          ancestors: ancestorEdges,
          divergence: optInForkSlopes ? 0 : divergence,
          forkTargetSlope: optInForkSlopes?.[child] ?? null,
          forkEntrySlope: optInForkSlopes ? slope : null,
          forkSteeringDistance: optInForkSlopes
            ? forkSteeringDistance(options, slope, optInForkSlopes[child])
            : 0,
        });
        childEdgeIds.push(`e-${childId}`);
      }
      choicePoints.push({
        id: targetId,
        age: target.age,
        x: target.x,
        y: target.y,
        options: childEdgeIds,
      });
    }
  }

  if (options.boundaryMode === 'exit') {
    const reachableByNode = new Map();
    const generatedEdgeById = new Map(edges.map(edge => [edge.id, edge]));
    const reachableFromNode = nodeId => {
      if (reachableByNode.has(nodeId)) return reachableByNode.get(nodeId);
      const node = nodeById.get(nodeId);
      const reachable = node.outgoing.length === 0
        ? node.age
        : Math.max(...node.outgoing.map(edgeId => {
          const child = generatedEdgeById.get(edgeId);
          return reachableFromNode(child.to);
        }));
      reachableByNode.set(nodeId, reachable);
      return reachable;
    };
    for (const edge of edges) edge.reachableUntilAge = reachableFromNode(edge.to);
  }

  return deepFreeze({
    version: 2,
    seed: options.seed,
    config: { ...options },
    bounds: { x: 0, y: 0, width: options.width, height: options.height },
    maxAge: options.maxAge,
    rootId,
    nodes,
    edges,
    choicePoints,
  });
}

function clonePoint(point) {
  return { x: point.x, y: point.y, age: point.age };
}

function appendPoints(target, source) {
  for (const point of source) {
    const previous = target.at(-1);
    if (!previous || previous.x !== point.x || previous.y !== point.y || previous.age !== point.age) {
      target.push(clonePoint(point));
    }
  }
}

function pointAtAge(points, age) {
  if (age <= points[0].age) return clonePoint(points[0]);
  if (age >= points.at(-1).age) return clonePoint(points.at(-1));
  for (let index = 1; index < points.length; index += 1) {
    const end = points[index];
    if (age > end.age) continue;
    const start = points[index - 1];
    if (age === end.age) return clonePoint(end);
    const progress = (age - start.age) / (end.age - start.age);
    return {
      x: round(start.x + (end.x - start.x) * progress),
      y: round(start.y + (end.y - start.y) * progress),
      age,
    };
  }
  return clonePoint(points.at(-1));
}

function splitEdgePoints(points, age) {
  const today = pointAtAge(points, age);
  const completed = [];
  const possible = [];
  for (const point of points) {
    if (point.age < age) completed.push(clonePoint(point));
    else if (point.age > age) possible.push(clonePoint(point));
  }
  appendPoints(completed, [today]);
  possible.unshift(clonePoint(today));
  return { today, completed, possible };
}

function cloneAnnotation(value, active = new WeakSet()) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (typeof value !== 'object') return undefined;
  if (active.has(value)) throw new RangeError('annotation metadata must not contain cycles');
  active.add(value);
  let copy;
  if (Array.isArray(value)) {
    copy = value.map(item => cloneAnnotation(item, active));
  } else {
    copy = {};
    for (const [key, item] of Object.entries(value)) {
      const cloned = cloneAnnotation(item, active);
      if (cloned !== undefined) copy[key] = cloned;
    }
  }
  active.delete(value);
  return copy;
}

function scenarioInputs(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return {};
  return input;
}

/**
 * Project one stable assumed route through a generated tree. A value in
 * choices is honored only when it names an edge outgoing from that exact
 * choice-point ID; unknown keys and mismatches fall back to the seeded
 * assumption. Annotation metadata is cloned under choicePoint.annotation and
 * never participates in route selection or geometry.
 */
export function projectScenario(network, input = {}) {
  if (!network || !Array.isArray(network.nodes) || !Array.isArray(network.edges)
      || !Array.isArray(network.choicePoints) || typeof network.rootId !== 'string'
      || !Number.isFinite(network.maxAge)) {
    throw new RangeError('network must follow the generateNetwork contract');
  }
  const settings = scenarioInputs(input);
  const numericAge = Number(settings.age ?? 8);
  const age = clamp(Number.isFinite(numericAge) ? numericAge : 8, 0, network.maxAge);
  const choiceSeed = typeof settings.choiceSeed === 'string' ? settings.choiceSeed : 'example';
  const choices = settings.choices && typeof settings.choices === 'object' ? settings.choices : {};
  const annotations = settings.annotations && typeof settings.annotations === 'object'
    ? settings.annotations : {};
  const nodeById = new Map(network.nodes.map(node => [node.id, node]));
  const edgeById = new Map(network.edges.map(edge => [edge.id, edge]));
  const root = nodeById.get(network.rootId);
  if (!root) throw new RangeError('network rootId must identify a node');
  const usesExitBoundaries = network.config?.boundaryMode === 'exit';
  const reachableMemo = new Map();
  const reachableUntil = (edgeId, visiting = new Set()) => {
    const edge = edgeById.get(edgeId);
    if (Number.isFinite(edge?.reachableUntilAge)) return edge.reachableUntilAge;
    if (reachableMemo.has(edgeId)) return reachableMemo.get(edgeId);
    if (!edge || visiting.has(edgeId)) throw new RangeError('network must not contain a cycle');
    const target = nodeById.get(edge.to);
    if (!target) throw new RangeError('route edges must end at valid nodes');
    visiting.add(edgeId);
    const reachable = target.outgoing.length === 0
      ? target.age
      : Math.max(...target.outgoing.map(childId => reachableUntil(childId, visiting)));
    visiting.delete(edgeId);
    reachableMemo.set(edgeId, reachable);
    return reachable;
  };

  const routeEdges = [];
  const routeNodes = [root];
  const selections = [];
  const visited = new Set();
  let node = root;
  while (node.outgoing.length > 0) {
    if (visited.has(node.id)) throw new RangeError('network must not contain a cycle');
    visited.add(node.id);
    const outgoing = node.outgoing.filter(edgeId => edgeById.get(edgeId)?.from === node.id);
    if (outgoing.length !== node.outgoing.length || outgoing.length === 0) {
      throw new RangeError('node outgoing IDs must identify edges from that node');
    }
    let edgeId = outgoing[0];
    if (outgoing.length > 1) {
      const explicit = choices[node.id];
      const validExplicit = typeof explicit === 'string' && outgoing.includes(explicit);
      let assumedOptions = outgoing;
      if (usesExitBoundaries && !validExplicit) {
        const furthestAge = Math.max(...outgoing.map(candidate => reachableUntil(candidate)));
        assumedOptions = outgoing.filter(candidate => (
          reachableUntil(candidate) >= furthestAge - 1e-9
        ));
      }
      edgeId = validExplicit
        ? explicit
        : assumedOptions[Math.floor(randomUnit(
          `${network.seed}|scenario|${choiceSeed}|${node.id}`,
        ) * assumedOptions.length)];
      selections.push({ pointId: node.id, edgeId, assumed: !validExplicit });
    }
    const edge = edgeById.get(edgeId);
    const target = nodeById.get(edge.to);
    if (!target || !Array.isArray(edge.points) || edge.points.length < 2) {
      throw new RangeError('route edges must end at valid nodes and contain points');
    }
    routeEdges.push(edge);
    routeNodes.push(target);
    node = target;
    if (routeEdges.length > network.edges.length) throw new RangeError('network must be finite');
  }
  if (routeEdges.length === 0) throw new RangeError('network root must reach at least one edge');
  const routeTerminal = routeNodes.at(-1);
  const routeEndAge = routeEdges.at(-1).points.at(-1).age;
  const routeExited = routeTerminal?.terminationReason === 'boundary-exit'
    && age > routeEndAge + 1e-9;

  const spine = [];
  for (const edge of routeEdges) appendPoints(spine, edge.points);
  let currentIndex = routeEdges.length - 1;
  if (age < network.maxAge) {
    const found = routeEdges.findIndex(edge => {
      const startAge = edge.points[0].age;
      const endAge = edge.points.at(-1).age;
      return age >= startAge && age < endAge;
    });
    if (found >= 0) currentIndex = found;
  }
  const currentEdge = routeEdges[currentIndex];
  const split = splitEdgePoints(currentEdge.points, age);
  const today = { ...split.today, edgeId: currentEdge.id };
  const past = [];
  for (let index = 0; index < currentIndex; index += 1) appendPoints(past, routeEdges[index].points);
  appendPoints(past, split.completed);
  const future = [];
  appendPoints(future, split.possible);
  for (let index = currentIndex + 1; index < routeEdges.length; index += 1) {
    appendPoints(future, routeEdges[index].points);
  }

  const completedIds = new Set();
  for (const edge of routeEdges) {
    if (edge.points.at(-1).age <= age) completedIds.add(edge.id);
  }
  const possibleIds = new Set();
  const exactNode = routeNodes.find(routeNode => routeNode.age === age);
  const descendants = [exactNode?.id ?? currentEdge.to];
  if (!exactNode && currentEdge.points[0].age < age && age < currentEdge.points.at(-1).age) {
    possibleIds.add(currentEdge.id);
  }
  const walkedDescendants = new Set();
  while (descendants.length > 0) {
    const nodeId = descendants.shift();
    if (walkedDescendants.has(nodeId)) continue;
    walkedDescendants.add(nodeId);
    const descendantNode = nodeById.get(nodeId);
    if (!descendantNode) continue;
    for (const edgeId of descendantNode.outgoing) {
      const edge = edgeById.get(edgeId);
      if (!edge) continue;
      possibleIds.add(edgeId);
      descendants.push(edge.to);
    }
  }

  const untakenOrigins = new Map();
  const markUntakenSubtree = (firstEdgeId, origin) => {
    const pendingEdges = [firstEdgeId];
    while (pendingEdges.length > 0) {
      const edgeId = pendingEdges.shift();
      if (untakenOrigins.has(edgeId)) continue;
      const edge = edgeById.get(edgeId);
      if (!edge) continue;
      untakenOrigins.set(edgeId, origin);
      const target = nodeById.get(edge.to);
      if (target) pendingEdges.push(...target.outgoing);
    }
  };
  for (let index = 0; index < routeEdges.length; index += 1) {
    const routeNode = routeNodes[index];
    if (routeNode.age >= age || routeNode.outgoing.length < 2) continue;
    const origin = { untakenAtAge: routeNode.age, untakenAtNodeId: routeNode.id };
    for (const edgeId of routeNode.outgoing) {
      if (edgeId !== routeEdges[index].id) markUntakenSubtree(edgeId, origin);
    }
  }

  const isInsideCurrent = currentEdge.points[0].age < age
    && age < currentEdge.points.at(-1).age;
  const segments = [];
  for (const edge of network.edges) {
    if (edge.id === currentEdge.id && isInsideCurrent) {
      segments.push({
        id: `${edge.id}:completed`, edgeId: edge.id, state: 'completed', points: split.completed,
      });
      segments.push({
        id: `${edge.id}:possible`, edgeId: edge.id, state: 'possible', points: split.possible,
      });
    } else {
      const state = completedIds.has(edge.id)
        ? 'completed'
        : possibleIds.has(edge.id) ? 'possible' : 'untaken';
      const segment = { id: edge.id, edgeId: edge.id, state, points: edge.points.map(clonePoint) };
      if (state === 'untaken') Object.assign(segment, untakenOrigins.get(edge.id));
      segments.push(segment);
    }
  }

  const choicePoints = network.choicePoints.map(point => {
    const copy = {
      id: point.id,
      age: point.age,
      x: point.x,
      y: point.y,
      options: [...point.options],
    };
    if (Object.hasOwn(annotations, point.id)) {
      const annotation = cloneAnnotation(annotations[point.id]);
      if (annotation !== undefined) copy.annotation = annotation;
    }
    return copy;
  });

  return deepFreeze({
    age,
    routeEndAge,
    routeExited,
    today,
    spine,
    past,
    future,
    segments,
    selections,
    choicePoints,
  });
}
