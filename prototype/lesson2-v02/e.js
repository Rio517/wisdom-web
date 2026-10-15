// Direction E · Fewer steps. Getting going is a short sequence the reader taps
// through on the day's card: for cello, open the case, music out, play. Each
// time an activity happens on its usual day, one step is already done next
// time (the case stays open), down to a single tap. Its card on the right
// shows the steps as small pictures; a step that is done for good drops away.
// A missed day brings no step back; after the first two misses at most one
// step returns, ever. The other options are always one tap.
import { startGame, t, ICONS } from './game.js';
import { ACTIVITY_ICON } from './icons.js';
import { KINDS, STEPS, ALL_STEPS, stepsLeft } from './model.js';

const DROP_MS = 1500; // the dropped step falls and fades, then the row closes up

const GO_LABEL = { drawing: 'drawing', reading: 'reading', lego: 'lego' };
const goKey = (kind, activity) => (kind === 'sport' ? 'v2.go.sport' : GO_LABEL[activity] ? `v2.go.${GO_LABEL[activity]}` : 'v2.go.play');

/** All three steps of an activity, as { icon, label }; the last is the activity itself. */
function allSteps(ctx, kind) {
  const activity = ctx.activity(kind);
  return [
    ...STEPS[activity].map(step => ({ icon: ICONS[step], label: t(`v2.step.${step}`) })),
    { icon: ICONS[ACTIVITY_ICON[activity]], label: t(goKey(kind, activity)), go: true },
  ];
}

export function start(app) {
  let progress = null; // { index, kind, steps, done } for today's activity tile

  function tileState(ctx, index, kind) {
    const steps = allSteps(ctx, kind).slice(ALL_STEPS - stepsLeft(ctx.state.tally[kind]));
    return { index, kind, steps, done: 0 };
  }

  function paintTile(ctx, tile, p, { dropped = false } = {}) {
    const caption = tile.querySelector('.e-caption');
    const pips = tile.querySelector('.e-pips');
    const current = p.steps[p.done];
    caption.textContent = current.label;
    pips.innerHTML = p.steps.map((step, i) => `<span class="e-pip${i < p.done ? ' is-done' : ''}${i === p.done ? ' is-now' : ''}${step.go ? ' is-go' : ''}">${step.icon}</span>`).join('');
    pips.dataset.count = String(p.steps.length);
    tile.setAttribute('aria-label', `${ctx.optionLabel(p.kind)}. ${current.label}. ${t('v2.sr.steps', { count: p.steps.length - p.done })}`);
    if (dropped && !ctx.reducedMotion()) {
      const gone = pips.children[p.done - 1];
      gone?.classList.add('is-dropping');
    }
  }

  startGame(app, 'e', {
    optionInner: (ctx, index, option) => (KINDS.includes(option)
      ? '<span class="e-caption play-activity-kind" aria-hidden="true"></span><span class="e-pips" aria-hidden="true"></span>'
      : ''),

    onCurrent(ctx, index) {
      progress = null;
      ctx.card(index).querySelectorAll('.v2-opt[data-kind]').forEach(tile => paintTile(ctx, tile, tileState(ctx, index, tile.dataset.kind)));
    },

    onOptionTap(ctx, index, option, tile) {
      if (!KINDS.includes(option)) { progress = null; return false; }
      if (!progress || progress.kind !== option || progress.index !== index) {
        // Switching tiles mid-way leaves the other tile where it was.
        progress = tileState(ctx, index, option);
      }
      if (progress.done >= progress.steps.length - 1) return false; // the last step starts it
      progress.done += 1;
      tile.classList.add('is-going');
      paintTile(ctx, tile, progress, { dropped: true });
      const icon = tile.querySelector('.e-pip.is-now');
      icon?.classList.add('play-pop');
      return true;
    },

    startMarkup: (ctx, kind) => `<div class="e-steps" data-left="${ALL_STEPS}">${allSteps(ctx, kind).map((step, i) => `<span class="e-step${step.go ? ' is-go' : ''}" data-step="${i}" aria-hidden="true">${step.icon}</span>`).join('<i class="e-arrow" aria-hidden="true"></i>')}</div>`,

    startChanged: (ctx, kind, before, after) => stepsLeft(after) < stepsLeft(before),

    paintStart(ctx, kind, { animate }) {
      const row = ctx.box(kind)?.querySelector('.e-steps');
      if (!row) return;
      const left = stepsLeft(ctx.state.tally[kind]);
      const gone = ALL_STEPS - left;
      const was = Number(row.dataset.left);
      row.dataset.left = String(left);
      row.querySelectorAll('.e-step').forEach(step => {
        const i = Number(step.dataset.step);
        const isGone = i < gone;
        const justGone = animate && isGone && i >= ALL_STEPS - was && !ctx.reducedMotion();
        step.classList.remove('is-dropping');
        if (justGone) {
          step.classList.add('is-dropping');
          step.nextElementSibling?.classList.add('is-dropping');
          ctx.later(DROP_MS, () => {
            step.classList.remove('is-dropping');
            step.classList.add('is-gone');
            step.nextElementSibling?.classList.remove('is-dropping');
            step.nextElementSibling?.classList.add('is-gone');
          });
        } else {
          step.classList.toggle('is-gone', isGone);
          step.nextElementSibling?.classList.toggle('is-gone', isGone);
        }
      });
    },
  });
}
