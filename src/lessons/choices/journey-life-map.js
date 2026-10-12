// One life from the lives store, drawn in the Explore chapter's language
// (design 001 v13; ported from prototype/lesson1-opening/life-map.js). The
// drawing and placement helpers are in journey-life-draw.js, a changed life in
// journey-life-whatif.js. The same curves as the explorer (they leave and reach
// every dot level, so each dot sits where lines split), the same strokes, dots,
// star and diamond, the same label placement and end card. New here:
// - the route is a written life (lives/engine.js `writtenLife`) on an age axis
//   from 0 to 45, with gray lines leaving every dot: the alternatives the reader
//   may pick, or other things that could have happened there;
// - it is played by the story's clock (journey-life-player.js), one step at a time;
// - after the story, a choice can be changed (a gray label, or a ringed fork's
//   popover): the real path from that fork turns light and stays behind, and a
//   new life grows from the fork with the engine's `grow`, from a random seed.
// Drawing is split so a frame stays cheap: the gray lines and the routes are
// drawn once per step onto two stage-sized canvases, every dot, star and
// diamond onto a third above them (so a mark always sits on top of every line,
// cut clean by a ring of the map's colour), and only the step in motion is
// redrawn each frame, on a small canvas the size of that step. Labels, the
// choices to pick, the forks, their popover and the end card are HTML over the
// canvases.
import { canvasBitmap } from '../../engine/path-presentation.js';
import { prefersReducedMotion } from './journey-motion.js';
import { t } from '../../i18n/runtime.js';
import { grow } from './lives/engine.js';
import { BORN_Y, END, finalFrame } from './journey-life-player.js';
import { FOREST, MIST } from './journey-colors.js';
import {
  TAIL, AHEAD, MAX_AGE, TOP, BOTTOM, RIGHT, LIVED, GRAY, THIN, BAR, clamp, isSurprise, placeAges, widenRuns, spaceRun, runEdge,
  aheadFor, grayItems, pointOn, edgePoints, stroke, disc, drawMark, boundsOf, edgeBounds, inside, sampleGrid, createPlacer, labelHTML,
  setFadeFrom, escapeHTML,
} from './journey-life-draw.js';
import { createWhatIf } from './journey-life-whatif.js';

export function createLifeMap(stack, { origin, before = null, onPick = () => {}, onStep = () => {}, onDone = () => {}, onLeave = () => {} } = {}) {
  const make = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  const axis = make('div', 'life-axis');
  const graysCanvas = make('canvas', 'life-grays');
  const darkCanvas = make('canvas', 'life-dark');
  const marksCanvas = make('canvas', 'life-marks');
  const liveCanvas = make('canvas', 'life-live');
  const overlay = document.createElement('div');
  overlay.className = 'life-overlay';
  const card = document.createElement('div');
  card.className = 'explore-end life-end';
  card.hidden = true;
  const pop = document.createElement('div');
  pop.className = 'life-pop';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.dataset.localKeys = '';
  for (const element of [axis, graysCanvas, darkCanvas, marksCanvas, liveCanvas, overlay]) stack.insertBefore(element, before);
  const contexts = [graysCanvas, darkCanvas, marksCanvas, liveCanvas].map(canvas => { try { return canvas.getContext('2d'); } catch { return null; } });
  const [gx, dx, mx, lx] = contexts;
  const failed = contexts.some(context => !context);
  const boxOf = element => {
    const box = element.getBoundingClientRect();
    const home = stack.getBoundingClientRect();
    return { left: box.left - home.left, top: box.top - home.top, right: box.right - home.left, bottom: box.bottom - home.top };
  };
  // State the map shares with a changed life (journey-life-whatif.js).
  const S = {};
  const measure = (text, font) => { dx.save(); dx.font = font; const width = dx.measureText(text).width; dx.restore(); return width; };

  S.model = null; // the life on the map and its gray lines (setLife)
  let size = null;
  let geo = null;
  let mode = 'story';
  S.frame = null;
  S.baked = -1; // steps drawn whole onto the gray, dark and marks canvases
  S.aheadBaked = false;
  let lastPos = 0;
  let landFrom = null;
  S.what = null;
  let liveBox = '';
  S.shown = { labels: -1, alts: -1 };
  let visible = true;
  S.strokes = []; // every line on the gray and dark canvases, for the marks above them
  S.marks = []; // every mark on the marks canvas
  let openFork = null;

  // The life is laid out in the map's visible part: beside the narration the stage runs under the
  // column (opening.css), and the axis spans what is left of it.
  const rect = () => {
    if (!size) size = { width: axis.clientWidth || stack.clientWidth, height: stack.clientHeight };
    return size;
  };

  /** The life to draw (`writtenLife`) and the store to grow new lives from. */
  function setLife(life, store) {
    storyCache = null;
    W.stopWhat();
    closePop();
    placeAges(life.steps);
    const items = life.steps.flatMap((_, k) => (k ? grayItems(life.steps, k, life.id) : []));
    S.model = {
      life, store, items,
      picks: items.filter(item => item.pickable).sort((a, b) => a.age - b.age),
      forks: [...new Set(items.filter(item => item.pickable).map(item => item.stepIndex))].sort((a, b) => a - b),
      ahead: aheadFor(`${life.id}:ahead`, life.steps.at(-1).at, life.steps.at(-1).y),
    };
    geo = null;
    S.sizedFor = '';
    stopAhead();
    S.baked = -1; S.aheadBaked = false; lastPos = 0; landFrom = null;
    card.innerHTML = `<h2 tabindex="-1">${escapeHTML(t('opening.end.heading'))}</h2>
      <p>${escapeHTML(t('opening.end.gray', { name: life.name }))}</p>
      <div class="end-buttons"><button type="button" class="solid-pill" data-life="choose">${escapeHTML(t('opening.end.change', { pronoun: life.pronoun }))}</button>
      <button type="button" class="pill-button" data-life="another">${escapeHTML(t('opening.end.another'))}</button></div>`;
  }

  // ——— Where everything sits at this stage size ———
  // The layout holds for one life, stage size and Born: Born comes from the field's fit, which can
  // catch up with a stage's new size a moment later (leaving the cover with reduced motion).
  const layoutKey = () => { const r = rect(); const o = origin(); return `${S.model.life.id}|${r.width}x${r.height}|${Math.round(o.x)},${Math.round(o.y)}`; };
  function geometry() {
    const r = rect();
    const key = layoutKey();
    if (geo?.key === key) return geo;
    const o = origin();
    // A narrow stage keeps a band clear at the top for the end card's bar: the
    // route stays below it (its highest point is about 0.45 of the span above
    // Born) and no label goes in it.
    // Its height is the bar's own, measured in the page's language (German's text can take a line more
    // than English's), so the life is laid out clear of it whatever the words.
    const measuredBar = r.width < 800 ? cardSize(barClass()).h : 0;
    const BAR_HEIGHT = Math.max(BAR - 10, measuredBar);
    // The band runs from the map's top to 4 px under the bar (which sits 12 px down): 100 px for English's 83 px bar.
    const bar = r.width < 800 ? Math.max(BAR, 12 + measuredBar + 4) : 0;
    const span = Math.min(r.height - TOP - BOTTOM, bar ? (o.y - bar - 8) / 0.45 : Infinity);
    setFadeFrom(r.width - 64);
    // Even years: a later life has as many steps as its childhood, so it gets the same room.
    const X = age => o.x + (age / MAX_AGE) * (r.width - o.x - RIGHT);
    const Y = y => o.y + (y - BORN_Y) * span;
    const at = (age, y) => ({ x: X(age), y: Y(y) });
    const steps = S.model.life.steps;
    const points = spaceRun(widenRuns(steps.map(step => at(step.at, step.y)), steps), steps);
    const edges = points.map((point, index) => (index ? { a: points[index - 1], b: point, bend: 0, direct: runEdge(steps[index], steps[index - 1]) } : null));
    const alts = S.model.items.map(item => {
      const node = at(item.age, item.y);
      return {
        item, node,
        edge: { a: points[item.stepIndex - 1], b: node, bend: item.bend * span },
        tails: item.tails.map(tail => ({ a: node, b: at(tail.age, tail.y), bend: tail.bend * span })),
      };
    });
    const altsOf = steps.map((_, index) => alts.filter(entry => entry.item.stepIndex === index));
    const ahead = S.model.ahead.map(item => ({ a: points[END], b: at(item.age, item.y), bend: item.bend * span }));

    // Labels: the route's in age order (an earlier label never moves when a
    // later one arrives), then the gray choices, which give way to them.
    // The end card's bar goes across the top unless the route or the paths ahead reach into it
    // (the same test showCard makes); then it goes to the foot, and that band stays clear instead.
    const topBar = { left: 12, right: r.width - 12, top: 12, bottom: 12 + BAR_HEIGHT };
    const routeGrid = sampleGrid(edges.slice(1), points);
    const topBlocked = bar && (routeGrid(topBar) || [...points, ...ahead.map(edge => edge.b)].some(point => point.x > topBar.left - 18 && point.x < topBar.right + 18 && point.y > topBar.top - 18 && point.y < topBar.bottom + 18));
    const band = !bar ? [] : topBlocked ? [{ left: 0, right: r.width, top: r.height - 30 - BAR_HEIGHT - 6, bottom: r.height }] : [{ left: 0, right: r.width, top: 0, bottom: bar }];
    const newPlacer = () => createPlacer({ width: r.width, height: r.height, measure, paths: edges.slice(1), dots: points, right: 46, band,
      soft: [[...alts.map(entry => entry.edge), ...ahead], alts.flatMap(entry => entry.tails)] });
    // Every step keeps its label (round 7). All are placed before the story plays, in age order; a
    // label that found no room is placed first in a new try (up to three), so it gets first pick.
    const placeAll = first => {
      const placer = newPlacer();
      const labels = [];
      const along = index => (index ? edgePoints(edges[index]) : Array(21).fill(points[0]));
      for (const index of [...first, ...steps.map((_, at) => at).filter(at => !first.includes(at))]) labels[index] = placer.chosen(steps[index].label, along(index), points[index]);
      return { placer, labels };
    };
    let first = [];
    let placed = placeAll(first);
    for (let round = 0; round < 3 && placed.labels.some(label => !label); round += 1) {
      first = [...first, ...placed.labels.map((label, at) => (label ? -1 : at)).filter(at => at >= 0 && !first.includes(at))];
      const next = placeAll(first);
      if (next.labels.filter(Boolean).length >= placed.labels.filter(Boolean).length) placed = next;
    }
    const { placer, labels } = placed;
    // The tail nearest its own height carries a gray label on if the line itself is crowded.
    const altLine = entry => {
      const tail = [...entry.tails].sort((a, b) => Math.abs(a.b.y - entry.node.y) - Math.abs(b.b.y - entry.node.y))[0];
      return [...edgePoints(entry.edge), ...(tail ? edgePoints(tail).slice(1) : [])];
    };
    const grayLabels = alts.map(entry => (entry.item.pickable ? placer.gray(entry.item.label, altLine(entry)) : null));
    geo = { key, span, X, Y, at, points, edges, alts, altsOf, ahead, labels, grayLabels, placer, band };
    buildOverlay();
    applyMode();
    return geo;
  }

  // ——— HTML over the canvases: labels, the choices to pick, forks, pulses, the end card ———
  S.labelEls = [];
  S.altEls = [];
  let forkEls = [];
  let pulseEls = [];
  S.whatEls = [];
  function buildOverlay() {
    const g = geo;
    const steps = S.model.life.steps;
    overlay.innerHTML = `${g.labels.map((item, index) => labelHTML(item, 'is-dark', ` data-step="${index}"`)).join('')}
      ${g.alts.map((entry, index) => {
        const spot = g.grayLabels[index];
        if (!spot) return '';
        const step = steps[entry.item.stepIndex];
        return `<button type="button" class="life-alt" data-copy-ok="verb-heading" data-alt="${escapeHTML(entry.item.key)}" tabindex="-1" style="left:${spot.center.toFixed(1)}px;top:${spot.baseline.toFixed(1)}px"
          aria-label="${escapeHTML(t('opening.alt.label', { choice: spot.text, instead: step.label, age: step.age }))}"><span>${escapeHTML(spot.text)}</span></button>`;
      }).join('')}
      ${S.model.forks.map(index => `<button type="button" class="life-fork" data-step="${index}" data-local-keys tabindex="-1" aria-haspopup="dialog" aria-expanded="false"
        aria-label="${escapeHTML(t('opening.fork.label', { age: steps[index].age, choice: steps[index].label }))}" style="left:${g.points[index].x.toFixed(1)}px;top:${g.points[index].y.toFixed(1)}px"></button>`).join('')}
      <i class="life-pulse"></i><i class="life-pulse"></i>`;
    overlay.prepend(card);
    overlay.append(pop);
    S.labelEls = [...overlay.querySelectorAll('.life-label.is-dark')];
    S.altEls = [...overlay.querySelectorAll('.life-alt')];
    forkEls = [...overlay.querySelectorAll('.life-fork')];
    pulseEls = [...overlay.querySelectorAll('.life-pulse')];
    S.whatEls = [];
    S.shown = { labels: -1, alts: -1 };
    axis.innerHTML = `${[5, 10, 15, 20, 25, 30, 35, 40, 45].map(age => {
      const x = g.X(age);
      if (x < 64 || x > rect().width - 12) return '';
      return `<span class="life-tick" style="left:${x.toFixed(1)}px"><b>${age}</b></span>`;
    }).join('')}<span class="life-axis-name">${escapeHTML(t('explore.age'))}</span>`;
  }
  const itemFor = key => S.model.items.find(item => item.key === key);

  function showLabels(count, altCount) {
    if (count !== S.shown.labels) {
      S.shown.labels = count;
      S.labelEls.forEach(element => element.classList.toggle('is-shown', Number(element.dataset.step) < count));
    }
    if (altCount !== S.shown.alts) {
      S.shown.alts = altCount;
      S.altEls.forEach(element => element.classList.toggle('is-shown', itemFor(element.dataset.alt).stepIndex < altCount));
    }
  }

  // ——— Canvases ———
  function sizeCanvas(canvas, context, box) {
    const bitmap = canvasBitmap(box, devicePixelRatio || 1);
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) { canvas.width = bitmap.width; canvas.height = bitmap.height; }
    context.setTransform(bitmap.scale, 0, 0, bitmap.scale, -box.left * bitmap.scale, -box.top * bitmap.scale);
    context.clearRect(box.left, box.top, box.width, box.height);
  }
  const whole = () => ({ left: 0, top: 0, width: rect().width, height: rect().height });
  S.sizedFor = ''; // the stage size the base canvases were last drawn at
  function clearBase() {
    const r = rect();
    S.sizedFor = layoutKey();
    sizeCanvas(graysCanvas, gx, whole());
    sizeCanvas(darkCanvas, dx, whole());
    sizeCanvas(marksCanvas, mx, whole());
    S.baked = -1; S.aheadBaked = false;
    S.strokes = []; S.marks = [];
  }
  /** Draw lines onto a base canvas and remember them for the marks above. */
  function lay(layer, edges, color, width) {
    stroke(layer === 'dark' || layer === 'light' ? dx : gx, edges, color, width);
    for (const edge of edges) S.strokes.push({ edge, color, width, layer });
  }
  function paintMarks() {
    sizeCanvas(marksCanvas, mx, whole());
    for (const mark of S.marks) drawMark(mx, mark, S.strokes);
  }
  /** Move the live canvas over `box` (stage pixels) and clear it. */
  function useLive(bounds) {
    const r = rect();
    const box = {
      left: Math.max(0, Math.floor(bounds.left)), top: Math.max(0, Math.floor(bounds.top)),
    };
    box.width = Math.max(1, Math.min(r.width, Math.ceil(bounds.right)) - box.left);
    box.height = Math.max(1, Math.min(r.height, Math.ceil(bounds.bottom)) - box.top);
    const placed = `${box.left},${box.top},${box.width},${box.height}`;
    if (placed !== liveBox) {
      liveBox = placed;
      Object.assign(liveCanvas.style, { left: `${box.left}px`, top: `${box.top}px`, right: 'auto', bottom: 'auto', width: `${box.width}px`, height: `${box.height}px` });
    }
    sizeCanvas(liveCanvas, lx, box);
    return { left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height };
  }
  /** The marks under the live canvas, drawn again over the lines in motion (`moving`: those lines and how far they've grown). */
  function marksOver(box, moving) {
    const all = [...S.strokes, ...moving];
    for (const mark of S.marks) if (inside(mark.point, box)) drawMark(lx, mark, all);
  }
  const markFor = (point, kind, light = false) => ({ point, kind, light });

  // One step of the route, whole: the gray lines leaving the dot before it, then the line to its dot.
  function bakeStep(index) {
    const g = geometry();
    const steps = S.model.life.steps;
    if (index > 0) {
      for (const entry of g.altsOf[index]) {
        lay('gray', [entry.edge], MIST, GRAY);
        lay('tail', entry.tails, TAIL, THIN);
      }
      lay('dark', [g.edges[index]], FOREST, LIVED);
    }
    S.marks.push(markFor(g.points[index], steps[index].kind));
  }
  function bakeAhead() {
    const g = geometry();
    lay('ahead', g.ahead, AHEAD, 3);
    S.aheadBaked = true;
  }
  // Round 7: the paths still ahead grow out of the last dot on a clock of their own (AHEAD_MS, an
  // ease-out), never painted in one frame; the end card rises in AHEAD_CARD ms after they begin.
  // With reduced motion they are there at once.
  const AHEAD_MS = 900;
  const AHEAD_CARD = 300;
  const aheadEase = t => 1 - (1 - t) ** 3;
  let aheadGrow = null; // { started, raf }
  function growStoryAhead() {
    if (S.aheadBaked || aheadGrow) return;
    if (prefersReducedMotion()) { bakeTo(END + 1, true); restTraveller(); return; }
    const run = { started: performance.now(), raf: 0 };
    aheadGrow = run;
    const tick = now => {
      if (aheadGrow !== run) return;
      const g = geometry();
      const p = aheadEase(Math.min(1, (now - run.started) / AHEAD_MS));
      const end = g.points[END];
      if (p < 1) {
        const box = useLive(boundsOf([...g.ahead.flatMap(edgeBounds), end], 16));
        stroke(lx, g.ahead, AHEAD, 3, p);
        marksOver(box, g.ahead.map(edge => ({ edge, color: AHEAD, width: 3, layer: 'ahead', at: p })));
        traveller(lx, end, false);
        run.raf = requestAnimationFrame(tick);
        return;
      }
      aheadGrow = null;
      bakeTo(END + 1, true);
      restTraveller();
    };
    run.raf = requestAnimationFrame(tick);
  }
  function stopAhead() {
    if (aheadGrow) cancelAnimationFrame(aheadGrow.raf);
    aheadGrow = null;
  }
  function restTraveller() {
    const g = geometry();
    const end = g.points[END];
    const box = useLive(boundsOf([end], 16));
    marksOver(box, []);
    traveller(lx, end, false);
  }
  function bakeTo(count, ahead) {
    const r = rect();
    // The first drawing at a stage size sizes the canvases first.
    if (S.sizedFor !== layoutKey() || count < S.baked + 1 || (S.aheadBaked && !ahead)) clearBase();
    const before = S.baked;
    for (let index = S.baked + 1; index < count; index += 1) bakeStep(index);
    S.baked = Math.max(S.baked, count - 1);
    const grew = ahead && !S.aheadBaked;
    if (grew) bakeAhead();
    if (S.baked !== before || grew || !S.marks.length) paintMarks();
    if (grew) keepStory();
  }

  // The finished story's drawing is kept (a copy of its three base canvases and what they hold),
  // so going back to it from a changed life ("Try another choice", "Back to Sam's life") puts it
  // back in one copy instead of drawing every step again. Copied in a quiet moment.
  let storyCache = null;
  const idleTime = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 200));
  function keepStory() {
    const key = layoutKey();
    if (storyCache?.key === key) return;
    idleTime(() => {
      if (S.what || S.baked < END || !S.aheadBaked || S.sizedFor !== key || layoutKey() !== key) return;
      const copies = [graysCanvas, darkCanvas, marksCanvas].map(canvas => {
        const copy = document.createElement('canvas');
        copy.width = canvas.width; copy.height = canvas.height;
        copy.getContext('2d').drawImage(canvas, 0, 0);
        return copy;
      });
      storyCache = { key, copies, strokes: S.strokes.slice(), marks: S.marks.slice() };
    }, { timeout: 2000 });
  }
  /** The finished story from its copy, when one was kept at this size; false when there is none. */
  function reuseStory() {
    if (storyCache?.key !== layoutKey()) return false;
    [[graysCanvas, gx], [darkCanvas, dx], [marksCanvas, mx]].forEach(([canvas, context], at) => {
      sizeCanvas(canvas, context, whole());
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(storyCache.copies[at], 0, 0);
      context.restore();
    });
    S.sizedFor = storyCache.key;
    S.baked = END; S.aheadBaked = true;
    S.strokes = storyCache.strokes.slice(); S.marks = storyCache.marks.slice();
    return true;
  }

  // The traveller: moving, a dot with a soft halo; resting, a slightly larger dot.
  function traveller(context, point, moving, scale = 1) {
    if (moving) disc(context, point, 13 * scale, 'rgba(40,84,66,.16)');
    disc(context, point, (moving ? 7 : 7.5) * scale, FOREST);
  }

  // ——— The story, one frame at a time ———
  function drawStory() {
    const g = geometry();
    const f = S.frame;
    if (!f) return;
    const steps = S.model.life.steps;
    const index = Math.min(f.index, END + 1);
    if (f.landing !== null) {
      bakeTo(END + 1, S.aheadBaked);
      growStoryAhead();
      showLabels(END + 1, END + 1);
      if (landFrom === null) landFrom = lastPos;
      const pos = landFrom + (END - landFrom) * f.landing;
      const at = positionAt(pos);
      const box = useLive(boundsOf([at, g.points[END]], 16));
      marksOver(box, []);
      traveller(lx, at, f.landing < 1);
      lastPos = pos;
      pulses([]);
      return;
    }
    landFrom = null;
    const close = f.index > END;
    // Mid-story (a replay, or a review capture held at a step) the paths ahead are not growing.
    if (!close) stopAhead();
    bakeTo(close ? END + 1 : index, close && S.aheadBaked);
    showLabels(close ? END + 1 : index + (f.label ? 1 : 0), close ? END + 1 : index + (f.label ? 1 : 0));
    pulses(f.pulses);
    if (f.index < 0) { useLive({ left: 0, top: 0, right: 1, bottom: 1 }); lastPos = 0; return; }
    const end = g.points[END];
    if (close) {
      // The paths ahead start to grow as the closing line's walk would begin, or at once when the story lands whole.
      if (f.sprout > 0 || f.resting) growStoryAhead();
      if (!aheadGrow) restTraveller();
      lastPos = END;
      return;
    }
    const step = steps[index];
    const here = g.points[index];
    if (index === 0) {
      useLive(boundsOf([here], 16));
      drawMark(lx, markFor(here, step.kind), S.strokes, f.bloom);
      traveller(lx, here, false, f.appear);
      lastPos = 0;
      return;
    }
    const edge = g.edges[index];
    const items = g.altsOf[index];
    const box = useLive(boundsOf([...edgeBounds(edge), ...items.flatMap(entry => [...edgeBounds(entry.edge), ...entry.tails.flatMap(edgeBounds)])], 16));
    // The gray lines grow from the dot it leaves, as it leaves it.
    const moving = [];
    for (const entry of items) {
      stroke(lx, [entry.edge], MIST, GRAY, f.sprout);
      stroke(lx, entry.tails, TAIL, THIN, f.tails);
      moving.push({ edge: entry.edge, color: MIST, width: GRAY, layer: 'gray', at: f.sprout });
    }
    stroke(lx, [edge], FOREST, LIVED, f.walk);
    moving.push({ edge, color: FOREST, width: LIVED, layer: 'dark', at: f.walk });
    marksOver(box, moving);
    // The new dot blooms as the traveller arrives; a star or diamond over the traveller, so it shows while he stands there.
    if (!isSurprise(step.kind)) drawMark(lx, markFor(here, step.kind), [...S.strokes, ...moving], f.bloom);
    traveller(lx, pointOn(edge, f.walk), f.walk < 1);
    if (isSurprise(step.kind)) drawMark(lx, markFor(here, step.kind), S.strokes, f.bloom);
    lastPos = index - 1 + f.walk;
  }
  function positionAt(pos) {
    const g = geometry();
    if (pos <= 0) return g.points[0];
    const index = Math.min(END, Math.floor(pos) + 1);
    return pointOn(g.edges[index], Math.min(1, pos - (index - 1)));
  }
  // Earlier steps this one builds on answer with one ring each.
  function pulses(list) {
    const g = geometry();
    pulseEls.forEach((element, order) => {
      const item = list[order];
      if (!item) { if (element.style.opacity !== '0') element.style.opacity = '0'; return; }
      const point = g.points[item.at];
      const eased = 1 - (1 - item.p) ** 2;
      const radius = 7 + 15 * eased;
      Object.assign(element.style, { left: `${point.x}px`, top: `${point.y}px`, width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: String(0.6 * (1 - item.p)) });
    });
  }

  // ——— Modes ———
  function applyMode() {
    stack.dataset.life = mode;
    const picking = mode === 'ended' || mode === 'choosing' || mode === 'whatif';
    S.altEls.forEach(element => { element.disabled = !picking; });
    forkEls.forEach(element => { element.tabIndex = mode === 'choosing' ? 0 : -1; element.disabled = mode !== 'choosing'; });
    if (mode !== 'choosing') closePop();
  }
  function setMode(next) {
    mode = next;
    applyMode();
    if (next === 'ended') showCard(); else { card.hidden = true; S.altEls.forEach(element => element.classList.remove('is-under-card')); }
  }

  // ——— A fork's popover: its other choices as chips ———
  function openPop(stepIndex) {
    const g = geometry();
    const step = S.model.life.steps[stepIndex];
    const fork = forkEls.find(element => Number(element.dataset.step) === stepIndex);
    if (!fork) return;
    closePop();
    openFork = fork;
    fork.setAttribute('aria-expanded', 'true');
    const title = t('opening.fork.title', { age: step.age });
    pop.setAttribute('aria-label', title);
    pop.innerHTML = `<p class="life-pop-title">${escapeHTML(title)}</p><div class="life-chips">${S.model.picks.filter(item => item.stepIndex === stepIndex)
      .map(item => `<button type="button" class="life-chip" data-alt="${escapeHTML(item.key)}">${escapeHTML(item.label)}</button>`).join('')}</div>`;
    pop.hidden = false;
    pop.style.cssText = 'visibility:hidden;left:0;top:0';
    // Below the fork, or above it when that runs off the stage; always inside it.
    const r = rect();
    const width = pop.offsetWidth; const height = pop.offsetHeight;
    const point = g.points[stepIndex];
    let top = point.y + 24;
    if (top + height > r.height - 8) top = point.y - 24 - height;
    top = clamp(top, 8, Math.max(8, r.height - height - 8));
    const left = clamp(point.x - 28, 8, Math.max(8, r.width - width - 8));
    pop.style.cssText = `left:${left.toFixed(1)}px;top:${top.toFixed(1)}px`;
    pop.querySelector('.life-chip')?.focus({ preventScroll: true });
  }
  function closePop({ focusFork = false } = {}) {
    if (pop.hidden) return;
    // Hidden, not emptied: taking out the focused chip would make the browser restyle the page then and there.
    pop.hidden = true;
    const fork = openFork;
    openFork = null;
    fork?.setAttribute('aria-expanded', 'false');
    if (focusFork) fork?.focus({ preventScroll: true });
  }
  overlay.addEventListener('click', event => {
    const fork = event.target.closest('.life-fork');
    if (fork && !fork.disabled) {
      if (openFork === fork) closePop({ focusFork: true }); else openPop(Number(fork.dataset.step));
    }
  });
  overlay.addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const chip = event.target.closest('.life-chip');
    const fork = event.target.closest('.life-fork');
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (chip && keys[event.key]) {
      const chips = [...pop.querySelectorAll('.life-chip')];
      chips[(chips.indexOf(chip) + keys[event.key] + chips.length) % chips.length].focus({ preventScroll: true });
      event.preventDefault();
    } else if (chip && event.key === 'Escape') {
      closePop({ focusFork: true });
      event.preventDefault();
    } else if (fork && keys[event.key]) {
      // The forks in age order.
      const next = forkEls[forkEls.indexOf(fork) + keys[event.key]];
      next?.focus({ preventScroll: true });
      event.preventDefault();
    } else if (fork && event.key === 'Escape') {
      event.preventDefault();
      onLeave();
    }
  });
  // A tab or click away closes the popover.
  // A press inside the popover keeps the focus where it is: Safari doesn't focus a pressed button, so
  // the chip would lose focus, the popover would close (below) and the click would land on the map.
  pop.addEventListener('mousedown', event => event.preventDefault());
  pop.addEventListener('focusout', event => {
    if (!pop.hidden && !pop.contains(event.relatedTarget) && event.relatedTarget !== openFork) closePop();
  });
  document.addEventListener('pointerdown', event => {
    if (!pop.hidden && !pop.contains(event.target) && !event.target.closest?.('.life-fork')) closePop();
  });

  // While the end card shows, grow one life no one sees, so the engine is warm and the first
  // pick costs what later ones do.
  let warmFor = null;
  function warmUp() {
    const first = S.model?.picks[0];
    if (!first || warmFor === S.model.life.id) return;
    warmFor = S.model.life.id;
    const run = () => { if (S.model?.life.id === warmFor) grow(S.model.store, { baseline: S.model.life.id, forkIndex: first.stepIndex, alt: first.id, seed: 'warm-up' }); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 }); else setTimeout(run, 300);
  }
  // The end card: lower right as in the explorer, unless that covers the route
  // or its labels; then the clear corner; on a stage too small for both, a bar.
  // The card's size can change after it is placed (a font that loads late), so it is placed again,
  // without arriving again, when it does.
  let placedSize = null;
  // Its size in either shape comes from a fresh copy: after the card's own class changes, WebKit
  // restyles its title and text only on the next frame, so measuring the card itself reads the old shape.
  function cardSize(className) {
    const probe = card.cloneNode(true);
    probe.hidden = false;
    probe.inert = true;
    probe.className = className;
    probe.style.cssText = 'visibility:hidden';
    overlay.append(probe); // laid out in the map's visible part, as the card itself is
    const size = { w: probe.offsetWidth, h: probe.offsetHeight, over: probe.scrollWidth > probe.clientWidth + 1 };
    probe.remove();
    return size;
  }
  // The bar's shape: text and buttons in one row, or the buttons under the text when the row would not
  // fit their words (a narrow map, a longer language).
  const BAR_CLASS = 'explore-end life-end is-bar';
  const barClass = () => (cardSize(BAR_CLASS).over ? `${BAR_CLASS} is-stack` : BAR_CLASS);
  if (typeof ResizeObserver === 'function') {
    // On the next frame, so the move isn't made while the observer is still delivering.
    let queued = false;
    new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (card.hidden || !placedSize) return;
        if (Math.abs(card.offsetWidth - placedSize.w) > 2 || Math.abs(card.offsetHeight - placedSize.h) > 2) showCard({ again: true });
      });
    }).observe(card);
  }
  function showCard({ again = false } = {}) {
    warmUp();
    const g = geometry();
    const r = rect();
    card.hidden = false;
    card.classList.remove('is-bar', 'is-stack');
    card.style.cssText = 'visibility:hidden';
    const { w: width, h: height } = cardSize('explore-end life-end');
    const close = (box, others) => others.some(other => box.left < other.right + 6 && box.right > other.left - 6 && box.top < other.bottom + 6 && box.bottom > other.top - 6);
    const dark = S.labelEls.filter(element => element.classList.contains('is-shown')).map(boxOf);
    const gray = S.altEls.filter(element => element.classList.contains('is-shown')).map(boxOf);
    // Never over the route, its dots, its labels or the paths still ahead; gray lines may pass under, as in the explorer.
    const blocked = (box, strict) => g.placer.onPath(box) || close(box, dark) || (strict && close(box, gray))
      || [...g.points, ...g.ahead.map(edge => edge.b)].some(point => point.x > box.left - 18 && point.x < box.right + 18 && point.y > box.top - 18 && point.y < box.bottom + 18);
    const spots = [
      { right: 22, bottom: 44 }, { right: 22, bottom: 96 }, { left: 16, bottom: 44 }, { left: 16, top: 16 }, { right: 22, top: 16 },
    ].map(spot => ({ ...spot, box: {
      left: spot.left ?? r.width - spot.right - width, top: spot.top ?? r.height - spot.bottom - height,
      right: (spot.left ?? r.width - spot.right - width) + width, bottom: (spot.top ?? r.height - spot.bottom - height) + height,
    } }));
    // A gray label the card has to cover steps out of sight (its ring and popover still offer it), as
    // gray labels step aside for dark ones.
    const coverGray = box => S.altEls.forEach(element => element.classList.toggle('is-under-card', element.classList.contains('is-shown') && close(box, [boxOf(element)])));
    const spot = spots.find(item => !blocked(item.box, true)) ?? spots.find(item => !blocked(item.box, false));
    if (spot) {
      card.style.cssText = `left:${spot.box.left}px;top:${spot.box.top}px;right:auto;bottom:auto`;
      coverGray(spot.box);
      placedSize = { w: width, h: height };
      if (!again) cardArrive();
      return;
    }
    // A stage too small for a card gets a bar across the map's empty top, or else its foot.
    const shape = barClass();
    card.className = shape;
    const barSize = cardSize(shape);
    const barHeight = barSize.h;
    const bar = top => ({ left: 12, right: r.width - 12, top, bottom: top + barHeight });
    // When neither is clear (a label a few px too close), the one that covers the fewest labels and dots.
    const spots2 = [...g.points, ...g.ahead.map(edge => edge.b)];
    const covers = box => dark.filter(other => close(box, [other])).length
      + spots2.filter(point => point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.bottom).length;
    const choose = () => {
      const tops = [12, r.height - 30 - barHeight];
      return tops.find(y => !blocked(bar(y), false)) ?? tops.reduce((best, y) => (covers(bar(y)) < covers(bar(best)) ? y : best));
    };
    const top = choose();
    card.style.cssText = `top:${top}px;bottom:auto`;
    coverGray(bar(top));
    placedSize = barSize;
    if (!again) cardArrive();
  }
  // The card fades and rises in (opening.css, .is-arriving), AHEAD_CARD ms after the paths ahead begin.
  function cardArrive() {
    card.classList.remove('is-arriving');
    if (prefersReducedMotion()) return;
    void card.offsetWidth;
    const delay = aheadGrow ? Math.max(0, aheadGrow.started + AHEAD_CARD - performance.now()) : 0;
    card.style.animationDelay = `${Math.round(delay)}ms`;
    card.classList.add('is-arriving');
  }

  // A life the person could have lived: picking a choice, growing it, and going back (journey-life-whatif.js).
  const W = createWhatIf(S, { stack, overlay, card, graysCanvas, darkCanvas, marksCanvas, liveCanvas, gx, dx, lx, rect, measure, boxOf, geometry, layoutKey, setMode, closePop, stopAhead, pulses, sizeCanvas, whole, lay, paintMarks, useLive, marksOver, markFor, traveller, itemFor, labelHTML, onPick, onStep, onDone });

  /** Back to the written life exactly as the story left it. */
  function restore(nextMode = 'ended') {
    W.ghostOut();
    W.stopWhat();
    if (!reuseStory()) clearBase();
    S.frame = finalFrame();
    S.shown = { labels: -1, alts: -1 };
    drawStory();
    setMode(nextMode);
  }

  return {
    failed,
    get mode() { return mode; },
    get what() { return S.what; },
    get life() { return S.model?.life ?? null; },
    setLife,
    /** The story's sink: one moment of the life. */
    setFrame(next) {
      S.frame = next;
      if (failed || !S.model || mode === 'whatif') return;
      geometry();
      drawStory();
    },
    setMode(next) {
      if (next !== 'whatif' && S.what) restore(next);
      else setMode(next);
    },
    pick: (...args) => W.pick(...args),
    finishWhat: () => W.finishWhat(),
    restore,
    /** The stage changed size: everything is placed again. */
    resize() {
      if (failed || !S.model) return;
      const placed = geo?.key;
      size = null;
      const key = layoutKey();
      // A second call for the same size (the observer after a settle) has nothing to redo.
      if (placed === key && S.sizedFor === key) return;
      closePop();
      geo = null; liveBox = '';
      geometry();
      if (S.what) {
        W.finishWhat();
        const { item, seed } = S.what;
        W.stopWhat();
        W.pick(item.key, { reduced: true, silent: true, seed });
        return;
      }
      clearBase();
      drawStory();
      setMode(mode);
    },
    setVisible(value) { visible = value; },
    get visible() { return visible; },
    points: () => geometry().points,
    endPoint: () => (S.what ? S.what.nodes.at(-1).point : geometry().points[END]),
    /** What the map's chips must stay clear of: the labels (in "Choices add up" the gray choices' labels step back). */
    occupied: () => [...S.labelEls, ...(mode === 'adds' ? [] : S.altEls)].filter(element => element.classList.contains('is-shown')).map(boxOf),
    /**
     * The dark labels showing, with their step and their box as laid out (not as drawn, which a
     * transition may be moving), for "Choices add up", which may step some back.
     */
    darkLabels: () => {
      const g = geometry();
      return S.labelEls.filter(element => element.classList.contains('is-shown')).map(element => {
        const step = Number(element.dataset.step);
        return { element, step, box: g.labels[step]?.box ?? boxOf(element) };
      });
    },
    layers: { axis, grays: graysCanvas, dark: darkCanvas, marks: marksCanvas, live: liveCanvas, overlay },
    card,
    /** Every alternative the reader may pick, in age order: `{ key, stepIndex, id, label, whatIf }`. */
    picks: () => S.model?.picks ?? [],
    forks: () => forkEls,
    openFork: openPop,
    closeFork: closePop,
    focusFirstFork() { forkEls.find(element => !element.disabled)?.focus({ preventScroll: true }); },
    onCard(handler) { card.addEventListener('click', event => { const action = event.target.closest('[data-life]')?.dataset.life; if (action) handler(action); }); },
    onAlt(handler) { overlay.addEventListener('click', event => { const button = event.target.closest('.life-alt, .life-chip'); if (button && !button.disabled) handler(button.dataset.alt); }); },
    geometry,
  };
}
