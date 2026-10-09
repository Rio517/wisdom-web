import test from 'node:test';
import assert from 'node:assert/strict';
import * as labRenderer from '../src/engine/lab-renderer.js';

const point = (age, y = 370) => ({ age, x: 40 + 11.8 * age, y });

function labData() {
  const complete = { id: 'e-complete', from: 'root', to: 'fork', points: [point(0), point(20)] };
  const possible = { id: 'e-possible', from: 'fork', to: 'future', points: [point(20), point(100, 250)] };
  const untaken = { id: 'e-untaken', from: 'fork', to: 'other', points: [point(20), point(100, 600)] };
  const network = {
    maxAge: 100,
    bounds: { x: 0, y: 0, width: 1260, height: 740 },
    edges: [complete, possible, untaken],
  };
  const spine = [point(0), point(12), point(20), point(25), point(40), point(60, 330), point(100, 250)];
  const projection = {
    age: 40,
    today: point(40),
    past: spine.slice(0, 5),
    spine,
    segments: [
      { id: complete.id, edgeId: complete.id, state: 'completed', points: complete.points },
      { id: possible.id, edgeId: possible.id, state: 'possible', points: [point(40), point(100, 250)] },
      {
        id: untaken.id, edgeId: untaken.id, state: 'untaken', points: untaken.points,
        untakenAtAge: 20, untakenAtNodeId: 'fork',
      },
    ],
  };
  return { network, projection };
}

function canvasHarness({ ratio = 1 } = {}) {
  const operations = [];
  const stack = [];
  const context = {
    strokeStyle: '', fillStyle: '', lineWidth: 0, globalAlpha: 1,
    globalCompositeOperation: 'source-over', font: '', textAlign: '', textBaseline: '',
    lineCap: '', lineJoin: '', dash: [], clipRect: null, pendingRect: null,
    save() {
      stack.push({
        strokeStyle: context.strokeStyle, fillStyle: context.fillStyle,
        lineWidth: context.lineWidth, globalAlpha: context.globalAlpha,
        globalCompositeOperation: context.globalCompositeOperation,
        font: context.font, textAlign: context.textAlign, textBaseline: context.textBaseline,
        lineCap: context.lineCap, lineJoin: context.lineJoin, dash: [...context.dash],
        clipRect: context.clipRect ? { ...context.clipRect } : null,
      });
    },
    restore() { Object.assign(context, stack.pop()); },
    setTransform(...values) { context.transform = values; },
    clearRect() { operations.push({ type: 'clear' }); },
    beginPath() { context.pendingRect = null; context.path = []; },
    moveTo(x, y) { context.path.push({ type: 'move', x, y }); },
    lineTo(x, y) { context.path.push({ type: 'line', x, y }); },
    bezierCurveTo(x1, y1, x2, y2, x, y) {
      context.path.push({ type: 'curve', x1, y1, x2, y2, x, y });
    },
    arc(x, y, radius) { context.arcState = { x, y, radius }; },
    rect(x, y, width, height) { context.pendingRect = { x, y, width, height }; },
    clip() {
      context.clipRect = context.pendingRect ? { ...context.pendingRect } : null;
      operations.push({ type: 'clip', rect: context.clipRect });
    },
    setLineDash(value) { context.dash = [...value]; },
    stroke() {
      operations.push({
        type: 'stroke', color: context.strokeStyle, width: context.lineWidth,
        alpha: context.globalAlpha, dash: [...context.dash], composite: context.globalCompositeOperation,
        clipRect: context.clipRect ? { ...context.clipRect } : null,
        path: [...context.path],
      });
    },
    fill() {
      operations.push({
        type: 'dot', color: context.fillStyle, alpha: context.globalAlpha,
        radius: context.arcState?.radius,
      });
    },
    fillRect() {
      operations.push({ type: 'mask', fill: context.fillStyle, composite: context.globalCompositeOperation });
    },
    fillText(text, x, y) {
      operations.push({
        type: 'label', text, x, y, color: context.fillStyle, font: context.font,
      });
    },
    createLinearGradient(...coordinates) {
      const gradient = {
        coordinates, stops: [],
        addColorStop(at, color) { gradient.stops.push([at, color]); },
      };
      return gradient;
    },
  };
  const rect = { left: 100, top: 50, width: 660, height: 420, right: 760, bottom: 470 };
  const canvas = {
    dataset: {}, width: 0, height: 0,
    getContext: () => context,
    getBoundingClientRect: () => rect,
    ownerDocument: { defaultView: { devicePixelRatio: ratio } },
  };
  return { canvas, context, operations, rect };
}

test('route strokes curve continuously through points without overshooting or moving anchors', () => {
  const harness = canvasHarness();
  const points = [point(0, 370), point(15, 180), point(40, 250), point(100, 500)];
  const network = {
    maxAge: 100, bounds: { x: 0, y: 0, width: 1260, height: 740 },
    edges: [{ id: 'curved', points }],
  };
  labRenderer.createLabRenderer(harness.canvas).paint(network);
  const path = harness.operations.find(operation => operation.type === 'stroke').path;
  const curves = path.filter(command => command.type === 'curve');
  assert.equal(curves.length, 3, 'each sampled interval needs an actual curve, not a straight polygon edge');
  const view = labRenderer.fitOverview(network.bounds, harness.rect);
  const anchors = points.map(point => view.world(point));
  for (let index = 0; index < curves.length; index += 1) {
    const curve = curves[index];
    const start = anchors[index];
    const end = anchors[index + 1];
    assert.deepEqual({ x: curve.x, y: curve.y }, end, 'the curve must pass through its generated anchor');
    assert.ok(start.x <= curve.x1 && curve.x1 <= curve.x2 && curve.x2 <= end.x,
      'ordered horizontal controls prevent backward curls');
    const low = Math.min(start.y, end.y);
    const high = Math.max(start.y, end.y);
    assert.ok(curve.y1 >= low && curve.y1 <= high && curve.y2 >= low && curve.y2 <= high,
      'controls must stay inside the interval envelope, preventing new bumps or overshoot');
    if (index > 0) {
      const previous = curves[index - 1];
      const incomingSlope = (previous.y - previous.y2) / (previous.x - previous.x2);
      const outgoingSlope = (curve.y1 - start.y) / (curve.x1 - start.x);
      assert.ok(Math.abs(incomingSlope - outgoingSlope) < 1e-9,
        'unevenly spaced intervals must share one continuous tangent');
    }
  }
});

test('overview fitting preserves aspect ratio and maps pointer x to the bounded life age', async () => {
  assert.equal(typeof labRenderer.fitOverview, 'function');
  assert.equal(typeof labRenderer.ageForClientX, 'function');

  const bounds = { x: 0, y: 0, width: 1260, height: 740 };
  const rect = { left: 100, top: 50, width: 660, height: 420 };
  const view = labRenderer.fitOverview(bounds, rect);
  const topLeft = view.world({ x: 0, y: 0 });
  const bottomRight = view.world({ x: 1260, y: 740 });

  assert.ok(Number.isFinite(view.scale) && view.scale > 0);
  assert.ok(topLeft.y >= 10, 'starts at or below the top padding');
  assert.ok(topLeft.x >= 30 && bottomRight.x <= 630);
  assert.ok(bottomRight.y <= 392);
  const roundTrip = view.source(view.world({ x: 420, y: 300 }));
  assert.ok(Math.abs(roundTrip.x - 420) < 1e-9 && Math.abs(roundTrip.y - 300) < 1e-9);

  const age0X = rect.left + view.world({ x: 40, y: 0 }).x;
  const age100X = rect.left + view.world({ x: 1220, y: 0 }).x;
  assert.equal(labRenderer.ageForClientX(age0X, rect, bounds, 100), 0);
  assert.equal(labRenderer.ageForClientX(age100X, rect, bounds, 100), 100);
  assert.equal(labRenderer.ageForClientX(-1000, rect, bounds, 100), 0);
  assert.equal(labRenderer.ageForClientX(5000, rect, bounds, 100), 100);
});

test('the seventy-year lab lens puts age twenty-five at the midpoint and pointer lookup reverses it', () => {
  const bounds = { x: 0, y: 0, width: 1260, height: 740 };
  const rect = { left: 100, top: 50, width: 1000, height: 740 };
  const view = labRenderer.fitOverview(bounds, rect, undefined, 70);
  const beginning = view.world({ x: 40, y: 370 });
  const end = view.world({ x: 1220, y: 370 });
  const middle = view.world({ x: 40 + 1180 * 25 / 70, y: 370 });
  assert.ok(Math.abs(middle.x - (beginning.x + end.x) / 2) < 1e-8);
  assert.equal(view.world({ x: 0, y: 0 }).y, 10, 'use the available height above the paths');
  assert.equal(view.world({ x: 0, y: 740 }).y, 712, 'use the available height below the paths');
  for (const age of [0, 12, 25, 40, 60, 70]) {
    const position = view.world({ x: 40 + 1180 * age / 70, y: 370 });
    assert.ok(Math.abs(labRenderer.ageForClientX(rect.left + position.x, rect, bounds, 70) - age) < 1e-8);
  }
});

test('an offscreen route keeps the age divider honest without inventing a Today dot', () => {
  const { canvas, operations } = canvasHarness();
  const { network, projection } = labData();
  projection.routeExited = true;
  projection.routeEndAge = 20;
  projection.today = point(20, -40);
  labRenderer.createLabRenderer(canvas).paint(network, projection, { edgeFade: 0 }, true);
  assert.equal(operations.filter(item => item.type === 'dot' && item.radius === 6).length, 0);
  const view = labRenderer.fitOverview(network.bounds, canvas.getBoundingClientRect());
  const divider = operations.find(item => item.type === 'stroke' && item.dash.length);
  assert.equal(divider.path[0].x, view.world(point(40)).x,
    'the divider follows the requested age, not the age when an offscreen path stopped');
});

test('initial lab paint fits every unique edge at high resolution with only the Beginning label', () => {
  assert.equal(typeof labRenderer.createLabRenderer, 'function');
  if (!labRenderer.createLabRenderer) return;
  const { canvas, context, operations } = canvasHarness();
  const { network, projection } = labData();
  const renderer = labRenderer.createLabRenderer(canvas);

  renderer.paint(network, projection, { lineWidth: 2.2, edgeFade: 0 }, false);

  assert.equal(canvas.width, 1320);
  assert.equal(canvas.height, 840);
  assert.deepEqual(context.transform, [2, 0, 0, 2, 0, 0]);
  const strokes = operations.filter(item => item.type === 'stroke');
  assert.equal(strokes.length, network.edges.length);
  assert.ok(strokes.every(item => item.color === '#8daa91' && item.width === 2.2
    && item.alpha === 1 && item.dash.length === 0));
  const labels = operations.filter(item => item.type === 'label');
  assert.deepEqual(labels.map(item => item.text), ['Beginning']);
  assert.ok(labels.every(item => item.color === '#596860'
    && item.font === '400 15px "Avenir Next", AvenirNext, "Segoe UI", sans-serif'));
  assert.equal(operations.filter(item => item.type === 'mask').length, 0,
    'zero edge fade does not apply a boundary mask');
  assert.equal(canvas.dataset.age, '40');
  assert.equal(canvas.dataset.ready, 'true');
});

test('selected lab paint layers gray, possible, masked field, and one continuous history in that order', () => {
  if (!labRenderer.createLabRenderer) return;
  const { canvas, operations, rect } = canvasHarness({ ratio: 4 });
  const { network, projection } = labData();
  const renderer = labRenderer.createLabRenderer(canvas);

  renderer.paint(network, projection, {
    variant: 'retained', lineWidth: 2.2, fadeDistance: 200,
    grayOpacity: 0.45, edgeFade: 0.2,
  }, true);

  assert.equal(canvas.width, 1980, 'backing resolution is capped at 3x');
  const gray = operations.findIndex(item => item.type === 'stroke'
    && typeof item.color === 'object' && item.color.stops[0]?.[1] === '#bcc6c0');
  const possible = operations.findIndex(item => item.type === 'stroke' && item.color === '#8daa91');
  const mask = operations.findIndex(item => item.type === 'mask');
  const history = operations.findIndex(item => item.type === 'stroke' && item.color === '#285442'
    && item.dash.length === 0);
  assert.ok(gray >= 0 && gray < possible && possible < mask && mask < history);
  const masks = operations.filter(item => item.type === 'mask');
  const view = labRenderer.fitOverview(network.bounds, rect);
  const fieldStart = view.world({ x: 40, y: 0 }).x;
  const fieldEnd = view.world({ x: 1220, y: 0 }).x;
  assert.deepEqual(masks[0].fill.coordinates, [
    fieldEnd - (fieldEnd - fieldStart) * 0.2, 0, fieldEnd, 0,
  ]);
  assert.deepEqual(masks[1].fill.coordinates, [
    0, view.world({ x: 0, y: 0 }).y, 0, view.world({ x: 0, y: 740 }).y,
  ]);
  assert.ok(masks[0].fill.coordinates[2] < rect.width,
    'right fade reaches zero where the generated routes end, before the Canvas margin');
  assert.equal(operations[gray].alpha, 0.45);
  assert.equal(operations[gray].width, 2.2);
  assert.equal(operations[possible].width, 2.2);
  assert.equal(operations[history].width, 3.5);
  assert.equal(operations.filter(item => item.type === 'stroke' && item.color === '#285442'
    && item.dash.length === 0).length, 1, 'history is stitched into one stroke');
  assert.equal(operations.filter(item => item.type === 'dot').length, 4,
    'birth, two earlier stops, and today use plain dots without numbered badges');
  const labels = operations.filter(item => item.type === 'label');
  assert.deepEqual(labels.map(item => item.text), [
    'Beginning', 'Today · 40',
  ]);
  assert.ok(labels.every(item => item.color === '#596860'
    && item.font.startsWith('400 15px ')), 'Canvas labels stay regular-weight and quiet');
  assert.ok(labels.every(item => item.y === rect.height - 14),
    'Beginning and Today sit below the path field without crossing the lines');

  const age25 = labRenderer.ageForClientX(
    rect.left + labRenderer.fitOverview(network.bounds, rect).world(point(25)).x,
    rect, network.bounds, network.maxAge,
  );
  assert.ok(Math.abs(age25 - renderer.ageAt(
    rect.left + labRenderer.fitOverview(network.bounds, rect).world(point(25)).x,
  )) < 1e-9);
});

test('near the start, Today takes precedence over an overlapping Beginning label', () => {
  const { canvas, operations } = canvasHarness();
  const { network, projection } = labData();
  labRenderer.createLabRenderer(canvas).paint(network,
    { ...projection, age: 1, today: point(1) }, { edgeFade: 0 }, true);
  assert.deepEqual(operations.filter(item => item.type === 'label').map(item => item.text), ['Today · 1']);
});

test('fading gray routes combine the configured gray opacity with a flat alpha gradient', () => {
  if (!labRenderer.createLabRenderer) return;
  const { canvas, operations } = canvasHarness();
  const { network, projection } = labData();
  const renderer = labRenderer.createLabRenderer(canvas);

  renderer.paint(network, projection, {
    variant: 'fading', lineWidth: 2.6, fadeDistance: 200,
    grayOpacity: 0.4, edgeFade: 0,
  }, true);

  const faded = operations.find(item => item.type === 'stroke'
    && typeof item.color === 'object' && item.width === 2.6);
  assert.ok(faded);
  assert.equal(faded.alpha, 0.4);
  assert.deepEqual(faded.color.stops, [[0, '#bcc6c0'], [1, '#bcc6c000']]);
});

test('a faded floor carries an old alternative to Today, where it dissolves into the line', () => {
  const { canvas, operations, rect } = canvasHarness();
  const { network, projection } = labData();
  labRenderer.createLabRenderer(canvas).paint(network, projection, {
    variant: 'fading', lineWidth: 2.2, grayOpacity: 0.5, fadeDistance: 100,
    fadeFloor: 0.3, todayFade: 60, edgeFade: 0,
  }, true);
  const view = labRenderer.fitOverview(network.bounds, rect);
  const todayX = view.world(projection.today).x;
  const gray = operations.find(item => item.type === 'stroke'
    && typeof item.color === 'object' && item.color.stops[0]?.[1] === '#bcc6c0');

  assert.ok(gray);
  // Full at the missed fork, down to the floor over the fade distance, held
  // there, then gone at Today: four stops, and the last one sits on the line.
  const colors = gray.color.stops.map(stop => stop[1]);
  assert.equal(colors.length, 4);
  assert.equal(colors[0], '#bcc6c0');
  assert.equal(colors[1], '#bcc6c04d', '30% floor');
  assert.equal(colors[2], '#bcc6c04d', 'held at the floor until the dissolve');
  assert.equal(colors[3], '#bcc6c000');
  assert.equal(gray.color.coordinates[2], todayX);
  const offsets = gray.color.stops.map(stop => stop[0]);
  assert.ok(offsets.every((offset, index) => index === 0 || offset >= offsets[index - 1]));
});

test('every selected gray variant fades fully and is clipped at Today', () => {
  const { network, projection } = labData();
  for (const variant of ['retained', 'fading', 'hybrid']) {
    const { canvas, operations, rect } = canvasHarness();
    labRenderer.createLabRenderer(canvas).paint(network, projection, {
      variant, lineWidth: 2.2, grayOpacity: 0.5, fadeDistance: 200, edgeFade: 0,
    }, true);
    const view = labRenderer.fitOverview(network.bounds, rect);
    const todayX = view.world(projection.today).x;
    const gray = operations.find(item => item.type === 'stroke'
      && typeof item.color === 'object' && item.color.stops[0]?.[1] === '#bcc6c0');
    const possible = operations.find(item => item.type === 'stroke' && item.color === '#8daa91');

    assert.ok(gray, `${variant} gray uses an alpha fade`);
    assert.equal(gray.color.stops.at(-1)[1], '#bcc6c000');
    assert.ok(gray.color.coordinates[2] <= todayX);
    if (variant === 'retained') assert.equal(gray.color.coordinates[2], todayX);
    assert.deepEqual(gray.clipRect, { x: 0, y: 0, width: todayX, height: rect.height });
    assert.equal(possible.clipRect, null, 'possible future is not clipped by the gray boundary');
  }
});

test('selected paint supplies finite presentation defaults when style controls are omitted', () => {
  const { canvas, operations } = canvasHarness();
  const { network, projection } = labData();
  labRenderer.createLabRenderer(canvas).paint(network, projection, {}, true);

  const gray = operations.find(item => item.type === 'stroke'
    && typeof item.color === 'object' && item.color.stops[0]?.[1] === '#bcc6c0');
  assert.ok(gray.color.coordinates.every(Number.isFinite));
});

test('optional fresh fan replaces only base possible strokes while gray and history styling stay unchanged', () => {
  const baselineHarness = canvasHarness();
  const fanHarness = canvasHarness();
  const { network, projection } = labData();
  const settings = {
    variant: 'retained', lineWidth: 2.2, grayOpacity: 0.45,
    fadeDistance: 200, edgeFade: 0,
  };
  labRenderer.createLabRenderer(baselineHarness.canvas)
    .paint(network, projection, settings, true);
  const future = {
    edges: [
      { id: 'fresh-high', points: [projection.today, point(100, 90)] },
      { id: 'fresh-low', points: [projection.today, point(100, 650)] },
    ],
  };
  labRenderer.createLabRenderer(fanHarness.canvas)
    .paint(network, projection, settings, true, future);

  const strokes = operations => operations.filter(item => item.type === 'stroke');
  const baseStrokes = strokes(baselineHarness.operations);
  const fanStrokes = strokes(fanHarness.operations);
  assert.equal(baseStrokes.filter(item => item.color === '#8daa91').length, 1);
  assert.equal(fanStrokes.filter(item => item.color === '#8daa91').length, 2);
  const semanticStroke = (strokes, semantic) => strokes.filter(item => semantic === 'gray'
    ? typeof item.color === 'object' && item.color.stops[0]?.[1] === '#bcc6c0'
    : item.color === '#285442');
  const observableStroke = item => ({
    ...item,
    color: typeof item.color === 'object'
      ? { coordinates: item.color.coordinates, stops: item.color.stops }
      : item.color,
  });
  for (const semantic of ['gray', 'history']) assert.deepEqual(
    semanticStroke(fanStrokes, semantic).map(observableStroke),
    semanticStroke(baseStrokes, semantic).map(observableStroke),
  );
});

test('missing or throwing Canvas contexts return the inert lab fallback', () => {
  for (const canvas of [
    { getContext: () => null },
    { getContext: () => { throw new Error('blocked'); } },
  ]) {
    const renderer = labRenderer.createLabRenderer?.(canvas);
    assert.equal(renderer?.failed, true);
    assert.equal(renderer?.paint(), undefined);
    assert.equal(renderer?.ageAt(200), 0);
  }
});
