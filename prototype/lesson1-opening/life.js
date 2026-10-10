// One life on the map (design 001 v13, the Lesson 1 opening): the life that
// plays, the timeline each step plays, and the player that drives the narration
// and the map from one clock, so the words and the route can never drift apart.
import { prefersReducedMotion } from '../../src/lessons/choices/journey-motion.js';

/**
 * The life the story tells, as `writtenLife` (lives/engine.js) gives it: one
 * step per line, each a fork on the person's route with the gray lives they
 * didn't live leaving it. A step has its words (`line`, `label`), its age and
 * height (`y`, 0 top to 1 bottom; luck lifts the path, setbacks drop it), its
 * `kind` ('start', 'choice', 'lucky', 'setback' or 'event'), the earlier steps
 * that pulse as it lands (`echoes`) and the choices the reader may try instead
 * (`alts`). Set it with `useLife` before the player plays.
 */
export const BORN_Y = 0.5;
export let LIFE = null;
/** The story's lines: one per step, then "Many paths still ahead." (no age, no dot). */
export let LINES = [];
export let LAST = 0;
export let END = 0;
// A line that holds a little longer: something that happened, or two sentences.
const isLong = step => (step.kind !== 'choice' && step.kind !== 'start') || /[.!?]\s+\S/.test(step.line);
export function useLife(life) {
  LIFE = life;
  LINES = [...life.steps.map((step, index) => ({ ...step, index, long: isLong(step) })), { key: 'close', close: true, index: life.steps.length }];
  LAST = LINES.length - 1;
  END = life.steps.length - 1;
}

/** The steps a step pulses as it lands. */
export function buildsOn(index) {
  return (LINES[index]?.echoes ?? []).slice(0, 2);
}

// Milliseconds from the moment a step's line starts to arrive.
export const TIMING = {
  line: 420, // the line rises 14px into place as it fades in
  pointAt: 260, // its dot blooms as the line lands
  bloom: 320,
  markerBloom: 380,
  walkFrom: 300, // and the traveller walks there, the gray choices he didn't make sprouting beside him
  walk: 700,
  tailsFrom: 700, // the gray lives carry on a little way
  tails: 500,
  labelAt: 900, // the step's short label on the map, as he arrives
  appear: 300, // the first step has no walk: the traveller appears on the Beginning dot
  pulseAt: 980, // earlier steps it builds on answer as the traveller arrives
  pulseGap: 140,
  pulse: 600,
  hold: 600, // after the last line, before the route's end starts to breathe
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
export const walkEase = bezier(0.42, 0, 0.22, 1);
// A bloom: grows a touch past its size and settles.
const bloomEase = t => {
  const s = 1.9;
  const u = t - 1;
  return 1 + (s + 1) * u ** 3 + s * u ** 2;
};
const landEase = bezier(0.2, 0.7, 0.2, 1);
const sproutEase = bezier(0.3, 0, 0.3, 1);

export const settleAt = index => (index === 0 ? TIMING.appear : TIMING.walkFrom + TIMING.walk);
/** When a step has stopped moving: its walk and tails have settled and its pulses have faded. */
export function quietAfter(index) {
  if (index < 0) return 0;
  const count = buildsOn(index).length;
  return Math.max(settleAt(index), index > 0 && !LINES[index].close ? TIMING.tailsFrom + TIMING.tails : 0,
    count ? TIMING.pulseAt + (count - 1) * TIMING.pulseGap + TIMING.pulse : 0);
}
export function stepDuration(index, pace) {
  const line = LINES[index];
  if (line.close) return settleAt(index) + TIMING.hold;
  return settleAt(index) + (line.long ? pace.long : pace.short);
}

/**
 * What the map draws for a moment of the story. Steps before `index` are
 * whole; for the step at `index`: how far the traveller has walked to its dot
 * (`walk`), how far its dot has bloomed, how far the choices he didn't make
 * have grown from the dot he left (`sprout`, then `tails`), whether its label
 * shows, and the pulses in flight. On the closing line, `sprout` grows the
 * paths still ahead. `landing` (0–1) carries the traveller to the end at once.
 */
function frameFor({ index, elapsed, landing }) {
  const frame = { index, walk: 0, appear: 1, bloom: 0, sprout: 0, tails: 0, label: false, pulses: [], resting: false, landing: null };
  if (index < 0) { frame.appear = 0; return frame; }
  const line = LINES[index];
  if (line.close) {
    frame.walk = 1; frame.bloom = 1; frame.label = true; frame.tails = 1;
    frame.sprout = sproutEase(clamp01((elapsed - TIMING.walkFrom) / TIMING.walk));
    frame.resting = elapsed >= settleAt(index);
  } else {
    const growFor = line.kind === 'lucky' || line.kind === 'setback' ? TIMING.markerBloom : TIMING.bloom;
    frame.bloom = bloomEase(clamp01((elapsed - TIMING.pointAt) / growFor));
    if (index === 0) {
      frame.appear = landEase(clamp01(elapsed / TIMING.appear));
      frame.walk = 1;
      frame.label = elapsed >= TIMING.appear;
    } else {
      frame.walk = walkEase(clamp01((elapsed - TIMING.walkFrom) / TIMING.walk));
      frame.sprout = sproutEase(clamp01((elapsed - TIMING.walkFrom - 40) / TIMING.walk));
      frame.tails = clamp01((elapsed - TIMING.tailsFrom) / TIMING.tails);
      frame.label = elapsed >= TIMING.labelAt;
    }
    buildsOn(index).forEach((at, order) => {
      const p = (elapsed - TIMING.pulseAt - order * TIMING.pulseGap) / TIMING.pulse;
      if (p > 0 && p < 1) frame.pulses.push({ at, p });
    });
  }
  if (landing) {
    frame.landing = landEase(landing.p);
    frame.pulses = [];
  }
  return frame;
}

/** Everything placed: the route to its end, every fork, the paths ahead, the traveller resting. */
export const finalFrame = () => ({ index: LAST, walk: 1, appear: 1, bloom: 1, sprout: 1, tails: 1, label: true, pulses: [], resting: true, landing: null });

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
  let frame = null;
  let last = 0;
  let drawnIdle = false;

  const state = () => ({ index, playing: auto && !complete, complete, started: index >= 0 });
  const emit = () => onChange(state());

  const draw = () => map(complete && !landing ? finalFrame() : frameFor({ index, elapsed, landing }));

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
    const quiet = elapsed >= quietAfter(index);
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
    if (!auto) holdAt = quietAfter(index);
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
    get state() { return state(); },
  };
}
