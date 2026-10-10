#!/usr/bin/env node
// Checks the lives store of the Lesson 1 opening (prototype/lesson1-opening/lives):
// errors, warnings, and a variety report of grown lives. Exit 1 on errors.
//
//   npm run lives:check                      the real store
//   npm run lives:check -- --samples 5       and five random grown lives as text
//   npm run lives:check -- --store tests/fixtures/lives --lives 20 --random 1000
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStore, check, variety, coverage, forksOf, grow, lifeText, rng } from '../prototype/lesson1-opening/lives/engine.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] !== undefined ? args[at + 1] : fallback;
};
const storeDir = resolve(root, option('store', 'prototype/lesson1-opening/lives'));
const livesPer = Number(option('lives', 50));
const randomLives = Number(option('random', 5000));
const samples = Number(option('samples', 0));
const quiet = args.includes('--quiet');

function readStore(dir) {
  const files = {};
  for (const folder of ['nodes', 'baselines']) {
    const path = join(dir, folder);
    if (!existsSync(path)) continue;
    for (const name of readdirSync(path).filter(file => /\.ya?ml$/.test(file)).sort()) files[`${folder}/${name}`] = readFileSync(join(path, name), 'utf8');
  }
  return files;
}

const started = performance.now();
const store = loadStore(readStore(storeDir));
const { errors, warnings } = check(store, { lives: 20 });
const out = [];
const pad = (value, width) => String(value).padEnd(width);
const padStart = (value, width) => String(value).padStart(width);
const percent = value => (value === null ? '—' : `${Math.round(value * 100)}%`);
const signed = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
const where = item => [item.file, item.baseline ? `${item.baseline}${item.step !== undefined ? ` step ${item.step + 1}` : ''}` : '', item.node && !item.baseline ? item.node : ''].filter(Boolean).join('  ');

const nodeFiles = store.files.filter(file => file.kind === 'nodes');
out.push(`Lives store: ${relative(root, storeDir) || '.'}`);
out.push(`  ${store.nodes.size} nodes in ${nodeFiles.length} files; ${store.baselines.size} baseline${store.baselines.size === 1 ? '' : 's'} (${[...store.baselines.keys()].join(', ')})`);
out.push('');
out.push(errors.length ? `Errors (${errors.length})` : 'Errors: none');
for (const item of errors) out.push(`  ${where(item)}: ${item.message}`);
out.push(warnings.length ? `Warnings (${warnings.length})` : 'Warnings: none');
if (!quiet) for (const item of warnings) out.push(`  ${where(item)}: ${item.message}`);

if (livesPer > 0 && store.baselines.size) {
  const rows = variety(store, { lives: livesPer });
  out.push('');
  out.push(`Variety: ${livesPer} grown lives from each of ${rows.length} alternatives`);
  out.push(`  ${pad('life', 8)}${pad('fork', 6)}${pad('alternative', 22)}${padStart('reach', 6)}${padStart('steps', 7)}${padStart('distinct', 10)}${padStart('overlap', 9)}${padStart('end', 7)}${padStart('others', 8)}${padStart('luck', 6)}${padStart('build', 7)}`);
  for (const row of rows) {
    out.push(`  ${pad(row.baseline, 8)}${pad(row.age, 6)}${pad(row.alt, 22)}${padStart(`${Math.round(row.reach * 100)}%`, 6)}${padStart(row.steps.toFixed(1), 7)}${padStart(row.distinct, 10)}${padStart(row.overlap === null ? '—' : row.overlap.toFixed(2), 9)}${padStart(signed(row.rise), 7)}${padStart(signed(row.othersRise), 8)}${padStart(percent(row.surprise), 6)}${padStart(percent(row.build), 7)}${row.flagged ? '  ← ends apart from its fork' : ''}`);
  }
  const mean = key => { const values = rows.map(row => row[key]).filter(value => value !== null); return values.reduce((sum, value) => sum + value, 0) / (values.length || 1); };
  out.push(`  mean: reach ${Math.round(mean('reach') * 100)}%, steps ${mean('steps').toFixed(1)}, distinct ${mean('distinct').toFixed(1)}, overlap ${mean('overlap').toFixed(2)}, luck or setback at ${percent(mean('surprise'))} of the forks from 8 to end − 4 (aim: about 33%), building on the last two steps ${percent(mean('build'))}; ${rows.filter(row => row.flagged).length} flagged (end more than 0.12 from the fork's other options)`);
}

if (randomLives > 0 && store.baselines.size) {
  const report = coverage(store, { lives: randomLives });
  out.push('');
  out.push(`Coverage: ${report.lives} random lives, ${report.early} ended more than three years early; nodes used ${report.used}/${report.total}`);
  const { tells } = report;
  const share = (part, whole) => (whole ? `${Math.round((100 * part) / whole)}%` : '—');
  out.push(`  ${share(tells.endSurprise, report.lives)} end on a lucky break or a setback (aim: 0); ${share(tells.ownStory, tells.surprises)} of the surprises follow the life's own story (aim: half or more); ${share(tells.answered, tells.setbacks)} of the setbacks are answered within four years (aim: 60% or more)`);
  for (const file of report.files) {
    out.push(`  ${pad(file.file, 16)}${padStart(`${file.used}/${file.total}`, 8)}${file.unused.length ? `  unused: ${file.unused.slice(0, 12).join(', ')}${file.unused.length > 12 ? ', …' : ''}` : ''}`);
  }
}

if (samples > 0) {
  const forks = forksOf(store);
  const random = rng(option('seed', String(Date.now())));
  out.push('');
  out.push(`${samples} random grown lives`);
  for (let i = 0; i < samples && forks.length; i += 1) {
    const fork = forks[Math.floor(random() * forks.length)];
    const seed = Math.floor(random() * 36 ** 6).toString(36);
    out.push('');
    out.push(lifeText(grow(store, { ...fork, seed }), store));
  }
}

out.push('');
out.push(`Checked in ${((performance.now() - started) / 1000).toFixed(2)} s.`);
console.log(out.join('\n'));
process.exitCode = errors.length ? 1 : 0;
