import test from 'node:test';
import assert from 'node:assert/strict';
import * as mapView from '../prototype/map-view.js';

const overlaps = (a, b, gap = 0) => !(
  a.x + a.width + gap <= b.x
  || b.x + b.width + gap <= a.x
  || a.y + a.height + gap <= b.y
  || b.y + b.height + gap <= a.y
);

test('unplaceable callouts defer to the semantic outcome list instead of throwing or covering controls', () => {
  for (const [bounds, obstacles] of [
    [{ width: 120, height: 35 }, []],
    [{ width: 500, height: 260 }, [{ x: 0, y: 0, width: 500, height: 260 }]],
    [{ width: 0, height: 0 }, []],
  ]) {
    const endpoints = [{ x: 60, y: 18 }];
    const [placed] = mapView.layoutOutcomeLabels(endpoints, obstacles, bounds, [{ width: 148, height: 42 }]);
    assert.deepEqual(placed.endpoint, endpoints[0]);
    assert.equal(placed.label, null);
    assert.equal(placed.leader, null);
  }
});

test('outcome labels use their rendered rectangles to stay in bounds and avoid controls', () => {
  assert.equal(typeof mapView.layoutOutcomeLabels, 'function', 'rectangle-aware label layout must be exported');
  if (!mapView.layoutOutcomeLabels) return;

  const endpoints = [
    { x: 264, y: 245 },
    { x: 332, y: 226 },
    { x: 401, y: 218 },
    { x: 351, y: 290 },
    { x: 474, y: 274 },
  ];
  const originalEndpoints = structuredClone(endpoints);
  const obstacles = [
    { x: 152, y: 215, width: 44, height: 44 },
    { x: 318, y: 183, width: 44, height: 44 },
    { x: 302, y: 354, width: 98, height: 25 },
  ];
  const labelSizes = [
    { width: 148, height: 42 },
    { width: 148, height: 61 },
    { width: 148, height: 42 },
    { width: 148, height: 61 },
    { width: 148, height: 42 },
  ];
  const bounds = { width: 680, height: 399 };

  const placed = mapView.layoutOutcomeLabels(endpoints, obstacles, bounds, labelSizes);

  assert.deepEqual(endpoints, originalEndpoints, 'layout must not move route endpoints');
  assert.equal(placed.length, endpoints.length);
  for (const [index, item] of placed.entries()) {
    assert.deepEqual(item.endpoint, endpoints[index]);
    assert.ok(item.label.x >= 6 && item.label.y >= 6, 'label clears the near canvas edge');
    assert.ok(item.label.x + item.label.width <= bounds.width - 6, 'label clears the far horizontal edge');
    assert.ok(item.label.y + item.label.height <= bounds.height - 6, 'label clears the far vertical edge');
    assert.ok(obstacles.every(obstacle => !overlaps(item.label, obstacle, 6)), 'label clears full control rectangles');
    assert.ok(placed.slice(0, index).every(other => !overlaps(item.label, other.label, 6)), 'labels do not overlap');
  }
});

test('outcome leaders terminate on the nearest label edge', () => {
  assert.equal(typeof mapView.layoutOutcomeLabels, 'function', 'rectangle-aware label layout must be exported');
  if (!mapView.layoutOutcomeLabels) return;

  const [placed] = mapView.layoutOutcomeLabels(
    [{ x: 120, y: 100 }],
    [],
    { width: 500, height: 260 },
    [{ width: 148, height: 42 }],
  );
  const { endpoint, label, leader } = placed;
  const center = { x: label.x + label.width / 2, y: label.y + label.height / 2 };
  const onVerticalEdge = Math.abs(leader.end.x - label.x) < 0.001
    || Math.abs(leader.end.x - (label.x + label.width)) < 0.001;
  const onHorizontalEdge = Math.abs(leader.end.y - label.y) < 0.001
    || Math.abs(leader.end.y - (label.y + label.height)) < 0.001;

  assert.ok(onVerticalEdge || onHorizontalEdge, 'leader end lies on a label edge');
  assert.ok(leader.end.x >= label.x - 0.001 && leader.end.x <= label.x + label.width + 0.001);
  assert.ok(leader.end.y >= label.y - 0.001 && leader.end.y <= label.y + label.height + 0.001);
  assert.ok(leader.length < Math.hypot(center.x - endpoint.x, center.y - endpoint.y), 'leader stops before the label center');
  assert.ok(Number.isFinite(leader.length) && Number.isFinite(leader.angle));
});

function withMapDOM(run) {
  const previous = Object.fromEntries([
    'document', 'window', 'getComputedStyle', 'ResizeObserver',
    'requestAnimationFrame', 'cancelAnimationFrame',
  ].map(name => [name, globalThis[name]]));
  const elements = [];
  const makeElement = tag => {
    const listeners = {};
    const element = {
      tag, className: '', dataset: {}, style: {}, hidden: false, textContent: '', children: [],
      classList: { contains: name => element.className.split(' ').includes(name) },
      append(...children) { element.children.push(...children); },
      replaceChildren(...children) { element.children = children; },
      addEventListener(type, handler) { listeners[type] = handler; },
      setAttribute(name, value) { element[name] = value; },
      querySelector(selector) {
        return element.children.find(child => selector === `.${child.className}`) ?? null;
      },
      getBoundingClientRect() {
        return { left: 0, top: 0, right: 148, bottom: 42, width: 148, height: 42 };
      },
      listeners,
    };
    elements.push(element);
    return element;
  };
  const strokes = [];
  const gradients = [];
  const context = {
    strokeStyle: '', fillStyle: '', lineWidth: 0, lineCap: '', lineJoin: '',
    shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    dash: [],
    setTransform(...args) { context.transform = args; },
    clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, fill() {},
    save() {}, restore() {}, fillRect() {},
    setLineDash(value) { context.dash = value; },
    stroke() { strokes.push({ color: context.strokeStyle, width: context.lineWidth, dash: [...context.dash] }); },
    createLinearGradient(...coordinates) {
      const gradient = { coordinates, stops: [], addColorStop(at, color) { gradient.stops.push([at, color]); } };
      gradients.push(gradient);
      return gradient;
    },
  };
  const rect = { left: 0, top: 0, right: 600, bottom: 400, width: 600, height: 400 };
  const canvas = makeElement('canvas');
  canvas.id = 'life-map';
  canvas.getContext = () => context;
  canvas.getBoundingClientRect = () => rect;
  const overlay = makeElement('div');

  globalThis.document = {
    documentElement: {}, activeElement: null,
    createElement: makeElement,
  };
  globalThis.window = { devicePixelRatio: 1 };
  globalThis.getComputedStyle = () => ({
    getPropertyValue(name) {
      return {
        '--color-wisdom-route-future': '#8daa91',
        '--color-wisdom-route-untaken': '#c5cec8',
        '--color-wisdom-route-active': '#285442',
        '--color-wisdom-today': '#6b7b70',
        '--color-wisdom-route-missed': '#9a6a52',
      }[name] ?? '';
    },
  });
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback(); }
  };
  globalThis.requestAnimationFrame = callback => { callback(1000); return 1; };
  globalThis.cancelAnimationFrame = () => {};

  try {
    return run({ canvas, overlay, context, strokes, gradients, elements });
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
}

test('map view keeps CSS geometry aligned while rendering at least 2x with heavier flat defaults', () => {
  withMapDOM(({ canvas, overlay, context, strokes }) => {
    const view = mapView.createMapView({
      canvas, overlay, onInspect() {}, onPreview() {}, lessMotion: () => true,
    });
    view.show({ age: 40, selected: true, overview: false, inspect: null, comparison: 'gap' });

    assert.equal(canvas.width, 1200);
    assert.equal(canvas.height, 800);
    assert.deepEqual(context.transform, [2, 0, 0, 2, 0, 0]);
    assert.ok(strokes.some(stroke => stroke.color === '#c5cec8' && stroke.width === 2.2));
    assert.equal(strokes.filter(stroke => stroke.color === '#285442' && stroke.width === 3.5).length, 1,
      'completed history remains one stitched stroke');
  });
});

test('map view applies current presentation at paint time without folding it into scenario geometry', () => {
  withMapDOM(({ canvas, overlay, strokes }) => {
    let scenarioReads = 0;
    let presentationReads = 0;
    const scenario = {
      networkSeed: 'presentation-isolation',
      choiceSeed: 'one-fictional-route',
      networkOptions: { maxTips: 24, openingBurst: 0.7 },
    };
    const view = mapView.createMapView({
      canvas, overlay, onInspect() {}, onPreview() {}, lessMotion: () => true,
      getScenario() { scenarioReads += 1; return scenario; },
      getPresentation() {
        presentationReads += 1;
        return { variant: 'fading', lineWidth: 2.7, fadeDistance: 180 };
      },
    });
    view.show({ age: 40, selected: true, overview: false, inspect: null, comparison: 'gap' });

    assert.equal(scenarioReads, 1, 'one scenario snapshot aligns map, viewport and overlays for a paint');
    assert.equal(presentationReads, 1, 'presentation settings are read for the current paint');
    const routeStrokes = strokes.filter(stroke => stroke.width === 2.7);
    assert.ok(routeStrokes.some(stroke => typeof stroke.color === 'object'
      && stroke.color.stops.some(([, color]) => color === '#c5cec800')),
    'fading untaken routes use alpha-only gradients');
    assert.ok(routeStrokes.some(stroke => stroke.color === '#8daa91'),
      'possible routes keep their flat color');

    canvas.listeners.pointermove({ clientX: 0, clientY: 0 });
    assert.equal(scenarioReads, 2, 'pointer hit testing reads the same scenario source as painting');
  });
});
