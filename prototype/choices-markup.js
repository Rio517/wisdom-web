import { ALFREDO_SCENES, CHOICES_DEEP_DIVES, CORE_SCENES } from './choices-story.js';
import { createExplorationSession } from '../src/engine/choices-exploration.js';
import { fitOverview } from '../src/engine/lab-renderer.js';

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

export function renderMapChoiceList(choices = [], previewId = null) {
  if (!choices.length) return '<p class="choice-help">No connected choices are available at this point.</p>';
  return choices.map(choice => `<div class="map-choice-item" role="listitem"><button
    class="map-choice"
    type="button"
    data-map-choice="${escapeHTML(choice.id)}"
    data-available="${choice.available !== false}"
    data-previewed="${choice.id === previewId}"
    aria-pressed="${Boolean(choice.selected)}"
  ><strong>${escapeHTML(choice.label)}</strong><span>${escapeHTML(choice.description)}</span></button></div>`).join('');
}

const pathData = {
  terrain: 'M388 0 C356 50 420 85 375 139 S370 218 318 244 S314 301 278 315',
  full: 'M70 271 C93 241 137 263 161 220 S198 190 227 184 S274 214 308 167 S348 133 375 139 S417 190 453 158 S456 102 510 82',
  stream: 'M70 271 C93 241 137 263 161 220 S198 190 227 184 S274 214 308 167 S348 133 375 139',
  shelter: 'M227 184 C240 250 349 272 425 257 S480 218 544 236',
  turnBack: 'M375 139 C363 162 342 178 312 188',
};

let staticLifeMap;

function simplifyPoints(points, tolerance = 1) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const pending = [[0, points.length - 1]];
  const threshold = tolerance * tolerance;
  while (pending.length) {
    const [startIndex, endIndex] = pending.pop();
    const start = points[startIndex];
    const end = points[endIndex];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const span = dx * dx + dy * dy;
    let furthestIndex = -1;
    let furthestDistance = threshold;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const point = points[index];
      const amount = span ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / span)) : 0;
      const offsetX = point.x - start.x - amount * dx;
      const offsetY = point.y - start.y - amount * dy;
      const distance = offsetX * offsetX + offsetY * offsetY;
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestIndex = index;
      }
    }
    if (furthestIndex >= 0) {
      keep[furthestIndex] = 1;
      pending.push([startIndex, furthestIndex], [furthestIndex, endIndex]);
    }
  }
  return points.filter((_point, index) => keep[index]);
}

function curvedPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  const slopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return point.x > previous.x ? (point.y - previous.y) / (point.x - previous.x) : 0;
  });
  const tangent = index => {
    if (!index) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1);
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after > 0 ? 2 * before * after / (before + after) : 0;
  };
  let path = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const handle = (end.x - start.x) / 3;
    if (handle <= 0) {
      path += ` L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    } else {
      path += ` C${(start.x + handle).toFixed(1)} ${(start.y + tangent(index - 1) * handle).toFixed(1)} ${(end.x - handle).toFixed(1)} ${(end.y - tangent(index) * handle).toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    }
  }
  return path;
}

function getStaticLifeMap() {
  if (staticLifeMap) return staticLifeMap;
  const snapshot = createExplorationSession({ age: 25 }).snapshot();
  const preview = snapshot.choices.find(choice => choice.available);
  const view = fitOverview(snapshot.network.bounds, { width: 1260, height: 740 }, undefined, snapshot.network.maxAge);
  const project = points => simplifyPoints(points.map(view.world));
  staticLifeMap = {
    bounds: { width: 1260, height: 740 },
    segments: snapshot.projection.segments.map(segment => ({ ...segment, points: project(segment.points) })),
    today: view.world(snapshot.projection.today),
    previewEdge: snapshot.network.edges.find(edge => edge.id === preview?.id)?.points
      ? project(snapshot.network.edges.find(edge => edge.id === preview.id).points)
      : null,
    previewLabel: preview?.label || 'Connected path',
  };
  return staticLifeMap;
}

const textLabels = ({ variant = 'later' } = {}) => `
  <g class="trail-labels">
    <text x="52" y="301">Start</text>
    <text x="329" y="105">Bridge</text>
    <text x="393" y="202">Stream bend</text>
    <text x="509" y="29">Lake</text>
    ${variant === 'first' ? '<text x="386" y="150" class="trail-warning">Not enough water</text><text x="264" y="219">Turn back</text>' : ''}
    ${variant === 'later' ? '<text x="72" y="45"><tspan x="72">Water and rest</tspan> <tspan x="72" dy="19">stops planned</tspan></text><text x="422" y="228">Check landmarks</text>' : ''}
    ${variant === 'rain' ? '<text x="122" y="165">Ranger</text><text x="468" y="125" class="trail-warning">Trail closed</text><text x="443" y="283">Open route</text>' : ''}
  </g>`;

export function renderTrailDiagram({ variant = 'first', idPrefix = 'trail', guided = false } = {}) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const isFirst = variant === 'first';
  const isRain = variant === 'rain';
  const title = isFirst
    ? 'First lake attempt turns back before the water runs low'
    : isRain
      ? 'Rain-damaged lake trail is closed and a ranger recommends a shorter open route'
      : 'Prepared retry toward the lake with planned water, rest and landmark practice';
  const description = isFirst
    ? 'Alfredo and his father turn back before their water runs low. The route introduces landmarks they can practise on smaller hikes.'
    : isRain
      ? 'A ranger explains that rain damaged and closed the lake trail, then recommends a shorter open route that crosses the stream on a small bridge.'
      : 'The route is planned but not yet walked. Alfredo and his father plan enough water and rest stops, and Alfredo uses practised landmarks to help check the route.';

  const viewBox = guided === 'wide-gutter' ? '-340 0 980 315' : guided ? '-220 0 860 315' : '0 0 640 315';

  return `<svg class="trail-diagram" viewBox="${viewBox}" role="img" aria-labelledby="${titleId}" aria-describedby="${descriptionId}">
    <title id="${titleId}">${title}</title>
    <desc id="${descriptionId}">${description}</desc>
    <path class="trail-water" d="${pathData.terrain}"/>
    <ellipse class="trail-water-fill" cx="541" cy="61" rx="55" ry="29"/>
    <path class="trail-route trail-route-muted" d="${pathData.full}"/>
    ${isFirst ? '<g class="trail-footsteps" aria-hidden="true"><circle cx="103" cy="255" r="3"/><circle cx="142" cy="239" r="3"/><circle cx="177" cy="207" r="3"/><circle cx="218" cy="185" r="3"/><circle cx="263" cy="200" r="3"/><circle cx="306" cy="170" r="3"/><circle cx="348" cy="139" r="3"/></g>' : ''}
    ${isFirst || isRain ? `<path class="trail-route trail-route-active" d="${pathData.stream}"/>` : ''}
    ${isFirst ? `<path class="trail-turnback" d="${pathData.turnBack}"/><path class="trail-turnback" d="M312 188 l13 -1 m-13 1 l7 -11"/>` : ''}
    ${isRain ? `<path class="trail-route trail-route-active" d="${pathData.shelter}"/>
      <path class="trail-close" d="M433 134 l25 25 m-25 0 l25 -25"/>
      <path class="trail-bridge" d="M315 241 l7 21 m4 -23 l7 21"/>
      <path class="trail-shelter" d="M526 238 l18 -15 18 15 m-30 -9 v22 h24 v-22"/>` : ''}
    <path class="trail-bridge" d="M352 124 l38 16 m-39 -7 l38 16"/>
    <g class="trail-points">${isFirst || isRain ? '<circle cx="70" cy="271" r="5"/><circle cx="227" cy="184" r="4"/><circle cx="375" cy="139" r="5"/>' : '<circle cx="70" cy="271" r="5"/>'}</g>
    ${textLabels({ variant })}
  </svg>`;
}

const renderLifeMapAlternative = idPrefix => {
  const map = getStaticLifeMap();
  const clipId = `${idPrefix}-life-untaken-clip`;
  const titleId = `${idPrefix}-life-map-title`;
  const descriptionId = `${idPrefix}-life-map-description`;
  const pathsFor = (state, className, clip = false) => map.segments
    .filter(segment => segment.state === state)
    .map(segment => `<path data-map-state="${className}" d="${curvedPath(segment.points)}"${clip ? ` clip-path="url(#${clipId})"` : ''}/>`)
    .join('');
  const previewPath = map.previewEdge ? `<path data-map-state="preview" d="${curvedPath(map.previewEdge)}"/>` : '';

  return `<figure class="reading-life-map" aria-labelledby="${titleId}">
  <figcaption id="${titleId}"><strong>Many possible paths</strong>—an illustration, not a prediction or score. Height has no meaning.</figcaption>
  <svg class="static-life-map" viewBox="0 0 ${map.bounds.width} ${map.bounds.height}" role="img" aria-labelledby="${titleId}" aria-describedby="${descriptionId}">
    <desc id="${descriptionId}">A frozen fictional map at age 25 shows selected history, reachable paths, untaken paths clipped at Today and one blue path preview.</desc>
    <defs><clipPath id="${clipId}"><rect x="0" y="0" width="${map.today.x.toFixed(1)}" height="${map.bounds.height}"/></clipPath></defs>
    <g class="static-map-untaken">${pathsFor('untaken', 'untaken', true)}</g>
    <g class="static-map-reachable">${pathsFor('possible', 'reachable')}</g>
    <g class="static-map-selected">${pathsFor('completed', 'selected')}</g>
    <g class="static-map-preview">${previewPath}</g>
    <line class="static-map-today" x1="${map.today.x.toFixed(1)}" x2="${map.today.x.toFixed(1)}" y1="20" y2="720"/>
    <text class="static-map-today-label" x="${(map.today.x + 9).toFixed(1)}" y="710">Today · example age 25</text>
  </svg>
  <div class="reading-map-key" role="list" aria-label="Life map key">
    <span role="listitem"><i class="key-line traveled" aria-hidden="true"></i>Selected path</span>
    <span role="listitem"><i class="key-line possible" aria-hidden="true"></i>Reachable from here</span>
    <span role="listitem"><i class="key-line untaken" aria-hidden="true"></i>Untaken path</span>
    <span role="listitem"><i class="key-line preview" aria-hidden="true"></i>Preview only · ${escapeHTML(map.previewLabel)}</span>
  </div>
  <div class="static-map-notes">
    <p><strong>Unavailable from here:</strong> a gray path separated earlier. <span>Revisit an earlier fork</span> to try it in the fictional map.</p>
    <p><strong>Story paused:</strong> exploration keeps the reader’s place. <span>Resume story · same scene</span>.</p>
    <p class="static-map-disclaimer">Static review: these labels explain the interactive states; this diagram is not interactive.</p>
  </div>
</figure>`;
};

const renderSceneText = (scene, idPrefix) => `<section aria-labelledby="${idPrefix}-${scene.id}-title">
  <p class="reading-kicker">${escapeHTML(scene.eyebrow)}</p>
  <h3 id="${idPrefix}-${scene.id}-title">${escapeHTML(scene.heading)}</h3>
  ${scene.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}
</section>`;

export function renderChoicesReading({ idPrefix = 'choices-reading' } = {}) {
  const [possibilities, accumulation, control] = CORE_SCENES;
  const [example, steps, later, world] = ALFREDO_SCENES;
  const learning = CHOICES_DEEP_DIVES.learning;
  const changing = CHOICES_DEEP_DIVES.changing;

  return `<article class="choices-reading" aria-labelledby="${idPrefix}-reading-title">
  <header>
    <p class="reading-kicker">Choices · The paths we make</p>
    <h2 id="${idPrefix}-reading-title">Small actions. New possibilities.</h2>
    <p>The map is an illustration, not a prediction or score.</p>
  </header>
  ${renderSceneText(possibilities, idPrefix)}
  ${renderLifeMapAlternative(idPrefix)}
  ${renderSceneText(accumulation, idPrefix)}
  ${renderSceneText(control, idPrefix)}
  <details class="reading-example">
    <summary>Example: Alfredo’s hikes</summary>
    <div class="reading-example-content">
      ${renderSceneText(example, idPrefix)}
      ${renderSceneText(steps, idPrefix)}
      <figure class="reading-trail">
        ${renderTrailDiagram({ variant: 'first', idPrefix: `${idPrefix}-first` })}
        <figcaption><strong>First setback:</strong> Alfredo and his father turn back before their water runs low. Turning back makes another try possible.</figcaption>
      </figure>
      ${renderSceneText(later, idPrefix)}
      <figure class="reading-trail">
        ${renderTrailDiagram({ variant: 'later', idPrefix: `${idPrefix}-retry-diagram` })}
        <figcaption><strong>Another attempt:</strong> planned water and rest stops make the hike practical; practice helps Alfredo check the route with his father.</figcaption>
      </figure>
      <aside class="reading-deep-dive" aria-labelledby="${idPrefix}-learning-title">
        <h4 id="${idPrefix}-learning-title">${escapeHTML(learning.heading)}</h4>
        <p>${escapeHTML(learning.paragraph)}</p>
      </aside>
      ${renderSceneText(world, idPrefix)}
      <figure class="reading-trail">
        ${renderTrailDiagram({ variant: 'rain', idPrefix: `${idPrefix}-rain` })}
        <figcaption><strong>A second setback:</strong> the ranger’s current information reveals a shorter open route. The lake can wait.</figcaption>
      </figure>
      <aside class="reading-deep-dive" aria-labelledby="${idPrefix}-changing-title">
        <h4 id="${idPrefix}-changing-title">${escapeHTML(changing.heading)}</h4>
        <p>${escapeHTML(changing.paragraph)}</p>
      </aside>
    </div>
  </details>
  <footer class="reading-sources">
    <h3 id="${idPrefix}-sources-title">Sources and limits</h3>
    <p>The Alfredo hike is a fictional editorial illustration. See the <a href="https://github.com/Rio517/wisdom-web/blob/main/docs/research/learning/sources.md#l11--prior-knowledge-and-new-learning">research on prior knowledge</a> and the <a href="https://github.com/Rio517/wisdom-web/blob/main/docs/research/circumstances/README.md">research on circumstances and support</a>. The sources support the bounded ideas, not Alfredo’s invented outcomes.</p>
  </footer>
</article>`;
}
