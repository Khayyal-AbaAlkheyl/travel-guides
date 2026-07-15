import fs from 'fs';
const UA = 'EdinburghGuidePhotoFix/1.0 (https://example.com; editor@example.com)';
const raw = fs.readFileSync('data/edinburgh.js', 'utf8');
const urls = [...new Set(raw.match(/https?:\/\/upload\.wikimedia\.org\/[^"\s]+/g) || [])];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log(`Verifying ${urls.length} unique Wikimedia URLs (paced)...`);
const bad = [];
for (const u of urls) {
  let ok = false, status = '';
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': UA }, redirect: 'follow' });
      status = r.status;
      ok = r.ok;
      if (r.status === 429) { await sleep(4000); continue; }
    } catch (e) { status = 'ERR ' + e.message; await sleep(2000); }
  }
  if (!ok) bad.push(`[${status}] ${u}`);
  await sleep(700);
}
console.log(`OK: ${urls.length - bad.length} / ${urls.length}`);
if (bad.length) { console.log('BROKEN:'); bad.forEach((b) => console.log('  ' + b)); process.exit(1); }
else console.log('All URLs valid.');
