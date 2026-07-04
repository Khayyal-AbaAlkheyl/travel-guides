/**
 * PDF renderer — linear A4 magazine document from global PLAN.
 * Requires shared.js loaded first (applyTheme, qr, stars, staticMap, getCoords, esc, caption, timeClass, actionButtons).
 */
(function () {
  'use strict';

  /* ── PLAN accessors ── */
  function meta() {
    return PLAN.meta || PLAN;
  }

  function cityName() {
    return meta().city || PLAN.city || 'City';
  }

  function countryName() {
    return meta().country || PLAN.country || '';
  }

  function themeHero() {
    return (meta().theme || PLAN.theme || {}).heroImage || '';
  }

  function statsEntries() {
    const stats = meta().stats || PLAN.stats;
    if (Array.isArray(stats)) return stats;
    if (!stats || typeof stats !== 'object') return [];
    const map = [
      ['attractions', 'Attractions'],
      ['hotels', 'Hotels'],
      ['dining', 'Restaurants'],
      ['days', 'Day Plans'],
      ['chapters', 'Chapters'],
      ['qrCodes', 'QR Codes']
    ];
    return map
      .filter(function (pair) { return stats[pair[0]] != null; })
      .map(function (pair) { return { value: String(stats[pair[0]]), label: pair[1] }; });
  }

  /* ── Layout helpers ── */
  function sectionHead(title, subtitle) {
    return (
      '<div class="pdf-section-head">' +
        '<h2>' + esc(title) + '</h2>' +
        (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') +
      '</div>'
    );
  }

  function chapterOpener(label, title, subtitle, img) {
    const bg = img || themeHero();
    return (
      '<div class="pdf-chapter">' +
        '<div class="pdf-chapter__bg" style="background-image:url(\'' + esc(bg) + '\')"></div>' +
        '<div class="pdf-chapter__overlay"></div>' +
        '<div class="pdf-chapter__content">' +
          '<div class="pdf-chapter__label">' + esc(label) + '</div>' +
          '<h2 class="pdf-chapter__title">' + esc(title) + '</h2>' +
          (subtitle ? '<p class="pdf-chapter__subtitle">' + esc(subtitle) + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function photoBg(url, extraClass) {
    if (!url) return '<div class="pdf-photo ' + (extraClass || '') + '"></div>';
    return (
      '<div class="pdf-photo ' + (extraClass || '') + '" style="background-image:url(\'' + esc(url) + '\')">' +
        '<img src="' + esc(url) + '" alt="" role="presentation">' +
      '</div>'
    );
  }

  function labeledPhoto(url, label, extraClass) {
    if (!url) return '';
    return (
      '<figure>' +
        '<div class="pdf-photo ' + (extraClass || 'pdf-photo--square') + '" style="background-image:url(\'' + esc(url) + '\')">' +
          '<span class="pdf-photo-label">' + esc(label) + '</span>' +
        '</div>' +
      '</figure>'
    );
  }

  function qrBlock(url, label, size) {
    size = size || 72;
    return (
      '<div class="pdf-spread__qr">' +
        qr(url, size) +
        '<div class="pdf-spread__qr-label">' + esc(label || 'Scan for map') + '</div>' +
      '</div>'
    );
  }

  function chipsHtml(items) {
    return (
      '<div class="pdf-chips">' +
        items.filter(Boolean).join('') +
      '</div>'
    );
  }

  function chip(text, mod) {
    if (!text) return '';
    return '<span class="pdf-chip' + (mod ? ' pdf-chip--' + mod : '') + '">' + esc(text) + '</span>';
  }

  function crowdHtml(crowd) {
    if (!crowd) return '';
    const periods = [
      ['morning', 'Morning'],
      ['afternoon', 'Afternoon'],
      ['evening', 'Evening']
    ];
    return (
      '<div class="pdf-crowd">' +
        '<strong style="font-size:7pt;display:block;margin-bottom:3px;">Crowd levels</strong>' +
        periods.map(function (p) {
          return (
            '<div class="pdf-crowd__row">' +
              '<span class="pdf-crowd__label">' + p[1] + '</span>' +
              '<span class="pdf-stars">' + stars(crowd[p[0]] || 0) + '</span>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  function nearbyHtml(list) {
    if (!list || !list.length) return '';
    return (
      '<ul class="pdf-nearby">' +
        list.slice(0, 5).map(function (n) {
          return '<li><span>' + esc(n.name) + '</span><span>' + esc(n.walk) + '</span></li>';
        }).join('') +
      '</ul>'
    );
  }

  function pdfActionButtons(mapUrl, bookUrl, bookText) {
    const parts = [];
    if (mapUrl) {
      parts.push('<a class="pdf-btn pdf-btn--map" href="' + esc(mapUrl) + '">Open map</a>');
    }
    if (bookUrl) {
      parts.push('<a class="pdf-btn pdf-btn--book" href="' + esc(bookUrl) + '">' + esc(bookText || 'Book') + '</a>');
    }
    return parts.length ? '<div class="pdf-actions">' + parts.join('') + '</div>' : '';
  }

  function stopCardClass(timeOfDay) {
    const mod = timeOfDay || 'morning';
    return 'pdf-stop__card pdf-stop__card--' + mod;
  }

  function mapQrBlock(name, mapUrl) {
    const coords = getCoords(name);
    const mapImg = coords
      ? staticMap(coords.lat, coords.lng, 480, 240)
      : '';
    return (
      '<div class="pdf-map-qr">' +
        '<div class="pdf-map-qr__map">' +
          (coords
            ? '<img src="' + esc(mapImg) + '" alt="Map">'
            : '<div style="height:100%;background:#e8e4de;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#6b6560;">Map · scan QR</div>') +
        '</div>' +
        qrBlock(mapUrl, 'Google Maps', 64) +
      '</div>'
    );
  }

  const ESSENTIAL_ICONS = {
    currency: '£',
    power: '⚡',
    sim: '📶',
    language: '💬',
    tipping: '💳',
    emergency: '🆘',
    tapWater: '💧',
    timezone: '🕐'
  };

  const TRANSPORT_ICONS = {
    tube: '🚇',
    bus: '🚌',
    elizabeth: '🚆',
    boat: '⛴',
    walk: '🚶',
    bike: '🚲',
    cab: '🚕',
    uber: '📱'
  };

  const EMERGENCY_ICONS = {
    emergency: '🆘',
    medical: '🏥',
    police: '👮',
    passport: '🛂',
    hospital: '🏥',
    embassy: '🏛'
  };

  /* ── Section renderers ── */
  function renderCover() {
    const m = meta();
    return (
      '<section class="pdf-cover">' +
        '<div class="pdf-cover__bg" style="background-image:url(\'' + esc(themeHero()) + '\')"></div>' +
        '<div class="pdf-cover__overlay"></div>' +
        '<div class="pdf-cover__content">' +
          '<span class="pdf-cover__badge">' + esc(m.badge || 'Travel Guide') + ' · ' + esc(countryName()) + '</span>' +
          '<h1 class="pdf-cover__title">' + esc(cityName()) + '</h1>' +
          '<p class="pdf-cover__tagline">' + esc(m.tagline || PLAN.tagline || '') + '</p>' +
          '<div class="pdf-cover__stats">' +
            statsEntries().map(function (st) {
              return (
                '<div>' +
                  '<div class="pdf-cover__stat-value">' + esc(st.value) + '</div>' +
                  '<div class="pdf-cover__stat-label">' + esc(st.label) + '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderWelcome() {
    const w = PLAN.welcome || {};
    const letter = (typeof shortText === 'function' ? shortText(w.editorLetter, 2) : (w.editorLetter || '').split('\n\n')[0]) || '';
    return (
      '<section class="pdf-section">' +
        chapterOpener('Editor\'s Letter', 'Discover ' + cityName(), 'Your visual-first companion for every day of the trip.') +
        '<div class="pdf-prose pdf-prose--letter"><p>' + esc(letter) + '</p></div>' +
      '</section>'
    );
  }

  function renderEssentials() {
    const e = PLAN.essentials || {};
    const keys = Object.keys(e);
    return (
      '<section class="pdf-section">' +
        chapterOpener('Before You Go', 'Essentials', 'Currency, power, connectivity and the numbers that matter.') +
        '<div class="pdf-essentials">' +
          keys.map(function (key) {
            const item = e[key];
            if (!item) return '';
            return (
              '<div class="pdf-essential">' +
                '<div class="pdf-essential__icon">' + (ESSENTIAL_ICONS[key] || '●') + '</div>' +
                '<div class="pdf-essential__label">' + esc(item.label) + '</div>' +
                '<div class="pdf-essential__note">' + esc(item.note) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderArrival() {
    const steps = PLAN.arrival || [];
    return (
      '<section class="pdf-section">' +
        chapterOpener('Arrival', 'First Hour in ' + cityName(), 'From border to first meal — the sequence that saves time and money.') +
        '<div class="pdf-steps">' +
          steps.map(function (s) {
            return (
              '<div class="pdf-step">' +
                '<div class="pdf-step__num">' + esc(s.step) + '</div>' +
                '<div class="pdf-step__title">' + esc(s.title) + '</div>' +
                '<div class="pdf-step__desc">' + esc(s.desc) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderPacking() {
    const p = PLAN.packing || {};
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    return (
      '<section class="pdf-section">' +
        chapterOpener('Packing', 'Season by Season', 'What to bring for London\'s changeable weather.') +
        '<div class="pdf-packing">' +
          seasons.map(function (key) {
            const s = p[key];
            if (!s) return '';
            return (
              '<div class="pdf-season">' +
                '<div class="pdf-season__head">' + esc(s.months) + '</div>' +
                '<div class="pdf-season__temp">' + esc(s.temp) + '</div>' +
                '<ul class="pdf-season__items">' +
                  (s.items || []).map(function (item) {
                    return '<li>' + esc(item) + '</li>';
                  }).join('') +
                '</ul>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderWeather() {
    const wt = PLAN.weatherTable || {};
    const rows = wt.rows || [];
    return (
      '<section class="pdf-section">' +
        chapterOpener('Weather', 'Month by Month', 'Temperature, rain, crowds and what to book.') +
        '<div class="pdf-table-wrap">' +
          '<table class="pdf-table">' +
            '<thead><tr>' +
              '<th>Month</th><th>Temp</th><th>Rain</th><th>Sunset</th><th>Crowds</th><th>Best for</th>' +
            '</tr></thead>' +
            '<tbody>' +
              rows.map(function (r) {
                return (
                  '<tr>' +
                    '<td><strong>' + esc(r.month) + '</strong></td>' +
                    '<td>' + esc(r.avgTemp) + '</td>' +
                    '<td>' + esc(r.rain) + '</td>' +
                    '<td>' + esc(r.sunset) + '</td>' +
                    '<td>' + esc(r.crowds) + '</td>' +
                    '<td>' + esc(r.recommend) + '</td>' +
                  '</tr>'
                );
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
        (wt.sweetSpot
          ? '<div class="pdf-box pdf-box--tip" style="margin-top:4mm;"><strong>Sweet spot</strong>' + esc(wt.sweetSpot) + '</div>'
          : '') +
      '</section>'
    );
  }

  function renderTransport() {
    const t = PLAN.transport || {};
    const modes = t.modes || [];
    const tips = t.oysterTips || [];
    return (
      '<section class="pdf-section">' +
        chapterOpener('Getting Around', 'Transport', 'Tube, bus, river and the contactless cap that changes everything.') +
        '<div class="pdf-transport-grid">' +
          modes.map(function (m) {
            const iconClass = TRANSPORT_ICONS[m.icon] ? ' pdf-transport-mode__icon--' + m.icon : '';
            return (
              '<div class="pdf-transport-mode">' +
                '<div class="pdf-transport-mode__icon' + iconClass + '">' + (TRANSPORT_ICONS[m.icon] || '🚇') + '</div>' +
                '<div class="pdf-transport-mode__name">' + esc(m.name) + '</div>' +
                '<div class="pdf-transport-mode__price">' + esc(m.price) + '</div>' +
                '<div class="pdf-transport-mode__desc">' + esc(m.desc) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
        '<div class="pdf-oyster-tips">' +
          tips.map(function (tip) {
            return (
              '<div class="pdf-box pdf-box--fact">' +
                '<strong>' + esc(tip.title) + '</strong>' +
                esc(tip.desc) +
              '</div>'
            );
          }).join('') +
        '</div>' +
        (t.exit6Tip
          ? '<div class="pdf-box pdf-box--secret" style="margin-top:4mm;"><strong>Local secret</strong>' + esc(t.exit6Tip) + '</div>'
          : '') +
      '</section>'
    );
  }

  function renderMaps() {
    const maps = PLAN.maps || {};
    const overview = maps.overview || {};
    const markers = overview.markers || [];
    const center = markers[0]
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: 51.5074, lng: -0.1278 };
    const mapUrl = staticMap(center.lat, center.lng, 640, 480);
    return (
      '<section class="pdf-section">' +
        chapterOpener('Maps', 'City Overview', overview.caption || 'Scan any QR in this guide for turn-by-turn directions.') +
        '<div class="pdf-map-overview">' +
          '<div class="pdf-map-qr__map" style="height:70mm;">' +
            '<img src="' + esc(mapUrl) + '" alt="City overview map">' +
          '</div>' +
          '<div>' +
            sectionHead('Key locations', markers.length + ' pinned places') +
            '<ul class="pdf-marker-list">' +
              markers.map(function (m) {
                return '<li>' + esc(m.name) + ' <span style="color:#6b6560;">(' + esc(m.type) + ')</span></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderAttraction(a) {
    const photos = a.photos || {};
    const insider = [a.didYouKnow, a.localSecret].filter(Boolean).join(' ');
    const eatNearby = [a.nearbyCafes, a.nearbyRestaurants].filter(Boolean).join(' · ');
    return (
      '<section class="pdf-spread pdf-spread--attraction">' +
        '<div class="pdf-spread__header">' +
          '<div>' +
            '<h2 class="pdf-spread__title">' + esc(a.name) + '</h2>' +
            '<div class="pdf-spread__address">' + esc(a.address) + '</div>' +
          '</div>' +
          qrBlock(a.mapUrl, 'Directions', 72) +
        '</div>' +

        photoBg(photos.hero || photos.detail, 'pdf-photo--hero') +

        '<div class="pdf-grid pdf-grid--2" style="margin-bottom:3mm;">' +
          labeledPhoto(photos.detail, 'Detail', 'pdf-photo--square') +
          labeledPhoto(photos.photoSpot, 'Photo spot', 'pdf-photo--square') +
        '</div>' +

        '<div class="pdf-cols-2" style="margin-top:4mm;">' +
          '<div>' +
            chipsHtml([
              chip(a.ticket, 'accent'),
              chip(a.hours),
              chip('Tube: ' + a.tube),
              chip('Wait summer: ' + a.waitSummer, 'warn'),
              chip('Visit: ' + a.avgVisit)
            ]) +
            crowdHtml(a.crowd) +
            '<div style="margin-top:3mm;font-size:7pt;"><strong>Nearby (walk)</strong></div>' +
            nearbyHtml(a.nearby) +
            (eatNearby ? '<div class="pdf-meta-row"><strong>Eat nearby</strong><span>' + esc(eatNearby) + '</span></div>' : '') +
            (a.nearbyTube ? '<div class="pdf-meta-row"><strong>Getting there</strong><span>' + esc(a.nearbyTube) + '</span></div>' : '') +
          '</div>' +
          '<div>' +
            (insider ? '<div class="pdf-box pdf-box--fact"><strong>Insider</strong>' + esc(insider) + '</div>' : '') +
            (a.photoSpot ? '<div class="pdf-box pdf-box--tip"><strong>Best photo spot</strong>' + esc(a.photoSpot) + '</div>' : '') +
            (a.tip ? '<div class="pdf-box pdf-box--tip"><strong>Tip</strong>' + esc(a.tip) + '</div>' : '') +
            mapQrBlock(a.name, a.mapUrl) +
            pdfActionButtons(a.mapUrl, a.bookUrl, a.bookText || 'Book') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderAttractionsSection() {
    const list = PLAN.attractions || [];
    return (
      chapterOpener('Must-See', 'Attractions', list.length + ' sights with photos, maps, crowd timing and QR codes.') +
      list.map(renderAttraction).join('')
    );
  }

  const HOTEL_PHOTO_LABELS = {
    exterior: 'Exterior',
    room: 'Room',
    restaurant: 'Restaurant',
    view: 'View'
  };

  function renderHotel(h) {
    const photos = h.photos || {};
    const photoKeys = Object.keys(HOTEL_PHOTO_LABELS).filter(function (k) { return photos[k]; });
    return (
      '<section class="pdf-spread pdf-spread--hotel">' +
        '<div class="pdf-spread__header">' +
          '<div>' +
            '<h2 class="pdf-spread__title">' + esc(h.name) + '</h2>' +
            '<div class="pdf-spread__address">' + esc(h.address) + '</div>' +
          '</div>' +
          qrBlock(h.mapUrl, 'Hotel map', 72) +
        '</div>' +

        '<div class="pdf-hotel-gallery">' +
          photoKeys.map(function (key) {
            return labeledPhoto(photos[key], HOTEL_PHOTO_LABELS[key], '');
          }).join('') +
        '</div>' +

        '<div class="pdf-cols-2">' +
          '<div>' +
            chipsHtml([
              chip(h.category, 'accent'),
              chip(h.price, 'gold'),
              chip('Rating ' + h.rating),
              chip('Google ' + h.googleRating, 'ok'),
              chip(h.room),
              chip(h.cancellation),
              chip(h.breakfast)
            ]) +
            '<div class="pdf-meta-row"><strong>Tube</strong><span>' + esc(h.tube) + '</span></div>' +
            '<div class="pdf-meta-row"><strong>Airport</strong><span>' + esc(h.airport) + '</span></div>' +
            '<div class="pdf-meta-row"><strong>Nearby</strong><span>' + esc(h.nearbyAttractions) + '</span></div>' +
            '<div class="pdf-meta-row"><strong>Walk score</strong><span>' + esc(h.walkingScore) + '</span></div>' +
            (h.idealFor && h.idealFor.length
              ? '<div class="pdf-meta-row"><strong>Ideal for</strong><span>' + esc(h.idealFor.join(' · ')) + '</span></div>'
              : '') +
          '</div>' +
          '<div>' +
            (h.tip ? '<div class="pdf-box pdf-box--tip"><strong>Insider tip</strong>' + esc(h.tip) + '</div>' : '') +
            mapQrBlock(h.name, h.mapUrl) +
            pdfActionButtons(h.mapUrl, h.bookUrl, 'Book') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderHotelsSection() {
    return (
      chapterOpener('Where to Stay', 'Hotels', 'Exterior, rooms, pools and rooftops — the full picture before you book.') +
      (PLAN.hotels || []).map(renderHotel).join('')
    );
  }

  function renderDining(d) {
    const dishes = d.dishes || [];
    const photos = d.photos || {};
    return (
      '<section class="pdf-spread pdf-spread--dining">' +
        '<div class="pdf-spread__header">' +
          '<div>' +
            '<h2 class="pdf-spread__title">' + esc(d.name) + '</h2>' +
            '<div class="pdf-spread__address">' + esc(d.address) + '</div>' +
          '</div>' +
          qrBlock(d.mapUrl, 'Reserve / map', 72) +
        '</div>' +

        (photos.signature ? photoBg(photos.signature, 'pdf-photo--hero') : '') +

        '<div class="pdf-dish-grid">' +
          dishes.slice(0, 3).map(function (dish) {
            return (
              '<div class="pdf-dish">' +
                photoBg(dish.img, 'pdf-photo--square') +
                '<div class="pdf-dish__name">' + esc(dish.name) + '</div>' +
                '<div class="pdf-dish__desc">' + esc(dish.desc) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +

        '<div class="pdf-cols-2">' +
          '<div>' +
            chipsHtml([
              chip(d.category, 'accent'),
              chip(d.price, 'gold'),
              chip(d.famous),
              chip(d.michelin, 'gold'),
              chip(d.reservation, 'warn'),
              chip(d.wait, 'warn'),
              d.halal ? chip('Halal', 'ok') : '',
              d.vegetarian ? chip('Vegetarian', 'ok') : '',
              chip(d.dressCode),
              chip(d.kidsFriendly)
            ]) +
            (d.tip ? '<div class="pdf-box pdf-box--tip" style="margin-top:3mm;"><strong>Tip</strong>' + esc(d.tip) + '</div>' : '') +
          '</div>' +
          '<div>' +
            mapQrBlock(d.name, d.mapUrl) +
            pdfActionButtons(d.mapUrl, d.bookUrl, 'Reserve') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderDiningSection() {
    return (
      chapterOpener('Where to Eat', 'Dining', 'Signature dishes, interiors and every reservation link you need.') +
      (PLAN.dining || []).map(renderDining).join('')
    );
  }

  function renderDay(day) {
    return (
      '<section class="pdf-day" style="' + (day.color ? '--accent:' + day.color : '') + '">' +
        '<div class="pdf-day__head">' +
          '<span class="pdf-day__badge">Day ' + esc(String(day.day)) + '</span>' +
          '<h2 class="pdf-day__title">' + esc(day.title) + '</h2>' +
          (day.routePreview ? '<span class="pdf-day__route">' + esc(day.routePreview) + '</span>' : '') +
        '</div>' +

        (day.photos && day.photos.length
          ? '<div class="pdf-day-photos">' +
              day.photos.slice(0, 4).map(function (url) {
                return photoBg(url, '');
              }).join('') +
            '</div>'
          : '') +

        (day.mapUrl
          ? '<div style="display:flex;align-items:center;gap:4mm;margin-bottom:4mm;">' +
              qrBlock(day.mapUrl, 'Full route map', 56) +
              '<div style="font-size:7.5pt;"><strong>Route map</strong><br><a href="' + esc(day.mapUrl) + '">Open full day route in Google Maps</a></div>' +
            '</div>'
          : '') +

        '<div class="pdf-timeline">' +
          (day.stops || []).map(function (stop) {
            return (
              '<div class="pdf-stop">' +
                '<div class="pdf-stop__time">' + esc(stop.time) + '</div>' +
                '<div class="' + stopCardClass(stop.timeOfDay) + '">' +
                  '<div class="pdf-stop__name">' + esc(stop.name) + '</div>' +
                  '<div class="pdf-stop__desc">' + esc(stop.desc) + '</div>' +
                  '<div class="pdf-stop__meta">' + esc(stop.transit) +
                    (stop.mapUrl ? ' · <a href="' + esc(stop.mapUrl) + '">Map</a>' : '') +
                  '</div>' +
                '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderItinerariesSection() {
    return (
      chapterOpener('Your Itinerary', '5 Day Plans', 'Hour-by-hour routes with budgets, maps and time-of-day colour coding.') +
      (PLAN.itineraries || []).map(renderDay).join('')
    );
  }

  function renderWeatherPlan(title, subtitle, items) {
    return (
      '<section class="pdf-section">' +
        sectionHead(title, subtitle) +
        '<div class="pdf-weather-cards">' +
          (items || []).map(function (item) {
            return (
              '<article class="pdf-card pdf-card--wide">' +
                '<div class="pdf-card__img" style="background-image:url(\'' + esc(item.img) + '\')"></div>' +
                '<div class="pdf-card__body">' +
                  '<div class="pdf-card__title">' + esc(item.name) + '</div>' +
                  '<div class="pdf-card__desc">' + esc(item.address) + ' · ' + esc(item.desc) + '</div>' +
                  pdfActionButtons(item.mapUrl, null, null) +
                '</div>' +
              '</article>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderHiddenGems() {
    return (
      '<section class="pdf-section">' +
        chapterOpener('Hidden Gems', 'Off the Beaten Path', 'Courtyards, ruins and neon — the London most visitors miss.') +
        '<div class="pdf-grid pdf-grid--2">' +
          (PLAN.hiddenGems || []).map(function (g) {
            return (
              '<article class="pdf-card">' +
                '<div class="pdf-card__img" style="background-image:url(\'' + esc(g.img) + '\')"></div>' +
                '<div class="pdf-card__body">' +
                  '<div class="pdf-card__title">' + esc(g.name) + '</div>' +
                  '<div class="pdf-card__desc">' + esc(g.desc) + '</div>' +
                  pdfActionButtons(g.mapUrl, null, null) +
                '</div>' +
              '</article>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderWarnings() {
    return (
      '<section class="pdf-section">' +
        chapterOpener('Warnings', 'Avoid These', 'The scams and traps that catch even experienced travellers.') +
        (PLAN.warnings || []).slice(0, 4).map(function (w) {
          return (
            '<div class="pdf-box pdf-box--warn" style="margin-bottom:3mm;">' +
              '<strong>' + esc(w.title) + '</strong>' +
              esc(w.desc) +
            '</div>'
          );
        }).join('') +
      '</section>'
    );
  }

  function renderShopping() {
    const s = PLAN.shopping || {};
    return (
      '<section class="pdf-section">' +
        chapterOpener('Shopping', 'Districts & Souvenirs', 'From Bond Street to Bicester Village.') +
        '<div class="pdf-shopping-districts">' +
          (s.districts || []).map(function (d) {
            return (
              '<article class="pdf-card">' +
                '<div class="pdf-card__img" style="background-image:url(\'' + esc(d.img) + '\')"></div>' +
                '<div class="pdf-card__body">' +
                  '<div class="pdf-card__title">' + esc(d.name) + '</div>' +
                  '<div class="pdf-card__desc">' + esc(d.desc) + '</div>' +
                  pdfActionButtons(d.mapUrl, null, null) +
                '</div>' +
              '</article>'
            );
          }).join('') +
        '</div>' +
        (s.vatTips
          ? '<div class="pdf-box pdf-box--tip" style="margin-top:4mm;"><strong>VAT & sales</strong>' +
              esc(s.vatTips.note) + ' ' + esc(s.vatTips.saleSeasons) +
            '</div>'
          : '') +
        ((s.brands && s.brands.length) || (s.souvenirs && s.souvenirs.length)
          ? '<div class="pdf-cols-2" style="margin-top:4mm;">' +
              (s.brands && s.brands.length
                ? '<div><strong style="font-size:8pt;">British brands</strong><ul style="font-size:7pt;margin-top:4px;padding-left:14px;">' +
                    s.brands.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
                  '</ul></div>'
                : '') +
              (s.souvenirs && s.souvenirs.length
                ? '<div><strong style="font-size:8pt;">Souvenirs</strong><ul style="font-size:7pt;margin-top:4px;padding-left:14px;">' +
                    s.souvenirs.map(function (sv) { return '<li>' + esc(sv) + '</li>'; }).join('') +
                  '</ul></div>'
                : '') +
            '</div>'
          : '') +
      '</section>'
    );
  }

  function renderBudget() {
    const b = PLAN.budget || {};
    const tiers = [
      ['budget', 'Budget', 'pdf-budget-card--budget'],
      ['mid', 'Mid-range', 'pdf-budget-card--mid'],
      ['luxury', 'Luxury', 'pdf-budget-card--luxury']
    ];
    return (
      '<section class="pdf-section">' +
        chapterOpener('Budget', 'Daily Costs', 'What to expect per person, per day — three tiers.') +
        '<div class="pdf-budget-page">' +
          tiers.map(function (t) {
            const tier = b[t[0]];
            if (!tier) return '';
            return (
              '<div class="pdf-budget-card ' + t[2] + '">' +
                '<div style="font-weight:700;text-transform:uppercase;font-size:7pt;letter-spacing:0.06em;">' + t[1] + '</div>' +
                '<div class="pdf-budget-card__daily">' + esc(tier.daily) + '</div>' +
                '<div class="pdf-meta-row"><strong>Stay</strong><span>' + esc(tier.accommodation) + '</span></div>' +
                '<div class="pdf-meta-row"><strong>Food</strong><span>' + esc(tier.food) + '</span></div>' +
                '<div class="pdf-meta-row"><strong>Transport</strong><span>' + esc(tier.transport) + '</span></div>' +
                '<div class="pdf-meta-row"><strong>Activities</strong><span>' + esc(tier.activities) + '</span></div>' +
                (tier.tip ? '<div class="pdf-box pdf-box--tip" style="margin-top:4px;"><strong>Tip</strong>' + esc(tier.tip) + '</div>' : '') +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderFamily() {
    const f = PLAN.family || {};
    return (
      '<section class="pdf-section">' +
        chapterOpener('Family', 'Travelling with Kids', f.tip || 'Child-friendly attractions and practical notes.') +
        (f.tip ? '<div class="pdf-box pdf-box--tip" style="margin-bottom:4mm;"><strong>Transport tip</strong>' + esc(f.tip) + '</div>' : '') +
        '<div class="pdf-table-wrap pdf-family-table">' +
          '<table class="pdf-table">' +
            '<thead><tr><th>Attraction</th><th>Notes</th><th>Kids</th><th>Stroller</th><th>Baby change</th><th>Family ticket</th></tr></thead>' +
            '<tbody>' +
              (f.rows || []).map(function (r) {
                function yn(val) {
                  return val
                    ? '<span class="pdf-family-yes">✓</span>'
                    : '<span class="pdf-family-no">—</span>';
                }
                return (
                  '<tr>' +
                    '<td><strong>' + esc(r.attraction) + '</strong></td>' +
                    '<td>' + esc(r.desc) + '</td>' +
                    '<td>' + yn(r.goodForKids) + '</td>' +
                    '<td>' + yn(r.stroller) + '</td>' +
                    '<td>' + yn(r.babyChange) + '</td>' +
                    '<td>' + yn(r.familyTicket) + '</td>' +
                  '</tr>'
                );
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</section>'
    );
  }

  function renderEmergency() {
    const e = PLAN.emergency || {};
    return (
      '<section class="pdf-section">' +
        chapterOpener('Emergency', 'Numbers & Embassies', 'Save this page — hope you never need it.') +
        '<div class="pdf-emergency-grid">' +
          (e.numbers || []).map(function (n) {
            return (
              '<div class="pdf-emergency-card">' +
                '<div class="pdf-emergency-card__icon">' + (EMERGENCY_ICONS[n.icon] || '📞') + '</div>' +
                '<div class="pdf-emergency-card__label">' + esc(n.label) + '</div>' +
                '<div class="pdf-emergency-card__desc">' + esc(n.desc) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
        sectionHead('Hospitals', 'Major A&E departments') +
        '<div class="pdf-grid pdf-grid--3" style="margin-bottom:4mm;">' +
          (e.hospitals || []).map(function (h) {
            return (
              '<div class="pdf-card" style="grid-template-columns:1fr;">' +
                '<div class="pdf-card__body">' +
                  '<div class="pdf-card__title">' + esc(h.name) + '</div>' +
                  '<div class="pdf-card__desc">' + esc(h.address) + '</div>' +
                  pdfActionButtons(h.mapUrl, null, null) +
                '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
        sectionHead('Embassies', 'GCC & regional missions') +
        '<div class="pdf-table-wrap">' +
          '<table class="pdf-table">' +
            '<thead><tr><th>Country</th><th>Address</th><th>Map</th></tr></thead>' +
            '<tbody>' +
              (e.embassies || []).map(function (emb) {
                return (
                  '<tr>' +
                    '<td><strong>' + esc(emb.country) + '</strong></td>' +
                    '<td>' + esc(emb.address) + '</td>' +
                    '<td><a href="' + esc(emb.mapUrl) + '">Open map</a></td>' +
                  '</tr>'
                );
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
        (e.lostPassport
          ? '<div class="pdf-box pdf-box--warn" style="margin-top:4mm;"><strong>Lost passport</strong>' + esc(e.lostPassport) + '</div>'
          : '') +
      '</section>'
    );
  }

  function renderLocalTips() {
    return (
      '<section class="pdf-section">' +
        chapterOpener('Local Tips', 'Phrases & Etiquette', 'Useful English and unwritten rules.') +
        '<div class="pdf-phrases">' +
          (PLAN.phrases || []).map(function (p) {
            return (
              '<div class="pdf-phrase">' +
                '<div class="pdf-phrase__english">' + esc(p.english) + '</div>' +
                '<div class="pdf-phrase__use">' + esc(p.use) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
        '<div class="pdf-etiquette" style="margin-top:5mm;">' +
          (PLAN.etiquette || []).map(function (e) {
            return (
              '<div class="pdf-etiquette-item">' +
                '<strong>' + esc(e.rule) + '</strong>' +
                esc(e.desc) +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderCheatSheet() {
    const cs = PLAN.cheatSheet || {};
    function cheatBlock(title, items, labelKey, valueKey) {
      labelKey = labelKey || 'label';
      valueKey = valueKey || 'value';
      return (
        '<div class="pdf-cheat-block">' +
          '<div class="pdf-cheat-block__title">' + esc(title) + '</div>' +
          (items || []).map(function (item) {
            return (
              '<div class="pdf-cheat-item">' +
                '<span class="pdf-cheat-item__label">' + esc(item[labelKey]) + '</span>' +
                '<span>' + esc(item[valueKey]) + '</span>' +
              '</div>'
            );
          }).join('') +
        '</div>'
      );
    }
    return (
      '<section class="pdf-cheat-sheet">' +
        '<div class="pdf-cheat-sheet__head">' +
          '<h2 class="pdf-cheat-sheet__title">' + esc(cs.title || 'One-Page Cheat Sheet') + '</h2>' +
          '<p class="pdf-cheat-sheet__subtitle">' + esc(cs.subtitle || '') + '</p>' +
        '</div>' +
        '<div class="pdf-cheat-sheet__grid">' +
          cheatBlock('Emergency', cs.emergency) +
          cheatBlock('Transport', cs.transport) +
          cheatBlock('Money', cs.money) +
          cheatBlock('Apps', cs.apps, 'name', 'use') +
        '</div>' +
        '<div class="pdf-cheat-qr-row">' +
          (cs.topQrCodes || []).map(function (item) {
            return (
              '<div class="pdf-cheat-qr">' +
                qr(item.mapUrl, 52) +
                '<div class="pdf-cheat-qr__name">' + esc(item.name) + '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderBackCover() {
    const m = meta();
    return (
      '<section class="pdf-back-cover">' +
        '<div class="pdf-back-cover__bg" style="background-image:url(\'' + esc(themeHero()) + '\')"></div>' +
        '<div class="pdf-back-cover__overlay"></div>' +
        '<div class="pdf-back-cover__content">' +
          '<h2 class="pdf-back-cover__title">' + esc(cityName()) + '</h2>' +
          '<p class="pdf-back-cover__text">' + esc(m.tagline || PLAN.tagline || 'Your premium travel companion.') + '</p>' +
          '<p class="pdf-back-cover__edition">' + esc(m.badge || 'Travel Guide') + ' · Edition ' + esc(m.edition || '2026') + '</p>' +
        '</div>' +
      '</section>'
    );
  }

  /* ── Main render ── */
  function render() {
    if (typeof DiscoverBrand !== 'undefined') DiscoverBrand.apply(PLAN);
    else applyTheme(PLAN);
    document.title = 'Discover ' + cityName() + ' · PDF';

    const root = document.getElementById('root');
    if (!root) return;

    root.className = 'pdf-doc';
    root.innerHTML = [
      renderCover(),
      renderWelcome(),
      renderEssentials(),
      renderArrival(),
      renderPacking(),
      renderWeather(),
      renderTransport(),
      renderMaps(),
      renderAttractionsSection(),
      renderHotelsSection(),
      renderDiningSection(),
      renderItinerariesSection(),
      renderWeatherPlan('Rainy Day Plan', 'Indoor alternatives when the sky opens.', PLAN.rainyDay),
      renderWeatherPlan('Sunny Day Plan', 'Parks, rivers and golden-hour views.', PLAN.sunnyDay),
      renderHiddenGems(),
      renderWarnings(),
      renderShopping(),
      renderBudget(),
      renderFamily(),
      renderEmergency(),
      renderLocalTips(),
      renderCheatSheet(),
      renderBackCover()
    ].join('');
  }

  window.renderPdf = render;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
