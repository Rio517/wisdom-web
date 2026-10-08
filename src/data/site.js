// Site-wide structure: the lesson roadmap and the Choices lesson's chapters.
// Words come from the message catalogs (site.*); pass a translator from
// src/i18n/index.js (build) so each page renders in its own language.
import { chaptersFor, beatList } from '../lessons/choices/journey-story.js';
import { ICONS } from '../lessons/choices/journey-icons.js';
import { localizePath } from '../i18n/config.js';

export const SITE = {
  source: 'https://github.com/Rio517/wisdom-web',
  research: 'https://github.com/Rio517/wisdom-web/tree/main/docs/research',
};

/** Join a site path onto the configured base (the site is served from the domain root). */
export function url(path = '/') {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** A link to `path` in `locale`: href('de', '/choices/') → /de/choices/. */
export const href = (locale, path) => url(localizePath(path, locale));

export const LESSON_PATH = '/choices/the-paths-we-make/';

/** The six planned lessons, in reading order. Only available ones get pages. */
const LESSON_DATA = [
  { number: '01', id: 'choices', status: 'available', path: '/choices/' },
  { number: '02', id: 'habits', status: 'next' },
  { number: '03', id: 'deciding', status: 'planned' },
  { number: '04', id: 'happiness', status: 'planned' },
  { number: '05', id: 'relationships', status: 'planned' },
  { number: '06', id: 'learning', status: 'planned' },
];

export function lessonsFor(t) {
  return LESSON_DATA.map(lesson => ({
    ...lesson,
    title: t(`site.lesson.${lesson.id}.title`),
    summary: t(`site.lesson.${lesson.id}.summary`),
    statusLabel: t(`site.status.${lesson.status}`),
    tip: lesson.status === 'available' ? undefined : t(`site.soonTip.${lesson.status}`),
    href: lesson.path ? href(t.locale, lesson.path) : undefined,
  }));
}

const CHAPTER_ICONS = { paths: 'map', hike: 'backpack', skills: 'soccerSmall', play: 'celloSmall', explore: 'eye', wrap: 'leaf' };

export function choicesChaptersFor(t) {
  const chapters = chaptersFor(t);
  const firstFragment = new Map();
  for (const item of beatList(chapters)) if (!firstFragment.has(item.chapter.id)) firstFragment.set(item.chapter.id, item.fragment);
  return chapters.map((chapter, index) => ({
    id: chapter.id,
    number: String(index + 1).padStart(2, '0'),
    title: chapter.title,
    text: t(`site.chapter.${chapter.id}.text`),
    icon: ICONS[CHAPTER_ICONS[chapter.id]] ?? '',
    href: `${href(t.locale, LESSON_PATH)}#${firstFragment.get(chapter.id)}`,
  }));
}

export function takeawaysFor(t) {
  return chaptersFor(t).find(chapter => chapter.id === 'wrap').beats[0].takeaways
    .map(item => ({ ...item, icon: ICONS[item.icon] }));
}

/** Small interface icons (stroke-based, decorative). */
const ui = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
export const UI = {
  arrow: ui('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: ui('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  close: ui('<path d="M6 6l12 12M18 6L6 18"/>'),
  collapse: ui('<path d="M15 6l-6 6 6 6"/>'),
  chevron: ui('<path d="M9 6l6 6-6 6"/>'),
  external: ui('<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>'),
  clock: ui('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  people: ui('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.5 14.2c2.4-.2 4.4 1.3 5 4.3"/>'),
  device: ui('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M10 17.5h4"/>'),
  text: ui('<path d="M5 6h14M5 10h14M5 14h9M5 18h11"/>'),
  check: ui('<path d="M5 12.5l4.2 4L19 7"/>'),
  book: ui('<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19"/>'),
  globe: ui('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z"/>'),
};
