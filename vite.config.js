import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { renderReading } from './prototype/story-markup.js';
import { renderChoicesReading } from './prototype/choices-markup.js';
import { PORTS, assertProjectPort, assertLocalhost } from './tooling/ports.js';

// Earlier prototype studies only. The site itself is built by Astro (astro.config.mjs).

export { assertProjectPort, assertLocalhost };

export function readingContentPlugin() {
  return {
    name: 'wisdom-reading-content',
    transformIndexHtml(html) {
      return html.replace(/<!-- READING_CONTENT(?::([a-z-]+))? -->/g, (_match, idPrefix) => (
        renderReading({ idPrefix: idPrefix || 'reading' })
      ));
    },
  };
}

export function choicesContentPlugin() {
  return {
    name: 'wisdom-choices-reading',
    transformIndexHtml(html) {
      return html.replace(/<!-- CHOICES_READING(?::([a-z-]+))? -->/g, (_match, idPrefix) => (
        renderChoicesReading({ idPrefix: idPrefix || 'choices-reading' })
      ));
    },
  };
}

function projectPortGuard() {
  const check = config => {
    assertProjectPort(config.server.port, 'server');
    assertProjectPort(config.preview.port, 'preview');
    assertLocalhost(config.server.host, 'server');
    assertLocalhost(config.preview.host, 'preview');
    if (!config.server.strictPort || !config.preview.strictPort) {
      throw new Error('strictPort must remain enabled for the project development and preview servers');
    }
  };
  return {
    name: 'wisdom-project-port-guard',
    configResolved: check,
    configureServer(server) {
      assertProjectPort(server.config.server.port, 'server');
      assertLocalhost(server.config.server.host, 'server');
      if (!server.config.server.strictPort) throw new Error('strictPort must remain enabled for the project development server');
    },
    configurePreviewServer(server) {
      assertProjectPort(server.config.preview.port, 'preview');
      assertLocalhost(server.config.preview.host, 'preview');
      if (!server.config.preview.strictPort) throw new Error('strictPort must remain enabled for the project preview server');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), readingContentPlugin(), choicesContentPlugin(), projectPortGuard()],
  server: { host: '127.0.0.1', port: PORTS.prototypeDev, strictPort: true },
  preview: { host: '127.0.0.1', port: PORTS.prototypePreview, strictPort: true },
  build: {
    outDir: 'dist-prototype',
    rolldownOptions: { input: { lesson: 'prototype/index.html', paths: 'prototype/path-lab.html', choices: 'prototype/choices.html' } },
  },
});
