// The lesson header controls (LessonControls.astro): tips on the Pictures | Text toggle and the language
// button, the language menu, and the switch between the lesson and its reading dialog.
import { initTips } from './soon-tip.js';

const TIP_DELAY = 400;
let ready = false;

export function initLessonControls() {
  if (ready) return;
  ready = true;
  initTips(document.querySelectorAll('.lesson-controls [data-tip]'), { pin: false, delay: TIP_DELAY });
  for (const menu of document.querySelectorAll('[data-lang-menu]')) initLanguageMenu(menu);
}

function initLanguageMenu(root) {
  const button = root.querySelector('.lang-menu-button');
  const list = root.querySelector('.lang-menu-list');
  const items = [...list.querySelectorAll('a')];
  const current = Math.max(0, items.findIndex(item => item.hasAttribute('aria-current')));
  const isOpen = () => !list.hidden;

  const open = at => {
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('data-tip-off', '');
    document.getElementById(button.dataset.tip)?.setAttribute('hidden', '');
    button.removeAttribute('data-tip-open');
    items[(at + items.length) % items.length].focus();
  };
  const close = ({ refocus = false } = {}) => {
    if (!isOpen()) return;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.removeAttribute('data-tip-off');
    if (refocus) button.focus();
  };

  button.addEventListener('click', () => (isOpen() ? close() : open(current)));
  button.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); open(isOpen() ? 0 : current); }
    if (event.key === 'ArrowUp') { event.preventDefault(); open(items.length - 1); }
    if (event.key === 'Escape' && isOpen()) { event.preventDefault(); event.stopPropagation(); close({ refocus: true }); }
  });
  list.addEventListener('keydown', event => {
    const at = items.indexOf(document.activeElement);
    const move = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[event.key];
    if (move !== undefined) { event.preventDefault(); items[(move + items.length) % items.length].focus(); return; }
    if (event.key === ' ') { event.preventDefault(); document.activeElement.click(); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close({ refocus: true }); return; }
    if (event.key === 'Tab') close();
  });
  // Keep the reader on the same lesson step (#fragment), as the footer switch does.
  list.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && location.hash) link.hash = location.hash;
  });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
}

/**
 * Pictures | Text on a lesson page: Text opens the reading dialog (after `prepare`, which may be async),
 * Pictures closes it. The dialog carries its own copy of the controls at the header's place on screen,
 * since a modal dialog makes the header itself unreachable.
 */
export function bindReadingDialog(dialog, prepare = () => {}) {
  const header = document.querySelector('.journey-header [data-lesson-controls]');
  const inDialog = dialog.querySelector('[data-lesson-controls]');
  let toPictures = false;
  const setView = view => {
    for (const option of document.querySelectorAll('button.view-option')) option.setAttribute('aria-pressed', String(option.dataset.view === view));
  };
  const place = () => {
    if (!header || !inDialog) return;
    const box = header.getBoundingClientRect();
    inDialog.style.top = `${box.top}px`;
    inDialog.style.right = `${document.documentElement.clientWidth - box.right}px`;
  };
  document.addEventListener('click', async event => {
    const option = event.target.closest?.('button.view-option');
    if (!option) return;
    if (option.dataset.view === 'text' && !dialog.open) {
      await prepare();
      place();
      setView('text');
      dialog.showModal();
    } else if (option.dataset.view === 'pictures' && dialog.open) {
      toPictures = event.detail === 0; // by keyboard: focus goes on to the header's Pictures
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    setView('pictures');
    if (toPictures) header?.querySelector('[data-view="pictures"]')?.focus();
    toPictures = false;
  });
  window.addEventListener('resize', () => { if (dialog.open) place(); });
}
