import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { renderReading } from './prototype/story-markup.js';

const MIN_PORT = 4600;
const MAX_PORT = 4699;

export function assertProjectPort(value, service) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`${service} port must be between ${MIN_PORT} and ${MAX_PORT}; received ${value}`);
  }
  return port;
}

export function assertLocalhost(value, service) {
  if (value !== '127.0.0.1') {
    throw new Error(`${service} host must remain 127.0.0.1; received ${value}`);
  }
  return value;
}

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
  plugins: [tailwindcss(), readingContentPlugin(), projectPortGuard()],
  server: { host: '127.0.0.1', port: 4600, strictPort: true },
  preview: { host: '127.0.0.1', port: 4601, strictPort: true },
  build: {
    outDir: 'dist',
    rolldownOptions: { input: 'prototype/index.html' },
  },
});
