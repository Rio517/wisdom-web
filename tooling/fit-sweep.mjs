// Usage: node tooling/fit-sweep.mjs [--lesson choices|practice|elephant] [--step id] [--lang en] [--size 1133x744] [--out file.json] [--shot dir [--wait ms]]
//   --lesson practice sweeps Lesson 2 (its activity measured three times: afternoon 1, afternoon 7, the end card)
//   --lesson elephant sweeps Lesson 3 (its sort measured three times: the start, three cards sorted with one
//   sent to the other side, and the end with every card sorted)
//   env: BASE (preview URL), ENGINE=chromium, STRESS=wide (adds ?stress=wide), REDUCED=1 (reducedMotion: reduce)
import { webkit, chromium } from 'playwright';
import fs from 'node:fs';
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const SIZES = ['1440x900','1280x800','1920x1080','1133x744','990x800','1024x768','744x1133','820x1180'];
const LANGS = ['en','de','fr','es'];
const sizes = arg('size') ? [arg('size')] : SIZES, langs = arg('lang') ? [arg('lang')] : LANGS;
const only = arg('step'); const out = arg('out') || 'results.json';
const BASE = process.env.BASE || 'http://127.0.0.1:4646';
// Each lesson's address and its page hook (go, beats); `states` adds stills of a step after a setup.
const PLAYED = ['soccerPractice', 'kickBall', 'celloPractice', 'hallway', 'soccerPractice', 'soccerPractice', 'basketball', 'friend', 'trick', 'match'];
// Lesson 3's sort: [card, side] taps, the third one on the other side (it slides across).
const SORTED = [['m1', 'elephant'], ['m4', 'rider'], ['m2', 'rider'], ['m3', 'elephant'], ['m5', 'rider'], ['m6', 'rider']];
const LESSONS = {
  choices: { path: '/choices/the-paths-we-make/', hook: 'opening', states: {} },
  practice: { path: '/practice/small-choices/', hook: 'journey', states: { afternoons: [['-a2', PLAYED.slice(0, 6)], ['-a3', PLAYED]] },
    setup: picks => globalThis.journey.afternoons.playThrough(picks) },
  elephant: { path: '/deciding/elephant-and-rider/', hook: 'journey', states: { partners: [['-mid', SORTED.slice(0, 3)], ['-end', SORTED]] },
    setup: taps => {
      const labels = Object.fromEntries([...document.querySelectorAll('.sort-pile .sort-card')].map(card => [card.dataset.id, card]));
      for (const [id, side] of taps) { (labels[id] ?? document.querySelector(`.sort-card[data-id="${id}"]`)).click(); document.querySelector(`.sort-bin-${side}`).click(); }
      return Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); // the slide across, settled
    },
    reset: () => globalThis.journey.sort.restart() },
};
const lesson = LESSONS[arg('lesson') || process.env.LESSON || 'choices'];
const measure = () => {
  const vw = innerWidth, vh = innerHeight, r = {};
  const body = document.querySelector('#narration-body');
  r.narr = body ? Math.max(0, body.scrollHeight - body.clientHeight) : null;
  r.docV = Math.max(0, document.documentElement.scrollHeight - vh);
  r.docH = document.documentElement.scrollWidth - vw;
  const inside = b => b.left >= -0.5 && b.top >= -0.5 && b.right <= vw + 0.5 && b.bottom <= vh + 0.5;
  r.btn = {};
  const onCover = document.querySelector('#journey')?.dataset.cover === 'true';
  for (const id of (onCover ? ['cover-begin'] : ['back', 'next'])) {
    const el = id === 'cover-begin' ? document.querySelector('[data-cover-begin]') : document.getElementById(id);
    if (!el || el.hidden || !el.checkVisibility()) { r.btn[id] = 'hidden'; continue; }
    const b = el.getBoundingClientRect(); const probs = [];
    if (!inside(b)) probs.push('outside');
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    if (!(hit && (hit === el || el.contains(hit)))) probs.push('covered by ' + (hit ? hit.tagName + '#' + hit.id + '.' + String(hit.className?.baseVal ?? hit.className).slice(0, 30) : 'null'));
    r.btn[id] = probs.join('+') || 'ok';
  }
  const stage = document.querySelector('#stage').getBoundingClientRect();
  const labels = [], small = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set(); let n;
  while ((n = walker.nextNode())) {
    const el = n.parentElement; const txt = n.textContent.trim();
    if (!txt || seen.has(el)) continue; seen.add(el);
    if (['SCRIPT','STYLE','NOSCRIPT','TITLE'].includes(el.tagName)) continue;
    if (el.closest('dialog:not([open])') || el.closest('#stage-description, #announcer, .sr-only')) continue;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true })) continue;
    const b = el.getBoundingClientRect(); if (b.width < 1 || b.height < 1) continue;
    const cs = getComputedStyle(el); let fs = parseFloat(cs.fontSize);
    const isSvg = el instanceof SVGElement;
    if (isSvg && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) fs *= Math.hypot(m.a, m.b); }
    const onScreen = b.right > 0 && b.bottom > 0 && b.left < vw && b.top < vh;
    // clipped by a scrolling ancestor?
    let clipped = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflow + o.overflowX + o.overflowY)) { const ab = a.getBoundingClientRect(); if (b.bottom < ab.top || b.top > ab.bottom || b.right < ab.left || b.left > ab.right) { clipped = true; break; } }
    }
    if (clipped) continue;
    if (onScreen && fs < 14.95) small.push(`${txt.slice(0, 30)} ${fs.toFixed(1)}px`);
    const inMap = el.closest('#stage');
    let hit = null; { const cx = Math.min(Math.max(b.left + b.width / 2, 0), vw - 1), cy = Math.min(Math.max(b.top + b.height / 2, 0), vh - 1); hit = document.elementFromPoint(cx, cy); }
    const seenTop = !onScreen || (hit && (hit === el || el.contains(hit) || hit.contains(el) || hit.tagName === 'CANVAS'));
    if (inMap && !el.closest('#narration') && seenTop) labels.push({ el, t: txt.slice(0, 40), b: { l: b.left, t: b.top, r: b.right, b: b.bottom }, id: el.id || '' });
  }
  r.small = [...new Set(small)].slice(0, 6); r.smallN = new Set(small).size;
  r.cut = []; r.overlap = [];
  for (const l of labels) {
    const b = l.b;
    if (b.left < -0.5 || b.l < -0.5 || b.r > vw + 0.5 || b.t < -0.5 || b.b > vh + 0.5) r.cut.push(l.t + ' (viewport)');
    else if (b.l < stage.left - 0.5 || b.r > stage.right + 0.5 || b.t < stage.top - 0.5 || b.b > stage.bottom + 0.5) r.cut.push(l.t + ' (map box)');
  }
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    if (labels[i].el.parentElement === labels[j].el.parentElement && !(labels[i].el.matches('.pl-label') && labels[j].el.matches('.pl-label'))) continue;
    const a = labels[i].b, c = labels[j].b;
    const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
    if (ox > 2 && oy > 2) r.overlap.push(`${labels[i].t} x ${labels[j].t}`);
  }
  r.nLabels = labels.length;
  return r;
};
const sig = () => { const q = s => { const e = document.querySelector(s); if (!e) return ''; const b = e.getBoundingClientRect(); return [b.x,b.y,b.width,b.height,e.scrollHeight].map(Math.round).join(','); };
  return ['#narration-body','#next','#back','#stage','#beat-heading'].map(q).join('|') + '|' + document.querySelectorAll('#stage text, #map-callouts *').length + '|' + document.documentElement.scrollWidth; };
const results = [];
const browser = await (process.env.ENGINE === 'chromium' ? chromium : webkit).launch();
for (const lang of langs) for (const size of sizes) {
  const [w, h] = size.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120)));
  page.on('pageerror', e => errs.push('pageerror ' + String(e).slice(0, 120)));
  try {
    await page.goto(`${BASE}${lang === 'en' ? '' : '/' + lang}${lesson.path}${process.env.STRESS ? '?stress=' + process.env.STRESS : ''}`);
    await page.waitForFunction(hook => globalThis[hook]?.beats, lesson.hook, { timeout: 15000 });
    const ids = await page.evaluate(hook => globalThis[hook].beats.map(b => b.beat.id), lesson.hook);
    const runs = ids.flatMap((id, i) => [[id, i, null], ...(lesson.states[id] ?? []).map(([suffix, picks]) => [id + suffix, i, picks])]);
    for (const [step, i, picks] of runs) {
      if (only && step !== only && ids[i] !== only) continue;
      errs.length = 0;
      let res;
      try {
        if (lesson.reset) await page.evaluate(lesson.reset);
        await page.evaluate(([hook, i]) => globalThis[hook].go(i, { animate: false }), [lesson.hook, i]);
        if (picks) await page.evaluate(lesson.setup, picks);
        await page.evaluate(() => document.fonts.ready);
        let last = '', same = 0; const t0 = Date.now();
        while (Date.now() - t0 < 1500 && same < 3) { await page.waitForTimeout(100); const s = await page.evaluate(sig); same = s === last ? same + 1 : 0; last = s; }
        res = await page.evaluate(measure);
        res.settled = same >= 3;
        if (arg('shot')) await page.waitForTimeout(Number(arg('wait') || 0)); // --wait ms: let arrival animations end before a still
        if (arg('shot')) await page.screenshot({ path: `${arg('shot')}/${lang}-${step}-${size}.png` });
      } catch (e) { res = { error: String(e).slice(0, 150) }; }
      results.push({ step, lang, size, ...res, errors: [...errs] });
    }
  } catch (e) { results.push({ step: '*', lang, size, error: String(e).slice(0, 150) }); }
  await ctx.close();
  process.stderr.write(`${lang} ${size} done\n`);
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(results));
console.log('wrote', results.length, out);
