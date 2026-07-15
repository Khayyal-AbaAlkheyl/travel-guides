import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'data', 'bosnia.js');
const UA = 'DiscoverTravelGuide/1.0 (bosnia; contact: guide@example.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const text = fs.readFileSync(dataPath, 'utf8');
const urls = [...new Set(text.match(/https?:\/\/upload\.wikimedia\.org\/[^"\s]+/g) || [])];

async function check(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }
      return { url, ok: res.ok, status: res.status };
    } catch (e) {
      await sleep(1000);
    }
  }
  return { url, ok: false, status: 429 };
}

console.log(`Verifying ${urls.length} URLs with proper User-Agent...`);
const bad = [];
let n = 0;
for (const url of urls) {
  const r = await check(url);
  if (!r.ok) bad.push(r);
  n++;
  if (n % 20 === 0) console.log(`  ${n}/${urls.length} checked, ${bad.length} bad`);
  await sleep(250);
}
console.log(`\nOK: ${urls.length - bad.length} / ${urls.length}`);
if (bad.length) {
  console.log('Genuinely failed:');
  bad.forEach((r) => console.log(`  [${r.status}] ${r.url}`));
  process.exit(1);
}
