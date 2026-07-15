import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = process.argv[2] || path.join(root, 'data', 'london.js');

const text = fs.readFileSync(dataPath, 'utf8');
const urls = [...new Set([
  ...(text.match(/https?:\/\/upload\.wikimedia\.org\/[^"\s]+/g) || []),
  ...(text.match(/https?:\/\/images\.unsplash\.com\/[^"\s]+/g) || []),
  ...(text.match(/https?:\/\/picsum\.photos\/[^"\s]+/g) || []),
  ...(text.match(/https?:\/\/api\.qrserver\.com\/[^"\s]+/g) || []),
])];

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: e.message };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Checking ${urls.length} image URLs in ${path.basename(dataPath)}...\n`);

const results = [];
for (const url of urls) {
  results.push(await check(url));
  if (url.includes('upload.wikimedia.org')) await sleep(400);
}

const bad = results.filter((r) => !r.ok);
console.log(`OK: ${results.length - bad.length} / ${results.length}`);
if (bad.length) {
  console.log('\nFailed URLs:');
  bad.slice(0, 30).forEach((r) => console.log(`  [${r.status}] ${r.url.slice(0, 100)}`));
  if (bad.length > 30) console.log(`  ... and ${bad.length - 30} more`);
  process.exit(1);
}
