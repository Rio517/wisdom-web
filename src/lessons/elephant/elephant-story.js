// Lesson 3 · The elephant and the rider: the story's structure (design 004, v02 approved; v03 built).
// Every word lives in the message catalogs (elephant.*); chaptersFor(t) joins the two, so the live
// page, the text version and the readable copy (docs/content/elephant-journey.md) render from one
// record. The lesson's working title and address live here too, so they change in one place.
import { t as runtimeT } from '../../i18n/runtime.js';
import { beatList } from '../choices/journey-story.js';
import { escapeHTML } from '../choices/journey-shell.js';

/** The lesson's address (a working name) and its text version. */
export const ELEPHANT_PATH = '/deciding/elephant-and-rider/';
export const ELEPHANT_READ_PATH = `${ELEPHANT_PATH}read/`;
/** The lesson's title, one key for every page that names it. */
export const ELEPHANT_TITLE = 'elephant.ui.title';

const STRUCTURE = [
  { id: 'pair', beats: [{ id: 'pair', body: 2 }] },
  { id: 'strengths', beats: [{ id: 'quick', body: 2 }, { id: 'slow', body: 2 }, { id: 'now', body: 2 }] },
  { id: 'steering', beats: [{ id: 'reins', body: 2 }, { id: 'path', body: 2 }] },
  { id: 'team', beats: [{ id: 'team', body: 2 }, { id: 'first', body: 2, ownKicker: true }] },
  { id: 'activity', beats: [{ id: 'partners', body: 2, activity: true }] },
  { id: 'keep', beats: [{ id: 'keep', takeaways: ['team', 'learn', 'paths'] }, { id: 'next', body: 1 }] },
];

/** The six moments of the activity and the partner each one needs: the elephant on the left, the rider on the right. */
export const SORT_SIDES = ['elephant', 'rider'];
export const MOMENTS = [
  { id: 'm1', side: 'elephant' }, { id: 'm2', side: 'elephant' }, { id: 'm3', side: 'elephant' },
  { id: 'm4', side: 'rider' }, { id: 'm5', side: 'rider' }, { id: 'm6', side: 'rider' },
];

const range = count => Array.from({ length: count }, (_, i) => i + 1);

/** The activity's cards in the language of `t`: a label and the quiet line shown when it lands. */
export const momentsFor = (t = runtimeT) => MOMENTS.map(card => ({ ...card, label: t(`elephant.sort.card.${card.id}`), line: t(`elephant.sort.quiet.${card.id}`) }));

/** The lesson's chapters and beats in the language of `t`. */
export function chaptersFor(t = runtimeT) {
  return STRUCTURE.map(chapter => ({
    id: chapter.id,
    title: t(`elephant.chapter.${chapter.id}`),
    beats: chapter.beats.map(beat => {
      const key = `elephant.beat.${beat.id}`;
      const record = {
        id: beat.id,
        kicker: beat.ownKicker ? t(`${key}.kicker`) : t(`elephant.chapter.${chapter.id}`),
        heading: t(`${key}.heading`),
        body: range(beat.body ?? 0).map(n => t(`${key}.body${n}`)),
        alt: t(`${key}.alt`),
      };
      if (beat.ownKicker) record.ownKicker = true;
      if (beat.activity) record.activity = true;
      if (beat.takeaways) {
        record.takeaways = beat.takeaways.map(id => ({ icon: id, heading: t(`elephant.takeaway.${id}.heading`), text: t(`elephant.takeaway.${id}.text`) }));
      }
      return record;
    }),
  }));
}

export const CHAPTERS = chaptersFor();
export const beats = () => beatList(CHAPTERS);

function readingBeat(beat, t) {
  const parts = [`<section class="reading-beat" id="read-${beat.id}">`];
  if (beat.ownKicker) parts.push(`<p class="reading-kicker">${escapeHTML(beat.kicker)}</p>`);
  parts.push(`<h3>${escapeHTML(beat.heading)}</h3>`);
  for (const paragraph of beat.body) parts.push(`<p>${escapeHTML(paragraph)}</p>`);
  if (beat.activity) {
    // The activity as a still: each side with its strength and its three moments, each with its line.
    const moments = momentsFor(t);
    parts.push(`<p>${escapeHTML(t('elephant.reading.sort'))}</p>`);
    for (const side of SORT_SIDES) {
      parts.push(`<h4>${escapeHTML(t(`elephant.sort.${side}`))} · ${escapeHTML(t(`elephant.sort.strong.${side}`))}</h4><ul class="reading-sort">`);
      for (const card of moments.filter(item => item.side === side)) parts.push(`<li><strong>${escapeHTML(card.label)}.</strong> ${escapeHTML(card.line)}</li>`);
      parts.push('</ul>');
    }
    parts.push(`<p>${escapeHTML(t('elephant.beat.partners.result'))}</p>`);
  }
  if (beat.alt) parts.push(`<p class="reading-visual"><span>${escapeHTML(t('reading.picture'))}</span> ${escapeHTML(beat.alt)}</p>`);
  if (beat.takeaways) {
    parts.push('<ul class="reading-takeaways">');
    for (const item of beat.takeaways) parts.push(`<li><strong>${escapeHTML(item.heading)}</strong> ${escapeHTML(item.text)}</li>`);
    parts.push('</ul>');
  }
  parts.push('</section>');
  return parts.join('');
}

/** The whole lesson as semantic HTML in the language of `t`. */
export function renderElephantReading({ t = runtimeT } = {}) {
  const chapters = chaptersFor(t).map(chapter => `<section class="reading-chapter" aria-labelledby="read-chapter-${chapter.id}">
<h2 id="read-chapter-${chapter.id}">${escapeHTML(chapter.title)}</h2>
${chapter.beats.map(beat => readingBeat(beat, t)).join('\n')}
</section>`);
  return `<article class="journey-reading" aria-labelledby="journey-reading-title">
<h1 id="journey-reading-title">${escapeHTML(t('elephant.reading.title'))}</h1>
<p class="reading-intro">${escapeHTML(t('reading.intro'))}</p>
${chapters.join('\n')}
</article>`;
}
