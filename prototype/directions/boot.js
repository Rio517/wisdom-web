// Prototype bootstrap: the lesson code reads its words from an embedded
// catalog (src/i18n/runtime.js), so put the English catalog, plus this
// round's prototype words, on the page before any of it loads.
import messages from '../../src/i18n/messages/en.json';
import copy from './copy.json';

export async function boot(direction) {
  const element = document.createElement('script');
  element.type = 'application/json';
  element.id = 'i18n-messages';
  element.textContent = JSON.stringify({ ...messages, ...copy });
  document.head.append(element);
  const { start } = await import(`./direction-${direction}.js`);
  start();
}
