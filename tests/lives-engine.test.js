// The lives engine and checker of the Lesson 1 opening (prototype/lesson1-opening/lives),
// on the fixture store in tests/fixtures/lives (two baselines, about 70 nodes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadStore, check, grow, heights, writtenLife, blocked, newPath, takeStep, say, forksOf, variety, coverage,
} from '../prototype/lesson1-opening/lives/engine.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const FIXTURE = join(root, 'tests/fixtures/lives');

function readStore(dir) {
  const files = {};
  for (const folder of ['nodes', 'baselines']) {
    for (const name of readdirSync(join(dir, folder)).filter(file => file.endsWith('.yaml'))) files[`${folder}/${name}`] = readFileSync(join(dir, folder, name), 'utf8');
  }
  return files;
}
const fixture = loadStore(readStore(FIXTURE));

// A small store written inline: `nodes` is YAML for one nodes file, `baselines` maps id → YAML.
function mini(nodes, baselines = {}) {
  const files = { 'nodes/test.yaml': nodes };
  for (const [id, text] of Object.entries(baselines)) files[`baselines/${id}.yaml`] = text;
  return loadStore(files);
}
const BORN = `
- id: born
  label: Born
  line: "{name} is born."
  kind: start
  ages: [0, 0]
`;
const choice = (id, extra = '') => `
- id: ${id}
  label: ${id}
  line: "{name} does ${id}."
  if: "{name} had done ${id}"
  kind: choice
  ages: [1, 60]
${extra}`;
function pathOf(store, ids) {
  const path = newPath();
  for (const id of ids) takeStep(path, store.nodes.get(id));
  return path;
}
const messages = result => result.errors.map(item => item.message).join('\n');

test('the fixture store has no errors', () => {
  const { errors } = check(fixture);
  assert.deepEqual(errors, []);
  assert.ok(fixture.nodes.size >= 60, `${fixture.nodes.size} nodes`);
  assert.equal(fixture.baselines.size, 2);
});

test('the checker runs on the fixture store and exits 0', () => {
  const run = spawnSync(process.execPath, ['tooling/lives-check.mjs', '--store', 'tests/fixtures/lives', '--lives', '5', '--random', '300', '--samples', '1', '--seed', 'test'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /Errors: none/);
  assert.match(run.stdout, /Variety: 5 grown lives from each of \d+ alternatives/);
  assert.match(run.stdout, /Coverage: 300 random lives/);
  assert.match(run.stdout, /Age +0 +(Sam|Nia) is born\./);
});

test('after: one of the names must already be on the path', () => {
  const store = mini(BORN + choice('guitar', '  tags: [instrument]') + choice('band', '  after: [instrument, sings]'));
  assert.equal(blocked(store.nodes.get('band'), pathOf(store, ['born']), 14).rule, 'after');
  assert.equal(blocked(store.nodes.get('band'), pathOf(store, ['born', 'guitar']), 14), null);
});

test('needs: every name; unless: none of them', () => {
  const store = mini(BORN + choice('a', '  tags: [x]') + choice('b', '  tags: [y]') + choice('c', '  needs: [x, y]') + choice('d', '  unless: [y]'));
  assert.equal(blocked(store.nodes.get('c'), pathOf(store, ['born', 'a']), 10).rule, 'needs');
  assert.equal(blocked(store.nodes.get('c'), pathOf(store, ['born', 'a', 'b']), 10), null);
  assert.equal(blocked(store.nodes.get('d'), pathOf(store, ['born', 'a']), 10), null);
  assert.equal(blocked(store.nodes.get('d'), pathOf(store, ['born', 'b']), 10).rule, 'unless');
});

test('within: the match must be among the last N steps, at most four years before', () => {
  const store = mini(`${BORN}
- id: fall
  label: Fall
  line: "{name} falls."
  kind: setback
  ages: [1, 60]
  move: -1
${choice('a')}${choice('b')}${choice('help', '  after: [setback]\n  within: 2')}`);
  const help = store.nodes.get('help');
  assert.equal(blocked(help, pathOf(store, ['born', 'fall']), 10), null);
  assert.equal(blocked(help, pathOf(store, ['born', 'fall', 'a']), 10), null);
  assert.equal(blocked(help, pathOf(store, ['born', 'fall', 'a', 'b']), 10).rule, 'within');
  const dated = newPath();
  takeStep(dated, store.nodes.get('born'), 0);
  takeStep(dated, store.nodes.get('fall'), 20);
  assert.equal(blocked(help, dated, 24), null);
  assert.equal(blocked(help, dated, 25).rule, 'within');
});

test('drops: a dropped name no longer counts; a node happens once', () => {
  const store = mini(`${BORN}${choice('band', '  tags: [inBand]\n  unless: [inBand]')}${choice('song', '  after: [inBand]')}
- id: splits
  label: Splits
  line: "The band splits."
  kind: setback
  ages: [1, 60]
  after: [inBand]
  drops: [inBand]
  move: -2
`);
  const path = pathOf(store, ['born', 'band']);
  assert.equal(blocked(store.nodes.get('song'), path, 10), null);
  assert.equal(blocked(store.nodes.get('band'), pathOf(store, ['born', 'band']), 10).rule, 'once');
  takeStep(path, store.nodes.get('splits'));
  assert.equal(blocked(store.nodes.get('song'), path, 12).rule, 'after');
});

test('ages: inside the range, inclusive', () => {
  const store = mini(BORN + choice('teen', '').replace('ages: [1, 60]', 'ages: [13, 19]'));
  const path = pathOf(store, ['born']);
  assert.equal(blocked(store.nodes.get('teen'), path, 12).rule, 'ages');
  assert.equal(blocked(store.nodes.get('teen'), path, 13), null);
  assert.equal(blocked(store.nodes.get('teen'), path, 19), null);
  assert.equal(blocked(store.nodes.get('teen'), path, 20).rule, 'ages');
});

test('the same seed grows the same life; other seeds grow others', () => {
  const fork = { baseline: 'sam', forkIndex: 2, alt: 'drums' };
  const ids = life => life.steps.map(step => `${step.age}:${step.id}`).join(' ');
  assert.equal(ids(grow(fixture, { ...fork, seed: 'abc' })), ids(grow(fixture, { ...fork, seed: 'abc' })));
  const lives = new Set(Array.from({ length: 12 }, (_, i) => ids(grow(fixture, { ...fork, seed: `s${i}` }))));
  assert.ok(lives.size >= 10, `${lives.size} different lives of 12`);
});

test('every grown fixture life reaches its end, and every step is possible where it stands', () => {
  let grownSteps = 0; let withOthers = 0;
  for (const fork of forksOf(fixture)) {
    for (let i = 0; i < 25; i += 1) {
      const life = grow(fixture, { ...fork, seed: `reach-${i}` });
      assert.equal(life.lastAge, life.end, `${fork.baseline} ${fork.alt} seed ${i} ends at ${life.lastAge}`);
      assert.equal(life.endedEarly, false);
      const path = newPath();
      life.steps.forEach((step, index) => {
        if (index > 0) assert.equal(blocked(step.node, path, step.age), null, `${fork.baseline} ${fork.alt} seed ${i}: ${step.id} at ${step.age}`);
        if (index > 0) assert.ok(step.age > life.steps[index - 1].age);
        takeStep(path, step.node);
      });
      for (const step of life.steps.slice(fork.forkIndex + 1)) {
        grownSteps += 1;
        if (step.others.length) withOthers += 1;
        assert.ok(step.others.length <= 2 && step.others.every(other => other.id !== step.id));
      }
    }
  }
  // Each grown dot carries one or two other candidates as gray lines.
  assert.ok(withOthers / grownSteps > 0.95, `${withOthers} of ${grownSteps} grown steps have other candidates`);
});

test('a grown life keeps the steps before the fork and takes the alternative at its age', () => {
  const life = grow(fixture, { baseline: 'sam', forkIndex: 3, alt: 'schoolTeam', seed: 'x' });
  const written = writtenLife(fixture, 'sam');
  assert.deepEqual(life.steps.slice(0, 3).map(step => step.id), ['born', 'choir', 'guitar']);
  assert.deepEqual(life.steps.slice(0, 3).map(step => step.y), written.steps.slice(0, 3).map(step => step.y));
  assert.equal(life.steps[3].id, 'schoolTeam');
  assert.equal(life.steps[3].age, 14);
  assert.ok(life.steps.slice(4).every(step => step.grown));
});

test('lucky breaks and setbacks: about one fork in three from 8, taking turns, none in the last four years', () => {
  let surprises = 0; let window = 0; let twiceRunning = 0;
  for (const fork of forksOf(fixture)) {
    for (let i = 0; i < 40; i += 1) {
      const life = grow(fixture, { ...fork, seed: `t${i}` });
      const grown = life.steps.slice(fork.forkIndex + 1);
      for (const step of grown) {
        const surprise = step.kind === 'lucky' || step.kind === 'setback';
        assert.ok(!(surprise && step.age > life.end - 4), `${fork.baseline} ${fork.alt} seed ${i}: ${step.id} at ${step.age}, end ${life.end}`);
        if (step.age >= 8 && step.age <= life.end - 4) { window += 1; if (surprise) surprises += 1; }
      }
      const last = life.steps.at(-1);
      assert.ok(last.kind !== 'lucky' && last.kind !== 'setback', `ends on ${last.id}`);
      const kinds = grown.map(step => step.kind).filter(kind => kind === 'lucky' || kind === 'setback');
      kinds.forEach((kind, index) => { if (index && kind === kinds[index - 1]) twiceRunning += 1; });
    }
  }
  const share = surprises / window;
  assert.ok(share > 0.26 && share < 0.42, `surprises at ${share.toFixed(2)} of the forks from 8 to end − 4`);
  assert.ok(twiceRunning / surprises < 0.25, `${twiceRunning} of ${surprises} surprises repeat the last one's kind`);
});

test('a grown life builds on itself: where it can build on the last two steps, it mostly does', () => {
  let could = 0; let building = 0; let grownSteps = 0; let built = 0;
  for (const fork of forksOf(fixture)) {
    for (let i = 0; i < 30; i += 1) {
      const life = grow(fixture, { ...fork, seed: `b${i}` });
      for (const step of life.steps.slice(fork.forkIndex + 1)) {
        grownSteps += 1;
        if (step.builds) built += 1;
        if (!step.couldBuild) continue;
        could += 1;
        if (step.builds) building += 1;
      }
    }
  }
  assert.ok(building / could > 0.65, `${building} of ${could} steps that could build on the last two did`);
  assert.ok(built / grownSteps > 0.3, `${built} of ${grownSteps} grown steps build on the last two`);
});

test('after a lucky break or a setback the next step comes sooner', () => {
  const gaps = { after: [], other: [] };
  for (let i = 0; i < 300; i += 1) {
    const life = grow(fixture, { baseline: 'sam', forkIndex: 2, alt: 'chessClub', seed: `g${i}` });
    life.steps.slice(3).forEach((step, index) => {
      const before = life.steps[index + 2];
      if (before.age < 12 || before.age > 30) return;
      (before.kind === 'lucky' || before.kind === 'setback' ? gaps.after : gaps.other).push(step.age - before.age);
    });
  }
  const mean = list => list.reduce((sum, value) => sum + value, 0) / list.length;
  assert.ok(mean(gaps.after) < mean(gaps.other) * 0.75, `after a surprise ${mean(gaps.after).toFixed(1)} years, otherwise ${mean(gaps.other).toFixed(1)}`);
});

test('setbacks are mostly answered soon, and surprises mostly follow the life’s own story', () => {
  const { tells, lives } = coverage(fixture, { lives: 2000, seed: 'tells' });
  assert.equal(tells.endSurprise, 0, `${tells.endSurprise} of ${lives} lives end on a surprise`);
  assert.ok(tells.answered / tells.setbacks >= 0.6, `${tells.answered} of ${tells.setbacks} setbacks answered within four years`);
  assert.ok(tells.ownStory / tells.surprises >= 0.5, `${tells.ownStory} of ${tells.surprises} surprises follow the life's own story`);
  // An answer that comes on the next step comes 1–2 years later, mostly.
  const gaps = [];
  for (const fork of forksOf(fixture)) {
    for (let i = 0; i < 20; i += 1) {
      const { steps } = grow(fixture, { ...fork, seed: `a${i}` });
      steps.forEach((step, index) => {
        const next = steps[index + 1];
        if (index > fork.forkIndex && step.kind === 'setback' && next?.node.within && next.node.after.some(name => step.node.gives.includes(name))) gaps.push(next.age - step.age);
      });
    }
  }
  assert.ok(gaps.length > 20 && gaps.filter(gap => gap <= 2).length / gaps.length > 0.8, `answer gaps ${gaps.join(' ')}`);
});

test('old interests fade: an after match through a step the life left long ago weighs less', () => {
  const store = mini(`${BORN}${choice('dance', '  tags: [dancing]')}${choice('quiet')}${choice('steps', '  tags: [dancing]').replace('ages: [1, 60]', 'ages: [10, 10]')}
${choice('show', '  after: [dancing]').replace('ages: [1, 60]', 'ages: [19, 21]')}
${Array.from({ length: 12 }, (_, i) => choice(`fill${i}`)).join('')}`, {
    pat: `
id: pat
name: Pat
pronoun: she
end: 40
steps:
  - { node: born, age: 0 }
  - { node: dance, age: 4 }
  - node: quiet
    age: 10
    alts: [steps]
  - { node: fill0, age: 20 }
  - { node: fill1, age: 30 }
  - { node: fill2, age: 40 }
`,
  });
  const shows = alt => {
    let count = 0;
    for (let i = 0; i < 400; i += 1) if (grow(store, { baseline: 'pat', forkIndex: 2, alt, seed: `s${i}` }).steps.some(step => step.id === 'show')) count += 1;
    return count;
  };
  // Dancing at 4 only: 15+ years old by 19. Dancing again at 10: still fresh.
  const stale = shows('quiet');
  const fresh = shows('steps');
  assert.ok(stale * 3 < fresh, `show after dancing at 4 only: ${stale} of 400; after dancing at 10 too: ${fresh}`);
});

test("heights: Sam's written life lands within 0.07 of round 3's", () => {
  const round3 = [0.5, 0.515, 0.49, 0.505, 0.49, 0.4, 0.29, 0.33, 0.78, 0.67, 0.55, 0.45, 0.36, 0.27];
  const sam = writtenLife(fixture, 'sam');
  sam.steps.forEach((step, index) => assert.ok(Math.abs(step.y - round3[index]) <= 0.07 + 1e-9, `${step.id}: ${step.y.toFixed(3)} vs ${round3[index]}`));
  // A big jump is 0.42; a written y wins.
  assert.deepEqual(heights([{ id: 'a', kind: 'start' }, { id: 'b', kind: 'setback', move: -3 }]).map(y => +y.toFixed(3)), [0.5, 0.92]);
  assert.equal(heights([{ id: 'a', kind: 'start' }, { id: 'b', kind: 'choice', move: 0, fixedY: 0.3 }])[1], 0.3);
  // Heights already worked out are not overrides: the same steps give the same heights again.
  const life = grow(fixture, { baseline: 'sam', forkIndex: 2, alt: 'drums', seed: 'h' });
  assert.deepEqual(heights(life.steps), life.steps.map(step => step.y));
});

test('words: names, pronouns and He/She after the first line', () => {
  const her = { name: 'Nia', pronoun: 'she' };
  assert.equal(say('{name} picks guitar.', her), 'Nia picks guitar.');
  assert.equal(say('{name} picks guitar.', her, { lead: true }), 'She picks guitar.');
  assert.equal(say('{his} parents sign {him} up.', her), 'Her parents sign her up.');
  assert.equal(say('{name} had picked guitar', { name: 'Sam', pronoun: 'he' }, { capital: false, lead: false }), 'Sam had picked guitar');
  const life = writtenLife(fixture, 'nia');
  assert.equal(life.steps[0].line, 'Nia is born.');
  assert.equal(life.steps[3].line, 'She joins a coding club after school.');
  assert.equal(life.steps[1].alts[0].whatIf, 'her parents had picked drawing class');
});

test('echoes: written ones, else what satisfied the after', () => {
  const sam = writtenLife(fixture, 'sam');
  const at = id => sam.steps.findIndex(step => step.id === id);
  assert.deepEqual(sam.steps[at('watchesChildPerform')].echoes, [at('choir')]);
  assert.deepEqual(sam.steps[at('ownSong')].echoes, [at('startsBand')]);
  assert.deepEqual(sam.steps[at('recordDeal')].echoes, [at('radioPlay'), at('ownSong')]);
});

test('the checker catches each kind of mistake', () => {
  const store = mini(`${BORN}
- id: guitar
  label: Picks a very long guitar name
  line: "{name} picks guitar and then plays it every single day for many years."
  kind: choice
  ages: [12, 7]
  tags: [instrument, drums]
- id: drums
  label: Drums
  line: "{name}'s drums are loud. {nam}"
  if: "{name} had picked drums"
  kind: choice
  ages: [7, 16]
  after: [instruments]
- id: drums
  label: Drums again
  line: "{name} picks drums."
  if: "x"
  kind: choice
  ages: [7, 16]
- id: luck
  label: Luck
  line: "A DJ plays your song."
  kind: lucky
  ages: [10, 40]
  move: 0
- id: fall
  label: Fall
  line: "{name} falls."
  kind: setback
  ages: [10, 40]
  move: 1
- id: nap
  label: Nap
  line: "{name} naps."
  if: "{name} had napped"
  kind: choice
  ages: [1, 40]
  move: 1
`, {
    sam: `id: sam
name: Sam
pronoun: he
end: 50
steps:
  - { node: born, age: 0 }
  - { node: drums, age: 8 }
  - { node: luck, age: 12, alts: [nap] }
  - { node: nap, age: 9, alts: [guitar, ghost] }
`,
  });
  const text = messages(check(store));
  for (const expected of [
    /Label "Picks a very long guitar name" is 29 characters/,
    /is 13 words/,
    /Bad ages \[12,7\]/,
    /Tag "drums" is named like the node "drums"/,
    /A choice needs an "if"/,
    /Duplicate id "drums"/,
    /Unknown name "instruments" in after/,
    /Unknown token \{nam\}/,
    /starts with \{name\}'s/,
    /speaks to the reader/,
    /A lucky break lifts the path/,
    /A setback drops the path/,
    /A choice never moves the path/,
    /end must be 38 to 45/,
    /4 steps: a written life has 12 to 15/,
    /drums at 8 isn't possible here: none of \[instruments\] is on the path/,
    /Only choices have alternatives; luck is a lucky break/,
    /comes after age 12: ages must go up/,
    /Unknown alternative "ghost"/,
    /The last step is at 9, not at end \(50\)/,
  ]) assert.match(text, expected);
});

test('the checker: alternatives need six years to grow, and within holds in written lives too', () => {
  const files = readStore(FIXTURE);
  files['baselines/nia.yaml'] = files['baselines/nia.yaml']
    .replace('age: 43\n    echoes: [codingClub]', 'age: 43\n    alts: [volunteers]\n    echoes: [codingClub]')
    .replace('age: 33\n    alts: [findsNewJob, movesHome]', 'age: 36\n    alts: [findsNewJob, movesHome]')
    .replace('age: 36\n    move: 1', 'age: 37\n    move: 1');
  const text = messages(check(loadStore(files)));
  assert.match(text, /Alternatives at 43, less than 6 years before end \(43\)/);
  // Nia's job ends at 31; finding a new one at 36 is five years on.
  assert.match(text, /Alternative findsNewJob at 36 isn't possible here: .* at most 4 years before \(within\)/);
});

test('the variety report and coverage run on the fixture', () => {
  const rows = variety(fixture, { lives: 8 });
  assert.equal(rows.length, forksOf(fixture).length);
  for (const row of rows) {
    assert.ok(row.reach === 1, `${row.baseline} ${row.alt} reach ${row.reach}`);
    assert.ok(row.overlap === null || (row.overlap >= 0 && row.overlap <= 1));
  }
  const report = coverage(fixture, { lives: 400 });
  assert.equal(report.total, fixture.nodes.size - 1);
  assert.ok(report.used / report.total > 0.8, `${report.used}/${report.total} nodes used`);
});
