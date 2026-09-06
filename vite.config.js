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

export function readingContentPlugin() {
  return {
    name: 'wisdom-reading-content',
    transformIndexHtml(html) {
      return html.replaceAll('<!-- READING_CONTENT -->', renderReading());
    },
  };
}

function projectPortGuard() {
  const check = config => {
    assertProjectPort(config.server.port, 'server');
    assertProjectPort(config.preview.port, 'preview');
    if (!config.server.strictPort || !config.preview.strictPort) {
      throw new Error('strictPort must remain enabled for the project development and preview servers');
    }
  };
  return {
    name: 'wisdom-project-port-guard',
    configResolved: check,
    configureServer(server) {
      assertProjectPort(server.config.server.port, 'server');
      if (!server.config.server.strictPort) throw new Error('strictPort must remain enabled for the project development server');
    },
    configurePreviewServer(server) {
      assertProjectPort(server.config.preview.port, 'preview');
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
