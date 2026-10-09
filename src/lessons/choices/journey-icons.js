// Flat illustrative icons. Decorative: callers pair each with visible text.
const svg = (body, viewBox = '0 0 48 48') => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

const FOREST = '#285442';
const INK = '#23302d';
const SAGE = '#8daa91';
const LAKE = '#5f8fa3';
const CLAY = '#9a5f3e';
const SUN = '#e0a93b';
const WOOD = '#8a5a33';


// Flat soccer ball, as in the picked concept: a white body with one thin ink outline, a solid ink centre
// pentagon and five ink patches cut by the rim (a corner pointing at the centre), white gaps between and no
// seam lines. A thin stroke in the same ink softens the corners. One geometry, so every size is the same ball.
// `detail: false` keeps only the outline and a larger centre pentagon, for a ball too small for patches.
// At today's sizes (10–36 px across) the patches still read, so no drawing uses it.
let ballId = 0;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const poly = points => `M${points.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join('L')}z`;
export function soccerBall(cx, cy, r, { ink = INK, detail = true } = {}) {
  const n = v => +v.toFixed(2);
  const line = 0.9 + r * 0.03; // about a pixel wide at every drawn size
  const hub = poly(Array.from({ length: 5 }, (_, i) => pt(cx, cy, r * (detail ? 0.34 : 0.42), -90 + 72 * i)));
  const shape = `fill="${ink}" stroke="${ink}" stroke-width="${n(r * 0.06)}" stroke-linejoin="round"`;
  const body = `<circle cx="${cx}" cy="${cy}" r="${n(r - line / 2)}" fill="white" stroke="${ink}" stroke-width="${n(line)}"/>`;
  if (!detail) return `${body}<path d="${hub}" ${shape}/>`;
  const patches = Array.from({ length: 5 }, (_, i) => {
    const angle = -90 + 72 * i; const [px, py] = pt(cx, cy, r * 1.15, angle);
    return poly(Array.from({ length: 5 }, (_, k) => pt(px, py, r * 0.45, angle + 180 + 72 * k)));
  }).join('');
  const id = `ball-clip-${++ballId}`;
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${n(r - line / 2)}"/></clipPath>
    ${body}<path d="${patches}${hub}" ${shape} clip-path="url(#${id})"/>`;
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
  soccerSmall: svg(soccerBall(12, 12, 10.5), '0 0 24 24'),
  celloSmall: svg(`<path d="M12 2v6" stroke="${WOOD}" stroke-width="2" stroke-linecap="round"/><path d="M12 7.5c-2.6 0-4 1.6-3.6 3.6.3 1.1-1.3 1.6-1.3 4C7.1 19 9.4 22 12 22s4.9-3 4.9-6.9c0-2.4-1.6-2.9-1.3-4 .4-2-1-3.6-3.6-3.6z" fill="${WOOD}"/>`, '0 0 24 24'),
  add: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><rect x="11" y="26" width="6" height="8" rx="1.5" fill="${SAGE}"/><rect x="19" y="19" width="6" height="15" rx="1.5" fill="${SAGE}"/><rect x="27" y="11" width="6" height="23" rx="1.5" fill="${FOREST}"/>`, '0 0 44 44'),
  build: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><rect x="10" y="27" width="24" height="7" rx="2" fill="${FOREST}"/><rect x="14" y="19" width="16" height="7" rx="2" fill="${SAGE}"/><rect x="18" y="11" width="8" height="7" rx="2" fill="${SUN}"/>`, '0 0 44 44'),
  weather: svg(`<circle cx="22" cy="22" r="21" fill="#28544214"/><circle cx="16" cy="17" r="6" fill="${SUN}"/><path d="M14 30a6 6 0 0 1 1.5-11.8A8 8 0 0 1 31 20a5 5 0 0 1 0 10z" fill="${LAKE}"/><path d="M13 33c4 3 12 3 18-1" stroke="${FOREST}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`, '0 0 44 44'),
};

// Maya, kicking her soccer ball: a big round head (about 38.5% of her height), two ink dots for eyes, one
// hair shape with a fringe and a swinging ponytail, a T-shirt in the lane's colour, round-capped limbs and
// two rounded shoes. Flat fills only. Same shapes in every lane; only `shirt` changes. `variant` is kept for
// callers and draws the same girl. Without the ball the viewBox drops the ball's side.
const SKIN = '#ab7648';
const capsule = ([x1, y1], [x2, y2], r) => {
  const len = Math.hypot(x2 - x1, y2 - y1); const nx = (y1 - y2) / len * r; const ny = (x2 - x1) / len * r;
  const f = v => v.toFixed(1);
  return `M${f(x1 + nx)} ${f(y1 + ny)}L${f(x2 + nx)} ${f(y2 + ny)}A${r} ${r} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)}L${f(x1 - nx)} ${f(y1 - ny)}A${r} ${r} 0 0 0 ${f(x1 + nx)} ${f(y1 + ny)}z`;
};
const dot = (cx, cy, r) => `M${+(cx - r).toFixed(2)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0z`;
const MAYA = {
  limbs: 'M26.6 22.5V25M15.4 26.9C11.2 27.5 7 29.8 5.6 34.3M31.4 30.6C35 33.4 39.6 35.8 43.6 32.2M18 40.5Q16.8 47.2 9.8 48M25.9 40.5Q32 47 34.2 56',
  shirt: 'M15.2 24.1Q17 23.2 21 22.9H24L26.3 25.8 28.5 23.4Q29.6 23.6 30.4 24.6L33.8 28.6 33.6 31.2 30.2 32.6 29.9 39.9Q29.8 41.6 28 42Q22.3 42.9 16.8 41.9Q14.6 41.4 14.5 39.5L16.6 31.2 14.6 28.6 14.2 25.6Q14.3 24.5 15.2 24.1z',
  hair: 'M16 14.4Q25.5 13.8 30.4 5.2Q34.5 8.6 38.4 9.3A11.5 11.5 0 0 0 19.3 4.2C18.3 2.2 16.3 .7 13.8 .7C10.2 .7 9.4 3.8 8.2 6.8C7 9.8 4 12 .9 11.8C3 14.6 5.3 17.4 8.4 17.4C11.8 17.4 14.7 12.3 16.1 7.1L17 7.4A11.5 11.5 0 0 0 16 14.4z',
  ink: dot(28.1, 14.2, 1.35) + dot(34.3, 14.2, 1.35) + capsule([7.15, 47.5], [5.8, 50.1], 2.2) + capsule([34.2, 58.8], [37.8, 57.3], 2.2),
};
export function person({ shirt = '#285442', hair = '#3a2a1f', ball = false, variant = 'a' } = {}) {
  return `<svg viewBox="0 0 ${ball ? 60 : 47} 64" aria-hidden="true" focusable="false">
    <path d="M12.7 60.8a12.9 2.5 0 1 0 25.8 0a12.9 2.5 0 1 0-25.8 0${ball ? 'M44 60.8a6 1.4 0 1 0 12 0a6 1.4 0 1 0-12 0' : ''}" fill="#dbe2da"/>
    <path d="${MAYA.limbs}" stroke="${SKIN}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="${MAYA.shirt}" fill="${shirt}"/><circle cx="27.35" cy="12.4" r="11.5" fill="${SKIN}"/>
    <path d="${MAYA.hair}" fill="${hair}"/><path d="${MAYA.ink}" fill="#23302d"/>
    ${ball ? soccerBall(50.8, 51.3, 7.3) : ''}
  </svg>`;
}
