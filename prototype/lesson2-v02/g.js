// Direction G · Plainer. Lesson 1's game as it was, stretched to fourteen
// days: one tap a day, the feed moves on by itself. The one addition is each
// card's starting row: Maya on a short path to the activity's picture. Each
// start on the activity's usual day she walks one step closer; after four
// she is there. Misses never move her back.
import { startGame } from './game.js';
import { maya } from './icons.js';
import { walkStep, WALK_STEPS } from './model.js';

const WALK_MS = 1300;

export function start(app) {
  startGame(app, 'g', {
    startMarkup: (ctx, kind) => `<div class="g-walk" style="--p:0">
        <span class="g-path" aria-hidden="true"><i class="g-path-done"></i></span>
        <span class="g-maya" aria-hidden="true">${maya()}</span>
        <span class="g-goal" aria-hidden="true">${ctx.icon(kind)}</span>
      </div>`,
    startChanged: (ctx, kind, before, after) => walkStep(after) > walkStep(before),
    paintStart(ctx, kind, { animate }) {
      const walk = ctx.box(kind)?.querySelector('.g-walk');
      if (!walk) return;
      const step = walkStep(ctx.state.tally[kind]);
      walk.style.setProperty('--p', String(step / WALK_STEPS));
      walk.dataset.step = String(step);
      walk.classList.toggle('is-there', step >= WALK_STEPS);
      if (!animate || ctx.reducedMotion()) return;
      walk.classList.add('is-walking');
      ctx.later(WALK_MS, () => {
        walk.classList.remove('is-walking');
        if (step >= WALK_STEPS) {
          const goal = walk.querySelector('.g-goal');
          goal.classList.remove('play-pop');
          void goal.offsetWidth;
          goal.classList.add('play-pop');
        }
      });
    },
  });
}
