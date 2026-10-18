// Lesson 2 · Practice: the story's structure (design 003, v03 picked; v04 built). Every word
// lives in the message catalogs (practice.*); chaptersFor(t) joins the two, so the live page, the
// text version and the readable copy (docs/content/practice-journey.md) render from one record.
// The lesson's working title and address live here too, so they change in one place.
import { t as runtimeT } from '../../i18n/runtime.js';
import { beatList } from '../choices/journey-story.js';
import { escapeHTML } from '../choices/journey-shell.js';
import { DAYS, ACTIVITIES, activityGroup } from './practice-afternoons-data.js';

/** The lesson's address (a working name, unlinked until it is approved) and its text version. */
export const PRACTICE_PATH = '/practice/small-choices/';
export const PRACTICE_READ_PATH = `${PRACTICE_PATH}read/`;

const STRUCTURE = [
  { id: 'small', beats: [{ id: 'want', body: 2 }, { id: 'again', body: 3 }, { id: 'quiet', body: 2 }] },
  { id: 'adding', beats: [{ id: 'map', body: 2 }, { id: 'steps', body: 2 }, { id: 'builds', body: 2 }, { id: 'maths', body: 2 }] },
  { id: 'new', beats: [{ id: 'basketball', body: 2 }, { id: 'late', body: 2 }] },
  { id: 'activity', beats: [{ id: 'afternoons', activity: true }] },
  { id: 'keep', beats: [{ id: 'keep', takeaways: ['big', 'build', 'start'] }, { id: 'next', body: 2 }] },
];

const range = count => Array.from({ length: count }, (_, i) => i + 1);

/** The lesson's chapters and beats in the language of `t`. */
export function chaptersFor(t = runtimeT) {
  return STRUCTURE.map(chapter => ({
    id: chapter.id,
    title: t(`practice.chapter.${chapter.id}`),
    beats: chapter.beats.map(beat => {
      const key = `practice.beat.${beat.id}`;
      const record = {
        id: beat.id,
        kicker: t(`practice.chapter.${chapter.id}`),
        heading: t(`${key}.heading`),
        body: beat.activity ? [t(`${key}.body.start`)] : range(beat.body ?? 0).map(n => t(`${key}.body${n}`)),
        alt: t(`${key}.alt`),
      };
      if (beat.activity) record.activity = true;
      if (beat.takeaways) {
        record.takeaways = beat.takeaways.map(id => ({ icon: id, heading: t(`practice.takeaway.${id}.heading`), text: t(`practice.takeaway.${id}.text`) }));
      }
      return record;
    }),
  }));
}

export const CHAPTERS = chaptersFor();
export const beats = () => beatList(CHAPTERS);

/** The ten afternoons as text: each day's words and its three choices, with what each one grows. */
export function afternoonsFor(t = runtimeT) {
  return DAYS.map((day, index) => ({
    label: t('practice.activity.dayLabel', { n: index + 1, total: DAYS.length, weekday: t(`game.weekday.${day.weekday}`) }),
    chance: day.chance ? t('practice.activity.new') : '',
    text: t(`practice.activity.day${index + 1}`),
    options: day.options.map(id => ({ id, label: t(`practice.activity.option.${id}`), kind: kindLabel(ACTIVITIES[id], t) })),
  }));
}

/** The small caption under a choice: what it grows. */
export function kindLabel(activity, t = runtimeT) {
  const group = activityGroup(activity);
  return group === 'rest' ? t('practice.activity.kind.rest') : t(`game.group.${group}`);
}

function readingBeat(beat, t) {
  const parts = [`<section class="reading-beat" id="read-${beat.id}">`, `<h3>${escapeHTML(beat.heading)}</h3>`];
  for (const paragraph of beat.body) parts.push(`<p>${escapeHTML(paragraph)}</p>`);
  if (beat.activity) {
    // The activity as a still: every afternoon and its three choices, then what the end shows.
    parts.push(`<p>${escapeHTML(t('practice.reading.days'))}</p><ol class="reading-steps">`);
    for (const day of afternoonsFor(t)) {
      parts.push(`<li><strong>${escapeHTML(day.label)}${day.chance ? ` · ${escapeHTML(day.chance)}` : ''}</strong> ${escapeHTML(day.text)} ${day.options.map(option => `${escapeHTML(option.label)} (${escapeHTML(option.kind)})`).join(' · ')}</li>`);
    }
    parts.push('</ol>');
    parts.push(`<p>${escapeHTML(t('practice.beat.afternoons.body.new'))}</p>`);
    parts.push(`<p>${escapeHTML(t('practice.beat.afternoons.body.end'))}</p>`);
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
export function renderPracticeReading({ t = runtimeT } = {}) {
  const chapters = chaptersFor(t).map(chapter => `<section class="reading-chapter" aria-labelledby="read-chapter-${chapter.id}">
<h2 id="read-chapter-${chapter.id}">${escapeHTML(chapter.title)}</h2>
${chapter.beats.map(beat => readingBeat(beat, t)).join('\n')}
</section>`);
  return `<article class="journey-reading" aria-labelledby="journey-reading-title">
<h1 id="journey-reading-title">${escapeHTML(t('practice.reading.title'))}</h1>
<p class="reading-intro">${escapeHTML(t('reading.intro'))}</p>
${chapters.join('\n')}
</article>`;
}
