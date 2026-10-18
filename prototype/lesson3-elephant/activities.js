// Lesson 3 · The elephant and the rider: the activity, Elephant or rider, in three frames (design 004, v02):
// the start, the middle of the sort and the end. The board is Lesson 1's drag-to-sort board (the hike's packing
// sort, src/lessons/choices/journey-sort.js): a pile of cards in the middle and one side for each partner. The
// elephant and its rider stand above the board. No score, no count and no right-or-wrong mark: a quiet line
// under the story text when a card lands.
import { elephant, rider } from '../../src/lessons/shared/elephant.js';
import { word } from './copy.js';
import { mount, buildFrames, ui } from './shell.js';
import { esc, svg, pair, sun, hills, horizon, tuft } from './scenes.js';
import { STORY_CHAPTERS, TAKEAWAY_ICONS } from './storyboard.js';

const W = key => word('B1', key);
const ACTIVITY = W('chapter');
const MOMENTS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
const sideOf = id => W(`side.${id}`);

// The same loose tilt for a card every time (Lesson 1's seedRotation).
function tilt(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 601) / 100) - 3;
}

// Small pictures beside each side's title: the elephant alone and the rider alone, the delivered art scaled down.
const mini = (art, box) => `<svg class="sortb-icon" viewBox="${box}" aria-hidden="true" focusable="false">${art}</svg>`;
const ICON = {
  elephant: mini(`<g style="--elephant-gap: white">${elephant()}</g>`, '-48 -66 92 70'),
  rider: mini(rider(), '-7 -24 16 33'),
};

const card = (id, { cls = '', rot = true } = {}) => `<li class="sortb-card${cls}" style="--rot:${rot ? tilt(id) : 0}deg">${esc(W(id))}</li>`;

/** One side of the board. `cards` are moment ids already there; `fresh` the one that just landed. */
function bin(who, cards, { strong = '', over = false, fresh = '' } = {}) {
  return `<section class="sortb-bin sortb-${who}${over ? ' is-over' : ''}" aria-label="${esc(W(who))}">
    <h2 class="sortb-title">${ICON[who]}<span>${esc(W(who))}</span></h2>
    ${strong ? `<p class="sortb-strong">${esc(strong)}</p>` : ''}
    <ul class="sortb-list">${cards.map(id => card(id, { cls: id === fresh ? ' is-new' : '', rot: false })).join('')}</ul></section>`;
}

/** The middle: the instruction, then the pile, with an empty place where a card was picked up. */
function pile(ids, { lifted = '', done = false } = {}) {
  if (done) return `<div class="sortb-centre is-done"><button type="button" class="stage-pill">${esc(word('B3', 'again'))}</button></div>`;
  return `<div class="sortb-centre"><p class="sortb-instruction">${esc(W('instruction'))}</p><p class="sortb-hint">${esc(W('hint'))}</p>
    <ul class="sortb-pile">${ids.map(id => (id === lifted ? '<li class="sortb-gap" aria-hidden="true"></li>' : card(id))).join('')}</ul></div>`;
}

/** The scene above the board: the pair at the middle, big and calm, on a low rise with hills behind. */
function scene(w, top) {
  const gy = Math.round(top - 14);
  const eh = Math.min((gy - 28) * 0.8, w * 0.25); const s = eh / 64;
  const ex = w / 2 + 2 * s;
  return svg(w, gy + 24, `${sun(w * 0.84, gy * 0.32, Math.min(w, gy) * 0.07)}${hills(w, gy, gy * 0.2)}${horizon(w, gy)}
    ${tuft(w * 0.14, gy - 4)}${tuft(w * 0.8, gy - 4, 1.2)}${pair(ex, gy, eh, { gap: 'var(--color-paper-deep)' })}`, `style="bottom:auto; height:${gy + 24}px"`);
}

function board(w, h, { elephantSide = [], riderSide = [], pileIds = MOMENTS, lifted = '', fresh = '', done = false } = {}) {
  const top = Math.round(h * 0.47);
  const dragged = lifted ? `<div class="sortb-drag" style="left:${Math.round(20 + w * 0.06)}px; top:${Math.round(top + (h - top) * 0.6)}px">${card(lifted, { cls: ' is-lifted', rot: false })}</div>` : '';
  return `${scene(w, top)}<div class="sortb" style="top:${top}px">
    ${bin('elephant', elephantSide, { strong: done ? word('B3', 'strong.elephant') : '', over: !!lifted, fresh })}
    ${pile(pileIds, { lifted, done })}
    ${bin('rider', riderSide, { strong: done ? word('B3', 'strong.rider') : '' })}</div>${dragged}`;
}

const mine = who => MOMENTS.filter(id => sideOf(id) === who);
// Start: all six in the pile. Middle: three sorted (Losing a match has just landed), Catching a ball on its way to
// the elephant. End: both sides full, each with its strength.
const b1 = (w, h) => board(w, h);
const b2 = (w, h) => board(w, h, { elephantSide: ['m1', 'm2'], riderSide: ['m4'], pileIds: ['m3', 'm5', 'm6'], lifted: 'm3', fresh: 'm2' });
const b3 = (w, h) => board(w, h, { elephantSide: mine('elephant'), riderSide: mine('rider'), pileIds: [], done: true });

const nextChapter = name => ui('lesson.ui.nextChapter').replace('{chapter}', name);
const A = { chapter: ACTIVITY, at: 1, of: 1, nextLabel: nextChapter(STORY_CHAPTERS[STORY_CHAPTERS.indexOf(ACTIVITY) + 1]) };
const ITEMS = [
  { id: 'activity-B-1', copy: 'B1', stage: b1, ...A },
  { id: 'activity-B-2', copy: 'B2', stage: b2, ...A, result: W('quiet.m2') },
  { id: 'activity-B-3', copy: 'B3', stage: b3, ...A, result: word('B3', 'result') },
];

export function start(root) {
  mount(root, buildFrames(ITEMS, STORY_CHAPTERS).map(def => ({ ...def, first: false })), TAKEAWAY_ICONS);
}
