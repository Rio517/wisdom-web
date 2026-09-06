import test from 'node:test';
import assert from 'node:assert/strict';
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
