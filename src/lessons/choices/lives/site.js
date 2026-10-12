// The lives store on the site: the structure and the page's language's words,
// already parsed at build time (tooling/lives-data.mjs), loaded on Lesson 1 only,
// after the first paint. No YAML reaches the browser.
import { loadWords, check } from './engine.js';

const WORDS = {
  en: () => import('virtual:lives/words/en'),
  es: () => import('virtual:lives/words/es'),
  de: () => import('virtual:lives/words/de'),
  fr: () => import('virtual:lives/words/fr'),
};

/** The store in `locale` (English where a translation is missing). */
export async function openLives(locale = 'en') {
  const own = WORDS[locale] ?? WORDS.en;
  const [{ default: structure }, { default: words }, english] = await Promise.all([
    import('virtual:lives/structure'), own(), locale === 'en' ? null : WORDS.en(),
  ]);
  const store = loadWords(structure, words, { locale: WORDS[locale] ? locale : 'en', fallback: english?.default ?? null });
  // On the dev server the store is checked too, so a broken edit shows in the console.
  if (import.meta.env?.DEV && !store.words) {
    const { errors } = check(store);
    if (errors.length) console.info(`The lives store has ${errors.length} problems: npm run lives:check`);
  }
  return store;
}
