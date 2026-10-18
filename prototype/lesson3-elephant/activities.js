// Lesson 3 · The elephant and the rider: three activity ideas, three frames each (the start, the moment
// that teaches, the end), drawn in the lesson's layout. A steers past a tempting side trail; B sorts
// everyday moments between the two partners; C has no activity, only one tap inside step 04.
import { ICONS } from '../../src/lessons/choices/journey-icons.js';
import { word } from './copy.js';
import { mount, buildFrames, ui } from './shell.js';
import { esc, svg, pair, ground, leader, riderAt, BOOK_ICON, FOREST, SUN, CLAY, WOOD, SAGE, PAPER } from './scenes.js';
import { STORY_CHAPTERS, TAKEAWAY_ICONS, forkScene } from './storyboard.js';

const W = (id, key) => word(id, key);
const ACTIVITY = W('A1', 'chapter');
const C_CHAPTERS = STORY_CHAPTERS.filter(name => name !== ACTIVITY);
const nextChapter = name => ui('lesson.ui.nextChapter').replace('{chapter}', name);
const ROW = 132; // the band at the stage's foot that holds the choices

// ——— A · Steer the elephant ———
const icon = body => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const A_ICONS = {
  c1: icon(`<path d="M5 19C6 12 10 6 18 5" stroke="${WOOD}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M15 3l4 2-2 4" stroke="${WOOD}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  c2: icon(`<rect x="4" y="11" width="16" height="9" rx="1.5" fill="${WOOD}"/><rect x="3" y="8" width="18" height="4" rx="1.2" fill="${WOOD}"/>`),
  c3: icon(BOOK_ICON),
};
function choices(chosen = '') {
  return `<div class="choice-row">${['c1', 'c2', 'c3'].map(key => `<button type="button" class="foot-choice${chosen === key ? ' is-chosen' : ''}" aria-pressed="${chosen === key}">${A_ICONS[key]}<span>${esc(W('A1', key))}</span></button>`).join('')}</div>`;
}
const pill = (text, { solid = false } = {}) => `<div class="stage-pill-row"><button type="button" class="stage-pill${solid ? ' is-solid' : ''}">${esc(text)}</button></div>`;
const words = { game: W('A1', 'game'), home: W('A1', 'home') };

/** The evenings so far, top left of the stage: each day's name and the way that was picked. */
function days(current, picks = []) {
  return `<ol class="day-strip">${['d1', 'd2', 'd3'].map((key, i) => `<li class="day${i === current ? ' is-current' : ''}"${i === current ? ' aria-current="step"' : ''}>
    <span class="day-icon" aria-hidden="true">${picks[i] ? A_ICONS[picks[i]] : ''}</span><span>${esc(W('A1', key))}</span></li>`).join('')}</ol>`;
}
// Monday: the fork, the game out. Tuesday, after Monday's pull: back at the fork, Monday's turn and drift in gray.
// Wednesday, after Tuesday's "Put the game away": the box stayed shut, the side trail grows over, the way home is easy.
const a1 = (w, h) => `${forkScene(w, h - ROW, { reins: true, words })}${days(0)}${choices()}`;
const a2 = (w, h) => `${forkScene(w, h - ROW, { reins: true, traces: ['reinsFaint'], words })}${days(1, ['c1'])}${choices()}`;
const a3 = (w, h) => `${forkScene(w, h - ROW, { game: 'box', at: 'home', pose: 'walk1', traces: ['path'], words: { home: words.home } })}${days(2, ['c1', 'c2'])}${pill(W('A3', 'again'))}`;

// ——— B · Elephant or rider ———
const CAKE = icon(`<rect x="4" y="12" width="16" height="8" rx="2" fill="${SUN}"/><rect x="4" y="15" width="16" height="2" fill="${PAPER}"/><path d="M12 11V6" stroke="${CLAY}" stroke-width="2" stroke-linecap="round"/><path d="M12 2.5c1.5 1.4 1.5 2.6 0 3.3-1.5-.7-1.5-1.9 0-3.3z" fill="${SUN}"/>`);
const BALL = ICONS.ball.replace('<svg', '<svg class="moment-icon"');
function momentCard(name, picture, picked = '') {
  const pick = key => `<button type="button" class="stage-pill${picked === key ? ' is-solid' : ''}" aria-pressed="${picked === key}">${esc(W('B1', `pick.${key}`))}</button>`;
  return `<div class="moment-card">${picture}<p class="moment-name">${esc(name)}</p><div class="moment-picks">${pick('elephant')}${pick('rider')}</div></div>`;
}
function column(who, tags, { strong = '', side = 'left', top = 0, fresh = '' } = {}) {
  const slots = Array.from({ length: Math.max(0, 2 - tags.length) }, () => '<span class="strength-slot"></span>').join('');
  return `<div class="strength" style="${side}:28px; top:${top}px"><p class="strength-title">${esc(W('B1', who))}</p>
    ${strong ? `<p class="strength-word">${esc(strong)}</p>` : ''}
    ${tags.map(t => `<span class="strength-tag${t === fresh ? ' is-new' : ''}">${esc(t)}</span>`).join('')}${slots}</div>`;
}
function partners(w, h, { elephant = [], rider = [], strong = false, fresh = '' } = {}) {
  const gy = Math.round(h * 0.92);
  const eh = Math.min(h * 0.34, w * 0.27);
  const s = eh / 64; const r = riderAt(w * 0.5, gy, eh);
  const lines = `${leader(w - 28 - Math.min(240, w * 0.3) - 6, h * 0.36 + 10, r.x + 6 * s, r.y - 2 * s)}${leader(28 + Math.min(240, w * 0.3) + 6, h * 0.46 + 10, w * 0.5 - 26 * s, gy - 40 * s)}`;
  return `${svg(w, h, `${ground(w, gy, h)}${pair(w * 0.5, gy, eh)}${lines}`)}
    ${column('elephant', elephant, { side: 'left', top: h * 0.46, strong: strong ? W('B3', 'strong.elephant') : '', fresh })}
    ${column('rider', rider, { side: 'right', top: h * 0.36, strong: strong ? W('B3', 'strong.rider') : '', fresh })}`;
}
const b1 = (w, h) => `${partners(w, h)}${momentCard(W('B1', 'm1'), BALL)}`;
const b2 = (w, h) => `${partners(w, h, { elephant: [W('B1', 'm1')], rider: [W('B1', 'm2')], fresh: W('B1', 'm2') })}${momentCard(W('B1', 'm2'), CAKE.replace('<svg', '<svg class="moment-icon"'), 'rider')}`;
const b3 = (w, h) => `${partners(w, h, { elephant: [W('B1', 'm1'), W('B1', 'm3')], rider: [W('B1', 'm2'), W('B1', 'm4')], strong: true })}<div class="stage-pill-row" style="top:28px; bottom:auto"><button type="button" class="stage-pill">${esc(W('B3', 'again'))}</button></div>`;

// ——— C · No activity: step 04 with one tap ———
function cFrame(w, h, { at = 'fork', traces = [], button, solid = false }) {
  return `${forkScene(w, h - ROW, { reins: true, at, pose: at === 'fork' ? 'stand' : 'walk1', traces, words })}${pill(button, { solid })}`;
}
const c1 = (w, h) => cFrame(w, h, { button: W('C1', 'pull') });
const c2 = (w, h) => cFrame(w, h, { at: 'turn', traces: ['turn'], button: W('C1', 'pull'), solid: true });
const c3 = (w, h) => cFrame(w, h, { at: 'drift', traces: ['reins'], button: W('C3', 'pull') });

const A = { chapter: ACTIVITY, at: 1, of: 1, nextLabel: nextChapter(STORY_CHAPTERS[STORY_CHAPTERS.indexOf(ACTIVITY) + 1]) };
const C = { chapter: STORY_CHAPTERS[2], at: 1, of: 2, nextLabel: ui('lesson.ui.next') };
const A_ITEMS = [
  { id: 'activity-A-1', copy: 'A1', stage: a1, ...A, first: false },
  { id: 'activity-A-2', copy: 'A2', stage: a2, ...A, result: W('A2', 'result') },
  { id: 'activity-A-3', copy: 'A3', stage: a3, ...A, result: W('A3', 'result') },
  { id: 'activity-B-1', copy: 'B1', stage: b1, ...A },
  { id: 'activity-B-2', copy: 'B2', stage: b2, ...A, result: W('B2', 'result') },
  { id: 'activity-B-3', copy: 'B3', stage: b3, ...A, result: W('B3', 'result') },
];
const C_ITEMS = [
  { id: 'activity-C-1', copy: 'C1', stage: c1, ...C },
  { id: 'activity-C-2', copy: 'C2', stage: c2, ...C },
  { id: 'activity-C-3', copy: 'C3', stage: c3, ...C },
];

export function start(root) {
  const defs = [...buildFrames(A_ITEMS, STORY_CHAPTERS), ...buildFrames(C_ITEMS, C_CHAPTERS)].map(def => ({ ...def, first: false }));
  mount(root, defs, TAKEAWAY_ICONS);
}
