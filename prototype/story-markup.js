import { CIRCUMSTANCES, COMPARISONS, LAYERS, MOMENTS } from './story.js';

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const renderMoment = moment => `
    <li>
      <h3>Age ${escapeHTML(moment.age)} — ${escapeHTML(moment.title)}</h3>
      <p>${escapeHTML(moment.summary)}</p>
    </li>`;

const renderOutcome = outcome => `
          <li data-outcome="${escapeHTML(outcome.id)}" data-status="${escapeHTML(outcome.status)}">
            ${escapeHTML(outcome.label)} <span>(${escapeHTML(outcome.status)})</span>
          </li>`;

const renderComparison = comparison => `
      <section>
        <h3>${escapeHTML(comparison.title)}</h3>
        <p><strong>What Mika does:</strong> ${escapeHTML(comparison.action)}</p>
        <p><strong>What changes:</strong> ${escapeHTML(comparison.consequence)}</p>
        <ol>${comparison.steps.map(step => `
          <li>${escapeHTML(step)}</li>`).join('')}
        </ol>
        <h4>Named outcomes</h4>
        <ul>${comparison.outcomes.map(renderOutcome).join('')}
        </ul>
      </section>`;

const renderLayer = layer => `
      <section>
        <h3>${escapeHTML(layer.title)}</h3>${layer.paragraphs.map(paragraph => `
        <p>${escapeHTML(paragraph)}</p>`).join('')}
      </section>`;

export function renderReading() {
  return `<article aria-labelledby="reading-title">
    <header>
      <p>Fictional example</p>
      <h2 id="reading-title">How choices can change later opportunities</h2>
      <p>What Mika learns and chooses today can change what becomes practical later. This example is an explanation, not a prediction.</p>
      <p>${escapeHTML(CIRCUMSTANCES)}</p>
    </header>
    <section aria-labelledby="moments-title">
      <h2 id="moments-title">Mika's example life</h2>
      <ol>${MOMENTS.map(renderMoment).join('')}
      </ol>
    </section>
    <section aria-labelledby="comparison-title">
      <h2 id="comparison-title">Three views of the age 12 choice</h2>
      <p>Equal parts can support equivalent fractions, which can support using a ratio in a recipe. This is <strong>learning that builds on learning</strong>. <strong>Compounding</strong> is a useful word for how earlier learning can help later learning; it is not a promise of a fixed growth rate.</p>${Object.values(COMPARISONS).map(renderComparison).join('')}
    </section>
    <section aria-labelledby="layers-title">
      <h2 id="layers-title">A choice has more than one layer</h2>${Object.values(LAYERS).map(renderLayer).join('')}
    </section>
  </article>`;
}
