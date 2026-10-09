// The lesson's code reads its words from a catalog embedded in the page
// (src/i18n/runtime.js), so put the site's English catalog plus this round's
// words on the page before any of it loads.
import en from '../../src/i18n/messages/en.json';
import copy from './copy.json';

const element = document.createElement('script');
element.type = 'application/json';
element.id = 'i18n-messages';
element.textContent = JSON.stringify({ ...en, ...copy });
document.head.append(element);
const { start } = await import('./page.js');
start(document.getElementById('app'));
