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

  function t(key, varsOrFallback, maybeFallback) {
    if (global.I18n) return global.I18n.t(key, varsOrFallback, maybeFallback);
    if (typeof varsOrFallback === 'string' && maybeFallback === undefined) return varsOrFallback;
    return maybeFallback ?? key;
  }

  function txMeta(field, fallback) {
    return global.I18n ? global.I18n.metaField(field, fallback) : fallback;
  }

  function txEssential(key, field, fallback) {
    return global.I18n ? global.I18n.essentialField(key, field, fallback) : fallback;
  }

  function txArrival(step, field, fallback) {
    return global.I18n ? global.I18n.arrivalField(step, field, fallback) : fallback;
  }

  function txPacking(season, field, fallback) {
    return global.I18n ? global.I18n.packingField(season, field, fallback) : fallback;
  }

  function txPackingItems(season, fallbackItems) {
    return global.I18n ? global.I18n.packingItems(season, fallbackItems) : fallbackItems;
  }

  function txWelcome(field, fallback) {
    return global.I18n ? global.I18n.welcomeField(field, fallback) : fallback;
  }

  function txMonth(month) {
    return global.I18n ? global.I18n.monthName(month) : month;
  }

  function txWeatherRow(month, field, fallback) {
    return global.I18n ? global.I18n.weatherRowField(month, field, fallback) : fallback;
  }

  function txSweetSpot(fallback) {
    return global.I18n ? global.I18n.weatherSweetSpot(fallback) : fallback;
  }

  function txC(section, index, field, fallback) {
    return global.I18n ? global.I18n.content(section, index, field, fallback) : fallback;
  }

  function txPath(section, field, fallback) {
    return global.I18n ? global.I18n.contentPath(section, field, fallback) : fallback;
  }

  function txStop(dayIdx, stopIdx, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.itineraries?.[dayIdx]?.stops?.[stopIdx]?.[field] ?? fallback;
  }

  function txName(section, index, fallback) {
    return txC(section, index, 'name', fallback);
  }

  function txNearby(attrIdx, nearIdx, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.attractions?.[attrIdx]?.nearby?.[nearIdx]?.[field] ?? fallback;
  }

  function txDish(dIdx, dishIdx, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.dining?.[dIdx]?.dishes?.[dishIdx]?.[field] ?? fallback;
  }

  function txIdeal(hIdx, itemIdx, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.hotels?.[hIdx]?.idealFor?.[itemIdx] ?? fallback;
  }

  function txTransport(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.transport?.modes?.[i]?.[field] ?? fallback;
  }

  function txHospital(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.emergency?.hospitals?.[i]?.[field] ?? fallback;
  }

  function txEmbassy(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.emergency?.embassies?.[i]?.[field] ?? fallback;
  }

  function txMapMarker(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.maps?.overview?.markers?.[i]?.[field] ?? fallback;
  }

  function txFamilyRow(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.family?.rows?.[i]?.[field] ?? fallback;
  }

  function txMarkerType(type) {
    const map = {
      Attraction: 'legendSights',
      Hotel: 'legendHotels',
      Dining: 'legendDining',
      Park: 'legendParks',
      Sight: 'legendSights',
      Restaurant: 'legendDining',
      attraction: 'legendSights',
      hotel: 'legendHotels',
      dining: 'legendDining',
      park: 'legendParks',
      district: 'legendDistrict'
    };
    const key = map[type];
    return key ? t(key, type) : type;
  }

  function txCheatBlock(section, i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.cheatSheet?.[section]?.[i]?.[field] ?? fallback;
  }

  function txCheatQr(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.cheatSheet?.topQrCodes?.[i]?.[field] ?? fallback;
  }

  function txShoppingDistrict(i, field, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.shopping?.districts?.[i]?.[field] ?? fallback;
  }

  function txBrand(i, fallback) {
    if (!global.I18n?.isAr()) return fallback;
    return global.PLAN_AR?.shopping?.brands?.[i] ?? fallback;
  }

  const BUDGET_ROW_KEYS = {
    daily: 'rowDaily',
    accommodation: 'rowAccommodation',
    food: 'rowFood',
    transport: 'rowTransport',
    activities: 'rowActivities',
    extras: 'rowExtras'
  };

  const BUDGET_TIER_KEYS = {
    budget: 'tierBudget',
    mid: 'tierMid',
    luxury: 'tierLuxury'
  };

  let activeTab = 'home';
  let activeDay = 1;
  let activeMoreSection = 'transport';
  let activePackingSeason = 'spring';
  /** @type {{ kind: 'sight'|'stay'|'eat', index: number } | null} */
  let detailView = null;

  const DETAIL_BACK_LABEL = { sight: 'tabSights', stay: 'tabStay', eat: 'tabEat' };

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
    const tabKey = DETAIL_BACK_LABEL[kind];
    const backText = tabKey
      ? `← ${t('backTo', { label: t(tabKey) })}`
      : `← ${t('back', 'Back')}`;
    return `<div class="detail-page">
      <header class="detail-page__bar">
        <button type="button" class="detail-back" onclick="closeDetail()">${esc(backText)}</button>
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
      { value: String(s.attractions || ''), label: t('statSights', 'Sights') },
      { value: String(s.hotels || ''), label: t('statHotels', 'Hotels') },
      { value: String(s.dining || ''), label: t('statDining', 'Dining') },
      { value: String(s.days || ''), label: t('statDays', 'Days') },
      { value: String(s.qrCodes || ''), label: t('statQr', 'QR Codes') },
      { value: String(s.chapters || ''), label: t('statChapters', 'Chapters') }
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
        <span class="discover-wordmark">${esc(t('discover', 'Discover'))}</span>
        <span class="hero__badge">${esc(m.badge)} · ${esc(m.country)}</span>
        <h1 class="hero__title">${esc(m.city)}</h1>
        <p class="hero__subtitle">${esc(m.tagline)}</p>
      </div>
    </div>${statsHtml}`;
  }

  const ESSENTIAL_ICONS = {
    currency: 'currency',
    power: 'plug',
    sim: 'sim',
    language: 'language',
    tipping: 'card',
    emergency: 'emergency',
    tapWater: 'droplet',
    timezone: 'clock'
  };

  function renderHomeHero() {
    const m = meta();
    const stats = statsArray().slice(0, 4);
    const statsHtml = stats.map(s =>
      `<div class="home-hero__stat">
        <div class="home-hero__stat-value">${esc(s.value)}</div>
        <div class="home-hero__stat-label">${esc(s.label)}</div>
      </div>`
    ).join('');

    return `<header class="home-hero">
      <div class="home-hero__photo">
        ${img(theme().heroImage, m.city + ' skyline', '16/9', 'center 35%')}
      </div>
      <div class="home-hero__panel">
        <span class="home-hero__wordmark">${esc(t('discover', 'Discover'))}</span>
        <h1 class="home-hero__title">${esc(txMeta('city', m.city))}</h1>
        <p class="home-hero__tagline">${esc(txMeta('tagline', m.tagline))}</p>
        <p class="home-hero__edition">${esc(m.edition || '2026')} ${esc(t('edition', 'Edition'))} · ${esc(txMeta('country', m.country))}</p>
        ${statsHtml ? `<div class="home-hero__stats">${statsHtml}</div>` : ''}
      </div>
    </header>`;
  }

  function renderHomeSection(kicker, title, subtitle, bodyHtml) {
    return `<section class="home-section">
      <header class="home-section__head">
        <span class="home-section__kicker">${esc(kicker)}</span>
        <h2 class="home-section__title">${esc(title)}</h2>
        ${subtitle ? `<p class="home-section__sub">${esc(subtitle)}</p>` : ''}
      </header>
      <div class="home-section__body">${bodyHtml}</div>
    </section>`;
  }

  function renderHomeWeatherCards() {
    const rows = (PLAN.weatherTable?.rows || []).filter(r => HOME_WEATHER_MONTHS.includes(r.month));
    const cards = rows.map(r =>
      `<div class="home-weather-card">
        <div class="home-weather-card__month">${esc(txMonth(r.month))}</div>
        <div class="home-weather-card__row"><span>${esc(t('weatherTemp', 'Temp'))}</span><strong dir="ltr">${esc(txWeatherRow(r.month, 'avgTemp', r.avgTemp))}</strong></div>
        <div class="home-weather-card__row"><span>${esc(t('weatherRain', 'Rain'))}</span><strong dir="ltr">${esc(txWeatherRow(r.month, 'rain', r.rain))}</strong></div>
        <div class="home-weather-card__row"><span>${esc(t('weatherCrowds', 'Crowds'))}</span><strong>${esc(txWeatherRow(r.month, 'crowds', r.crowds))}</strong></div>
        <div class="home-weather-card__row"><span>${esc(t('weatherBestFor', 'Best for'))}</span><strong>${esc(txWeatherRow(r.month, 'recommend', r.recommend))}</strong></div>
      </div>`
    ).join('');
    const sweetSpot = txSweetSpot(PLAN.weatherTable?.sweetSpot);
    return `<div class="home-weather-grid">${cards}</div>
      ${sweetSpot ? `<div class="home-weather__spot">${esc(sweetSpot)}</div>` : ''}`;
  }

  function renderChapterOpener(num, title, subtitle, bg) {
    const image = bg || theme().heroImage;
    return `<header class="home-hero home-hero--chapter">
      <div class="home-hero__photo">
        ${img(image, title, '16/9', 'center 35%')}
      </div>
      <div class="home-hero__panel">
        <span class="home-hero__wordmark">${esc(t('discover', 'Discover'))}</span>
        <p class="home-hero__edition home-hero__chapter">${esc(num)}</p>
        <h2 class="home-hero__title">${esc(title)}</h2>
        ${subtitle ? `<p class="home-hero__tagline">${esc(subtitle)}</p>` : ''}
      </div>
    </header>`;
  }

  function renderCrowdBars(crowd) {
    if (!crowd) return '';
    const rows = [
      { key: 'morning', label: t('morning', 'Morning') },
      { key: 'afternoon', label: t('afternoon', 'Afternoon') },
      { key: 'evening', label: t('evening', 'Evening') }
    ];
    return `<div class="crowd-bars">
      <div class="crowd-bars__title">${esc(t('crowdLevels', 'Crowd levels'))}</div>
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
    const labels = {
      spring: t('seasonSpring', 'Spring'),
      summer: t('seasonSummer', 'Summer'),
      autumn: t('seasonAutumn', 'Autumn'),
      christmas: t('seasonChristmas', 'Christmas')
    };
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
      : `<div class="map-qr-row__map map-qr-row__map--empty">${iconWrap('map')}<span>${esc(t('openMapLink', 'Open map link below'))}</span></div>`;

    return `<div class="map-qr-row">
      ${mapEl}
      <div class="map-qr-row__qr">
        <img src="${esc(qr(mapUrl, 88))}" width="88" height="88" alt="QR code for ${esc(name)}">
        <span>${esc(t('scanMap', 'Scan for map'))}</span>
      </div>
    </div>`;
  }

  function renderAttractionListCard(a, index) {
    const hero = photoUrl(a.photos, 'hero', 'detail');
    const focal = a.photos?.heroPosition || 'center 30%';
    const tip = a.tip ? txC('attractions', index, 'tip', a.tip) : '';
    return `<button type="button" class="place-list-card" onclick="openDetail('sight', ${index})">
      <div class="place-list-card__media">${img(hero, txName('attractions', index, a.name), '16/9', focal, hero)}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(txName('attractions', index, a.name))}</h3>
        <div class="place-list-card__chips">
          <span class="chip chip--accent">${esc(txC('attractions', index, 'ticket', a.ticket))}</span>
          <span class="chip chip--parks">${esc(txC('attractions', index, 'avgVisit', a.avgVisit))}</span>
          <span class="chip chip--warn">${esc(txC('attractions', index, 'waitSummer', a.waitSummer))} ${esc(t('waitSuffix', 'wait'))}</span>
        </div>
        ${tip ? `<p class="place-list-card__teaser">${esc(shortText(tip, 1))}</p>` : ''}
        <span class="place-list-card__cta">${esc(t('viewGuide', 'View guide →'))}</span>
      </div>
    </button>`;
  }

  function renderAttractionDetail(a, index) {
    const i = Number(index);
    const photos = a.photos || {};
    const hero = photoUrl(photos, 'hero', 'detail');
    const focal = photos.heroPosition || 'center 30%';
    const detailUrl = photoUrl(photos, 'detail', 'hero');
    const spotUrl = photoUrl(photos, 'photoSpot', 'detail');
    const placeName = txName('attractions', i, a.name);
    const photoSpot = txC('attractions', i, 'photoSpot', a.photoSpot || a.name);
    const tip = a.tip ? txC('attractions', i, 'tip', a.tip) : '';
    const hours = txC('attractions', i, 'hours', a.hours);
    const ticket = txC('attractions', i, 'ticket', a.ticket);
    const tube = txC('attractions', i, 'tube', a.tube);
    const avgVisit = txC('attractions', i, 'avgVisit', a.avgVisit);
    const waitSummer = txC('attractions', i, 'waitSummer', a.waitSummer);
    const bookText = txC('attractions', i, 'bookText', a.bookText || 'Book');
    const didYouKnow = a.didYouKnow ? txC('attractions', i, 'didYouKnow', a.didYouKnow) : '';
    const localSecret = a.localSecret ? txC('attractions', i, 'localSecret', a.localSecret) : '';
    const nearbyCafes = a.nearbyCafes ? txC('attractions', i, 'nearbyCafes', a.nearbyCafes) : '';
    const nearbyRestaurants = a.nearbyRestaurants ? txC('attractions', i, 'nearbyRestaurants', a.nearbyRestaurants) : '';
    const nearbyTube = a.nearbyTube ? txC('attractions', i, 'nearbyTube', a.nearbyTube) : '';

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

    const nearbyTop = (a.nearby || []).slice(0, 5).map((n, ni) =>
      `<div class="nearby-item">
        <span>${esc(txNearby(i, ni, 'name', n.name))}</span>
        <span class="nearby-item__walk">${esc(txNearby(i, ni, 'walk', n.walk))}</span>
      </div>`
    ).join('');

    const eatNearby = [nearbyCafes, nearbyRestaurants].filter(Boolean).join(' · ');
    const gettingThere = nearbyTube || a.nearbyTube || '';
    const nearbyPractical = [
      eatNearby ? `<div class="nearby-block"><div class="nearby-block__label">${esc(t('labelEatNearby', 'Eat nearby'))}</div>${esc(eatNearby)}</div>` : '',
      gettingThere ? `<div class="nearby-block"><div class="nearby-block__label">${esc(t('labelGettingThere', 'Getting there'))}</div>${esc(gettingThere)}</div>` : ''
    ].join('');

    const insider = [didYouKnow, localSecret].filter(Boolean).join(' ');
    const insiderBox = insider
      ? `<div class="box box--insider"><div class="box__title">${iconWrap('lightbulb')} ${esc(t('labelInsider', 'Insider'))}</div>${esc(insider)}</div>`
      : '';

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(placeName)}</h1>
      ${img(hero, placeName, '16/9', focal, hero)}
      ${caption(photoSpot, a.lens ? `${t('labelLens', 'Lens')}: ${a.lens}` : '')}
      ${photoGrid}
      ${renderHighlights([
        { label: t('labelTicket', 'Ticket'), value: ticket },
        { label: t('labelTube', 'Tube'), value: tube?.split('·')[0]?.trim() || tube },
        { label: t('labelVisitTime', 'Visit time'), value: avgVisit },
        { label: t('labelSummerWait', 'Summer wait'), value: waitSummer }
      ])}
      <div class="chips">
        <span class="chip chip--accent">${esc(ticket)}</span>
        <span class="chip chip--tube">${esc(tube)}</span>
        <span class="chip">${esc(hours)}</span>
        <span class="chip chip--warn">${esc(t('labelSummerWait', 'Summer wait'))}: ${esc(waitSummer)}</span>
        <span class="chip chip--parks">${esc(t('visitPrefix', 'Visit'))}: ${esc(avgVisit)}</span>
      </div>
      ${renderCrowdBars(a.crowd)}
      ${tip ? `<div class="tip-inline"><strong>${esc(t('labelTip', 'Tip'))}:</strong> ${esc(tip)}</div>` : ''}
      ${nearbyTop ? `<div class="nearby-list"><div class="nearby-list__title">${esc(t('labelNearbyTop5', 'Nearby — top 5'))}</div>${nearbyTop}</div>` : ''}
      ${nearbyPractical}
      ${insiderBox}
      ${renderMapQr(placeName, a.mapUrl, a.lat, a.lng)}
      ${actionButtons(a.mapUrl, a.bookUrl, bookText)}
    </article>`;
  }

  function renderHome() {
    const m = meta();
    const w = PLAN.welcome || {};
    const essentials = PLAN.essentials || {};
    const letter = shortText(txWelcome('editorLetter', w.editorLetter), 2);

    const essentialCards = Object.entries(essentials).map(([key, e]) =>
      `<div class="home-essential">
        <div class="home-essential__icon">${iconWrap(ESSENTIAL_ICONS[key] || 'pin')}</div>
        <div class="home-essential__value">${esc(txEssential(key, 'label', e.label))}</div>
        <div class="home-essential__note">${esc(txEssential(key, 'note', e.note))}</div>
      </div>`
    ).join('');

    const arrival = (PLAN.arrival || []).map(s =>
      `<div class="home-arrival-card">
        <span class="home-arrival-card__step">${esc(s.step)}</span>
        <div class="home-arrival-card__title">${esc(txArrival(s.step, 'title', s.title))}</div>
        <div class="home-arrival-card__desc">${esc(txArrival(s.step, 'desc', s.desc))}</div>
      </div>`
    ).join('');

    const packing = PLAN.packing || {};
    const seasons = Object.keys(packing);
    const packingTabs = seasons.map(k =>
      `<button type="button" class="home-packing__tab ${k === activePackingSeason ? 'active' : ''}" onclick="setPackingSeason('${k}')">${esc(txPacking(k, 'months', packing[k].months || k))}</button>`
    ).join('');

    const pk = packing[activePackingSeason] || packing[seasons[0]] || {};
    const packingItemsList = txPackingItems(activePackingSeason, pk.items || []);
    const packingList = packingItemsList.map(i => `<li class="home-packing__item">${esc(i)}</li>`).join('');

    const packingBody = `<div class="home-packing">
      <div class="home-packing__tabs">${packingTabs}</div>
      <div class="home-packing__panel">
        <div class="home-packing__temp" dir="ltr">${esc(txPacking(activePackingSeason, 'temp', pk.temp))}</div>
        <ul class="home-packing__list">${packingList}</ul>
      </div>
    </div>`;

    const letterBody = `<blockquote class="home-letter">
      <span class="home-letter__kicker">${esc(t('homeEditorKicker', 'From the Editor'))} · ${esc(m.edition || '2026')}</span>
      <p class="home-letter__body">${esc(letter)}</p>
    </blockquote>`;

    const packingSeasonLabel = txPacking(activePackingSeason, 'months', packing[activePackingSeason]?.months || 'Spring');

    return `<div class="home">
      ${renderHomeHero()}
      ${renderHomeSection(t('homeWelcomeKicker', 'Welcome'), t('homeWelcomeTitle', 'From the Editor'), t('homeWelcomeSub', 'Your pocket companion to London.'), letterBody)}
      ${renderHomeSection(t('homeEssentialsKicker', 'Before you land'), t('homeEssentialsTitle', 'Essentials'), t('homeEssentialsSub', 'Everything you need before touchdown.'), `<div class="home-essentials">${essentialCards}</div>`)}
      ${renderHomeSection(t('homeArrivalKicker', 'Day one'), t('homeArrivalTitle', 'Arrival playbook'), t('homeArrivalSub', 'Seven steps from touchdown to tea.'), `<div class="home-arrival">${arrival}</div>`)}
      ${renderHomeSection(t('homePackingKicker', 'What to pack'), t('homePackingTitle', 'Packing'), t('homePackingSub', { season: packingSeasonLabel }, `${packingSeasonLabel} checklist.`), packingBody)}
      ${renderHomeSection(t('homeWeatherKicker', 'When to go'), t('homeWeatherTitle', 'Best months to visit'), t('homeWeatherSub', 'Peak season at a glance — full table in More → Weather.'), renderHomeWeatherCards())}
    </div>`;
  }

  function renderAttractions() {
    const list = PLAN.attractions || [];
    if (detailView?.kind === 'sight') {
      const a = list[detailView.index];
      if (a) return renderDetailShell('sight', renderAttractionDetail(a, detailView.index));
    }
    const opener = renderChapterOpener(
      t('chapter01', 'Chapter 01'),
      t('sightsTitle', 'Must-See Sights'),
      t('sightsSub', 'Tap any sight for the full guide.'),
      photoUrl(list[0]?.photos, 'hero', 'detail')
    );
    return opener + `<div class="place-list">${list.map((a, i) => renderAttractionListCard(a, i)).join('')}</div>`;
  }

  function renderHotelGallery(photos) {
    if (!photos) return '';
    const hero = photoUrl(photos, 'exterior', 'room');
    const labels = {
      exterior: t('labelExterior', 'Exterior'),
      room: t('labelRoom', 'Room'),
      restaurant: t('labelRestaurant', 'Restaurant'),
      view: t('labelView', 'View')
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
    const category = txC('hotels', index, 'category', h.category);
    const room = txC('hotels', index, 'room', h.room);
    const tube = txC('hotels', index, 'tube', h.tube);
    return `<button type="button" class="place-list-card" onclick="openDetail('stay', ${index})">
      <div class="place-list-card__media">${cover ? img(cover, txName('hotels', index, h.name), '16/9', 'center', cover) : ''}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(txName('hotels', index, h.name))}</h3>
        <div class="place-list-card__chips">
          <span class="chip chip--gold">${esc(category)}</span>
          <span class="chip chip--accent">${esc(h.price)}</span>
          <span class="chip">★ ${esc(h.rating)}</span>
        </div>
        <p class="place-list-card__meta">${esc(tube?.split('·')[0]?.trim() || tube)} · ${esc(room)}</p>
        <span class="place-list-card__cta">${esc(t('viewHotel', 'View hotel →'))}</span>
      </div>
    </button>`;
  }

  function renderHotelDetail(h, index) {
    const i = Number(index);
    const hotelName = txName('hotels', i, h.name);
    const ideal = (h.idealFor || []).map((item, ii) => `<span class="chip chip--ok">${esc(txIdeal(i, ii, item))}</span>`).join('');
    const cover = photoUrl(h.photos, 'exterior', 'room');
    const category = txC('hotels', i, 'category', h.category);
    const room = txC('hotels', i, 'room', h.room);
    const tube = txC('hotels', i, 'tube', h.tube);
    const address = txC('hotels', i, 'address', h.address);
    const airport = txC('hotels', i, 'airport', h.airport);
    const nearbyAttractions = txC('hotels', i, 'nearbyAttractions', h.nearbyAttractions);
    const cancellation = txC('hotels', i, 'cancellation', h.cancellation);
    const tip = h.tip ? txC('hotels', i, 'tips', h.tip) : '';

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(hotelName)}</h1>
      ${cover ? img(cover, hotelName, '16/9', 'center', cover) : ''}
      ${renderHighlights([
        { label: t('labelPrice', 'Price'), value: h.price },
        { label: t('labelRating', 'Rating'), value: `★ ${h.rating}` },
        { label: t('labelTube', 'Tube'), value: tube?.split('·')[0]?.trim() || tube },
        { label: t('labelCategory', 'Category'), value: category }
      ])}
      <div class="chips">
        <span class="chip chip--gold">${esc(category)}</span>
        <span class="chip chip--accent">${esc(h.price)}</span>
        <span class="chip">★ ${esc(h.rating)} · Google ${esc(h.googleRating)}</span>
      </div>
      ${renderHotelGallery(h.photos)}
      <div class="chips">
        <span class="chip">${esc(room)}</span>
        <span class="chip chip--tube">${esc(tube)}</span>
        <span class="chip">${esc(cancellation)}</span>
      </div>
      <div class="nearby-block"><div class="nearby-block__label">${esc(t('labelAddress', 'Address'))}</div>${esc(address)}</div>
      <div class="nearby-block"><div class="nearby-block__label">${esc(t('labelAirport', 'Airport'))}</div>${esc(airport)}</div>
      <div class="nearby-block"><div class="nearby-block__label">${esc(t('labelNearby', 'Nearby'))}</div>${esc(nearbyAttractions)}</div>
      ${ideal ? `<div class="chips">${ideal}</div>` : ''}
      ${tip ? `<div class="tip-inline"><strong>${esc(t('labelTip', 'Tip'))}:</strong> ${esc(tip)}</div>` : ''}
      ${renderMapQr(hotelName, h.mapUrl, h.lat, h.lng)}
      ${actionButtons(h.mapUrl, h.bookUrl, t('book', 'Book'))}
    </article>`;
  }

  function renderHotels() {
    const list = PLAN.hotels || [];
    if (detailView?.kind === 'stay') {
      const h = list[detailView.index];
      if (h) return renderDetailShell('stay', renderHotelDetail(h, detailView.index));
    }
    const opener = renderChapterOpener(t('chapter02', 'Chapter 02'), t('stayTitle', 'Where to Stay'), t('staySub', 'Tap a hotel for rooms, tips and booking.'), list[0]?.photos?.exterior);
    return opener + `<div class="place-list">${list.map((h, i) => renderHotelListCard(h, i)).join('')}</div>`;
  }

  function renderDiningListCard(d, index) {
    const signature = photoUrl(d.photos, 'signature', 'hero');
    const category = txC('dining', index, 'category', d.category);
    const famous = d.famous ? txC('dining', index, 'famous', d.famous) : '';
    const wait = txC('dining', index, 'wait', d.wait);
    return `<button type="button" class="place-list-card" onclick="openDetail('eat', ${index})">
      <div class="place-list-card__media">${signature ? img(signature, d.name, '16/9', 'center', signature) : ''}</div>
      <div class="place-list-card__body">
        <h3 class="place-list-card__title">${esc(txName('dining', index, d.name))}</h3>
        <div class="place-list-card__chips">
          <span class="chip">${esc(category)}</span>
          <span class="chip chip--accent">${esc(d.price)}</span>
          <span class="chip chip--warn">${esc(wait)}</span>
        </div>
        ${famous ? `<p class="place-list-card__teaser">${esc(shortText(famous, 1))}</p>` : ''}
        <span class="place-list-card__cta">${esc(t('viewMenu', 'View menu →'))}</span>
      </div>
    </button>`;
  }

  function renderDiningDetail(d, index) {
    const i = Number(index);
    const category = txC('dining', i, 'category', d.category);
    const famous = txC('dining', i, 'famous', d.famous);
    const wait = txC('dining', i, 'wait', d.wait);
    const tip = d.tip ? txC('dining', i, 'menu', d.tip) : '';
    const dishes = (d.dishes || []).slice(0, 3);
    const signature = photoUrl(d.photos, 'signature', 'hero');
    const dishGrid = dishes.map((dish, di) =>
      `<div class="dish-card">
        ${img(dish.img, txDish(i, di, 'name', dish.name), '4/3', 'center', signature)}
        <div class="dish-card__body">
          <div class="dish-card__name">${esc(txDish(i, di, 'name', dish.name))}</div>
          <div class="dish-card__desc">${esc(txDish(i, di, 'desc', dish.desc))}</div>
        </div>
      </div>`
    ).join('');

    const restaurantName = txName('dining', i, d.name);

    return `<article class="magazine-page detail-page__content">
      <h1 class="page-title">${esc(restaurantName)}</h1>
      ${signature ? img(signature, famous || restaurantName, '16/9', 'center', signature) : ''}
      ${renderHighlights([
        { label: t('labelPrice', 'Price'), value: d.price },
        { label: t('labelWait', 'Wait'), value: wait },
        { label: t('labelCategory', 'Category'), value: category },
        { label: t('labelReserve', 'Reserve'), value: d.michelin && d.michelin !== '—' ? d.michelin : t('walkInOk', 'Walk-in OK') }
      ])}
      <div class="chips">
        <span class="chip">${esc(category)}</span>
        <span class="chip chip--accent">${esc(d.price)}</span>
        ${d.michelin && d.michelin !== '—' ? `<span class="chip chip--gold">${esc(d.michelin)}</span>` : ''}
        <span class="chip chip--warn">${esc(wait)}</span>
      </div>
      <div class="nearby-block"><div class="nearby-block__label">${esc(t('labelFamousFor', 'Famous for'))}</div>${esc(famous)}</div>
      ${tip ? `<div class="tip-inline"><strong>${esc(t('labelTip', 'Tip'))}:</strong> ${esc(tip)}</div>` : ''}
      ${dishes.length ? `<div class="dish-grid"><div class="nearby-block__label">${esc(t('labelMustTry', 'Must try'))}</div>${dishGrid}</div>` : ''}
      ${renderMapQr(restaurantName, d.mapUrl, d.lat, d.lng)}
      ${actionButtons(d.mapUrl, d.bookUrl, t('reserve', 'Reserve'))}
    </article>`;
  }

  function renderDining() {
    const list = PLAN.dining || [];
    if (detailView?.kind === 'eat') {
      const d = list[detailView.index];
      if (d) return renderDetailShell('eat', renderDiningDetail(d, detailView.index));
    }
    const opener = renderChapterOpener(t('chapter03', 'Chapter 03'), t('eatTitle', 'Where to Eat'), t('eatSub', 'Tap a restaurant for dishes and booking.'), list[0]?.photos?.signature);
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
    if (!day) return renderChapterOpener(t('chapter04', 'Chapter 04'), t('planTitle', 'Your Itinerary'), t('planEmpty', 'No plans yet.'));

    const dayIdx = days.findIndex(d => d.day === day.day);
    const dayTitle = txC('itineraries', dayIdx, 'title', day.title);
    const routePreview = txC('itineraries', dayIdx, 'routePreview', day.routePreview || '');

    const opener = renderChapterOpener(t('chapter04', 'Chapter 04'), t('planTitle', 'Your Itinerary'), t('planSub', 'Hour-by-hour routes, ready to follow.'), day.photos?.[0]);

    const dayTabs = days.map((d, di) =>
      `<button type="button" class="day-tab ${d.day === activeDay ? 'active' : ''}" onclick="setDay(${d.day})">
        <div class="day-tab__num">${esc(t('dayPrefix', 'Day'))} ${d.day}</div>
        <div class="day-tab__title">${esc(txC('itineraries', di, 'title', d.title))}</div>
      </button>`
    ).join('');

    const photoStrip = (day.photos || []).slice(0, 4).map(url =>
      `<div class="day-strip__item">${img(url, dayTitle, '4/3', 'center 35%')}</div>`
    ).join('');

    const routeBanner = `<div class="route-banner">
      <div class="route-banner__info">
        <h3>${esc(t('dayPrefix', 'Day'))} ${day.day}: ${esc(dayTitle)}</h3>
        <p>${esc(routePreview)}</p>
      </div>
      <div class="map-qr-row__qr">
        <img src="${esc(qr(day.mapUrl, 72))}" width="72" height="72" alt="Route QR">
        <span>${esc(t('fullRoute', 'Full route'))}</span>
      </div>
    </div>`;

    const stops = (day.stops || []).map((stop, si) => {
      const cls = timeClass(stop.timeOfDay);
      const stopName = txStop(dayIdx, si, 'name', stop.name);
      const photo = findStopPhoto(stop.name);
      const transitIcon = ICONS[stop.icon] || ICONS.walk;
      const desc = txStop(dayIdx, si, 'desc', stop.desc);
      const transit = txStop(dayIdx, si, 'transit', stop.transit);
      return `<div class="stop">
        <time class="stop__time">${esc(stop.time)}</time>
        <div class="stop__card ${cls}">
          ${photo ? `<div class="stop__photo">${img(photo, stopName, '21/9', 'center 30%')}</div>` : ''}
          <div class="stop__body">
            <div class="stop__name">${esc(stopName)}</div>
            <div class="stop__desc">${esc(desc)}</div>
            <div class="stop__footer">
              <span class="stop__transit">${transitIcon} ${esc(transit)}</span>
              <a class="stop__map" href="${esc(stop.mapUrl)}" target="_blank" rel="noopener">${ICONS.pin} ${esc(t('map', 'Map'))}</a>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    return `${opener}
      <div class="day-tabs">${dayTabs}</div>
      <div class="day-strip">${photoStrip}</div>
      ${routeBanner}
      <div class="timeline">${stops}</div>`;
  }

  function renderFullWeatherTable() {
    const rows = (PLAN.weatherTable?.rows || []).map(r =>
      `<tr>
        <td><strong>${esc(txMonth(r.month))}</strong></td>
        <td dir="ltr">${esc(txWeatherRow(r.month, 'avgTemp', r.avgTemp))}</td>
        <td dir="ltr">${esc(txWeatherRow(r.month, 'rain', r.rain))}</td>
        <td dir="ltr">${esc(txWeatherRow(r.month, 'sunset', r.sunset))}</td>
        <td>${esc(txWeatherRow(r.month, 'crowds', r.crowds))}</td>
        <td>${esc(txWeatherRow(r.month, 'recommend', r.recommend))}</td>
      </tr>`
    ).join('');
    return `<div class="weather-table-wrap">
      <table class="weather-table">
        <thead><tr>
          <th>${esc(t('labelMonth', 'Month'))}</th>
          <th>${esc(t('weatherTemp', 'Temp'))}</th>
          <th>${esc(t('weatherRain', 'Rain'))}</th>
          <th>${esc(t('labelSunset', 'Sunset'))}</th>
          <th>${esc(t('weatherCrowds', 'Crowds'))}</th>
          <th>${esc(t('weatherBestFor', 'Best for'))}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  function renderLocalTips() {
    const phrases = (PLAN.phrases || []).map((p, i) =>
      `<li class="phrase-item"><div class="phrase-item__english">${esc(txC('phrases', i, 'english', p.english))}</div><div class="phrase-item__use">${esc(txC('phrases', i, 'use', p.use))}</div></li>`
    ).join('');
    const etiquette = (PLAN.etiquette || []).map((e, i) =>
      `<li class="etiquette-item"><div class="etiquette-item__rule">${esc(txC('etiquette', i, 'rule', e.rule))}</div><div class="etiquette-item__desc">${esc(txC('etiquette', i, 'desc', e.desc))}</div></li>`
    ).join('');
    return `<h3 style="font-size:13px;margin-bottom:10px">${esc(t('usefulPhrases', 'Useful phrases'))}</h3>
      <ul class="phrase-list">${phrases}</ul>
      <h3 style="font-size:13px;margin:24px 0 10px">${esc(t('localEtiquette', 'Local etiquette'))}</h3>
      <ul class="etiquette-list">${etiquette}</ul>`;
  }

  function renderWeatherCards(items, section) {
    return (items || []).map((item, i) =>
      `<div class="weather-card">
        ${item.img ? img(item.img, txC(section, i, 'name', item.name), '16/9', 'center') : ''}
        <div class="weather-card__body">
          <div class="weather-card__name">${esc(txC(section, i, 'name', item.name))}</div>
          ${item.address ? `<div class="weather-card__addr">${esc(txC(section, i, 'address', item.address))}</div>` : ''}
          <div class="weather-card__desc">${esc(txC(section, i, 'desc', item.desc))}</div>
          ${item.mapUrl ? `<a href="${esc(item.mapUrl)}" target="_blank" rel="noopener" class="link-sm">${esc(t('openMap', 'Open map →'))}</a>` : ''}
        </div>
      </div>`
    ).join('');
  }

  function renderTransport() {
    const transport = PLAN.transport || {};
    const modes = (transport.modes || []).map((m, i) => {
      const iconCls = ['tube', 'boat', 'walk'].includes(m.icon) ? ` transport-card__icon--${m.icon}` : '';
      const desc = global.PLAN_AR?.transport?.modes?.[i]?.desc ?? m.desc;
      return `<div class="transport-card">
        <div class="transport-card__icon${iconCls}">${icon(m.icon) || icon('train')}</div>
        <div class="transport-card__name">${esc(txTransport(i, 'name', m.name))}</div>
        <div class="transport-card__price">${esc(m.price)}</div>
        <div class="transport-card__desc">${esc(txTransport(i, 'desc', desc))}</div>
      </div>`;
    }).join('');

    const oyster = (transport.oysterTips || []).map((o, i) => {
      const title = global.PLAN_AR?.transport?.oysterTips?.[i]?.title ?? o.title;
      const desc = global.PLAN_AR?.transport?.oysterTips?.[i]?.desc ?? o.desc;
      return `<li><strong>${esc(title)}</strong>${esc(desc)}</li>`;
    }).join('');

    const exitTip = global.PLAN_AR?.transport?.exit6Tip ?? transport.exit6Tip;

    return `<div class="transport-grid">${modes}</div>
      ${exitTip ? `<div class="transport-tip"><strong>${esc(t('labelProTip', 'Pro tip'))}:</strong> ${esc(exitTip)}</div>` : ''}
      <h3 style="font-size:13px;margin-bottom:10px">${esc(t('labelPaymentTips', 'Payment tips'))}</h3>
      <ul class="oyster-list">${oyster}</ul>`;
  }

  function renderMaps() {
    const captionText = txPath('maps', 'caption', PLAN.maps?.overview?.caption || '');
    const markers = PLAN.maps?.overview?.markers || [];
    const center = markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 51.5074, lng: -0.1278 };
    const mapImg = staticMap(center.lat, center.lng, 400, 220);

    const legend = `<div class="map-legend">
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--attraction"></span> ${esc(t('legendSights', 'Sights'))}</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--hotel"></span> ${esc(t('legendHotels', 'Hotels'))}</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--dining"></span> ${esc(t('legendDining', 'Dining'))}</span>
      <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--park"></span> ${esc(t('legendParks', 'Parks'))}</span>
    </div>`;

    const list = markers.slice(0, 12).map((m, i) =>
      `<div class="nearby-item"><span>${esc(txMapMarker(i, 'name', m.name))}</span><span class="chip" style="font-size:9px">${esc(txMarkerType(m.type))}</span></div>`
    ).join('');

    return `<p class="prose">${esc(captionText)}</p>
      ${mapImg ? `<img src="${esc(mapImg)}" alt="Overview map" style="width:100%;border-radius:12px;margin:12px 0" loading="lazy">` : ''}
      ${legend}
      <div class="nearby-list"><div class="nearby-list__title">${esc(t('labelKeyLocations', 'Key locations'))}</div>${list}</div>`;
  }

  function renderBudget() {
    const b = PLAN.budget || {};
    return ['budget', 'mid', 'luxury'].map(tier => {
      const data = b[tier];
      if (!data) return '';
      const label = t(BUDGET_TIER_KEYS[tier], tier);
      const rows = ['daily', 'accommodation', 'food', 'transport', 'activities', 'extras']
        .filter(k => data[k])
        .map(k => {
          const val = global.PLAN_AR?.budget?.[tier]?.[k] ?? data[k];
          const safeVal = (typeof val === 'string' && val.includes('MYMEMORY WARNING')) ? data[k] : val;
          return `<div class="budget-row"><span>${esc(t(BUDGET_ROW_KEYS[k], k))}</span><span class="budget-row__val">${esc(safeVal)}</span></div>`;
        })
        .join('');
      const tipRaw = global.PLAN_AR?.budget?.[tier]?.tip ?? data.tip;
      const tip = tipRaw && !String(tipRaw).includes('MYMEMORY WARNING') ? tipRaw : data.tip;
      return `<div class="budget-overview__card">
        <h3>${esc(label)}</h3>
        ${rows}
        ${tip ? `<p class="prose" style="margin-top:10px">${esc(tip)}</p>` : ''}
      </div>`;
    }).join('');
  }

  function renderFamily() {
    const f = PLAN.family || {};
    const rows = (f.rows || []).map((r, i) => {
      const attraction = txFamilyRow(i, 'attraction', r.attraction);
      const desc = txFamilyRow(i, 'desc', r.desc);
      return `<tr>
        <td><strong>${esc(attraction)}</strong><br><span style="color:var(--text-muted)">${esc(desc)}</span></td>
        <td class="${r.goodForKids ? 'family-yes' : 'family-no'}">${r.goodForKids ? '✓' : '—'}</td>
        <td class="${r.stroller ? 'family-yes' : 'family-no'}">${r.stroller ? '✓' : '—'}</td>
        <td class="${r.babyChange ? 'family-yes' : 'family-no'}">${r.babyChange ? '✓' : '—'}</td>
        <td class="${r.familyTicket ? 'family-yes' : 'family-no'}">${r.familyTicket ? '✓' : '—'}</td>
      </tr>`;
    }).join('');

    const tip = global.PLAN_AR?.family?.tip ?? f.tip;

    return `${tip ? `<div class="prose prose--highlight">${esc(tip)}</div>` : ''}
      <table class="family-table">
        <thead><tr>
          <th>${esc(t('labelAttraction', 'Attraction'))}</th>
          <th>${esc(t('labelKids', 'Kids'))}</th>
          <th>${esc(t('labelStroller', 'Stroller'))}</th>
          <th>${esc(t('labelBaby', 'Baby'))}</th>
          <th>${esc(t('labelFamilyPrice', 'Family £'))}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderEmergency() {
    const e = PLAN.emergency || {};
    const numbers = (e.numbers || []).map((n, i) => {
      const label = global.PLAN_AR?.emergency?.numbers?.[i]?.label ?? n.label;
      const desc = global.PLAN_AR?.emergency?.numbers?.[i]?.desc ?? n.desc;
      return `<div class="emergency-card">
        <div class="emergency-card__icon">${icon(n.icon) || ICONS.emergency}</div>
        <div class="emergency-card__label">${esc(label)}</div>
        <div class="emergency-card__desc">${esc(desc)}</div>
      </div>`;
    }).join('');

    const hospitals = (e.hospitals || []).map((h, i) =>
      `<li>
        <span class="emergency-list__icon">${icon(h.icon) || ICONS.hospital}</span>
        <span><strong>${esc(txHospital(i, 'name', h.name))}</strong><br>${esc(txHospital(i, 'address', h.address))}</span>
        <a href="${esc(h.mapUrl)}" target="_blank" rel="noopener" class="btn btn--ghost" style="min-height:36px;padding:0 10px;font-size:10px">${esc(t('map', 'Map'))}</a>
      </li>`
    ).join('');

    const embassies = (e.embassies || []).map((em, i) =>
      `<li>
        <span class="emergency-list__icon">${icon(em.icon) || ICONS.embassy}</span>
        <span><strong>${esc(txEmbassy(i, 'country', em.country))}</strong><br>${esc(txEmbassy(i, 'address', em.address))}</span>
        <a href="${esc(em.mapUrl)}" target="_blank" rel="noopener" class="btn btn--ghost" style="min-height:36px;padding:0 10px;font-size:10px">${esc(t('map', 'Map'))}</a>
      </li>`
    ).join('');

    const lostPassport = global.PLAN_AR?.emergency?.lostPassport ?? e.lostPassport;

    return `<div class="emergency-grid">${numbers}</div>
      ${lostPassport ? `<div class="warning-card"><div class="warning-card__title">${esc(t('labelLostPassport', 'Lost passport'))}</div><div class="warning-card__desc">${esc(lostPassport)}</div></div>` : ''}
      <h3 style="font-size:13px;margin:16px 0 8px">${esc(t('labelHospitals', 'Hospitals'))}</h3>
      <ul class="emergency-list">${hospitals}</ul>
      <h3 style="font-size:13px;margin:16px 0 8px">${esc(t('labelEmbassies', 'Embassies'))}</h3>
      <ul class="emergency-list">${embassies}</ul>`;
  }

  function renderCheatSheet() {
    const cs = PLAN.cheatSheet || {};
    const csTitle = txPath('cheatSheet', 'title', cs.title || t('cheatSheetTitle', 'Cheat Sheet'));
    const csSubtitle = txPath('cheatSheet', 'subtitle', cs.subtitle || '');
    const blockTitles = {
      emergency: t('cheatEmergency', 'Emergency'),
      transport: t('cheatTransport', 'Transport'),
      money: t('cheatMoney', 'Money'),
      apps: t('cheatApps', 'Apps')
    };
    const block = (key, rows) => {
      if (!rows?.length) return '';
      return `<div class="cheat-sheet__block"><h4>${esc(blockTitles[key] || key)}</h4>
        ${rows.map((r, i) => {
          const left = r.label != null
            ? txCheatBlock(key, i, 'label', r.label)
            : txCheatBlock(key, i, 'name', r.name);
          const right = r.value != null
            ? txCheatBlock(key, i, 'value', r.value)
            : txCheatBlock(key, i, 'use', r.use);
          return `<div class="cheat-sheet__row"><span>${esc(left)}</span><strong>${esc(right)}</strong></div>`;
        }).join('')}
      </div>`;
    };

    const qrGrid = (cs.topQrCodes || []).map((q, i) =>
      `<div class="cheat-sheet__qr-item">
        <img src="${esc(qr(q.mapUrl, 56))}" alt="">
        <span>${esc(txCheatQr(i, 'name', q.name))}</span>
      </div>`
    ).join('');

    return `<div class="cheat-sheet" id="cheat-sheet-print">
      <div class="cheat-sheet__header">
        <div class="cheat-sheet__title">${esc(csTitle)}</div>
        <div class="cheat-sheet__subtitle">${esc(csSubtitle)}</div>
      </div>
      <div class="cheat-sheet__grid">
        ${block('emergency', cs.emergency)}
        ${block('transport', cs.transport)}
        ${block('money', cs.money)}
        ${block('apps', cs.apps)}
      </div>
      ${qrGrid ? `<div class="cheat-sheet__qr-grid">${qrGrid}</div>` : ''}
    </div>`;
  }

  const MORE_SECTIONS = {
    transport: { labelKey: 'moreTransport', label: 'Transport', render: renderTransport },
    maps: { labelKey: 'moreMaps', label: 'Maps', render: renderMaps },
    weather: { labelKey: 'moreWeather', label: 'Weather', render: () =>
      `${renderFullWeatherTable()}
       <h3 style="font-size:13px;margin:24px 0 10px">${esc(t('labelRainyDay', 'Rainy day'))}</h3><div class="weather-cards">${renderWeatherCards(PLAN.rainyDay, 'rainyDay')}</div>
       <h3 style="font-size:13px;margin:24px 0 10px">${esc(t('labelSunnyDay', 'Sunny day'))}</h3><div class="weather-cards">${renderWeatherCards(PLAN.sunnyDay, 'sunnyDay')}</div>`
    },
    gems: { labelKey: 'moreGems', label: 'Gems', render: () =>
      (PLAN.hiddenGems || []).map((g, i) =>
        `<div class="gem-card">
          ${img(g.img, txName('hiddenGems', i, g.name), '16/9', 'center')}
          <div class="gem-card__body">
            <div class="gem-card__name">${esc(txName('hiddenGems', i, g.name))}</div>
            <div class="gem-card__desc">${esc(txC('hiddenGems', i, 'desc', g.desc))}</div>
            ${g.mapUrl ? `<a href="${esc(g.mapUrl)}" target="_blank" rel="noopener" class="link-sm">${esc(t('openMap', 'Open map →'))}</a>` : ''}
          </div>
        </div>`
      ).join('')
    },
    shopping: { labelKey: 'moreShopping', label: 'Shopping', render: () => {
      const s = PLAN.shopping || {};
      const districts = (s.districts || []).map((d, i) => {
        const name = txShoppingDistrict(i, 'name', d.name);
        const desc = txShoppingDistrict(i, 'desc', d.desc);
        return `<div class="gem-card">
          ${img(d.img, name, '16/9', 'center')}
          <div class="gem-card__body">
            <div class="gem-card__name">${esc(name)}</div>
            <div class="gem-card__desc">${esc(desc)}</div>
          </div>
        </div>`;
      }).join('');
      const vat = s.vatTips || {};
      const vatNote = global.PLAN_AR?.shopping?.vatTips?.note ?? vat.note;
      const vatSales = global.PLAN_AR?.shopping?.vatTips?.saleSeasons ?? vat.saleSeasons;
      const vatShip = global.PLAN_AR?.shopping?.vatTips?.shippingTip ?? vat.shippingTip;
      const safe = v => (typeof v === 'string' && v.includes('MYMEMORY WARNING')) ? '' : v;
      const brands = (s.brands || []).map((b, i) => `<span class="chip">${esc(txBrand(i, b))}</span>`).join('');
      const souvenirs = (s.souvenirs || []).map((x, i) => {
        const ar = global.PLAN_AR?.shopping?.souvenirs?.[i];
        const val = (typeof ar === 'string' && !ar.includes('MYMEMORY WARNING')) ? ar : x;
        return `<li>${esc(val)}</li>`;
      }).join('');
      return `${districts}
        ${vat.note ? `<div class="prose prose--highlight" style="margin-top:16px"><strong>${esc(t('labelVat', 'VAT'))}:</strong> ${esc(safe(vatNote) || vat.note)}<br><br>${esc(safe(vatSales) || vat.saleSeasons)}<br><br>${esc(safe(vatShip) || vat.shippingTip)}</div>` : ''}
        ${brands ? `<div class="chips" style="margin-top:16px">${brands}</div>` : ''}
        ${souvenirs ? `<ul style="margin-top:12px;font-size:12px;padding-left:20px">${souvenirs}</ul>` : ''}`;
    }},
    warnings: { labelKey: 'moreWarnings', label: 'Warnings', render: () =>
      (PLAN.warnings || []).slice(0, 4).map((w, i) =>
        `<div class="warning-card"><div class="warning-card__title">${esc(txC('warnings', i, 'title', w.title))}</div><div class="warning-card__desc">${esc(txC('warnings', i, 'desc', w.desc))}</div></div>`
      ).join('')
    },
    budget: { labelKey: 'moreBudget', label: 'Budget', render: () => `<div class="budget-overview">${renderBudget()}</div>` },
    family: { labelKey: 'moreFamily', label: 'Family', render: renderFamily },
    emergency: { labelKey: 'moreEmergency', label: 'Emergency', render: renderEmergency },
    local: { labelKey: 'moreLocal', label: 'Local tips', render: renderLocalTips },
    cheat: { labelKey: 'moreCheat', label: 'Cheat sheet', render: renderCheatSheet }
  };

  function renderMore() {
    const nav = Object.entries(MORE_SECTIONS).map(([id, sec]) =>
      `<button type="button" class="more-nav__btn ${id === activeMoreSection ? 'active' : ''}" onclick="setMoreSection('${id}')">${esc(t(sec.labelKey, sec.label))}</button>`
    ).join('');

    const section = MORE_SECTIONS[activeMoreSection] || MORE_SECTIONS.transport;
    const content = section.render();

    return `${renderChapterOpener(t('moreChapter', 'Essentials'), t('moreTitle', 'More to Know'), t('moreSub', 'Transport, emergency, budget & beyond.'))}
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
      { id: 'home', icon: 'home', labelKey: 'tabHome', label: 'Home' },
      { id: 'sights', icon: 'camera', labelKey: 'tabSights', label: 'Sights' },
      { id: 'stay', icon: 'bed', labelKey: 'tabStay', label: 'Stay' },
      { id: 'eat', icon: 'utensils', labelKey: 'tabEat', label: 'Eat' },
      { id: 'plan', icon: 'map', labelKey: 'tabPlan', label: 'Plan' },
      { id: 'more', icon: 'more', labelKey: 'tabMore', label: 'More' }
    ];

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML =
      `<main class="panel">${panels[activeTab] || ''}</main>` +
      `<nav class="bottom-nav" aria-label="${esc(t('navLabel', 'Main navigation'))}">${tabs.map(tab =>
        `<button type="button" class="nav-item ${activeTab === tab.id ? 'active' : ''}" onclick="setTab('${tab.id}')" aria-current="${activeTab === tab.id ? 'page' : 'false'}">${ICONS[tab.icon] || ''}<span>${esc(t(tab.labelKey, tab.label))}</span></button>`
      ).join('')}</nav>`;

    if (global.I18n) global.I18n.bindToolbar();
  }

  function ensureAppChrome() {
    if (document.getElementById('app-chrome-sticky')) return;

    const sticky = document.createElement('div');
    sticky.id = 'app-chrome-sticky';
    sticky.className = 'app-chrome-sticky';
    sticky.innerHTML =
      '<div class="app-chrome" aria-label="App settings">' +
        '<div class="app-chrome__start">' +
          '<button type="button" class="app-toolbar__btn" id="lang-toggle">عربي</button>' +
          '<button type="button" class="app-toolbar__btn app-toolbar__btn--theme" id="theme-toggle" aria-label="Toggle dark mode"></button>' +
        '</div>' +
        '<a class="pdf-fab" id="pdf-fab" href="' + esc(pdfPageHref()) + '" target="_blank" rel="noopener">PDF</a>' +
      '</div>';

    const app = document.getElementById('app');
    if (app) document.body.insertBefore(sticky, app);
    else document.body.appendChild(sticky);
  }

  function pdfPageHref() {
    const file = (window.location.pathname.split('/').pop() || 'london.html').replace(/\?.*$/, '');
    if (/\.html$/i.test(file)) return file.replace(/\.html$/i, '-pdf.html');
    return 'london-pdf.html';
  }

  function init() {
    if (typeof PLAN === 'undefined') {
      console.error('PLAN not loaded — include data/london.js before app.js');
      return;
    }
    ensureAppChrome();
    if (global.DiscoverBrand) global.DiscoverBrand.apply(PLAN);
    else applyTheme(PLAN);
    if (global.I18n) global.I18n.init(render);
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
