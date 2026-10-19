// Lesson 3's activity, Elephant or rider: the elephant and its rider stand above Lesson 1's drag-to-sort
// board (journey-sort.js), given this lesson's two sides, its six moments and the quiet rules: no score,
// count or right-or-wrong mark; a card dropped on the other side slides across to its own; each card's
// line shows under the story text; at the end each side gets its strength and Start again sits in the middle.
import { t } from '../../i18n/runtime.js';
import { createSortBoard } from '../choices/journey-sort.js';
import { momentsFor } from './elephant-story.js';
import { sortScene } from './elephant-pictures.js';
import { elephant, rider, RIDER_LOOK } from './elephant-draw.js';

// Small pictures beside each side's name: the elephant alone and the rider alone, the delivered art scaled down.
const mini = (body, box) => `<svg class="sort-side-icon" viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;
const ICON = {
  elephant: mini(`<g style="--elephant-gap: white">${elephant()}</g>`, '-48 -66 92 70'),
  rider: mini(rider({ look: RIDER_LOOK }), '-7 -24 16 33'),
};

const sideFor = id => ({
  value: id,
  cls: `sort-bin-${id}`,
  title: t(`elephant.sort.${id}`),
  icon: ICON[id],
  strong: t(`elephant.sort.strong.${id}`),
  place: t(`elephant.sort.place${id === 'elephant' ? 'Elephant' : 'Rider'}`),
  announce: card => t(`elephant.sort.announce${id === 'elephant' ? 'Elephant' : 'Rider'}`, { card: card.label }),
});

/** The activity in `root`; `onChange({ line, done })` hands the story column what to show. */
export function createElephantSort(root, { onChange = () => {} } = {}) {
  root.innerHTML = '<div class="es-scene" aria-hidden="true"></div><div class="sort-board es-board"></div>';
  const scene = root.querySelector('.es-scene');
  const cards = momentsFor(t);
  let state = { line: '', done: false };
  const board = createSortBoard(root.querySelector('.es-board'), {
    cards,
    sides: [sideFor('elephant'), sideFor('rider')],
    judge: false,
    lineFor: card => card.line,
    again: t('elephant.sort.again'),
    onChange: (results, { done, line = '', restart = false }) => {
      state = { line: restart ? '' : line, done };
      onChange(state);
    },
  });

  let drawn = '';
  function draw() {
    const box = scene.getBoundingClientRect();
    const w = Math.round(box.width); const h = Math.round(box.height);
    if (!w || !h || drawn === `${w}x${h}`) return;
    drawn = `${w}x${h}`;
    scene.innerHTML = sortScene(w, h);
  }
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(scene);

  return {
    enter: draw,
    get state() { return state; },
    restart() { board.restart(); state = { line: '', done: false }; },
    board,
  };
}
