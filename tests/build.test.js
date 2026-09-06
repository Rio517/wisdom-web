import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveConfig } from 'vite';

test('the Vite configuration rejects ports outside the project range without starting a server', async () => {
  const { assertProjectPort } = await import('../vite.config.js');

  assert.equal(assertProjectPort(4600, 'server'), 4600);
  assert.equal(assertProjectPort(4601, 'preview'), 4601);
  assert.throws(() => assertProjectPort(4599, 'server'), /4600.*4699/);
  assert.throws(() => assertProjectPort(4700, 'preview'), /4600.*4699/);
});

test('resolved Vite config guards dev and preview overrides while retaining strict localhost ports', async () => {
  await assert.rejects(
    resolveConfig({ server: { port: 4599 } }, 'serve'),
    /4600.*4699/,
  );
  await assert.rejects(
    resolveConfig({ preview: { port: 4700 } }, 'serve'),
    /4600.*4699/,
  );
  await assert.rejects(
    resolveConfig({ server: { strictPort: false } }, 'serve'),
    /strictPort/,
  );
  await assert.rejects(
    resolveConfig({ server: { host: '0.0.0.0' } }, 'serve'),
    /127\.0\.0\.1/,
  );
  await assert.rejects(
    resolveConfig({ preview: { host: '0.0.0.0' } }, 'serve'),
    /127\.0\.0\.1/,
  );
});

test('the reading build plugin injects the shared authored reading alternative', async () => {
  const { readingContentPlugin } = await import('../vite.config.js');
  const { renderReading } = await import('../prototype/story-markup.js');
  const source = '<main><!-- READING_CONTENT --></main>';
  const transformed = readingContentPlugin().transformIndexHtml(source);

  assert.equal(transformed, `<main>${renderReading()}</main>`);
});

test('the reading build plugin gives every generated reading instance unique local heading ids', async () => {
  const { readingContentPlugin } = await import('../vite.config.js');
  const source = `<dialog aria-labelledby="dialog-reading-title"><!-- READING_CONTENT:dialog --></dialog>
    <section><!-- READING_CONTENT:fallback --></section>
    <noscript><!-- READING_CONTENT:noscript --></noscript>`;
  const transformed = readingContentPlugin().transformIndexHtml(source);
  const ids = [...transformed.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const references = [...transformed.matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1]);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(references.every(reference => ids.includes(reference)));
  assert.ok(ids.includes('dialog-reading-title'));
  assert.ok(ids.includes('fallback-reading-title'));
  assert.ok(ids.includes('noscript-reading-title'));
});

test('the guided comparison stays beside the routes it changes in semantic reading order', async () => {
  const { readingContentPlugin } = await import('../vite.config.js');
  const source = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const transformed = readingContentPlugin().transformIndexHtml(source);
  const positions = [
    'data-comparison="gap"',
    'id="life-map"',
    'id="decision-outcomes"',
    'id="decision-action"',
    'id="circumstances-copy"',
    'id="earlier-title"',
  ].map(fragment => transformed.indexOf(fragment));

  assert.ok(positions.every(position => position >= 0), 'comparison structure is complete');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions,
    'controls, routes, outcomes, explanation and earlier moments should remain adjacent in that order');
});

test('the guided scenes use reader-facing labels and one fictional learner', async () => {
  const source = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');

  assert.match(source, /One life, many possibilities/);
  assert.match(source, /What becomes possible\?/);
  assert.doesNotMatch(source, /A fictional worked example|Named route outcomes|\bAri\b/);
});
