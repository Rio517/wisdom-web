import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { PORTS, assertProjectPort, assertLocalhost } from './tooling/ports.js';
import { LOCALES, DEFAULT_LOCALE } from './src/i18n/config.js';
import dialectoInContext from './tooling/dialecto-in-context.mjs';

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
  integrations: [portGuard(), dialectoInContext()],
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  // English at the root, other languages under /es/, /de/, /fr/ (see src/i18n/config.js).
  i18n: { locales: LOCALES, defaultLocale: DEFAULT_LOCALE, routing: { prefixDefaultLocale: false } },
  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
    preview: { strictPort: true },
  },
});
