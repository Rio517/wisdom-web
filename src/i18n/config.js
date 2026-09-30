// Locales and locale-aware paths. English is served at the root; every other
// locale lives under its own prefix (/es/, /de/, /fr/).
export const DEFAULT_LOCALE = 'en';
export const LOCALES = ['en', 'es', 'de', 'fr'];

/** Each language named in itself, for the language switcher. */
export const LOCALE_NAMES = { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français' };

/** BCP 47 tags for <html lang>, hreflang and Intl. */
export const LOCALE_TAGS = { en: 'en', es: 'es', de: 'de', fr: 'fr' };

/**
 * A draft language is built and reachable by its URL, but other pages don't
 * link to it, search engines are asked not to index it, and it carries a
 * draft notice. Published languages appear in the switcher and hreflang.
 */
export const LOCALE_STATUS = { en: 'published', es: 'published', de: 'published', fr: 'published' };
export const isPublished = locale => LOCALE_STATUS[locale] === 'published';

/** Languages the switcher offers on a page: published ones, plus every draft while reviewing a draft. */
export function switcherLocales(current) {
  return isPublished(current) ? LOCALES.filter(isPublished) : LOCALES;
}

export const isLocale = value => LOCALES.includes(value);

const PREFIX = new RegExp(`^/(${LOCALES.filter(locale => locale !== DEFAULT_LOCALE).join('|')})(?=/|$)`);

/** The locale a path belongs to. */
export function localeFromPath(path = '/') {
  return path.match(PREFIX)?.[1] ?? DEFAULT_LOCALE;
}

/** A path without its locale prefix: /es/choices/ → /choices/. */
export function stripLocale(path = '/') {
  const stripped = path.replace(PREFIX, '');
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

/** The same page in another locale: localizePath('/choices/', 'de') → /de/choices/. */
export function localizePath(path, locale) {
  const clean = stripLocale(path);
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/** getStaticPaths for pages served in every locale through a [...locale] rest parameter. */
export function localeStaticPaths() {
  return LOCALES.map(locale => ({ params: { locale: locale === DEFAULT_LOCALE ? undefined : locale }, props: { locale } }));
}
