// Water colours: the site's tokens (lake, lake-soft, paper), read from the
// page's CSS, and a few named mixes of them. The round README lists the mixes.
const FALLBACK = { lake: '#5f8fa3', 'lake-soft': '#d6e6ea', paper: '#fbfbf8' };

const rgb = value => {
  const hex = value.replace('#', '');
  const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
};
const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);

export function waterColors() {
  const style = globalThis.getComputedStyle?.(document.documentElement);
  const read = name => {
    const value = style?.getPropertyValue(`--color-${name}`).trim();
    return /^#[0-9a-f]{3,6}$/i.test(value ?? '') ? value : FALLBACK[name];
  };
  const lake = rgb(read('lake'));
  const soft = rgb(read('lake-soft'));
  const paper = rgb(read('paper'));
  return {
    bank: mix(soft, lake, 0.55), // water-bank: the darker edge
    body: mix(soft, lake, 0.1), // water-body
    deep: mix(soft, lake, 0.26), // water-deep: the middle of the stream in C
    light: mix(soft, paper, 0.72), // water-light: dashes, bands, streaks
    fall: mix(soft, paper, 0.22), // water-fall: the falling sheet
    foam: paper, // foam and glints
    ring: mix(soft, lake, 0.4), // water-ring: ripple rings
  };
}

export const cssColor = ([r, g, b], alpha = 1) => `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
export const hexColor = ([r, g, b]) => `#${[r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
