// Lesson 2's stage: one picture a step (practice-pictures.js), drawn at the stage's own size and
// redrawn when it changes. A step fades in over the last (Lesson 1's scene-in), and from step 04
// to 05 the map's box opens into the lens instead: the map shrinks to the corner while the box
// grows into the lens, then the lens's labels and the lines joining it to the map arrive
// (600 ms in all, interrupted by any move; instant with reduced motion).
import { prefersReducedMotion } from '../choices/journey-motion.js';
import { PICTURES } from './practice-pictures.js';

const ZOOM = 600;
const MOVE = 480;
const EASE = 'cubic-bezier(.3, .7, .2, 1)';

export function createPracticeStage(root) {
  let current = null;
  let layer = null;
  let pending = 0;
  let size = { w: 0, h: 0 };
  let ready = null; // step 05, drawn ahead while step 04 shows, so the zoom starts on its first frame

  const measure = () => {
    const box = root.getBoundingClientRect();
    return { w: Math.round(box.width), h: Math.round(box.height) };
  };

  function draw(beatId) {
    const element = document.createElement('div');
    element.className = 'pl-layer';
    element.dataset.picture = beatId;
    element.innerHTML = PICTURES[beatId](size.w, size.h);
    return element;
  }

  function place(element, { fade }) {
    const old = layer;
    layer = element;
    root.append(element);
    if (old) {
      old.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      if (fade) {
        old.classList.add('is-leaving');
        setTimeout(() => old.remove(), 380);
      } else old.remove();
    }
    if (fade) element.classList.add('is-entering');
  }

  /** The box on the map (04) opening into the lens (05). */
  function zoom(element) {
    const hero = element.querySelector('[data-hero]');
    const map = hero.querySelector('.hero-map');
    const lens = hero.querySelector('.hero-lens');
    const value = (el, name) => el.style.getPropertyValue(name);
    const shrunk = `translate(${value(map, '--mini-x')}, ${value(map, '--mini-y')}) scale(${value(map, '--mini-s')})`;
    const closed = `translate(${value(lens, '--from-x')}, ${value(lens, '--from-y')}) scale(${value(lens, '--from-s')})`;
    hero.classList.add('is-zooming');
    const moves = [
      map.animate([{ transform: 'none' }, { transform: shrunk }], { duration: MOVE, easing: EASE }),
      map.querySelector('.hero-map-labels').animate([{ opacity: 1, visibility: 'visible' }, { opacity: 0, visibility: 'visible' }], { duration: 160, easing: 'ease-out' }),
      lens.animate([{ transform: closed, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'none', opacity: 1 }], { duration: MOVE, easing: EASE }),
      ...[hero.querySelector('.hero-back'), hero.querySelector('.hero-front'), lens.querySelector('.hero-lens-labels')]
        .map(part => part.animate([{ opacity: 0 }, { opacity: 0, offset: MOVE / ZOOM - 0.15 }, { opacity: 1 }], { duration: ZOOM, easing: 'ease-out' })),
    ];
    Promise.all(moves.map(move => move.finished)).then(() => hero.classList.remove('is-zooming'), () => {});
  }

  /** Show a step's picture; `from` is the step before it when the reader moved one step forward. */
  function show(beatId, { from = null, animate = false } = {}) {
    size = measure();
    current = beatId;
    const moving = animate && !prefersReducedMotion();
    const zooming = moving && from === 'map' && beatId === 'steps';
    const early = ready && ready.w === size.w && ready.h === size.h && beatId === 'steps' ? ready.element : null;
    if (ready && ready.element !== early) ready.element.remove();
    ready = null;
    const element = early ?? draw(beatId);
    element.classList.remove('is-waiting');
    element.removeAttribute('aria-hidden');
    place(element, { fade: moving && !zooming });
    if (zooming) zoom(element);
    if (beatId === 'map') drawAhead();
  }

  function drawAhead() {
    const at = { ...size };
    const idle = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 200));
    idle(() => {
      if (current !== 'map' || ready || at.w !== size.w || at.h !== size.h) return;
      const element = draw('steps');
      element.classList.add('is-waiting');
      element.setAttribute('aria-hidden', 'true');
      root.prepend(element);
      ready = { ...at, element };
    });
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const next = measure();
      if (!current || (next.w === size.w && next.h === size.h) || !next.w || !next.h) return;
      show(current);
    });
  }).observe(root);

  return { show, get current() { return current; } };
}
