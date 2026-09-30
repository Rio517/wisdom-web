import { hash, labelsForFork, closedReason } from './journey-choices.js';
import { timelinePositionForAge } from '../../engine/lab-settings.js';
import { canvasBitmap } from '../../engine/path-presentation.js';
import { tween, ease, prefersReducedMotion } from './journey-motion.js';
import { t } from '../../i18n/runtime.js';

export const LIFE_START = 3;
export const LIFE_END = 70;
const LOOKAHEAD = 4;
const FOREST = '#285442';
const SAGE = '#8daa91';
const MIST = '#c5cec8';
const PREVIEW = '#376f9a';
const CLAY = '#9a5f3e';

function gapFor(age) {
  if (age < 7) return 2.2;
  if (age < 12) return 2.7;
  if (age < 19) return 3;
  if (age < 26) return 3.8;
  if (age < 41) return 6;
  if (age < 56) return 8.5;
  return 11;
}

/**
 * A lazily grown, seeded tree of example choices. Each node decides its own
 * number of options, how far ahead they fork and how they bend, so forks do
 * not line up in columns. Positions ahead of the traveller are laid out in
 * nested bands (no crossings); a node's height is fixed once it is passed.
 * Pure: no DOM.
 */
export function createLifeTree({ seed = 'life-explorer-1' } = {}) {
  const nodes = new Map();
  nodes.set('r', { id: 'r', age: LIFE_START, y: 0.5, ay: 0.5, parent: null, label: null, children: null });
  const key = id => `${seed}:${id}`;

  function pathTo(id) {
    const path = [];
    for (let node = nodes.get(id); node; node = nodes.get(node.parent)) path.unshift(node);
    return path;
  }

  function children(id) {
    const node = nodes.get(id);
    if (!node) return [];
    if (node.children) return node.children.map(child => nodes.get(child));
    if (node.age >= LIFE_END - 0.01) { node.children = []; return []; }
    const count = hash(key(`${id}:count`)) < (node.age < 19 ? 0.5 : 0.35) ? 3 : 2;
    const used = pathTo(id).map(item => item.label).filter(Boolean);
    const { labels, byFamily } = labelsForFork(node.age, key(id), count, used);
    const closedIndex = count === 3 && node.age >= 7 && hash(key(`${id}:closed`)) < 0.45
      ? Math.floor(hash(key(`${id}:which`)) * 3) : -1;
    node.children = [];
    for (let index = 0; index < count; index += 1) {
      const childId = `${id}.${index}`;
      let age = node.age + gapFor(node.age) * (0.75 + 0.6 * hash(key(`${childId}:gap`)));
      if (age > LIFE_END - 1.5) age = LIFE_END;
      nodes.set(childId, {
        id: childId,
        age: Math.round(age * 10) / 10,
        y: null,
        ay: node.y ?? node.ay,
        parent: id,
        label: labels[index],
        byFamily,
        closed: index === closedIndex,
        reason: index === closedIndex ? closedReason(node.age, key(childId)) : null,
        bend: (hash(key(`${childId}:bend`)) - 0.5) * 0.05,
        jitter: hash(key(`${childId}:y`)) - 0.5,
        children: null,
      });
      node.children.push(childId);
    }
    return node.children.map(child => nodes.get(child));
  }

  /** Lay out the unfixed future of `id` in nested bands around it. */
  function layoutAhead(id, depth = LOOKAHEAD) {
    const start = nodes.get(id);
    const centre = 0.5 + ((start.y ?? start.ay) - 0.5) * 0.8;
    const half = 0.38;
    const split = (node, lo, hi, level) => {
      if (level > depth) return;
      const list = children(node.id);
      const part = (hi - lo) / list.length;
      list.forEach((child, index) => {
        const childLo = lo + part * index;
        const band = childLo + part * (0.5 + child.jitter * 0.3);
        const parentY = node.y ?? node.ay;
        if (child.y === null) child.ay = level === 1 ? parentY + (band - parentY) * 0.6 : band;
        split(child, childLo, childLo + part, level + 1);
      });
    };
    split(start, Math.max(0.04, centre - half), Math.min(0.96, centre + half), 1);
  }

  /** Fix heights for a chosen step: the chosen node, its siblings and one level of their options. */
  function fix(id) {
    const node = nodes.get(id);
    for (const sibling of children(node.parent)) {
      if (sibling.y === null) sibling.y = sibling.ay;
      for (const grandchild of sibling.id === id ? [] : children(sibling.id)) if (grandchild.y === null) grandchild.y = grandchild.ay;
    }
  }

  /** Forget fixed heights below a fork so its future can be laid out afresh. */
  function release(id) {
    const clear = nodeId => {
      for (const child of nodes.get(nodeId).children ?? []) {
        nodes.get(child).y = null;
        clear(child);
      }
    };
    clear(id);
  }

  layoutAhead('r');
  return { get: id => nodes.get(id), children, pathTo, layoutAhead, fix, release, root: 'r' };
}

function bezier(a, b, bend, t) {
  const dx = b.x - a.x;
  const c1 = { x: a.x + dx * 0.5, y: a.y + bend };
  const c2 = { x: b.x - dx * 0.5, y: b.y };
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function createExploreScene(root) {
  root.innerHTML = `<div class="explore-stage">
      <canvas class="explore-canvas" role="img" aria-label="${escapeHTML(t('explore.canvasLabel'))}"></canvas>
      <div class="explore-chips" role="group" aria-label="${escapeHTML(t('explore.chipsLabel'))}"></div>
      <div class="explore-hover" hidden></div>
      <div class="explore-tools">
        <button type="button" class="tool-button" data-tool="zoom">${escapeHTML(t('explore.seeWhole'))}</button>
      </div>
      <div class="explore-end" hidden></div>
    </div>`;
  const $ = selector => root.querySelector(selector);
  const canvas = $('.explore-canvas');
  const chipsLayer = $('.explore-chips');
  const hoverTip = $('.explore-hover');
  const endCard = $('.explore-end');
  const zoomButton = $('[data-tool="zoom"]');
  let context = null;
  try { context = canvas.getContext('2d'); } catch { context = null; }

  let seedIndex = 1;
  let tree = null;
  let path = ['r'];
  let preview = null;
  let hoverBack = null;
  let panel = null;
  let camera = { x: 0, y: 0, zoom: 2 };
  let overview = false;
  let travel = null;
  let pulseFrame = null;
  let hitEdges = [];
  let labelBoxes = [];
  let size = { width: 800, height: 600 };
  let running = null;

  function newTree() {
    tree = createLifeTree({ seed: `life-explorer-${seedIndex}` });
    path = ['r'];
    tree.layoutAhead('r');
  }
  newTree();

  const current = () => path.at(-1);
  const currentNode = () => tree.get(current());
  const closeZoom = () => Math.max(1.45, Math.min(2.3, size.width / 440));
  const zoomTarget = () => (overview ? 1 : closeZoom());
  const yOf = node => node.y ?? node.ay;
  const yScale = zoom => 1 + 0.2 * Math.min(1, Math.max(0, zoom - 1) / 1.3);

  function world(node, zoom = camera.zoom) {
    const span = timelinePositionForAge(LIFE_END) - timelinePositionForAge(LIFE_START);
    const along = (timelinePositionForAge(Math.min(LIFE_END, node.age)) - timelinePositionForAge(LIFE_START)) / span;
    return {
      x: 40 + along * (size.width - 90) * zoom,
      y: (yOf(node) * (size.height - 80) + 24) * yScale(zoom),
    };
  }
  const anchor = () => ({ x: size.width * 0.3, y: size.height / 2 });
  function cameraFor(node, zoom) {
    if (zoom <= 1.001) return { ...anchor(), zoom: 1 };
    const w = world(node, zoom);
    const worldHeight = (size.height - 56) * yScale(zoom);
    return { x: w.x, y: Math.max(size.height / 2, Math.min(worldHeight - size.height / 2 + 18, w.y)), zoom };
  }
  const toScreen = point => ({ x: point.x - camera.x + anchor().x, y: point.y - camera.y + anchor().y });
  const screenOf = node => toScreen(world(node));

  function edgePoints(parent, child, samples = 20, upTo = 1) {
    const a = screenOf(parent);
    const b = screenOf(child);
    const bend = child.bend * size.height;
    return Array.from({ length: samples + 1 }, (_, i) => bezier(a, b, bend, (i / samples) * upTo));
  }
  function stroke(points, color, width, alpha = 1, dash = null) {
    if (points.length < 2) return;
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    if (dash) context.setLineDash(dash);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
  }
  function dot(point, radius, color, alpha = 1) {
    context.save(); context.globalAlpha = alpha; context.fillStyle = color;
    context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill(); context.restore();
  }
  function label(value, point, { color = FOREST, fontSize = 12.5, weight = 500, align = 'left', force = false } = {}) {
    context.save();
    context.font = `${weight} ${fontSize}px "Avenir Next", AvenirNext, "Segoe UI", sans-serif`;
    const width = context.measureText(value).width;
    const left = align === 'center' ? point.x - width / 2 : point.x;
    const box = { left: left - 4, right: left + width + 4, top: point.y - fontSize, bottom: point.y + 4 };
    const outside = box.left < 2 || box.right > size.width - 2 || box.top < 2 || box.bottom > size.height - 26;
    const clash = labelBoxes.some(other => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top);
    if (!force && (outside || clash)) { context.restore(); return false; }
    labelBoxes.push(box);
    context.textAlign = align;
    context.lineWidth = 4; context.strokeStyle = '#f2f5f0'; context.lineJoin = 'round';
    context.strokeText(value, point.x, point.y);
    context.fillStyle = color;
    context.fillText(value, point.x, point.y);
    context.restore();
    return true;
  }

  function drawAhead(parent, depth, color, alphaAt, record) {
    if (depth > LOOKAHEAD) return;
    for (const child of tree.children(parent.id)) {
      if (child.closed) continue;
      const points = edgePoints(parent, child, 16);
      stroke(points, color, Math.max(1.4, 3.2 - depth * 0.5), alphaAt(depth));
      record?.push({ points, option: record.option });
      drawAhead(child, depth + 1, color, alphaAt, record);
    }
  }

  function paint() {
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10) return;
    size = { width: rect.width, height: rect.height };
    const bitmap = canvasBitmap(rect, devicePixelRatio || 1);
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) { canvas.width = bitmap.width; canvas.height = bitmap.height; }
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    hitEdges = [];
    labelBoxes = [];
    placeChips();
    // Keep canvas labels clear of the chips, tools and end card.
    for (const element of [...(chipsLayer.hidden ? [] : chipsLayer.children), $('.explore-tools'), endCard.hidden ? null : endCard]) {
      if (!element) continue;
      const box = element.getBoundingClientRect();
      if (box.width) labelBoxes.push({ left: box.left - rect.left - 6, right: box.right - rect.left + 6, top: box.top - rect.top - 4, bottom: box.bottom - rect.top + 4 });
    }

    for (const age of [5, 10, 15, 20, 30, 40, 50, 60, 70]) {
      const x = toScreen(world({ age, y: 0 })).x;
      if (x < 40 || x > size.width - 12) continue;
      context.save(); context.strokeStyle = '#dde4dc'; context.lineWidth = 1; context.setLineDash([2, 7]);
      context.beginPath(); context.moveTo(x, 10); context.lineTo(x, size.height - 30); context.stroke(); context.restore();
      label(`${age}`, { x, y: size.height - 11 }, { color: '#5a6961', fontSize: 12, align: 'center', weight: 600, force: true });
    }
    label(t('explore.age'), { x: 16, y: size.height - 11 }, { color: '#5a6961', fontSize: 12, weight: 600, force: true });

    const nodesOnPath = path.map(id => tree.get(id));
    const here = currentNode();

    // Options ahead, drawn first so the lived path sits on top.
    if (!travel) {
      for (const option of tree.children(here.id)) {
        const points = edgePoints(here, option);
        if (option.closed) { stroke(points.slice(0, 12), CLAY, 2.6, 0.9, [3, 7]); continue; }
        const active = !preview || preview === option.id;
        const color = preview === option.id ? PREVIEW : SAGE;
        stroke(points, color, 3.4, active ? 1 : 0.3);
        const record = [];
        record.option = option.id;
        drawAhead(option, 1, color, depth => (active ? [1, 0.8, 0.55, 0.35, 0.2][depth] : 0.12), record);
        hitEdges.push({ points, option: option.id }, ...record);
      }
    }

    // Choices not taken at earlier forks.
    const grayLabels = [];
    nodesOnPath.slice(0, -1).forEach((node, index) => {
      const chosen = nodesOnPath[index + 1];
      for (const sibling of tree.children(node.id)) {
        if (sibling.id === chosen.id) continue;
        const points = edgePoints(node, sibling);
        const highlighted = hoverBack?.id === sibling.id;
        if (sibling.closed) {
          stroke(points.slice(0, 11), CLAY, 2, 0.5, [2, 6]);
        } else {
          stroke(points, highlighted ? PREVIEW : MIST, highlighted ? 3.2 : 2.3, 1);
          for (const tail of tree.children(sibling.id)) {
            if (tail.y === null) continue;
            stroke(edgePoints(sibling, tail, 14), highlighted ? PREVIEW : MIST, 1.8, highlighted ? 0.6 : 0.55);
          }
          hitEdges.push({ points, back: { fork: node.id, child: sibling.id } });
        }
        grayLabels.push({ sibling, points, highlighted, order: index });
      }
    });

    // The lived path.
    const livedLabels = [];
    nodesOnPath.slice(1).forEach((node, index) => {
      const parent = nodesOnPath[index];
      const points = edgePoints(parent, node);
      stroke(points, FOREST, 4.4);
      livedLabels.push({ node, points, order: index });
    });
    nodesOnPath.slice(0, -1).forEach(node => dot(screenOf(node), 3.8, FOREST));

    if (travel) {
      const parent = tree.get(travel.from);
      const child = tree.get(travel.to);
      const points = edgePoints(parent, child, 28, travel.t);
      stroke(points, FOREST, 4.4);
      const head = points.at(-1);
      dot(head, 13, 'rgba(40,84,66,.16)');
      dot(head, 7, FOREST);
    } else {
      const point = screenOf(here);
      const phase = pulseFrame === null ? 0 : ((performance.now() % 1800) / 1800);
      context.save();
      context.strokeStyle = `rgba(40,84,66,${0.45 * (1 - phase)})`; context.lineWidth = 2;
      context.beginPath(); context.arc(point.x, point.y, 9 + phase * 18, 0, Math.PI * 2); context.stroke(); context.restore();
      dot(point, 7.5, FOREST);
    }

    // Labels, newest first so recent choices win any overlap.
    for (const item of livedLabels.reverse()) {
      const mid = item.points[10];
      label(item.node.label, { x: mid.x, y: mid.y - 11 }, { color: FOREST, weight: 650, align: 'center' })
        || label(item.node.label, { x: mid.x, y: mid.y + 20 }, { color: FOREST, weight: 650, align: 'center' });
    }
    for (const item of grayLabels.sort((a, b) => Number(b.highlighted) - Number(a.highlighted) || b.order - a.order)) {
      const mid = item.points[12];
      const text = item.sibling.closed ? `✕ ${item.sibling.label}` : item.sibling.label;
      const color = item.sibling.closed ? CLAY : item.highlighted ? PREVIEW : '#7f8c85';
      label(text, { x: mid.x, y: mid.y - 8 }, { color, fontSize: 12, align: 'center' })
        || label(text, { x: mid.x, y: mid.y + 18 }, { color, fontSize: 12, align: 'center' });
    }
  }

  function placeChips() {
    if (travel || overview) { chipsLayer.hidden = true; return; }
    chipsLayer.hidden = false;
    const here = currentNode();
    const options = tree.children(here.id);
    if (chipsLayer.dataset.fork !== here.id) {
      chipsLayer.dataset.fork = here.id;
      chipsLayer.innerHTML = options.map((option, index) => option.closed
        ? `<button type="button" class="choice-chip is-closed" aria-disabled="true" data-closed="${option.id}" style="--i:${index}"><span class="chip-x" aria-hidden="true">✕</span><span><strong>${escapeHTML(option.label)}</strong><small>${escapeHTML(option.reason)}</small></span></button>`
        : `<button type="button" class="choice-chip" data-option="${option.id}" style="--i:${index}">${option.byFamily ? `<small>${escapeHTML(t('explore.byFamilyChip'))}</small>` : ''}<strong>${escapeHTML(option.label)}</strong></button>`).join('');
    }
    options.forEach((option, index) => {
      const chip = chipsLayer.children[index];
      const points = edgePoints(here, option);
      const at = points[option.closed ? 9 : 11];
      chip.style.left = `${Math.max(8, Math.min(size.width - chip.offsetWidth - 8, at.x - chip.offsetWidth / 2))}px`;
      chip.style.top = `${Math.max(8, at.y - chip.offsetHeight - 8)}px`;
      chip.dataset.previewed = String(preview === option.id);
    });
    // Nudge overlapping chips apart, top to bottom.
    const chips = [...chipsLayer.children].sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
    for (let index = 1; index < chips.length; index += 1) {
      const above = chips[index - 1];
      const chip = chips[index];
      const aboveLeft = parseFloat(above.style.left);
      const left = parseFloat(chip.style.left);
      const overlapX = left < aboveLeft + above.offsetWidth + 6 && left + chip.offsetWidth > aboveLeft - 6;
      const minTop = parseFloat(above.style.top) + above.offsetHeight + 6;
      if (overlapX && parseFloat(chip.style.top) < minTop) chip.style.top = `${minTop}px`;
    }
  }

  function hitTest(x, y) {
    let best = null;
    for (const edge of hitEdges) {
      for (const point of edge.points) {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < 12 && (!best || distance < best.distance)) best = { ...edge, distance };
      }
    }
    return best;
  }

  function startPulse() {
    if (pulseFrame !== null || prefersReducedMotion()) return;
    const loop = () => {
      if (root.hidden || travel || overview) { pulseFrame = null; return; }
      paint();
      pulseFrame = requestAnimationFrame(loop);
    };
    pulseFrame = requestAnimationFrame(loop);
  }
  function stopPulse() { if (pulseFrame !== null) cancelAnimationFrame(pulseFrame); pulseFrame = null; }

  function animateCamera(target, duration = 700) {
    const from = { ...camera };
    running?.cancel();
    running = tween({ duration: prefersReducedMotion() ? 0 : duration, easing: ease.inOut, update: t => {
      camera = { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t, zoom: from.zoom + (target.zoom - from.zoom) * t };
      paint();
    } });
    return running.promise;
  }

  async function choose(optionId) {
    const here = currentNode();
    const option = tree.children(here.id).find(item => item.id === optionId);
    if (!option || option.closed || travel) return;
    preview = null;
    hoverBack = null;
    hoverTip.hidden = true;
    stopPulse();
    tree.fix(option.id);
    const years = option.age - here.age;
    travel = { from: here.id, to: option.id, t: 0 };
    chipsLayer.hidden = true;
    const fromCam = { ...camera };
    const toCam = cameraFor(option, zoomTarget());
    running?.cancel();
    running = tween({ duration: prefersReducedMotion() ? 0 : Math.min(1500, 700 + years * 70), easing: ease.inOut, update: t => {
      travel.t = t;
      camera = { x: fromCam.x + (toCam.x - fromCam.x) * t, y: fromCam.y + (toCam.y - fromCam.y) * t, zoom: fromCam.zoom + (toCam.zoom - fromCam.zoom) * t };
      paint();
    } });
    await running.promise;
    travel = null;
    path = [...path, option.id];
    tree.layoutAhead(option.id);
    chipsLayer.dataset.fork = '';
    announce(t('explore.announceChoice', { age: Math.round(here.age), choice: option.label }));
    renderPanel();
    if (option.age >= LIFE_END - 0.01) { finish(); return; }
    paint();
    startPulse();
    chipsLayer.querySelector('[data-option]')?.focus({ preventScroll: true });
  }

  function goBackTo(forkId, thenChoose = null) {
    const index = path.indexOf(forkId);
    if (index < 0 || travel) return;
    path = path.slice(0, index + 1);
    tree.release(forkId);
    tree.layoutAhead(forkId);
    endCard.hidden = true;
    overview = false;
    zoomButton.textContent = t('explore.seeWhole');
    preview = null; hoverBack = null; hoverTip.hidden = true;
    chipsLayer.dataset.fork = '';
    renderPanel();
    animateCamera(cameraFor(currentNode(), closeZoom()), 650).then(() => {
      paint(); startPulse();
      if (thenChoose) choose(thenChoose);
      else chipsLayer.querySelector('[data-option]')?.focus({ preventScroll: true });
    });
  }

  function finish() {
    overview = true;
    zoomButton.textContent = t('explore.zoomIn');
    const chosen = path.slice(1);
    const closedSeen = path.slice(0, -1).filter(id => tree.children(id).some(child => child.closed)).length;
    endCard.hidden = false;
    endCard.innerHTML = `<h2 tabindex="-1">${escapeHTML(t('explore.end.heading'))}</h2>
      <p>${escapeHTML(t('explore.end.summary', { choices: chosen.length, closed: closedSeen }))}</p>
      <p>${escapeHTML(t('explore.end.gray'))}</p>
      <div class="end-buttons"><button type="button" class="solid-pill" data-tool="again">${escapeHTML(t('explore.end.again'))}</button>
      <button type="button" class="pill-button" data-tool="back-one">${escapeHTML(t('explore.end.backOne'))}</button></div>`;
    animateCamera(cameraFor(currentNode(), 1), 1100);
    endCard.querySelector('h2').focus({ preventScroll: true });
    announce(t('explore.announceEnd'));
  }

  function restart() {
    running?.cancel();
    travel = null;
    seedIndex += 1;
    newTree();
    overview = false;
    endCard.hidden = true;
    zoomButton.textContent = t('explore.seeWhole');
    chipsLayer.dataset.fork = '';
    camera = cameraFor(currentNode(), closeZoom());
    renderPanel();
    paint(); startPulse();
    chipsLayer.querySelector('[data-option]')?.focus({ preventScroll: true });
  }

  function announce(message) {
    const live = panel?.querySelector('.explore-live');
    if (live) live.textContent = message;
  }

  function renderPanel() {
    if (!panel) return;
    const nodesOnPath = path.map(id => tree.get(id));
    const here = currentNode();
    const items = nodesOnPath.slice(1).map((node, index) => {
      const fork = nodesOnPath[index];
      return `<li><button type="button" class="timeline-step" data-back="${fork.id}" aria-label="${escapeHTML(t('explore.stepLabel', { age: Math.round(fork.age), choice: node.label }))}">
        <span class="timeline-age">${Math.round(fork.age)}</span><span class="timeline-label">${escapeHTML(node.label)}${node.byFamily ? ` <small>${escapeHTML(t('explore.byFamily'))}</small>` : ''}</span></button></li>`;
    }).join('');
    panel.innerHTML = `<div class="explore-panel">
      <div class="explore-now">${here.age >= LIFE_END - 0.01
        ? `<strong>${escapeHTML(t('explore.now.endStrong'))}</strong> ${escapeHTML(t('explore.now.end'))}`
        : `<strong>${escapeHTML(t('explore.now.age', { age: Math.round(here.age) }))}</strong> ${escapeHTML(t(path.length === 1 ? 'explore.now.first' : 'explore.now.next'))}`}</div>
      <h2 class="timeline-title">${escapeHTML(t('explore.timeline.title'))}</h2>
      ${items ? `<ol class="timeline">${items}</ol><p class="timeline-hint">${escapeHTML(t('explore.timeline.hint'))}</p>` : `<p class="timeline-empty">${escapeHTML(t('explore.timeline.empty'))}</p>`}
      <div class="explore-actions"><button type="button" class="pill-button" data-tool="again">${escapeHTML(t('explore.newLife'))}</button></div>
      <p class="illustration-note">${escapeHTML(t('explore.madeUp'))}</p>
      <p class="sr-only explore-live" aria-live="polite"></p>
    </div>`;
    const list = panel.querySelector('.timeline');
    if (list) list.scrollTop = list.scrollHeight;
  }

  // ——— Events ———
  canvas.addEventListener('pointermove', event => {
    if (travel || overview) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(event.clientX - rect.left, event.clientY - rect.top);
    const nextPreview = hit?.option ?? null;
    const nextBack = hit?.back ? tree.get(hit.back.child) : null;
    canvas.style.cursor = hit ? 'pointer' : 'default';
    if (nextPreview !== preview || nextBack?.id !== hoverBack?.id) {
      preview = nextPreview;
      hoverBack = nextBack;
      hoverTip.hidden = !nextBack;
      if (nextBack) hoverTip.textContent = t('explore.goBackTo', { choice: nextBack.label });
      paint();
    }
    if (!hoverTip.hidden) {
      hoverTip.style.left = `${Math.min(size.width - hoverTip.offsetWidth - 8, event.clientX - rect.left + 14)}px`;
      hoverTip.style.top = `${event.clientY - rect.top + 16}px`;
    }
  });
  canvas.addEventListener('pointerleave', () => { preview = null; hoverBack = null; hoverTip.hidden = true; paint(); });
  canvas.addEventListener('click', event => {
    if (travel) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(event.clientX - rect.left, event.clientY - rect.top);
    if (hit?.option) choose(hit.option);
    else if (hit?.back) goBackTo(hit.back.fork, hit.back.child);
  });
  chipsLayer.addEventListener('click', event => {
    const chip = event.target.closest('[data-option]');
    if (chip) choose(chip.dataset.option);
    const closed = event.target.closest('[data-closed]');
    if (closed) {
      closed.classList.remove('nope');
      void closed.offsetWidth;
      closed.classList.add('nope');
      announce(t('explore.closedAnnounce', { reason: tree.get(closed.dataset.closed).reason }));
    }
  });
  const previewChip = event => {
    const chip = event.target.closest('[data-option]');
    if (event.type === 'focusin' && !chip?.matches(':focus-visible')) return;
    if (chip && preview !== chip.dataset.option) { preview = chip.dataset.option; paint(); }
  };
  chipsLayer.addEventListener('pointerover', previewChip);
  chipsLayer.addEventListener('focusin', previewChip);
  chipsLayer.addEventListener('pointerout', event => {
    if (!event.relatedTarget?.closest?.('[data-option]')) { preview = null; paint(); }
  });
  root.addEventListener('click', event => {
    const tool = event.target.closest('[data-tool]')?.dataset.tool;
    if (tool === 'zoom') {
      overview = !overview;
      zoomButton.textContent = t(overview ? 'explore.zoomIn' : 'explore.seeWhole');
      preview = null;
      stopPulse();
      animateCamera(cameraFor(currentNode(), zoomTarget()), 800).then(() => { paint(); if (!overview) startPulse(); });
    }
    if (tool === 'again') restart();
    if (tool === 'back-one' && path.length > 1) goBackTo(path.at(-2));
  });
  const onPanelClick = event => {
    const step = event.target.closest('[data-back]');
    if (step) goBackTo(step.dataset.back);
    if (event.target.closest('[data-tool="again"]')) restart();
  };

  new ResizeObserver(() => {
    if (root.hidden || travel) return;
    const rect = canvas.getBoundingClientRect();
    size = { width: rect.width, height: rect.height };
    camera = cameraFor(currentNode(), zoomTarget());
    paint();
  }).observe(canvas);

  return {
    show() {
      requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        size = { width: rect.width, height: rect.height };
        camera = cameraFor(currentNode(), zoomTarget());
        chipsLayer.dataset.fork = '';
        paint();
        paint();
        if (!overview) startPulse();
      });
    },
    mountPanel(container) {
      panel = container;
      panel.removeEventListener('click', onPanelClick);
      panel.addEventListener('click', onPanelClick);
      renderPanel();
    },
    hide() { stopPulse(); },
  };
}
