// One-off helper batch 3: breakfast / tea / regional food.
const QUERIES = {
  "Breakfast": ["Turkish breakfast serpme", "Van kahvaltı breakfast", "kuymak muhlama", "menemen breakfast"],
  "Tea": ["Turkish tea glass", "Rize tea garden", "Çay bahçesi"],
  "PideKofte": ["Karadeniz kuymak", "simit sesame bread"],
};
const API = "https://commons.wikimedia.org/w/api.php";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function searchImages(term, limit = 8) {
  const url = `${API}?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=960&origin=*`;
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "trabzon-photo-fix/1.0 (contact@example.com)" } });
      if (!res.ok) { await sleep(800 * (a + 1)); continue; }
      const data = await res.json();
      return Object.values(data?.query?.pages || {}).map((p) => p.imageinfo?.[0]).filter(Boolean)
        .filter((ii) => /image\/jpeg/.test(ii.mime)).map((ii) => ii.thumburl).filter(Boolean);
    } catch { await sleep(800 * (a + 1)); }
  }
  return null;
}
for (const [key, terms] of Object.entries(QUERIES)) {
  const seen = new Set(); const out = [];
  for (const term of terms) {
    const hits = await searchImages(term);
    if (hits === null) { await sleep(700); continue; }
    for (const u of hits) { const f = u.split("/").pop(); if (seen.has(f)) continue; seen.add(f); out.push(u); }
    await sleep(700);
    if (out.length >= 12) break;
  }
  console.log(`\n### ${key}`);
  out.slice(0, 12).forEach((u) => console.log(u));
  if (!out.length) console.log("(NONE)");
}
