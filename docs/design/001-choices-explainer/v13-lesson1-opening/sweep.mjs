#!/usr/bin/env node
// The story list and "Choices add up" sweep for the Lesson 1 opening (design 001 v13, round 5).
//
// It drives the dev server (`npm run dev:prototype -- --host 127.0.0.1 --port 4644 --strictPort`)
// with Playwright (`npm i --no-save playwright`) and prints one row per life and size:
//
// - scroll: the most the story list (or the narration) scrolled while the life played,
//   sampled every 100 ms, at each pace;
// - over: how many px too long the list is at the end (its rows' height minus its box);
// - out: rows not whole and in view at the end (cut by the box, or under the top fade);
// - slack: px between the last row and the foot of the list's box at the end;
// - sizes: the font sizes of the lines (and, after the slash, of the ages) at the end;
// - adds: how many of "Choices add up"'s three labels show, and any clash (each other,
//   the labels that stay, the end card, the map's edge, a pin crossing a dot).
//
// Usage:
//   node sweep.mjs [--engine chromium|webkit] [--sizes 1133x744,1440x900,1366x657]
//                  [--lives amara,ana,...] [--paces normal,quick] [--url http://127.0.0.1:4644]
//                  [--jobs 4] [--no-story] [--no-adds] [--no-labels] [--no-grown] [--all-rows] [--room] [--json out.json]
// The label check (round 7) runs for the written lives and two changed lives per person; --no-grown skips the changed ones.
// --room also prints the column's room at each size (box, kicker, heading, dots, Back/Next).
// --budget (Chromium only) measures, for each life and size, the layouts each arriving line forces
// (stepping through the story while paused) and, with the processor slowed 4x, the longest
// main-thread task while the story plays, and with --picks the longest task over five picks.
// --cover measures the step from the cover to the story at each size (Theo, or the first of
// --lives): from ArrowRight to the first line, the longest frames (from requestAnimationFrame,
// at 1x and, in Chromium, at 4x slowdown), how often each canvas changed its bitmap size, how far
// the stage's box changed, and how far Born moved.
import { chromium, webkit } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] && !args[at + 1].startsWith('--') ? args[at + 1] : fallback;
};
const flag = name => args.includes(`--${name}`);
const ENGINE = opt('engine', 'chromium');
const SIZES = opt('sizes', '1133x744,1440x900,1366x657').split(',').map(text => text.split('x').map(Number));
const LIVES = opt('lives', 'amara,ana,kai,lena,leo,nora,omar,sam,theo,zoe').split(',');
const PACES = opt('paces', 'normal,quick').split(',');
const BASE = opt('url', 'http://127.0.0.1:4644');
const JOBS = Number(opt('jobs', '4'));
const PAGE = `${BASE}/prototype/lesson1-opening/`;

async function launch() {
  const type = ENGINE === 'webkit' ? webkit : chromium;
  try { return await type.launch(); } catch (error) {
    // A VM whose preinstalled Chromium doesn't match this Playwright: use it by path.
    const path = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
    if (ENGINE === 'chromium' && existsSync(path)) return type.launch({ executablePath: path });
    throw error;
  }
}

/** Run `tasks` (async functions taking a page) on `JOBS` pages at once. */
async function pool(browser, tasks) {
  const results = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const at = next++;
      const { size, run, contextOptions = {} } = tasks[at];
      const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, ...contextOptions });
      const page = await context.newPage();
      const errors = [];
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(String(error)));
      try { results[at] = { ...(await run(page)), errors }; } catch (error) { results[at] = { failed: String(error).slice(0, 160), errors }; }
      await context.close();
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, worker));
  return results;
}

const ready = page => page.waitForFunction(() => globalThis.opening?.storeReady).then(() => page.evaluate(() => opening.storeReady.then(() => true)));

// The list at the end of the story, measured in the page.
const measureEnd = () => {
  const box = document.getElementById('life-steps');
  if (!box) return null;
  const b = box.getBoundingClientRect();
  const rows = [...box.children];
  const fade = box.classList.contains('is-scrolled') ? 28 : 0;
  const out = rows.filter(row => {
    const r = row.getBoundingClientRect();
    return r.top < b.top + fade - 0.5 || r.bottom > b.bottom + 0.5;
  }).length;
  const last = rows.at(-1).getBoundingClientRect();
  const height = last.bottom - rows[0].getBoundingClientRect().top;
  const lineSizes = [...new Set(rows.map(row => parseFloat(getComputedStyle(row.querySelector('.life-line')).fontSize)))].sort((x, y) => y - x);
  const ageSizes = [...new Set(rows.filter(row => !row.classList.contains('is-close')).map(row => parseFloat(getComputedStyle(row.querySelector('.life-age')).fontSize)))].sort((x, y) => y - x);
  return {
    rows: rows.length,
    over: Math.round(Math.max(0, box.scrollHeight - box.clientHeight)),
    out,
    slack: Math.round(b.bottom - last.bottom),
    height: Math.round(height),
    room: Math.round(b.height),
    scrollTop: Math.round(box.scrollTop),
    lineSizes,
    ageSizes,
    short: rows.filter(row => row.classList.contains('is-short')).length,
  };
};

// The room the story beat's column gives the list.
const measureRoom = () => {
  const rect = selector => { const el = document.querySelector(selector); if (!el || !el.offsetParent && getComputedStyle(el).display === 'none') return null; const r = el.getBoundingClientRect(); return r.height ? { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) } : null; };
  return {
    list: rect('#life-steps'), kicker: rect('#beat-kicker'), heading: rect('#beat-heading'), pause: rect('.life-control'),
    dots: rect('#beat-dots'), buttons: rect('.nav-buttons'), controls: rect('.narration-controls'), hint: rect('.key-hint'),
  };
};

// "Choices add up": the chips, and every clash.
const measureAdds = () => {
  const stack = document.querySelector('#scene-paths .map-stack').getBoundingClientRect();
  const chips = [...document.querySelectorAll('#map-callouts .map-chip')].filter(el => el.style.visibility !== 'hidden');
  const boxes = chips.map(el => el.querySelector('span').getBoundingClientRect());
  const labels = [...document.querySelectorAll('.life-label.is-shown:not(.is-stepped-back):not(.is-what)')].map(el => el.getBoundingClientRect());
  const card = document.querySelector('.life-end');
  const cardBox = card && !card.hidden && getComputedStyle(card).visibility !== 'hidden' ? card.getBoundingClientRect() : null;
  const overlap = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
  const clashes = [];
  boxes.forEach((a, i) => {
    if (a.left < stack.left || a.right > stack.right || a.top < stack.top || a.bottom > stack.bottom) clashes.push(`${i}:edge`);
    boxes.forEach((c, j) => { if (j > i && overlap(a, c)) clashes.push(`${i}x${j}`); });
    if (labels.some(c => overlap(a, c))) clashes.push(`${i}:label`);
    if (cardBox && overlap(a, cardBox)) clashes.push(`${i}:card`);
  });
  // A pin may cross lines but never a dot other than its own (the one at its end).
  const points = opening.scenes.paths.lifePoints().map(p => ({ x: p.x + stack.left, y: p.y + stack.top }));
  chips.forEach((el, i) => {
    const pin = el.querySelector('i')?.getBoundingClientRect();
    if (!pin) return;
    const x = pin.left + pin.width / 2;
    const own = points.reduce((best, p) => (Math.hypot(p.x - x, Math.min(Math.abs(p.y - pin.top), Math.abs(p.y - pin.bottom))) < Math.hypot(best.x - x, Math.min(Math.abs(best.y - pin.top), Math.abs(best.y - pin.bottom))) ? p : best), points[0]);
    if (points.some(p => p !== own && Math.abs(p.x - x) < 6 && p.y > pin.top - 3 && p.y < pin.bottom + 3)) clashes.push(`${i}:pin-dot`);
    // A chip's own box never covers a dot of the route either.
    if (points.some(p => p !== own && p.x > boxes[i].left - 3 && p.x < boxes[i].right + 3 && p.y > boxes[i].top - 3 && p.y < boxes[i].bottom + 3)) clashes.push(`${i}:on-dot`);
  });
  return { shown: chips.length, clashes, log: globalThis.__addsLog ?? null };
};

function storyTask(life, size, pace) {
  return {
    size,
    run: async page => {
      await page.goto(`${PAGE}?life=${life}&pace=${pace}`);
      await ready(page);
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => opening.player.state.started, null, { timeout: 15000 });
      let scroll = 0; let bodyScroll = 0; let samples = 0;
      const started = Date.now();
      for (;;) {
        const s = await page.evaluate(() => ({ list: document.getElementById('life-steps')?.scrollTop ?? 0, body: document.getElementById('narration-body').scrollTop, done: opening.player.state.complete }));
        samples += 1;
        scroll = Math.max(scroll, s.list); bodyScroll = Math.max(bodyScroll, s.body);
        if (s.done || Date.now() - started > 120000) break;
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(700);
      const end = await page.evaluate(measureEnd);
      return { life, size, pace, scroll: Math.round(scroll), bodyScroll: Math.round(bodyScroll), samples, end };
    },
  };
}

function roomTask(size) {
  return {
    size,
    run: async page => {
      await page.goto(`${PAGE}?life=theo#paths-life`);
      await ready(page);
      await page.waitForTimeout(800);
      return { size, room: await page.evaluate(measureRoom) };
    },
  };
}

function addsTask(life, size) {
  return {
    size,
    run: async page => {
      await page.goto(`${PAGE}?life=${life}#paths-adds`);
      await ready(page);
      await page.waitForFunction(() => document.querySelector('#scene-paths:not([hidden])'));
      await page.waitForTimeout(900);
      return { life, size, adds: await page.evaluate(measureAdds) };
    },
  };
}

// Round 7: every step keeps its map label. With the life shown whole (reduced motion), every step of the
// written life (or, in a changed life, every step before the fork and every new step) has a label that is
// shown, whole (not cut by its box), inside the map, clear of every dot and mark, of every other label and
// gray choice, and of the end card.
const measureLabels = fork => {
  const overlay = document.querySelector('.life-overlay').getBoundingClientRect();
  const points = opening.scenes.paths.lifePoints().map(point => ({ x: point.x + overlay.left, y: point.y + overlay.top }));
  const visible = element => element.classList.contains('is-shown') && !element.classList.contains('is-under-card')
    && getComputedStyle(element).visibility !== 'hidden' && Number(getComputedStyle(element).opacity) > 0.3;
  const dark = [...document.querySelectorAll('.life-label.is-dark')].filter(visible);
  const whatif = fork !== null;
  const own = whatif ? dark.filter(element => !element.classList.contains('is-what') && Number(element.dataset.step) < fork) : dark;
  const fresh = whatif ? dark.filter(element => element.classList.contains('is-what')) : [];
  const expected = whatif ? [...document.querySelectorAll('#whatif-list li')].filter(row => /^\d/.test(row.textContent.trim())).length : points.length;
  const missing = whatif ? Math.max(0, fork - own.length) + Math.max(0, expected - fresh.length) : expected - new Set(own.map(element => element.dataset.step)).size;
  const labels = [...own, ...fresh];
  const boxes = [...labels, ...[...document.querySelectorAll('.life-alt')].filter(visible)].map(element => element.getBoundingClientRect());
  const map = document.querySelector('.life-overlay').getBoundingClientRect();
  const card = document.querySelector('.life-end:not([hidden])')?.getBoundingClientRect();
  const hits = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  let overlap = 0; let onDot = 0; let outside = 0; let cut = 0; let underCard = 0;
  boxes.forEach((box, i) => {
    for (let j = i + 1; j < boxes.length; j += 1) if (hits(box, boxes[j])) overlap += 1;
    if (points.some(point => point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.bottom)) onDot += 1;
    if (box.left < map.left - 1 || box.right > map.right + 1 || box.top < map.top - 1 || box.bottom > map.bottom + 1) outside += 1;
    if (card && i < labels.length && hits(box, card)) underCard += 1;
  });
  // Whole: the label's own text is no wider than its box (its leader is a child and may reach out).
  labels.forEach(element => {
    const range = document.createRange();
    range.selectNodeContents(element.firstChild);
    if (range.getBoundingClientRect().width > element.getBoundingClientRect().width + 1) cut += 1;
  });
  const small = labels.filter(element => parseFloat(getComputedStyle(element).fontSize) < 14).length;
  return { steps: whatif ? fork + expected : expected, labels: labels.length, missing, overlap, onDot, outside, cut, underCard, small };
};
function labelsTask(item, size) {
  return {
    size,
    contextOptions: { reducedMotion: 'reduce' },
    run: async page => {
      const query = item.alt ? `life=${item.life}&fork=${item.fork}&alt=${item.alt}&seed=${item.seed}` : `life=${item.life}`;
      await page.goto(`${PAGE}?${query}#paths-life`);
      await ready(page);
      await page.waitForTimeout(1500);
      return { item, size, labels: await page.evaluate(measureLabels, item.alt ? item.fork : null) };
    },
  };
}
// Two changed lives per person: an early fork and a later one, each with its first choice and a fixed seed.
async function grownCases() {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const engine = await import('../../../../src/lessons/choices/lives/engine.js');
  const { loadStore } = await import('../../../../src/lessons/choices/lives/yaml.js');
  const dir = fileURLToPath(new URL('../../../../src/lessons/choices/lives/', import.meta.url));
  const files = {};
  for (const folder of ['nodes', 'runs', 'baselines']) for (const name of readdirSync(dir + folder)) files[`${folder}/${name}`] = readFileSync(dir + folder + '/' + name, 'utf8');
  const store = loadStore(files);
  const cases = [];
  for (const life of LIVES) {
    const forks = engine.forksOf(store).filter(fork => fork.baseline === life);
    const at = [...new Set(forks.map(fork => fork.forkIndex))];
    [at[1], at[Math.floor(at.length * 0.6)]].forEach((forkIndex, k) => {
      const fork = forks.find(item => item.forkIndex === forkIndex);
      if (fork) cases.push({ life, fork: forkIndex, alt: fork.alt, seed: `r7${k}` });
    });
  }
  return cases;
}

// Layouts per arriving line, then the longest main-thread task at 4x slowdown while the story plays.
function budgetTask(life, size) {
  return {
    size,
    run: async page => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Performance.enable');
      const layouts = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'LayoutCount').value;
      await page.goto(`${PAGE}?life=${life}&pace=quick#paths-life`);
      await ready(page);
      await page.waitForTimeout(800);
      await page.evaluate(() => { opening.player.reset(); opening.player.play(); opening.player.toggle(); });
      const perLine = [];
      for (let step = 1; step < 40; step += 1) {
        const before = await layouts();
        const more = await page.evaluate(() => (opening.player.state.complete ? false : opening.player.advance()));
        if (!more) break;
        perLine.push((await layouts()) - before);
        await page.waitForTimeout(250);
      }
      // The story again, playing by itself, at 4x slowdown, traced.
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.evaluate(() => { opening.player.reset(); });
      await page.waitForTimeout(500);
      // Each line's arrival leaves a mark in the trace (from the task that reveals it).
      await page.evaluate(() => {
        new MutationObserver(records => {
          if (records.some(r => r.target.classList?.contains('life-step') && !r.target.classList.contains('is-pending') && r.oldValue?.includes('is-pending'))) console.timeStamp('line');
        }).observe(document.getElementById('life-steps'), { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
      });
      await page.context().browser().startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
      await page.evaluate(() => opening.player.play());
      await page.waitForFunction(() => opening.player.state.complete, null, { timeout: 120000, polling: 500 });
      let picks = null;
      if (flag('picks')) {
        picks = [];
        for (let pick = 0; pick < 5; pick += 1) {
          await page.evaluate(at => { const all = opening.picks(); opening.pickChoice(all[at % all.length].key); }, pick);
          await page.waitForTimeout(2500);
          await page.evaluate(() => opening.backToLife());
          await page.waitForTimeout(800);
        }
      }
      const trace = JSON.parse((await page.context().browser().stopTracing()).toString());
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const events = trace.traceEvents ?? trace;
      const main = events.find(e => e.name === 'thread_name' && e.args?.name === 'CrRendererMain' && events.some(x => x.pid === e.pid && x.name === 'RunTask' && x.tid === e.tid));
      const tasks = events.filter(e => e.name === 'RunTask' && e.ph === 'X' && e.pid === main?.pid && e.tid === main?.tid).map(e => e.dur / 1000);
      // The task each line arrives in, and every task in the 450 ms its line takes to land.
      const stamps = events.filter(e => e.name === 'TimeStamp' && e.args?.data?.message === 'line').map(e => e.ts);
      const runs = events.filter(e => e.name === 'RunTask' && e.ph === 'X' && e.pid === main?.pid && e.tid === main?.tid);
      const arrival = runs.filter(e => stamps.some(ts => ts >= e.ts && ts <= e.ts + e.dur)).map(e => e.dur / 1000);
      const landing = runs.filter(e => stamps.some(ts => e.ts + e.dur >= ts && e.ts <= ts + 450000)).map(e => e.dur / 1000);
      tasks.sort((a, b) => b - a);
      const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
      const r1 = ms => Math.round(ms * 10) / 10;
      return { life, size, perLine, lines: stamps.length, arrival: r1(Math.max(0, ...arrival)), landing: r1(Math.max(0, ...landing)), worst: tasks.slice(0, 3).map(r1), heap };
    },
  };
}

function coverTask(life, size, rate) {
  return {
    size,
    run: async page => {
      await page.goto(`${PAGE}?life=${life}&pace=normal`);
      await ready(page);
      await page.waitForTimeout(1500);
      if (rate > 1) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate });
      await page.evaluate(() => {
        const log = globalThis.__cover = { frames: [], resized: {}, stage: [], born: null };
        const stage = document.getElementById('stage');
        const box = () => { const r = stage.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width), Math.round(r.height)]; };
        log.stage.push(box());
        new MutationObserver(records => { for (const r of records) { const name = r.target.id || r.target.className; log.resized[name] = (log.resized[name] ?? 0) + 1; } }).observe(stage, { subtree: true, attributes: true, attributeFilter: ['width', 'height'] });
        let last = performance.now();
        const tick = now => {
          log.frames.push(now - last); last = now;
          const b = box(); if (b.join() !== log.stage.at(-1).join()) log.stage.push(b);
          const first = document.querySelector('#life-steps .life-step:not(.is-pending)');
          if (first && !log.lineAt) log.lineAt = now;
          if (!log.lineAt || now - log.lineAt < 500) requestAnimationFrame(tick);
        };
        log.start = performance.now();
        requestAnimationFrame(tick);
      });
      const before = await page.evaluate(() => { const s = document.querySelector('.map-stack').getBoundingClientRect(); return { ox: parseFloat(document.querySelector('.map-stack').style.getPropertyValue('--ox')) + s.left, oy: parseFloat(document.querySelector('.map-stack').style.getPropertyValue('--oy')) + s.top }; });
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => globalThis.__cover.lineAt && performance.now() - globalThis.__cover.lineAt > 600, null, { timeout: 30000, polling: 200 });
      const log = await page.evaluate(() => {
        const s = document.querySelector('.map-stack').getBoundingClientRect();
        const born = opening.scenes.paths.lifePoints()[0];
        return { ...globalThis.__cover, bornAt: { x: born.x + s.left, y: born.y + s.top } };
      });
      const frames = log.frames.slice(1);
      return { life, size, rate, ms: Math.round(log.lineAt - log.start), worst: frames.slice().sort((a, b) => b - a).slice(0, 3).map(ms => Math.round(ms)), over20: frames.filter(ms => ms > 20).length, over33: frames.filter(ms => ms > 33).length, resized: log.resized, stage: log.stage, born: Math.round(Math.hypot(log.bornAt.x - before.ox, log.bornAt.y - before.oy)) };
    },
  };
}

const browser = await launch();
const label = size => `${size[0]}x${size[1]}`;
const out = { engine: ENGINE, story: [], adds: [], room: [], labels: [] };
console.log(`engine ${ENGINE} ${browser.version()}`);

if (flag('budget')) {
  const rows = await pool(browser, SIZES.flatMap(size => LIVES.map(life => budgetTask(life, size))));
  for (const row of rows) {
    if (row.failed) { console.log(`FAILED ${row.failed}`); continue; }
    const lines = row.perLine;
    console.log(`budget  ${label(row.size).padEnd(10)} ${row.life.padEnd(6)} layouts/line max ${Math.max(...lines)} mean ${(lines.reduce((a, b) => a + b, 0) / lines.length).toFixed(1)}  at 4x: arrival task ${row.arrival} ms, longest while a line lands ${row.landing} ms (${row.lines} lines), longest overall ${row.worst.join(', ')} ms  heap ${row.heap ? (row.heap / 1048576).toFixed(1) : '?'} MB`);
  }
  process.exit(0);
}

if (flag('cover')) {
  const life = LIVES[0] === 'amara' && !opt('lives') ? 'theo' : LIVES[0];
  const rates = ENGINE === 'chromium' ? [1, 4] : [1];
  const rows = await pool(browser, SIZES.flatMap(size => rates.map(rate => coverTask(life, size, rate))));
  for (const row of rows) {
    if (row.failed) { console.log(`FAILED ${row.failed}`); continue; }
    console.log(`cover   ${label(row.size).padEnd(10)} ${row.life} ${row.rate}x  first line at ${row.ms} ms; longest frames ${row.worst.join(', ')} ms (${row.over20} over 20, ${row.over33} over 33); canvas bitmap changes ${JSON.stringify(row.resized)}; stage box ${row.stage.map(b => b.join('/')).join(' -> ')}; Born moved ${row.born} px`);
  }
  process.exit(0);
}

if (flag('room')) {
  out.room = await pool(browser, SIZES.map(roomTask));
  for (const row of out.room) console.log(`room ${label(row.size)} ${JSON.stringify(row.room)}`);
}

if (!flag('no-story')) {
  const tasks = SIZES.flatMap(size => LIVES.flatMap(life => PACES.map(pace => storyTask(life, size, pace))));
  out.story = await pool(browser, tasks);
  console.log('\nstory   size       life   pace    scroll  body  over  out  slack  rows  short  sizes (lines / ages)');
  for (const row of out.story) {
    if (row.failed) { console.log(`FAILED ${row.failed}`); continue; }
    const e = row.end;
    console.log(`story   ${label(row.size).padEnd(10)} ${row.life.padEnd(6)} ${row.pace.padEnd(7)} ${String(row.scroll).padStart(6)} ${String(row.bodyScroll).padStart(5)} ${String(e.over).padStart(5)} ${String(e.out).padStart(4)} ${String(e.slack).padStart(6)} ${String(e.rows).padStart(5)} ${String(e.short).padStart(6)}  ${e.lineSizes.join(',')} / ${e.ageSizes.join(',')}${row.errors.length ? `  ERRORS ${row.errors.length}` : ''}`);
  }
  const bad = out.story.filter(row => row.failed || row.scroll || row.bodyScroll || row.end?.out || row.end?.over);
  console.log(`story: ${out.story.length} runs, ${bad.length} with scroll, overflow or rows out of view`);
}

if (!flag('no-adds')) {
  out.adds = await pool(browser, SIZES.flatMap(size => LIVES.map(life => addsTask(life, size))));
  console.log('\nadds    size       life    shown  clashes');
  for (const row of out.adds) {
    if (row.failed) { console.log(`FAILED ${row.failed}`); continue; }
    console.log(`adds    ${label(row.size).padEnd(10)} ${row.life.padEnd(6)}  ${row.adds.shown}/3    ${row.adds.clashes.join(' ') || '-'}${row.errors.length ? `  ERRORS ${row.errors.length}` : ''}`);
  }
  const bad = out.adds.filter(row => row.failed || row.adds.shown < 3 || row.adds.clashes.length);
  console.log(`adds: ${out.adds.length} runs, ${bad.length} not 3/3 and clear`);
}

if (!flag('no-labels')) {
  const items = [...LIVES.map(life => ({ life })), ...(flag('no-grown') ? [] : await grownCases())];
  out.labels = await pool(browser, SIZES.flatMap(size => items.map(item => labelsTask(item, size))));
  console.log('\nlabels  size       life    change                    steps  missing  overlap  on-dot  outside  cut  under-card');
  for (const row of out.labels) {
    if (row.failed) { console.log(`FAILED ${row.failed}`); continue; }
    const l = row.labels;
    const change = row.item.alt ? `${row.item.fork}:${row.item.alt}` : '-';
    const bad = l.missing || l.overlap || l.onDot || l.outside || l.cut || l.underCard;
    if (bad || flag('all-rows')) console.log(`labels  ${label(row.size).padEnd(10)} ${row.item.life.padEnd(6)}  ${change.padEnd(24)}  ${String(l.steps).padStart(5)}  ${String(l.missing).padStart(7)}  ${String(l.overlap).padStart(7)}  ${String(l.onDot).padStart(6)}  ${String(l.outside).padStart(7)}  ${String(l.cut).padStart(3)}  ${String(l.underCard).padStart(10)}${row.errors.length ? `  ERRORS ${row.errors.length}` : ''}`);
  }
  const bad = out.labels.filter(row => row.failed || row.labels.missing || row.labels.overlap || row.labels.onDot || row.labels.outside || row.labels.cut || row.labels.underCard);
  console.log(`labels: ${out.labels.length} lives × sizes (written and changed), ${bad.length} with a step missing its label or a label not whole and clear`);
  const small = out.labels.filter(row => row.labels?.small);
  console.log(`labels: ${out.labels.reduce((sum, row) => sum + (row.labels?.labels ?? 0), 0)} labels checked; at 13 px (the last resort): ${small.reduce((sum, row) => sum + row.labels.small, 0)}${small.length ? ` (${small.map(row => `${row.item.life}${row.item.alt ? ` ${row.item.fork}:${row.item.alt}` : ''} at ${label(row.size)}`).join(', ')})` : ''}`);
}

const errorCount = [...out.story, ...out.adds, ...out.room, ...out.labels].reduce((sum, row) => sum + (row.errors?.length ?? 0), 0);
console.log(`console errors: ${errorCount}`);
if (opt('json')) writeFileSync(opt('json'), JSON.stringify(out, null, 1));
await browser.close();
