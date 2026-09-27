export const prefersReducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const ease = {
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  out: t => 1 - (1 - t) ** 3,
  linear: t => t,
};

/**
 * A cancellable animation. `update(progress)` receives eased progress in 0..1.
 * cancel() stops without finishing; finish() jumps to the end state.
 */
export function tween({ duration = 400, easing = ease.inOut, update, delay = 0 }) {
  let frame = null;
  let timer = null;
  let done = false;
  let resolve;
  const promise = new Promise(res => { resolve = res; });
  const end = completed => {
    if (done) return;
    done = true;
    if (frame !== null) cancelAnimationFrame(frame);
    if (timer !== null) clearTimeout(timer);
    if (completed) update(1);
    resolve(completed);
  };
  if (duration <= 0 || prefersReducedMotion()) {
    update(1);
    done = true;
    resolve(true);
    return { promise, cancel() {}, finish() {} };
  }
  const start = () => {
    const began = performance.now();
    const step = now => {
      const t = Math.min(1, (now - began) / duration);
      update(easing(t));
      if (t >= 1) end(true);
      else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };
  if (delay > 0) timer = setTimeout(start, delay);
  else start();
  return { promise, cancel: () => end(false), finish: () => end(true) };
}

/** Wait, but resolve false early if the token is cancelled. */
export function wait(ms, token) {
  if (prefersReducedMotion()) return Promise.resolve(!token?.cancelled);
  return new Promise(resolve => {
    const id = setTimeout(() => resolve(!token?.cancelled), ms);
    token?.onCancel?.(() => { clearTimeout(id); resolve(false); });
  });
}

/** A run token: a scene checks `cancelled` between animation steps. */
export function createToken() {
  const listeners = [];
  const token = {
    cancelled: false,
    onCancel(fn) { listeners.push(fn); },
    cancel() {
      if (token.cancelled) return;
      token.cancelled = true;
      listeners.splice(0).forEach(fn => fn());
    },
  };
  return token;
}
