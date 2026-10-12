// The lives store read from its YAML files (Node: `npm run lives:check`, the tests,
// the reviewer's text; the browser: the tree page and the prototype on the dev server).
// The site never imports this: it ships the store already parsed (data.js).
import { load } from 'js-yaml';
import { loadStore as fromData } from './engine.js';

/** Read the store from YAML texts: `files` maps each path to its text (see engine.js `loadStore`). */
export const loadStore = files => fromData(files, load);
