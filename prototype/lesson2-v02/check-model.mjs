// Checks the round's model for the behaviour the owner ruled out:
// `node prototype/lesson2-v02/check-model.mjs`. Prints one line per check and
// exits 1 if any fails.
import { DAYS, KINDS, OTHERS, replay, stepsLeft, branchesLeft, walkStep, outcome } from './model.js';

const picks = { sport: 'soccer', art: 'cello', quiet: 'reading' };
const options = i => DAYS[i].options;
let seed = 7;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const draws = (tally) => ({ e: stepsLeft(tally), f: branchesLeft(tally), g: walkStep(tally) });
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

// 1. Rest and bad luck never make anything harder; a miss in F and G never does either.
let restCost = 0; let luckCost = 0; let missCostFG = 0; let missCostE = 0; let days = 0;
for (let run = 0; run < 3000; run += 1) {
  const choices = DAYS.map((_, i) => options(i)[Math.floor(rand() * 3)]);
  for (let i = 0; i < DAYS.length; i += 1) {
    const before = replay(choices.slice(0, i), picks);
    const after = replay(choices.slice(0, i + 1), picks);
    const how = outcome(i, choices[i]);
    days += 1;
    for (const kind of KINDS) {
      const a = draws(before.tally[kind]); const b = draws(after.tally[kind]);
      const harder = b.e > a.e || b.f > a.f || b.g < a.g;
      if (how[kind] === 'rest' && harder) restCost += 1;
      if (how[kind] === 'luck' && harder) luckCost += 1;
      if (how[kind] === 'miss' && (b.f > a.f || b.g < a.g)) missCostFG += 1;
      if (how[kind] === 'miss' && b.e > a.e) missCostE += 1;
    }
  }
}
check('rest never makes starting harder', restCost === 0, `${restCost} of ${days} days`);
check('bad luck never makes starting harder', luckCost === 0, `${luckCost} of ${days} days`);
check('a miss never costs anything in F or G', missCostFG === 0, `${missCostFG} of ${days} days`);

// 2. E: the first two misses cost nothing; after that at most one step ever comes back.
const tallies = [0, 1, 2, 3, 4, 5, 6].flatMap(usual => [0, 1, 2, 3, 4, 8].map(misses => ({ usual, misses })));
const back = tallies.map(t => stepsLeft(t) - stepsLeft({ usual: t.usual, misses: 0 }));
check('E: no step back for the first two misses', tallies.every((t, i) => t.misses > 2 || back[i] === 0));
check('E: never more than one step back', Math.max(...back) <= 1, `max ${Math.max(...back)}; seen on ${missCostE} random days`);

// 3. Counts, not runs: the same days in another order end the same.
let orderDiff = 0;
for (let run = 0; run < 2000; run += 1) {
  const kinds = DAYS.map((_, i) => options(i)[Math.floor(rand() * 3)]);
  const a = replay(kinds, picks);
  // Shuffle whole days (a day's options travel with it is not needed: tallies only count outcomes).
  const order = DAYS.map((_, i) => i).sort(() => rand() - 0.5);
  const tallyOf = indices => {
    const t = Object.fromEntries(KINDS.map(k => [k, { usual: 0, other: 0, misses: 0 }]));
    for (const i of indices) {
      const how = outcome(i, kinds[i]);
      for (const k of KINDS) { if (how[k] === 'usual') t[k].usual += 1; if (how[k] === 'other') t[k].other += 1; if (how[k] === 'miss') t[k].misses += 1; }
    }
    return t;
  };
  const b = tallyOf(order);
  for (const k of KINDS) if (JSON.stringify(draws(a.tally[k])) !== JSON.stringify(draws(b[k]))) orderDiff += 1;
}
check('the same days in any order end the same', orderDiff === 0, `${orderDiff} differences in 2000 shuffles`);

// 4. The scripted play-through: each usual activity, a fort on the rained-off Thursday, the party.
const scripted = DAYS.map((day, i) => (i === 7 ? 'party' : i === 3 ? 'fort' : day.usual));
const end = replay(scripted, picks);
check('scripted run: E reaches one tap for all three', KINDS.every(k => stepsLeft(end.tally[k]) === 1));
check('scripted run: F picks first for all three by week two', KINDS.every(k => branchesLeft(end.tally[k]) === 0));
check('scripted run: G walks 4, 3 and 4 (the party cost cello nothing but a step not taken)', `${walkStep(end.tally.sport)} ${walkStep(end.tally.art)} ${walkStep(end.tally.quiet)}` === '4 3 4');
check('every option is a pick or a known other thing', DAYS.every(day => day.options.every(o => KINDS.includes(o) || OTHERS[o])));

for (const r of results) console.log(`${r.ok ? 'pass' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
if (results.some(r => !r.ok)) process.exit(1);
