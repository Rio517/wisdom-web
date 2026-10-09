// Shared pieces for the v02 home and cover directions: the page shell with
// the existing drawer, the real path field (createPathsScene) with a grow that
// starts at the Beginning dot, the content below the stage, and a small
// review toolbar. Words come from the catalog (plus this round's copy.json).
import { t } from '../../src/i18n/runtime.js';
import { createPathsScene } from '../../src/lessons/choices/journey-map.js';
import { createToken, prefersReducedMotion, wait } from '../../src/lessons/choices/journey-motion.js';
import { chaptersFor } from '../../src/lessons/choices/journey-story.js';
import { lessonsFor, LESSON_PATH, SITE, UI } from '../../src/data/site.js';
import { initSiteNav } from '../../src/components/site-nav.js';

export { t, createToken, prefersReducedMotion, wait };

// Links go to the site's development server; the prototypes are not the site.
const SITE_ORIGIN = 'http://127.0.0.1:4600';
export const live = path => `${SITE_ORIGIN}${path}`;
const escape = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
export const params = new URLSearchParams(location.search);
export const view = params.get('view') === 'cover' ? 'cover' : 'home';

function navMarkup() {
  const soon = lessonsFor(t).filter(lesson => lesson.status !== 'available');
  const pages = [
    [t('nav.aboutLesson'), '/choices/'], [t('nav.lesson'), LESSON_PATH],
    [t('nav.read'), `${LESSON_PATH}read/`], [t('nav.notes'), '/choices/notes/'],
  ];
  return `<nav class="site-nav" id="site-nav" data-mode="drawer" data-open="false" aria-label="${escape(t('nav.label'))}"
    data-label-close="${escape(t('nav.close'))}" data-label-hide="${escape(t('nav.hide'))}">
    <div class="nav-head">
      <a class="brand" href="${live('/')}"><span class="brand-name">${escape(t('site.name'))}</span><span class="brand-tag">${escape(t('site.tagline'))}</span></a>
      <button class="nav-close" type="button" data-nav-close aria-label="${escape(t('nav.close'))}"><span class="icon-collapse">${UI.collapse}</span><span class="icon-close">${UI.close}</span></button>
    </div>
    <div>
      <p class="nav-section-label" id="site-nav-lessons">${escape(t('nav.lessons'))}</p>
      <ul class="nav-lessons" aria-labelledby="site-nav-lessons">
        <li class="nav-lesson"><details open>
          <summary><span class="lesson-num">01</span><span class="nav-lesson-title">${escape(t('nav.choices'))}</span><span class="chevron">${UI.chevron}</span></summary>
          <ul class="nav-pages">${pages.map(([label, path]) => `<li><a href="${live(path)}">${escape(label)}</a></li>`).join('')}</ul>
        </details></li>
        ${soon.map(lesson => `<li class="nav-lesson nav-lesson-soon" data-status="${lesson.status}">
          <button class="nav-soon soon-trigger" type="button" aria-describedby="site-nav-tip-${lesson.id}"><span class="lesson-num">${lesson.number}</span><span class="nav-lesson-title">${escape(lesson.title)}</span></button>
          <span class="soon-tip" role="tooltip" id="site-nav-tip-${lesson.id}" hidden>${escape(lesson.tip)}</span>
        </li>`).join('')}
      </ul>
    </div>
    <div class="nav-utility">
      <a href="${live('/about/')}">${escape(t('nav.about'))}</a>
      <a href="${SITE.research}">${escape(t('nav.research'))} <span class="sr-only">${escape(t('nav.opensGithub'))}</span>${UI.external}</a>
      <a href="${SITE.source}">${escape(t('nav.source'))} <span class="sr-only">${escape(t('nav.opensGithub'))}</span>${UI.external}</a>
    </div>
  </nav>`;
}

function trailMarkup() {
  const chapters = chaptersFor(t);
  return `<nav class="d-trail" aria-label="${escape(t('lesson.ui.chapters'))}"><ol>${chapters.map((chapter, index) => `
    <li><a href="${live(LESSON_PATH)}" ${index === 0 ? 'aria-current="step"' : ''}><span class="d-trail-dot" aria-hidden="true"></span><span>${escape(chapter.short ?? chapter.title)}</span></a></li>`).join('')}
  </ol></nav>`;
}

/** The page frame: a top bar with the menu button, the drawer, a stage and (home only) content below. */
export function shell(direction) {
  document.body.dataset.view = view;
  document.body.dataset.direction = direction;
  document.body.innerHTML = `
    <a class="skip-link" href="#stage">${escape(t('common.skipToContent'))}</a>
    ${navMarkup()}
    <header class="d-top">
      <div class="d-left"><button class="d-menu" type="button" data-nav-open aria-label="${escape(t('nav.open'))}">${UI.menu}<span>${escape(t('nav.index'))}</span></button>
      <a class="d-brand" href="${live('/')}">${escape(t('site.name'))}</a></div>
      ${view === 'cover' ? trailMarkup() : '<span></span>'}
      ${view === 'cover' ? `<a class="d-quiet" href="${live(`${LESSON_PATH}read/`)}">${escape(t('lesson.ui.readAsText'))}</a>` : `<a class="d-quiet" href="${live('/about/')}">${escape(t('nav.about'))}</a>`}
    </header>
    <main id="stage" class="d-stage" tabindex="-1">
      <figure class="d-field" aria-label="${escape(t('home.mapLabel'))}">
        <div class="map-stack" data-grow="hidden" data-state="overview">
          <img id="map-ghost" alt="" aria-hidden="true">
          <canvas id="map-base" aria-hidden="true"></canvas>
          <canvas id="map-today" aria-hidden="true"></canvas>
          <canvas id="map-fx" aria-hidden="true"></canvas>
          <div id="map-callouts" aria-hidden="true"></div>
        </div>
      </figure>
      <div class="d-copy"></div>
      <div class="d-after" hidden></div>
    </main>
    ${view === 'home' ? belowMarkup() : ''}
    ${reviewMarkup(direction)}`;
  initSiteNav();
  return {
    stage: document.querySelector('.d-stage'),
    figure: document.querySelector('.d-field'),
    copy: document.querySelector('.d-copy'),
    after: document.querySelector('.d-after'),
  };
}

function belowMarkup() {
  const lessons = lessonsFor(t);
  return `<div class="d-below">
    <section class="d-lesson" aria-labelledby="d-lesson-title">
      <p class="kicker">${escape(t('home.lesson.kicker'))}</p>
      <h2 id="d-lesson-title">${escape(t('home.lesson.title'))}</h2>
      <p class="d-lede">${escape(t('home.v2.lessonLede'))}</p>
      <div class="d-actions">
        <a class="btn btn-primary" href="${live(LESSON_PATH)}">${escape(t('home.startJourney'))}${UI.arrow}</a>
        <a class="btn btn-quiet" href="${live(`${LESSON_PATH}read/`)}">${escape(t('home.readText'))}</a>
      </div>
    </section>
    <section class="d-roadmap" aria-labelledby="d-roadmap-title">
      <h2 id="d-roadmap-title">${escape(t('home.roadmap.title'))}</h2>
      <ol>${lessons.map(lesson => `<li data-status="${lesson.status}">
        <span class="d-road-num" aria-hidden="true">${lesson.number}</span>
        <div>${lesson.status === 'available'
          ? `<a href="${live('/choices/')}">${escape(lesson.title)}</a>`
          : `<button class="road-soon soon-trigger" type="button" aria-describedby="d-tip-${lesson.id}">${escape(lesson.title)}</button><span class="soon-tip" role="tooltip" id="d-tip-${lesson.id}" hidden>${escape(lesson.tip)}</span>`}
        </div>
        <span class="status-pill" data-status="${lesson.status}">${escape(lesson.statusLabel)}</span>
      </li>`).join('')}</ol>
    </section>
    <p class="d-grownups"><a href="${live('/choices/notes/')}">${escape(t('home.v2.grownups'))}</a></p>
  </div>`;
}

function reviewMarkup(direction) {
  const here = location.pathname;
  return `<aside class="d-review" aria-label="${escape(t('review.label'))}">
    <strong>${escape(t('review.label'))} ${direction.toUpperCase()}</strong>
    <a href="${here}" ${view === 'home' ? 'aria-current="page"' : ''}>${escape(t('review.home'))}</a>
    <a href="${here}?view=cover" ${view === 'cover' ? 'aria-current="page"' : ''}>${escape(t('review.cover'))}</a>
    <a href="${here}${location.search}">${escape(t('review.replay'))}</a>
    <a href="./">${escape(t('review.index'))}</a>
  </aside>`;
}

/**
 * The real path scene, plus a faint copy of the field (the ghost) that the
 * growing paths cover, and the Beginning dot's position for the grow mask.
 */
export function createField(figure) {
  const stack = figure.querySelector('.map-stack');
  const base = figure.querySelector('#map-base');
  const ghost = figure.querySelector('#map-ghost');
  // A softer right-hand end than the lesson's: on a full-width stage the line
  // ends otherwise stand in a wall short of the screen edge.
  const scene = createPathsScene(figure, { labels: false, edgeFade: 0.16 });
  const place = () => {
    const { width, height } = stack.getBoundingClientRect();
    // Where fitOverview puts the Beginning (src/engine/lab-renderer.js: 30px
    // side padding, 10 top and 28 bottom, a 1260 × 740 field opening at x 40).
    const ox = 30 + 40 * (width - 60) / 1260;
    const oy = 10 + 370 * (height - 38) / 740;
    stack.style.setProperty('--ox', `${ox}px`);
    stack.style.setProperty('--oy', `${oy}px`);
    stack.style.setProperty('--reach', `${Math.hypot(width - ox, Math.max(oy, height - oy)) + 160}px`);
  };
  // A still picture of the field, not a third canvas: a canvas layer is
  // pushed to the compositor again on every frame that something animates
  // near it, which cost long frames while the words left.
  let ghostURL = null;
  const copyGhost = () => {
    if (!base.width) return;
    // Leave out the renderer's bottom labels (the last 28px): the real
    // Beginning label sits beside the dot.
    const copy = document.createElement('canvas');
    copy.width = base.width; copy.height = base.height;
    const scale = base.width / Math.max(1, base.getBoundingClientRect().width);
    copy.getContext('2d').drawImage(base, 0, 0, base.width, base.height - 30 * scale, 0, 0, base.width, base.height - 30 * scale);
    copy.toBlob(blob => {
      if (!blob) return;
      if (ghostURL) URL.revokeObjectURL(ghostURL);
      ghostURL = URL.createObjectURL(blob);
      ghost.src = ghostURL;
    });
  };
  new ResizeObserver(() => { place(); requestAnimationFrame(() => requestAnimationFrame(copyGhost)); }).observe(stack);
  place();
  return {
    scene, stack,
    cover() { scene.show('cover', { animate: false }); copyGhost(); },
    async grow(token, { travel = true } = {}) {
      await scene.show('many', { from: 'cover', animate: true, token });
      if (!travel || token.cancelled || !(await wait(200, token))) return;
      await scene.show('travel', { from: 'many', animate: true, token });
    },
    settle({ travel = true } = {}) { scene.show(travel ? 'travel' : 'many', { animate: false }); stack.dataset.grow = 'shown'; },
  };
}

/** The lesson's next step, shown once the cover's paths have grown. */
export function narrationMarkup() {
  const many = chaptersFor(t)[0].beats.find(beat => beat.id === 'many');
  return `<div class="d-narration">
    <p class="kicker">${escape(many.kicker)}</p>
    <h2>${escape(many.heading)}</h2>
    ${many.body.map(text => `<p>${escape(text)}</p>`).join('')}
    <div class="d-actions"><a class="btn btn-primary" href="${live(`${LESSON_PATH}#paths-many`)}">${escape(t('lesson.ui.next'))}${UI.arrow}</a></div>
  </div>`;
}

/** What the home stage shows once the paths have grown. */
export function settledMarkup() {
  return `<p class="d-settled">${escape(t('home.v2.settled'))}</p>
    <div class="d-actions"><a class="btn btn-primary" href="${live(LESSON_PATH)}">${escape(t('home.startLesson'))}${UI.arrow}</a>
    <a class="btn btn-quiet" href="${live('/choices/')}">${escape(t('home.aboutLesson'))}</a></div>`;
}

/** Reveal the settled block and move focus to its first control, since the button that started it is gone. */
export function showAfter(after, html) {
  after.innerHTML = html;
  after.hidden = false;
  requestAnimationFrame(() => after.classList.add('is-in'));
  after.querySelector('a, button')?.focus({ preventScroll: true });
}

/** Wrap each word in a span (for exits that move words, not letters). */
export function words(text) {
  return text.split(' ').map(word => `<span class="w">${escape(word)}</span>`).join(' ');
}

export { escape };
