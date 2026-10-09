// Flat illustrative icons. Decorative: callers pair each with visible text.
const svg = (body, viewBox = '0 0 48 48') => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

const FOREST = '#285442';
const INK = '#23302d';
const SAGE = '#8daa91';
const LAKE = '#5f8fa3';
const CLAY = '#9a5f3e';
const SUN = '#e0a93b';
const WOOD = '#8a5a33';


// Flat soccer ball: white disc, a dark centre pentagon, five partial dark
// patches cut by the rim, thin seams between. Built from one geometry so every
// size reads as the same ball. `detail` adds the hexagon seams (large sizes only).
let ballId = 0;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const poly = points => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}z`;
export function soccerBall(cx, cy, r, { ink = INK, detail = r >= 8 } = {}) {
  const id = `ball-clip-${++ballId}`;
  const rim = Math.max(1.4, r * 0.11);
  const seam = Math.max(0.9, r * 0.075);
  const hub = Array.from({ length: 5 }, (_, i) => pt(cx, cy, r * 0.3, -90 + 72 * i));
  const patches = []; const joins = []; const seams = [];
  for (let i = 0; i < 5; i++) {
    const angle = -90 + 72 * i;
    const centre = pt(cx, cy, r * 1.08, angle);
    const patch = Array.from({ length: 5 }, (_, k) => pt(centre[0], centre[1], r * 0.4, angle + 180 + 72 * k));
    patches.push(patch);
    seams.push(`M${hub[i][0].toFixed(2)} ${hub[i][1].toFixed(2)}L${patch[0][0].toFixed(2)} ${patch[0][1].toFixed(2)}`);
    joins.push([patch[1], patch[4]]);
  }
  if (detail) for (let i = 0; i < 5; i++) seams.push(`M${joins[i][0][0].toFixed(2)} ${joins[i][0][1].toFixed(2)}L${joins[(i + 1) % 5][1][0].toFixed(2)} ${joins[(i + 1) % 5][1][1].toFixed(2)}`);
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
    <g clip-path="url(#${id})"><path d="${patches.map(poly).join('')}" fill="${ink}"/>
    <path d="${seams.join('')}" stroke="${ink}" stroke-width="${seam.toFixed(2)}" fill="none"/></g>
    <path d="${poly(hub)}" fill="${ink}" stroke="${ink}" stroke-width="${seam.toFixed(2)}" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${(r - rim / 2).toFixed(2)}" fill="none" stroke="${ink}" stroke-width="${rim.toFixed(2)}"/>`;
}

export const ICONS = {
  soccer: svg(soccerBall(24, 24, 18)),
  ball: svg(`${soccerBall(21, 29, 13)}
    <path d="M36 8v30" stroke="${SAGE}" stroke-width="3" stroke-linecap="round"/><path d="M34 12h6M34 20h6M34 28h6" stroke="${SAGE}" stroke-width="2" stroke-linecap="round"/>`),
  cello: svg(`<path d="M24 5v12" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 16c-5 0-8 3-7 7 .6 2.2-2.4 3-2.4 7.5C14.6 38 19 43 24 43s9.4-5 9.4-12.5c0-4.5-3-5.3-2.4-7.5 1-4-2-7-7-7z" fill="${WOOD}"/>
    <path d="M22 18v21M26 18v21" stroke="#f0dcc4" stroke-width="1.2"/><path d="M20 38h8" stroke="#3a2412" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 34L40 22" stroke="#3a2412" stroke-width="1.8" stroke-linecap="round"/>`),
  screen: svg(`<rect x="7" y="11" width="34" height="23" rx="4" fill="${LAKE}"/><rect x="10.5" y="14.5" width="27" height="16" rx="2" fill="#d6e6ea"/>
    <path d="M22 19v7l6-3.5z" fill="${LAKE}"/><path d="M18 40h12M24 34v6" stroke="${LAKE}" stroke-width="3" stroke-linecap="round"/>`),
  rest: svg(`<path d="M30 8a16 16 0 1 0 10 25A13 13 0 0 1 30 8z" fill="${LAKE}"/><path d="M34 12h6l-6 7h6" stroke="${SUN}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  friends: svg(`<circle cx="17" cy="15" r="6" fill="${SUN}"/><circle cx="32" cy="17" r="5.5" fill="${SAGE}"/>
    <path d="M7 40c0-9 4.5-15 10-15s10 6 10 15z" fill="${SUN}"/><path d="M23 40c0-8 4-13.5 9-13.5S41 32 41 40z" fill="${SAGE}"/>`),
  fort: svg(`<path d="M24 8L6 40h36z" fill="${SUN}"/><path d="M24 8l-6 32h12z" fill="#f7ead0"/><path d="M4 40h40" stroke="${FOREST}" stroke-width="3" stroke-linecap="round"/>`),
  book: svg(`<path d="M6 12c7-2 13-1 18 3v25c-5-4-11-5-18-3z" fill="${LAKE}"/><path d="M42 12c-7-2-13-1-18 3v25c5-4 11-5 18-3z" fill="${SAGE}"/>
    <path d="M11 20c3-.6 6-.3 8.5 1M11 26c3-.6 6-.3 8.5 1M29 21c2.5-1.3 5.5-1.6 8.5-1M29 27c2.5-1.3 5.5-1.6 8.5-1" stroke="white" stroke-width="2" stroke-linecap="round"/>`),
  basketball: svg(`<circle cx="24" cy="24" r="17" fill="#c7772f"/><path d="M7 24h34M24 7v34M12 12c6 6 6 18 0 24M36 12c-6 6-6 18 0 24" stroke="#5a2f0b" stroke-width="2" fill="none"/>`),
  guitar: svg(`<path d="M31 17l9-9" stroke="#3a2412" stroke-width="3.5" stroke-linecap="round"/><path d="M38 6l4 4" stroke="#3a2412" stroke-width="3" stroke-linecap="round"/>
    <path d="M27 17c-3-3-8-2-9 2-.6 2-2.8 2.4-5 3-6 1.6-8 9-3 14s12.4 3 14-3c.6-2.2 1-4.4 3-5 4-1 5-6 2-9z" fill="#b0703a"/>
    <circle cx="20" cy="28" r="3.2" fill="#3a2412"/><path d="M14 34l17-17" stroke="#f0dcc4" stroke-width="1.2"/>`),
  water: svg(`<path d="M12 3c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12z" fill="${LAKE}"/>`, '0 0 24 24'),
  map: svg(`<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="${SAGE}"/><path d="M9 4v14M15 6v14" stroke="white" stroke-width="1.5"/><path d="M5 12c2-2 4 0 6-1s3-3 5-2" stroke="${FOREST}" stroke-width="1.6" fill="none" stroke-dasharray="1.5 2"/>`, '0 0 24 24'),
  eye: svg(`<path d="M3 16l5-8 4 5 3-3 6 6z" fill="${SAGE}"/><circle cx="17" cy="7" r="2.5" fill="${SUN}"/>`, '0 0 24 24'),
  restSmall: svg(`<path d="M4 17h16M6 17c0-4 2.5-7 6-7s6 3 6 7" stroke="${FOREST}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 5v2M5.5 8l1.3 1.3M18.5 8l-1.3 1.3" stroke="${SUN}" stroke-width="2" stroke-linecap="round"/>`, '0 0 24 24'),
  backpack: svg(`<rect x="5" y="7" width="14" height="15" rx="4" fill="${FOREST}"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="${FOREST}" stroke-width="2" fill="none"/><rect x="8" y="13" width="8" height="5" rx="1.5" fill="${SAGE}"/>`, '0 0 24 24'),
  leaf: svg(`<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" fill="${FOREST}"/><path d="M5 19l9-9" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`, '0 0 24 24'),
  soccerSmall: svg(soccerBall(12, 12, 10.5, { detail: false }), '0 0 24 24'),
  celloSmall: svg(`<path d="M12 2v6" stroke="${WOOD}" stroke-width="2" stroke-linecap="round"/><path d="M12 7.5c-2.6 0-4 1.6-3.6 3.6.3 1.1-1.3 1.6-1.3 4C7.1 19 9.4 22 12 22s4.9-3 4.9-6.9c0-2.4-1.6-2.9-1.3-4 .4-2-1-3.6-3.6-3.6z" fill="${WOOD}"/>`, '0 0 24 24'),
  add: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><rect x="11" y="26" width="6" height="8" rx="1.5" fill="${SAGE}"/><rect x="19" y="19" width="6" height="15" rx="1.5" fill="${SAGE}"/><rect x="27" y="11" width="6" height="23" rx="1.5" fill="${FOREST}"/>`, '0 0 44 44'),
  build: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><rect x="10" y="27" width="24" height="7" rx="2" fill="${FOREST}"/><rect x="14" y="19" width="16" height="7" rx="2" fill="${SAGE}"/><rect x="18" y="11" width="8" height="7" rx="2" fill="${SUN}"/>`, '0 0 44 44'),
  weather: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><circle cx="16" cy="17" r="6" fill="${SUN}"/><path d="M14 30a6 6 0 0 1 1.5-11.8A8 8 0 0 1 31 20a5 5 0 0 1 0 10z" fill="${LAKE}"/><path d="M13 33c4 3 12 3 18-1" stroke="${FOREST}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`, '0 0 44 44'),
};

export function person({ shirt = '#285442', hair = '#3a2a1f', ball = false, variant = 'a' } = {}) {
  return `<svg viewBox="0 0 56 72" aria-hidden="true" focusable="false">
    <circle cx="26" cy="16" r="10" fill="#e9c3a0"/>
    <path d="M16 15c0-7 5-11 10-11s11 3 10 11c-2-3-6-4-10-4s-8 1-10 4z" fill="${hair}"/>
    ${variant === 'a' ? `<path d="M34 10c4 1 6 5 5 9" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round"/>` : `<path d="M34 10c4 1 6 5 5 9" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`}
    <path d="M13 50c0-14 5-22 13-22s13 8 13 22z" fill="${shirt}"/>
    <path d="M20 50v16M32 50v16" stroke="#3b4a44" stroke-width="5" stroke-linecap="round"/>
    ${ball ? `<g>${soccerBall(43, 61, 10, { detail: false })}</g>` : ''}
  </svg>`;
}
