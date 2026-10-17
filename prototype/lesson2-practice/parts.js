// Shared pieces of the story and activity frames: Lesson 1's skill box and lane, the hero lens,
// the map's star and diamond, and the frame list builder.
import { ICONS, person } from '../../src/lessons/choices/journey-icons.js';
import { step, word } from './copy.js';
import { ui } from './shell.js';
import {
  esc, svg, label, mapFrame, lifeMap, stretchBox, routeStretch, footprints, sampleSmooth,
  FOREST, SUN, CLAY, QUIET, MIST, TAIL, PAPER_DEEP, RULE, printAt, routeHeightAt as routeHeightAtFull,
} from './draw.js';

const GROUP_ICON = { soccer: 'soccerSmall', cello: 'celloSmall', basketball: 'basketball' };

/** Lesson 1's skill box (journey-skills.js markup and classes), with fixed levels. */
export function skillBox({ group, title, rows, note = '', isNew = false }) {
  return `<section class="skill-box${isNew ? ' is-new' : ''}" data-group="${group}" aria-label="${esc(title)}">
    <header><h3>${ICONS[GROUP_ICON[group]] ?? ''}<span class="box-title">${esc(title)}</span></h3><span class="box-note">${esc(note)}</span></header>
    ${rows.map(row => `<div class="skill-row">
      <span class="skill-name">${esc(row.name)}</span>
      <div class="meter" data-group="${group}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(row.level * 100)}" aria-label="${esc(row.name)}">
        <i class="carried" style="--level:${row.carried ?? 0}"></i><i class="fill" style="--level:${row.level};--from:${row.carried ?? 0}"></i></div>
      <span class="skill-meta"><span class="skill-word">${esc(row.word)}</span>${row.boost ? `<span class="boost-note">${esc(row.boost)}</span>` : ''}</span>
    </div>`).join('')}
  </section>`;
}

/** Lesson 1's weeks row: `on` is the practice pattern of one season. */
export function weeksRow(name, on) {
  return `<div class="calendar-row"><small>${esc(name)}</small><span class="calendar-track">${on.map(v => `<span class="week" data-on="${Boolean(v)}"></span>`).join('')}</span></div>`;
}
export const mayaHTML = (opts = {}) => person({ shirt: FOREST, ball: true, ...opts });

/** Lesson 1's map marks: the lucky star and the setback diamond. */
export const star = (x, y, r = 9) => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; return `${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`; });
  return `<path d="M${pts.join('L')}Z" fill="${SUN}" stroke="${PAPER_DEEP}" stroke-width="2" paint-order="stroke"/>`;
};
export const diamond = (x, y, r = 8) => `<path d="M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z" fill="${CLAY}" stroke="${PAPER_DEEP}" stroke-width="2" paint-order="stroke"/>`;

const mapWords = () => ({ axis: word('04', 'axis'), born: word('04', 'born'), school: word('04', 'school'), team: word('04', 'team'), basket: word('04', 'basket') });
export const MAP_WORDS = mapWords;

/** Where the hero's two pictures go: the map, small, top left; the lens below it, the stage's width. */
export function lensLayout(w, h) {
  const scale = 0.36;
  const mini = { x: 22, y: 20, w: w * scale, h: h * scale, scale };
  const lens = { x: 22, y: mini.y + mini.h + 40, w: w - 44 };
  lens.h = h - lens.y - 22;
  return { mini, lens, aspect: lens.w / lens.h };
}

/** Frame 04's picture: Maya's map and the box round the soccer years (the shape the lens will open to). */
export function mapWithBox(w, h, { overlay = '' } = {}) {
  const frame = mapFrame(w, h);
  const box = stretchBox(frame, 8.2, 10.4, lensLayout(w, h).aspect);
  return { frame, box, svg: svg(w, h, `${lifeMap(frame, mapWords())}
    <rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="10" fill="none" stroke="${QUIET}" stroke-width="2"/>${overlay}`) };
}

/** The hero: the map goes small in the corner and its box opens into a lens. The lens is that box,
 *  magnified: the same gray paths, and the green line turns out to be footprints. `labels` go on every
 *  `every`th footprint while they fit; `count` draws only the first footprints (activity B). */
export function heroLens(w, h, labels, { every = 4, firstLabel = 2, extra = '', count = Infinity, skip = new Set(), outlineNext = false, tags = [] } = {}) {
  const { mini, lens, aspect } = lensLayout(w, h);
  const full = mapFrame(w, h);
  const box = stretchBox(full, 8.2, 10.4, aspect);
  const k = lens.w / box.w;
  const zoom = ([px, py]) => [lens.x + (px - box.x) * k, lens.y + (py - box.y) * k];
  const trail = routeStretch(full, 7.4, 11.2).filter((_, i) => i % 2 === 0).map(zoom);
  const at = [];
  const size = Math.max(1, Math.min(1.35, k * 0.18)); const stepPx = 30 * size; const side = 9.5 * size;
  const prints = footprints(trail, { size, step: stepPx, side, at, count, skip });
  const drawn = at.filter(p => p.index < count && !skip.has(p.index));
  const slot = outlineNext ? at.find(p => p.index === count) : null;
  const nextSlot = slot ? printAt(slot, { size, outline: FOREST }) : '';
  // Labels: beyond the footprint's own side of the trail, with a short leader, never over another label.
  const placed = []; let n = 0;
  const inside = p => p.x > lens.x + 60 && p.x < lens.x + lens.w - 60 && p.y > lens.y + 50 && p.y < lens.y + lens.h - 50;
  const words = drawn.filter(inside).filter((_, i) => i % every === firstLabel % every).map(p => {
    if (n >= labels.length) return '';
    const text = labels[n];
    const sideSign = p.index % 2 ? 1 : -1;
    const nx = -Math.sin(p.angle) * sideSign; const ny = Math.cos(p.angle) * sideSign;
    const reach = 44 * size;
    const lx = p.cx + nx * reach; const ly = p.cy + ny * reach + (ny > 0 ? 14 : -2);
    const width = text.length * 8.7;
    const b = { l: lx - width / 2, r: lx + width / 2, t: ly - 15, b: ly + 4 };
    if (placed.some(o => !(b.r < o.l - 14 || b.l > o.r + 14 || b.b < o.t - 6 || b.t > o.b + 6))) return '';
    placed.push(b); n += 1;
    const from = [p.cx + nx * 17 * size, p.cy + ny * 17 * size]; const to = [p.cx + nx * (reach - 18), p.cy + ny * (reach - 18)];
    return `<path d="M${from[0].toFixed(1)} ${from[1].toFixed(1)}L${to[0].toFixed(1)} ${to[1].toFixed(1)}" stroke="${FOREST}" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round"/>${label(lx, ly, text, { anchor: 'middle' })}`;
  }).join('');
  const tagMarks = tags.map(tag => { const p = at[tag.at]; if (!p || tag.at >= count) return ''; return tag.draw(p, size); }).join('');
  const ten = zoom([full.x(10), 0])[0];
  const clip = `lens-clip-${Math.random().toString(36).slice(2, 8)}`;
  const mb = { x: mini.x + box.x * mini.scale, y: mini.y + box.y * mini.scale, w: box.w * mini.scale, h: box.h * mini.scale };
  const t = `translate(${(lens.x - box.x * k).toFixed(2)} ${(lens.y - box.y * k).toFixed(2)}) scale(${k.toFixed(4)})`;
  return svg(w, h, `<defs><clipPath id="${clip}"><rect x="${lens.x}" y="${lens.y.toFixed(1)}" width="${lens.w}" height="${lens.h.toFixed(1)}" rx="24"/></clipPath></defs>
    <path d="M${mb.x.toFixed(1)} ${(mb.y + mb.h).toFixed(1)}L${lens.x + 24} ${lens.y.toFixed(1)}M${(mb.x + mb.w).toFixed(1)} ${(mb.y + mb.h).toFixed(1)}L${lens.x + lens.w - 24} ${lens.y.toFixed(1)}" stroke="${QUIET}" stroke-width="1.5"/>
    <rect x="${mini.x}" y="${mini.y}" width="${mini.w.toFixed(1)}" height="${mini.h.toFixed(1)}" rx="14" fill="${PAPER_DEEP}" stroke="${RULE}" stroke-width="1.5"/>
    <g transform="translate(${mini.x} ${mini.y}) scale(${mini.scale})">${lifeMap(full, mapWords(), { labels: false, thin: true })}</g>
    <rect x="${mb.x.toFixed(1)}" y="${mb.y.toFixed(1)}" width="${mb.w.toFixed(1)}" height="${mb.h.toFixed(1)}" rx="4" fill="${PAPER_DEEP}" fill-opacity=".0" stroke="${QUIET}" stroke-width="2"/>
    <rect x="${lens.x}" y="${lens.y.toFixed(1)}" width="${lens.w}" height="${lens.h.toFixed(1)}" rx="24" fill="${PAPER_DEEP}"/>
    <g clip-path="url(#${clip})"><g transform="${t}">${lifeMap(full, {}, { fieldOnly: true, thin: true, grayWidth: 7 })}</g>
      ${label(ten + 12, lens.y + lens.h - 16, '10', { color: QUIET, halo: null, weight: 500 })}
      ${prints}${nextSlot}${tagMarks}${words}${extra}</g>
    <rect x="${lens.x}" y="${lens.y.toFixed(1)}" width="${lens.w}" height="${lens.h.toFixed(1)}" rx="24" fill="none" stroke="${QUIET}" stroke-width="2"/>`);
}

/** Turn a list of step ids into frame definitions (kicker, dots, Back/Next) for one trail. */
export function buildFrames(items, chapters) {
  return items.map((item, index) => {
    const s = step(item.copy);
    const chapter = item.chapter ?? s.chapter;
    const same = items.filter(other => (other.chapter ?? step(other.copy).chapter) === chapter);
    const at = same.indexOf(item) + 1;
    const next = items[index + 1];
    const nextChapter = next ? (next.chapter ?? step(next.copy).chapter) : null;
    let nextLabel = item.nextLabel;
    if (nextLabel === undefined) {
      if (!next) nextLabel = chapters[chapters.indexOf(chapter) + 1] ? ui('lesson.ui.nextChapter').replace('{chapter}', chapters[chapters.indexOf(chapter) + 1]) : ui('lesson.ui.next');
      else nextLabel = nextChapter !== chapter ? ui('lesson.ui.nextChapter').replace('{chapter}', nextChapter) : ui('lesson.ui.next');
    }
    const stepAt = item.at ?? at; const stepOf = item.of ?? same.length;
    return {
      id: item.id, slug: s.slug, label: `${item.id} · ${s.heading}`, kind: item.kind,
      chapters, chapterIndex: chapters.indexOf(chapter), at: stepAt, of: stepOf,
      kicker: item.kicker ?? ui('lesson.ui.kickerStep').replace('{kicker}', chapter).replace('{step}', stepAt).replace('{total}', stepOf),
      heading: s.heading, body: item.body ?? s.body, takeaways: s.takeaways, panel: item.panel,
      first: item.first ?? index === 0, nextLabel, stage: item.stage,
    };
  });
}
export { ICONS, TAIL };
