import fs from 'fs';
const UA = 'EdinburghGuidePhotoFix/1.0 (contact: editor@example.com)';
const cand = JSON.parse(fs.readFileSync('scripts/edinburgh-candidates.json', 'utf8'));

const EXTRA = {
  "Multrees Walk": ["Multrees Walk Edinburgh", "St Andrew Square Edinburgh", "Harvey Nichols Edinburgh"],
  "Dr Neil's Garden": ["Dr Neil's Garden Edinburgh", "Duddingston Loch", "Duddingston Kirk"],
};

async function searchFiles(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=25&gsrsearch=${encodeURIComponent(term)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=960`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const pages = data?.query?.pages || {};
  return Object.values(pages)
    .map((p) => { const ii = p.imageinfo?.[0]; return ii ? { title: p.title, mime: ii.mime, thumb: ii.thumburl } : null; })
    .filter(Boolean)
    .filter((f) => /image\/(jpeg|png)/.test(f.mime))
    .filter((f) => !/(logo|map|plan|diagram|coat_of_arms|locator|icon|walk of fame|star on)/i.test(f.title));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [place, terms] of Object.entries(EXTRA)) {
  const seen = new Set(); const list = [];
  for (const t of terms) { for (const f of await searchFiles(t)) { if (!seen.has(f.title)) { seen.add(f.title); list.push(f); } } await sleep(250); }
  cand[place] = list.slice(0, 25);
  console.log(`=== ${place} (${list.length})`);
  list.slice(0, 14).forEach((f, i) => console.log('  ' + i + '. ' + f.title.replace(/^File:/, '')));
}
fs.writeFileSync('scripts/edinburgh-candidates.json', JSON.stringify(cand, null, 2));
