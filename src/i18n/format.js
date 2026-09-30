// ICU MessageFormat translator with an English fallback. Shared by the build
// (Astro pages) and the browser runtime.
import { IntlMessageFormat } from 'intl-messageformat';

/**
 * t(key, values) formats the ICU message for `key`. Missing keys fall back to
 * the fallback catalog (English), then to the key itself so gaps are visible.
 */
export function createTranslator(messages, locale, fallback = {}) {
  const cache = new Map();
  function t(key, values) {
    const source = messages[key] ?? fallback[key];
    if (source === undefined) return key;
    if (!values && !source.includes('{')) return source;
    let formatter = cache.get(key);
    if (!formatter) {
      formatter = new IntlMessageFormat(source, messages[key] === undefined ? 'en' : locale);
      cache.set(key, formatter);
    }
    return String(formatter.format(values));
  }
  t.locale = locale;
  t.has = key => key in messages || key in fallback;
  return t;
}
