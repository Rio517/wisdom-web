// What a home routine can do on each day, for the directions that work by
// moments (A and C). No option is wrong: each one is a real afternoon.
import { DAYS, momentFit } from './model.js';
import { t } from './ui.js';

const icon = routine => (routine === 'cello' ? 'cello' : 'book');

/**
 * The options for one routine on one day, or null when the day is plain and
 * `ask` is 'events' (direction C plays plain days by itself). Each option:
 * { label, kind, icon, how, tired?, extra?, alt? } where `alt` is the icon
 * shown on the calendar for a day off. `snag` names the routine the
 * bad-luck day hits (the cello string, or the book left at school).
 */
export function routineOptions(routine, index, moment, { ask = 'always', snag = routine } = {}) {
  const day = DAYS[index];
  const fit = momentFit(moment, day);
  const now = { kind: 'moment', how: 'moment', icon: icon(routine), label: t(`l2.opt.moment.${routine}`) };
  const tired = { ...now, tired: true, label: t(`l2.opt.tired.${routine}`) };
  const later = { kind: 'other', how: 'other', icon: 'clock', label: t(`l2.opt.later.${routine}`) };
  const early = { kind: 'other', how: 'other', icon: 'clock', label: t(`l2.opt.early.${routine}`) };
  const weekend = { kind: 'other', how: 'other', icon: 'morning', label: t(`l2.opt.weekend.${routine}`) };
  const rest = key => ({ kind: 'rest', how: 'rest', icon: 'rest', label: t(key), alt: 'restSmall' });
  const skip = (key, alt, extra = []) => ({ kind: 'skip', how: 'skip', icon: alt, label: t(`l2.opt.skip.${key}`), alt, extra });
  const events = ask === 'events';

  if (day.event === 'snag' && snag === routine) {
    return [
      { kind: 'luck', how: 'luck', icon: routine === 'cello' ? 'snap' : 'book', label: t(routine === 'cello' ? 'l2.opt.luck.fix' : 'l2.opt.luck.borrow') },
      { kind: 'luck', how: 'luck', icon: 'ball', label: t('l2.opt.luck.ball'), extra: ['hallway'] },
    ];
  }
  if (fit === 'weekend') return [weekend, rest('l2.opt.restWeekend')];
  if (day.tempt === 'party') {
    return moment === 'snack'
      ? [skip('party', 'party'), { ...now, label: t(`l2.opt.stay.${routine}`) }]
      : [{ ...now, label: t(`l2.opt.partyThen.${routine}`) }, skip('partyLate', 'party')];
  }
  if (fit === 'busy') return [early, skip('cousins', 'friends')];
  if (fit === 'gone') return events ? null : [later, rest('l2.opt.rest')];
  if (fit === 'tired') {
    if (events && day.kind === 'soccer') return null; // played by itself, yawning
    return [tired, rest('l2.opt.restTired')];
  }
  if (day.tempt === 'cousins') return events ? null : [now, skip('cousins', 'friends')];
  if (day.tempt === 'tag') return events && moment !== 'snack' ? null : [now, skip('tag', 'friends')];
  if (day.event === 'rain') return events ? null : [now, skip('hallway', 'ball', ['hallway']), skip('fort', 'fort')];
  if (day.kind === 'sunday') return events ? null : [now, rest('l2.opt.restWeekend')];
  return events ? null : [now, skip('videos', 'screen')];
}

/** How a plain day plays by itself in direction C. */
export function autoHow(moment, index) {
  const fit = momentFit(moment, DAYS[index]);
  if (fit === 'gone') return { how: 'gone' };
  if (fit === 'tired') return { how: 'moment', tired: true };
  return { how: 'moment' };
}

/** The narrative sentence for what a routine did on a day. */
export function resultLine(routine, item, index) {
  const day = DAYS[index];
  switch (item.how) {
    case 'moment': return item.tired ? t(`l2.res.tired.${routine}`) : t(`l2.res.moment.${routine}.${item.stageBefore}`);
    case 'other': return t(`l2.res.other.${routine}`);
    case 'skip': return item.moved === 'down' ? t(`l2.res.slip.${routine}`) : t(`l2.res.skip.${routine}`);
    case 'rest': return t(day.kind === 'weekend' || day.kind === 'sunday' ? 'l2.res.restWeekend' : 'l2.res.rest');
    case 'luck': return t(`l2.res.luck.${routine}`);
    case 'gone': return t('l2.res.gone');
    default: return '';
  }
}

/** Soccer's line for the day, if any: set up for you, cancelled, or a lucky break. */
export function soccerLine(entry) {
  const day = DAYS[entry.index];
  if (day.event === 'rain') return t('l2.res.rain');
  if (entry.soccer.includes('trick')) return t('l2.res.trick');
  // The first practice says who started it; later ones say it in a few words.
  const first = DAYS.findIndex(other => other.kind === 'soccer' && !other.event);
  if (entry.soccer.includes('soccer')) return t(entry.index === first ? 'l2.res.soccer' : 'l2.res.soccerAgain');
  return '';
}
