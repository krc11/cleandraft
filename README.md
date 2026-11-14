# CleanDraft

Free, rule-based editor for AI-written text, for cleandraft.online. Static Astro site. The engine runs in the visitor's browser in a Web Worker: no AI model, no server, no text leaves the page.

## Commands

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run test:privacy
```

`test:privacy` needs a fresh build and an installed Chrome or Edge. After changing a rule, bump `LEXICON_VERSION`, run `npm run test:golden:update` and read the diff of `tests/golden.json`.

## Layout

- `src/engine/`: the pipeline (`engine.js`), rules (`lexicon.js`), checks (`validate.js`), Web Worker (`worker.js`)
- `src/scripts/tool.js`: tool UI. `analytics.js` only lets allowlisted fields out
- `src/guides/`: guides in Markdown
- `src/config.js`: contact email, editor name, AdSense ids, analytics URL
- `public/_headers`: security headers for Cloudflare Pages

## Deploy to Cloudflare Pages

1. Push this folder to a GitHub repository.
2. In Cloudflare, create a Pages project from the repository. Build command `npm run build`, output folder `dist`.
3. Add `cleandraft.online` as a custom domain. Cloudflare shows the DNS records or nameservers to set at your registrar.
4. Submit `https://cleandraft.online/sitemap-index.xml` in Google Search Console.

## Turning on AdSense

Only after approval:

1. Set `adsenseClient` and `adSlots` in `src/config.js`.
2. Add `public/ads.txt` with your seller id.
3. Widen the `Content-Security-Policy` in `public/_headers` to allow Google's ad domains and inline styles, because the strict policy blocks them. Copy the same policy into `tests/privacy.test.js` only if ads are enabled in that test.
4. Turn on Google's consent message in AdSense for the EEA, UK and Switzerland.
5. Block essay-writing services and competing humanizers in AdSense blocking controls.

## After each deploy

Tell Bing and other IndexNow search engines which pages changed:

```bash
npm run indexnow
```

Google does not use IndexNow. For Google, submit the sitemap once in Search Console and use URL Inspection to request indexing of new pages.
