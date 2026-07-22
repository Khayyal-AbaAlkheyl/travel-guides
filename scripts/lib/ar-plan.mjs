/**
 * Shared EN→AR plan overlay helpers.
 * Skip only non-linguistic / structural fields.
 */
import fs from 'fs';
import path from 'path';

/** Keys that must never be translated (URLs, coords, enums, media, theme). */
export const SKIP_KEYS = new Set([
  'mapUrl',
  'bookUrl',
  'lat',
  'lng',
  'photos',
  'heroImage',
  'theme',
  'stats',
  'icon',
  'lens',
  'googleRating',
  'rating',
  'color',
  'timeOfDay',
  'img',
  'signature',
  'exterior',
  'room',
  'restaurant',
  'view',
  'detail',
  'hero',
  'photoSpot',
  'heroPosition'
]);

/** Pure machine/symbol / acronym strings may stay identical EN/AR. */
export function isExemptFromArabic(en) {
  const s = String(en || '').trim();
  if (!s) return true;
  if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return true;
  if (s.length <= 3) return true;
  if (
    /^(e?SIM|Wi-?Fi|QR|VAT|SPF|USB|ATM|GPS|PIN|ID|UK|EU|USA|UAE|GCC|A&E|OK|GMT|BST|CET|EE|HSBC|AZT|TfL|SIM\s*\/\s*eSIM)$/i.test(
      s
    )
  ) {
    return true;
  }
  // Transit / app product labels often kept Latin
  if (/^(Oyster\s*\/\s*Contactless|Uber\s*\/\s*Bolt|Uber Boat|TfL Go|GMT\s*\/\s*BST\s*\+?\d*)$/i.test(s)) {
    return true;
  }
  // Camera / technical exposure strings
  if (/\bf\/\d|ISO\s*\d|\d{2}–\d{2}mm|\d{2}-\d{2}mm/i.test(s)) return true;
  // App / product brands kept in Latin
  if (/^(Booking\.com|Maps\.me|Google Maps|Uber|WhatsApp|Zipline)$/i.test(s)) return true;
  // Timezone codes
  if (/\bUTC[+-]?\d+\b/i.test(s) && s.length <= 24) return true;
  // Already French / accented local phrases (not English prose)
  if (
    /[àâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/i.test(s) &&
    !/\b(the|and|for|with|from|your|this|that|should|every|city)\b/i.test(s)
  ) {
    return true;
  }
  // Common French phrase patterns kept as local language examples
  if (/\b(avez-vous|parlez-vous|s'il vous plaît|où est|merci|bonjour)\b/i.test(s)) {
    return true;
  }
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  if (letters <= 2) return true;
  // All-caps short codes
  if (!/[a-z]/.test(s) && s.length <= 8 && letters <= 6) return true;
  return false;
}

export function needsArabicScript(en) {
  if (typeof en !== 'string') return false;
  const s = en.trim();
  if (!s || isExemptFromArabic(s)) return false;
  return /[A-Za-z]/.test(s);
}

export function isBadTranslation(s) {
  if (typeof s !== 'string' || !s.trim()) return true;
  if (s.includes('MYMEMORY WARNING')) return true;
  if (/QUERY LENGTH LIMIT/i.test(s)) return true;
  if (/MAX ALLOWED QUERY/i.test(s)) return true;
  if (/^ERROR[:\s]/i.test(s)) return true;
  return false;
}

export function hasArabic(s) {
  return typeof s === 'string' && /[\u0600-\u06FF]/.test(s);
}

export function loadPlan(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  return new Function(`${src}; return PLAN;`)();
}

export function collectStrings(obj, set = new Set()) {
  if (typeof obj === 'string') {
    const s = obj.trim();
    if (s && !/^https?:\/\//i.test(s) && !/^data:/i.test(s)) set.add(s);
    return set;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectStrings(v, set));
    return set;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP_KEYS.has(k)) continue;
      if (typeof v === 'number' || typeof v === 'boolean' || v == null) continue;
      collectStrings(v, set);
    }
  }
  return set;
}

/**
 * Build PLAN_AR mirror. Arrays keep index alignment (no filtering).
 * Missing dict entries leave string leaves as undefined → coverage fail.
 */
export function buildOverlay(obj, dict) {
  if (typeof obj === 'string') {
    if (/^https?:\/\//i.test(obj) || /^data:/i.test(obj)) return undefined;
    const key = obj.trim();
    const ar = dict[key] ?? dict[obj];
    if (ar && !isBadTranslation(ar)) return ar;
    // Keep machine / already-local strings as-is so overlays stay complete
    if (isExemptFromArabic(key)) return obj;
    return undefined;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return undefined;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'string') {
        const ar = buildOverlay(item, dict);
        return ar !== undefined ? ar : null;
      }
      if (item && typeof item === 'object') {
        return buildOverlay(item, dict) || {};
      }
      return item;
    });
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP_KEYS.has(k)) continue;
      if (typeof v === 'number' || typeof v === 'boolean' || v == null) continue;
      const val = buildOverlay(v, dict);
      if (val !== undefined) out[k] = val;
    }
    return out;
  }
  return undefined;
}

export function coverageReport(plan, dict) {
  const strings = [...collectStrings(plan)];
  const missing = [];
  const identical = [];
  const ok = [];
  for (const en of strings) {
    if (isExemptFromArabic(en)) {
      ok.push(en);
      continue;
    }
    const ar = dict[en];
    if (!ar || isBadTranslation(ar)) {
      missing.push(en);
      continue;
    }
    if (needsArabicScript(en) && ar.trim() === en.trim()) {
      identical.push(en);
      continue;
    }
    if (needsArabicScript(en) && !hasArabic(ar) && /[A-Za-z]/.test(ar)) {
      missing.push(en);
      continue;
    }
    ok.push(en);
  }
  return {
    total: strings.length,
    ok: ok.length,
    missing,
    identical,
    pass: missing.length === 0 && identical.length === 0
  };
}

export function mergeDictFiles(dict, files) {
  let out = { ...dict };
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const extra = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const [k, v] of Object.entries(extra)) {
      if (!isBadTranslation(v)) out[k] = v;
    }
  }
  return out;
}

export const CITIES = [
  'london',
  'paris',
  'edinburgh',
  'istanbul',
  'italy',
  'bosnia',
  'azerbaijan',
  'trabzon'
];

export function cityPaths(root, city) {
  return {
    plan: path.join(root, 'data', `${city}.js`),
    planAr: path.join(root, 'data', `${city}-ar.js`),
    html: path.join(root, 'cities', `${city}.html`),
    pdfHtml: path.join(root, 'cities', `${city}-pdf.html`)
  };
}

export const STATIC_GLOSSARY = {
  Low: 'منخفض',
  Medium: 'متوسط',
  High: 'مرتفع',
  Peak: 'ذروة',
  Rising: 'في ازدياد',
  Free: 'مجاني',
  Luxury: 'فاخر',
  Budget: 'اقتصادي',
  Mid: 'متوسط',
  Morning: 'صباح',
  Afternoon: 'ظهر',
  Evening: 'مساء',
  Smart: 'أنيق',
  Casual: 'غير رسمي',
  Essential: 'ضروري',
  Jan: 'يناير',
  Feb: 'فبراير',
  Mar: 'مارس',
  Apr: 'أبريل',
  May: 'مايو',
  Jun: 'يونيو',
  Jul: 'يوليو',
  Aug: 'أغسطس',
  Sep: 'سبتمبر',
  Oct: 'أكتوبر',
  Nov: 'نوفمبر',
  Dec: 'ديسمبر',
  London: 'لندن',
  Paris: 'باريس',
  Edinburgh: 'إدنبرة',
  Istanbul: 'إسطنبول',
  Italy: 'إيطاليا',
  Bosnia: 'البوسنة',
  Azerbaijan: 'أذربيجان',
  Trabzon: 'طرابزون',
  'United Kingdom': 'المملكة المتحدة',
  France: 'فرنسا',
  Scotland: 'اسكتلندا',
  Turkey: 'تركيا',
  'Travel Guide': 'دليل سفر'
};
