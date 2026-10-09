// The lesson's structure. Every word lives in the message catalogs
// (lesson.*, game.*, explore.*); chaptersFor(t) joins the two. The live page
// and the static reading (build-time and no-JavaScript) render from the same
// records. Editable English draft: docs/content/choices-journey.md.
import { t as runtimeT } from '../../i18n/runtime.js';
import { CHOICE_BANDS, bandChoices, EXAMPLE_CHAINS, STEPS, stepLabel } from './journey-choices.js';

const STRUCTURE = [
  { id: 'paths', beats: [
    { id: 'cover', body: 2, next: true, ownKicker: true },
    { id: 'many', body: 1 },
    { id: 'travel', body: 2 },
    { id: 'outside', body: 2, next: true },
  ] },
  { id: 'hike', beats: [
    { id: 'plan', body: 2 },
    { id: 'halfway', body: 1, choice: [{ id: 'continue' }, { id: 'turn', story: true }] },
    { id: 'turnback', body: 2, learned: ['water'] },
    { id: 'practice', body: 2, learned: ['map', 'landmarks', 'rest'] },
    { id: 'retry', body: 2 },
    { id: 'closed', body: 1, choice: [{ id: 'sneak' }, { id: 'home' }, { id: 'ask', story: true }] },
    { id: 'respond', body: 2, closer: 2 },
    { id: 'sort', body: 1, sort: [
      { id: 'pack', mine: true }, { id: 'storm', mine: false }, { id: 'back', mine: true },
      { id: 'ranger', mine: false }, { id: 'practise', mine: true }, { id: 'ask', mine: true },
    ] },
  ] },
  { id: 'skills', beats: [
    { id: 'fork', body: 2 },
    { id: 'slow', body: 2 },
    { id: 'builds', body: 2, scrub: true },
    { id: 'transfer', body: 2 },
    { id: 'never-late', body: 2 },
  ] },
  { id: 'play', beats: [{ id: 'game', body: 2, game: true }] },
  { id: 'explore', beats: [{ id: 'explore', body: 1, explore: true }] },
  { id: 'wrap', short: true, beats: [{ id: 'takeaways', body: 1, takeaways: ['add', 'build', 'weather'] }] },
];

const range = count => Array.from({ length: count }, (_, i) => i + 1);

/** The lesson's chapters and beats in the language of `t`. */
export function chaptersFor(t = runtimeT) {
  return STRUCTURE.map(chapter => ({
    id: chapter.id,
    title: t(`lesson.chapter.${chapter.id}`),
    short: chapter.short ? t(`lesson.chapter.${chapter.id}.short`) : undefined,
    beats: chapter.beats.map(beat => {
      const key = `lesson.beat.${beat.id}`;
      const record = {
        id: beat.id,
        kicker: t(beat.ownKicker ? `${key}.kicker` : `lesson.chapter.${chapter.id}.kicker`),
        heading: t(`${key}.heading`),
        body: range(beat.body).map(n => t(`${key}.body${n}`)),
        alt: t(`${key}.alt`),
      };
      if (beat.next) record.next = t(`${key}.next`);
      if (beat.choice) {
        record.choice = {
          prompt: t(`${key}.prompt`),
          options: beat.choice.map(option => ({
            id: option.id,
            story: option.story ?? false,
            label: t(`${key}.option.${option.id}`),
            feedback: t(`${key}.option.${option.id}.feedback`),
          })),
        };
      }
      if (beat.learned) record.learned = beat.learned;
      if (beat.sort) record.sort = beat.sort.map(card => ({ ...card, label: t(`lesson.sort.${card.id}`) }));
      if (beat.closer) record.closer = { heading: t(`${key}.closer.heading`), body: range(beat.closer).map(n => t(`${key}.closer.body${n}`)) };
      if (beat.scrub) record.scrub = true;
      if (beat.game) record.game = true;
      if (beat.explore) record.explore = true;
      if (beat.takeaways) {
        record.takeaways = beat.takeaways.map(icon => ({
          icon, heading: t(`lesson.takeaway.${icon}.heading`), text: t(`lesson.takeaway.${icon}.text`),
        }));
      }
      return record;
    }),
  }));
}

/** Chapters in the page's language. */
export const CHAPTERS = chaptersFor();

const LEARNED_ICONS = { water: 'water', map: 'map', landmarks: 'eye', rest: 'rest' };
export function learnedFor(t = runtimeT) {
  return Object.fromEntries(Object.entries(LEARNED_ICONS).map(([id, icon]) => [id, { icon, label: t(`lesson.learned.${id}`) }]));
}
export const LEARNED = learnedFor();

export function beatList(chapters = CHAPTERS) {
  return chapters.flatMap((chapter, chapterIndex) => chapter.beats.map((beat, beatIndex) => ({
    chapter, chapterIndex, beat, beatIndex, fragment: `${chapter.id}-${beat.id}`,
  })));
}

const escapeHTML = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function readingBeat(beat, { t, learned, gameDays }) {
  const parts = [`<section class="reading-beat" id="read-${beat.id}">`, `<h3>${escapeHTML(beat.heading)}</h3>`];
  for (const paragraph of beat.body) parts.push(`<p>${escapeHTML(paragraph)}</p>`);
  if (beat.alt) parts.push(`<p class="reading-visual"><span>${escapeHTML(t('reading.picture'))}</span> ${escapeHTML(beat.alt)}</p>`);
  if (beat.choice) {
    parts.push(`<p><strong>${escapeHTML(beat.choice.prompt)}</strong></p><dl class="reading-choices">`);
    for (const option of beat.choice.options) {
      parts.push(`<dt>${escapeHTML(option.label)}${option.story ? ` <em>${escapeHTML(t('reading.whatTheyChose'))}</em>` : ''}</dt><dd>${escapeHTML(option.feedback)}</dd>`);
    }
    parts.push('</dl>');
  }
  if (beat.learned) {
    parts.push(`<p class="reading-learned">${escapeHTML(t('reading.carriedForward', { items: beat.learned.map(id => learned[id].label).join(' · ') }))}</p>`);
  }
  if (beat.sort) {
    const mine = beat.sort.filter(item => item.mine).map(item => escapeHTML(item.label));
    const not = beat.sort.filter(item => !item.mine).map(item => escapeHTML(item.label));
    parts.push(`<div class="reading-sort"><p><strong>${escapeHTML(t('reading.theirChoices'))}</strong> ${mine.join(' · ')}</p><p><strong>${escapeHTML(t('reading.outsideControl'))}</strong> ${not.join(' · ')}</p></div>`);
  }
  if (beat.closer) {
    parts.push(`<aside class="reading-closer"><h4>${escapeHTML(beat.closer.heading)}</h4>${beat.closer.body.map(p => `<p>${escapeHTML(p)}</p>`).join('')}</aside>`);
  }
  if (beat.game && gameDays) {
    parts.push(`<p>${escapeHTML(t('reading.gameIntro'))}</p><ol class="reading-days">`);
    for (const day of gameDays) {
      parts.push(`<li><strong>${escapeHTML(day.label)}.</strong> ${escapeHTML(day.situation)} <span>${escapeHTML(t('reading.dayChoices', { choices: day.options.map(option => option.label).join(' · ') }))}</span></li>`);
    }
    parts.push(`</ol><p>${escapeHTML(t('reading.gameOutro'))}</p>`);
  }
  if (beat.explore) {
    parts.push(`<p>${escapeHTML(t('reading.exploreIntro'))}</p><ul class="reading-examples">`);
    let from = 3;
    for (const band of CHOICE_BANDS) {
      const until = Number.isFinite(band.until) ? band.until - 1 : 70;
      const range = t(band.by === 'family' ? 'reading.ageRangeFamily' : 'reading.ageRange', { from, until });
      parts.push(`<li><strong>${escapeHTML(range)}</strong> ${bandChoices(band, t).slice(0, 4).map(escapeHTML).join(' · ')}</li>`);
      from = band.until;
    }
    parts.push(`</ul><p>${escapeHTML(t('reading.exploreChains'))}</p><ul class="reading-examples">`);
    for (const chain of EXAMPLE_CHAINS) {
      const steps = chain.map(id => (STEPS[id].kind === 'choice' ? stepLabel(id, t)
        : t('reading.chainStep', { kind: t(`explore.kind.${STEPS[id].kind}`), event: stepLabel(id, t) })));
      parts.push(`<li>${steps.map(escapeHTML).join(' → ')}</li>`);
    }
    parts.push(`</ul><p>${escapeHTML(t('reading.exploreOutro'))}</p>`);
  }
  if (beat.takeaways) {
    parts.push('<ul class="reading-takeaways">');
    for (const item of beat.takeaways) parts.push(`<li><strong>${escapeHTML(item.heading)}</strong> ${escapeHTML(item.text)}</li>`);
    parts.push('</ul>');
  }
  parts.push('</section>');
  return parts.join('');
}

/** The whole lesson as semantic HTML in the language of `t`. */
export function renderJourneyReading({ t = runtimeT, gameDays = null } = {}) {
  const learned = learnedFor(t);
  const chapters = chaptersFor(t).map(chapter => `<section class="reading-chapter" aria-labelledby="read-chapter-${chapter.id}">
<h2 id="read-chapter-${chapter.id}">${escapeHTML(chapter.title)}</h2>
${chapter.beats.map(beat => readingBeat(beat, { t, learned, gameDays })).join('\n')}
</section>`);
  return `<article class="journey-reading" aria-labelledby="journey-reading-title">
<h1 id="journey-reading-title">${escapeHTML(t('reading.title'))}</h1>
<p class="reading-intro">${escapeHTML(t('reading.intro'))}</p>
${chapters.join('\n')}
</article>`;
}
