import fs from 'fs';

const UA = 'EdinburghGuidePhotoFix/1.0 (contact: editor@example.com)';

const PLACES = {
  // attractions
  "Edinburgh Castle": ["Edinburgh Castle"],
  "Camera Obscura & World of Illusions": ["Camera Obscura Edinburgh", "Outlook Tower Edinburgh"],
  "St Giles' Cathedral": ["St Giles' Cathedral", "St Giles Cathedral Edinburgh"],
  "The Real Mary King's Close": ["Mary King's Close", "Real Mary King's Close", "Warriston's Close Edinburgh"],
  "Victoria Street": ["Victoria Street Edinburgh", "West Bow Edinburgh"],
  "Princes Street Gardens": ["Princes Street Gardens"],
  "Scott Monument": ["Scott Monument"],
  "Dean Village": ["Dean Village Edinburgh"],
  "Royal Botanic Garden Edinburgh": ["Royal Botanic Garden Edinburgh"],
  "Calton Hill": ["Calton Hill"],
  "Arthur's Seat": ["Arthur's Seat", "Arthur's Seat Edinburgh"],
  "Palace of Holyroodhouse": ["Holyrood Palace", "Palace of Holyroodhouse"],
  "Royal Yacht Britannia": ["Royal Yacht Britannia", "HMY Britannia"],
  "Leith Shore": ["The Shore Leith", "Leith Edinburgh"],
  // hotels
  "The Balmoral Hotel": ["Balmoral Hotel Edinburgh", "North British Hotel Edinburgh"],
  "The Witchery by the Castle": ["Witchery by the Castle", "Castlehill Edinburgh"],
  "Market Street Hotel": ["Market Street Edinburgh", "Jeffrey Street Edinburgh"],
  "Motel One Edinburgh – Royal": ["Motel One Edinburgh", "Market Street Edinburgh"],
  "Apex Grassmarket Hotel": ["Grassmarket Edinburgh", "Apex Grassmarket"],
  "ibis Edinburgh Centre South Bridge": ["South Bridge Edinburgh", "Hunter Square Edinburgh"],
  "Premier Inn Edinburgh City Centre": ["Lauriston Place Edinburgh", "Edinburgh city centre"],
  // dining
  "Makars Gourmet Mash Bar": ["Bank Street Edinburgh", "The Mound Edinburgh"],
  "The Scran & Scallie": ["Comely Bank Edinburgh", "Stockbridge Edinburgh"],
  "The Dome": ["The Dome Edinburgh", "George Street Edinburgh"],
  "Fishers in Leith": ["The Shore Leith", "Fishers Leith"],
  "The Kitchin": ["Commercial Quay Leith", "The Kitchin restaurant"],
  "The Ship on the Shore": ["The Shore Leith", "Ship on the Shore Leith"],
  "The Edinburgh Larder": ["Blackfriars Street Edinburgh", "Edinburgh Larder"],
  "Urban Angel": ["Hanover Street Edinburgh"],
  "Cairngorm Coffee": ["Frederick Street Edinburgh"],
  "The Milkman": ["Cockburn Street Edinburgh"],
  "Fortitude Coffee": ["York Place Edinburgh"],
  "Lowdown Coffee": ["George Street Edinburgh"],
  "Brew Lab": ["South College Street Edinburgh"],
  "Hula Juice Bar": ["Grassmarket Edinburgh"],
  "Williams & Johnson Coffee Co.": ["Custom Lane Leith", "Leith Edinburgh"],
  // extras / hidden gems / neighborhoods
  "National Museum of Scotland": ["National Museum of Scotland"],
  "Scottish National Gallery": ["Scottish National Gallery", "National Gallery of Scotland"],
  "Camera Obscura": ["Camera Obscura Edinburgh", "Outlook Tower Edinburgh"],
  "Royal Botanic Garden Glasshouses": ["Royal Botanic Garden Edinburgh glasshouse", "Palm House Edinburgh"],
  "Scotch Whisky Experience": ["Scotch Whisky Experience", "Castlehill Edinburgh"],
  "The Dome afternoon tea": ["The Dome Edinburgh"],
  "Royal Botanic Garden": ["Royal Botanic Garden Edinburgh"],
  "Leith Shore Walk": ["Water of Leith", "The Shore Leith"],
  "Portobello Beach": ["Portobello Edinburgh beach", "Portobello Edinburgh"],
  "Circus Lane": ["Circus Lane Edinburgh", "Circus Lane Stockbridge"],
  "Dunbar's Close Garden": ["Dunbar's Close Edinburgh", "Canongate Edinburgh"],
  "Water of Leith Walkway": ["Water of Leith", "Water of Leith Edinburgh"],
  "Dr Neil's Garden": ["Dr Neil's Garden", "Duddingston Edinburgh"],
  "The Vennel": ["Vennel Edinburgh", "The Vennel Edinburgh"],
  "Stockbridge Market": ["Stockbridge Edinburgh", "Stockbridge market Edinburgh"],
  "Greyfriars Bobby": ["Greyfriars Bobby", "Greyfriars Kirkyard"],
  "Princes Street": ["Princes Street Edinburgh"],
  "Multrees Walk": ["Multrees Walk", "St Andrew Square Edinburgh"],
  "Grassmarket": ["Grassmarket Edinburgh"],
};

async function searchFiles(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=25&gsrsearch=${encodeURIComponent(term)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=960`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const pages = data?.query?.pages || {};
    return Object.values(pages)
      .map((p) => {
        const ii = p.imageinfo?.[0];
        if (!ii) return null;
        return { title: p.title, mime: ii.mime, width: ii.width, height: ii.height, thumb: ii.thumburl, url: ii.url };
      })
      .filter(Boolean)
      .filter((f) => /image\/(jpeg|png)/.test(f.mime))
      .filter((f) => !/\.svg/i.test(f.title))
      .filter((f) => !/(logo|map|plan|diagram|coat_of_arms|locator|icon)/i.test(f.title));
  } catch (e) {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const [place, terms] of Object.entries(PLACES)) {
  const seen = new Set();
  const list = [];
  for (const t of terms) {
    const files = await searchFiles(t);
    for (const f of files) {
      if (seen.has(f.title)) continue;
      seen.add(f.title);
      list.push(f);
    }
    await sleep(250);
  }
  out[place] = list.slice(0, 20);
  console.error(`${place}: ${list.length} candidates`);
}
fs.writeFileSync('scripts/edinburgh-candidates.json', JSON.stringify(out, null, 2));
console.error('WROTE scripts/edinburgh-candidates.json');
