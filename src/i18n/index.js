// Build-time access to every catalog (Astro pages, tests). Browser code uses
// ./runtime.js instead, which only carries the current page's language.
import en from './messages/en.json' with { type: 'json' };
import es from './messages/es.json' with { type: 'json' };
import de from './messages/de.json' with { type: 'json' };
import fr from './messages/fr.json' with { type: 'json' };
import { createTranslator } from './format.js';
import { DEFAULT_LOCALE, isLocale } from './config.js';

export const CATALOGS = { en, es, de, fr };

/** A locale's messages with English filling any gaps. */
export function getMessages(locale = DEFAULT_LOCALE) {
  const catalog = CATALOGS[isLocale(locale) ? locale : DEFAULT_LOCALE];
  return { ...en, ...catalog };
}

export function getTranslator(locale = DEFAULT_LOCALE) {
  const safe = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return createTranslator(CATALOGS[safe], safe, en);
}

/** Only the keys whose prefix is listed — keeps embedded browser catalogs small. */
export function pickMessages(locale, prefixes) {
  const all = getMessages(locale);
  return Object.fromEntries(Object.entries(all).filter(([key]) => prefixes.some(prefix => key.startsWith(prefix))));
}
