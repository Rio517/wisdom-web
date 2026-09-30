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

test('the static build includes the separate visual lab as well as the existing lesson', async () => {
  const config = await resolveConfig({}, 'build');
  const input = config.build.rolldownOptions.input;
  const inputs = typeof input === 'string' ? [input] : Object.values(input);
  assert.ok(inputs.includes('prototype/index.html'));
  assert.ok(inputs.includes('prototype/path-lab.html'));
});

test('the earlier Alfredo lesson study keeps its own built entry', async () => {
  const config = await resolveConfig({}, 'build');
  const inputs = Object.values(config.build.rolldownOptions.input);
  assert.ok(inputs.includes('prototype/choices.html'));
  assert.ok(inputs.includes('prototype/index.html'));
  assert.ok(inputs.includes('prototype/path-lab.html'));
});

test('the Alfredo reading transform supplies complete static copy and separates IDs', async () => {
  const { choicesContentPlugin } = await import('../vite.config.js');
  const transformed = choicesContentPlugin().transformIndexHtml('<main><!-- CHOICES_READING --></main><dialog><!-- CHOICES_READING:dialog --></dialog>');
  assert.match(transformed, /Alfredo/);
  assert.match(transformed, /ranger/);
  assert.doesNotMatch(transformed, /<!-- CHOICES_READING/);
  const ids = [...transformed.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
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

test('the site is configured for wisdom.knyflores.com on project ports', async () => {
  const { default: config } = await import('../astro.config.mjs');
  assert.equal(config.site, 'https://wisdom.knyflores.com');
  assert.equal(config.base, '/');
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 4600);
  assert.equal(config.vite.server.strictPort, true);
  assert.equal(config.vite.preview.strictPort, true);
  const cname = await readFile(new URL('../public/CNAME', import.meta.url), 'utf8');
  assert.equal(cname.trim(), 'wisdom.knyflores.com');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts.preview, /--port 4601/);
});

test('prototype studies keep their own ports and output folder', async () => {
  const config = await resolveConfig({}, 'build');
  assert.equal(config.server.port, 4602);
  assert.equal(config.preview.port, 4603);
  assert.match(config.build.outDir, /dist-prototype$/);
});

test('the lesson has pages for the journey, its text version, notes and the site shell', async () => {
  for (const path of ['[...locale]/index.astro', '[...locale]/about.astro', '404.astro', '[...locale]/choices/index.astro',
    '[...locale]/choices/notes.astro', '[...locale]/choices/the-paths-we-make/index.astro', '[...locale]/choices/the-paths-we-make/read.astro']) {
    await readFile(new URL(`../src/pages/${path}`, import.meta.url), 'utf8');
  }
  for (const page of ['about.md', 'choices/notes.md']) await readFile(new URL(`../src/content/pages/en/${page}`, import.meta.url), 'utf8');
  const { renderJourneyReading } = await import('../src/lessons/choices/journey-story.js');
  const reading = renderJourneyReading();
  assert.match(reading, /Mirror Lake/);
  assert.match(reading, /Path B Maya/);
});

test('every page is built in every language from one set of routes', async () => {
  const { LOCALES, localeStaticPaths } = await import('../src/i18n/config.js');
  const paths = localeStaticPaths();
  assert.deepEqual(paths.map(path => path.props.locale), LOCALES);
  assert.equal(paths.find(path => path.props.locale === 'en').params.locale, undefined);
  const config = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /i18n:\s*\{\s*locales: LOCALES, defaultLocale: DEFAULT_LOCALE, routing: \{ prefixDefaultLocale: false \}/);
});
