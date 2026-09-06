import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUMSTANCES, COMPARISONS, LAYERS, MOMENTS } from '../prototype/story.js';
import * as story from '../prototype/story.js';
import { renderReading } from '../prototype/story-markup.js';

test('the fictional story covers every authored age without turning them into simulations', () => {
  assert.deepEqual(MOMENTS.map(moment => moment.age), [8, 12, 16, 25, 40, 60]);
  for (const moment of MOMENTS) {
    assert.equal(typeof moment.title, 'string');
    assert.equal(typeof moment.summary, 'string');
    assert.equal(typeof moment.preview, 'string');
    assert.match(moment.preview, /[.!?]$/);
  }
  assert.match(MOMENTS.find(moment => moment.age === 40).summary, /time.*support.*cost/i);
  assert.match(MOMENTS.find(moment => moment.age === 60).summary, /experience/i);
});

test('each comparison authors three illustrative practice occasions', () => {
  const labels = ['First try', 'Another occasion', 'Later check'];
  for (const comparison of Object.values(COMPARISONS)) {
    assert.deepEqual(comparison.occasions.map(occasion => occasion.label), labels);
    for (const occasion of comparison.occasions) {
      assert.equal(typeof occasion.text, 'string');
      assert.ok(occasion.text.length > 20);
    }
  }

  assert.match(COMPARISONS.gap.occasions.map(item => item.text).join(' '), /avoid|put.*off|skip/i);
  assert.match(COMPARISONS.build.occasions.map(item => item.text).join(' '), /ask.*practice.*check/i);
  assert.match(COMPARISONS.repair.occasions.map(item => item.text).join(' '), /support|help/i);
  assert.match(COMPARISONS.repair.occasions.map(item => item.text).join(' '), /first intake.*missed/i);
});

test('all three comparisons carry actions, consequences, steps and typed outcomes', () => {
  assert.deepEqual(Object.keys(COMPARISONS), ['gap', 'build', 'repair']);
  for (const comparison of Object.values(COMPARISONS)) {
    assert.equal(typeof comparison.title, 'string');
    assert.equal(typeof comparison.action, 'string');
    assert.equal(typeof comparison.consequence, 'string');
    assert.ok(comparison.steps.length >= 2);
    assert.ok(comparison.outcomes.length >= 3);
    for (const outcome of comparison.outcomes) {
      assert.deepEqual(Object.keys(outcome), ['id', 'label', 'status']);
      assert.ok(['available', 'needs-work', 'missed'].includes(outcome.status));
    }
  }
});

test('the authored comparison preserves the foundation, deadline and supported recovery', () => {
  assert.match(COMPARISONS.gap.consequence, /foundation/i);
  assert.match(COMPARISONS.gap.consequence, /both|two/i);
  assert.equal(COMPARISONS.gap.outcomes.find(outcome => outcome.id === 'first-intake').status, 'missed');
  assert.match(COMPARISONS.build.steps.join(' '), /equal parts.*equivalent fractions.*ratio.*recipe/i);
  assert.match(COMPARISONS.build.consequence, /does not guarantee|not guarantee/i);
  assert.match(COMPARISONS.repair.steps.join(' '), /support/i);
  assert.equal(COMPARISONS.repair.outcomes.find(outcome => outcome.id === 'first-intake').status, 'missed');
  assert.equal(COMPARISONS.repair.outcomes.find(outcome => outcome.id === 'later-intake').status, 'available');
});

test('layers separate repeated practice from knowledge, setup and a specific routine', () => {
  assert.deepEqual(Object.keys(LAYERS), ['pattern', 'starting']);
  assert.match(LAYERS.pattern.paragraphs.join(' '), /one missed night/i);
  const starting = LAYERS.starting.paragraphs.join(' ');
  assert.match(starting, /knowing more/i);
  assert.match(starting, /materials|help/i);
  assert.match(starting, /automatic/i);
  assert.match(starting, /not the same/i);
  assert.match(CIRCUMSTANCES, /Not all of this is Mika's choice/i);
});

test('the shared compounding explanation is cautious and concrete', () => {
  assert.equal(typeof story.COMPOUNDING_EXPLANATION, 'string');
  assert.match(story.COMPOUNDING_EXPLANATION, /earlier learning/i);
  assert.match(story.COMPOUNDING_EXPLANATION, /later learning/i);
  assert.match(story.COMPOUNDING_EXPLANATION, /not.*fixed|no fixed|not guarantee/i);
});

test('the reading alternative includes the complete authored explanation as semantic HTML', () => {
  const html = renderReading();
  assert.match(html, /^<article[ >]/);
  assert.match(html, /<section[ >]/);
  for (const moment of MOMENTS) assert.match(html, new RegExp(`Age ${moment.age}`));
  for (const comparison of Object.values(COMPARISONS)) {
    assert.ok(html.includes(comparison.title));
    for (const outcome of comparison.outcomes) assert.ok(html.includes(outcome.label));
    for (const occasion of comparison.occasions) {
      assert.ok(html.includes(occasion.label));
      assert.ok(html.includes(occasion.text));
    }
  }
  for (const layer of Object.values(LAYERS)) assert.ok(html.includes(layer.title));
  assert.match(html, /equal parts.*equivalent fractions.*ratio.*recipe/is);
  assert.match(html, /learning that builds on learning/i);
  assert.match(html, /compounding/i);
  assert.ok(html.includes(story.COMPOUNDING_EXPLANATION));
  assert.match(html, /fictional/i);
});

test('prefixed reading instances keep heading references local and unique', () => {
  const dialog = renderReading({ idPrefix: 'dialog' });
  const fallback = renderReading({ idPrefix: 'fallback' });
  const ids = [...`${dialog}${fallback}`.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);

  assert.equal(new Set(ids).size, ids.length);
  assert.match(dialog, /aria-labelledby="dialog-reading-title"/);
  assert.match(dialog, /aria-labelledby="dialog-moments-title"/);
  assert.match(fallback, /aria-labelledby="fallback-comparison-title"/);
});

test('reading generation escapes every special HTML character in authored text', () => {
  const original = COMPARISONS.gap.title;
  COMPARISONS.gap.title = 'A & B < C > D "quoted" \'single\'';
  try {
    const html = renderReading();
    assert.ok(html.includes('A &amp; B &lt; C &gt; D &quot;quoted&quot; &#39;single&#39;'));
    assert.ok(!html.includes('A & B < C'));
  } finally {
    COMPARISONS.gap.title = original;
  }
});
