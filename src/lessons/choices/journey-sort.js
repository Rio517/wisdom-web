// Drag-or-tap sorting board: a pile of cards in the middle and one side on each hand.
// Lesson 1 (the defaults) asks "What was in their control?": right-or-wrong lines, one retry,
// then the card is moved for you, and Skip shows the answers. A lesson passes its own two
// `sides`, its cards (each with `side`, or Lesson 1's `mine`) and `judge: false` for a quiet
// sort: every card lands, one on the wrong side slides gently across to its own, `lineFor`
// gives its line (handed to onChange, for the story column), and at the end each side shows
// its `strong` words with `again` in the middle. Self-contained apart from the shared icon set.
import { t } from '../../i18n/runtime.js';
import { ICONS } from './journey-icons.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const DRAG_THRESHOLD = 6;

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// A small deterministic hash so each card keeps the same "loose pile" tilt
// across re-renders, without needing to store it anywhere.
function seedRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 601) / 100) - 3; // -3..3 degrees
}

function verdictText(card, correct, forced) {
  if (forced) return t('sort.verdict.forced');
  if (correct) return card.mine ? t('sort.verdict.rightMine') : t('sort.verdict.rightNot');
  return card.mine ? t('sort.verdict.wrongMine') : t('sort.verdict.wrongNot');
}

/** Lesson 1's two sides: their choice on the left, outside their control on the right. */
const controlSides = () => [
  { value: true, cls: 'sort-bin-mine', attrs: 'data-mine="true"', title: t('sort.binMine'), icon: ICONS.backpack, place: t('sort.placeMine'), announce: card => t('sort.announceMine', { card: card.label }) },
  { value: false, cls: 'sort-bin-not', attrs: 'data-mine="false"', title: t('sort.binNot'), icon: ICONS.weather, place: t('sort.placeNot'), announce: card => t('sort.announceNot', { card: card.label }) },
];

// A wrong-side card rests where it landed for a moment, then slides across to its own side.
const SLIDE = 900;

export function createSortBoard(container, { cards, results = {}, doneText, onChange = () => {}, sides = controlSides(), judge = true, lineFor = () => '', again = '', onAgain = () => {} }) {
  const cardsById = new Map(cards.map(card => [card.id, card]));
  const sideOf = card => ('side' in card ? card.side : card.mine);
  const sideFor = value => sides.find(side => side.value === value);
  const resultsState = { ...results };
  const attempts = new Map();
  const forcedSet = new Set();
  let selectedId = null;
  let drag = null;
  let suppressClick = false;
  let skipping = false;
  let skipTimer = null;
  let destroyed = false;

  const binHTML = side => `
    <section class="sort-bin ${side.cls}" ${side.attrs ?? ''} aria-label="${esc(side.title)}">
      <h2 class="sort-bin-title">${side.icon}<span>${esc(side.title)}</span></h2>${judge ? '' : `
      <p class="sort-bin-strong" hidden>${esc(side.strong ?? '')}</p>`}
      <ul class="sort-bin-list"></ul>
      <button type="button" class="sort-bin-target sr-only">${esc(side.place)}</button>
    </section>`;
  const completeHTML = judge
    ? `<div class="sort-complete" hidden>
        <h3 class="sort-complete-heading" tabindex="-1">${esc(t('sort.allSorted'))}</h3>
        <p class="sort-complete-text"></p>
      </div>`
    : `<div class="sort-complete sort-complete-quiet" hidden>
        <button type="button" class="pill-button sort-again">${esc(again)}</button>
      </div>`;
  container.innerHTML = `${binHTML(sides[0])}
    <div class="sort-centre">
      <div class="sort-intro">
        <p class="sort-instruction">${esc(t('sort.instruction'))}</p>
        <p class="sort-hint">${esc(t('sort.hint'))}<span class="sr-only"> ${esc(t('sort.keyboardHint'))}</span></p>
      </div>
      <div class="sort-pile" role="group" aria-label="${esc(t('sort.pileLabel'))}"></div>
      <p class="sort-verdict" aria-live="polite"${judge ? '' : ' hidden'}></p>
      ${judge ? `<button type="button" class="sort-skip">${esc(t('sort.skip'))}</button>` : ''}
      ${completeHTML}
    </div>${binHTML(sides[1])}
    <p class="sort-announce sr-only" aria-live="polite"></p>`;
  container.setAttribute('data-local-keys', '');

  // The first side (Lesson 1's "mine") and the second; "Mine"/"Not" name them by position.
  const binMineEl = container.querySelector(`.${sides[0].cls}`);
  const binNotEl = container.querySelector(`.${sides[1].cls}`);
  const binMineList = binMineEl.querySelector('.sort-bin-list');
  const binNotList = binNotEl.querySelector('.sort-bin-list');
  const binFor = value => (value === sides[0].value ? binMineEl : binNotEl);
  const listFor = value => (value === sides[0].value ? binMineList : binNotList);
  const pileEl = container.querySelector('.sort-pile');
  const introEl = container.querySelector('.sort-intro');
  const verdictEl = container.querySelector('.sort-verdict');
  const skipBtn = container.querySelector('.sort-skip') ?? document.createElement('button');
  const completeEl = container.querySelector('.sort-complete');
  const completeHeadingEl = container.querySelector('.sort-complete-heading') ?? container.querySelector('.sort-again');
  const strongEls = [...container.querySelectorAll('.sort-bin-strong')];
  const completeTextEl = container.querySelector('.sort-complete-text');
  const announceEl = container.querySelector('.sort-announce');

  function isComplete() {
    return cards.every(card => resultsState[card.id] !== undefined);
  }

  function checkComplete() {
    const done = isComplete();
    introEl.hidden = done;
    pileEl.hidden = done;
    verdictEl.hidden = done || !judge;
    skipBtn.hidden = done;
    completeEl.hidden = !done;
    strongEls.forEach(el => { el.hidden = !done; });
    if (done && completeTextEl) completeTextEl.textContent = doneText;
  }

  function triggerShake(el) {
    if (!el || reducedMotion()) return;
    el.classList.remove('sort-card-shake');
    void el.offsetWidth; // restart the animation
    el.classList.add('sort-card-shake');
  }

  function returnToPile(el, shake) {
    if (!el) return;
    el.classList.remove('dragging');
    el.style.transform = '';
    if (shake) triggerShake(el);
  }

  function settleIntoBin(li, fromRect) {
    if (reducedMotion()) return;
    const toRect = li.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    li.style.transition = 'none';
    li.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
    li.style.opacity = '0.9';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        li.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 220ms';
        li.style.transform = '';
        li.style.opacity = '';
      });
    });
    li.addEventListener('transitionend', () => { li.style.transition = ''; }, { once: true });
  }

  /** A card placed on the other side: it shows where it landed, rests, then slides across to its own. */
  function slideAcross(li, fromRect) {
    if (reducedMotion() || typeof li.animate !== 'function') return;
    const toRect = li.getBoundingClientRect();
    const away = `translate(${fromRect.left - toRect.left}px, ${fromRect.top - toRect.top}px)`;
    li.classList.add('is-crossing');
    const slide = li.animate([
      { transform: away, offset: 0 },
      { transform: away, offset: 0.3 },
      { transform: 'none', offset: 1 },
    ], { duration: SLIDE, easing: 'cubic-bezier(.45,0,.2,1)' });
    slide.finished.then(() => li.classList.remove('is-crossing'), () => li.classList.remove('is-crossing'));
  }

  /** Where a card would land at the foot of a side's list. */
  function landingRect(value) {
    const list = listFor(value);
    const last = list.lastElementChild;
    const box = list.getBoundingClientRect();
    return { left: box.left, top: last ? last.getBoundingClientRect().bottom + 8 : box.top };
  }

  function buildBinListItem(card, forced = false) {
    const li = document.createElement('li');
    li.className = 'sort-bin-card';
    li.dataset.id = card.id;
    const label = document.createElement('span');
    label.textContent = card.label;
    li.appendChild(label);
    if (forced) {
      const note = document.createElement('small');
      note.textContent = t('sort.movedHere');
      li.appendChild(note);
    }
    return li;
  }

  function createCardElement(card) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sort-card';
    btn.dataset.id = card.id;
    btn.setAttribute('aria-pressed', 'false');
    btn.style.setProperty('--rot', `${seedRotation(card.id).toFixed(2)}deg`);
    btn.textContent = card.label;
    return btn;
  }

  function announce(card) {
    announceEl.textContent = sideFor(sideOf(card)).announce(card);
  }

  function focusAfterPlacement() {
    const next = pileEl.querySelector('.sort-card');
    if (next) next.focus({ preventScroll: true });
    else completeHeadingEl.focus({ preventScroll: true });
  }

  function selectCard(id) {
    if (selectedId === id) { clearSelection(); return; }
    clearSelection();
    selectedId = id;
    const el = pileEl.querySelector(`[data-id="${id}"]`);
    if (el) { el.setAttribute('aria-pressed', 'true'); el.classList.add('is-selected'); }
    container.classList.add('has-selection');
  }

  function clearSelection() {
    if (!selectedId) return;
    const el = pileEl.querySelector(`[data-id="${selectedId}"]`);
    if (el) { el.setAttribute('aria-pressed', 'false'); el.classList.remove('is-selected'); }
    selectedId = null;
    container.classList.remove('has-selection');
  }

  function placeSelectedIn(value) {
    if (!selectedId) return;
    const card = cardsById.get(selectedId);
    clearSelection();
    handleAttempt(card, value, {});
  }

  function finalize(card, { correct, forced, dragEl, chosen }) {
    const value = sideOf(card);
    resultsState[card.id] = value;
    attempts.delete(card.id);
    if (forced) forcedSet.add(card.id);
    const crossing = !judge && !correct;
    // Where the card was let go of, or where it would have landed on the side it was given.
    const fromRect = dragEl ? dragEl.getBoundingClientRect() : crossing ? landingRect(chosen) : null;
    const li = buildBinListItem(card, forced);
    listFor(value).appendChild(li);
    if (crossing) {
      slideAcross(li, fromRect);
      dragEl?.remove();
      pileEl.querySelector(`[data-id="${card.id}"]`)?.remove();
    } else if (dragEl) {
      settleIntoBin(li, fromRect);
      dragEl.remove();
    } else {
      if (!reducedMotion()) li.classList.add(value === sides[0].value ? 'sort-fly-right' : 'sort-fly-left');
      pileEl.querySelector(`[data-id="${card.id}"]`)?.remove();
    }
    clearSelection();
    announce(card);
    const line = judge ? verdictText(card, correct, forced) : lineFor(card);
    if (judge) verdictEl.textContent = line;
    checkComplete();
    onChange({ ...resultsState }, { done: isComplete(), cardId: card.id, correct, line });
    focusAfterPlacement();
  }

  function handleAttempt(card, chosenMine, { dragEl = null } = {}) {
    if (!card || resultsState[card.id] !== undefined) return;
    const correct = chosenMine === sideOf(card);
    if (!judge) { finalize(card, { correct, forced: false, dragEl, chosen: chosenMine }); return; }
    const attemptsSoFar = attempts.get(card.id) ?? 0;
    if (correct || attemptsSoFar >= 1) {
      finalize(card, { correct, forced: !correct, dragEl });
    } else {
      attempts.set(card.id, attemptsSoFar + 1);
      verdictEl.textContent = verdictText(card, false, false);
      returnToPile(dragEl ?? pileEl.querySelector(`[data-id="${card.id}"]`), true);
    }
  }

  function hitBin(x, y) {
    const inRect = el => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    if (inRect(binMineEl)) return sides[0].value;
    if (inRect(binNotEl)) return sides[1].value;
    return null;
  }

  function onPointerDown(event) {
    if (drag) return;
    const btn = event.target.closest('.sort-card');
    if (!btn || event.button === 2) return;
    try { btn.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    drag = {
      id: btn.dataset.id,
      el: btn,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rotation: parseFloat(btn.style.getPropertyValue('--rot')) || 0,
      moved: false,
    };
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      drag.el.classList.add('dragging');
      clearSelection();
    }
    drag.rotation += (0 - drag.rotation) * 0.25;
    drag.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${drag.rotation}deg) scale(1.05)`;
    const hit = hitBin(event.clientX, event.clientY);
    binMineEl.classList.toggle('drag-over', hit === sides[0].value);
    binNotEl.classList.toggle('drag-over', hit === sides[1].value);
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const finished = drag;
    drag = null;
    try { finished.el.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
    binMineEl.classList.remove('drag-over');
    binNotEl.classList.remove('drag-over');
    if (!finished.moved) return; // a plain tap: the click event handles selection
    // Swallow the click this drag may end with, but only that one: when the drop lands outside the
    // pile no click reaches it, and the next tap must still work.
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    finished.el.classList.remove('dragging');
    const hit = hitBin(event.clientX, event.clientY);
    if (hit === null) { finished.el.style.transform = ''; return; }
    handleAttempt(cardsById.get(finished.id), hit, { dragEl: finished.el });
  }

  function onPointerCancel(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    try { drag.el.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
    drag.el.classList.remove('dragging');
    drag.el.style.transform = '';
    binMineEl.classList.remove('drag-over');
    binNotEl.classList.remove('drag-over');
    drag = null;
  }

  function onPileClick(event) {
    if (suppressClick) { suppressClick = false; return; }
    const btn = event.target.closest('.sort-card');
    if (!btn) return;
    selectCard(btn.dataset.id);
  }

  function onBinMineClick() { placeSelectedIn(sides[0].value); }
  function onBinNotClick() { placeSelectedIn(sides[1].value); }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      if (selectedId) { event.preventDefault(); event.stopPropagation(); clearSelection(); }
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const btn = event.target.closest('.sort-card');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    handleAttempt(cardsById.get(btn.dataset.id), event.key === 'ArrowLeft' ? sides[0].value : sides[1].value, {});
  }

  function doSkip() {
    skipping = true;
    skipBtn.disabled = true;
    const remaining = [...pileEl.querySelectorAll('.sort-card')].map(el => cardsById.get(el.dataset.id));
    let i = 0;
    const step = () => {
      if (destroyed) return;
      const card = remaining[i];
      if (card && resultsState[card.id] === undefined) {
        clearSelection();
        resultsState[card.id] = sideOf(card);
        attempts.delete(card.id);
        const li = buildBinListItem(card, false);
        listFor(sideOf(card)).appendChild(li);
        if (!reducedMotion()) li.classList.add(sideOf(card) === sides[0].value ? 'sort-fly-right' : 'sort-fly-left');
        pileEl.querySelector(`[data-id="${card.id}"]`)?.remove();
      }
      i += 1;
      if (i < remaining.length) {
        skipTimer = setTimeout(step, 90);
      } else {
        skipping = false;
        checkComplete();
        onChange({ ...resultsState }, { done: true });
        focusAfterPlacement();
      }
    };
    step();
  }

  function exposedSkip() {
    if (destroyed || skipping || isComplete()) return;
    doSkip();
  }

  function renderAll() {
    clearSelection();
    const unsorted = cards.filter(card => resultsState[card.id] === undefined);
    pileEl.replaceChildren(...unsorted.map(createCardElement));
    binMineList.replaceChildren(...cards
      .filter(card => resultsState[card.id] !== undefined && sideOf(card) === sides[0].value)
      .map(card => buildBinListItem(card, forcedSet.has(card.id))));
    binNotList.replaceChildren(...cards
      .filter(card => resultsState[card.id] !== undefined && sideOf(card) === sides[1].value)
      .map(card => buildBinListItem(card, forcedSet.has(card.id))));
    verdictEl.textContent = '';
    announceEl.textContent = '';
    skipBtn.disabled = false;
    checkComplete();
  }

  /** Every card back in the pile (the quiet sort's Start again). */
  function restart() {
    for (const card of cards) delete resultsState[card.id];
    forcedSet.clear();
    attempts.clear();
    renderAll();
  }
  function onAgainClick() {
    restart();
    onAgain();
    onChange({ ...resultsState }, { done: false, restart: true });
    pileEl.querySelector('.sort-card')?.focus({ preventScroll: true });
  }
  const againBtn = container.querySelector('.sort-again');

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(skipTimer);
    pileEl.removeEventListener('pointerdown', onPointerDown);
    pileEl.removeEventListener('pointermove', onPointerMove);
    pileEl.removeEventListener('pointerup', onPointerUp);
    pileEl.removeEventListener('pointercancel', onPointerCancel);
    pileEl.removeEventListener('click', onPileClick);
    binMineEl.removeEventListener('click', onBinMineClick);
    binNotEl.removeEventListener('click', onBinNotClick);
    skipBtn.removeEventListener('click', exposedSkip);
    againBtn?.removeEventListener('click', onAgainClick);
    container.removeEventListener('keydown', onKeydown);
  }

  pileEl.addEventListener('pointerdown', onPointerDown);
  pileEl.addEventListener('pointermove', onPointerMove);
  pileEl.addEventListener('pointerup', onPointerUp);
  pileEl.addEventListener('pointercancel', onPointerCancel);
  pileEl.addEventListener('click', onPileClick);
  binMineEl.addEventListener('click', onBinMineClick);
  binNotEl.addEventListener('click', onBinNotClick);
  skipBtn.addEventListener('click', exposedSkip);
  againBtn?.addEventListener('click', onAgainClick);
  container.addEventListener('keydown', onKeydown);

  renderAll();

  return { render: renderAll, skip: exposedSkip, restart, destroy, get results() { return { ...resultsState }; } };
}
