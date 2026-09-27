// Site-wide content: the lesson roadmap and the Choices lesson's chapters.
// The lesson's own words live in src/lessons/choices/journey-story.js.
import { CHAPTERS, beatList } from '../lessons/choices/journey-story.js';
import { ICONS } from '../lessons/choices/journey-icons.js';

export const SITE = {
  name: 'Wisdom',
  tagline: 'A field guide to life',
  description: 'Short, illustrated lessons about how life works—for readers eight and up, and the grown-ups beside them.',
  source: 'https://github.com/Rio517/wisdom-web',
  research: 'https://github.com/Rio517/wisdom-web/tree/main/docs/research',
};

/** Join a site path onto the configured base (the site is served from the domain root). */
export function url(path = '/') {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export const LESSON_PATH = '/choices/the-paths-we-make/';

/** The six planned lessons, in reading order. Only available ones get pages. */
export const LESSONS = [
  {
    number: '01', id: 'choices', status: 'available', href: '/choices/',
    title: 'Choices — The paths we make',
    summary: 'How small choices add up over time, and how circumstances, support and chance shape the path too.',
  },
  {
    number: '02', id: 'habits', status: 'next',
    title: 'Habits and daily practice',
    summary: 'How little routines grow, how to change the ones that don’t help, and how to start again after a break.',
  },
  {
    number: '03', id: 'deciding', status: 'planned',
    title: 'How we make choices',
    summary: 'What really goes on when we decide, and how to think up better options before choosing one.',
  },
  {
    number: '04', id: 'happiness', status: 'planned',
    title: 'What makes a happy life',
    summary: 'What seems to help people live well, and what the evidence can and can’t tell us.',
  },
  {
    number: '05', id: 'relationships', status: 'planned',
    title: 'Relationships',
    summary: 'How the way we treat each other shapes our friendships and the people around us.',
  },
  {
    number: '06', id: 'learning', status: 'planned',
    title: 'How to learn',
    summary: 'Ways of learning that help new things stick.',
  },
];

export const STATUS_LABEL = { available: 'Ready to read', next: 'Coming next', planned: 'Planned' };

const CHAPTER_DETAILS = {
  paths: { icon: 'map', text: 'A life has many possible paths. Watch one of them unfold.' },
  hike: { icon: 'backpack', text: 'Alfredo plans a hike, turns back, learns, and meets something he can’t control.' },
  skills: { icon: 'soccerSmall', text: 'One girl, two paths: how practice builds on practice.' },
  play: { icon: 'celloSmall', text: 'Spend ten afternoons and watch what builds up.' },
  explore: { icon: 'eye', text: 'Choose a whole life path, from age three to seventy.' },
  wrap: { icon: 'leaf', text: 'Three ideas to keep.' },
};

const firstFragment = new Map();
for (const item of beatList()) if (!firstFragment.has(item.chapter.id)) firstFragment.set(item.chapter.id, item.fragment);

export const CHOICES_CHAPTERS = CHAPTERS.map((chapter, index) => ({
  id: chapter.id,
  number: String(index + 1).padStart(2, '0'),
  title: chapter.title,
  text: CHAPTER_DETAILS[chapter.id]?.text ?? '',
  icon: ICONS[CHAPTER_DETAILS[chapter.id]?.icon] ?? '',
  href: `${LESSON_PATH}#${firstFragment.get(chapter.id)}`,
}));

export const TAKEAWAYS = CHAPTERS.find(chapter => chapter.id === 'wrap').beats[0].takeaways
  .map(item => ({ ...item, icon: ICONS[item.icon] }));

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
};
