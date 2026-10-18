// Small tips under a control. Each trigger points at its tip by aria-describedby (or aria-labelledby, when
// the tip is also the control's name): hover and keyboard focus show it, Escape or leaving hides it.
// Two flavours share this code:
// - lessons that aren't written yet (the index and the home roadmap): a click pins the tip open, a click
//   elsewhere closes it (initSoonTips);
// - the lesson header controls: a click acts instead, hover waits a moment, and touch never shows a tip
//   (initTips with { pin: false, delay }).
let ready = false;
// Keyboard or pointer, by the last input: without pinning, only a keyboard focus shows a tip (a tap or a
// click focuses the control too, and Safari counts any scripted focus as visible).
let keyboard = false;
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', event => { if (!event.metaKey && !event.ctrlKey) keyboard = true; }, true);
  document.addEventListener('pointerdown', () => { keyboard = false; }, true);
}

export function initSoonTips() {
  if (ready) return;
  ready = true;
  initTips(document.querySelectorAll('.soon-trigger'));
}

const tipFor = trigger => document.getElementById(trigger.getAttribute('aria-describedby') ?? trigger.dataset.tip);

/** Wires tips to triggers. pin: a click pins the tip open; delay: ms before a hover shows it. */
export function initTips(list, { pin = true, delay = 0 } = {}) {
  const triggers = [...list].filter(trigger => !trigger.dataset.tipReady);
  if (!triggers.length) return;
  let pinned = null, timer = 0;

  const hide = trigger => {
    if (trigger.dataset.tipPending) { clearTimeout(timer); delete trigger.dataset.tipPending; }
    const tip = tipFor(trigger);
    if (!tip || tip.hidden) return;
    tip.hidden = true;
    trigger.removeAttribute('data-tip-open');
    if (pinned === trigger) pinned = null;
  };
  const show = trigger => {
    for (const other of triggers) if (other !== trigger) hide(other);
    const tip = tipFor(trigger);
    if (!tip || trigger.hasAttribute('data-tip-off')) return;
    tip.hidden = false;
    trigger.dataset.tipOpen = 'true';
  };

  for (const trigger of triggers) {
    trigger.dataset.tipReady = 'true';
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      if (!delay) { show(trigger); return; }
      clearTimeout(timer);
      trigger.dataset.tipPending = 'true';
      timer = setTimeout(() => { delete trigger.dataset.tipPending; show(trigger); }, delay);
    });
    trigger.addEventListener('pointerleave', () => { if (pinned !== trigger && !(keyboard && document.activeElement === trigger)) hide(trigger); });
    trigger.addEventListener('focus', () => { if (pin || keyboard) show(trigger); });
    trigger.addEventListener('blur', () => hide(trigger));
    trigger.addEventListener('click', () => {
      if (!pin) { hide(trigger); return; }
      if (pinned === trigger) { hide(trigger); return; }
      show(trigger);
      pinned = trigger;
    });
    trigger.addEventListener('keydown', event => {
      const tip = tipFor(trigger);
      if (event.key !== 'Escape' || !tip || tip.hidden) return;
      // Close the tip first; a second Escape still reaches the drawer or the dialog.
      event.preventDefault();
      event.stopPropagation();
      hide(trigger);
    });
  }
  if (pin) document.addEventListener('pointerdown', event => {
    if (pinned && !pinned.contains(event.target)) hide(pinned);
  });
  return { hide: () => triggers.forEach(hide) };
}
