// Sam's life on the map (design 001 v13, the Lesson 1 opening): the steps, the
// timeline each one plays, and the player that drives the narration and the map
// from one clock, so the words and the route can never drift apart.
import { prefersReducedMotion } from '../../src/lessons/choices/journey-motion.js';

/**
 * One step per line of the story.
 * - `y`: where the route stands after the step, in network units from the
 *   Beginning dot (negative is up). Luck and help lift the path, hard times
 *   drop it, and choices keep it level.
 * - `kind`: 'point' (a stop on the route), 'lift' (white dot, green ring, plus)
 *   or 'drop' (white dot, clay ring, minus).
 * - `buildsOn`: earlier steps that pulse once when this one lands, per
 *   version of the dark example where the two differ.
 * - `long`: an event, which holds a little longer before the next line.
 */
export const LIFE_STEPS = [
  { age: 0, y: 0, kind: 'start' },
  { age: 6, y: 8, kind: 'point' },
  { age: 10, y: 2, kind: 'point', buildsOn: [1] },
  { age: 14, y: 6, kind: 'point', buildsOn: [2] },
  { age: 16, y: 5, kind: 'point', buildsOn: [3] },
  { age: 18, y: -17, kind: 'lift', buildsOn: [4], long: true },
  { age: 20, y: -42, kind: 'point', buildsOn: [5, 4], long: true },
  { age: 23, y: -40, kind: 'point' },
  { age: 25, y: 10, kind: 'drop', long: true },
  { age: 27, y: -10, kind: 'lift', buildsOn: { b: [2], a: [] }, long: true },
  { age: 30, y: -16, kind: 'point', buildsOn: { b: [], a: [2] }, end: true },
];
export const LAST = LIFE_STEPS.length - 1;

/** The steps a version of the dark example pulses for step `index`. */
export function buildsOn(index, version = 'b') {
  const value = LIFE_STEPS[index].buildsOn;
  if (!value) return [];
  return Array.isArray(value) ? value : value[version] ?? [];
}

// Milliseconds from the moment a step's line starts to arrive.
export const TIMING = {
  line: 420, // the line rises 14px into place as it fades in
  pointAt: 260, // its point blooms as the line lands
  bloom: 320,
  markerBloom: 380,
  walkFrom: 300, // and the traveller walks there
  walk: 700,
  appear: 300, // the first step has no walk: the traveller appears on the Beginning dot
  pulseAt: 980, // earlier steps it builds on answer as the traveller arrives
  pulseGap: 140,
  pulse: 600,
  hold: 600, // after the last step, before the route's end starts to breathe
  land: 300, // Next lands everything at once
};
export const PACES = { normal: { short: 900, long: 1300 }, quick: { short: 700, long: 1000 } };

const clamp01 = value => Math.max(0, Math.min(1, value));

/** A CSS-style cubic-bezier easing. */
export function bezier(x1, y1, x2, y2) {
  const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let low = 0; let high = 1; let t = x;
    for (let i = 0; i < 18; i += 1) {
      t = (low + high) / 2;
      if (at(x1, x2, t) < x) low = t; else high = t;
    }
    return at(y1, y2, t);
  };
}
// A walk: a soft start and a long, gentle arrival.
const walkEase = bezier(0.42, 0, 0.22, 1);
// A bloom: grows a touch past its size and settles.
const bloomEase = t => {
  const s = 1.9;
  const u = t - 1;
  return 1 + (s + 1) * u ** 3 + s * u ** 2;
};
const landEase = bezier(0.2, 0.7, 0.2, 1);

export const settleAt = index => (index === 0 ? TIMING.appear : TIMING.walkFrom + TIMING.walk);
/** When a step has stopped moving: its walk has settled and its pulses have faded. */
export function quietAfter(index, version = 'b') {
  const count = index >= 0 ? buildsOn(index, version).length : 0;
  return Math.max(settleAt(index), count ? TIMING.pulseAt + (count - 1) * TIMING.pulseGap + TIMING.pulse : 0);
}
export function stepDuration(index, pace) {
  const step = LIFE_STEPS[index];
  return settleAt(index) + (step.long ? pace.long : pace.short) + (step.end ? TIMING.hold : 0);
}

/**
 * What the map draws for a moment of the story: how far along the route the
 * traveller is (`pos`, in steps), how far each point has bloomed, the pulses
 * in flight and whether the route's end is resting.
 */
function frameFor({ index, elapsed, version, landing }) {
  const bloom = LIFE_STEPS.map((_, j) => (j < index ? 1 : 0));
  const pulses = [];
  let pos = 0;
  let traveller = 1;
  if (index >= 0) {
    const step = LIFE_STEPS[index];
    const growFor = step.kind === 'lift' || step.kind === 'drop' ? TIMING.markerBloom : TIMING.bloom;
    bloom[index] = bloomEase(clamp01((elapsed - TIMING.pointAt) / growFor));
    if (index === 0) {
      traveller = bezier(0.2, 0.7, 0.2, 1)(clamp01(elapsed / TIMING.appear));
    } else {
      pos = index - 1 + walkEase(clamp01((elapsed - TIMING.walkFrom) / TIMING.walk));
    }
    buildsOn(index, version).forEach((at, order) => {
      const p = (elapsed - TIMING.pulseAt - order * TIMING.pulseGap) / TIMING.pulse;
      if (p > 0 && p < 1) pulses.push({ at, p });
    });
  } else {
    traveller = 0;
  }
  if (landing) {
    const p = landEase(landing.p);
    pos += (LAST - pos) * p;
    traveller = 1;
    pulses.length = 0;
    LIFE_STEPS.forEach((_, j) => { bloom[j] = Math.max(bloom[j], clamp01((pos - j + 1) * 1.5)); });
  }
  const resting = !landing && index === LAST && elapsed >= settleAt(LAST);
  return { pos, bloom, pulses, traveller, resting };
}

/** Everything placed: the route to its end, every point, the traveller resting. */
export const FINAL_FRAME = { pos: LAST, bloom: LIFE_STEPS.map(() => 1), pulses: [], traveller: 1, resting: true };

/**
 * The story's player. One clock drives two sinks:
 * - `map(frame)`: the route, points and traveller for this moment;
 * - `narration`: `reveal(index, { duration })` shows a step's line,
 *   `revealAll({ duration })`, `reset()`, and `pause()` / `resume()` hold its
 *   line animations with the clock.
 * `onChange(state)` hears play, pause and completion, for the Pause link.
 */
export function createLifePlayer({ map, narration, onChange = () => {} }) {
  let index = -1;
  let elapsed = 0;
  let auto = true; // false while paused: a tap still plays one step, then holds
  let holdAt = null;
  let running = false;
  let complete = false;
  let landing = null;
  let pace = PACES.normal;
  let version = 'b';
  let frame = null;
  let last = 0;
  let drawnIdle = false;

  const state = () => ({ index, playing: auto && !complete, complete, started: index >= 0 });
  const emit = () => onChange(state());

  const draw = () => map(complete && !landing ? FINAL_FRAME : frameFor({ index, elapsed, version, landing }));

  function loop(now) {
    frame = null;
    const dt = Math.min(64, now - last);
    last = now;
    if (landing) {
      landing.p = Math.min(1, landing.p + dt / TIMING.land);
      draw();
      if (landing.p >= 1) {
        landing = null;
        index = LAST; elapsed = stepDuration(LAST, pace);
        finish();
        return;
      }
      schedule();
      return;
    }
    if (running) {
      elapsed += dt;
      if (holdAt !== null && elapsed >= holdAt) { elapsed = holdAt; running = false; holdAt = null; }
      if (auto && elapsed >= stepDuration(index, pace)) {
        if (index >= LAST) { finish(); return; }
        startStep(index + 1, elapsed - stepDuration(index, pace));
      }
    }
    // Between a step's settle and the next line nothing moves: draw once, then rest.
    const quiet = elapsed >= quietAfter(index, version);
    if (!quiet || !drawnIdle) { draw(); drawnIdle = quiet; }
    if (running) schedule();
  }
  const schedule = () => {
    if (frame === null) frame = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (frame === null) { last = performance.now(); schedule(); }
  };

  function startStep(next, carry = 0) {
    index = next;
    elapsed = Math.max(0, carry);
    drawnIdle = false;
    narration.reveal(index, { duration: TIMING.line, dim: index - 4 });
    if (!auto) holdAt = quietAfter(index, version);
  }

  function finish() {
    complete = true;
    running = false;
    holdAt = null;
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    draw();
    emit();
  }

  /** Start from the first line. */
  function play() {
    stop();
    index = -1; complete = false; landing = null; auto = true;
    narration.reset();
    if (prefersReducedMotion()) { showAll(); return; }
    startStep(0);
    running = true;
    draw();
    kick();
    emit();
  }

  /** The finished story at once (reduced motion, or arriving by the trail, a dot or a link). */
  function showAll() {
    stop();
    landing = null;
    narration.revealAll({ duration: 0 });
    index = LAST; elapsed = stepDuration(LAST, pace);
    finish();
  }

  /** Space and the Pause link: hold the clock, or let it run on. */
  function toggle() {
    if (complete || index < 0 || landing) return;
    auto = !auto;
    if (auto) {
      holdAt = null;
      running = true;
      narration.resume();
      kick();
    } else {
      running = false;
      narration.pause();
    }
    emit();
  }

  /**
   * →, a click or a tap: finish this step and start the next one. While
   * paused, the next step plays to its settle and holds there. Returns false
   * when the story is already complete, so the caller can move on.
   */
  function advance() {
    if (complete) return false;
    if (landing) return true;
    narration.finishCurrent();
    if (index >= LAST) { elapsed = stepDuration(LAST, pace); finish(); return true; }
    narration.resume();
    startStep(index + 1);
    running = true;
    kick();
    emit();
    return true;
  }

  /** Next during the story: land everything in 300 ms. False when already complete. */
  function land() {
    if (complete) return false;
    if (landing) return true;
    if (prefersReducedMotion()) { showAll(); return true; }
    narration.revealAll({ duration: TIMING.land });
    auto = true;
    running = false;
    holdAt = null;
    landing = { p: 0 };
    kick();
    emit();
    return true;
  }

  function stop() {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    running = false;
    holdAt = null;
  }

  /** Back to before the first line, words and map together, until `play()`. */
  function reset() {
    stop();
    index = -1; complete = false; landing = null; auto = true;
    narration.reset();
    draw();
    emit();
  }

  /** Hold the story at one moment (review captures): step `target`, `at` ms into it. */
  function seek(target, at = 0) {
    stop();
    landing = null; complete = false; auto = false;
    narration.reset();
    for (let step = 0; step < target; step += 1) narration.reveal(step, { duration: 0, dim: target - 4 });
    narration.reveal(target, { duration: TIMING.line, dim: target - 4 });
    narration.seek(Math.min(at, TIMING.line));
    index = target; elapsed = at;
    draw();
    emit();
  }

  return {
    play, showAll, toggle, advance, land, stop, reset, seek,
    redraw: draw,
    setPace(name) { pace = PACES[name] ?? PACES.normal; },
    setVersion(name) { version = name === 'a' ? 'a' : 'b'; },
    get state() { return state(); },
  };
}
