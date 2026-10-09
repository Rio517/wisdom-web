// Site index behaviour. Wide screens: a sidebar that can be hidden (remembered
// per browser). Tablets and the full-screen lesson: a drawer with a backdrop,
// Escape to close, focus kept inside while open, and focus returned after.
import { initSoonTips } from './soon-tip.js';

const STORE_KEY = 'wisdom-nav-collapsed';

function remember(value) {
  try { localStorage.setItem(STORE_KEY, value ? '1' : '0'); } catch { /* storage unavailable */ }
}
function remembered() {
  try { return localStorage.getItem(STORE_KEY) === '1'; } catch { return false; }
}

export function initSiteNav() {
  initSoonTips();
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const shell = document.querySelector('.site-shell');
  const alwaysDrawer = nav.dataset.mode === 'drawer';
  const narrow = matchMedia('(max-width: 1100px)');
  let backdrop = null;
  let returnFocus = null;

  const isDrawer = () => nav.dataset.mode === 'drawer';
  const focusables = () => [...nav.querySelectorAll('a[href], button:not([disabled]), summary')]
    .filter(element => element.offsetParent !== null || element === document.activeElement);

  function setMode() {
    if (alwaysDrawer) return;
    const drawer = narrow.matches;
    if (!drawer && nav.dataset.open === 'true') close({ restore: false });
    nav.dataset.mode = drawer ? 'drawer' : 'sidebar';
    nav.querySelector('[data-nav-close]')?.setAttribute('aria-label', drawer ? nav.dataset.labelClose : nav.dataset.labelHide);
  }

  function open(trigger) {
    if (!isDrawer()) {
      shell.dataset.nav = 'open';
      remember(false);
      nav.querySelector('.brand')?.focus({ preventScroll: true });
      return;
    }
    returnFocus = trigger ?? document.activeElement;
    nav.dataset.open = 'true';
    nav.setAttribute('role', 'dialog');
    nav.setAttribute('aria-modal', 'true');
    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-label', nav.dataset.labelClose);
    backdrop.tabIndex = -1;
    backdrop.addEventListener('click', () => close());
    nav.before(backdrop);
    document.querySelectorAll('[data-nav-open]').forEach(button => button.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => (nav.querySelector('[aria-current="page"]') ?? focusables()[0])?.focus({ preventScroll: true }));
  }

  function close({ restore = true } = {}) {
    if (!isDrawer()) {
      shell.dataset.nav = 'collapsed';
      remember(true);
      document.querySelector('.nav-opener')?.focus({ preventScroll: true });
      return;
    }
    if (nav.dataset.open !== 'true') return;
    nav.dataset.open = 'false';
    nav.removeAttribute('role');
    nav.removeAttribute('aria-modal');
    backdrop?.remove();
    backdrop = null;
    document.querySelectorAll('[data-nav-open]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (restore) returnFocus?.focus?.({ preventScroll: true });
  }

  document.querySelectorAll('[data-nav-open]').forEach(button => {
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => open(button));
  });
  nav.querySelector('[data-nav-close]')?.addEventListener('click', () => close());

  nav.addEventListener('keydown', event => {
    if (!isDrawer() || nav.dataset.open !== 'true') return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Keep lesson shortcuts (← →) from firing behind an open drawer.
  document.addEventListener('keydown', event => {
    if (nav.dataset.open === 'true' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) event.stopImmediatePropagation();
  }, true);

  if (shell && !alwaysDrawer && remembered()) shell.dataset.nav = 'collapsed';
  setMode();
  narrow.addEventListener('change', setMode);
}
