// Study copy of createLifeTree from src/lessons/choices/journey-explore.js for
// the Lesson 1 opening (design 001 v13, round 3). The same lazily grown,
// seeded tree of example choices, with five changes so it can grow a life from
// one of Sam's forks:
// - `start`: the root is a given node (an alternative Sam didn't take), not age 3;
// - `end`: the life stops at 41, Sam's last step, instead of 70;
// - `taken`: the steps Sam's life had already taken before the fork, so chains
//   (guitar → band → radio) carry on as they would in the explorer;
// - `firstBand` / `firstGap`: where the root's first options may go (on its own
//   side of Sam's path) and how far ahead they fork, so the gray tails behind
//   the story stay clear of his route;
// - a lucky break lifts the path and a setback drops it, as on Sam's route;
// - `spread` and `settle`: how far a fork's options may swing (the explorer's
//   0.38) and how strongly a life drifts back toward the middle (the explorer's
//   0.8 keeps 80% of its height), so a life that starts high or low isn't held
//   there: where a choice starts on the map doesn't decide where its life ends.
// Pure: no DOM.
import { hash, labelsForFork, closedReason, availableSteps, stepLabel } from '../../src/lessons/choices/journey-choices.js';

const LOOKAHEAD = 4;
export const isSurprise = node => node.kind === 'lucky' || node.kind === 'roadblock';

export function gapFor(age) {
  if (age < 7) return 2.2;
  if (age < 12) return 2.7;
  if (age < 19) return 3;
  if (age < 26) return 3.8;
  if (age < 41) return 6;
  if (age < 56) return 8.5;
  return 11;
}

export function createLifeTree({ seed, start, end = 41, taken: before = [], firstBand = null, firstGap = 1, spread = 0.38, settle = 0.8 }) {
  const nodes = new Map();
  nodes.set('r', {
    id: 'r', age: start.age, y: start.y, ay: start.y, parent: null,
    step: start.step ?? null, kind: start.kind ?? 'choice', big: false, label: start.label ?? null,
    byFamily: Boolean(start.byFamily), closed: false, reason: null, bend: 0, jitter: 0, children: null,
  });
  const key = id => `${seed}:${id}`;

  function pathTo(id) {
    const path = [];
    for (let node = nodes.get(id); node; node = nodes.get(node.parent)) path.unshift(node);
    return path;
  }

  // A surprise happens at about one fork in three once the life is under way,
  // more often when the life's own chain has one waiting.
  function surpriseFor(node, path, taken) {
    if (node.kind !== 'choice' || node.age < 6 || node.age > end - 4) return null;
    const waiting = availableSteps(node.age, taken, node.step).filter(item => item.kind !== 'choice');
    if (!waiting.length) return null;
    const fromChain = waiting.filter(item => item.after.length);
    if (hash(key(`${node.id}:surprise`)) > (fromChain.length ? 0.42 : 0.22)) return null;
    // Lucky breaks and roadblocks take turns, so a life meets both.
    const seen = path.filter(item => item.kind === 'lucky').length - path.filter(item => item.kind === 'roadblock').length;
    const pool = fromChain.length ? fromChain : waiting;
    const wanted = seen > 0 ? 'roadblock' : seen < 0 ? 'lucky' : hash(key(`${node.id}:luck`)) < 0.5 ? 'lucky' : 'roadblock';
    const preferred = pool.filter(item => item.kind === wanted);
    const anyTime = waiting.filter(item => item.kind === wanted);
    const list = preferred.length ? preferred : anyTime.length ? anyTime : pool;
    return list[Math.floor(hash(key(`${node.id}:which-surprise`)) * list.length)];
  }

  // Newest first: steps unlocked by the most recent part of the path lead.
  function rankChain(steps, path) {
    const recency = id => path.findLastIndex(item => item.step === id);
    const score = item => Math.max(-1, ...item.after.map(recency));
    return steps.sort((a, b) => score(b) - score(a) || hash(key(`${a.id}:rank`)) - hash(key(`${b.id}:rank`)));
  }

  function children(id) {
    const node = nodes.get(id);
    if (!node) return [];
    if (node.children) return node.children.map(child => nodes.get(child));
    if (node.age >= end - 0.01) { node.children = []; return []; }
    const path = pathTo(id);
    const taken = new Set([...before, ...path.map(item => item.step).filter(Boolean)]);
    const used = path.map(item => item.label).filter(Boolean);
    const add = (index, item, extra = {}) => {
      const childId = `${id}.${index}`;
      const big = Boolean(item.big);
      const surprise = item.kind !== 'choice';
      const factor = (surprise ? (big ? 0.8 : 0.45) : big ? 1.55 : 1) * (id === 'r' ? firstGap : 1);
      let age = node.age + Math.max(0.6, gapFor(node.age) * factor * (0.75 + 0.6 * hash(key(`${childId}:gap`))));
      if (age > end - 1.5) age = end;
      nodes.set(childId, {
        id: childId,
        age: Math.round(age * 10) / 10,
        y: null,
        ay: node.y ?? node.ay,
        parent: id,
        step: item.id ?? null,
        kind: item.kind ?? 'choice',
        big,
        label: item.label,
        byFamily: Boolean(item.byFamily),
        closed: false,
        reason: null,
        bend: (hash(key(`${childId}:bend`)) - 0.5) * (big ? 0.02 : 0.05),
        jitter: hash(key(`${childId}:y`)) - 0.5,
        children: null,
        ...extra,
      });
      node.children.push(childId);
    };
    node.children = [];

    const surprise = surpriseFor(node, path, taken);
    if (surprise) {
      add(0, { ...surprise, label: stepLabel(surprise.id) });
      return node.children.map(child => nodes.get(child));
    }

    const count = hash(key(`${id}:count`)) < (node.age < 19 ? 0.5 : 0.35) ? 3 : 2;
    const open = availableSteps(node.age, taken, node.step)
      .filter(item => item.kind === 'choice')
      .map(item => ({ ...item, label: stepLabel(item.id) }))
      .filter(item => !used.includes(item.label));
    const chain = rankChain(open.filter(item => item.after.length), path);
    const starters = open.filter(item => !item.after.length)
      .sort((a, b) => hash(key(`${id}:${a.id}`)) - hash(key(`${id}:${b.id}`)));
    // Up to two steps that build on the path, then something new.
    const picked = chain.slice(0, count - 1);
    if (starters.length && hash(key(`${id}:starter`)) < 0.6) picked.push(starters[0]);
    const avoid = [...used, ...picked.map(item => item.label)];
    const { labels, byFamily } = labelsForFork(node.age, key(id), count - picked.length, avoid);
    const options = [...picked, ...labels.map(label => ({ id: null, kind: 'choice', label, byFamily }))]
      .sort((a, b) => hash(key(`${id}:order:${a.label}`)) - hash(key(`${id}:order:${b.label}`)));
    const closedIndex = count === 3 && node.age >= 7 && hash(key(`${id}:closed`)) < 0.4
      ? Math.floor(hash(key(`${id}:which`)) * 3) : -1;
    options.forEach((item, index) => add(index, item, index === closedIndex
      ? { closed: true, reason: closedReason(node.age, key(`${id}.${index}`)) } : {}));
    return node.children.map(child => nodes.get(child));
  }

  /** Lay out the unfixed future of `id` in nested bands around it. */
  function layoutAhead(id, depth = LOOKAHEAD) {
    const start = nodes.get(id);
    const centre = 0.5 + ((start.y ?? start.ay) - 0.5) * settle;
    const half = spread;
    const split = (node, lo, hi, level) => {
      if (level > depth) return;
      const list = children(node.id);
      const part = (hi - lo) / list.length;
      list.forEach((child, index) => {
        const childLo = lo + part * index;
        const band = childLo + part * (0.5 + child.jitter * 0.3);
        const parentY = node.y ?? node.ay;
        if (child.y === null) {
          child.ay = level === 1 ? parentY + (band - parentY) * 0.6 : band;
          // Big moves swing far: toward the roomier side, kept inside the band.
          if (child.big) {
            const away = list.length === 1 ? (parentY < 0.5 ? 1 : -1) : (band >= parentY ? 1 : -1);
            const target = parentY + away * (list.length === 1 ? 0.3 : Math.max(0.12, Math.abs(band - parentY)));
            child.ay = Math.min(childLo + part * 0.92, Math.max(childLo + part * 0.08, target));
          }
          // As on Sam's route: luck lifts the path, a setback drops it.
          if (isSurprise(child) && list.length === 1) {
            const lift = (child.big ? 0.2 : 0.11) * (child.kind === 'lucky' ? -1 : 1);
            child.ay = Math.min(hi - 0.02, Math.max(lo + 0.02, parentY + lift));
          }
        }
        split(child, childLo, childLo + part, level + 1);
      });
    };
    const band = id === 'r' && firstBand ? [firstBand.lo, firstBand.hi] : [centre - half, centre + half];
    split(start, Math.max(0.04, band[0]), Math.min(0.96, band[1]), 1);
  }

  /** Fix heights for a chosen step: the chosen node, its siblings and one level of their options. */
  function fix(id) {
    const node = nodes.get(id);
    for (const sibling of children(node.parent)) {
      if (sibling.y === null) sibling.y = sibling.ay;
      for (const grandchild of sibling.id === id ? [] : children(sibling.id)) if (grandchild.y === null) grandchild.y = grandchild.ay;
    }
  }

  /** The life this tree plays by itself: one open option per fork, chosen by the seed, to the end. */
  function autoPath() {
    const path = ['r'];
    for (let guard = 0; guard < 40; guard += 1) {
      const options = children(path.at(-1)).filter(child => !child.closed);
      if (!options.length) break;
      const next = options[Math.floor(hash(key(`${path.at(-1)}:pick`)) * options.length)];
      fix(next.id);
      layoutAhead(next.id);
      path.push(next.id);
    }
    return path.map(id => nodes.get(id));
  }

  layoutAhead('r');
  return { get: id => nodes.get(id), children, pathTo, layoutAhead, fix, autoPath, root: 'r' };
}
