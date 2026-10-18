// Usage: node tooling/fit-sum.mjs [results.json] [--skip fork,builds,never-late]
import fs from 'node:fs';
const argv = process.argv.slice(2), si = argv.indexOf('--skip');
const skip = new Set(si >= 0 ? argv.splice(si, 2)[1].split(',') : []);
const r = JSON.parse(fs.readFileSync(argv[0] || 'results.json')).filter(x => !skip.has(x.step));
const fails = {}; let failing = 0; const errs = r.filter(x=>x.error);
for (const x of r) {
  if (x.error) continue;
  const f = [];
  if (x.narr > 0) f.push(['narr', x.narr]);
  if (x.docV > 0) f.push(['pageV', x.docV]);
  if (x.docH > 0) f.push(['pageH', x.docH]);
  for (const [k, v] of Object.entries(x.btn)) if (v !== 'ok' && v !== 'hidden') f.push(['btn:' + k + ' ' + v, 0]);
  for (const c of x.cut) f.push(['cut:' + c, 0]);
  for (const o of x.overlap) f.push(['ovl:' + o, 0]);
  if (x.smallN) f.push(['small:' + x.small.join(';'), 0]);
  for (const e of x.errors) f.push(['console:' + e, 0]);
  if (!x.settled) f.push(['unsettled', 0]);
  if (f.length) failing++;
  for (const [k, v] of f) { const key = x.step + ' | ' + k.replace(/ \d+\.\d+px/g,''); (fails[key] ??= []).push(`${x.lang} ${x.size}${v ? ' ' + Math.round(v) : ''}`); }
}
console.log('cells', r.length, 'failing', failing, 'errors', errs.length);
const byKey = Object.entries(fails);
for (const [k, v] of byKey) {
  const langs = [...new Set(v.map(s => s.split(' ')[0]))].join(',');
  const sizes = [...new Set(v.map(s => s.split(' ')[1]))];
  const px = v.map(s => +s.split(' ')[2]).filter(Boolean);
  console.log(`${k} | n=${v.length} | ${langs} | ${sizes.length>5?sizes.length+' sizes':sizes.join(',')}${px.length ? ' | max ' + Math.max(...px) : ''}`);
}
