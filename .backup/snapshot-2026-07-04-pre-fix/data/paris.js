/**
 * DISCOVER city template — copy to data/[city-slug].js and fill in content.
 * Theme presets: themes/cities.json
 */
const PLAN = {
  meta: {
    city: 'Paris',
    country: 'France',
    tagline: 'Sights, stays, food and day plans — in your pocket.',
    badge: 'Discover · 2026 Edition',
    edition: '2026',
    stats: { attractions: 0, hotels: 0, dining: 0, days: 0 },
    theme: {
      accent: '#2c5282',
      accentSoft: '#ebf4ff',
      accentDeep: '#1a365d',
      transitLabel: 'Metro',
      tube: '#2c5282',
      parks: '#2d6a4f',
      river: '#0077b6',
      gold: '#b8860b',
      navy: '#1a2744',
      heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80'
    }
  },
  welcome: {
    editorLetter: 'Two sentences introducing the city and this guide.',
    howToUse: 'Scan QR codes for maps. Tap links to book.'
  },
  essentials: {},
  arrival: [],
  packing: {},
  weatherTable: { rows: [], sweetSpot: '' },
  transport: { modes: [], oysterTips: [], exit6Tip: '' },
  maps: { overview: { caption: '', markers: [] } },
  attractions: [],
  hotels: [],
  dining: [],
  itineraries: [],
  rainyDay: [],
  sunnyDay: [],
  hiddenGems: [],
  warnings: [],
  shopping: { districts: [], brands: [], souvenirs: [], vatTips: {} },
  budget: {},
  family: { rows: [], tip: '' },
  emergency: { numbers: [], hospitals: [], embassies: [], lostPassport: '' },
  phrases: [],
  cheatSheet: {},
  etiquette: []
};
