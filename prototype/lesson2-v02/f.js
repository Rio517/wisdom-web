// Direction F · The habit picks first. Lesson 1's three options a day. Once an
// activity has happened on its usual day twice, its option arrives already
// chosen on its day: Maya is already heading there, the other two options
// shrink, and the reader only taps Next (or picks something else, which is
// just a missed day). By week two most days are Next, Next, Next. Its card on
// the right shows Maya thinking it over: a bubble with the activity and two
// other things she could do. Each of the first two usual-day starts pops one
// of the others; after the second the bubble is gone and the activity sits
// beside her, and from then on the habit picks.
import { startGame, esc, t, ICONS } from './game.js';
import { maya } from './icons.js';
import { DAYS, habitPicks, branchesLeft, PICKS_FIRST_AFTER } from './model.js';

export function start(app) {
  let habit = null; // { index, kind } while today's option is the habit's pick

  function clearHabit(ctx) {
    if (!habit) return;
    const card = ctx.card(habit.index);
    card?.classList.remove('f-habit');
    card?.querySelector('.f-actions')?.setAttribute('hidden', '');
    const tile = ctx.tile(habit.index, habit.kind);
    tile?.classList.remove('f-picked');
    tile?.setAttribute('aria-pressed', 'false');
    tile?.querySelector('.f-maya')?.remove();
    habit = null;
  }

  startGame(app, 'f', {
    cardExtra: () => `<div class="f-actions" hidden><button type="button" class="btn btn-primary" data-action="f-next">${esc(t('v2.f.next'))}</button></div>`,

    onCurrent(ctx, index) {
      clearHabit(ctx);
      const day = DAYS[index];
      const kind = day.usual;
      if (day.off || !day.options.includes(kind) || !habitPicks(ctx.state.tally[kind])) return;
      habit = { index, kind };
      const card = ctx.card(index);
      const tile = ctx.tile(index, kind);
      card.classList.add('f-habit');
      card.querySelector('.v2-options').dataset.picked = String(day.options.indexOf(kind));
      tile.classList.add('f-picked');
      tile.setAttribute('aria-pressed', 'true');
      tile.insertAdjacentHTML('afterbegin', `<span class="f-maya${ctx.reducedMotion() ? '' : ' is-walking'}" aria-hidden="true">${maya()}</span>`);
      ctx.later(1300, () => tile.querySelector('.f-maya')?.classList.remove('is-walking'));
      const actions = card.querySelector('.f-actions');
      actions.hidden = false;
      actions.querySelector('button').focus({ preventScroll: true });
      ctx.announce(t('v2.sr.picked', { activity: ctx.name(kind) }));
    },

    onOptionTap(ctx, index, option) {
      if (habit && habit.index === index && option !== habit.kind) clearHabit(ctx);
      else if (habit && habit.index === index) { const kind = habit.kind; hideNext(ctx); ctx.choose(index, kind); return true; }
      return false;
    },

    onCardClick(ctx, index, event) {
      if (!event.target.closest('[data-action="f-next"]') || !habit || habit.index !== index) return;
      const kind = habit.kind;
      hideNext(ctx);
      ctx.choose(index, kind);
    },

    onRestart() { habit = null; },

    startMarkup: (ctx, kind) => `<div class="f-think" data-left="${PICKS_FIRST_AFTER}">
        <span class="f-think-maya" aria-hidden="true">${maya()}</span>
        <span class="f-bubble" aria-hidden="true"><i class="f-tail f-tail-1"></i><i class="f-tail f-tail-2"></i></span>
        <span class="f-thought f-thought-b" aria-hidden="true">${ICONS.screen}</span>
        <span class="f-thought f-thought-c" aria-hidden="true">${ICONS.friends}</span>
        <span class="f-thought f-thought-a" aria-hidden="true">${ctx.icon(kind)}</span>
      </div>`,

    startChanged: (ctx, kind, before, after) => branchesLeft(after) < branchesLeft(before),

    paintStart(ctx, kind, { animate }) {
      const think = ctx.box(kind)?.querySelector('.f-think');
      if (!think) return;
      think.dataset.left = String(branchesLeft(ctx.state.tally[kind]));
      think.classList.toggle('is-animating', Boolean(animate) && !ctx.reducedMotion());
      if (animate) ctx.later(1500, () => think.classList.remove('is-animating'));
    },
  });

  function hideNext(ctx) {
    const card = habit && ctx.card(habit.index);
    card?.querySelector('.f-actions')?.setAttribute('hidden', '');
    habit = null;
  }
}
