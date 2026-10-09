// Lesson 2 prototype: Lesson 1's icons plus a few new flat ones in the same
// style (token colours, no shading). Decorative: callers pair each with text.
import { ICONS as L1 } from '../../src/lessons/choices/journey-icons.js';

const svg = (body, viewBox = '0 0 48 48') => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;
const FOREST = '#285442';
const SAGE = '#8daa91';
const LAKE = '#5f8fa3';
const LAKE_SOFT = '#d6e6ea';
const SUN = '#e0a93b';
const CLAY = '#9a5f3e';
const MIST = '#c5cec8';
const INK = '#23302d';
const WOOD = '#8a5a33';

export const ICONS = {
  ...L1,
  snack: svg(`<path d="M24 15c-3-3-9-3-12 1-4 5-2 15 3 20 3 3 6 3 9 1 3 2 6 2 9-1 5-5 7-15 3-20-3-4-9-4-12-1z" fill="${CLAY}"/>
    <path d="M24 15c0-4 1-7 3-9" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 10c3-4 8-4 10-2-3 3-7 4-10 2z" fill="${SAGE}"/>`),
  dinner: svg(`<circle cx="25" cy="25" r="16" fill="white" stroke="${MIST}" stroke-width="2.5"/><circle cx="25" cy="25" r="9" fill="${SAGE}"/>
    <path d="M6 9v12M3 9v6a3 3 0 0 0 6 0V9M6 21v19" stroke="${FOREST}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`),
  bed: L1.rest,
  morning: svg(`<circle cx="24" cy="28" r="9" fill="${SUN}"/><path d="M24 9v5M10 15l3.5 3.5M38 15l-3.5 3.5M5 28h5M38 28h5" stroke="${SUN}" stroke-width="3" stroke-linecap="round"/><path d="M4 40h40" stroke="${FOREST}" stroke-width="3" stroke-linecap="round"/>`),
  clock: svg(`<circle cx="24" cy="24" r="17" fill="white" stroke="${LAKE}" stroke-width="3"/><path d="M24 13v11l7 5" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  stand: svg(`<path d="M16 6v12" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 17c-4 0-6.5 2.5-5.7 5.6.5 1.8-2 2.4-2 6C8.3 35 11.8 39 16 39s7.7-4 7.7-10.4c0-3.6-2.5-4.2-2-6 .8-3.1-1.7-5.6-5.7-5.6z" fill="${WOOD}"/>
    <path d="M16 39v4M12 43h8" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="28" y="8" width="16" height="13" rx="2" fill="white" stroke="${FOREST}" stroke-width="2"/><path d="M31 12h10M31 15h10M31 18h7" stroke="${MIST}" stroke-width="1.5"/>
    <path d="M36 21v20M31 43l5-2 5 2" stroke="${FOREST}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  music: svg(`<rect x="9" y="6" width="30" height="22" rx="3" fill="white" stroke="${FOREST}" stroke-width="2.4"/>
    <path d="M13 12h22M13 17h22M13 22h22" stroke="${MIST}" stroke-width="1.6"/><circle cx="19" cy="17" r="2.4" fill="${INK}"/><path d="M21.4 17V10" stroke="${INK}" stroke-width="1.6"/><circle cx="28" cy="22" r="2.4" fill="${INK}"/><path d="M30.4 22v-7" stroke="${INK}" stroke-width="1.6"/>
    <path d="M24 28v14M16 44l8-2 8 2" stroke="${FOREST}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  pillow: svg(`<path d="M6 26c0-5 3-8 8-8h20c5 0 8 3 8 8v6c0 4-3 7-8 7H14c-5 0-8-3-8-7z" fill="${LAKE_SOFT}"/>
    <path d="M12 22c5-1.6 9-1 12 1.6V34c-3-2.6-7-3.2-12-1.6z" fill="${LAKE}"/><path d="M36 22c-5-1.6-9-1-12 1.6V34c3-2.6 7-3.2 12-1.6z" fill="${SAGE}"/>`),
  party: svg(`<ellipse cx="22" cy="17" rx="10" ry="12" fill="${SUN}"/><path d="M20 29l2-2 2 2z" fill="${SUN}"/><path d="M22 29c-2 4 3 6 0 10s2 5 1 7" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="21" rx="7" ry="8.5" fill="${LAKE}"/><path d="M34 29.5c1 3-2 5 0 8" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
  table: svg(`<path d="M4 30h40" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/><path d="M9 30v14M39 30v14" stroke="${WOOD}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M12 26c4-1.4 8-1 11 1.4M25 27.4c3-2.4 7-2.8 11-1.4" stroke="${INK}" stroke-width="1.4" fill="none"/>
    <path d="M12 26V14c4-1.4 8-1 11 1.4V27.4c-3-2.4-7-2.8-11-1.4z" fill="${LAKE}"/><path d="M36 26V14c-4-1.4-8-1-11 1.4V27.4c3-2.4 7-2.8 11-1.4z" fill="${SAGE}"/>`),
  snap: svg(`<path d="M24 5v12" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 16c-5 0-8 3-7 7 .6 2.2-2.4 3-2.4 7.5C14.6 38 19 43 24 43s9.4-5 9.4-12.5c0-4.5-3-5.3-2.4-7.5 1-4-2-7-7-7z" fill="${WOOD}"/>
    <path d="M22 18v21" stroke="#f0dcc4" stroke-width="1.2"/><path d="M26 18v8c3 1 4 4 7 3" stroke="#f0dcc4" stroke-width="1.2" fill="none"/>
    <path d="M36 9l3-3M40 14h4M36 18l3 3" stroke="${CLAY}" stroke-width="2.4" stroke-linecap="round"/>`),
};

/** A routine's icon: cello or the book. */
export const routineIcon = routine => (routine === 'cello' ? ICONS.cello : ICONS.book);
