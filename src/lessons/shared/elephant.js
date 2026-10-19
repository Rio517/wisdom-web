// Source: asset-factory, wisdom/elephant/src/elephant-b.js (Lesson 3 poses and riders, 2026-10-19), copied unchanged.
// Wisdom elephant, take B (grown and calm), picked on card 6637: truer proportions. A high twin-domed head
// above a sloping back, a big ear, tall pillar legs and a long trunk whose tip rests on the ground. Flat fills,
// no outlines, round-capped strokes, an ink dot eye. SVG groups in Maya's units, feet at (0, 0), facing right,
// about 64 units tall (Maya is 64). Each leg, the trunk, the ear and the tail sit in their own group with the
// pivot at the joint (translate to the joint, then rotate), so CSS can animate them: legs use Maya's
// `walk-swing a|b`, the body `walk-bob`; the trunk, ear and tail have `trunk-swing`, `ear-flap` and `tail-swing`.
//
// Near and far legs are the same mist. A thin gap in the stage colour runs down the lower part of each near leg,
// so a far leg behind it stays a separate leg in a walk. The gap is paper by default; a stage on another colour
// sets `--elephant-gap` (for example to paper-deep) on any ancestor.
//
// Lesson 3 (2026-10-19) adds poses and riders; `stand`, `walk1`, `walk2` and the default `rider()` are unchanged
// byte for byte (the Lesson 2 module is kept as elephant-b-l2.js). New side poses: `pulled` (head and trunk
// lifted, a taut rein with `reins`) and `left` (standing, facing left, mirrored). New views: `away1|2` and `toward1|2` (walking
// away from and toward the viewer, seen from a little above). Riders: `rider({ pose, look })`, pose `sit` | `explain` | `pull` | `back` | `front`,
// look unset (as Lesson 2) or `n1` | `n2` | `n3` (neutral children for Mario's pick).

const BODY = '#c5cec8'; // mist
const EAR = '#efe3d6'; // cello-soft, the ear
const INK = '#23302d'; // ink
const QUIET = '#5a6961'; // quiet: the rider's trousers
const GROUND = '#dbe2da'; // rule
const STRAP = '#8a5a33'; // cello: the head strap and reins
const SUN = '#e0a93b'; // sun: the rider's shirt
const SKIN = '#c99a74'; // the rider only, from journey-icons.js
const HAIR = '#2c2019'; // the rider only, from journey-icons.js

const joint = (x, y, cls, body, rest = 0) => `<g transform="translate(${x} ${y})${rest ? ` rotate(${rest})` : ''}"><g class="${cls}">${body}</g></g>`;
const limb = (d, color, width) => `<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const dot = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

const POSES = {
  stand: { a: 0, b: 0, trunk: 0, ear: 0, tail: 0, bob: 0 },
  walk1: { a: -13, b: 11, trunk: -3, ear: -3, tail: 8, bob: .6 },
  walk2: { a: 11, b: -13, trunk: 3, ear: 2, tail: -5, bob: .6 },
};

const LEG = limb('M0 0V24.5', BODY, 11);
// The gap: a stage-coloured band 0.9 wide each side of a near leg, from below the belly to above the foot.
// It is drawn under the body, so the belly hides its top end.
const GAP = '<path d="M0 8V17.5" style="stroke:var(--elephant-gap,#fbfbf8)" fill="none" stroke-width="12.8" stroke-linecap="round"/>';
// Body and head as one silhouette: a round rump, the sloping back, a dip at the neck, the twin dome, the brow,
// the cheek and jaw, then one soft underline from the chest along the belly and round into the rump.
const SHAPE = 'M-41-36C-41.5-45-35-51.5-24-54.5-14-57-5-57.5 3-56 5-60 9-64 14-64.2 16-64.2 17.5-63.4 19-63.4 25-63 29.5-58.5 30.5-51 31-46 30-41 27-38 24-36 20-35.5 15-34 11-33 9-30 7-27.5 2-24.5-10-23.5-20-24-30-24.5-37-26-40-30-41-32-41-34-41-36z';
// A short tail that tapers as it hangs close to the rump and ends in a small soft tuft, all mist: no dark tip.
const TAIL = `<path d="M-1.2 0Q-3.7 6-3 11.2-4 13.6-3.1 15.4-2.4 14.6-2 15.6-1.3 14.4-.8 11.2Q-1.6 6 1.2 0z" fill="${BODY}"/>`;

/** The elephant alone. `rider` is markup placed on the neck, inside the bobbing body, behind the ear; `reins`
 *  adds the head strap and a slack rein from the rider's hand (used by elephantWithRider). */
export function elephant({ pose = 'stand', rider = '', reins = false } = {}) {
  if (L3[pose]) return L3[pose]({ rider, reins });
  const p = POSES[pose] || POSES.stand;
  return `<g class="elephant elephant-b"><path d="M-46 0a38 3 0 1 0 76 0a38 3 0 1 0-76 0z" fill="${GROUND}"/>
<g class="walk-bob"${p.bob ? ` transform="translate(0 ${p.bob})"` : ''}>
${joint(-20.5, -30, 'walk-swing a', LEG, p.a)}${joint(-.5, -30, 'walk-swing b', LEG, p.b)}
${joint(-27, -30, 'walk-swing b', GAP, p.b)}${joint(6, -30, 'walk-swing a', GAP, p.a)}
${joint(-40, -42, 'tail-swing', TAIL, p.tail)}
<path d="${SHAPE}" fill="${BODY}"/>
${joint(-27, -30, 'walk-swing b', LEG, p.b)}${joint(6, -30, 'walk-swing a', LEG, p.a)}
${joint(27, -42, 'trunk-swing', limb('M0 0C5 10 4.5 24 4.5 33C4.5 38 7 40 12 39', BODY, 6.5), p.trunk)}
${reins ? limb('M16-63.4C16.6-56 17.4-45 20-36.8', STRAP, 1.3) : ''}
${rider ? `<g transform="translate(0 -56.5)">${rider}</g>` : ''}
${joint(10, -56, 'ear-flap', `<path d="M0 0C-6-3-15-1-17 7-19 15-15 24-8 27-5 28.5-2 27-1 24 0 18 2 8 0 0z" fill="${EAR}"/>`, p.ear)}
<path d="${dot(22, -50.5, 1.5)}" fill="${INK}"/>
${reins && rider ? `<g class="reins">${limb('M8.6-62.6C8.4-53 12.6-46.4 17.8-47.4', STRAP, .9)}</g>` : ''}</g></g>`;
}

// ——— Lesson 3 ———

const EAR_D = 'M0 0C-6-3-15-1-17 7-19 15-15 24-8 27-5 28.5-2 27-1 24 0 18 2 8 0 0z';
const TRUNK_D = 'M0 0C5 10 4.5 24 4.5 33C4.5 38 7 40 12 39';
const r1 = v => +v.toFixed(1);
/** (x, y) turned by deg about (cx, cy), as SVG's rotate does. */
const turn = (x, y, cx, cy, deg) => {
  const t = deg * Math.PI / 180, dx = x - cx, dy = y - cy;
  return [r1(cx + dx * Math.cos(t) - dy * Math.sin(t)), r1(cy + dx * Math.sin(t) + dy * Math.cos(t))];
};
/** A leg (or its gap) that lifts rather than swings, for the front and back views: `walk-lift a|b`. */
const lift = (x, y, cls, up, part = LEG) => `<g transform="translate(${x} ${r1(y - up)})"><g class="walk-lift ${cls}">${part}</g></g>`;

// Side view with the head as its own group (`head-turn`, pivot at the neck), for `pulled` and `left`. The body
// keeps the Lesson 2 outline with the head cut off at the neck; the head is the same dome, brow and jaw.
const NECK = [8, -44];
const NOHEAD = 'M-41-36C-41.5-45-35-51.5-24-54.5-14-57-5-57.5 3-56C9-55 15-48 16.5-42 18-36 12-31 7-27.5 2-24.5-10-23.5-20-24-30-24.5-37-26-40-30-41-32-41-34-41-36z';
const HEAD = 'M3-56C5-60 9-64 14-64.2 16-64.2 17.5-63.4 19-63.4 25-63 29.5-58.5 30.5-51 31-46 30-41 27-38 24-36 20-35.5 15-34L4-40z';
const SIDE = {
  pulled: { nf: -5, ff: -2, nh: 2, fh: 0, head: -9, trunk: -5, ear: 5, tail: 4 },
  left: { nf: 0, ff: 0, nh: -3, fh: 2, head: 5, trunk: 7, ear: -2, tail: 14 },
};
// The rider leans back 8 degrees to pull; the rein runs from the hand to the strap, both turned with their parts.
const PULL_LEAN = -8;
const PULL_HAND = [7.4, -8];
function side(pose, { rider, reins }) {
  const p = SIDE[pose];
  const [hx, hy] = turn(...PULL_HAND, 0, 0, PULL_LEAN);
  const [sx, sy] = turn(17.6, -48.4, ...NECK, p.head);
  const head = `<g transform="translate(-8 44)"><path d="${HEAD}" fill="${BODY}"/>
${joint(27, -42, 'trunk-swing', limb(TRUNK_D, BODY, 6.5), p.trunk)}
${reins ? limb('M16-63.4C16.6-56 17.4-45 20-36.8', STRAP, 1.3) : ''}<path d="${dot(22, -50.5, 1.5)}" fill="${INK}"/></g>`;
  const art = `<g class="elephant elephant-b"><path d="M-46 0a38 3 0 1 0 76 0a38 3 0 1 0-76 0z" fill="${GROUND}"/>
<g class="walk-bob">
${joint(-20.5, -30, 'walk-swing a', LEG, p.fh)}${joint(-.5, -30, 'walk-swing b', LEG, p.ff)}
${joint(-27, -30, 'walk-swing b', GAP, p.nh)}${joint(6, -30, 'walk-swing a', GAP, p.nf)}
${joint(-40, -42, 'tail-swing', TAIL, p.tail)}
<path d="${NOHEAD}" fill="${BODY}"/>
${joint(-27, -30, 'walk-swing b', LEG, p.nh)}${joint(6, -30, 'walk-swing a', LEG, p.nf)}
${joint(...NECK, 'head-turn', head, p.head)}
${rider ? `<g transform="translate(0 -56.5)">${rider}</g>` : ''}
${joint(10, -56, 'ear-flap', `<path d="${EAR_D}" fill="${EAR}"/>`, p.ear)}
${reins && rider ? `<g class="reins">${limb(`M${hx} ${r1(hy - 56.5)}L${sx} ${sy}`, STRAP, .9)}</g>` : ''}</g></g>`;
  return pose === 'left' ? `<g transform="scale(-1 1)">${art}</g>` : art;
}

// Front and back views, seen from a little above, so far feet stand higher. Legs lift (`walk-lift a|b`) instead
// of swinging; `a` is the viewer's left front and right hind, `b` the other pair.
const FB = {
  away1: { a: 2.6, b: 0, tilt: -1.5, tail: 7 }, away2: { a: 0, b: 2.6, tilt: 1.5, tail: -7 },
  toward1: { a: 2.6, b: 0, tilt: 1.5, trunk: 1 }, toward2: { a: 0, b: 2.6, tilt: -1.5, trunk: -1 },
};
const FB_GROUND = `<path d="M-28-2a28 4.5 0 1 0 56 0a28 4.5 0 1 0-56 0z" fill="${GROUND}"/>`;
// A trunk seen from the front: wide at the root, narrowing down, the tip curled to one side.
const T_TRUNK = 'M-4.5 0C-4.5 12-3.5 22-3 31-2.8 35-1 38.5 3 38.8 6 39 8 37.5 8 35.5 8 33.8 6.6 33.2 5.4 33.8 4 34.4 3 34 2.6 31 2.4 22 4 12 4.5 0z';
// Its gap: a stage-coloured edge drawn under the head, so the trunk stays apart from the legs behind it.
const T_GAP = `<path d="${T_TRUNK}" style="stroke:var(--elephant-gap,#fbfbf8)" stroke-width="3" fill="none"/>`;
// Shortened to 0.85, so the curled tip hangs just clear of the ground shadow and its gap never shows on it.
const trunk = (y, flip, part) => joint(0, y, 'trunk-swing', `<g transform="scale(${flip} .85)">${part}</g>`);
const FB_EAR = 'M0 0C-8-2-18 2-19.5 10-21 18-17 24-11.5 25-7 26-3 23-1.5 18z';
const ears = y => `${joint(-12, y, 'ear-flap', `<path d="${FB_EAR}" fill="${EAR}"/>`)}${joint(12, y, 'ear-flap', `<g transform="scale(-1 1)"><path d="${FB_EAR}" fill="${EAR}"/></g>`)}`;

// From behind: the far front legs between the hind legs, the head's twin dome beyond the back, the ears out
// to the sides, the rider's back above the shoulders, the round rump and the tail.
// A long thin tail down the middle of the rump, edged in the stage colour like the leg gaps so it shows on the
// mist; its tuft hangs below the rump between the hind legs.
const A_TAIL = `<path d="M-1 0Q-2 12-1.4 18-2.6 20.4-1.8 22.6-1.2 21.8-.6 22.8 0 21.6.2 18Q.8 12 1 0z" style="stroke:var(--elephant-gap,#fbfbf8)" stroke-width="1.1" fill="${BODY}"/>`;
const A_BODY = 'M-22-38C-22.5-47-18-54-11-57.5-6-60-2-61.5 0-62 2-61.5 6-60 11-57.5 18-54 22.5-47 22-38 21.5-30 17-25.5 11-25C6-25 3-29.5 0-29.5-3-29.5-6-25-11-25-17-25.5-21.5-30-22-38z';
function away(pose, { rider }) {
  const p = FB[pose];
  return `<g class="elephant elephant-b">${FB_GROUND}
<g class="walk-bob" transform="rotate(${p.tilt} 0 -30)">
${lift(-8.5, -35, 'b', p.b)}${lift(8.5, -35, 'a', p.a)}
<path d="M-12.5-56C-12.5-63.5-7-67-3-67-1.5-67-.5-66.4 0-65.8 .5-66.4 1.5-67 3-67 7-67 12.5-63.5 12.5-56z" fill="${BODY}"/>
${ears(-61)}
${rider ? `<g transform="translate(0 -58)">${rider}</g>` : ''}
${lift(-13, -30, 'a', p.a, GAP)}${lift(13, -30, 'b', p.b, GAP)}
<path d="${A_BODY}" fill="${BODY}"/>
${lift(-13, -30, 'a', p.a)}${lift(13, -30, 'b', p.b)}
${joint(0, -46, 'tail-swing', A_TAIL, p.tail / 2)}</g></g>`;
}

// From the front: the hind legs outside the front ones, the back beyond the head with the rider on it, the
// ears spread, the twin dome, two eyes and the trunk hanging between the front legs, its tip curling aside.
const T_HEAD = 'M-14.5-45C-15-55-11-62.5-5-63-2.5-63.2-1-62.4 0-61.6 1-62.4 2.5-63.2 5-63 11-62.5 15-55 14.5-45 14-38.5 9.5-34.5 5-33.5 3-33-3-33-5-33.5-9.5-34.5-14-38.5-14.5-45z';
function toward(pose, { rider }) {
  const p = FB[pose];
  return `<g class="elephant elephant-b">${FB_GROUND}
<g class="walk-bob" transform="rotate(${p.tilt} 0 -30)">
${lift(-20, -35, 'b', p.b)}${lift(20, -35, 'a', p.a)}
<path d="M-21-46C-21-58-12-66.5 0-66.5 12-66.5 21-58 21-46 21-38 12-34 0-34-12-34-21-38-21-46z" fill="${BODY}"/>
${rider ? `<g transform="translate(0 -61)">${rider}</g>` : ''}
${ears(-58)}
${lift(-13, -30, 'a', p.a, GAP)}${lift(13, -30, 'b', p.b, GAP)}
${lift(-13, -30, 'a', p.a)}${lift(13, -30, 'b', p.b)}
${trunk(-40, p.trunk, T_GAP)}
<path d="${T_HEAD}" fill="${BODY}"/>
${trunk(-40, p.trunk, `<path d="${T_TRUNK}" fill="${BODY}"/>`)}
<path d="${dot(-7, -48.5, 1.5)}${dot(7, -48.5, 1.5)}" fill="${INK}"/></g></g>`;
}

const L3 = { pulled: o => side('pulled', o), left: o => side('left', o) };
for (const k of ['away1', 'away2']) L3[k] = o => away(k, o);
for (const k of ['toward1', 'toward2']) L3[k] = o => toward(k, o);
/** Which rider view each pose carries. */
const VIEW = { away1: 'back', away2: 'back', toward1: 'front', toward2: 'front' };

// ——— Riders ———
// A look is skin, hair and shirt, and a hair shape per view (side faces right; back; front). Unset is the
// Lesson 2 rider (Alfredo's skin, hair and sun shirt). n1 to n3 are neutral children: other hair shapes and
// shirt tokens, skin and hair tones from journey-icons.js. None is meant as anyone.
const LOOKS = {
  base: {
    skin: SKIN, hair: HAIR, shirt: SUN,
    side: 'M6.4-18.4C6.2-21.8 3.8-23.4 .8-23.2-2.8-23-5.4-20.6-5.4-17-5.4-15-4.8-13.6-3.6-12.6L-2.4-13C-2.8-14.8-2.4-16.6-1.2-17.6.8-18 3-18.6 4.6-19.8 5.2-19 5.8-18.6 6.4-18.4Z',
    back: 'M-5.6-17C-5.6-20.6-2.8-23.2.6-23.2 4-23.2 6.8-20.6 6.8-17 6.8-15 6.2-13.6 5.2-12.6 3.6-13.4 2-13.6.6-13.6-.8-13.6-2.4-13.4-4-12.6-5-13.6-5.6-15-5.6-17Z',
    front: 'M-5.4-15.6C-5.8-20.4-3-23.2.6-23.2 4.2-23.2 7-20.4 6.6-15.6L5.6-17.8 4-18.6 2.6-17.8 1-19.2-.8-18-2.6-18.8-3.8-17.2Z',
  },
  // Hair up in a round bun (its own shape per view, so it never cuts the cap), clay shirt.
  n1: {
    skin: '#d9b18e', hair: '#4a3526', shirt: '#9a5f3e',
    side: 'M6.4-19C5.8-21.8 3.6-23.4.8-23.4-2.8-23.4-5.6-20.8-5.6-17.2-5.6-15.2-4.9-13.6-3.8-12.4L-2.4-13C-2.6-15.4-1.6-17.6.4-18.8 2.2-19.8 4.4-19.8 6.4-19Z',
    back: 'M-5.6-17C-5.6-20.6-2.8-23.2.6-23.2 4-23.2 6.8-20.6 6.8-17 6.8-15 6.2-13.6 5.2-12.6 3.6-13.4 2-13.6.6-13.6-.8-13.6-2.4-13.4-4-12.6-5-13.6-5.6-15-5.6-17Z',
    front: 'M-5.6-15.6C-6-20-3.6-23.2.6-23.2 4.8-23.2 7.2-20 6.8-15.6 6-18 3.6-19.6.6-19.8-2.4-19.6-4.8-18-5.6-15.6Z',
    bun: { side: [-3.4, -22.4], back: [.6, -24.2], front: [.6, -25.2] },
  },
  // A round cloud of curls that stays above the eyes, lake shirt.
  n2: {
    skin: '#ab7648', hair: '#2c2019', shirt: '#5f8fa3',
    side: `${dot(-2.6, -20.4, 4.6)}${dot(2.6, -22.2, 3.4)}${dot(5.8, -20.4, 1.9)}${dot(-5.2, -15.4, 3)}`,
    back: `${dot(.6, -19.2, 6.6)}${dot(-4.6, -15, 3.4)}${dot(5.8, -15, 3.4)}${dot(-2.6, -23.6, 3.4)}${dot(3.8, -23.6, 3.4)}`,
    front: `${dot(.6, -22.6, 4.6)}${dot(-3.8, -20.8, 3.6)}${dot(5, -20.8, 3.6)}${dot(-6, -16.4, 2.6)}${dot(7.2, -16.4, 2.6)}`,
  },
  // A straight bob with a blunt fringe, sage shirt.
  n3: {
    skin: '#c99a74', hair: '#3a2a1f', shirt: '#8daa91',
    side: 'M7-18.4C7-21.8 4.4-23.8.8-23.8-3.4-23.8-6.4-20.8-6.4-16.6V-11.4H-2.6V-14.2C-2.6-16.2-1.8-17.8-.4-18.6Z',
    back: 'M-6.4-17.4C-6.4-21.4-3.4-23.8.6-23.8 4.6-23.8 7.6-21.4 7.6-17.4V-11.4H-6.4Z',
    front: 'M-6.4-11.4V-17.4C-6.4-21.4-3.4-23.8.6-23.8 4.6-23.8 7.6-21.4 7.6-17.4V-11.4H5.2V-15.6L5.4-18.6H-4.2L-4-15.6V-11.4Z',
  },
};
const bun = (L, view) => L.bun ? `<path d="${dot(...L.bun[view], 3.2)}" fill="${L.hair}"/>` : '';
const SHIRT = 'M-3.6-10.4Q0-11.4 3.6-10.4L4.4-6.6 4-1.6Q3.8 0 2.2 0H-2.4Q-4 0-4.1-1.6L-4.4-6.6Z';
const SHIRT_FB = 'M-3.4-10.4Q.6-11.6 4.6-10.4L5.6-6.4 5.2-1.6Q5 0 3.4 0H-2.2Q-3.8 0-4-1.6L-4.4-6.4Z';
// Arms by pose: resting on the head (sit), raised with an open hand (explain), pulling the rein (pull).
const ARM = { sit: 'M2.4-9.2Q5.8-8 8.4-6.9', explain: 'M2.4-9.2L6.4-9.6 7.6-15.4', pull: `M2.4-9.2L5-6.4 ${PULL_HAND.join(' ')}` };

/** A small rider in Maya's language, seat at (0, 0), facing right: sitting relaxed on the neck, one hand
 *  resting on the elephant's head. The knee shows over the ear's top edge; the shin hangs behind the ear.
 *  No whip, stick or crown. `pose`: `sit` (default), `explain` (one hand raised, head turned back), `pull`
 *  (leaning back, hand on a taut rein), `back` and `front` (the away and toward views). `look`: unset or
 *  `n1` | `n2` | `n3`. */
export function rider({ pose = 'sit', look } = {}) {
  const L = LOOKS[look] || LOOKS.base;
  if (pose === 'back' || pose === 'front') return riderFB(pose, L);
  const arm = ARM[pose] || ARM.sit, back = pose === 'explain', lean = pose === 'pull';
  const body = `${limb('M.5-12.5v2', L.skin, 2.4)}
<path d="${SHIRT}" fill="${L.shirt}"/>
${limb(arm, L.skin, 2.2)}${back ? `<path d="${dot(7.7, -16.2, 1.5)}" fill="${L.skin}"/>` : ''}
${back ? '<g transform="matrix(-1 0 0 1 1.2 0)">' : ''}<circle cx=".6" cy="-17" r="6" fill="${L.skin}"/>
<path d="${L.side}" fill="${L.hair}"/>${bun(L, 'side')}
<path d="${dot(1.4, -16.1, .75)}${dot(4.6, -16.1, .75)}" fill="${INK}"/>${back ? '</g>' : ''}`;
  return `<g class="rider${back ? ' explain' : ''}">
${limb('M-1-1.5L7.6-1.4 8.6 7', QUIET, 3.2)}
${lean ? `<g transform="rotate(${PULL_LEAN})">${body}</g>` : body}</g>`;
}
function riderFB(pose, L) {
  const front = pose === 'front';
  return `<g class="rider ${pose}">
${limb('M-2.4-1L-7.6 1.6M3.6-1L8.8 1.6', QUIET, 3.2)}
${limb('M.6-12.5v2', L.skin, 2.4)}
<path d="${SHIRT_FB}" fill="${L.shirt}"/>
${limb(front ? 'M-3.4-9.4Q-5.6-6-4.8-1.6M4.6-9.4Q6.8-6 6-1.6' : 'M-3.4-9.4L-5.4-5.4M4.6-9.4L6.6-5.4', L.skin, 2.2)}
<circle cx=".6" cy="-17" r="6" fill="${L.skin}"/>
<path d="${L[pose]}" fill="${L.hair}"/>${bun(L, pose)}
${front ? `<path d="${dot(-1.6, -15.8, .75)}${dot(2.8, -15.8, .75)}" fill="${INK}"/>` : ''}</g>`;
}

/** The elephant with its rider. `reins: true` adds a cello head strap and a rein in the rider's hand (slack, or
 *  taut on `pulled`); there is no bit. `look` and `riderPose` choose the rider; the away and toward views carry
 *  the rider's back and front. */
export function elephantWithRider({ pose = 'stand', reins = false, look, riderPose } = {}) {
  const rp = VIEW[pose] || riderPose || (pose === 'pulled' && reins ? 'pull' : 'sit');
  return elephant({ pose, rider: rider({ pose: rp, look }), reins });
}
