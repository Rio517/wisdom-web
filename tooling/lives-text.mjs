#!/usr/bin/env node
// The lives of the Lesson 1 opening as plain text, in any language, for reading and review:
// the ten written lives, then grown lives from seeded forks (three per person by default).
// Each step shows its line as the story tells it, its map label, and at a fork the "What if …?"
// heading the page asks for each alternative.
//   node tooling/lives-text.mjs de                 German, 30 grown lives
//   node tooling/lives-text.mjs fr --grown 5 --seed review-2 --ids   (node ids too)
import { getTranslator } from '../src/i18n/index.js';
import { forksOf, grow, loadWords, rng, writtenLife } from '../src/lessons/choices/lives/engine.js';
import { readStoreFiles, readWords } from './lives-data.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const at = args.indexOf(`--${name}`); return at >= 0 ? args[at + 1] : fallback; };
const locale = args.find(arg => /^[a-z]{2}$/.test(arg)) ?? 'en';
const perPerson = Number(option('grown', 3));
const random = rng(option('seed', 'review'));
const t = getTranslator(locale);
const store = loadWords(readStoreFiles(), readWords(locale), { locale, fallback: readWords('en') });
const out = [];
const kind = step => (step.kind === 'lucky' ? ` [${t('explore.kind.lucky')}]` : step.kind === 'setback' ? ` [${t('explore.kind.roadblock')}]` : '');
const ids = args.includes('--ids');
const row = step => `  ${t('lesson.ui.age', { age: step.age }).padEnd(9)} ${step.line}${kind(step)}   ‹${step.label}›${ids ? `   (${step.id})` : ''}`;

out.push(`# Lives in ${locale}`, '');
for (const id of store.baselines.keys()) {
  const life = writtenLife(store, id);
  out.push(`## ${life.name} (${life.pronoun}), written`);
  for (const step of life.steps) {
    out.push(row(step));
    for (const alt of step.alts) out.push(`      ${t('opening.whatif.heading', { whatIf: alt.whatIf })}   ‹${alt.label}›${ids ? `   (${alt.id})` : ''}`);
  }
  out.push(`  ${t('lesson.beat.life.close')}`, '');
}
const forks = forksOf(store);
for (const id of store.baselines.keys()) {
  const own = forks.filter(fork => fork.baseline === id);
  for (let k = 0; k < perPerson && own.length; k += 1) {
    const fork = own[Math.floor(random() * own.length)];
    const seed = Math.floor(random() * 36 ** 6).toString(36);
    const life = grow(store, { ...fork, seed });
    const picked = life.steps[fork.forkIndex];
    const alt = writtenLife(store, id).steps[fork.forkIndex].alts.find(item => item.id === fork.alt);
    out.push(`## ${life.name} (${life.pronoun}), grown from age ${picked.age} (seed ${seed})`);
    out.push(`  ${t('opening.whatif.heading', { whatIf: alt.whatIf })}`);
    life.steps.forEach((step, index) => out.push(`${index === fork.forkIndex ? '*' : index > fork.forkIndex ? ' ' : '·'}${row(step).slice(1)}`));
    out.push('');
  }
}
console.log(out.join('\n'));
