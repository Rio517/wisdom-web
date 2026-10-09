// Prototype bootstrap. Lesson 1's code reads its words from a catalog embedded
// in the page (src/i18n/runtime.js), so put the site's catalog plus this
// round's prototype words on the page before any of it loads. `?lang=de`
// loads the German labels for the layout check (English fills any gap).
import en from '../../src/i18n/messages/en.json';
import copyEn from './copy.json';

export async function boot(direction) {
  const lang = new URLSearchParams(location.search).get('lang') === 'de' ? 'de' : 'en';
  let messages = { ...en, ...copyEn };
  if (lang === 'de') {
    const [{ default: de }, { default: copyDe }] = await Promise.all([
      import('../../src/i18n/messages/de.json'),
      import('./copy.de.json'),
    ]);
    messages = { ...messages, ...de, ...copyDe };
  }
  document.documentElement.lang = lang;
  const element = document.createElement('script');
  element.type = 'application/json';
  element.id = 'i18n-messages';
  element.textContent = JSON.stringify(messages);
  document.head.append(element);
  const { start } = direction === 'index' ? await import('./index-page.js') : await import(`./direction-${direction}.js`);
  start(document.getElementById('app'));
}
