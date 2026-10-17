// The lesson's frame, as Lesson 1 shows it: header with the chapter trail, the stage on the left,
// the story column on the right with its step dots and Back/Next. Every frame is one viewport tall,
// so the page is the whole storyboard top to bottom, and `#<frame id>` opens one frame.
import en from '../../src/i18n/messages/en.json';
import { esc } from './draw.js';

export const ui = key => en[key];
// The site's menu icon (src/data/site.js UI.menu); that module pulls in Lesson 1's runtime catalog loader.
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
const ICON_FOR = { big: 'add', build: 'build', start: 'weather' };

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
export function frameMarkup(def, takeawayIcons) {
  const dots = Array.from({ length: def.of }, (_, i) => `<li><button type="button" aria-label="${i + 1}"${i + 1 === def.at ? ' aria-current="step"' : ''} data-seen="${i + 1 < def.at}"></button></li>`).join('');
  const takeaways = def.takeaways?.length ? `<ul class="takeaways">${def.takeaways.map((t, i) => `<li>${takeawayIcons[['big', 'build', 'start'][i]] ?? ''}<div><strong>${esc(t.title)}</strong><span>${esc(t.text)}</span></div></li>`).join('')}</ul>` : '';
  return `<section class="frame" id="${def.id}" data-kind="${def.kind ?? 'story'}" aria-label="${esc(def.label)}">
    <header class="journey-header">
      <div class="journey-home"><button class="journey-menu" type="button" aria-label="${esc(ui('lesson.ui.openIndex'))}">${MENU}</button>
        <a class="journey-brand" href="#">${esc(ui('site.name'))} <span>${esc(ui('site.tagline'))}</span></a></div>
      ${trail(def.chapters, def.chapterIndex)}
      <button class="quiet-link" type="button">${esc(ui('lesson.ui.readAsText'))}</button>
    </header>
    <main class="journey">
      <section class="stage" aria-label="${esc(ui('lesson.ui.illustration'))}"><div class="stage-art"></div></section>
      <aside class="narration">
        <div class="narration-body" data-beat="${esc(def.slug)}">
          <p class="beat-kicker">${esc(def.kicker)}</p>
          <h1 class="beat-heading">${esc(def.heading)}</h1>
          <div class="beat-text">${def.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
          <div class="beat-extra">${takeaways}${def.panel ?? ''}</div>
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

/** Put the frames on the page, draw their trails and stages, and keep them drawn on resize. */
export function mount(root, defs, takeawayIcons) {
  root.innerHTML = defs.map(def => frameMarkup(def, takeawayIcons)).join('');
  const frames = [...root.querySelectorAll('.frame')];
  const draw = () => frames.forEach((frame, i) => {
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
  const go = (from, step) => frames[Math.max(0, Math.min(frames.length - 1, from + step))]?.scrollIntoView({ block: 'start' });
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

export { ICON_FOR };
