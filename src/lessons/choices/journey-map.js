import { createExplorationSession } from '../../engine/choices-exploration.js';
import { LAB_DEFAULTS, networkOptionsForLab } from '../../engine/lab-settings.js';
import { generateNetwork } from '../../engine/path-network.js';
import { createLabRenderer, fitOverview } from '../../engine/lab-renderer.js';
import { canvasBitmap } from '../../engine/path-presentation.js';
import { tween, ease, wait } from './journey-motion.js';
import { STORY_COUNT, mapStory } from './journey-choices.js';
import { t } from '../../i18n/runtime.js';

const STORY_AGE = 12;
const FOREST = '#285442';
const CLAY = '#9a5f3e';

function tracePath(context, points) {
  const slopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return point.x > previous.x ? (point.y - previous.y) / (point.x - previous.x) : 0;
  });
  const tangent = index => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const before = slopes[index - 1]; const after = slopes[index];
    return before * after > 0 ? 2 * before * after / (before + after) : 0;
  };
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]; const end = points[index];
    const handle = (end.x - start.x) / 3;
    if (handle <= 0) { context.lineTo(end.x, end.y); continue; }
    context.bezierCurveTo(start.x + handle, start.y + tangent(index - 1) * handle,
      end.x - handle, end.y - tangent(index) * handle, end.x, end.y);
  }
}

function pointAtAge(points, age) {
  if (age <= points[0].age) return points[0];
  for (let index = 1; index < points.length; index += 1) {
    const end = points[index];
    if (age > end.age) continue;
    const start = points[index - 1];
    const amount = end.age === start.age ? 0 : (age - start.age) / (end.age - start.age);
    return { age, x: start.x + (end.x - start.x) * amount, y: start.y + (end.y - start.y) * amount };
  }
  return points.at(-1);
}

/** `labels: false` plays the same map without choice chips or cluster highlights (home page hero). */
export function createPathsScene(root, { labels = true } = {}) {
  const stack = root.querySelector('.map-stack');
  const baseCanvas = root.querySelector('#map-base');
  const todayCanvas = root.querySelector('#map-today');
  const fxCanvas = root.querySelector('#map-fx');
  const callouts = root.querySelector('#map-callouts');
  const key = root.querySelector('#map-key');
  const baseRenderer = createLabRenderer(baseCanvas);
  const todayRenderer = createLabRenderer(todayCanvas);
  let fx = null;
  try { fx = fxCanvas.getContext('2d'); } catch { fx = null; }
  const failed = baseRenderer.failed || todayRenderer.failed || !fx;

  let snapshot = null;
  let overview = null;
  let current = null;
  let travel = 1; // traveller progress 0..1 while animating
  let pulse = null;
  let closedMarks = [];
  let fxMode = 'none';
  let clusterCache = null;
  // One story set per visit; ?story=N pins one for review.
  const storyParam = Number(new URLSearchParams(location.search).get('story'));
  const storyIndex = Number.isInteger(storyParam) && storyParam >= 1 && storyParam <= STORY_COUNT
    ? storyParam - 1 : Math.floor(Math.random() * STORY_COUNT);
  const story = mapStory(storyIndex);
  // The Canvas renderer's own labels, in the page's language.
  const renderSettings = { ...LAB_DEFAULTS, labels: { beginning: t('map.beginning'), today: age => t('map.today', { age }) } };
  root.dataset.story = String(storyIndex + 1);

  const data = () => {
    if (!snapshot) snapshot = createExplorationSession({ age: STORY_AGE }).snapshot();
    return snapshot;
  };
  const rect = () => stack.getBoundingClientRect();
  const view = () => fitOverview(data().network.bounds, rect(), undefined, data().network.maxAge);

  function paintBase() {
    if (failed) return;
    const { network, projection } = data();
    if (!overview) overview = generateNetwork(networkOptionsForLab(LAB_DEFAULTS, { today: STORY_AGE }));
    baseRenderer.paint(overview, projection, renderSettings, false);
    todayRenderer.paint(network, projection, renderSettings, true);
  }

  function chooseClosed() {
    const { projection } = data();
    const v = view();
    const picks = [];
    const candidates = projection.segments
      .filter(segment => segment.state === 'possible' && segment.points[0].age <= 19 && segment.points.at(-1).age >= 24)
      .map(segment => ({ segment, at: pointAtAge(segment.points, 21) }))
      .sort((a, b) => a.at.y - b.at.y);
    for (const candidate of candidates) {
      const screen = v.world(candidate.at);
      if (picks.some(pick => Math.abs(v.world(pick.at).y - screen.y) < 70)) continue;
      picks.push(candidate);
      if (picks.length === 3) break;
    }
    return picks;
  }

  /**
   * Two groups of related future choices, each on a connected branch family:
   * a first step before a fork, then two ways on. One sits in the top half,
   * one in the bottom half; which family and which half vary per visit.
   */
  function clusters() {
    if (clusterCache) return clusterCache;
    const { network, projection } = data();
    const possible = new Set(projection.segments.filter(segment => segment.state === 'possible').map(segment => segment.edgeId));
    const edges = network.edges.filter(edge => possible.has(edge.id));
    const incoming = new Map(edges.map(edge => [edge.to, edge]));
    const kids = edge => edges.filter(child => child.from === edge.to);
    const candidates = edges.map(edge => {
      const fork = edge.points.at(-1).age;
      const children = kids(edge).filter(child => child.points.at(-1).age >= fork + 7)
        .sort((a, b) => pointAtAge(a.points, fork + 6).y - pointAtAge(b.points, fork + 6).y);
      if (fork < 16 || fork > 31 || children.length < 2) return null;
      const approach = [];
      for (let item = edge; item; item = incoming.get(item.from)) {
        approach.unshift(...item.points);
        if (item.points[0].age <= fork - 5) break;
      }
      approach.sort((a, b) => a.age - b.age);
      return { edge, fork, y: edge.points.at(-1).y, approach, children: [children[0], children.at(-1)] };
    }).filter(Boolean);
    const height = network.bounds.height;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const top = pick(candidates.filter(candidate => candidate.y < height * 0.45));
    let bottom = pick(candidates.filter(candidate => candidate.y > height * 0.55));
    if (!bottom && top) bottom = candidates.filter(candidate => candidate.y - top.y > 150).sort((a, b) => b.y - a.y)[0];
    const groups = [top, bottom].filter(Boolean);
    const kinds = Math.random() < 0.5 ? ['build', 'fresh'] : ['fresh', 'build'];
    clusterCache = groups.map((group, index) => ({ ...group, kind: kinds[index], labels: story[kinds[index]] }));
    return clusterCache;
  }

  function sizeFx() {
    const r = rect();
    const bitmap = canvasBitmap(r, devicePixelRatio || 1);
    fxCanvas.width = bitmap.width; fxCanvas.height = bitmap.height;
    fx.setTransform(bitmap.scale, 0, 0, bitmap.scale, 0, 0);
    fx.clearRect(0, 0, r.width, r.height);
    return r;
  }

  function drawFx(pulsePhase = 0) {
    if (failed) return;
    const r = sizeFx();
    const v = view();
    const { projection } = data();
    const birth = v.world(projection.past[0]);
    if (fxMode === 'cover') {
      fx.beginPath(); fx.arc(birth.x, birth.y, 6, 0, Math.PI * 2); fx.fillStyle = FOREST; fx.fill();
      const ring = 10 + pulsePhase * 26;
      fx.beginPath(); fx.arc(birth.x, birth.y, ring, 0, Math.PI * 2);
      fx.strokeStyle = `rgba(40,84,66,${0.45 * (1 - pulsePhase)})`; fx.lineWidth = 2; fx.stroke();
      fx.fillStyle = '#5a6961'; fx.font = '500 15px "Avenir Next", AvenirNext, "Segoe UI", sans-serif';
      fx.textAlign = 'center'; fx.fillText(t('map.beginning'), birth.x, birth.y + 40);
      return;
    }
    if (fxMode === 'travel') {
      const age = STORY_AGE * travel;
      const past = projection.past;
      const head = pointAtAge(past, age);
      const headScreen = v.world(head);
      fx.save();
      fx.beginPath(); fx.rect(0, 0, headScreen.x + 0.5, r.height); fx.clip();
      fx.beginPath(); tracePath(fx, past.map(v.world));
      fx.strokeStyle = FOREST; fx.lineWidth = 3.8; fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.stroke();
      fx.restore();
      fx.beginPath(); fx.arc(headScreen.x, headScreen.y, 12, 0, Math.PI * 2); fx.fillStyle = 'rgba(40,84,66,.16)'; fx.fill();
      fx.beginPath(); fx.arc(headScreen.x, headScreen.y, 6.5, 0, Math.PI * 2); fx.fillStyle = FOREST; fx.fill();
      return;
    }
    if (fxMode === 'clusters') {
      for (const group of clusters()) {
        const lead = group.approach.filter(point => point.age >= group.fork - 4.5);
        const branches = group.children.map(child => child.points.filter(point => point.age <= group.fork + 10));
        for (const points of [lead, ...branches]) {
          if (points.length < 2) continue;
          fx.save();
          fx.beginPath(); tracePath(fx, points.map(v.world));
          fx.strokeStyle = '#5f8a6c'; fx.lineWidth = 3.2; fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.globalAlpha = 0.9; fx.stroke();
          fx.restore();
        }
      }
      return;
    }
    if (fxMode === 'closed' || fxMode === 'wrap') {
      const today = v.world(projection.today);
      if (fxMode === 'wrap') {
        const ring = 10 + pulsePhase * 22;
        fx.beginPath(); fx.arc(today.x, today.y, ring, 0, Math.PI * 2);
        fx.strokeStyle = `rgba(40,84,66,${0.4 * (1 - pulsePhase)})`; fx.lineWidth = 2; fx.stroke();
        return;
      }
      for (const mark of closedMarks) {
        const after = mark.segment.points.filter(point => point.age >= mark.at.age);
        const points = [mark.at, ...after].map(v.world);
        fx.save();
        fx.beginPath(); tracePath(fx, points);
        fx.strokeStyle = '#fbfbf8'; fx.lineWidth = 6; fx.lineCap = 'round'; fx.stroke();
        fx.beginPath(); tracePath(fx, points);
        fx.strokeStyle = 'rgba(154,95,62,.55)'; fx.lineWidth = 2.2; fx.setLineDash([2, 6]); fx.stroke();
        fx.restore();
        const p = v.world(mark.at);
        const size = 7 * mark.scale;
        fx.save();
        fx.strokeStyle = CLAY; fx.lineWidth = 3; fx.lineCap = 'round';
        fx.beginPath(); fx.moveTo(p.x - size, p.y - size); fx.lineTo(p.x + size, p.y + size);
        fx.moveTo(p.x + size, p.y - size); fx.lineTo(p.x - size, p.y + size); fx.stroke();
        fx.restore();
      }
    }
  }

  const LABELS = {
    closed: [t('map.closed.teamFull'), t('map.closed.classCancelled'), t('map.closed.familyMoved')],
  };

  function chip(text, point, tone, index, placed, { dx = 0, dy = -14 } = {}) {
    const element = document.createElement('div');
    element.className = 'map-chip';
    element.dataset.tone = tone;
    element.style.visibility = 'hidden';
    const label = document.createElement('span');
    label.textContent = text;
    element.append(label);
    callouts.append(element);
    const width = label.offsetWidth;
    const height = label.offsetHeight;
    const box = { left: point.x + dx - 14, top: point.y + dy - height - 4, right: point.x + dx - 14 + width, bottom: point.y + dy - 4 };
    const r = rect();
    const fits = box.left >= 4 && box.right <= r.width - 4 && box.top >= 4 && box.bottom <= r.height - 40
      && !placed.some(other => box.left < other.right + 8 && box.right > other.left - 8 && box.top < other.bottom + 6 && box.bottom > other.top - 6);
    if (!fits) { element.remove(); return false; }
    placed.push(box);
    element.style.visibility = '';
    element.style.left = `${box.left}px`;
    element.style.top = `${box.top}px`;
    element.style.animationDelay = `${index * 90}ms`;
    const pin = document.createElement('i');
    pin.style.left = `${point.x - box.left}px`;
    if (dy > 0) { pin.style.top = 'auto'; pin.style.bottom = '100%'; pin.style.height = `${Math.max(3, dy - height - 4)}px`; }
    else pin.style.height = `${Math.max(6, -dy + 4)}px`;
    element.append(pin);
    return true;
  }

  function spread(points, count, placedTest) {
    const sorted = [...points].sort((a, b) => a.y - b.y);
    const picks = [];
    for (let slot = 0; slot < sorted.length && picks.length < count; slot += 1) {
      const candidate = sorted[Math.floor((slot * sorted.length) / Math.max(1, sorted.length)) % sorted.length];
      if (picks.every(point => Math.abs(point.y - candidate.y) > 70) && placedTest(candidate)) picks.push(candidate);
    }
    return picks;
  }

  function renderCallouts(mode) {
    if (!labels && callouts) { callouts.replaceChildren(); return; }
    if (mode === 'cover-leaving') {
      const title = callouts.querySelector('.cover-line');
      callouts.replaceChildren(...(title ? [title] : []));
      if (title) {
        title.classList.add('is-leaving');
        title.addEventListener('animationend', () => title.remove(), { once: true });
        setTimeout(() => title.remove(), 600);
      }
      return;
    }
    callouts.replaceChildren();
    if (!failed && mode === 'cover') {
      const birth = view().world(data().projection.past[0]);
      const title = document.createElement('div');
      title.className = 'cover-line';
      title.style.left = `${birth.x + 64}px`;
      title.style.top = `${birth.y}px`;
      const question = document.createElement('strong');
      question.textContent = t('map.coverQuestion');
      const hint = document.createElement('span');
      hint.textContent = t('map.coverHint');
      title.append(question, hint);
      callouts.append(title);
      return;
    }
    if (failed || !['travel', 'outside', 'wrap'].includes(mode)) return;
    const v = view();
    const r = rect();
    const { projection } = data();
    const placed = [];
    let index = 0;
    if (mode === 'travel') {
      story.taken.forEach((text, takenIndex) => {
        const point = v.world(pointAtAge(projection.past, [4.5, 9][takenIndex]));
        chip(text, point, 'taken', index++, placed, { dy: 34 }) || chip(text, point, 'taken', index++, placed, { dy: -14 });
      });
      const grays = projection.segments.filter(segment => segment.state === 'untaken' && segment.points[0].age < 7 && segment.points.at(-1).age > 10)
        .map(segment => v.world(pointAtAge(segment.points, 8.5)))
        .filter(point => point.y > 60 && point.y < r.height - 80);
      let grayIndex = 0;
      for (const point of spread(grays, 3, () => true)) {
        if (grayIndex >= story.untaken.length) break;
        if (chip(story.untaken[grayIndex], point, 'untaken', index, placed, { dx: -60 })) { grayIndex += 1; index += 1; }
      }
      const placeGroups = () => {
        let count = 0;
        for (const group of clusters()) {
          const [first, left, right] = group.labels;
          const leadAttempts = [2.2, 3.5, 1.2].flatMap(years => {
            const point = v.world(pointAtAge(group.approach, Math.max(STORY_AGE + 2, group.fork - years)));
            return [[point, { dx: -24 }], [point, { dx: -24, dy: 40 }]];
          });
          for (const [point, offset] of leadAttempts) {
            if (chip(first, point, 'possible', index, placed, offset)) { index += 1; count += 1; break; }
          }
          group.children.forEach((child, childIndex) => {
            const end = child.points.at(-1).age;
            const label = childIndex === 0 ? left : right;
            const above = childIndex === 0;
            // Near the fork first, then further along the same branch.
            const attempts = [6, 9, 12, 4, 15].flatMap(years => {
              const point = v.world(pointAtAge(child.points, Math.min(end - 1, group.fork + years)));
              return [[point, above ? { dy: -14 } : { dy: 40 }], [point, above ? { dy: 40 } : { dy: -14 }]];
            });
            for (const [point, offset] of attempts) {
              if (chip(label, point, 'possible', index, placed, offset)) { index += 1; count += 1; break; }
            }
          });
        }
        return count;
      };
      // Try a few pairings of branch families until every related choice fits.
      const fixed = placed.length;
      const fixedChildren = callouts.children.length;
      const reset = () => {
        placed.length = fixed;
        while (callouts.children.length > fixedChildren) callouts.lastElementChild.remove();
      };
      let best = null;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (attempt) { reset(); clusterCache = null; }
        const count = placeGroups();
        if (!best || count > best.count) best = { count, cache: clusterCache };
        if (count === 6) break;
      }
      if (clusterCache !== best.cache) { reset(); clusterCache = best.cache; placeGroups(); }
    }
    if (mode === 'outside') {
      closedMarks.forEach((mark, markIndex) => {
        const point = v.world(mark.at);
        chip(LABELS.closed[markIndex % LABELS.closed.length], point, 'closed', markIndex, placed, { dx: 4, dy: -16 })
          || chip(LABELS.closed[markIndex % LABELS.closed.length], point, 'closed', markIndex, placed, { dx: 4, dy: 40 });
      });
    }
    if (mode === 'wrap') {
      const green = projection.segments.filter(segment => segment.state === 'possible')
        .map(segment => pointAtAge(segment.points, 40)).filter(Boolean).map(point => v.world(point))
        .sort((a, b) => Math.abs(a.y - r.height / 2) - Math.abs(b.y - r.height / 2))[0];
      if (green) chip(t('map.stillOpen'), green, 'possible', 0, placed);
    }
  }

  function startPulse(mode) {
    stopPulse();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { drawFx(0); return; }
    const began = performance.now();
    const loop = now => {
      if (fxMode !== mode) return;
      drawFx(((now - began) % 1800) / 1800);
      pulse = requestAnimationFrame(loop);
    };
    pulse = requestAnimationFrame(loop);
  }
  function stopPulse() { if (pulse !== null) cancelAnimationFrame(pulse); pulse = null; }

  function setState({ grow, state, fxModeValue, calloutMode }) {
    stack.dataset.grow = grow;
    stack.dataset.state = state;
    fxMode = fxModeValue;
    if (key) key.hidden = state !== 'today';
    renderCallouts(calloutMode);
    if (fxModeValue === 'cover' || fxModeValue === 'wrap') startPulse(fxModeValue);
    else { stopPulse(); drawFx(); }
  }

  const FINAL = {
    cover: { grow: 'hidden', state: 'overview', fxModeValue: 'cover', calloutMode: 'cover' },
    many: { grow: 'shown', state: 'overview', fxModeValue: 'none', calloutMode: 'none' },
    travel: { grow: 'shown', state: 'today', fxModeValue: labels ? 'clusters' : 'none', calloutMode: 'travel' },
    outside: { grow: 'shown', state: 'today', fxModeValue: 'closed', calloutMode: 'outside' },
    takeaways: { grow: 'shown', state: 'today', fxModeValue: 'wrap', calloutMode: 'wrap' },
  };

  async function show(beatId, { from = null, animate = true, token } = {}) {
    current = beatId;
    paintBase();
    if (beatId === 'outside' && !closedMarks.length) closedMarks = chooseClosed().map(mark => ({ ...mark, scale: 1 }));
    if (!animate || failed) { setState(FINAL[beatId]); return; }

    if (beatId === 'many' && from === 'cover') {
      setState({ ...FINAL.cover, fxModeValue: 'none', calloutMode: 'cover-leaving' });
      stack.dataset.grow = 'hidden';
      void stack.offsetWidth;
      stack.dataset.grow = 'growing';
      await wait(2300, token);
      if (!token?.cancelled && current === 'many') stack.dataset.grow = 'shown';
      return;
    }
    if (beatId === 'travel' && (from === 'many' || from === 'cover')) {
      setState({ ...FINAL.many });
      fxMode = 'travel';
      const run = tween({ duration: 2600, easing: ease.inOut, update: t => { travel = t; drawFx(); } });
      token?.onCancel(() => run.cancel());
      const completed = await run.promise;
      if (!completed || token?.cancelled || current !== 'travel') return;
      stack.dataset.state = 'today';
      if (key) key.hidden = false;
      await wait(650, token);
      if (!token?.cancelled && current === 'travel') { renderCallouts('travel'); fxMode = labels ? 'clusters' : 'none'; drawFx(); }
      return;
    }
    if (beatId === 'outside' && from === 'travel') {
      setState({ ...FINAL.outside, calloutMode: 'none' });
      closedMarks.forEach(mark => { mark.scale = 0; });
      for (let index = 0; index < closedMarks.length; index += 1) {
        const mark = closedMarks[index];
        const run = tween({ duration: 380, easing: t => 1 - (1 - t) ** 3 * Math.cos(t * 5), update: t => { mark.scale = t; drawFx(); } });
        token?.onCancel(() => run.cancel());
        if (!(await run.promise) || token?.cancelled) { closedMarks.forEach(m => { m.scale = 1; }); drawFx(); return; }
        await wait(160, token);
      }
      if (!token?.cancelled && current === 'outside') renderCallouts('outside');
      return;
    }
    setState(FINAL[beatId]);
  }

  function todayScreenPoint() {
    if (failed) return null;
    const r = rect();
    const point = view().world(data().projection.today);
    return { x: point.x + (r.left - root.getBoundingClientRect().left), y: point.y + (r.top - root.getBoundingClientRect().top) };
  }

  function resize() {
    if (!current || root.hidden) return;
    paintBase();
    if (fxMode === 'travel') { drawFx(); return; }
    setState(FINAL[current] ?? FINAL.many);
  }
  new ResizeObserver(() => requestAnimationFrame(resize)).observe(stack);

  return { show, hide() { stopPulse(); }, todayScreenPoint, failed };
}
