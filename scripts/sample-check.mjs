const urls = [
  // spot-check places (hero of each)
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Sumela_Monastery_%282674159860%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Uzung%C3%B6l_lake_and_town.jpg/960px-Uzung%C3%B6l_lake_and_town.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Ayder_Yaylas%C4%B1_-_panoramio.jpg/960px-Ayder_Yaylas%C4%B1_-_panoramio.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Gelin_Tulu_Waterfall.jpg/960px-Gelin_Tulu_Waterfall.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sera_G%C3%B6l%C3%BC.._-_panoramio.jpg/960px-Sera_G%C3%B6l%C3%BC.._-_panoramio.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Boztepe%2C_Trabzon_-_panoramio.jpg/960px-Boztepe%2C_Trabzon_-_panoramio.jpg",
  // a hotel + dining + a direct-file + a .JPG + a .jpeg
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/USTA_OTEL_CATIDAN_KARADENIZ.TRABZON_-_panoramio.jpg/960px-USTA_OTEL_CATIDAN_KARADENIZ.TRABZON_-_panoramio.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/5/52/Kayalar_Pansion.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/6/64/TurkishBreakfastAtCesme.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Uzung%C3%B6l_cami.JPG/960px-Uzung%C3%B6l_cami.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/S%C3%BCtla%C3%A7_%28Turkish_rice_pudding%29.jpeg/960px-S%C3%BCtla%C3%A7_%28Turkish_rice_pudding%29.jpeg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Trebisonda%2C_Cephanelik_%28ex-polveriera%2C_oggi_hotel%29_01.jpg/960px-Trebisonda%2C_Cephanelik_%28ex-polveriera%2C_oggi_hotel%29_01.jpg",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;
for (const url of urls) {
  let s = 0;
  for (let a = 0; a < 6; a++) {
    try {
      const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8', 'Referer': 'https://commons.wikimedia.org/' } });
      s = res.status;
      if (s === 429) { await sleep(4000 * (a + 1)); continue; }
      if (res.ok) ok++;
      break;
    } catch (e) { s = e.message; await sleep(2000); }
  }
  console.log(`[${s}] ${url.split('/').pop().slice(0, 55)}`);
  await sleep(1500);
}
console.log(`\nSAMPLE OK: ${ok}/${urls.length}`);
