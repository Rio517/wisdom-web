// Runs a water renderer on the hike map: sizes it from the same box as the map's
// SVG layers, animates it while the map is on screen and the tab is visible,
// and draws one still frame instead when the reader prefers reduced motion.
// Frame timings are kept for the round's measurements (window.hikeWater).

// The still frame: the moment the rings and dashes read best when nothing moves.
export const STILL_TIME = 1.7;
const KEEP = 900;

export function runWater({ canvas, stage, renderer, still = false }) {
  const box = canvas.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let onScreen = true;
  let frame = null;
  let last = null;
  let clock = STILL_TIME;
  let size = { width: 0, height: 0, dpr: 1 };
  const gaps = new Float32Array(KEEP);
  const draws = new Float32Array(KEEP);
  let count = 0;
  let drawn = 0;

  const animating = () => !still && !reduce.matches && onScreen && !document.hidden;

  function resize() {
    const rect = box.getBoundingClientRect();
    // Exact CSS size, as the SVG layers use it; renderers round only their pixel buffers.
    const { width, height } = rect;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (width < 1 || height < 1) return false;
    if (Math.abs(width - size.width) < 0.01 && Math.abs(height - size.height) < 0.01 && dpr === size.dpr) return false;
    size = { width, height, dpr };
    renderer.resize(width, height, dpr);
    return true;
  }

  function paint(time) {
    const began = performance.now();
    renderer.draw(time);
    const spent = performance.now() - began;
    draws[drawn % KEEP] = spent;
    drawn += 1;
  }

  function tick(now) {
    frame = null;
    if (last !== null) {
      const gap = now - last;
      gaps[count % KEEP] = gap;
      count += 1;
      clock += Math.min(gap, 100) / 1000;
    }
    last = now;
    paint(clock);
    if (animating()) frame = requestAnimationFrame(tick);
  }

  function update() {
    if (animating()) {
      if (frame === null) frame = requestAnimationFrame(tick);
      return;
    }
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
    if (still || reduce.matches) {
      clock = STILL_TIME;
      paint(clock);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    if (resize()) paint(clock);
  });
  resizeObserver.observe(box);
  const visibility = new IntersectionObserver(entries => {
    onScreen = entries[entries.length - 1].isIntersecting;
    update();
  });
  visibility.observe(stage);
  document.addEventListener('visibilitychange', update);
  reduce.addEventListener('change', update);
  resize();
  paint(clock);
  update();

  const summary = (values, n) => {
    const list = Array.from(values.slice(0, Math.min(n, KEEP))).sort((a, b) => a - b);
    if (!list.length) return null;
    const at = q => list[Math.min(list.length - 1, Math.floor(q * list.length))];
    return { n: list.length, median: at(0.5), p95: at(0.95), worst: list[list.length - 1], mean: list.reduce((a, b) => a + b, 0) / list.length };
  };

  return {
    renderer,
    running: () => frame !== null,
    size: () => ({ ...size }),
    stats: () => ({ frameGap: summary(gaps, count), draw: summary(draws, drawn), clock }),
    resetStats() { count = 0; drawn = 0; },
    redraw: () => paint(clock),
    stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduce.removeEventListener('change', update);
    },
  };
}
