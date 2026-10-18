// The lesson's frame as the built lessons show it: header with the chapter trail, the stage on the left,
// the story column on the right with its step dots and Back/Next, and on a takeaways step the band of
// takeaways across the foot of the page. Every frame is one viewport tall, so the page is the whole
// storyboard top to bottom, and `#<frame id>` opens one frame.
import en from '../../src/i18n/messages/en.json';
import { esc } from '../lesson2-practice/draw.js';
import { step } from './copy.js';

export const ui = key => en[key];
// The site's menu icon (src/data/site.js UI.menu).
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';

function trail(chapters, current) {
  const stops = chapters.map((_, i) => ((i + 0.5) / chapters.length) * 1000);
  const third = (stops[1] - stops[0]) / 3;
  let d = `M ${stops[0]} 24 C ${stops[0] + third} 6, ${stops[1] - third} 42, ${stops[1]} 24`;
  for (let p = 2; p < stops.length; p += 1) d += ` S ${stops[p] - third} ${p % 2 ? 42 : 6}, ${stops[p]} 24`;
  return `<nav class="chapter-trail" aria-label="${esc(ui('lesson.ui.chapters'))}">
    <svg class="trail-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path class="trail-base" d="${d}"/><path class="trail-done" d="${d}" data-fraction="${current / (chapters.length - 1)}"/></svg>
    <ol class="chapter-list">${chapters.map((name, i) => `<li style="width:${100 / chapters.length}%"><button class="chapter-stop" type="button" data-state="${i < current ? 'done' : i === current ? 'current' : 'todo'}"${i === current ? ' aria-current="step"' : ''}>
      <span class="stop-dot" aria-hidden="true"></span><span class="stop-label">${esc(name)}</span></button></li>`).join('')}</ol></nav>`;
}

/** One frame's markup. `def.stage(w, h)` draws the stage once the frame is on the page. */
export function frameMarkup(def, takeawayIcons = []) {
  const dots = def.of > 1 ? Array.from({ length: def.of }, (_, i) => `<li><button type="button" aria-label="${i + 1}"${i + 1 === def.at ? ' aria-current="step"' : ''} data-seen="${i + 1 < def.at}"></button></li>`).join('') : '';
  const band = def.takeaways?.length > 0;
  const takeaways = band ? `<ul class="takeaways">${def.takeaways.map((t, i) => `<li>${takeawayIcons[i] ?? ''}<div><strong>${esc(t.title)}</strong><span>${esc(t.text)}</span></div></li>`).join('')}</ul>` : '';
  const result = def.result ? `<p class="beat-result">${esc(def.result)}</p>` : '';
  return `<section class="frame" id="${def.id}" data-kind="${def.kind ?? 'story'}" aria-label="${esc(def.label)}">
    <header class="journey-header">
      <div class="journey-home"><button class="journey-menu" type="button" aria-label="${esc(ui('lesson.ui.openIndex'))}">${MENU}</button>
        <a class="journey-brand" href="#">${esc(ui('site.name'))} <span>${esc(ui('site.tagline'))}</span></a></div>
      ${trail(def.chapters, def.chapterIndex)}
      <button class="quiet-link" type="button">${esc(ui('lesson.ui.readAsText'))}</button>
    </header>
    <main class="journey"${band ? ' data-beat="takeaways"' : ''}>
      <section class="stage" aria-label="${esc(ui('lesson.ui.illustration'))}"><div class="stage-art"></div></section>
      <aside class="narration">
        <div class="narration-body" data-beat="${esc(def.slug)}">
          <p class="beat-kicker">${esc(def.kicker)}</p>
          <h1 class="beat-heading">${esc(def.heading)}</h1>
          <div class="beat-text">${def.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
          <div class="beat-extra">${def.panel ?? ''}${result}${takeaways}</div>
        </div>
        <footer class="narration-controls">
          <ol class="beat-dots" aria-label="${esc(ui('lesson.ui.stepsInChapter'))}">${dots}</ol>
          <div class="nav-buttons">
            <button class="back-button" type="button" data-go="-1"${def.first ? ' disabled' : ''}>${esc(ui('lesson.ui.back'))}</button>
            ${def.nextLabel === null ? '' : `<button class="next-button" type="button" data-go="1">${esc(def.nextLabel ?? ui('lesson.ui.next'))}</button>`}
          </div>
          <p class="key-hint">${esc(ui('lesson.ui.keyHint'))}</p>
        </footer>
      </aside>
    </main>
  </section>`;
}

/**
 * Frame definitions from items: `{ id, copy, stage, chapter?, kicker?, body?, panel?, result?, nextLabel?, at?, of? }`.
 * The kicker is "<chapter> · <step> of <total>", as the lessons show it; a chapter with one step shows the
 * chapter alone and no step dots (the built lessons' rule).
 */
export function buildFrames(items, chapters) {
  return items.map((item, index) => {
    const s = step(item.copy);
    const chapter = item.chapter ?? s.chapter;
    const same = items.filter(other => (other.chapter ?? step(other.copy).chapter) === chapter);
    const at = item.at ?? same.indexOf(item) + 1;
    const of = item.of ?? same.length;
    const next = items[index + 1];
    const nextChapter = next ? (next.chapter ?? step(next.copy).chapter) : chapters[chapters.indexOf(chapter) + 1];
    let nextLabel = item.nextLabel;
    if (nextLabel === undefined) nextLabel = nextChapter && nextChapter !== chapter ? ui('lesson.ui.nextChapter').replace('{chapter}', nextChapter) : ui('lesson.ui.next');
    const kicker = item.kicker ?? (of > 1 ? ui('lesson.ui.kickerStep').replace('{kicker}', chapter).replace('{step}', at).replace('{total}', of) : chapter);
    return {
      id: item.id, slug: s.slug, label: `${item.id} · ${s.heading}`, kind: item.kind,
      chapters, chapterIndex: chapters.indexOf(chapter), at, of, kicker,
      heading: s.heading, body: item.body ?? s.body, takeaways: s.takeaways, panel: item.panel, result: item.result,
      first: item.first ?? index === 0, nextLabel, stage: item.stage,
    };
  });
}

/** Put the frames on the page, draw their trails and stages, and keep them drawn on resize. */
export function mount(root, defs, takeawayIcons) {
  root.innerHTML = defs.map(def => frameMarkup(def, takeawayIcons)).join('');
  const frames = [...root.querySelectorAll('.frame')];
  const draw = () => frames.forEach((frame, i) => {
    const journey = frame.querySelector('.journey');
    const band = frame.querySelector('.journey[data-beat="takeaways"] .takeaways');
    journey.style.setProperty('--band', band && getComputedStyle(band).position === 'absolute' ? `${Math.ceil(band.getBoundingClientRect().height)}px` : '0px');
    const art = frame.querySelector('.stage-art');
    const { width, height } = art.getBoundingClientRect();
    art.innerHTML = defs[i].stage(Math.round(width), Math.round(height));
    const done = frame.querySelector('.trail-done');
    const length = done.getTotalLength();
    done.style.strokeDasharray = `${length} ${length}`;
    done.style.strokeDashoffset = String(length * (1 - Number(done.dataset.fraction)));
  });
  draw();
  let pending = 0;
  addEventListener('resize', () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(draw); });
  const go = (from, by) => frames[Math.max(0, Math.min(frames.length - 1, from + by))]?.scrollIntoView({ block: 'start' });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-go]');
    if (button) go(frames.indexOf(button.closest('.frame')), Number(button.dataset.go));
  });
  addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const nearest = frames.reduce((best, frame, i) => (Math.abs(frame.getBoundingClientRect().top) < Math.abs(frames[best].getBoundingClientRect().top) ? i : best), 0);
    go(nearest, event.key === 'ArrowRight' ? 1 : -1);
  });
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  document.documentElement.dataset.ready = 'true';
}
