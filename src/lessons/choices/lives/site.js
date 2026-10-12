// The lives store on the site: the structure and the page's language's words,
// already parsed at build time (tooling/lives-data.mjs), loaded on Lesson 1 only,
// after the first paint. No YAML reaches the browser.
import { unpackStructure, unpackWords } from './pack.js';
import { loadWords } from './engine.js';

const WORDS = {
  en: () => import('virtual:lives/words/en'),
  es: () => import('virtual:lives/words/es'),
  de: () => import('virtual:lives/words/de'),
  fr: () => import('virtual:lives/words/fr'),
};

/** The store in `locale`. */
export async function openLives(locale = 'en') {
  const own = WORDS[locale] ?? WORDS.en;
  // A missing translation was filled from the English at build time, so one language's words do.
  const [{ default: packed }, { default: words }] = await Promise.all([import('virtual:lives/structure'), own()]);
  const store = loadWords(unpackStructure(packed), unpackWords(words, packed), { locale: WORDS[locale] ? locale : 'en' });
  return store;
}
