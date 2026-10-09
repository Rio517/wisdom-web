// Direction D's icons: the prototype's set plus the new activities, flat, in
// the token colours and the 48-unit style of Lesson 1's journey-icons.js.
// Decorative: callers pair each with text.
import { ICONS as BASE } from './icons.js';

const svg = body => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${body}</svg>`;
const FOREST = '#285442';
const LAKE = '#5f8fa3';
const LAKE_SOFT = '#d6e6ea';
const SUN = '#e0a93b';
const CLAY = '#9a5f3e';
const MIST = '#c5cec8';
const INK = '#23302d';
const DARK_WOOD = '#3a2412';

export const ICONS = {
  ...BASE,
  // Mid-cartwheel: hands on the ground, legs up in a V.
  gymnastics: svg(`<path d="M6 43h36" stroke="${MIST}" stroke-width="3" stroke-linecap="round"/>
    <g transform="rotate(-22 24 25)"><path d="M24 29V15M24 28l-7 13M24 28l7 13M24 15l-10-10M24 15l10-10" stroke="${FOREST}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="24" cy="33.5" r="4.6" fill="${SUN}"/></g>`),
  // A swimmer's head and one arm over the water.
  swimming: svg(`<circle cx="15" cy="25" r="5.6" fill="${SUN}"/>
    <path d="M20 25c2-10 13-13 19-6" stroke="${FOREST}" stroke-width="4.2" stroke-linecap="round" fill="none"/>
    <path d="M3 29c4-3.5 8-3.5 12 0s8 3.5 12 0 8-3.5 12 0 6 2 6 2v13H3z" fill="${LAKE_SOFT}"/>
    <path d="M3 29c4-3.5 8-3.5 12 0s8 3.5 12 0 8-3.5 12 0" stroke="${LAKE}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M9 38c4-3 8-3 12 0s8 3 12 0" stroke="${LAKE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`),
  // Keys.
  piano: svg(`<rect x="4" y="12" width="40" height="25" rx="4" fill="${DARK_WOOD}"/><rect x="7" y="19" width="34" height="15" rx="1.5" fill="white"/>
    <path d="M11.9 19v15M16.7 19v15M21.6 19v15M26.4 19v15M31.3 19v15M36.1 19v15" stroke="${MIST}" stroke-width="1.2"/>
    <path d="M11.9 19v9M16.7 19v9M26.4 19v9M31.3 19v9M36.1 19v9" stroke="${INK}" stroke-width="3"/>`),
  // A pencil on a sheet.
  drawing: svg(`<rect x="6" y="6" width="27" height="35" rx="2.5" fill="white" stroke="${MIST}" stroke-width="2"/>
    <path d="M11 31c3-7 6-8 8-4s5 3 8-5" stroke="${LAKE}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="rotate(40 33 24)"><rect x="29" y="4" width="8" height="25" rx="1" fill="${SUN}"/><rect x="29" y="4" width="8" height="5" rx="1" fill="${CLAY}"/>
    <path d="M29 29h8l-4 8z" fill="#f0dcc4"/><path d="M31.5 34h3L33 37z" fill="${INK}"/></g>`),
  // A knight.
  chess: svg(`<path d="M13 43h22a2 2 0 0 0 0-4H13a2 2 0 0 0 0 4z" fill="${INK}"/>
    <path d="M16 38c0-6 2.5-9.5 7-12.5-3.5-.4-6.6.8-8.6 3l-3.2-4.2C13 19 17 13.5 22 11.5l1.4-4.6 3.4 3.6C33 12 37 18 37 26.5V38z" fill="${INK}"/>
    <circle cx="23.5" cy="17.5" r="1.7" fill="white"/>`),
};

/** The icon for an activity (soccer, cello, …) or a fun option (by its icon name). */
export const iconFor = name => ICONS[name] ?? '';
export const ACTIVITY_ICON = {
  soccer: 'soccer', gymnastics: 'gymnastics', swimming: 'swimming',
  cello: 'cello', piano: 'piano', guitar: 'guitar',
  reading: 'book', drawing: 'drawing', chess: 'chess',
};
