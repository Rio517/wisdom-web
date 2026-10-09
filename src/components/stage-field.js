// The stage's path field (home page and lesson cover, design 002 v02 · A):
// where the Beginning dot sits, so the paths can grow out of it as a widening
// circle, and a faint still copy of the field for the words to sit on.

/**
 * Keep `--ox`, `--oy` (the Beginning, in the stack's own pixels) and
 * `--reach` (enough radius to cover the stack) on `stack`, and a still copy
 * of `base` in `ghost` (an <img>), in step with the stack's size.
 */
export function watchField(stack, base, ghost) {
  const place = () => {
    const width = stack.clientWidth;
    const height = stack.clientHeight;
    // Where fitOverview puts the Beginning (src/engine/lab-renderer.js: 30px
    // side padding, 10 top and 28 bottom, a 1260 × 740 field opening at x 40).
    const ox = 30 + 40 * (width - 60) / 1260;
    const oy = 10 + 370 * (height - 38) / 740;
    stack.style.setProperty('--ox', `${ox}px`);
    stack.style.setProperty('--oy', `${oy}px`);
    stack.style.setProperty('--reach', `${Math.hypot(width - ox, Math.max(oy, height - oy)) + 160}px`);
  };
  // A still picture, not another canvas: a canvas layer is pushed to the
  // compositor again on every frame that something animates near it, which
  // cost long frames while the words left. It leaves out the renderer's
  // bottom labels (the last 30px); the real Beginning label sits by the dot.
  let url = null;
  const snapshot = () => {
    if (!ghost || !base.width) return;
    const scale = base.width / Math.max(1, base.clientWidth);
    const copy = document.createElement('canvas');
    copy.width = base.width;
    copy.height = base.height;
    const keep = Math.max(1, base.height - 30 * scale);
    copy.getContext('2d')?.drawImage(base, 0, 0, base.width, keep, 0, 0, base.width, keep);
    copy.toBlob(blob => {
      if (!blob) return;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      ghost.src = url;
    });
  };
  new ResizeObserver(() => { place(); requestAnimationFrame(() => requestAnimationFrame(snapshot)); }).observe(stack);
  place();
  return { snapshot };
}
