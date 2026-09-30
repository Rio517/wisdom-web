// Browser translator. Each page embeds its own language's messages in
// <script type="application/json" id="i18n-messages">; outside a browser
// (Node tests) the English catalog is used.
import { createTranslator } from './format.js';

const embedded = typeof document !== 'undefined' ? document.getElementById('i18n-messages') : null;
const messages = embedded
  ? JSON.parse(embedded.textContent)
  : (await import('./messages/en.json', { with: { type: 'json' } })).default;

export const locale = embedded ? (document.documentElement.lang || 'en') : 'en';
export const t = createTranslator(messages, locale, {});
