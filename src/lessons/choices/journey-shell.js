// The guided journey's frame, shared by every lesson page: the chapter trail, the step dots,
// Back and Next, the narration's fit beside the stage and the takeaways' band. A lesson brings
// its own chapters and beats (beatList in journey-story.js) and its own stage; the words come
// from the page's catalog (lesson.ui.*).
import { t } from '../../i18n/runtime.js';

export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Draw the chapter trail for `chapters` into the header; returns update(chapterIndex). */
export function createChapterTrail(chapters, root = document) {
  const base = root.querySelector('#trail-base');
  const done = root.querySelector('#trail-done');
  const stops = chapters.map((_, position) => ((position + 0.5) / chapters.length) * 1000);
  const third = (stops[1] - stops[0]) / 3;
  let d = `M ${stops[0]} 24 C ${stops[0] + third} 6, ${stops[1] - third} 42, ${stops[1]} 24`;
  for (let position = 2; position < stops.length; position += 1) d += ` S ${stops[position] - third} ${position % 2 ? 42 : 6}, ${stops[position]} 24`;
  base.setAttribute('d', d);
  done.setAttribute('d', d);
  const length = done.getTotalLength();
  done.style.strokeDasharray = `${length} ${length}`;
  root.querySelector('#chapter-list').innerHTML = chapters.map((chapter, chapterIndex) => `<li style="width:${100 / chapters.length}%">
  <button class="chapter-stop" type="button" data-chapter="${chapterIndex}">
    <span class="stop-dot" aria-hidden="true"></span><span class="stop-label">${escapeHTML(chapter.short ?? chapter.title)}</span>
  </button></li>`).join('');
  return function update(chapterIndex) {
    root.querySelectorAll('.chapter-stop').forEach(button => {
      const stop = Number(button.dataset.chapter);
      button.dataset.state = stop < chapterIndex ? 'done' : stop === chapterIndex ? 'current' : 'todo';
      if (stop === chapterIndex) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    done.style.strokeDashoffset = String(length * (1 - chapterIndex / (chapters.length - 1)));
  };
}

// Beside the map a step's words show whole: where the column is too short for them, the step
// tightens one notch at a time (journey.css) and stops at the first that fits. Under the map the
// page scrolls instead.
export const TIGHT = ['is-tight', 'is-tighter', 'is-tightest'];
const besideMap = typeof matchMedia === 'function' ? matchMedia('(min-width: 990px)') : { matches: true };

/** fit() tightens `body` until it fits; `skip(body)` leaves a step that fits its own way alone. */
export function createNarrationFit(body, { skip = () => false } = {}) {
  function fit() {
    body.classList.remove(...TIGHT);
    if (!besideMap.matches || skip(body)) return;
    for (const notch of TIGHT) {
      if (body.scrollHeight <= body.clientHeight) break;
      body.classList.add(notch);
    }
  }
  new ResizeObserver(fit).observe(body);
  return fit;
}

/**
 * The takeaways' band under the map and the column (journey.css) takes its own height from the page,
 * measured as it shows and when the window changes size (not in a ResizeObserver: the page's own
 * observers would then see the change in the same frame).
 */
export function createBand(journeyRoot, isBand = () => journeyRoot.dataset.beat === 'takeaways') {
  function size() {
    const list = isBand() && journeyRoot.querySelector('#beat-extra .takeaways');
    if (list) journeyRoot.style.setProperty('--band', `${list.offsetHeight}px`);
  }
  addEventListener('resize', size);
  return size;
}

/** Beside Back and Next in one row (a what-if, a short screen) the dots may not all fit: then none show. */
export function watchDots(dots) {
  new ResizeObserver(() => dots.classList.toggle('is-crowded', dots.scrollWidth > dots.clientWidth + 1)).observe(dots);
}

/** The step dots of the current chapter, Back and Next for beat `index` of `beats`. */
export function renderControls({ beats, index, seen, root = document }) {
  const item = beats[index];
  const { chapter, beatIndex } = item;
  const dots = root.querySelector('#beat-dots');
  dots.innerHTML = chapter.beats.map((beat, position) => {
    const globalIndex = beats.findIndex(entry => entry.chapter === chapter && entry.beatIndex === position);
    return `<li><button type="button" data-beat="${globalIndex}" aria-label="${escapeHTML(t('lesson.ui.stepLabel', { step: position + 1, heading: beat.heading }))}" ${position === beatIndex ? 'aria-current="step"' : ''} data-seen="${seen.has(globalIndex)}"></button></li>`;
  }).join('');
  dots.hidden = chapter.beats.length < 2;
  root.querySelector('#back').disabled = index === 0;
  const next = root.querySelector('#next');
  next.hidden = index === beats.length - 1;
  const upcoming = beats[index + 1];
  next.textContent = item.beat.next
    ?? (upcoming && upcoming.chapter !== item.chapter ? t('lesson.ui.nextChapter', { chapter: upcoming.chapter.short ?? upcoming.chapter.title }) : t('lesson.ui.next'));
  next.dataset.emphasis = String(index === 0);
}

/** The kicker over a beat's heading: the chapter, and the step's place in it when there are several. */
export const kickerFor = ({ beat, chapter, beatIndex }) => (chapter.beats.length > 1
  ? t('lesson.ui.kickerStep', { kicker: beat.kicker, step: beatIndex + 1, total: chapter.beats.length })
  : beat.kicker);

/** The page title for a beat: its heading, then the lesson's title. */
export function titleFor(item, lessonTitle) {
  const heading = item.beat.heading.replace(/\.$/, '');
  return heading === lessonTitle ? `${lessonTitle} · ${t('site.name')}` : `${heading} · ${lessonTitle}`;
}
