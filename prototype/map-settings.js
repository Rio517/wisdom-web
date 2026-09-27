import { LAB_DEFAULTS, networkOptionsForLab } from '../src/engine/lab-settings.js';

// These control a drawing, never probabilities or scores for a person's life.
export const MAP_SETTING_LIMITS = Object.freeze({
  openingBurst: [0, 1], splitRate: [0, 1], curvature: [0, 9],
  congestion: [0, 3], lineWidth: [1.2, 4], fadeDistance: [80, 700], fadeFloor: [0, 1],
});

// The lesson draws what the lab settled on (LAB_DEFAULTS): laminar growth,
// a funnel of futures after Today, a few paths that end.
export const DEFAULT_MAP_SETTINGS = Object.freeze({
  variant: LAB_DEFAULTS.variant, seed: LAB_DEFAULTS.seed, choiceSeed: LAB_DEFAULTS.choiceSeed,
  openingBurst: LAB_DEFAULTS.openingBurst, splitRate: LAB_DEFAULTS.splitProbability,
  curvature: LAB_DEFAULTS.turnStrength, congestion: LAB_DEFAULTS.crowdingStrength,
  lineWidth: LAB_DEFAULTS.lineWidth, fadeDistance: LAB_DEFAULTS.fadeDistance,
  fadeFloor: LAB_DEFAULTS.fadeFloor,
});

export const MAP_VIEWS = Object.freeze({
  retained: 'Full context', fading: 'Fading alternatives', hybrid: 'Quiet context',
});

export function normalizeMapSettings(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const settings = { ...DEFAULT_MAP_SETTINGS };
  if (Object.hasOwn(MAP_VIEWS, source.variant)) settings.variant = source.variant;
  for (const field of ['seed', 'choiceSeed']) {
    if (typeof source[field] === 'string' && source[field].trim() && source[field].length <= 80) {
      settings[field] = source[field];
    }
  }
  for (const [field, [minimum, maximum]] of Object.entries(MAP_SETTING_LIMITS)) {
    if (Number.isFinite(source[field])) settings[field] = Math.max(minimum, Math.min(maximum, source[field]));
  }
  return Object.freeze(settings);
}

export function scenarioForSettings(input) {
  const settings = normalizeMapSettings(input);
  const lab = {
    ...LAB_DEFAULTS,
    openingBurst: settings.openingBurst,
    splitProbability: settings.splitRate,
    turnStrength: settings.curvature,
    crowdingStrength: settings.congestion,
  };
  // The generator controls the lab derives, less the frame: the lesson sets
  // its own size and a hundred-year horizon, and its envelope age per view.
  const {
    seed: _seed, width: _width, height: _height, maxAge: _maxAge, envelopeAge: _envelopeAge,
    ...networkOptions
  } = networkOptionsForLab(lab);
  return {
    networkSeed: settings.seed,
    choiceSeed: settings.choiceSeed,
    networkOptions,
    // The fan of futures after Today is drawn from these, as in the lab.
    fan: lab,
  };
}

export function readMapSettings(input) {
  const url = new URL(input);
  const encoded = url.searchParams.get('tune');
  let source = {};
  if (encoded && encoded.length <= 1800) {
    try {
      const parsed = JSON.parse(encoded);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) source = parsed;
    } catch { /* Invalid shared settings leave the usable defaults intact. */ }
  }
  return normalizeMapSettings({ ...source, variant: url.searchParams.get('paths') });
}

export function mapSettingsURL(input, href) {
  const settings = normalizeMapSettings(input);
  const url = new URL(href);
  url.searchParams.delete('paths');
  url.searchParams.delete('tune');
  if (settings.variant !== DEFAULT_MAP_SETTINGS.variant) url.searchParams.set('paths', settings.variant);
  const changed = Object.fromEntries(Object.entries(settings)
    .filter(([field, value]) => field !== 'variant' && value !== DEFAULT_MAP_SETTINGS[field]));
  if (Object.keys(changed).length) url.searchParams.set('tune', JSON.stringify(changed));
  return url;
}
