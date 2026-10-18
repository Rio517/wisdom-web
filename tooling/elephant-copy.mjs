// Prints Lesson 3's words as one readable Markdown document, in any language,
// straight from the message catalogs (the way practice-copy.mjs does for Lesson 2).
//   node tooling/elephant-copy.mjs          → rewrites docs/content/elephant-journey.md (English)
//   node tooling/elephant-copy.mjs fr       → prints the French copy to stdout
import { writeFileSync } from 'node:fs';
import { chaptersFor, momentsFor, SORT_SIDES, ELEPHANT_PATH, ELEPHANT_TITLE } from '../src/lessons/elephant/elephant-story.js';
import { getTranslator } from '../src/i18n/index.js';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE } from '../src/i18n/config.js';

const locale = process.argv[2] ?? DEFAULT_LOCALE;
if (!LOCALES.includes(locale)) throw new Error(`Unknown locale "${locale}". Use one of: ${LOCALES.join(', ')}`);
const t = getTranslator(locale);
const out = [];
const add = (...lines) => out.push(...lines);

add(`# ${t(ELEPHANT_TITLE)} (guided journey${locale === DEFAULT_LOCALE ? '' : ` · ${LOCALE_NAMES[locale]}`})`, '');
if (locale === DEFAULT_LOCALE) {
  add('Status: Draft 01, the text of Lesson 3 on the site (at a working address). Created: 2026-10-19. Updated: 2026-10-19.', '');
  add(`This is the readable copy of Lesson 3, The elephant and the rider ([016](../product/016-lessons-two-to-four.md)), served at \`${ELEPHANT_PATH}\`. The live words are in \`src/i18n/messages/en.json\` under \`elephant.*\`, with the translations beside it. Edit either here or in the catalog; after a code pass, regenerate this file with \`npm run copy:lesson\`.`, '');
} else {
  add(`Generated from \`src/i18n/messages/${locale}.json\` for review. Section labels stay in English; everything else is the ${LOCALE_NAMES[locale]} text readers see.`, '');
}

for (const chapter of chaptersFor(t)) {
  add(`## ${chapter.title}`, '');
  for (const beat of chapter.beats) {
    if (beat.ownKicker) add(`*${beat.kicker}*`, '');
    add(`### ${beat.heading}`, '');
    for (const paragraph of beat.body) add(paragraph, '');
    if (beat.activity) {
      add(`Each card's line shows under the story text when it lands; a card dropped on the other side slides across to its own with the same line. At the end the story keeps its first line and adds: “${t('elephant.beat.partners.result')}”`, '');
      for (const side of SORT_SIDES) {
        add(`**${t(`elephant.sort.${side}`)}** (at the end: ${t(`elephant.sort.strong.${side}`)})`, '');
        for (const card of momentsFor(t).filter(item => item.side === side)) add(`- **${card.label}.** ${card.line}`);
        add('');
      }
      add(`Then **${t('elephant.sort.again')}**.`, '');
    }
    if (beat.takeaways) { for (const item of beat.takeaways) add(`- **${item.heading}** ${item.text}`); add(''); }
    add(`Picture: ${beat.alt}`, '');
  }
}

if (locale === DEFAULT_LOCALE) {
  add('## Editorial notes', '');
  add('- The story and the activity follow the approved round ([004 v02](../design/004-lesson-three/v02-sort/README.md)); its `copy.md` is the approved English, and the build round ([v03](../design/004-lesson-three/v03-build/README.md)) lists every change.');
  add('- The rider and the elephant are Jonathan Haidt’s picture (*The Happiness Hypothesis*, 2006), taught as an illustration, not a description of the brain. Neither one is the real self, and feelings are not the enemy.');
  add('- Step 06 quotes Haidt: “We are the rider, and we are the elephant” (*The Happiness Hypothesis*, ch. 1, p. 22).');
  add('- The activity has no score, count or right-or-wrong mark.');
  add('');
}

const text = `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
if (locale === DEFAULT_LOCALE) writeFileSync(new URL('../docs/content/elephant-journey.md', import.meta.url), text);
else process.stdout.write(text);
