// Drag-or-tap sorting activity: "What was in their control?"
// Self-contained component. No dependencies besides the shared icon set.
import { ICONS } from './journey-icons.js';

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
  if (forced) return 'That one belongs on the other side.';
  if (correct) return card.mine ? 'Yes — that was their choice.' : 'Yes — that was outside their control.';
  return card.mine ? 'Hmm — could they choose that? Try the other side.' : 'Hmm — could they really choose that? Try the other side.';
}

export function createSortBoard(container, { cards, results = {}, doneText, onChange = () => {} }) {
  const cardsById = new Map(cards.map(card => [card.id, card]));
  const resultsState = { ...results };
  const attempts = new Map();
  const forcedSet = new Set();
  let selectedId = null;
  let drag = null;
  let suppressClick = false;
  let skipping = false;
  let skipTimer = null;
  let destroyed = false;

  container.innerHTML = `
    <section class="sort-bin sort-bin-mine" data-mine="true" aria-label="Their choice">
      <h2 class="sort-bin-title">${ICONS.backpack}<span>Their choice</span></h2>
      <ul class="sort-bin-list"></ul>
      <button type="button" class="sort-bin-target sr-only">Place the selected card here — their choice</button>
    </section>
    <div class="sort-centre">
      <div class="sort-intro">
        <p class="sort-instruction">Drag each card to a side.</p>
        <p class="sort-hint">Or tap a card, then tap a side.<span class="sr-only"> With a keyboard, focus a card and press the left or right arrow.</span></p>
      </div>
      <div class="sort-pile" role="group" aria-label="Cards to sort"></div>
      <p class="sort-verdict" aria-live="polite"></p>
      <button type="button" class="sort-skip">Skip — show the answers</button>
      <div class="sort-complete" hidden>
        <h3 class="sort-complete-heading" tabindex="-1">All sorted</h3>
        <p class="sort-complete-text"></p>
      </div>
    </div>
    <section class="sort-bin sort-bin-not" data-mine="false" aria-label="Outside their control">
      <h2 class="sort-bin-title">${ICONS.weather}<span>Outside their control</span></h2>
      <ul class="sort-bin-list"></ul>
      <button type="button" class="sort-bin-target sr-only">Place the selected card here — outside their control</button>
    </section>
    <p class="sort-announce sr-only" aria-live="polite"></p>`;
  container.setAttribute('data-local-keys', '');

  const binMineEl = container.querySelector('.sort-bin-mine');
  const binNotEl = container.querySelector('.sort-bin-not');
  const binMineList = binMineEl.querySelector('.sort-bin-list');
  const binNotList = binNotEl.querySelector('.sort-bin-list');
  const pileEl = container.querySelector('.sort-pile');
  const introEl = container.querySelector('.sort-intro');
  const verdictEl = container.querySelector('.sort-verdict');
  const skipBtn = container.querySelector('.sort-skip');
  const completeEl = container.querySelector('.sort-complete');
  const completeHeadingEl = container.querySelector('.sort-complete-heading');
  const completeTextEl = container.querySelector('.sort-complete-text');
  const announceEl = container.querySelector('.sort-announce');

  function isComplete() {
    return cards.every(card => resultsState[card.id] !== undefined);
  }

  function checkComplete() {
    const done = isComplete();
    introEl.hidden = done;
    pileEl.hidden = done;
    verdictEl.hidden = done;
    skipBtn.hidden = done;
    completeEl.hidden = !done;
    if (done) completeTextEl.textContent = doneText;
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

  function buildBinListItem(card, forced) {
    const li = document.createElement('li');
    li.className = 'sort-bin-card';
    li.dataset.id = card.id;
    const label = document.createElement('span');
    label.textContent = card.label;
    li.appendChild(label);
    if (forced) {
      const note = document.createElement('small');
      note.textContent = 'moved here';
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
    announceEl.textContent = `‘${card.label}’ — ${card.mine ? 'their choice' : 'outside their control'}.`;
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

  function placeSelectedIn(mine) {
    if (!selectedId) return;
    const card = cardsById.get(selectedId);
    clearSelection();
    handleAttempt(card, mine, {});
  }

  function finalize(card, { correct, forced, dragEl }) {
    resultsState[card.id] = card.mine;
    attempts.delete(card.id);
    if (forced) forcedSet.add(card.id);
    const bin = card.mine ? binMineList : binNotList;
    const li = buildBinListItem(card, forced);
    bin.appendChild(li);
    if (dragEl) {
      settleIntoBin(li, dragEl.getBoundingClientRect());
      dragEl.remove();
    } else {
      if (!reducedMotion()) li.classList.add(card.mine ? 'sort-fly-right' : 'sort-fly-left');
      pileEl.querySelector(`[data-id="${card.id}"]`)?.remove();
    }
    clearSelection();
    announce(card);
    verdictEl.textContent = verdictText(card, correct, forced);
    checkComplete();
    onChange({ ...resultsState }, { done: isComplete(), cardId: card.id, correct });
    focusAfterPlacement();
  }

  function handleAttempt(card, chosenMine, { dragEl = null } = {}) {
    if (!card || resultsState[card.id] !== undefined) return;
    const correct = chosenMine === card.mine;
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
    if (inRect(binMineEl)) return true;
    if (inRect(binNotEl)) return false;
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
    binMineEl.classList.toggle('drag-over', hit === true);
    binNotEl.classList.toggle('drag-over', hit === false);
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const finished = drag;
    drag = null;
    try { finished.el.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
    binMineEl.classList.remove('drag-over');
    binNotEl.classList.remove('drag-over');
    if (!finished.moved) return; // a plain tap: the click event handles selection
    suppressClick = true;
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

  function onBinMineClick() { placeSelectedIn(true); }
  function onBinNotClick() { placeSelectedIn(false); }

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
    handleAttempt(cardsById.get(btn.dataset.id), event.key === 'ArrowLeft', {});
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
        resultsState[card.id] = card.mine;
        attempts.delete(card.id);
        const bin = card.mine ? binMineList : binNotList;
        const li = buildBinListItem(card, false);
        bin.appendChild(li);
        if (!reducedMotion()) li.classList.add(card.mine ? 'sort-fly-right' : 'sort-fly-left');
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
      .filter(card => resultsState[card.id] !== undefined && card.mine)
      .map(card => buildBinListItem(card, forcedSet.has(card.id))));
    binNotList.replaceChildren(...cards
      .filter(card => resultsState[card.id] !== undefined && !card.mine)
      .map(card => buildBinListItem(card, forcedSet.has(card.id))));
    verdictEl.textContent = '';
    announceEl.textContent = '';
    skipBtn.disabled = false;
    checkComplete();
  }

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
  container.addEventListener('keydown', onKeydown);

  renderAll();

  return { render: renderAll, skip: exposedSkip, destroy };
}
