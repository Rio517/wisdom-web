// Source: asset-factory, wisdom/elephant/src/elephant-b.js, copied unchanged.
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

/** A small rider in Maya's language, seat at (0, 0), facing right: sitting relaxed on the neck, one hand
 *  resting on the elephant's head. The knee shows over the ear's top edge; the shin hangs behind the ear.
 *  No whip, stick or crown. */
export function rider() {
  return `<g class="rider">
${limb('M-1-1.5L7.6-1.4 8.6 7', QUIET, 3.2)}
${limb('M.5-12.5v2', SKIN, 2.4)}
<path d="M-3.6-10.4Q0-11.4 3.6-10.4L4.4-6.6 4-1.6Q3.8 0 2.2 0H-2.4Q-4 0-4.1-1.6L-4.4-6.6Z" fill="${SUN}"/>
${limb('M2.4-9.2Q5.8-8 8.4-6.9', SKIN, 2.2)}
<circle cx=".6" cy="-17" r="6" fill="${SKIN}"/>
<path d="M6.4-18.4C6.2-21.8 3.8-23.4 .8-23.2-2.8-23-5.4-20.6-5.4-17-5.4-15-4.8-13.6-3.6-12.6L-2.4-13C-2.8-14.8-2.4-16.6-1.2-17.6.8-18 3-18.6 4.6-19.8 5.2-19 5.8-18.6 6.4-18.4Z" fill="${HAIR}"/>
<path d="${dot(1.4, -16.1, .75)}${dot(4.6, -16.1, .75)}" fill="${INK}"/></g>`;
}

/** The elephant with its rider. `reins: true` adds a cello head strap and a slack rein in the rider's hand,
 *  for Lesson 3; there is no bit. */
export function elephantWithRider({ pose = 'stand', reins = false } = {}) {
  return elephant({ pose, rider: rider(), reins });
}
