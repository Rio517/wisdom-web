// Prints Lesson 1's words as one readable Markdown document, in any language,
// straight from the message catalogs. Useful for editing and native review.
//   node tooling/lesson-copy.mjs            → rewrites docs/content/choices-journey.md (English)
//   node tooling/lesson-copy.mjs de         → prints the German copy to stdout
import { writeFileSync } from 'node:fs';
import { chaptersFor, learnedFor } from '../src/lessons/choices/journey-story.js';
import { CHOICE_BANDS, CLOSED_REASONS, STORY_COUNT, bandChoices, mapStory } from '../src/lessons/choices/journey-choices.js';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE } from '../src/i18n/config.js';

const locale = process.argv[2] ?? DEFAULT_LOCALE;
if (!LOCALES.includes(locale)) throw new Error(`Unknown locale "${locale}". Use one of: ${LOCALES.join(', ')}`);
const t = getTranslator(locale);
const learned = learnedFor(t);
const out = [];
const add = (...lines) => out.push(...lines);

add(`# ${t('reading.title')} (guided journey${locale === DEFAULT_LOCALE ? '' : ` · ${LOCALE_NAMES[locale]}`})`, '');
if (locale === DEFAULT_LOCALE) {
  add('Status: Draft 04, the text of Lesson 1 on the site. Created: 2026-09-26. Updated: 2026-10-09.', '');
  add('This is the readable copy of [Lesson 1](../product/013-choices-guided-journey.md). The live words are in `src/i18n/messages/en.json`, and the translations sit beside it (see [014](../product/014-languages.md)). Edit either here or in the catalog; after a code pass, regenerate this file with `npm run copy:lesson`. [Draft 02](choices-story.md) is the text of the earlier lesson study.', '');
} else {
  add(`Generated from \`src/i18n/messages/${locale}.json\` for review. Section labels stay in English; everything else is the ${LOCALE_NAMES[locale]} text readers see.`, '');
}
add(t('reading.intro'), '');

for (const chapter of chaptersFor(t)) {
  add(`## ${chapter.title}`, '');
  for (const beat of chapter.beats) {
    add(`### ${beat.heading}`, '');
    for (const paragraph of beat.body) add(paragraph, '');
    if (beat.choice) {
      add(`**${beat.choice.prompt}**`, '');
      for (const option of beat.choice.options) add(`- **${option.label}**${option.story ? ' (what they chose)' : ''} — ${option.feedback}`);
      add('');
    }
    if (beat.learned) add(`Backpack adds: ${beat.learned.map(id => learned[id].label).join(' · ')}`, '');
    if (beat.sort) add(`Drag to sort (or skip): ${beat.sort.map(card => `${card.label} (${card.mine ? 'their choice' : 'outside their control'})`).join(' · ')}`, '');
    if (beat.closer) {
      add(`> **${beat.closer.heading}**`, '>');
      beat.closer.body.forEach((paragraph, index) => add(`> ${paragraph}`, ...(index < beat.closer.body.length - 1 ? ['>'] : [])));
      if (beat.closer.alt) add('>', `> Picture while open: ${beat.closer.alt}`);
      add('');
    }
    if (beat.takeaways) { for (const item of beat.takeaways) add(`- **${item.heading}** ${item.text}`); add(''); }
    if (beat.id === 'travel') {
      add('#### Map story sets (one picked at random per visit)', '');
      add('Taken choices sit on the dark route; not-taken ones on gray branches. Two related future groups sit on connected branches, one in the top half and one in the bottom half: the first step, then two ways on.', '');
      for (let index = 0; index < STORY_COUNT; index += 1) {
        const story = mapStory(index, t);
        add(`${index + 1}. **Taken:** ${story.taken.join(' → ')} · **Not taken:** ${story.untaken.join(', ')} · **Builds on it:** ${story.build[0]} → ${story.build[1]} / ${story.build[2]} · **Something new:** ${story.fresh[0]} → ${story.fresh[1]} / ${story.fresh[2]}`);
      }
      add('');
    }
    if (beat.explore) {
      add('#### Example choices by age', '');
      let from = 3;
      for (const band of CHOICE_BANDS) {
        const until = Number.isFinite(band.until) ? band.until - 1 : 70;
        add(`- **${from}–${until}${band.by === 'family' ? ' (chosen by family)' : ''}:** ${bandChoices(band, t).join(' · ')}`);
        from = band.until;
      }
      for (const [group, name] of [['young', 'children'], ['adult', 'adults']]) {
        add('', `Closed-way reasons (${name}): ${CLOSED_REASONS[group].map(item => t(`explore.closed.${group}.${item}`)).join(' · ')}`);
      }
      add('');
    }
    add(`Picture: ${beat.alt}`, '');
  }
}

if (locale === DEFAULT_LOCALE) {
  add('## Editorial notes', '');
  add('- The order is big picture first, then two concrete examples (setbacks and circumstances; compounding and carry-across), then a free explorer and three takeaways.');
  add('- Maya is compared with herself on two imagined paths, not with another child, so the contrast is about practice patterns rather than ability.');
  add('- Soccer-to-basketball is an illustrative carry-across example, kept optional behind “Trying something new”. The research supports a possible related-skill head start with adaptation, not guaranteed or large transfer ([learning findings](../research/learning/README.md)).');
  add('- No numbers are shown; Maya’s bars use words such as Learning and Getting good.');
  add('- The hike’s closed trail and the explorer’s closed ways and lucky chances keep circumstances visible.');
  add('- Explorer labels are examples of the kinds of choices people make at each age. They are not ranked, and no option is presented as better. Early ones are marked as chosen by family.');
}

const text = `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
if (locale === DEFAULT_LOCALE) writeFileSync(new URL('../docs/content/choices-journey.md', import.meta.url), text);
else process.stdout.write(text);
