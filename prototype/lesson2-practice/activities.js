// Lesson 2 · Practice: three activity ideas, three frames each (the start, the moment that
// teaches, the end), drawn in the lesson's layout. A is Lesson 1's old ten afternoons; B lays the
// hero path's footprints one afternoon at a time; C has no activity, only the hero zoom to tap.
import { ICONS } from '../../src/lessons/choices/journey-icons.js';
import { word } from './copy.js';
import { mount, ui } from './shell.js';
import { esc, svg, label, mapFrame, lifeMap, footprints, sampleSmooth, printAt, maya, elephant, ground, routeHeightAt, TODAY, FOREST, SAGE, SUN_SOFT, SUN } from './draw.js';
import { skillBox, mapWithBox, heroLens, buildFrames, MAP_WORDS } from './parts.js';
import { STORY_CHAPTERS, STAGES, TAKEAWAY_ICONS } from './storyboard.js';

const W = (id, key) => word(id, key);
const level = key => ui(`game.level.${key}`);
const headStart = key => ui('skills.headStartShort').replace('{word}', level(key));
const ACTIVITY = W('A1', 'chapter');
const C_CHAPTERS = STORY_CHAPTERS.filter(name => name !== ACTIVITY);
const nextChapter = name => ui('lesson.ui.nextChapter').replace('{chapter}', name);

// ——— A · Ten afternoons (Lesson 1's old activity: feed of afternoons, picture choices, rail, skill boxes) ———
const KIND_ICON = { soccer: 'soccer', cello: 'cello', rest: 'screen', wall: 'ball', nap: 'rest', basketball: 'basketball' };
const option = (text, kind, icon, { chosen = false, disabled = false } = {}) => `<li><button type="button" class="play-activity${chosen ? ' is-chosen' : ''}" aria-pressed="${chosen}"${disabled ? ' disabled' : ''}>
    <span class="play-activity-icon">${ICONS[KIND_ICON[icon]]}</span><span class="play-activity-label">${esc(text)}</span><span class="play-activity-kind">${esc(W('A1', `kind.${kind}`))}</span></button></li>`;
const dayLabel = (n, when) => `${W('A1', 'day').replace('{n}', n)} · ${when}`;
function card({ n, when, text, options, state, chance = '', result = '', after = '' }) {
  return `<li class="play-card is-${state}"><p class="play-day-label">${esc(dayLabel(n, when))}${chance ? `<span class="chance-tag">${esc(chance)}</span>` : ''}</p>
    <p class="play-heading">${esc(text)}</p><ol class="play-options">${options.join('')}</ol>
    <div class="play-result">${result ? `<p>${esc(result)}</p>` : ''}${after}</div></li>`;
}
function rail(picks, current) {
  return `<ol class="play-rail">${Array.from({ length: 10 }, (_, i) => {
    const pick = picks[i];
    return `<li class="play-rail-item"><button type="button" class="play-rail-tile" data-chosen="${Boolean(pick)}"${i === current ? ' data-state="current"' : ''}${!pick && i !== current ? ' disabled' : ''}>
      <span class="play-rail-icon" aria-hidden="true">${pick ? ICONS[KIND_ICON[pick]] : ''}</span><span class="play-rail-num" aria-hidden="true">${i + 1}</span></button></li>`;
  }).join('')}</ol>`;
}
const soccerBox = (b, p, q) => skillBox({ group: 'soccer', title: W('A1', 'box.soccer'), rows: [
  { name: W('A1', 'skill.ballControl'), level: b, word: level(b < 0.06 ? 'starting' : b < 0.25 ? 'learning' : 'gettingThere') },
  { name: W('A1', 'skill.passing'), level: p, word: level(p < 0.06 ? 'starting' : p < 0.25 ? 'learning' : 'gettingThere') },
  { name: W('A1', 'skill.positioning'), level: q, word: level(q < 0.06 ? 'starting' : q < 0.25 ? 'learning' : 'gettingThere') },
] });
const celloBox = (r, y, f) => skillBox({ group: 'cello', title: W('A1', 'box.cello'), rows: [
  { name: W('A1', 'skill.reading'), level: r, word: level(r < 0.06 ? 'starting' : 'learning') },
  { name: W('A1', 'skill.rhythm'), level: y, word: level(y < 0.06 ? 'starting' : 'learning') },
  { name: W('A1', 'skill.fingers'), level: f, word: level(f < 0.06 ? 'starting' : 'learning') },
] });
const basketBox = (c, p, d, isNew) => skillBox({ group: 'basketball', title: W('A1', 'box.basketball'), isNew, note: isNew ? W('A2', 'd7.chance') : '', rows: [
  { name: W('A1', 'skill.court'), level: c, carried: 0.16, word: headStart('learning') },
  { name: W('A1', 'skill.bPassing'), level: p, carried: 0.13, word: headStart('learning') },
  { name: W('A1', 'skill.dribbling'), level: d, word: level(d < 0.06 ? 'starting' : 'learning') },
] });
const panel = boxes => `<div class="panel-boxes">${boxes.join('')}</div>`;
const scene = (feed, picks, current) => () => `<div class="scene-play"><ol class="play-feed">${feed}</ol>${rail(picks, current)}</div>`;

const DAY1 = { n: 1, when: W('A1', 'd1.when'), text: W('A1', 'd1.text') };
const DAY2 = { n: 2, when: W('A1', 'd2.when'), text: W('A1', 'd2.text') };
const DAY7 = { n: 7, when: W('A2', 'd7.when'), text: W('A2', 'd7.text'), chance: W('A2', 'd7.chance') };
const day1Options = chosen => [option(W('A1', 'd1.a'), 'soccer', 'soccer', { chosen: chosen === 0 }), option(W('A1', 'd1.b'), 'cello', 'cello', { chosen: chosen === 1 }), option(W('A1', 'd1.c'), 'rest', 'rest', { chosen: chosen === 2 })];
const day2Options = () => [option(W('A1', 'd2.a'), 'cello', 'cello'), option(W('A1', 'd2.b'), 'soccer', 'wall'), option(W('A1', 'd2.c'), 'rest', 'nap')];
const day7Options = chosen => [option(W('A2', 'd7.a'), 'basketball', 'basketball', { chosen: chosen === 0 }), option(W('A2', 'd7.b'), 'soccer', 'wall', { chosen: chosen === 1 }), option(W('A2', 'd7.c'), 'cello', 'cello', { chosen: chosen === 2 })];
const PICKS = ['soccer', 'cello', 'wall', 'soccer', 'cello', 'nap', 'basketball', 'soccer', 'soccer', 'cello'];

const A = [
  { id: 'activity-A-1', copy: 'A1', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1,
    stage: scene(`${card({ ...DAY1, options: day1Options(-1), state: 'active' })}${card({ ...DAY2, options: day2Options(), state: 'future' })}`, [], 0),
    panel: panel([soccerBox(0, 0, 0), celloBox(0, 0, 0)]) },
  { id: 'activity-A-2', copy: 'A2', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1,
    stage: scene(`${card({ ...DAY7, options: day7Options(0), state: 'active', result: W('A2', 'd7.result'),
      after: `<div class="card-box">${basketBox(0.2, 0.16, 0.03, true)}<span class="box-key">${esc(W('A2', 'key'))}</span></div>` })}`, PICKS.slice(0, 7), 6),
    panel: panel([soccerBox(0.2, 0.14, 0.1), celloBox(0.12, 0.08, 0.05)]) },
  { id: 'activity-A-3', copy: 'A3', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1,
    stage: scene(`<li class="play-card play-end is-active"><h2>${esc(W('A3', 'end.heading'))}</h2>
        <ul class="play-summary-list">${['end.l1', 'end.l2', 'end.l3'].map(k => `<li>${esc(W('A3', k))}</li>`).join('')}</ul>
        <div class="card-box">${basketBox(0.24, 0.2, 0.06, false)}</div>
        <div class="play-end-actions"><button type="button" class="solid-pill">${esc(W('A3', 'end.again'))}</button></div></li>`, PICKS, -1),
    panel: panel([soccerBox(0.3, 0.27, 0.22), celloBox(0.16, 0.12, 0.08)]) },
];

// ——— B · Footprints: each afternoon's pick lays one footprint; skills appear beside the trail ———
const CHOICE_ICON = { c1: ICONS.soccer, c2: ICONS.ball, c3: ICONS.rest };
const choices = chosen => `<div class="choice-row">${['c1', 'c2', 'c3'].map(k => `<button type="button" class="foot-choice${chosen === k ? ' is-chosen' : ''}" aria-pressed="${chosen === k}">${CHOICE_ICON[k]}${esc(W('B1', k))}</button>`).join('')}</div>`;
function trailScene(w, h, { drawn, rest = [], tags = [], fresh = null }) {
  const gy = Math.round(h * 0.56);
  const line = sampleSmooth([[60, gy + 70], [w * 0.3, gy + 56], [w * 0.55, gy + 40], [w * 0.8, gy + 16], [w + 40, gy - 4]], 20);
  const at = [];
  const skip = new Set(rest);
  const prints = footprints(line, { size: 1.15, step: 38, side: 11, at, count: drawn, skip });
  const head = at[drawn] ?? at[at.length - 1];
  const slot = at[drawn] ? printAt(at[drawn], { size: 1.15, outline: FOREST }) : '';
  const tagMarks = tags.map(({ index, key, copy }) => {
    const p = at[index]; const isFresh = fresh === index;
    const width = W(copy, key).length * 8.7 + 30;
    const top = p.cy - 150;
    return `<path d="M${p.cx.toFixed(1)} ${(p.cy - 20).toFixed(1)}V${(top + 38).toFixed(1)}" stroke="${isFresh ? SUN : SAGE}" stroke-width="2"/>
      <rect x="${(p.cx - width / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${width.toFixed(1)}" height="38" rx="19" fill="${isFresh ? SUN_SOFT : 'white'}" stroke="${isFresh ? SUN : SAGE}" stroke-width="1.5"/>
      ${label(p.cx, top + 25, W(copy, key), { anchor: 'middle', halo: null, color: isFresh ? '#7a5412' : FOREST })}`;
  }).join('');
  return `${svg(w, h, `${ground(w, gy - 30, h - gy + 30)}${prints}${slot}${tagMarks}${elephant(w * 0.9, gy - 30, 40)}
      ${maya(head.cx + 58, head.cy + 6, Math.max(100, Math.min(150, h * 0.19)))}`)}${choices(fresh !== null ? 'c1' : null)}`;
}
function bEnd(w, h) {
  // The zoom goes the other way: the trail the reader laid is the green line on Maya's map.
  const frame = mapFrame(w, h);
  const tag = (age, key) => { const x = frame.x(age); const y = frame.y(routeHeightAt(age));
    return `<path d="M${x.toFixed(1)} ${(y - 8).toFixed(1)}V${(y - 52).toFixed(1)}" stroke="${SAGE}" stroke-width="2"/>${label(x, y - 60, W('B2', key), { anchor: 'middle' })}`; };
  return svg(w, h, lifeMap(frame, MAP_WORDS(), { stretch: [8, TODAY], extra: `${tag(9, 't1')}${tag(10.3, 't2')}` }));
}
const B = [
  { id: 'activity-B-1', copy: 'B1', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1, stage: (w, h) => trailScene(w, h, { drawn: 0 }) },
  { id: 'activity-B-2', copy: 'B2', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1,
    stage: (w, h) => trailScene(w, h, { drawn: 13, rest: [4, 9], tags: [{ index: 6, key: 't1', copy: 'B2' }, { index: 12, key: 't2', copy: 'B2' }], fresh: 12 }) },
  { id: 'activity-B-3', copy: 'B3', chapter: ACTIVITY, kicker: ACTIVITY, at: 1, of: 1, stage: bEnd,
    panel: `<div class="end-actions"><button type="button" class="pill-button">${esc(W('B3', 'again'))}</button></div>` },
];

// ——— C · No activity: the story's hero zoom is the one thing to tap ———
const LENS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>';
function cLook(w, h) {
  const { box, svg: pic } = mapWithBox(w, h);
  return `${pic}<button type="button" class="stage-pill is-solid over" style="left:${(box.x + box.w / 2 - 74).toFixed(0)}px; top:${(box.y + box.h + 50).toFixed(0)}px">${LENS_ICON}${esc(W('C1', 'look'))}</button>`;
}
function cOpen(w, h) {
  return `${heroLens(w, h, ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map(k => W('05', k)), { every: 3, firstLabel: 1 })}
    <button type="button" class="stage-pill over" style="right:28px; top:26px">${esc(W('C2', 'back'))}</button>`;
}
const C = [
  { id: 'activity-C-1', copy: 'C1', chapter: C_CHAPTERS[1], at: 1, of: 4, stage: cLook, first: false, nextLabel: ui('lesson.ui.next') },
  { id: 'activity-C-2', copy: 'C2', chapter: C_CHAPTERS[1], at: 2, of: 4, stage: cOpen, first: false, nextLabel: ui('lesson.ui.next') },
  { id: 'activity-C-3', copy: 'C3', chapter: C_CHAPTERS[3], at: 1, of: 2, stage: STAGES.keep, first: false, nextLabel: ui('lesson.ui.next') },
];

export function start(root) {
  const forAB = items => items.map(item => ({ ...item, first: false, nextLabel: nextChapter(STORY_CHAPTERS[4]) }));
  const frames = [
    ...buildFrames(forAB(A), STORY_CHAPTERS), ...buildFrames(forAB(B), STORY_CHAPTERS), ...buildFrames(C, C_CHAPTERS),
  ].map(def => ({ ...def, kind: def.id.slice(9, 10) }));
  mount(root, frames, TAKEAWAY_ICONS);
}
