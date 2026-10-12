// The lives store at build time (Astro pages): the text version tells Sam's life,
// in the page's language, for readers without scripts. Never shipped to the browser.
import structure from 'virtual:lives/structure';
import en from 'virtual:lives/words/en';
import es from 'virtual:lives/words/es';
import de from 'virtual:lives/words/de';
import fr from 'virtual:lives/words/fr';
import { unpackStructure, unpackWords } from './pack.js';
import { loadWords, writtenLife } from './engine.js';

const WORDS = { en, es, de, fr };
const stores = new Map();

/** A written life in `locale` (Sam's by default), as the story tells it. */
export function writtenLifeIn(locale, id = 'sam') {
  const words = WORDS[locale] ?? en;
  if (!stores.has(locale)) stores.set(locale, loadWords(unpackStructure(structure), unpackWords(words, structure), { locale: WORDS[locale] ? locale : 'en' }));
  return writtenLife(stores.get(locale), id);
}
