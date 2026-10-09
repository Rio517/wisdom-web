// Direction C — Typographic. The sentence is the start: on click every word
// shrinks into a dot, the dots gather into the Beginning dot, and the paths
// grow out of it.
import {
  t, escape, view, shell, createField, createToken, prefersReducedMotion, wait,
  settledMarkup, narrationMarkup, showAfter, words,
} from './common.js';

export function start() {
  const { stage, figure, copy, after } = shell('c');
  const home = view === 'home';
  copy.className = 'd-copy d-copy-c';
  copy.innerHTML = home
    ? `<p class="kicker fade">${escape(t('home.v2.kicker'))}</p>
       <h1>${words(t('home.v2.title'))}</h1>
       <p class="d-summary">${words(t('home.v2.summary'))}</p>
       <div class="d-actions fade"><button class="btn btn-primary" type="button" data-go>${escape(t('home.v2.watch'))}</button></div>`
    : `<p class="kicker fade">${escape(t('lesson.beat.cover.kicker'))}</p>
       <h1>${words(t('map.coverQuestion'))}</h1>
       <p class="d-summary">${words(t('map.coverHint'))}</p>
       <div class="d-actions fade"><button class="btn btn-primary" type="button" data-go>${escape(t('lesson.beat.cover.next'))}</button></div>`;

  const field = createField(figure);
  field.cover();
  let token = createToken();

  copy.querySelector('[data-go]').addEventListener('click', async () => {
    token.cancel();
    const run = token = createToken();
    stage.dataset.go = 'true';
    const travel = home;
    if (prefersReducedMotion()) {
      copy.hidden = true;
      field.settle({ travel });
      showAfter(after, home ? settledMarkup() : narrationMarkup());
      return;
    }
    const stageBox = stage.getBoundingClientRect();
    const stackBox = field.stack.getBoundingClientRect();
    const style = getComputedStyle(field.stack);
    const target = {
      x: stackBox.left - stageBox.left + parseFloat(style.getPropertyValue('--ox')),
      y: stackBox.top - stageBox.top + parseFloat(style.getPropertyValue('--oy')),
    };
    for (const item of copy.querySelectorAll('.fade')) {
      item.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    }
    // Each word becomes a dot where it stood (220 ms), then the dots gather
    // at the Beginning, a few milliseconds apart (680 ms at the most).
    const spans = [...copy.querySelectorAll('.w')];
    const flights = spans.map((span, index) => {
      const box = span.getBoundingClientRect();
      const x = box.left - stageBox.left + box.width / 2;
      const y = box.top - stageBox.top + box.height / 2;
      span.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.3)' }],
        { duration: 220, easing: 'ease-in', fill: 'forwards' });
      const dot = document.createElement('i');
      dot.className = 'd-dot';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      stage.append(dot);
      const dx = target.x - x;
      const dy = target.y - y;
      const flight = dot.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1, offset: 0 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.32 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`, opacity: 0.2, offset: 1 },
      ], { duration: 520, delay: Math.min(index * 4, 160), easing: 'cubic-bezier(.55, 0, .3, 1)', fill: 'forwards' });
      return flight.finished.then(() => dot.remove());
    });
    Promise.all(flights).then(() => { copy.hidden = true; });
    if (!(await wait(560, run))) return;
    await field.grow(run, { travel });
    if (run.cancelled) return;
    showAfter(after, home ? settledMarkup() : narrationMarkup());
  });
}
