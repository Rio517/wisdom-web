// The lesson's structure. Every word lives in the message catalogs
// (lesson.*, reading.*, explore.*); chaptersFor(t) joins the two. The live page
// and the static reading (build-time and no-JavaScript) render from the same
// records. Editable English draft: docs/content/choices-journey.md.
// "Many paths" tells one life from the lives store (design 001 v13): its beats'
// words name that person, so chaptersFor takes the life on screen (Sam's in the
// static reading, which has no script).
import { t as runtimeT } from '../../i18n/runtime.js';
import { CHOICE_BANDS, bandChoices, EXAMPLE_CHAINS, STEPS, stepLabel } from './journey-choices.js';
import { addsNamed } from './journey-life-player.js';

const STRUCTURE = [
  { id: 'paths', beats: [
    { id: 'cover', body: 2, next: true, ownKicker: true },
    { id: 'life', body: 0, life: true },
    { id: 'adds', body: 0, adds: true },
  ] },
  { id: 'hike', beats: [
    { id: 'plan', body: 2 },
    { id: 'halfway', body: 1, choice: [{ id: 'continue' }, { id: 'turn', story: true }] },
    { id: 'turnback', body: 2, learned: ['water'] },
    { id: 'practice', body: 1, learned: ['map', 'landmarks', 'rest'], practised: true },
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
    { id: 'builds', body: 2, scrub: true, closer: 2, closerPicture: true },
    { id: 'never-late', body: 2 },
  ] },
  { id: 'explore', beats: [{ id: 'explore', body: 1, explore: true }] },
  { id: 'wrap', short: true, beats: [{ id: 'takeaways', body: 1, takeaways: ['add', 'build', 'weather'] }] },
];

const range = count => Array.from({ length: count }, (_, i) => i + 1);

/** The words of a beat that tell the life on screen (`life`, a written or played life), or none without one. */
function lifeWords(beat, t, life) {
  if (beat.life) {
    return {
      body: [],
      alt: life ? t('lesson.beat.life.alt', { name: life.name, end: life.end }) : '',
      steps: life ? [...life.steps.map(step => ({ age: step.age, line: step.line })), { close: true, line: t('lesson.beat.life.close') }] : [],
      change: life ? t('opening.reading.change', { name: life.name, pronoun: life.pronoun }) : '',
    };
  }
  if (beat.adds) {
    if (!life) return { body: [], alt: '' };
    // Sam's own words, or words that fit any life.
    const body = [life.id === 'sam' ? t('lesson.beat.adds.body1') : t('opening.adds.body', { name: life.name, pronoun: life.pronoun })];
    const [choice, luck, notHis] = addsNamed(life).map(item => life.steps[item.step].label);
    const alt = choice && luck && notHis
      ? t('opening.adds.alt', { name: life.name, pronoun: life.pronoun, choice, luck, notHis })
      : t('opening.adds.altShort', { name: life.name });
    return { body, alt };
  }
  return null;
}

/** The lesson's chapters and beats in the language of `t`, "Many paths" told for `life` (see lifeWords). */
export function chaptersFor(t = runtimeT, life = null) {
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
        body: range(beat.body ?? 0).map(n => t(`${key}.body${n}`)),
        alt: beat.life || beat.adds ? '' : beat.id === 'takeaways' ? (life ? t(`${key}.alt`, { name: life.name, end: life.end }) : '') : t(`${key}.alt`),
      };
      if (beat.life || beat.adds) Object.assign(record, lifeWords(beat, t, life), { [beat.life ? 'life' : 'adds']: true });
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
      // What each practice walk was for: a card in the story column, one sentence each.
      if (beat.practised) record.practised = beat.learned.map(id => ({ id, text: t(`lesson.practised.${id}`) }));
      if (beat.sort) record.sort = beat.sort.map(card => ({ ...card, label: t(`lesson.sort.${card.id}`) }));
      if (beat.closer) {
        record.closer = { heading: t(`${key}.closer.heading`), body: range(beat.closer).map(n => t(`${key}.closer.body${n}`)) };
        if (beat.closerPicture) record.closer.alt = t(`${key}.closer.alt`);
      }
      if (beat.scrub) record.scrub = true;
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

/** Fragments of beats that were merged or removed, so old links land on the beat that holds their words or comes next. */
export const FRAGMENT_ALIASES = {
  'skills-slow': 'skills-fork', 'skills-transfer': 'skills-builds', 'play-game': 'explore-explore',
  // The opening's one life replaced the field, the traveller and the closed ways (design 001 v13).
  'paths-many': 'paths-life', 'paths-travel': 'paths-life', 'paths-outside': 'paths-adds',
};

export function beatList(chapters = CHAPTERS) {
  return chapters.flatMap((chapter, chapterIndex) => chapter.beats.map((beat, beatIndex) => ({
    chapter, chapterIndex, beat, beatIndex, fragment: `${chapter.id}-${beat.id}`,
  })));
}

const escapeHTML = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function readingBeat(beat, { t, learned }) {
  const parts = [`<section class="reading-beat" id="read-${beat.id}">`, `<h3>${escapeHTML(beat.heading)}</h3>`];
  for (const paragraph of beat.body) parts.push(`<p>${escapeHTML(paragraph)}</p>`);
  // The practice cards say what was learned, so the carried-forward line is left to them.
  if (beat.practised) {
    parts.push(`<ul class="reading-practised">${beat.practised.map(card => `<li><strong>${escapeHTML(learned[card.id].label)}</strong> ${escapeHTML(card.text)}</li>`).join('')}</ul>`);
  }
  // The life, step by step as the story tells it, then how to change a choice, then the picture.
  if (beat.life) {
    parts.push(`<ol class="reading-steps">${beat.steps.map(step => `<li>${step.close ? '' : `<strong>${escapeHTML(t('lesson.ui.age', { age: step.age }))}</strong> `}${escapeHTML(step.line)}</li>`).join('')}</ol>`);
    if (beat.change) parts.push(`<p>${escapeHTML(beat.change)}</p>`);
  }
  if (beat.alt) parts.push(`<p class="reading-visual"><span>${escapeHTML(t('reading.picture'))}</span> ${escapeHTML(beat.alt)}</p>`);
  if (beat.choice) {
    parts.push(`<p><strong>${escapeHTML(beat.choice.prompt)}</strong></p><dl class="reading-choices">`);
    for (const option of beat.choice.options) {
      parts.push(`<dt>${escapeHTML(option.label)}${option.story ? ` <em>${escapeHTML(t('reading.whatTheyChose'))}</em>` : ''}</dt><dd>${escapeHTML(option.feedback)}</dd>`);
    }
    parts.push('</dl>');
  }
  if (beat.learned && !beat.practised) {
    parts.push(`<p class="reading-learned">${escapeHTML(t('reading.carriedForward', { items: beat.learned.map(id => learned[id].label).join(' · ') }))}</p>`);
  }
  if (beat.sort) {
    const mine = beat.sort.filter(item => item.mine).map(item => escapeHTML(item.label));
    const not = beat.sort.filter(item => !item.mine).map(item => escapeHTML(item.label));
    parts.push(`<div class="reading-sort"><p><strong>${escapeHTML(t('reading.theirChoices'))}</strong> ${mine.join(' · ')}</p><p><strong>${escapeHTML(t('reading.outsideControl'))}</strong> ${not.join(' · ')}</p></div>`);
  }
  if (beat.closer) {
    const picture = beat.closer.alt ? `<p class="reading-visual"><span>${escapeHTML(t('reading.picture'))}</span> ${escapeHTML(beat.closer.alt)}</p>` : '';
    parts.push(`<aside class="reading-closer"><h4>${escapeHTML(beat.closer.heading)}</h4>${beat.closer.body.map(p => `<p>${escapeHTML(p)}</p>`).join('')}${picture}</aside>`);
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

/** One beat of the reading (the live page puts the life on screen into "Many paths" with it). */
export const renderReadingBeat = (beat, t = runtimeT) => readingBeat(beat, { t, learned: learnedFor(t) });

/** The whole lesson as semantic HTML in the language of `t`, "Many paths" told for `life`. */
export function renderJourneyReading({ t = runtimeT, life = null } = {}) {
  const learned = learnedFor(t);
  const chapters = chaptersFor(t, life).map(chapter => `<section class="reading-chapter" aria-labelledby="read-chapter-${chapter.id}">
<h2 id="read-chapter-${chapter.id}">${escapeHTML(chapter.title)}</h2>
${chapter.beats.map(beat => readingBeat(beat, { t, learned })).join('\n')}
</section>`);
  return `<article class="journey-reading" aria-labelledby="journey-reading-title">
<h1 id="journey-reading-title">${escapeHTML(t('reading.title'))}</h1>
<p class="reading-intro">${escapeHTML(t('reading.intro'))}</p>
${chapters.join('\n')}
</article>`;
}
