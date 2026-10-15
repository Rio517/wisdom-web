// Round v02 start-up. The runtime translator (src/i18n/runtime.js) reads its
// words from a catalog on the page, so put this round's words there before any
// module that uses it loads. `?lang=de` swaps in the quick German for the
// layout check (English fills any gap).
import copyEn from './copy.json';

const PAGES = {
  index: () => import('./index-page.js'),
  e: () => import('./e.js'),
  f: () => import('./f.js'),
  g: () => import('./g.js'),
};

export async function boot(page) {
  const lang = new URLSearchParams(location.search).get('lang') === 'de' ? 'de' : 'en';
  let messages = { ...copyEn };
  if (lang === 'de') messages = { ...messages, ...(await import('./copy.de.json')).default };
  document.documentElement.lang = lang;
  const element = document.createElement('script');
  element.type = 'application/json';
  element.id = 'i18n-messages';
  element.textContent = JSON.stringify(messages);
  document.head.append(element);
  const { start } = await PAGES[page]();
  start(document.getElementById('app'));
}
