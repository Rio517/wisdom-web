// A life the person could have lived (design 001 v13; ported from
// prototype/lesson1-opening/life-map.js): after the story, a picked choice grows a
// new life from its fork while the person's own path stays, light, behind it.
// `S` is the state it shares with the life map (journey-life-map.js); `api` the map's helpers.
import { ease, prefersReducedMotion } from './journey-motion.js';
import { grow, heights, newSeed } from './lives/engine.js';
import { END, RUN_PACE } from './journey-life-player.js';
import { FOREST, MIST } from './journey-colors.js';
import {
  TAIL, AHEAD, LIGHT, LIVED, GRAY, THIN, TOP, BOTTOM, RIGHT, isSurprise, inRun, placeAges, widenRuns, spaceRun, runEdge,
  aheadFor, grayItems, pointOn, edgePoints, stroke, drawMark, boundsOf, edgeBounds, sampleGrid, createPlacer,
} from './journey-life-draw.js';

export function createWhatIf(S, api) {
  const {
    stack, overlay, card, graysCanvas, darkCanvas, marksCanvas, liveCanvas, gx, dx, lx, rect, measure, boxOf, geometry, layoutKey, setMode, closePop, stopAhead, pulses, sizeCanvas, whole, lay, paintMarks, useLive, marksOver, markFor, traveller, itemFor, labelHTML, onPick, onStep, onDone,
  } = api;

  // ——— A life the person could have lived ———
  /**
   * Pick an alternative: the real path from that fork turns light and stays
   * behind, and a new life grows from the fork along the choice to the life's
   * end, at the explorer's walking speed. A new `seed` grows a different life
   * each time; `reduced` shows it at once.
   */
  function pick(altKey, { reduced = prefersReducedMotion(), silent = false, seed = newSeed() } = {}) {
    const item = itemFor(altKey);
    if (!item?.pickable) return null;
    if (!reduced) ghostOut();
    stopWhat();
    stopAhead();
    closePop();
    const g = geometry();
    const steps = S.model.life.steps;
    const k = item.stepIndex;
    const life = grow(S.model.store, { baseline: S.model.life.id, forkIndex: k, alt: item.id, seed });
    if (!life) return null;
    // The new life leaves from where its gray line ended, and goes on from there.
    life.steps[k].fixedY = item.y;
    heights(life.steps).forEach((y, index) => { life.steps[index].y = y; });
    const entry = g.alts.find(other => other.item.key === altKey);
    placeAges(life.steps);
    const grown = life.steps.slice(k);
    const nodes = grown.map((step, index) => ({ ...step, point: index ? g.at(step.at, step.y) : entry.node }));
    spaceRun(widenRuns(nodes.map(node => node.point), nodes), nodes).forEach((point, index) => { nodes[index].point = point; });
    // Each new dot sits only where its own lines split: none lands on the real
    // path behind it, and the new life's last dot keeps clear of it.
    const realLine = g.edges.slice(k).flatMap(edge => edgePoints(edge, 30));
    const clearOf = (point, clearance) => {
      for (const q of realLine) {
        const dx = q.x - point.x;
        if (dx < clearance && dx > -clearance && Math.hypot(dx, q.y - point.y) < clearance) return false;
      }
      return true;
    };
    const r = rect();
    nodes.forEach((node, index) => {
      const clearance = index === nodes.length - 1 ? 30 : 18;
      if (!index || clearOf(node.point, clearance)) return;
      // Up or down, away from the real path on the side the dot is on; beside a
      // steep stretch of it, a little earlier or later instead. Never past a neighbour.
      const nearest = realLine.reduce((best, q) => (Math.hypot(q.x - node.point.x, q.y - node.point.y) < Math.hypot(best.x - node.point.x, best.y - node.point.y) ? q : best));
      const away = node.point.y > nearest.y ? 1 : -1;
      const side = node.point.x > nearest.x ? 1 : -1;
      // A run's dots sit closer: they may stay as near their neighbours as they already are.
      const near = (a, b) => (inRun(a) && a.run === b.run ? Math.max(4, Math.abs(g.X(a.at) - g.X(b.at)) - 2) : 14);
      const lo = nodes[index - 1].point.x + near(nodes[index - 1], node);
      const hi = index < nodes.length - 1 ? g.at(nodes[index + 1].at, nodes[index + 1].y).x - near(node, nodes[index + 1]) : r.width - RIGHT;
      for (let shift = 2; shift <= 90; shift += 2) {
        const moved = [[0, away], [0, -away], [side, 0], [-side, 0]]
          .filter(([sx]) => !sx || shift <= 28)
          .map(([sx, sy]) => ({ x: node.point.x + sx * shift, y: node.point.y + sy * shift }))
          .find(point => point.y > TOP && point.y < r.height - BOTTOM && point.x > lo && point.x < hi && clearOf(point, clearance));
        if (moved) { node.point = moved; return; }
      }
    });
    const edges = nodes.map((node, index) => (index ? { a: nodes[index - 1].point, b: node.point, bend: 0, direct: runEdge(node, nodes[index - 1]) } : entry.edge));
    // The gray lines at each new dot: other things that could have happened there
    // (the first fork's are the person's own other choices, already on the map).
    const siblings = nodes.map((node, index) => (index ? grayItems(life.steps, k + index, `${S.model.life.id}:${seed}`).map(other => {
      const end = g.at(other.age, other.y);
      return {
        edge: { a: nodes[index - 1].point, b: end, bend: other.bend * g.span },
        tails: other.tails.map(tail => ({ a: end, b: g.at(tail.age, tail.y), bend: tail.bend * g.span })),
      };
    }) : []));
    const last = nodes.at(-1);
    const ahead = aheadFor(`${S.model.life.id}:${seed}:ahead`, last.at, last.y).map(next => ({ a: last.point, b: g.at(next.age, next.y), bend: next.bend * g.span }));
    // Labels for the new life, clear of what stays on the map.
    const visibleBoxes = () => [...[...S.labelEls.filter(element => element.classList.contains('is-shown')),
      ...S.altEls.filter(element => { const other = itemFor(element.dataset.alt); return other.stepIndex <= k && other.key !== altKey; })].map(boxOf)];
    const soft = [[...siblings.flat().map(sibling => sibling.edge), ...ahead], siblings.flat().flatMap(sibling => sibling.tails)];
    // The new life's labels are placed in age order, a few each frame while it
    // starts to grow (or at once when it must show whole), so a pick stays one short task.
    const placers = () => {
      const boxes = visibleBoxes();
      return [
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes, band: g.band, soft,
          paths: [...g.edges.slice(1), ...edges], dots: [...g.points, ...nodes.map(node => node.point)] }),
        createPlacer({ width: r.width, height: r.height, measure, right: 46, boxes, band: g.band,
          // Its labels may cross the old path's lines, but never sit on its dots (round 7: it stays visible).
          paths: [...g.edges.slice(1, k), ...edges], dots: [...g.points, ...nodes.map(node => node.point)] }),
      ];
    };
    S.what = { item, k, fork: k - 1, life, seed, nodes, edges, siblings, ahead, labels: [], placers, reached: 0, frame: null, labelFrame: null, drawn: false, done: false, silent };
    setMode('whatif');
    overlay.querySelectorAll('.life-label.is-what').forEach(element => element.remove());
    S.whatEls = [];
    // The later labels and choices step aside; the real path stays, light, behind the new one. At
    // level c its lucky breaks, setbacks and last step keep a muted label (opening.css, .is-old).
    const newRoute = sampleGrid(edges, nodes.map(node => node.point));
    const keepsOld = index => index >= k && (isSurprise(steps[index].kind) || index === END)
      && Boolean(g.labels[index]) && !newRoute(g.labels[index].box, 4);
    S.labelEls.forEach(element => {
      const index = Number(element.dataset.step);
      element.classList.toggle('is-shown', index < k || keepsOld(index));
      element.classList.toggle('is-old', keepsOld(index));
    });
    S.altEls.forEach(element => {
      const other = itemFor(element.dataset.alt);
      element.classList.toggle('is-shown', other.stepIndex <= k && other.key !== altKey);
    });
    S.shown = { labels: -1, alts: -1 };
    pulses([]);
    if (!silent) onPick({ item, age: steps[k].age, life, nodes, seed });
    if (reduced) { finishWhat(); S.what.silent = false; return S.what; }
    S.what.planFrame = requestAnimationFrame(() => planAhead(S.what));
    // The map behind it changes over the next two frames (the gray lines, then
    // the routes), the new life starts to grow, and its labels follow, one a frame.
    const run = S.what;
    run.frame = requestAnimationFrame(() => {
      if (S.what !== run) return;
      redrawWhat('grays');
      run.frame = requestAnimationFrame(() => {
        run.frame = null;
        if (S.what !== run) return;
        redrawWhat('dark');
        run.drawn = true;
        walkWhat(1);
        run.labelFrame = requestAnimationFrame(() => placeSome(run));
      });
    });
    return S.what;
  }
  // The map behind a new life, at once (it must show whole before its frames came).
  function drawn(run) {
    if (run.drawn) return;
    run.drawn = true;
    redrawWhat();
  }
  // Labels for the new life up to node `upTo`, clear of what stays on the map.
  // Every step of the new life keeps its label (round 7). All its labels are planned before the
  // first is shown, as the story's are (a label that found no room gets first pick in a new try, up
  // to three), a few a frame from the pick on, so the pick stays a short task; the first label is
  // needed about a second later. When the life must show at once, the rest are planned there.
  const PLAN_MS = 8; // planning time a frame
  function planStep(run, budget = PLAN_MS) {
    const count = run.edges.length;
    let job = run.planJob;
    if (!job) {
      const [placer, loose] = run.placers();
      const first = run.planFirst ?? [];
      // The pick's own label always goes first, so it is the same in every try and can show at once.
      job = run.planJob = { placer, loose, spots: [], order: [0, ...first.filter(at => at), ...Array.from({ length: count }, (_, at) => at).filter(at => at && !first.includes(at))], at: 0 };
    }
    const started = performance.now();
    for (; job.at < job.order.length && (job.at === 0 || performance.now() - started < budget); job.at += 1) {
      const index = job.order[job.at];
      const text = run.nodes[index].label;
      const points = edgePoints(run.edges[index]);
      const spot = job.placer.chosen(text, points) ?? job.loose.chosen(text, points);
      if (spot) { job.placer.reserve(spot.box); job.loose.reserve(spot.box); }
      job.spots[index] = spot;
    }
    if (job.at < job.order.length) return false;
    // A pass is done: keep the better of it and the last, and try again with the misses first.
    const placed = list => list.filter(Boolean).length;
    if (!run.planBest || placed(job.spots) >= placed(run.planBest)) run.planBest = job.spots;
    run.planJob = null;
    run.planRound = (run.planRound ?? 0) + 1;
    const misses = run.planBest.map((spot, at) => (spot ? -1 : at)).filter(at => at >= 0);
    if (misses.length && run.planRound < 6) {
      run.planFirst = [...(run.planFirst ?? []), ...misses.filter(at => !(run.planFirst ?? []).includes(at))];
      return false;
    }
    // The new life's labels come first: if the old path's muted labels leave one no room, they step
    // back (level b for this life) and the plan starts again.
    const old = S.labelEls.filter(element => element.classList.contains('is-old'));
    if (misses.length && old.length) {
      old.forEach(element => element.classList.remove('is-old', 'is-shown'));
      run.planBest = null; run.planRound = 0; run.planFirst = [];
      return false;
    }
    run.plan = run.planBest;
    return true;
  }
  function planLabels(run, upTo = Infinity) {
    // The pick's own label is final once the first try has placed it.
    if (upTo === 0 && !run.plan) {
      if (!run.planBest && !(run.planJob?.at > 0)) planStep(run, 0);
      return run.planBest ?? run.planJob.spots;
    }
    while (!run.plan) planStep(run, Infinity);
    return run.plan;
  }
  // Plan in the background, a few labels a frame, until done or the life is gone.
  function planAhead(run) {
    if (run.plan || S.what !== run) return;
    if (planStep(run)) return;
    run.planFrame = requestAnimationFrame(() => planAhead(run));
  }
  // Labels for the new life up to node `upTo`, from the plan.
  function placeLabels(run, upTo) {
    if (run.labels.length > upTo) return;
    const plan = planLabels(run, upTo);
    let html = '';
    for (let index = run.labels.length; index <= upTo && index < run.edges.length; index += 1) {
      run.labels.push(plan[index]);
      html += labelHTML(plan[index], 'is-dark is-what', ` data-what="${index}"`);
    }
    if (!html) return;
    overlay.insertAdjacentHTML('beforeend', html);
    S.whatEls = [...overlay.querySelectorAll('.life-label.is-what')];
  }
  // One label a frame until all are placed: long before the traveller reaches the first.
  function placeSome(run) {
    if (S.what !== run || run.labels.length >= run.edges.length) { run.labelFrame = null; return; }
    placeLabels(run, run.labels.length);
    run.labelFrame = requestAnimationFrame(() => placeSome(run));
  }

  /** The map behind a new life: `grays`, `dark` or both canvases (the marks follow the dark one). */
  function redrawWhat(part = 'both') {
    const g = geometry();
    const steps = S.model.life.steps;
    const k = S.what.k;
    S.baked = -1; S.aheadBaked = false;
    if (part !== 'dark') {
      sizeCanvas(graysCanvas, gx, whole());
      S.strokes = S.strokes.filter(item => item.layer === 'dark' || item.layer === 'light');
      // The gray lines up to the fork (the picked one becomes the new life's first line).
      for (let index = 1; index <= k; index += 1) {
        for (const entry of g.altsOf[index]) {
          if (entry.item.key === S.what.item.key) continue;
          lay('gray', [entry.edge], MIST, GRAY);
          lay('tail', entry.tails, TAIL, THIN);
        }
      }
      for (let index = 1; index <= S.what.reached; index += 1) bakeWhatEdge(index, 'grays');
    }
    if (part === 'grays') return;
    sizeCanvas(darkCanvas, dx, whole());
    S.sizedFor = layoutKey();
    S.strokes = S.strokes.filter(item => item.layer !== 'dark' && item.layer !== 'light');
    S.marks = [];
    // The real path from the fork: light, behind.
    lay('light', g.edges.slice(k), LIGHT, LIVED);
    g.points.slice(k).forEach((point, offset) => S.marks.push(markFor(point, steps[k + offset].kind, true)));
    // The path up to the fork, as it was.
    lay('dark', g.edges.slice(1, k), FOREST, LIVED);
    for (let index = 0; index < k; index += 1) S.marks.push(markFor(g.points[index], steps[index].kind));
    for (let index = 1; index <= S.what.reached; index += 1) bakeWhatEdge(index, 'dark', false);
    paintMarks();
  }
  // The new life's edges are what.edges[0] (fork → the choice) to what.edges[n-1].
  function walkWhat(index) {
    if (!S.what) return;
    const run = S.what;
    if (index > run.edges.length) { growAhead(run); return; }
    const from = index === 1 ? S.model.life.steps[run.fork].at : run.nodes[index - 2].at;
    const years = run.nodes[index - 1].at - from;
    // A run's steps come quicker, as in the story (RUN_PACE in life.js).
    const quick = inRun(run.nodes[index - 1]) ? RUN_PACE : 1;
    const duration = Math.min(1500, 700 + years * 70) * quick;
    const started = performance.now();
    const tick = now => {
      if (S.what !== run) return;
      const p = Math.min(1, (now - started) / duration);
      drawWhatEdge(index, ease.inOut(p));
      if (p < 1) { run.frame = requestAnimationFrame(tick); return; }
      arrive(run, index);
      run.frame = setTimeout(() => { run.frame = null; walkWhat(index + 1); }, 320 * quick);
    };
    run.frame = requestAnimationFrame(tick);
  }
  function drawWhatEdge(index, p) {
    const edge = S.what.edges[index - 1];
    const node = S.what.nodes[index - 1];
    const sibs = S.what.siblings[index - 1];
    const box = useLive(boundsOf([...edgeBounds(edge), ...sibs.flatMap(sibling => [...edgeBounds(sibling.edge), ...sibling.tails.flatMap(edgeBounds)])], 16));
    const moving = [];
    for (const sibling of sibs) {
      stroke(lx, [sibling.edge], MIST, GRAY, p);
      stroke(lx, sibling.tails, TAIL, THIN, Math.max(0, p * 2 - 1));
      moving.push({ edge: sibling.edge, color: MIST, width: GRAY, layer: 'gray', at: p });
    }
    stroke(lx, [edge], FOREST, LIVED, p);
    moving.push({ edge, color: FOREST, width: LIVED, layer: 'dark', at: p });
    marksOver(box, moving);
    traveller(lx, pointOn(edge, p), p < 1);
    if (p >= 1) drawMark(lx, markFor(node.point, node.kind), [...S.strokes, ...moving]);
  }
  // Edge `index` (1-based) leads to node `index - 1`; arriving bakes it, shows its label and tells the narration.
  function arrive(run, index) {
    drawn(run);
    placeLabels(run, index - 1);
    run.reached = index;
    bakeWhatEdge(index);
    S.whatEls.find(element => Number(element.dataset.what) === index - 1)?.classList.add('is-shown');
    if (!run.silent) onStep(run.nodes[index - 1], index - 1);
  }
  function bakeWhatEdge(index, part = 'both', paint = true) {
    const node = S.what.nodes[index - 1];
    if (part !== 'dark') {
      for (const sibling of S.what.siblings[index - 1]) {
        lay('gray', [sibling.edge], MIST, GRAY);
        lay('tail', sibling.tails, TAIL, THIN);
      }
    }
    if (part === 'grays') return;
    lay('dark', [S.what.edges[index - 1]], FOREST, LIVED);
    S.marks.push(markFor(node.point, node.kind));
    if (paint) paintMarks();
  }
  function growAhead(run) {
    const last = run.nodes.at(-1).point;
    const started = performance.now();
    const tick = now => {
      if (S.what !== run) return;
      const p = Math.min(1, (now - started) / 600);
      const box = useLive(boundsOf([...run.ahead.flatMap(edgeBounds), last], 16));
      stroke(lx, run.ahead, AHEAD, 3, p);
      marksOver(box, run.ahead.map(edge => ({ edge, color: AHEAD, width: 3, layer: 'ahead', at: p })));
      traveller(lx, last, false);
      if (p < 1) { run.frame = requestAnimationFrame(tick); return; }
      run.frame = null;
      endWhat(run);
    };
    run.frame = requestAnimationFrame(tick);
  }
  // The traveller rests on the new life's last dot.
  function restWhat(run) {
    const box = useLive(boundsOf([run.nodes.at(-1).point], 16));
    marksOver(box, []);
    traveller(lx, run.nodes.at(-1).point, false);
  }
  function endWhat(run) {
    lay('ahead', run.ahead, AHEAD, 3);
    paintMarks();
    restWhat(run);
    run.done = true;
    if (!run.silent) onDone(run);
  }
  /** The new life at once: reduced motion, or a tap while it grows. */
  function finishWhat() {
    if (!S.what || S.what.done) return;
    const run = S.what;
    if (run.frame !== null) { cancelAnimationFrame(run.frame); clearTimeout(run.frame); run.frame = null; }
    if (run.labelFrame !== null) { cancelAnimationFrame(run.labelFrame); run.labelFrame = null; }
    drawn(run);
    placeLabels(run, run.edges.length - 1);
    for (let index = run.reached + 1; index <= run.edges.length; index += 1) arrive(run, index);
    endWhat(run);
  }
  function stopWhat() {
    if (!S.what) return;
    if (S.what.frame !== null) { cancelAnimationFrame(S.what.frame); clearTimeout(S.what.frame); }
    if (S.what.labelFrame !== null) cancelAnimationFrame(S.what.labelFrame);
    if (S.what.planFrame) cancelAnimationFrame(S.what.planFrame);
    S.what = null;
    S.labelEls.forEach(element => element.classList.remove('is-old'));
    S.whatEls.forEach(element => element.remove());
    S.whatEls = [];
  }

  // Round 7: a changed life never vanishes in one frame. As it goes (Try again, Try another choice,
  // Back to the person's life), a copy of the map as it was, its canvases and its labels, fades out
  // over GHOST_MS above the map drawn anew, so the person's own path never blinks out and back.
  const GHOST_MS = 350;
  function ghostOut() {
    if (!S.what || prefersReducedMotion()) return;
    const copies = [];
    for (const canvas of [graysCanvas, darkCanvas, marksCanvas, liveCanvas]) {
      if (!canvas.width || !canvas.height) continue;
      const copy = canvas.cloneNode(false);
      copy.classList.add('life-ghost');
      copy.getContext('2d')?.drawImage(canvas, 0, 0);
      stack.insertBefore(copy, overlay);
      copies.push(copy);
    }
    for (const element of S.whatEls) {
      const copy = element.cloneNode(true);
      copy.classList.remove('is-what'); // so the next life's clean-up leaves it to fade
      copy.removeAttribute('data-what');
      copy.classList.add('life-ghost');
      overlay.append(copy);
      copies.push(copy);
    }
    requestAnimationFrame(() => copies.forEach(copy => copy.classList.add('is-going')));
    setTimeout(() => copies.forEach(copy => copy.remove()), GHOST_MS + 100);
  }

  return { pick, finishWhat, stopWhat, ghostOut };
}
