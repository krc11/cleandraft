// Tells Bing and other IndexNow search engines which pages changed. Run after a deploy:
//   npm run indexnow
import { SITE } from '../src/config.js';

const xml = await (await fetch(`${SITE.url}/sitemap-0.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE.url).host, key: SITE.indexNowKey, keyLocation: `${SITE.url}/${SITE.indexNowKey}.txt`, urlList }),
});
console.log(`Sent ${urlList.length} URLs. IndexNow answered ${res.status} ${res.statusText}.`);
