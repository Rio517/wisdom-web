// Small popovers on lessons that aren't written yet (the index and the home
// roadmap). Each trigger is a button described by its tip: hover and keyboard
// focus show it, a click pins it open, Escape or a click elsewhere closes it.
let ready = false;

export function initSoonTips() {
  if (ready) return;
  ready = true;
  const triggers = [...document.querySelectorAll('.soon-trigger')];
  if (!triggers.length) return;
  const tipFor = trigger => document.getElementById(trigger.getAttribute('aria-describedby'));
  let pinned = null;

  const hide = trigger => {
    const tip = tipFor(trigger);
    if (!tip || tip.hidden) return;
    tip.hidden = true;
    trigger.removeAttribute('data-tip-open');
    if (pinned === trigger) pinned = null;
  };
  const show = trigger => {
    for (const other of triggers) if (other !== trigger) hide(other);
    const tip = tipFor(trigger);
    if (!tip) return;
    tip.hidden = false;
    trigger.dataset.tipOpen = 'true';
  };

  for (const trigger of triggers) {
    trigger.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') show(trigger); });
    trigger.addEventListener('pointerleave', () => { if (pinned !== trigger) hide(trigger); });
    trigger.addEventListener('focus', () => show(trigger));
    trigger.addEventListener('blur', () => hide(trigger));
    trigger.addEventListener('click', () => {
      if (pinned === trigger) { hide(trigger); return; }
      show(trigger);
      pinned = trigger;
    });
    trigger.addEventListener('keydown', event => {
      const tip = tipFor(trigger);
      if (event.key !== 'Escape' || !tip || tip.hidden) return;
      // Close the tip first; a second Escape still reaches the drawer.
      event.preventDefault();
      event.stopPropagation();
      hide(trigger);
    });
  }
  document.addEventListener('pointerdown', event => {
    if (pinned && !pinned.contains(event.target)) hide(pinned);
  });
}
