// Direction A — Stage. One large sentence in the middle of a faint field.
// On click the lines lift and fade, one after another, and the paths grow out
// from the Beginning dot to fill the screen.
import {
  t, escape, view, shell, createField, createToken, prefersReducedMotion, wait,
  settledMarkup, narrationMarkup, showAfter,
} from './common.js';

export function start() {
  const { stage, figure, copy, after } = shell('a');
  const home = view === 'home';
  copy.className = 'd-copy d-copy-a';
  copy.innerHTML = home
    ? `<p class="kicker lift">${escape(t('home.v2.kicker'))}</p>
       <h1 class="lift">${escape(t('home.v2.title'))}</h1>
       <p class="d-summary lift">${escape(t('home.v2.summary'))}</p>
       <div class="d-actions lift"><button class="btn btn-primary" type="button" data-go>${escape(t('home.v2.watch'))}</button></div>`
    : `<p class="kicker lift">${escape(t('lesson.beat.cover.kicker'))}</p>
       <h1 class="lift">${escape(t('map.coverQuestion'))}</h1>
       <p class="d-summary lift">${escape(t('map.coverHint'))}</p>
       <div class="d-actions lift"><button class="btn btn-primary" type="button" data-go>${escape(t('lesson.beat.cover.next'))}</button></div>`;

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
    // Lines lift and fade in turn: 480 ms each, 70 ms apart (690 ms in all).
    const lines = [...copy.querySelectorAll('.lift')];
    const exits = lines.map((line, index) => line.animate(
      [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-36px)', opacity: 0 }],
      { duration: 480, delay: index * 70, easing: 'cubic-bezier(.4, 0, .7, .2)', fill: 'forwards' },
    ));
    Promise.all(exits.map(exit => exit.finished)).then(() => { copy.hidden = true; });
    // The paths start before the words have quite gone.
    if (!(await wait(320, run))) return;
    await field.grow(run, { travel });
    if (run.cancelled) return;
    showAfter(after, home ? settledMarkup() : narrationMarkup());
  });
}
