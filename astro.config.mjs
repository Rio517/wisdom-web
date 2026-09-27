import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { PORTS, assertProjectPort, assertLocalhost } from './tooling/ports.js';

/** Refuse to run the site outside 4600–4699 on 127.0.0.1. */
function portGuard() {
  return {
    name: 'wisdom-port-guard',
    hooks: {
      'astro:config:done': ({ config }) => {
        assertProjectPort(config.server.port, 'server');
        assertLocalhost(config.server.host, 'server');
      },
    },
  };
}

export default defineConfig({
  site: 'https://wisdom.knyflores.com',
  base: '/',
  server: { host: '127.0.0.1', port: PORTS.siteDev },
  integrations: [portGuard()],
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
    preview: { strictPort: true },
  },
});
