import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { writeFile } from 'node:fs/promises';
import { SITE } from './src/config.js';

const STRICT_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";
// Google serves ads and the consent message from many changing domains with inline code,
// so a host allowlist breaks them. With ads on, scripts and frames are limited to HTTPS.
const ADS_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src https:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

// Writes the Cloudflare Pages headers file, and ads.txt once an AdSense id is set.
const siteFiles = {
  name: 'cleandraft-site-files',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const headers = [
        '/*',
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
        '  X-Content-Type-Options: nosniff',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
        `  Content-Security-Policy: ${SITE.adsenseClient ? ADS_CSP : STRICT_CSP}`,
        '',
      ].join('\n');
      await writeFile(new URL('_headers', dir), headers);
      if (SITE.adsenseClient) {
        await writeFile(new URL('ads.txt', dir), `google.com, ${SITE.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
      }
    },
  },
};

export default defineConfig({
  site: 'https://cleandraft.online',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  integrations: [sitemap({ lastmod: new Date(), filter: (page) => !page.endsWith('/404') }), siteFiles],
  // Nothing inlined, so the strict content security policy holds while ads are off.
  vite: { build: { assetsInlineLimit: 0 }, worker: { format: 'es' } },
});
