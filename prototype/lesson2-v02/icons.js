// Round v02 icons: Lesson 1's set and direction D's (frozen in ./d/) plus the
// few this round adds: Lego, a puzzle, and the small get-ready steps of
// direction E. Flat, 48-unit boxes, colours from src/styles/tokens.css only.
// Decorative: every caller pairs an icon with text.
import { ICONS as BASE } from './d/icons-d.js';
import { person } from '../../src/lessons/choices/journey-icons.js';

const svg = body => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${body}</svg>`;
// Token values (tokens.css): forest, sage, mist, lake, lake-soft, sun, clay, cello, ink, rule, paper-deep.
const FOREST = '#285442';
const SAGE = '#8daa91';
const MIST = '#c5cec8';
const LAKE = '#5f8fa3';
const LAKE_SOFT = '#d6e6ea';
const SUN = '#e0a93b';
const CLAY = '#9a5f3e';
const CELLO = '#8a5a33';
const INK = '#23302d';
const RULE = '#dbe2da';

export const ICONS = {
  ...BASE,
  // Two bricks, one on the other.
  lego: svg(`<rect x="7" y="27" width="34" height="14" rx="2" fill="${LAKE}"/>
    <rect x="11" y="23" width="7" height="5" rx="1.5" fill="${LAKE}"/><rect x="30" y="23" width="7" height="5" rx="1.5" fill="${LAKE}"/>
    <rect x="14" y="13" width="22" height="12" rx="2" fill="${SUN}"/>
    <rect x="17" y="9" width="6" height="5" rx="1.5" fill="${SUN}"/><rect x="27" y="9" width="6" height="5" rx="1.5" fill="${SUN}"/>`),
  // One jigsaw piece.
  puzzles: svg(`<path d="M9 13h9c-2-6 10-6 8 0h9v9c6-2 6 10 0 8v9h-9c2 6-10 6-8 0H9v-9c-6 2-6-10 0-8z" fill="${SAGE}"/>
    <path d="M9 13h9c-2-6 10-6 8 0h9v9" stroke="${FOREST}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`),
  // ——— Direction E's get-ready steps ———
  kit: svg(`<path d="M17 7l-11 6 4 9 5-2v21h18V20l5 2 4-9-11-6c-1 4-4 6-7 6s-6-2-7-6z" fill="${FOREST}"/>
    <path d="M18 7c1 3.4 3.4 5.4 6 5.4S29 10.4 30 7" stroke="${SAGE}" stroke-width="2" fill="none"/>`),
  bag: svg(`<path d="M17 17v-4a7 7 0 0 1 14 0v4" stroke="${INK}" stroke-width="2.6" fill="none"/>
    <rect x="6" y="17" width="36" height="22" rx="7" fill="${LAKE}"/><path d="M6 27h36" stroke="${LAKE_SOFT}" stroke-width="2.4"/>
    <rect x="21" y="24" width="6" height="6" rx="1.5" fill="${LAKE_SOFT}"/>`),
  case: svg(`<path d="M24 4c-6 0-9 4-9 9 0 3 2 5 1 8-1 4-5 6-5 13 0 7 6 11 13 11s13-4 13-11c0-7-4-9-5-13-1-3 1-5 1-8 0-5-3-9-9-9z" fill="${INK}"/>
    <path d="M24 8c-4 0-6 3-6 6 0 2.6 1.6 4.4.8 7-1 3.4-4.3 5-4.3 11.4 0 5 4 8 9.5 8s9.5-3 9.5-8c0-6.4-3.3-8-4.3-11.4-.8-2.6.8-4.4.8-7 0-3-2-6-6-6z" fill="${CELLO}"/>
    <path d="M24 10v26" stroke="${INK}" stroke-width="1.6"/>`),
  lid: svg(`<path d="M6 22L13 8h22l7 14z" fill="${INK}"/><rect x="4" y="22" width="40" height="17" rx="3" fill="${INK}"/>
    <rect x="7" y="26" width="34" height="10" rx="1.5" fill="white"/>
    <path d="M12.6 26v10M18.3 26v10M24 26v10M29.7 26v10M35.4 26v10" stroke="${MIST}" stroke-width="1.2"/>
    <path d="M12.6 26v6M18.3 26v6M29.7 26v6M35.4 26v6" stroke="${INK}" stroke-width="2.6"/>`),
  paper: svg(`<rect x="10" y="5" width="28" height="38" rx="2.5" fill="white" stroke="${MIST}" stroke-width="2.4"/>
    <rect x="6" y="9" width="28" height="36" rx="2.5" fill="white" stroke="${LAKE}" stroke-width="2.4"/>`),
  pencils: svg(`<g transform="rotate(-18 24 24)"><rect x="12" y="6" width="7" height="28" rx="1" fill="${SUN}"/><path d="M12 34h7l-3.5 8z" fill="${RULE}"/></g>
    <rect x="21" y="6" width="7" height="28" rx="1" fill="${LAKE}"/><path d="M21 34h7l-3.5 8z" fill="${RULE}"/>
    <g transform="rotate(18 24 24)"><rect x="30" y="6" width="7" height="28" rx="1" fill="${CLAY}"/><path d="M30 34h7l-3.5 8z" fill="${RULE}"/></g>`),
  lamp: svg(`<path d="M14 6h20l6 16H8z" fill="${SUN}"/><path d="M24 22v16" stroke="${INK}" stroke-width="3"/>
    <path d="M14 42h20" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  box: svg(`<path d="M6 16l18-8 18 8v20l-18 8-18-8z" fill="${CLAY}"/><path d="M6 16l18 8 18-8M24 24v20" stroke="${SUN}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`),
  space: svg(`<path d="M4 24h40" stroke="${CELLO}" stroke-width="4.5" stroke-linecap="round"/><path d="M9 24v18M39 24v18" stroke="${CELLO}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M12 14l4 4M36 14l-4 4M24 8v6" stroke="${SAGE}" stroke-width="2.6" stroke-linecap="round"/>`),
};

/** The icon for each activity a reader can pick. */
export const ACTIVITY_ICON = {
  soccer: 'soccer', gymnastics: 'gymnastics', swimming: 'swimming', basketball: 'basketball',
  cello: 'cello', piano: 'piano', guitar: 'guitar', drawing: 'drawing',
  reading: 'book', lego: 'lego', chess: 'chess', puzzles: 'puzzles',
};

/** Maya: the Garden figure from Lesson 1, the same everywhere, with her soccer ball. */
export const maya = () => person({ ball: true });
