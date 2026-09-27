import { createExplorationSession } from '../src/engine/choices-exploration.js';
import { generateNetwork, projectScenario } from '../src/engine/path-network.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../src/engine/lab-settings.js';
import { createLabRenderer, fitOverview } from '../src/engine/lab-renderer.js';
import { canvasBitmap } from '../src/engine/path-presentation.js';

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x; const dy = b.y - a.y;
  const span = dx * dx + dy * dy;
  const t = span ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / span)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}

export function hitTestPaths(projection, view, point, tolerance = 10) {
  const todayX = view.world(projection.today).x;
  const hits = [];
  for (const segment of projection.segments) {
    if (segment.state === 'untaken' && point.x > todayX - 8) continue;
    let distance = Infinity;
    const points = segment.points.map(view.world);
    for (let i = 1; i < points.length; i++) {
      if (segment.state === 'untaken' && points[i - 1].x > todayX) break;
      distance = Math.min(distance, distanceToSegment(point, points[i - 1], points[i]));
    }
    if (distance <= tolerance) hits.push({ edgeId: segment.edgeId, state: segment.state, distance });
  }
  hits.sort((a, b) => a.distance - b.distance);
  if (!hits.length) return null;
  const distinct = [...new Map(hits.map(hit => [hit.edgeId, hit])).values()];
  const near = distinct.filter(hit => hit.distance <= distinct[0].distance + 2.5);
  return { ...distinct[0], ambiguous: near.length > 1, candidates: near.map(hit => hit.edgeId) };
}

// The overlay follows the lab's bounded Hermite joins without changing its renderer.
function tracePreview(context, points) {
  if (points.length < 2) return;
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / Math.max(1e-8, point.x - points[index].x));
  const tangent = index => {
    if (!index) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const a = slopes[index - 1]; const b = slopes[index];
    return a * b > 0 ? 2 * a * b / (a + b) : 0;
  };
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]; const b = points[i]; const span = (b.x - a.x) / 3;
    context.bezierCurveTo(a.x + span, a.y + tangent(i - 1) * span, b.x - span, b.y - tangent(i) * span, b.x, b.y);
  }
}

export function createChoicesMap({ canvas, overlay, onChange = () => {} }) {
  const renderer = createLabRenderer(canvas);
  let context;
  try { context = overlay?.getContext('2d'); } catch { context = null; }
  const win = canvas.ownerDocument.defaultView;
  let mode = 'overview';
  let exploration = null;
  let confirmedAge = null;
  let illustration = null;
  let overview = null;
  let scene = null;
  let view = null;
  let paintedProjection = null;
  let lastPreview = null;
  let hoveredFork = null;
  let candidateIds = [];
  let pinned = false;
  let pointerStart = null;
  let destroyed = false;
  let scheduled = null;
  let serial = 0;
  const failed = renderer.failed || !context;
  canvas.dataset.failed = String(Boolean(failed));

  function getState() {
    const state = exploration?.snapshot() ?? { age: 0, choices: [], preview: null, canPrevious: false, canNext: false, status: '' };
    if (failed) state.status = 'The interactive drawing is unavailable. The complete lesson is available in Read whole lesson.';
    if (candidateIds.length > 1 && state.preview) {
      state.status = 'These paths are close together. Preview the nearby paths, then use the confirmation button.';
      state.choices = candidateIds.map(id => {
        exploration.preview(id);
        const edge = state.network.edges.find(edge => edge.id === id);
        return { ...exploration.snapshot().preview, selected: state.selections[edge.from] === id };
      });
      exploration.preview(state.preview.id);
    }
    return state;
  }
  function notify() {
    if (!destroyed) onChange(getState());
  }
  function paintOverlay() {
    if (!context || !scene || !view) return;
    const rect = overlay.getBoundingClientRect();
    const bitmap = canvasBitmap(rect, win.devicePixelRatio || 1);
    overlay.width = bitmap.width;
    overlay.height = bitmap.height;
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    if (mode !== 'explore') return;
    const state = exploration.snapshot();
    for (const selection of state.projection.selections) {
      const fork = state.network.nodes.find(node => node.id === selection.pointId);
      if (fork.age >= state.age - 1e-7) continue;
      const point = view.world(fork);
      context.beginPath(); context.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      context.fillStyle = '#285442'; context.fill();
    }
    const selectedPreview = state.preview;
    if (selectedPreview) {
      const edge = state.network.edges.find(edge => edge.id === selectedPreview.id);
      if (edge) {
        context.save();
        if (!selectedPreview.available) {
          const endX = view.world(state.projection.today).x;
          context.beginPath(); context.rect(0, 0, endX, rect.height); context.clip();
        }
        context.beginPath();
        tracePreview(context, edge.points.map(view.world));
        context.strokeStyle = '#376f9a'; context.lineWidth = 4.5;
        context.lineJoin = 'round'; context.lineCap = 'round'; context.stroke();
        context.restore();
      }
    }
    if (hoveredFork) {
      const position = view.world(hoveredFork);
      context.beginPath(); context.arc(position.x, position.y, 10, 0, Math.PI * 2);
      context.strokeStyle = '#376f9a'; context.lineWidth = 2; context.stroke();
    }
  }
  function paint(force = false) {
    if (destroyed || !scene) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    view = fitOverview(scene.network.bounds, rect, undefined, scene.network.maxAge);
    if (force || paintedProjection !== scene.projection) {
      renderer.paint(scene.network, scene.projection, LAB_DEFAULTS, mode !== 'overview');
      paintedProjection = scene.projection;
    }
    canvas.dataset.mode = mode;
    canvas.dataset.geometry = String(serial);
    paintOverlay();
  }
  function update() {
    scene = exploration.snapshot();
    lastPreview = null;
    hoveredFork = null;
    candidateIds = [];
    pinned = false;
    paint();
    notify();
  }
  function showOverview() {
    mode = 'overview';
    if (!overview) {
      const network = generateNetwork(networkOptionsForLab(LAB_DEFAULTS));
      overview = { network, projection: projectScenario(network, { age: 0, choiceSeed: LAB_DEFAULTS.choiceSeed }) };
    }
    scene = overview;
    paint(true);
  }
  function showToday(age = 12) {
    mode = 'story';
    if (!illustration || illustration.age !== age) {
      illustration = createExplorationSession({ age }).snapshot();
    }
    scene = illustration;
    paint(true);
  }
  function explore(age = 12) {
    const safeAge = Math.max(0, Math.min(70, Number.isFinite(Number(age)) ? Number(age) : 12));
    if (!exploration || confirmedAge !== safeAge) {
      exploration = createExplorationSession({ age: safeAge });
      confirmedAge = safeAge; serial++;
    }
    mode = 'explore';
    exploration.preview(null);
    update();
    return getState();
  }
  function preview(id) {
    if (!exploration) return;
    if (id === null) { pinned = false; candidateIds = []; }
    exploration.preview(id);
    lastPreview = id;
    hoveredFork = null;
    paintOverlay();
    notify();
  }
  function choose(id) {
    if (!exploration || !exploration.choose(id)) return false;
    update();
    return true;
  }
  function revisit(id) {
    if (!exploration || !exploration.revisit(id)) return false;
    update();
    return true;
  }
  function next() { if (exploration) { exploration.next(); update(); } }
  function previous() { if (exploration) { exploration.previous(); update(); } }
  function locate(event) {
    const rect = overlay.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const snapshot = exploration.snapshot();
    const fork = snapshot.projection.selections.map(selection => snapshot.network.nodes.find(node => node.id === selection.pointId))
      .filter(node => node.age < snapshot.age - 1e-7)
      .map(node => ({ node, distance: Math.hypot(view.world(node).x - point.x, view.world(node).y - point.y) }))
      .filter(candidate => candidate.distance < (event.pointerType === 'touch' ? 22 : 10)).sort((a, b) => a.distance - b.distance)[0]?.node;
    return { fork, hit: hitTestPaths(snapshot.projection, view, point) };
  }
  function pointerMove(event) {
    if (mode !== 'explore' || !view || event.pointerType === 'touch' || pinned) return;
    const { fork, hit } = locate(event);
    const id = fork ? null : hit?.edgeId ?? null;
    if (id === lastPreview && hoveredFork?.id === fork?.id) return;
    hoveredFork = fork;
    lastPreview = id;
    candidateIds = hit?.ambiguous && !fork ? hit.candidates : [];
    exploration.preview(id);
    overlay.style.cursor = id || fork ? 'pointer' : 'default';
    paintOverlay();
    notify();
  }
  function pointerLeave(event) {
    if (mode !== 'explore' || event.pointerType === 'touch' || pinned) return;
    hoveredFork = null; lastPreview = null; candidateIds = [];
    exploration.preview(null); paintOverlay(); notify();
  }
  function pointerUp(event) {
    const start = pointerStart;
    pointerStart = null;
    if (mode !== 'explore' || !view || !start || start.id !== event.pointerId
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const { fork, hit } = locate(event);
    if (fork) { revisit(fork.id); return; }
    if (!hit) return;
    candidateIds = hit.ambiguous ? hit.candidates : [];
    if (event.pointerType === 'touch' || hit.ambiguous || hit.state !== 'possible') {
      pinned = true;
      preview(hit.edgeId);
    } else choose(hit.edgeId);
  }
  function pointerDown(event) {
    if (event.button !== 0 || mode !== 'explore') return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function pointerCancel() { pointerStart = null; }
  function keydown(event) {
    if (event.key === 'Escape' && mode === 'explore') {
      candidateIds = []; preview(null);
    }
  }
  const schedule = () => {
    if (scheduled !== null) win.cancelAnimationFrame(scheduled);
    scheduled = win.requestAnimationFrame(() => { scheduled = null; paint(true); });
  };
  overlay.addEventListener('pointermove', pointerMove);
  overlay.addEventListener('pointerdown', pointerDown);
  overlay.addEventListener('pointercancel', pointerCancel);
  overlay.addEventListener('pointerleave', pointerLeave);
  overlay.addEventListener('pointerup', pointerUp);
  canvas.ownerDocument.addEventListener('keydown', keydown);
  const observer = new win.ResizeObserver(schedule);
  observer.observe(canvas);
  function destroy() {
    destroyed = true;
    observer.disconnect();
    if (scheduled !== null) win.cancelAnimationFrame(scheduled);
    overlay.removeEventListener('pointermove', pointerMove);
    overlay.removeEventListener('pointerdown', pointerDown);
    overlay.removeEventListener('pointercancel', pointerCancel);
    overlay.removeEventListener('pointerleave', pointerLeave);
    overlay.removeEventListener('pointerup', pointerUp);
    canvas.ownerDocument.removeEventListener('keydown', keydown);
  }
  return { showOverview, showToday, explore, preview, choose, previous, next, revisit, getState, destroy };
}
