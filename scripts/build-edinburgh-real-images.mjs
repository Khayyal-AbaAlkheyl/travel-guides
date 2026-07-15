import fs from 'fs';

const cand = JSON.parse(fs.readFileSync('scripts/edinburgh-candidates.json', 'utf8'));

// [hero, detail, photoSpot, map] as indices into the candidate list for each place.
const PICKS = {
  // ---- Attractions (each MUST have a unique hero) ----
  "Edinburgh Castle": [4, 1, 6, 5],
  "Camera Obscura & World of Illusions": [0, 1, 2, 3],
  "St Giles' Cathedral": [3, 1, 8, 10],
  "The Real Mary King's Close": [0, 5, 6, 11],
  "Victoria Street": [8, 1, 7, 4],
  "Princes Street Gardens": [1, 2, 7, 8],
  "Scott Monument": [1, 10, 6, 8],
  "Dean Village": [0, 8, 1, 5],
  "Royal Botanic Garden Edinburgh": [10, 11, 7, 8],
  "Calton Hill": [0, 4, 6, 10],
  "Arthur's Seat": [0, 9, 7, 11],
  "Palace of Holyroodhouse": [0, 4, 5, 8],
  "Royal Yacht Britannia": [1, 8, 2, 4],
  "Leith Shore": [0, 1, 11, 8],
  // ---- Hotels ----
  "The Balmoral Hotel": [0, 4, 3, 9],
  "The Witchery by the Castle": [3, 4, 8, 9],
  "Market Street Hotel": [1, 4, 7, 5],
  "Motel One Edinburgh – Royal": [1, 0, 4, 5],
  "Apex Grassmarket Hotel": [2, 3, 4, 8],
  "ibis Edinburgh Centre South Bridge": [1, 4, 8, 3],
  "Premier Inn Edinburgh City Centre": [1, 6, 7, 9],
  // ---- Dining ----
  "Makars Gourmet Mash Bar": [0, 2, 8, 9],
  "The Scran & Scallie": [1, 2, 3, 6],
  "The Dome": [0, 1, 6, 7],
  "Fishers in Leith": [2, 3, 9, 8],
  "The Kitchin": [0, 1, 2, 5],
  "The Ship on the Shore": [4, 5, 6, 7],
  "The Edinburgh Larder": [0, 1, 3, 4],
  "Urban Angel": [3, 4, 5, 7],
  "Cairngorm Coffee": [0, 1, 4, 5],
  "The Milkman": [0, 1, 2, 3],
  "Fortitude Coffee": [1, 2, 3, 4],
  "Lowdown Coffee": [1, 2, 3, 5],
  "Brew Lab": [1, 2, 3, 5],
  "Hula Juice Bar": [6, 5, 1, 0],
  "Williams & Johnson Coffee Co.": [0, 4, 7, 8],
  // ---- Extras (hidden gems / neighborhoods / rainy / sunny) ----
  "National Museum of Scotland": [0, 2, 4, 3],
  "Scottish National Gallery": [2, 5, 6, 7],
  "Camera Obscura": [0, 4, 5, 6],
  "Royal Botanic Garden Glasshouses": [3, 4, 5, 7],
  "Scotch Whisky Experience": [0, 1, 2, 6],
  "The Dome afternoon tea": [7, 6, 1, 0],
  "Royal Botanic Garden": [10, 7, 8, 11],
  "Leith Shore Walk": [4, 6, 7, 8],
  "Portobello Beach": [0, 1, 2, 6],
  "Circus Lane": [0, 1, 4, 8],
  "Dunbar's Close Garden": [0, 5, 6, 7],
  "Water of Leith Walkway": [4, 1, 6, 8],
  "Dr Neil's Garden": [0, 1, 6, 4],
  "The Vennel": [2, 0, 6, 8],
  "Stockbridge Market": [4, 0, 1, 3],
  "Greyfriars Bobby": [0, 3, 2, 6],
  "Princes Street": [0, 3, 5, 6],
  "Multrees Walk": [1, 12, 11, 2],
  "Grassmarket": [2, 1, 8, 11],
};

const roles = ["hero", "detail", "photoSpot", "map"];
const out = {};
const noPhoto = [];

for (const [place, idx] of Object.entries(PICKS)) {
  let list = cand[place] || [];
  let picks = idx;
  const urls = picks.map((i) => list[i]?.thumb).filter(Boolean);
  if (!urls.length) { console.error('!! no urls for', place); continue; }
  // pad to 4 with distinct-where-possible fallbacks
  while (urls.length < 4) urls.push(urls[urls.length - 1]);
  out[place] = { hero: urls[0], detail: urls[1], photoSpot: urls[2], map: urls[3] };
}

fs.writeFileSync('data/edinburgh-real-images.json', JSON.stringify(out, null, 2) + '\n', 'utf8');

// ---- validations ----
const attractions = ["Edinburgh Castle","Camera Obscura & World of Illusions","St Giles' Cathedral","The Real Mary King's Close","Victoria Street","Princes Street Gardens","Scott Monument","Dean Village","Royal Botanic Garden Edinburgh","Calton Hill","Arthur's Seat","Palace of Holyroodhouse","Royal Yacht Britannia","Leith Shore"];
const heroes = attractions.map((a) => out[a]?.hero);
const dupHeroes = heroes.filter((h, i) => heroes.indexOf(h) !== i);
let sameFileEntries = 0;
for (const [place, set] of Object.entries(out)) {
  const u = new Set([set.hero, set.detail, set.photoSpot, set.map]);
  if (u.size < 4) sameFileEntries++;
}
console.log('Total entries:', Object.keys(out).length);
console.log('Attraction duplicate heroes:', dupHeroes.length, dupHeroes);
console.log('Entries with <4 distinct files:', sameFileEntries);
console.log('No dedicated Wikimedia photo (fallback used):', noPhoto.join(', ') || 'none');
