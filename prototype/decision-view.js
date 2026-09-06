import { CIRCUMSTANCES, COMPARISONS, LAYERS } from './story.js';

const $ = selector => document.querySelector(selector);

function outcomeList(outcomes) {
  const list = document.createElement('ul');
  list.className = 'grid gap-2 text-base';
  for (const [index, outcome] of outcomes.entries()) {
    const item = document.createElement('li');
    item.dataset.outcome = outcome.id;
    item.dataset.status = outcome.status;
    item.dataset.routeMarker = String(index + 1);
    item.className = 'route-outcome';
    item.textContent = outcome.label;
    list.append(item);
  }
  return list;
}

function stepList(steps) {
  return steps.map(step => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  });
}

export function renderDecision(state) {
  const panel = $('#decision-panel');
  const results = $('#decision-results');
  const active = state.inspect === 12;
  panel.hidden = !active;
  results.hidden = !active;
  $('#comparison-entry').hidden = active || !state.selected;
  if (!active) return;

  const comparison = COMPARISONS[state.comparison];
  $('#decision-heading').textContent = state.age < 12
    ? 'Looking ahead: age 12'
    : state.age === 12 ? 'The current decision: age 12' : 'Looking back: age 12';
  $('#decision-action').textContent = comparison.action;
  $('#decision-consequence').textContent = comparison.consequence;
  $('#decision-steps').replaceChildren(...stepList(comparison.steps));
  $('#decision-outcomes').replaceChildren(outcomeList(comparison.outcomes));
  for (const button of document.querySelectorAll('[data-comparison]')) {
    button.setAttribute('aria-pressed', String(button.dataset.comparison === state.comparison));
  }
  for (const [id, layer] of Object.entries(LAYERS)) {
    const expanded = state.layers.includes(id);
    const button = $(`[data-layer="${id}"]`);
    const content = $(`#${id}-layer`);
    button.setAttribute('aria-expanded', String(expanded));
    content.hidden = !expanded;
    content.replaceChildren(...layer.paragraphs.map(paragraph => {
      const item = document.createElement('p');
      item.textContent = paragraph;
      return item;
    }));
  }
  $('#circumstances-copy').textContent = CIRCUMSTANCES;
}
