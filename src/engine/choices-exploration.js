import { generateNetwork, projectScenario } from './path-network.js';
import { generateLabFuture } from './lab-future.js';
import { LAB_DEFAULTS, LAB_MAX_AGE, networkOptionsForLab, normalizeLabSettings } from './lab-settings.js';

const EPS = 1e-7;
const clampAge = (age, maxAge) => Math.max(0, Math.min(maxAge, Number.isFinite(Number(age)) ? Number(age) : 12));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Preserve the existing drawing at entry, then use one connected, frozen graph. */
export function createExplorationNetwork({ age = 12, settings: input = LAB_DEFAULTS } = {}) {
  const settings = normalizeLabSettings(input);
  const startAge = clampAge(age, LAB_MAX_AGE);
  const base = generateNetwork(networkOptionsForLab(settings, { today: startAge }));
  const projection = projectScenario(base, { age: startAge, choiceSeed: settings.choiceSeed });
  const fan = generateLabFuture(base, projection, settings);
  if (!fan) return base;

  const nodes = new Map(base.nodes.map(node => [node.id, { ...node, outgoing: [...node.outgoing] }]));
  const current = base.edges.find(edge => edge.id === projection.today.edgeId);
  const atNode = Math.abs(nodes.get(current.from).age - startAge) < EPS;
  const joinId = atNode ? current.from : 'future:join';
  const removed = new Set();
  const collect = id => {
    if (removed.has(id)) return;
    removed.add(id);
    for (const edgeId of nodes.get(id).outgoing) {
      collect(base.edges.find(edge => edge.id === edgeId).to);
    }
  };
  if (atNode) {
    for (const edgeId of nodes.get(joinId).outgoing) {
      collect(base.edges.find(edge => edge.id === edgeId).to);
    }
  } else {
    collect(current.to);
    nodes.set(joinId, { id: joinId, x: projection.today.x, y: projection.today.y, age: startAge, outgoing: [] });
  }
  for (const id of removed) nodes.delete(id);
  const edges = base.edges.filter(edge => !removed.has(edge.from)
    && !(atNode && edge.from === joinId) && (!removed.has(edge.to) || edge.id === current.id))
    .map(edge => {
      const { reachableUntilAge, ...copy } = edge;
      if (!atNode && edge.id === current.id) {
        const points = edge.points.filter(point => point.age < startAge);
        points.push({ age: startAge, x: projection.today.x, y: projection.today.y });
        return { ...copy, to: joinId, points };
      }
      return copy;
    });
  const nodeId = id => id === fan.rootId ? joinId : `future:${id}`;
  const edgeId = id => `future:${id}`;
  const fanRoot = fan.nodes.find(node => node.id === fan.rootId);
  nodes.get(joinId).outgoing = fanRoot.outgoing.map(edgeId);
  for (const node of fan.nodes) {
    if (node.id === fan.rootId) continue;
    nodes.set(nodeId(node.id), { ...node, id: nodeId(node.id), outgoing: node.outgoing.map(edgeId) });
  }
  for (const edge of fan.edges) {
    const { reachableUntilAge, ...copy } = edge;
    edges.push({ ...copy, id: edgeId(edge.id), from: nodeId(edge.from), to: nodeId(edge.to) });
  }
  const allNodes = [...nodes.values()];
  return freeze({
    ...base,
    nodes: allNodes,
    edges,
    choicePoints: allNodes.filter(node => node.outgoing.length > 1).map(node => ({
      id: node.id, x: node.x, y: node.y, age: node.age, options: [...node.outgoing],
    })),
  });
}

/** Pure scenario state. Geometry never changes after construction. */
export function createExplorationSession({
  network: supplied, age: inputAge = 12, settings = LAB_DEFAULTS,
  choiceSeed = settings.choiceSeed ?? LAB_DEFAULTS.choiceSeed, choices: initialChoices = {},
} = {}) {
  const network = supplied ? freeze(structuredClone(supplied))
    : createExplorationNetwork({ age: inputAge, settings });
  const nodes = new Map(network.nodes.map(node => [node.id, node]));
  const edges = new Map(network.edges.map(edge => [edge.id, edge]));
  const incoming = new Map(network.edges.map(edge => [edge.to, edge]));
  let age = clampAge(inputAge, network.maxAge);
  let selections = Object.fromEntries(Object.entries(initialChoices).filter(([id, edge]) => nodes.get(id)?.outgoing.includes(edge)));
  let projection;
  let previewed = null;
  const project = () => {
    projection = projectScenario(network, { age, choiceSeed, choices: selections });
  };
  project();
  const forkNodes = () => projection.selections.map(selection => nodes.get(selection.pointId));
  const activeFork = () => age < projection.routeEndAge - EPS
    ? forkNodes().find(node => node.age >= age - EPS) ?? null : null;
  const stateForEdge = id => projection.segments.find(segment => segment.edgeId === id && segment.state === 'possible')
    ?? projection.segments.find(segment => segment.edgeId === id);
  const ageLabel = value => Number(value.toFixed(1)).toString();
  const verticalPosition = node => {
    const top = network.bounds.y;
    const portion = (node.y - top) / network.bounds.height;
    return portion < 1 / 3 ? 'upper' : portion > 2 / 3 ? 'lower' : 'middle';
  };
  const destinationFor = firstEdge => {
    let destination = nodes.get(firstEdge.to);
    const visited = new Set();
    while (destination?.outgoing.length === 1 && !visited.has(destination.id)) {
      visited.add(destination.id);
      destination = nodes.get(edges.get(destination.outgoing[0])?.to);
    }
    return destination;
  };
  function describe(id) {
    const edge = edges.get(id);
    if (!edge) return null;
    const source = nodes.get(edge.from);
    const siblings = source.outgoing.map(id => edges.get(id)).sort((a, b) => a.points.at(-1).y - b.points.at(-1).y);
    const index = siblings.findIndex(item => item.id === id);
    const pathName = siblings.length === 1 ? 'Continuing path'
      : index === 0 ? 'Upper path'
        : index === siblings.length - 1 ? 'Lower path'
          : siblings.length === 3 ? 'Middle path' : `Middle path ${index}`;
    const sourceKind = source.outgoing.length > 1 ? 'fork' : 'point';
    const label = `${pathName} · ${verticalPosition(source)} ${sourceKind} at ${ageLabel(source.age)}`;
    const destination = destinationFor(edge);
    const destinationDescription = destination?.outgoing.length > 1
      ? `Leads to another fork near age ${ageLabel(destination.age)}.`
      : `Continues to the edge of this drawing near age ${ageLabel(destination.age)}.`;
    const state = stateForEdge(id);
    const available = state?.state === 'possible';
    const revisitPointId = state?.untakenAtNodeId ?? (state?.state === 'completed' && source.outgoing.length > 1 ? source.id : null);
    return {
      id, label, available, revisitPointId,
      description: available
        ? destinationDescription
        : state?.state === 'completed'
          ? `${destinationDescription} Part of the selected past. Revisit an earlier choice to try another route.`
          : `${destinationDescription} Separated at an earlier choice. Revisit that fork to try it.`,
    };
  }
  function snapshot() {
    const active = activeFork();
    const selected = active ? selections[active.id] : undefined;
    return {
      network, projection, age, selections: { ...selections },
      activeChoiceId: active?.id ?? null,
      choices: active ? active.outgoing.map(id => ({ ...describe(id), selected: selected === id })) : [],
      preview: previewed ? describe(previewed) : null,
      canPrevious: age > EPS,
      canNext: age < Math.min(projection.routeEndAge, network.maxAge) - EPS,
      status: age >= projection.routeEndAge - EPS
        ? 'This drawn route ends here. You can revisit an earlier choice.'
        : 'Explore a fictional route. Hover or focus previews; choosing changes this example.',
    };
  }
  function preview(id) {
    previewed = edges.has(id) ? id : null;
    return snapshot();
  }
  function move(nextAge) {
    age = clampAge(nextAge, network.maxAge);
    previewed = null;
    project();
  }
  function revisit(pointId) {
    const node = forkNodes().find(node => node.id === pointId);
    if (!node || node.age > age + EPS) return false;
    move(node.age);
    return true;
  }
  function previous() {
    const previousFork = forkNodes().filter(node => node.age < age - EPS).at(-1);
    move(previousFork?.age ?? 0);
    return snapshot();
  }
  function next() {
    const endpoint = Math.min(projection.routeEndAge, network.maxAge);
    if (age >= endpoint - EPS) return snapshot();
    const nextFork = forkNodes().find(node => node.age > age + EPS);
    move(nextFork?.age ?? endpoint);
    return snapshot();
  }
  function choose(id) {
    if (!describe(id)?.available) return false;
    const chain = [];
    let edge = edges.get(id);
    while (edge) { chain.unshift(edge); edge = incoming.get(edge.from); }
    const current = new Map(projection.selections.map(selection => [selection.pointId, selection.edgeId]));
    const changed = chain.find(edge => nodes.get(edge.from).outgoing.length > 1
      && current.has(edge.from) && current.get(edge.from) !== edge.id);
    if (changed) {
      const discard = nodeId => {
        delete selections[nodeId];
        for (const child of nodes.get(nodeId).outgoing) discard(edges.get(child).to);
      };
      discard(edges.get(current.get(changed.from)).to);
    }
    for (const selectedEdge of chain) {
      if (nodes.get(selectedEdge.from).outgoing.length > 1) selections[selectedEdge.from] = selectedEdge.id;
    }
    move(nodes.get(edges.get(id).to).age);
    return true;
  }
  return { network, snapshot, preview, choose, previous, next, revisit };
}
