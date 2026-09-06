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

test('resolved Vite config guards dev and preview overrides while retaining strict ports', async () => {
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
});

test('the reading build plugin injects the shared authored reading alternative', async () => {
  const { readingContentPlugin } = await import('../vite.config.js');
  const { renderReading } = await import('../prototype/story-markup.js');
  const source = '<main><!-- READING_CONTENT --></main>';
  const transformed = readingContentPlugin().transformIndexHtml(source);

  assert.equal(transformed, `<main>${renderReading()}</main>`);
});
