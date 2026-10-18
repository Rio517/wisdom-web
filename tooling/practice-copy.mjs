// Prints Lesson 2's words as one readable Markdown document, in any language,
// straight from the message catalogs (the way lesson-copy.mjs does for Lesson 1).
//   node tooling/practice-copy.mjs          → rewrites docs/content/practice-journey.md (English)
//   node tooling/practice-copy.mjs de       → prints the German copy to stdout
import { writeFileSync } from 'node:fs';
import { chaptersFor, afternoonsFor, PRACTICE_PATH } from '../src/lessons/practice/practice-story.js';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE } from '../src/i18n/config.js';

const locale = process.argv[2] ?? DEFAULT_LOCALE;
if (!LOCALES.includes(locale)) throw new Error(`Unknown locale "${locale}". Use one of: ${LOCALES.join(', ')}`);
const t = getTranslator(locale);
const out = [];
const add = (...lines) => out.push(...lines);

add(`# ${t('practice.ui.title')} (guided journey${locale === DEFAULT_LOCALE ? '' : ` · ${LOCALE_NAMES[locale]}`})`, '');
if (locale === DEFAULT_LOCALE) {
  add('Status: Draft 01, the text of Lesson 2 on the site (unlinked, at a working address). Created: 2026-10-18. Updated: 2026-10-18.', '');
  add(`This is the readable copy of Lesson 2, Practice ([016](../product/016-lessons-two-to-four.md)), served at \`${PRACTICE_PATH}\`. The live words are in \`src/i18n/messages/en.json\` under \`practice.*\`, with the translations beside it. Edit either here or in the catalog; after a code pass, regenerate this file with \`npm run copy:lesson\`.`, '');
} else {
  add(`Generated from \`src/i18n/messages/${locale}.json\` for review. Section labels stay in English; everything else is the ${LOCALE_NAMES[locale]} text readers see.`, '');
}

for (const chapter of chaptersFor(t)) {
  add(`## ${chapter.title}`, '');
  for (const beat of chapter.beats) {
    add(`### ${beat.heading}`, '');
    if (beat.activity) {
      add(`Story column, before afternoon 7: ${t('practice.beat.afternoons.body.start')}`, '');
      add(`From afternoon 7: ${t('practice.beat.afternoons.body.new')}`, '');
      add(`After the tenth: ${t('practice.beat.afternoons.body.end')}`, '');
      for (const day of afternoonsFor(t)) {
        add(`- **${day.label}${day.chance ? ` · ${day.chance}` : ''}.** ${day.text} ${day.options.map(option => `${option.label} (${option.kind})`).join(' · ')}`);
      }
      add('', `End card: **${t('practice.activity.end.heading')}**, a line each for soccer and cello, in words, never a number (for example “${t('practice.activity.end.soccer.most')}” or “${t('practice.activity.end.cello.less', { band: 'few' })}”); then, only if basketball was picked, “${t('practice.activity.end.basketball.head')}”; and **${t('practice.activity.end.again')}**.`, '');
    } else {
      for (const paragraph of beat.body) add(paragraph, '');
    }
    if (beat.takeaways) { for (const item of beat.takeaways) add(`- **${item.heading}** ${item.text}`); add(''); }
    add(`Picture: ${beat.alt}`, '');
  }
}

if (locale === DEFAULT_LOCALE) {
  add('## Editorial notes', '');
  add('- The story and the activity follow the approved paper round ([003 v03](../design/003-lesson-two/v03-practice-paper/README.md)); its `copy.md` is the approved English, and the build round lists every change.');
  add('- Soccer-to-basketball is an illustrative head start from related skills, not guaranteed or large transfer ([learning findings](../research/learning/README.md)).');
  add('- No numbers on the afternoons; the bars use words such as Learning and Getting good, and nothing shrinks.');
  add('- A small, unnamed elephant stands in the background of some pictures and beside Maya on the last step; Lesson 3 says who it is.');
  add('');
}

const text = `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
if (locale === DEFAULT_LOCALE) writeFileSync(new URL('../docs/content/practice-journey.md', import.meta.url), text);
else process.stdout.write(text);
