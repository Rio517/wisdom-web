// Direction B — Left third. The opening sits on the left, the field waits on
// the right. On click the words slide away to the left, the field glides to
// the middle and widens to the whole stage, and the paths grow.
import {
  t, escape, view, shell, createField, createToken, prefersReducedMotion, wait,
  settledMarkup, narrationMarkup, showAfter,
} from './common.js';

export function start() {
  const { stage, figure, copy, after } = shell('b');
  const home = view === 'home';
  stage.classList.add('d-stage-b');
  copy.className = 'd-copy d-copy-b';
  copy.innerHTML = home
    ? `<p class="kicker slide">${escape(t('home.v2.kicker'))}</p>
       <h1 class="slide">${escape(t('home.v2.title'))}</h1>
       <p class="d-summary slide">${escape(t('home.v2.summary'))}</p>
       <div class="d-actions slide"><button class="btn btn-primary" type="button" data-go>${escape(t('home.v2.watch'))}</button></div>`
    : `<p class="kicker slide">${escape(t('lesson.beat.cover.kicker'))}</p>
       <h1 class="slide">${escape(t('map.coverQuestion'))}</h1>
       <p class="d-summary slide">${escape(t('map.coverHint'))}</p>
       <div class="d-actions slide"><button class="btn btn-primary" type="button" data-go>${escape(t('lesson.beat.cover.next'))}</button></div>`;

  // The field is laid out at full size from the start and only slid, so
  // moving it never resizes (or repaints) the canvases.
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
      stage.dataset.moved = 'true';
      stage.dataset.arrived = 'true';
      field.settle({ travel });
      showAfter(after, home ? settledMarkup() : narrationMarkup());
      return;
    }
    const lines = [...copy.querySelectorAll('.slide')];
    const exits = lines.map((line, index) => line.animate(
      [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-64px)', opacity: 0 }],
      { duration: 420, delay: index * 60, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' },
    ));
    Promise.all(exits.map(exit => exit.finished)).then(() => { copy.hidden = true; });
    if (!(await wait(240, run))) return;
    stage.dataset.moved = 'true';
    figure.addEventListener('transitionend', () => { stage.dataset.arrived = 'true'; }, { once: true });
    if (!(await wait(260, run))) return;
    await field.grow(run, { travel });
    if (run.cancelled) return;
    showAfter(after, home ? settledMarkup() : narrationMarkup());
  });
}
