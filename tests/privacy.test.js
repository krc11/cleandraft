// PRD section 14: load the page, run the tool, and fail if any request body or URL
// contains the text. Needs a built site: run `npm run build` first. Uses installed
// Chrome or Edge (set PW_CHANNEL to choose).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let path = join(DIST, normalize(url));
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
  } catch {
    path += '.html';
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] || 'application/octet-stream',
      // The same policy as public/_headers, so a violation also fails here.
      'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const MARKER = 'zebraquokkamarker';
const TEXT = `Moreover, it is important to note that ${MARKER} plays a crucial role in order to utilize many tools. We do not know why.`;
const failures = [];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch({ channel: 'msedge' }));
const page = await browser.newPage();
const requests = [];
page.on('request', (r) => requests.push(r));
page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') failures.push(`console error: ${m.text()}`);
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.fill('#cd-input', TEXT);
await page.click('#cd-run');
await page.waitForFunction(() => document.getElementById('cd-output').value.length > 0);
const output = await page.inputValue('#cd-output');
if (output === TEXT) failures.push('tool made no edits');

await page.click('#cd-toggle');
await page.click('#cd-regen');
await page.waitForTimeout(200);
await page.click('#cd-log summary');
await page.click('#cd-log-list button');
await page.waitForTimeout(200);

const edited = (await page.inputValue('#cd-output').catch(() => '')) || output;
for (const r of requests) {
  const haystack = `${r.url()}\n${r.postData() || ''}`;
  if (haystack.includes(MARKER)) failures.push(`request carried the text: ${r.url()}`);
  if (edited && haystack.includes(edited.slice(0, 40))) failures.push(`request carried the output: ${r.url()}`);
  if (r.method() !== 'GET') failures.push(`unexpected ${r.method()} request: ${r.url()}`);
  if (!r.url().startsWith(base)) failures.push(`third-party request: ${r.url()}`);
}

await browser.close();
server.close();

console.log(`${requests.length} requests checked.`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Privacy test passed: no request carried input or output text.');
