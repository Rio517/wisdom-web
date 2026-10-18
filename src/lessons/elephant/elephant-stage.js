// Lesson 3's stage: one picture a step (elephant-pictures.js), drawn at the stage's own size and redrawn
// when it changes. A step fades in over the last (Lesson 1's scene-in, as Lesson 2 does); instant with
// reduced motion.
import { prefersReducedMotion } from '../choices/journey-motion.js';
import { PICTURES } from './elephant-pictures.js';

export function createElephantStage(root) {
  let current = null;
  let layer = null;
  let pending = 0;
  let size = { w: 0, h: 0 };

  const measure = () => {
    const box = root.getBoundingClientRect();
    return { w: Math.round(box.width), h: Math.round(box.height) };
  };

  function place(element, fade) {
    const old = layer;
    layer = element;
    root.append(element);
    if (old) {
      if (fade) {
        old.classList.add('is-leaving');
        setTimeout(() => old.remove(), 380);
      } else old.remove();
    }
    if (fade) element.classList.add('is-entering');
  }

  /** Show a step's picture, fading in over the last one when `animate`. */
  function show(beatId, { animate = false } = {}) {
    size = measure();
    current = beatId;
    const element = document.createElement('div');
    element.className = 'pl-layer';
    element.dataset.picture = beatId;
    element.innerHTML = PICTURES[beatId](size.w, size.h);
    place(element, animate && !prefersReducedMotion());
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const next = measure();
      if (!current || root.hidden || (next.w === size.w && next.h === size.h) || !next.w || !next.h) return;
      show(current);
    });
  }).observe(root);

  return { show, get current() { return current; } };
}
