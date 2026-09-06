export const AGES = [8, 12, 16, 25, 40, 60];
export const OVERVIEW = { x: 0, y: 0, width: 1260, height: 540 };

// Authored illustration coordinates, deliberately not a linear age scale.
const anchors = [
  { age: 0, x: 40, y: 270 },
  { age: 4, x: 150, y: 290 },
  { age: 8, x: 250, y: 245 },
  { age: 12, x: 350, y: 295 },
  { age: 16, x: 450, y: 247 },
  { age: 25, x: 565, y: 268 },
  { age: 40, x: 700, y: 220 },
  { age: 60, x: 805, y: 258 },
];
const curves = [
  'C 85 264 105 305 150 290',
  'C 190 274 205 225 250 245',
  'C 290 257 307 324 350 295',
  'C 392 268 402 215 450 247',
  'C 483 273 515 292 565 268',
  'C 659 223 603 153 662 173 C 706 189 656 236 700 220',
  'C 750 195 746 304 805 258',
  'C 894 189 929 292 1015 264 C 1097 238 1158 273 1220 236',
];
const normalizeAge = value => AGES.includes(Number(value)) ? Number(value) : 8;
const round = value => Math.round(value * 10) / 10;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * (3 - 2 * value);

export function readState(input) {
  const url = new URL(input);
  return {
    age: normalizeAge(url.searchParams.get('age')),
    scene: url.hash === '#learning' ? 'learning' : 'possibilities',
    selected: url.searchParams.get('selected') === '1',
  };
}

export function stateURL(state, input) {
  const url = new URL(input);
  url.search = '';
  url.searchParams.set('age', normalizeAge(state.age));
  if (state.selected) url.searchParams.set('selected', '1');
  url.hash = state.scene === 'learning' ? 'learning' : 'possibilities';
  return url;
}

export function motionFrame(elapsed, reduced = false) {
  if (reduced) return { travel: 1, zoom: 1, settled: true };
  return {
    travel: ease(clamp(elapsed / 500)),
    zoom: ease(clamp((elapsed - 500) / 250)),
    settled: elapsed >= 750,
  };
}

export function makeMap(value) {
  const age = normalizeAge(value);
  const index = anchors.findIndex(point => point.age === age);
  const anchor = { ...anchors[index] };
  const branches = [];
  // Shared branch geometry is invariant across age selection and replay.
  // Crossings are illustrative, not promises that every route reconnects.
  for (let group = 1; group < anchors.length; group++) {
    const origin = anchors[group];
    for (const side of [-1, 1]) {
      const distance = 1220 - origin.x;
      const forkX = round(origin.x + distance * (0.4 + group * 0.012));
      const endBase = side < 0 ? 24 + group * 24 : 522 - group * 23;
      const forkY = round(origin.y + (endBase - origin.y) * 0.78);
      const add = d => branches.push({
        d, originAge: origin.age, state: origin.age < age ? 'untaken' : 'possible',
      });
      add(`M ${origin.x} ${origin.y} C ${origin.x + 65} ${origin.y - side * 24} ${forkX - 85} ${forkY + side * 40} ${forkX} ${forkY}`);
      for (let twig = 0; twig < 3; twig++) {
        const midX = round(forkX + (1220 - forkX) * (0.42 + twig * 0.05));
        const midY = round(endBase + (twig - 1) * 17 + 12 * Math.sin(group + twig));
        const sway = 27 * Math.sin(group * 2.4 + twig);
        add(`M ${forkX} ${forkY} C ${round(forkX + 70)} ${round(forkY + sway)} ${round(midX - 65)} ${round(midY - sway)} ${midX} ${midY}`);
        for (let tip = 0; tip < 1; tip++) {
          const endX = 1160 + ((group * 17 + twig * 13 + tip * 29) % 60);
          const endY = round(Math.max(24, Math.min(516, midY + 16 * Math.sin(group * 2 + twig))));
          const curl = (group + twig) % 7 === 0;
          add(curl
            ? `M ${midX} ${midY} C ${midX + 95} ${midY + side * 45} ${midX - 20} ${midY - side * 55} ${midX + 45} ${midY - side * 32} C ${midX + 100} ${midY - side * 12} ${endX - 45} ${endY + side * 25} ${endX} ${endY}`
            : `M ${midX} ${midY} C ${midX + 55} ${round(midY + sway)} ${endX - 65} ${round(endY - sway)} ${endX} ${endY}`);
        }
      }
    }
  }
  return {
    anchor,
    anchors: anchors.filter(point => AGES.includes(point.age)).map(point => ({ ...point })),
    spine: `M 40 270 ${curves.join(' ')}`,
    past: `M 40 270 ${curves.slice(0, index).join(' ')}`,
    future: `M ${anchor.x} ${anchor.y} ${curves.slice(index).join(' ')}`,
    branches,
    focus: { x: round(Math.min(220, Math.max(0, anchor.x - 310))), y: 48, width: 1040, height: 446 },
  };
}
