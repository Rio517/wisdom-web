import { makeMap, motionFrame, OVERVIEW } from './model.js';

const NS = 'http://www.w3.org/2000/svg';
function element(name, attributes = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
const box = value => `${value.x} ${value.y} ${value.width} ${value.height}`;
const blendBox = (from, to, amount) => Object.fromEntries(
  Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * amount]),
);

export function createMapView(svg, onSelect, lessMotion) {
  let animation = 0;
  let currentAge = 8;
  const cancel = () => { cancelAnimationFrame(animation); animation = 0; };
  function sizeLabels() {
    if (!svg.clientWidth) return;
    const unitsPerPixel = svg.viewBox.baseVal.width / svg.clientWidth;
    for (const anchor of svg.querySelectorAll('.map-anchor')) {
      const label = anchor.querySelector('text');
      label.style.fontSize = `${16 * unitsPerPixel}px`;
      label.setAttribute('y', 30 * unitsPerPixel);
      anchor.querySelector('.hit-area').setAttribute('r', 24 * unitsPerPixel);
    }
  }
  new ResizeObserver(sizeLabels).observe(svg);

  function show(age, selected, animate = false) {
    cancel();
    currentAge = age;
    const map = makeMap(age);
    svg.querySelector('[data-drawing]')?.remove();
    const drawing = element('g', { 'data-drawing': '' });
    const network = element('g', { 'aria-hidden': 'true' });
    drawing.append(network);
    for (const branch of map.branches) {
      network.append(element('path', { d: branch.d, class: `route branch route-${selected ? branch.state : 'possible'}`, 'data-state': branch.state }));
    }
    network.append(element('path', { d: map.future, class: 'route spine-possible' }));
    const pastBase = element('path', { d: map.past, class: 'route spine-possible' });
    network.append(pastBase);
    const guide = element('line', { x1: map.anchor.x, x2: map.anchor.x, y1: 50, y2: 490, class: 'today-line' });
    network.append(guide);
    const route = element('path', { d: map.past, class: 'route traveled-route' });
    network.append(route);
    network.append(element('circle', { cx: 40, cy: 270, r: 4, fill: '#2f604d' }));

    const anchors = element('g');
    for (const anchor of map.anchors) {
      const isCurrent = anchor.age === age;
      const target = element('g', {
        class: 'map-anchor', role: 'button', tabindex: '0',
        'aria-label': `Explore age ${anchor.age}`, 'aria-pressed': String(isCurrent && selected),
        transform: `translate(${anchor.x} ${anchor.y})`, 'data-age': anchor.age,
      });
      if (selected && !isCurrent) target.setAttribute('display', 'none');
      target.append(element('circle', { r: 27, class: 'hit-area' }));
      target.append(element('circle', { r: isCurrent ? 7 : 4, class: 'anchor-ring' }));
      const label = element('text', { x: 0, y: isCurrent ? 40 : 32, 'text-anchor': 'middle' });
      label.textContent = isCurrent ? `${selected ? 'Today · age' : 'Age'} ${anchor.age}` : anchor.age;
      target.append(label);
      target.addEventListener('click', () => onSelect(anchor.age));
      target.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(anchor.age); }
      });
      anchors.append(target);
    }
    drawing.append(anchors);
    const halo = element('circle', { r: 18, fill: '#9bbfac', opacity: 0, 'aria-hidden': 'true', 'pointer-events': 'none' });
    const dot = element('circle', { r: 7, fill: '#2f604d', stroke: '#fcfcfa', 'stroke-width': 3, 'aria-hidden': 'true', 'pointer-events': 'none', 'data-traveler': '' });
    drawing.append(halo, dot);
    svg.append(drawing);
    svg.dataset.age = age;
    const length = route.getTotalLength();
    route.style.strokeDasharray = `${length} ${length}`;
    const untakenPaths = [...network.querySelectorAll('[data-state="untaken"]')];

    function paint(elapsed, immediate) {
      const frame = selected ? motionFrame(elapsed, immediate) : { travel: 0, zoom: 0, settled: true };
      const point = route.getPointAtLength(length * frame.travel);
      route.style.strokeDashoffset = length * (1 - frame.travel);
      dot.setAttribute('cx', selected ? point.x : 40);
      dot.setAttribute('cy', selected ? point.y : 270);
      halo.setAttribute('cx', point.x);
      halo.setAttribute('cy', point.y);
      halo.setAttribute('opacity', selected && !frame.settled ? 0.22 * (1 - frame.zoom) : 0);
      const viewport = blendBox(OVERVIEW, map.focus, frame.zoom);
      svg.setAttribute('viewBox', box(viewport));
      sizeLabels();
      for (const path of untakenPaths) {
        path.style.stroke = selected ? `color-mix(in srgb, #e5e8e3 ${frame.travel * 100}%, #a8bcaf)` : '';
        path.style.strokeDasharray = selected && frame.settled ? '2 5' : '';
      }
      svg.dataset.motion = !selected ? 'ready' : frame.settled ? 'settled' : frame.zoom > 0 ? 'focusing' : 'traveling';
      return frame.settled;
    }

    if (!animate || lessMotion()) { paint(750, true); return; }
    const started = performance.now();
    paint(0, false);
    const tick = now => {
      if (!paint(now - started, lessMotion())) animation = requestAnimationFrame(tick);
      else animation = 0;
    };
    animation = requestAnimationFrame(tick);
  }

  function overview() {
    cancel();
    show(currentAge, true, false);
    svg.setAttribute('viewBox', box(OVERVIEW));
    svg.querySelectorAll('.map-anchor').forEach(anchor => anchor.removeAttribute('display'));
    sizeLabels();
  }
  return { show, cancel, overview };
}
