/*
  Travel Guide — mobile magazine app
  Requires: global PLAN (from data/london.js), shared.js utilities
*/

(function (global) {
  'use strict';

  const {
    applyTheme,
    qr,
    stars,
    staticMap,
    getCoords,
    esc,
    caption,
    timeClass,
    actionButtons,
    icon,
    iconWrap,
    img,
    photoUrl,
    shortText,
    HOME_WEATHER_MONTHS,
    HOTEL_GALLERY_KEYS,
    ICONS
  } = global;

  let activeTab = 'home';
  let activeDay = 1;
  let activeMoreSection = 'transport';
  let activePackingSeason = 'spring';
  /** @type {{ kind: 'sight'|'stay'|'eat', index: number } | null} */
  let detailView = null;

  const DETAIL_BACK_LABEL = { sight: 'Sights', stay: 'Stay', eat: 'Eat' };

  function placeId(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderHighlights(items) {
    const cells = items.filter(x => x.value).map(item =>
      `<div class="place-highlight">
        <div class="place-highlight__label">${esc(item.label)}</div>
        <div class="place-highlight__value">${esc(item.value)}</div>
      </div>`
    ).join('');
    return cells ? `<div class="place-highlights">${cells}</div>` : '';
  }

  function renderDetailShell(kind, content) {
    const label = DETAIL_BACK_LABEL[kind] || 'Back';
    return `<div class="detail-page">
      <header class="detail-page__bar">
        <button type="button" class="detail-back" onclick="closeDetail()">← Back to ${esc(label)}</button>
      </header>
      ${content}
    </div>`;
  }

  function openDetail(kind, index) {
    detailView = { kind, index: Number(index) };
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeDetail() {
    detailView = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function meta() {
    return PLAN.meta || PLAN;
  }

  function theme() {
    return meta().theme || PLAN.theme || {};
  }

  function statsArray() {
    const s = meta().stats;
    if (Array.isArray(s)) return s;
    if (!s || typeof s !== 'object') return [];
    return [
      { value: String(s.attractions || ''), label: 'Sights' },
      { value: String(s.hotels || ''), label: 'Hotels' },
      { value: String(s.dining || ''), label: 'Dining' },
      { value: String(s.days || ''), label: 'Days' },
      { value: String(s.qrCodes || ''), label: 'QR Codes' },
      { value: String(s.chapters || ''), label: 'Chapters' }
    ].filter(x => x.value);
  }

  function renderCoverHero(tall) {
    const m = meta();
    const stats = statsArray();
    const statsHtml = stats.length
      ? `<div class="stats">${stats.slice(0, 3).map(s =>
          `<div class="stat"><div class="stat__value">${esc(s.value)}</div><div class="stat__label">${esc(s.label)}</div></div>`
        ).join('')}</div>`
      : '';

    return `<div class="hero ${tall ? 'hero--cover' : ''}">
      ${img(theme().heroImage, m.city + ' skyline', '16/9', 'center 35%')}
      <div class="hero__content">
        <span class="discover-wordmark">Discover</span>
        <span class="hero__badge">${esc(m.badge)} · ${esc(m.country)}</span>
        <h1 class="hero__title">${esc(m.city)}</h1>
        <p class="hero__subtitle">${esc(m.tagline)}</p>
      </div>
    </div>${statsHtml}`;
  }

  function renderChapterOpener(num, title, subtitle, bg) {
    const media = bg ? img(bg, title, '21/9', 'center 30%') : '';
    return `<div class="chapter-opener full-bleed">
      ${media}
      <div class="chapter-opener__inner">
        <div class="chapter-opener__num">${esc(num)}</div>
        <h2 class="chapter-opener__title">${esc(title)}</h2>
        ${subtitle ? `<p class="chapter-opener__sub">${esc(subtitle)}</p>` : ''}
      </div>
    </div>`;
  }

  function renderCrowdBars(crowd) {
    if (!crowd) return '';
    const rows = [
      { key: 'morning', label: 'Morning' },
      { key: 'afternoon', label: 'Afternoon' },
      { key: 'evening', label: 'Evening' }
    ];
    return `<div class="crowd-bars">
      <div class="crowd-bars__title">Crowd levels</div>
      ${rows.map(r => {
        const val = crowd[r.key] || 0;
        const pct = (val / 5) * 100;
        return `<div class="crowd-row">
          <span class="crowd-row__label">${r.label}</span>
          <div class="crowd-row__bar"><div class="crowd-row__fill" style="width:${pct}%"></div></div>
          <span class="crowd-row__stars">${stars(val)}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderSeasonalStrip(seasonalPhotos) {
    if (!seasonalPhotos) return '';
    const labels = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', christmas: 'Christmas' };
    const items = Object.entries(seasonalPhotos).map(([k, url]) =>
      `<div class="seasonal-strip__item">
        <div class="seasonal-strip__img" style="background-image:url('${esc(url)}')"></div>
        <div class="seasonal-strip__label">${esc(labels[k] || k)}</div>
      </div>`
    ).join('');
    return `<div class="seasonal-strip full-bleed" style="padding-left:var(--pad);padding-right:var(--pad)">${items}</div>`;
  }

  function renderMapQr(name, mapUrl, lat, lng) {
    let mapImg = '';
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      mapImg = staticMap(lat, lng, 320, 160);
    } else {
      const coords = getCoords(name);
      if (coords) mapImg = staticMap(coords.lat, coords.lng, 320, 160);
    }

    const mapEl = mapImg
      ? `<img class="map-qr-row__map" src="${esc(mapImg)}" alt="Map of ${esc(name)}" loading="lazy">`
      : `<div class="map-qr-row__map map-qr-row__map--empty">${iconWrap('map')}<span>Open map link below</span></div>`;

    return `<div class="map-qr-row">
      ${mapEl}
      <div class="map-qr-row__qr">
        <img src="${esc(qr(mapUrl, 88))}" width="88" height="88" alt="QR code for ${esc(name)}">
        <span>Scan for map</span>
      </div>
    </div>`;
  }

  function renderAttractionListCard(a, index) {
    const hero = photoUrl(a.photos, 'hero', 'detail');
    const focal = a.photos?.heroPosition || 'center 30%';
    return `<button type="button" class="place-list-card" onclick="openDetail('sight', ${index})">
      <div class="place-list-card__media">${img(hero, a.name, '16/9', focal, hero)}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(a.name)}</h3>
        <div class="place-list-card__chips">
          <span class="chip chip--accent">${esc(a.ticket)}</span>
          <span class="chip chip--parks">${esc(a.avgVisit)}</span>
          <span class="chip chip--warn">${esc(a.waitSummer)} wait</span>
        </div>
        ${a.tip ? `<p class="place-list-card__teaser">${esc(shortText(a.tip, 1))}</p>` : ''}
        <span class="place-list-card__cta">View guide →</span>
      </div>
    </button>`;
  }

  function renderAttractionDetail(a) {
    const photos = a.photos || {};
    const hero = photoUrl(photos, 'hero', 'detail');
    const focal = photos.heroPosition || 'center 30%';
    const detailUrl = photoUrl(photos, 'detail', 'hero');
    const spotUrl = photoUrl(photos, 'photoSpot', 'detail');

    const gridSlots = [];
    if (detailUrl && detailUrl !== hero) {
      gridSlots.push({ url: detailUrl, alt: 'Detail view', focal: 'center', fb: hero });
    }
    if (spotUrl && spotUrl !== hero && spotUrl !== detailUrl) {
      gridSlots.push({ url: spotUrl, alt: 'Best photo spot', focal: 'center 40%', fb: hero });
    }

    const photoGrid = gridSlots.length
      ? `<div class="photo-grid">
          ${gridSlots.map(slot =>
            img(slot.url, slot.alt, '4/3', slot.focal, slot.fb)
          ).join('')}
        </div>`
      : '';

    const nearbyTop = (a.nearby || []).slice(0, 5).map(n =>
      `<div class="nearby-item">
        <span>${esc(n.name)}</span>
        <span class="nearby-item__walk">${esc(n.walk)}</span>
      </div>`
    ).join('');

    const eatNearby = [a.nearbyCafes, a.nearbyRestaurants].filter(Boolean).join(' · ');
    const gettingThere = a.nearbyTube || '';
    const nearbyPractical = [
      eatNearby ? `<div class="nearby-block"><div class="nearby-block__label">Eat nearby</div>${esc(eatNearby)}</div>` : '',
      gettingThere ? `<div class="nearby-block"><div class="nearby-block__label">Getting there</div>${esc(gettingThere)}</div>` : ''
    ].join('');

    const insider = [a.didYouKnow, a.localSecret].filter(Boolean).join(' ');
    const insiderBox = insider
      ? `<div class="box box--insider"><div class="box__title">${iconWrap('lightbulb')} Insider</div>${esc(insider)}</div>`
      : '';

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(a.name)}</h1>
      ${img(hero, a.name, '16/9', focal, hero)}
      ${caption(a.photoSpot || a.name, a.lens ? `Lens: ${a.lens}` : '')}
      ${photoGrid}
      ${renderHighlights([
        { label: 'Ticket', value: a.ticket },
        { label: 'Tube', value: a.tube?.split('·')[0]?.trim() || a.tube },
        { label: 'Visit time', value: a.avgVisit },
        { label: 'Summer wait', value: a.waitSummer }
      ])}
      <div class="chips">
        <span class="chip chip--accent">${esc(a.ticket)}</span>
        <span class="chip chip--tube">${esc(a.tube)}</span>
        <span class="chip">${esc(a.hours)}</span>
        <span class="chip chip--warn">Summer wait: ${esc(a.waitSummer)}</span>
        <span class="chip chip--parks">Visit: ${esc(a.avgVisit)}</span>
      </div>
      ${renderCrowdBars(a.crowd)}
      ${a.tip ? `<div class="tip-inline"><strong>Tip:</strong> ${esc(a.tip)}</div>` : ''}
      ${nearbyTop ? `<div class="nearby-list"><div class="nearby-list__title">Nearby — top 5</div>${nearbyTop}</div>` : ''}
      ${nearbyPractical}
      ${insiderBox}
      ${renderMapQr(a.name, a.mapUrl, a.lat, a.lng)}
      ${actionButtons(a.mapUrl, a.bookUrl, a.bookText || 'Book')}
    </article>`;
  }

  function renderHome() {
    const m = meta();
    const w = PLAN.welcome || {};
    const essentials = PLAN.essentials || {};
    const essentialCards = Object.values(essentials).map(e =>
      `<div class="essential-card">
        <div class="essential-card__label">${esc(e.label?.split('·')[0] || e.label)}</div>
        <div class="essential-card__value">${esc(e.label)}</div>
        <div class="essential-card__note">${esc(e.note)}</div>
      </div>`
    ).join('');

    const arrival = (PLAN.arrival || []).map(s =>
      `<div class="arrival-step">
        <div class="arrival-step__num">${esc(s.step)}</div>
        <div>
          <div class="arrival-step__title">${esc(s.title)}</div>
          <div class="arrival-step__desc">${esc(s.desc)}</div>
        </div>
      </div>`
    ).join('');

    const packing = PLAN.packing || {};
    const seasons = Object.keys(packing);
    const packingTabs = seasons.map(k =>
      `<button type="button" class="packing-tab ${k === activePackingSeason ? 'active' : ''}" onclick="setPackingSeason('${k}')">${esc(packing[k].months || k)}</button>`
    ).join('');

    const pk = packing[activePackingSeason] || packing[seasons[0]] || {};
    const packingList = (pk.items || []).map(i => `<li>${esc(i)}</li>`).join('');

    const weatherRows = (PLAN.weatherTable?.rows || [])
      .filter(r => HOME_WEATHER_MONTHS.includes(r.month))
      .map(r =>
      `<tr>
        <td><strong>${esc(r.month)}</strong></td>
        <td>${esc(r.avgTemp)}</td>
        <td>${esc(r.rain)}</td>
        <td>${esc(r.crowds)}</td>
        <td>${esc(r.recommend)}</td>
      </tr>`
    ).join('');

    const sweetSpot = PLAN.weatherTable?.sweetSpot;
    const letter = shortText(w.editorLetter, 2);

    return `${renderCoverHero(true)}
      <div class="editor-letter">
        <div class="editor-letter__kicker">From the Editor · ${esc(m.edition || '2026')}</div>
        <div class="editor-letter__body">${esc(letter)}</div>
      </div>
      <div class="section-head section-head--tight"><h2>Essentials</h2><p>Everything you need before landing.</p></div>
      <div class="essentials-grid">${essentialCards}</div>
      <div class="section-head"><h2>Arrival playbook</h2><p>Seven steps from touchdown to tea.</p></div>
      <div class="arrival-list">${arrival}</div>
      <div class="section-head"><h2>Packing</h2><p>${esc(packing[activePackingSeason]?.months || 'Spring')} checklist.</p></div>
      <div class="packing-panel">
        <div class="packing-panel__temp">${esc(pk.temp)}</div>
        <ul class="packing-list">${packingList}</ul>
      </div>
      <div class="section-head"><h2>Best months to visit</h2><p>Peak season at a glance — full table in More → Weather.</p></div>
      <div class="weather-table-wrap">
        <table class="weather-table">
          <thead><tr><th>Month</th><th>Temp</th><th>Rain</th><th>Crowds</th><th>Best for</th></tr></thead>
          <tbody>${weatherRows}</tbody>
        </table>
      </div>
      ${sweetSpot ? `<div class="prose prose--highlight" style="margin:0 var(--pad) 32px">${esc(sweetSpot)}</div>` : ''}`;
  }

  function renderAttractions() {
    const list = PLAN.attractions || [];
    if (detailView?.kind === 'sight') {
      const a = list[detailView.index];
      if (a) return renderDetailShell('sight', renderAttractionDetail(a));
    }
    const opener = renderChapterOpener(
      'Chapter 01',
      'Must-See Sights',
      'Tap any sight for the full guide.',
      photoUrl(list[0]?.photos, 'hero', 'detail')
    );
    return opener + `<div class="place-list">${list.map((a, i) => renderAttractionListCard(a, i)).join('')}</div>`;
  }

  function renderHotelGallery(photos) {
    if (!photos) return '';
    const hero = photoUrl(photos, 'exterior', 'room');
    const labels = {
      exterior: 'Exterior',
      room: 'Room',
      restaurant: 'Restaurant',
      view: 'View'
    };
    const cells = HOTEL_GALLERY_KEYS
      .filter(key => photos[key])
      .map(key =>
        `<div class="hotel-grid__cell">${img(photos[key], labels[key], '1/1', 'center', hero)}
          <span class="hotel-grid__label">${esc(labels[key])}</span>
        </div>`
      ).join('');
    return cells ? `<div class="hotel-grid">${cells}</div>` : '';
  }

  function renderHotelListCard(h, index) {
    const cover = photoUrl(h.photos, 'exterior', 'room');
    return `<button type="button" class="place-list-card" onclick="openDetail('stay', ${index})">
      <div class="place-list-card__media">${cover ? img(cover, h.name, '16/9', 'center', cover) : ''}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(h.name)}</h3>
        <div class="place-list-card__chips">
          <span class="chip chip--gold">${esc(h.category)}</span>
          <span class="chip chip--accent">${esc(h.price)}</span>
          <span class="chip">★ ${esc(h.rating)}</span>
        </div>
        <p class="place-list-card__meta">${esc(h.tube?.split('·')[0]?.trim() || h.tube)} · ${esc(h.room)}</p>
        <span class="place-list-card__cta">View hotel →</span>
      </div>
    </button>`;
  }

  function renderHotelDetail(h) {
    const ideal = (h.idealFor || []).map(t => `<span class="chip chip--ok">${esc(t)}</span>`).join('');
    const cover = photoUrl(h.photos, 'exterior', 'room');

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(h.name)}</h1>
      ${cover ? img(cover, h.name, '16/9', 'center', cover) : ''}
      ${renderHighlights([
        { label: 'Price', value: h.price },
        { label: 'Rating', value: `★ ${h.rating}` },
        { label: 'Tube', value: h.tube?.split('·')[0]?.trim() || h.tube },
        { label: 'Category', value: h.category }
      ])}
      <div class="chips">
        <span class="chip chip--gold">${esc(h.category)}</span>
        <span class="chip chip--accent">${esc(h.price)}</span>
        <span class="chip">★ ${esc(h.rating)} · Google ${esc(h.googleRating)}</span>
      </div>
      ${renderHotelGallery(h.photos)}
      <div class="chips">
        <span class="chip">${esc(h.room)}</span>
        <span class="chip chip--tube">${esc(h.tube)}</span>
        <span class="chip">${esc(h.cancellation)}</span>
      </div>
      <div class="nearby-block"><div class="nearby-block__label">Address</div>${esc(h.address)}</div>
      <div class="nearby-block"><div class="nearby-block__label">Airport</div>${esc(h.airport)}</div>
      <div class="nearby-block"><div class="nearby-block__label">Nearby</div>${esc(h.nearbyAttractions)}</div>
      <div class="nearby-block"><div class="nearby-block__label">Walk score</div>${esc(h.walkingScore)}</div>
      ${ideal ? `<div class="chips">${ideal}</div>` : ''}
      ${h.tip ? `<div class="tip-inline"><strong>Tip:</strong> ${esc(h.tip)}</div>` : ''}
      ${renderMapQr(h.name, h.mapUrl, h.lat, h.lng)}
      ${actionButtons(h.mapUrl, h.bookUrl, 'Book')}
    </article>`;
  }

  function renderHotels() {
    const list = PLAN.hotels || [];
    if (detailView?.kind === 'stay') {
      const h = list[detailView.index];
      if (h) return renderDetailShell('stay', renderHotelDetail(h));
    }
    const opener = renderChapterOpener('Chapter 02', 'Where to Stay', 'Tap a hotel for rooms, tips and booking.', list[0]?.photos?.exterior);
    return opener + `<div class="place-list">${list.map((h, i) => renderHotelListCard(h, i)).join('')}</div>`;
  }

  function renderDiningListCard(d, index) {
    const signature = photoUrl(d.photos, 'signature', 'hero');
    return `<button type="button" class="place-list-card" onclick="openDetail('eat', ${index})">
      <div class="place-list-card__media">${signature ? img(signature, d.name, '16/9', 'center', signature) : ''}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(d.name)}</h3>
        <div class="place-list-card__chips">
          <span class="chip">${esc(d.category)}</span>
          <span class="chip chip--accent">${esc(d.price)}</span>
          <span class="chip chip--warn">${esc(d.wait)}</span>
        </div>
        ${d.famous ? `<p class="place-list-card__teaser">${esc(shortText(d.famous, 1))}</p>` : ''}
        <span class="place-list-card__cta">View menu →</span>
      </div>
    </button>`;
  }

  function renderDiningDetail(d) {
    const dishes = (d.dishes || []).slice(0, 3);
    const signature = photoUrl(d.photos, 'signature', 'hero');
    const dishGrid = dishes.map(dish =>
      `<div class="dish-card">
        ${img(dish.img, dish.name, '4/3', 'center', signature)}
        <div class="dish-card__body">
          <div class="dish-card__name">${esc(dish.name)}</div>
          <div class="dish-card__desc">${esc(dish.desc)}</div>
        </div>
      </div>`
    ).join('');

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(d.name)}</h1>
      ${signature ? img(signature, d.famous || d.name, '16/9', 'center', signature) : ''}
      ${renderHighlights([
        { label: 'Price', value: d.price },
        { label: 'Wait', value: d.wait },
        { label: 'Category', value: d.category },
        { label: 'Reserve', value: d.michelin && d.michelin !== '—' ? d.michelin : 'Walk-in OK' }
      ])}
      <div class="chips">
        <span class="chip">${esc(d.category)}</span>
        <span class="chip chip--accent">${esc(d.price)}</span>
        ${d.michelin && d.michelin !== '—' ? `<span class="chip chip--gold">${esc(d.michelin)}</span>` : ''}
        ${d.halal ? '<span class="chip chip--ok">Halal</span>' : ''}
        ${d.vegetarian ? '<span class="chip chip--ok">Vegetarian</span>' : ''}
        <span class="chip chip--warn">${esc(d.wait)}</span>
      </div>
      <div class="nearby-block"><div class="nearby-block__label">Famous for</div>${esc(d.famous)}</div>
      <div class="section-head section-head--tight"><h2>Must try</h2></div>
      <div class="dish-grid">${dishGrid}</div>
      ${d.tip ? `<div class="tip-inline"><strong>Tip:</strong> ${esc(d.tip)}</div>` : ''}
      ${renderMapQr(d.name, d.mapUrl, d.lat, d.lng)}
      ${actionButtons(d.mapUrl, d.bookUrl, 'Reserve')}
    </article>`;
  }

  function renderDining() {
    const list = PLAN.dining || [];
    if (detailView?.kind === 'eat') {
      const d = list[detailView.index];
      if (d) return renderDetailShell('eat', renderDiningDetail(d));
    }
    const opener = renderChapterOpener('Chapter 03', 'Where to Eat', 'Tap a restaurant for dishes and booking.', list[0]?.photos?.signature);
    return opener + `<div class="place-list">${list.map((d, i) => renderDiningListCard(d, i)).join('')}</div>`;
  }

  function findStopPhoto(stopName) {
    const a = (PLAN.attractions || []).find(x =>
      normalize(x.name) === normalize(stopName) ||
      normalize(stopName).includes(normalize(x.name)) ||
      normalize(x.name).includes(normalize(stopName))
    );
    if (a?.photos?.hero) return a.photos.hero;
    const d = (PLAN.dining || []).find(x => normalize(x.name).includes(normalize(stopName)));
    if (d?.photos?.signature) return d.photos.signature;
    return null;
  }

  function normalize(str) {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function renderPlan() {
    const days = PLAN.itineraries || [];
    const day = days.find(d => d.day === activeDay) || days[0];
    if (!day) return renderChapterOpener('Chapter 04', 'Your Itinerary', 'No plans yet.');

    const opener = renderChapterOpener('Chapter 04', 'Your Itinerary', 'Hour-by-hour routes, ready to follow.', day.photos?.[0]);

    const dayTabs = days.map(d =>
      `<button type="button" class="day-tab ${d.day === activeDay ? 'active' : ''}" onclick="setDay(${d.day})">
        <div class="day-tab__num">Day ${d.day}</div>
        <div class="day-tab__title">${esc(d.title)}</div>
      </button>`
    ).join('');

    const photoStrip = (day.photos || []).slice(0, 4).map(url =>
      `<div class="day-strip__item">${img(url, day.title, '4/3', 'center 35%')}</div>`
    ).join('');

    const routeBanner = `<div class="route-banner">
      <div class="route-banner__info">
        <h3>Day ${day.day}: ${esc(day.title)}</h3>
        <p>${esc(day.routePreview || '')}</p>
      </div>
      <div class="map-qr-row__qr">
        <img src="${esc(qr(day.mapUrl, 72))}" width="72" height="72" alt="Route QR">
        <span>Full route</span>
      </div>
    </div>`;

    const stops = (day.stops || []).map(stop => {
      const cls = timeClass(stop.timeOfDay);
      const photo = findStopPhoto(stop.name);
      const transitIcon = ICONS[stop.icon] || ICONS.walk;
      return `<div class="stop">
        <div class="stop__dot"></div>
        <time class="stop__time">${esc(stop.time)}</time>
        <div class="stop__card ${cls}">
          ${photo ? `<div class="stop__photo">${img(photo, stop.name, '21/9', 'center 30%')}</div>` : ''}
          <div class="stop__body">
            <div class="stop__name">${esc(stop.name)}</div>
            <div class="stop__desc">${esc(stop.desc)}</div>
            <div class="stop__footer">
              <span class="stop__transit">${transitIcon} ${esc(stop.transit)}</span>
              <a class="stop__map" href="${esc(stop.mapUrl)}" target="_blank" rel="noopener">${ICONS.pin} Map</a>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    return `${opener}
      <div class="day-tabs">${dayTabs}</div>
      <div class="day-strip">${photoStrip}</div>
      ${routeBanner}
      <div class="timeline"><div class="timeline__line"></div>${stops}</div>`;
  }

  function renderFullWeatherTable() {
    const rows = (PLAN.weatherTable?.rows || []).map(r =>
      `<tr>
        <td><strong>${esc(r.month)}</strong></td>
        <td>${esc(r.avgTemp)}</td>
        <td>${esc(r.rain)}</td>
        <td>${esc(r.sunset)}</td>
        <td>${esc(r.crowds)}</td>
        <td>${esc(r.recommend)}</td>
      </tr>`
    ).join('');
    return `<div class="weather-table-wrap">
      <table class="weather-table">
        <thead><tr><th>Month</th><th>Temp</th><th>Rain</th><th>Sunset</th><th>Crowds</th><th>Best for</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  function renderLocalTips() {
    const phrases = (PLAN.phrases || []).map(p =>
      `<li class="phrase-item"><div class="phrase-item__english">${esc(p.english)}</div><div class="phrase-item__use">${esc(p.use)}</div></li>`
    ).join('');
    const etiquette = (PLAN.etiquette || []).map(e =>
      `<li class="etiquette-item"><div class="etiquette-item__rule">${esc(e.rule)}</div><div class="etiquette-item__desc">${esc(e.desc)}</div></li>`
    ).join('');
    return `<h3 style="font-size:13px;margin-bottom:10px">Useful phrases</h3>
      <ul class="phrase-list">${phrases}</ul>
      <h3 style="font-size:13px;margin:24px 0 10px">Local etiquette</h3>
      <ul class="etiquette-list">${etiquette}</ul>`;
  }

  function renderWeatherCards(items) {
    return (items || []).map(item =>
      `<div class="weather-card">
        ${item.img ? img(item.img, item.name, '16/9', 'center') : ''}
        <div class="weather-card__body">
          <div class="weather-card__name">${esc(item.name)}</div>
          ${item.address ? `<div class="weather-card__addr">${esc(item.address)}</div>` : ''}
          <div class="weather-card__desc">${esc(item.desc)}</div>
          ${item.mapUrl ? `<a href="${esc(item.mapUrl)}" target="_blank" rel="noopener" class="link-sm">Open map →</a>` : ''}
        </div>
      </div>`
    ).join('');
  }

  function renderTransport() {
    const t = PLAN.transport || {};
    const modes = (t.modes || []).map(m => {
      const iconCls = ['tube', 'boat', 'walk'].includes(m.icon) ? ` transport-card__icon--${m.icon}` : '';
      return `<div class="transport-card">
        <div class="transport-card__icon${iconCls}">${icon(m.icon) || icon('train')}</div>
        <div class="transport-card__name">${esc(m.name)}</div>
        <div class="transport-card__price">${esc(m.price)}</div>
        <div class="transport-card__desc">${esc(m.desc)}</div>
      </div>`;
    }).join('');

    const oyster = (t.oysterTips || []).map(o =>
      `<li><strong>${esc(o.title)}</strong>${esc(o.desc)}</li>`
    ).join('');

    return `<div class="transport-grid">${modes}</div>
      ${t.exit6Tip ? `<div class="transport-tip"><strong>Pro tip:</strong> ${esc(t.exit6Tip)}</div>` : ''}
      <h3 style="font-size:13px;margin-bottom:10px">Payment tips</h3>
      <ul class="oyster-list">${oyster}</ul>`;
  }

  function renderMaps() {
    const captionText = PLAN.maps?.overview?.caption || '';
    const markers = PLAN.maps?.overview?.markers || [];
    const center = markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 51.5074, lng: -0.1278 };
    const mapImg = staticMap(center.lat, center.lng, 400, 220);

    const legend = `<div class="map-legend">
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--attraction"></span> Sights</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--hotel"></span> Hotels</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--dining"></span> Dining</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--park"></span> Parks</span>
    </div>`;

    const list = markers.slice(0, 12).map(m =>
      `<div class="nearby-item"><span>${esc(m.name)}</span><span class="chip" style="font-size:9px">${esc(m.type)}</span></div>`
    ).join('');

    return `<p class="prose">${esc(captionText)}</p>
      ${mapImg ? `<img src="${esc(mapImg)}" alt="Overview map" style="width:100%;border-radius:12px;margin:12px 0" loading="lazy">` : ''}
      ${legend}
      <div class="nearby-list"><div class="nearby-list__title">Key locations</div>${list}</div>`;
  }

  function renderBudget() {
    const b = PLAN.budget || {};
    return ['budget', 'mid', 'luxury'].map(tier => {
      const data = b[tier];
      if (!data) return '';
      const label = tier.charAt(0).toUpperCase() + tier.slice(1);
      const rows = ['daily', 'accommodation', 'food', 'transport', 'activities', 'extras']
        .filter(k => data[k])
        .map(k => `<div class="budget-row"><span>${k}</span><span class="budget-row__val">${esc(data[k])}</span></div>`)
        .join('');
      return `<div class="budget-overview__card">
        <h3>${label}</h3>
        ${rows}
        ${data.tip ? `<p class="prose" style="margin-top:10px">${esc(data.tip)}</p>` : ''}
      </div>`;
    }).join('');
  }

  function renderFamily() {
    const f = PLAN.family || {};
    const rows = (f.rows || []).map(r =>
      `<tr>
        <td><strong>${esc(r.attraction)}</strong><br><span style="color:var(--text-muted)">${esc(r.desc)}</span></td>
        <td class="${r.goodForKids ? 'family-yes' : 'family-no'}">${r.goodForKids ? '✓' : '—'}</td>
        <td class="${r.stroller ? 'family-yes' : 'family-no'}">${r.stroller ? '✓' : '—'}</td>
        <td class="${r.babyChange ? 'family-yes' : 'family-no'}">${r.babyChange ? '✓' : '—'}</td>
        <td class="${r.familyTicket ? 'family-yes' : 'family-no'}">${r.familyTicket ? '✓' : '—'}</td>
      </tr>`
    ).join('');

    return `${f.tip ? `<div class="prose prose--highlight">${esc(f.tip)}</div>` : ''}
      <table class="family-table">
        <thead><tr><th>Attraction</th><th>Kids</th><th>Stroller</th><th>Baby</th><th>Family £</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderEmergency() {
    const e = PLAN.emergency || {};
    const numbers = (e.numbers || []).map(n =>
      `<div class="emergency-card">
        <div class="emergency-card__icon">${icon(n.icon) || ICONS.emergency}</div>
        <div class="emergency-card__label">${esc(n.label)}</div>
        <div class="emergency-card__desc">${esc(n.desc)}</div>
      </div>`
    ).join('');

    const hospitals = (e.hospitals || []).map(h =>
      `<li>
        <span class="emergency-list__icon">${icon(h.icon) || ICONS.hospital}</span>
        <span><strong>${esc(h.name)}</strong><br>${esc(h.address)}</span>
        <a href="${esc(h.mapUrl)}" target="_blank" rel="noopener" class="btn btn--ghost" style="min-height:36px;padding:0 10px;font-size:10px">Map</a>
      </li>`
    ).join('');

    const embassies = (e.embassies || []).map(em =>
      `<li>
        <span class="emergency-list__icon">${icon(em.icon) || ICONS.embassy}</span>
        <span><strong>${esc(em.country)}</strong><br>${esc(em.address)}</span>
        <a href="${esc(em.mapUrl)}" target="_blank" rel="noopener" class="btn btn--ghost" style="min-height:36px;padding:0 10px;font-size:10px">Map</a>
      </li>`
    ).join('');

    return `<div class="emergency-grid">${numbers}</div>
      ${e.lostPassport ? `<div class="warning-card"><div class="warning-card__title">Lost passport</div><div class="warning-card__desc">${esc(e.lostPassport)}</div></div>` : ''}
      <h3 style="font-size:13px;margin:16px 0 8px">Hospitals</h3>
      <ul class="emergency-list">${hospitals}</ul>
      <h3 style="font-size:13px;margin:16px 0 8px">Embassies</h3>
      <ul class="emergency-list">${embassies}</ul>`;
  }

  function renderCheatSheet() {
    const cs = PLAN.cheatSheet || {};
    const block = (title, rows) => {
      if (!rows?.length) return '';
      return `<div class="cheat-sheet__block"><h4>${esc(title)}</h4>
        ${rows.map(r => `<div class="cheat-sheet__row"><span>${esc(r.label || r.name)}</span><strong>${esc(r.value || r.use)}</strong></div>`).join('')}
      </div>`;
    };

    const qrGrid = (cs.topQrCodes || []).map(q =>
      `<div class="cheat-sheet__qr-item">
        <img src="${esc(qr(q.mapUrl, 56))}" alt="">
        <span>${esc(q.name)}</span>
      </div>`
    ).join('');

    return `<div class="cheat-sheet" id="cheat-sheet-print">
      <div class="cheat-sheet__header">
        <div class="cheat-sheet__title">${esc(cs.title || 'Cheat Sheet')}</div>
        <div class="cheat-sheet__subtitle">${esc(cs.subtitle || '')}</div>
      </div>
      <div class="cheat-sheet__grid">
        ${block('Emergency', cs.emergency)}
        ${block('Transport', cs.transport)}
        ${block('Money', cs.money)}
        ${block('Apps', cs.apps)}
      </div>
      ${qrGrid ? `<div class="cheat-sheet__qr-grid">${qrGrid}</div>` : ''}
    </div>`;
  }

  const MORE_SECTIONS = {
    transport: { label: 'Transport', render: renderTransport },
    maps: { label: 'Maps', render: renderMaps },
    weather: { label: 'Weather', render: () =>
      `${renderFullWeatherTable()}
       <h3 style="font-size:13px;margin:24px 0 10px">Rainy day</h3><div class="weather-cards">${renderWeatherCards(PLAN.rainyDay)}</div>
       <h3 style="font-size:13px;margin:24px 0 10px">Sunny day</h3><div class="weather-cards">${renderWeatherCards(PLAN.sunnyDay)}</div>`
    },
    gems: { label: 'Gems', render: () =>
      (PLAN.hiddenGems || []).map(g =>
        `<div class="gem-card">
          ${img(g.img, g.name, '16/9', 'center')}
          <div class="gem-card__body">
            <div class="gem-card__name">${esc(g.name)}</div>
            <div class="gem-card__desc">${esc(g.desc)}</div>
            ${g.mapUrl ? `<a href="${esc(g.mapUrl)}" target="_blank" rel="noopener" class="link-sm">Open map →</a>` : ''}
          </div>
        </div>`
      ).join('')
    },
    shopping: { label: 'Shopping', render: () => {
      const s = PLAN.shopping || {};
      const districts = (s.districts || []).map(d =>
        `<div class="gem-card">
          ${img(d.img, d.name, '16/9', 'center')}
          <div class="gem-card__body">
            <div class="gem-card__name">${esc(d.name)}</div>
            <div class="gem-card__desc">${esc(d.desc)}</div>
          </div>
        </div>`
      ).join('');
      const brands = (s.brands || []).map(b => `<span class="chip">${esc(b)}</span>`).join('');
      const souvenirs = (s.souvenirs || []).map(x => `<li>${esc(x)}</li>`).join('');
      return `${districts}
        ${s.vatTips ? `<div class="prose prose--highlight" style="margin-top:16px"><strong>VAT:</strong> ${esc(s.vatTips.note)}<br><br>${esc(s.vatTips.saleSeasons)}<br><br>${esc(s.vatTips.shippingTip)}</div>` : ''}
        ${brands ? `<div class="chips" style="margin-top:16px">${brands}</div>` : ''}
        ${souvenirs ? `<ul style="margin-top:12px;font-size:12px;padding-left:20px">${souvenirs}</ul>` : ''}`;
    }},
    warnings: { label: 'Warnings', render: () =>
      (PLAN.warnings || []).slice(0, 4).map(w =>
        `<div class="warning-card"><div class="warning-card__title">${esc(w.title)}</div><div class="warning-card__desc">${esc(w.desc)}</div></div>`
      ).join('')
    },
    budget: { label: 'Budget', render: () => `<div class="budget-overview">${renderBudget()}</div>` },
    family: { label: 'Family', render: renderFamily },
    emergency: { label: 'Emergency', render: renderEmergency },
    local: { label: 'Local tips', render: renderLocalTips },
    cheat: { label: 'Cheat sheet', render: renderCheatSheet }
  };

  function renderMore() {
    const nav = Object.entries(MORE_SECTIONS).map(([id, sec]) =>
      `<button type="button" class="more-nav__btn ${id === activeMoreSection ? 'active' : ''}" onclick="setMoreSection('${id}')">${esc(sec.label)}</button>`
    ).join('');

    const section = MORE_SECTIONS[activeMoreSection] || MORE_SECTIONS.transport;
    const content = section.render();

    return `${renderChapterOpener('Essentials', 'More to Know', 'Transport, emergency, budget & beyond.')}
      <nav class="more-nav">${nav}</nav>
      <div class="more-section">${content}</div>`;
  }

  function setTab(tab) {
    activeTab = tab;
    detailView = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setDay(day) {
    activeDay = day;
    render();
  }

  function setMoreSection(section) {
    activeMoreSection = section;
    render();
    const nav = document.querySelector('.more-nav');
    if (nav) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setPackingSeason(season) {
    activePackingSeason = season;
    render();
  }

  function render() {
    const panels = {
      home: renderHome(),
      sights: renderAttractions(),
      stay: renderHotels(),
      eat: renderDining(),
      plan: renderPlan(),
      more: renderMore()
    };

    const tabs = [
      { id: 'home', icon: 'home', label: 'Home' },
      { id: 'sights', icon: 'camera', label: 'Sights' },
      { id: 'stay', icon: 'bed', label: 'Stay' },
      { id: 'eat', icon: 'utensils', label: 'Eat' },
      { id: 'plan', icon: 'map', label: 'Plan' },
      { id: 'more', icon: 'more', label: 'More' }
    ];

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <main class="panel">${panels[activeTab] || ''}</main>
      <nav class="bottom-nav" aria-label="Main navigation">${tabs.map(t =>
        `<button type="button" class="nav-item ${activeTab === t.id ? 'active' : ''}" onclick="setTab('${t.id}')" aria-current="${activeTab === t.id ? 'page' : 'false'}">${ICONS[t.icon] || ''}<span>${t.label}</span></button>`
      ).join('')}</nav>`;
  }

  function init() {
    if (typeof PLAN === 'undefined') {
      console.error('PLAN not loaded — include data/london.js before app.js');
      return;
    }
    if (global.DiscoverBrand) global.DiscoverBrand.apply(PLAN);
    else applyTheme(PLAN);
    render();
  }

  global.setTab = setTab;
  global.setDay = setDay;
  global.setMoreSection = setMoreSection;
  global.setPackingSeason = setPackingSeason;
  global.openDetail = openDetail;
  global.closeDetail = closeDetail;
  global.render = render;
  global.initApp = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
