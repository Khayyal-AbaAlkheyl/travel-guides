import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = fs.readFileSync(path.join(root, 'data', 'trabzon.js'), 'utf8');
const plan = JSON.parse(raw.replace(/^[\s\S]*?const PLAN = /, '').replace(/;\s*$/, ''));

// --- Duplicate hero analysis ---
const heroMap = new Map(); // url -> [names]
function addHero(name, url) {
  if (!url) return;
  if (!heroMap.has(url)) heroMap.set(url, []);
  heroMap.get(url).push(name);
}
for (const a of plan.attractions || []) addHero(`attr:${a.name}`, a.photos?.hero);
for (const h of plan.hotels || []) addHero(`hotel:${h.name}`, h.photos?.exterior);
for (const d of plan.dining || []) addHero(`dine:${d.name}`, d.photos?.signature);

console.log('=== HERO/PRIMARY IMAGE DUPLICATES (>2 places) ===');
let over = 0;
for (const [url, names] of heroMap) {
  if (names.length > 2) {
    over++;
    console.log(`  x${names.length}: ${names.join(', ')}`);
    console.log(`      ${url}`);
  }
}
if (!over) console.log('  none — every primary image used on <=2 places');

// --- Per-entry distinctness (4 different files) ---
console.log('\n=== ENTRIES WHERE hero/detail/photoSpot/map NOT ALL DISTINCT ===');
let dup = 0;
const fileOf = (u) => (u ? u.split('/').pop() : '');
for (const a of plan.attractions || []) {
  const p = a.photos || {};
  const files = [p.hero, p.detail, p.photoSpot, p.map].map(fileOf);
  const uniq = new Set(files.filter(Boolean));
  if (uniq.size < 4) { dup++; console.log(`  ${a.name}: ${uniq.size} distinct`); }
}
if (!dup) console.log('  none — all attractions have 4 distinct image files');

// --- PNG maps / district map detection ---
console.log('\n=== .png OR district-map USAGE ===');
const allText = JSON.stringify(plan);
const pngs = [...new Set(allText.match(/https?:\/\/[^"']+?\.png[^"']*/gi) || [])];
const districts = [...new Set(allText.match(/[^"']*Trabzon_districts[^"']*/gi) || [])];
if (!pngs.length && !districts.length) console.log('  none — no .png images or district maps remain');
else { pngs.forEach((u) => console.log(`  PNG: ${u}`)); districts.forEach((u) => console.log(`  DISTRICT: ${u}`)); }

// --- Reachability check (throttled, UA set) ---
const urls = [...new Set(allText.match(/https?:\/\/upload\.wikimedia\.org\/[^"']+/g) || [])];
console.log(`\n=== REACHABILITY: ${urls.length} distinct Wikimedia URLs ===`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bad = [];
for (const url of urls) {
  let ok = false, status = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://commons.wikimedia.org/',
        },
        redirect: 'follow',
      });
      status = res.status;
      if (res.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      ok = res.ok;
      break;
    } catch (e) { status = e.message; await sleep(1500); }
  }
  if (!ok) bad.push({ url, status });
  await sleep(500);
}
console.log(`OK: ${urls.length - bad.length} / ${urls.length}`);
if (bad.length) {
  console.log('FAILED:');
  bad.forEach((b) => console.log(`  [${b.status}] ${b.url}`));
  process.exit(1);
}
