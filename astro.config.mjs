import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cleandraft.online',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  integrations: [sitemap()],
  // Nothing inlined, so the strict content security policy in public/_headers holds.
  vite: { build: { assetsInlineLimit: 0 }, worker: { format: 'es' } },
});
