/**
 * Geocodificador híbrido para ubicaciones de Venezuela
 * 1. Lookup local (ubicaciones comunes) → instantáneo
 * 2. Nominatim API (OpenStreetMap) → fallback
 */
const https = require('https');

// Cache en memoria
const geoCache = new Map();

// Lookup de ubicaciones venezolanas comunes del terremoto
const LOCATIONS = {
  'catia la mar':              [10.5990, -66.9340],
  'catia la mar guaira':       [10.5990, -66.9340],
  'catia la mar playa grande': [10.5950, -66.9350],
  'catiamar':                  [10.5980, -66.9330],
  'la guaira':                 [10.5990, -66.9340],
  'la guaira vargas':          [10.5990, -66.9340],
  'en la guaira':              [10.5990, -66.9340],
  'macuto':                    [10.6060, -66.8960],
  'caraballeda':               [10.6120, -66.8540],
  'naiguatá':                  [10.6170, -66.7500],
  'tanaguarena':               [10.6100, -66.8350],
  'tanaguarena la guaira':     [10.6100, -66.8350],
  'caracas':                   [10.4806, -66.9036],
  'chacao':                    [10.4960, -66.8480],
  'altamira':                  [10.5080, -66.8520],
  'la candelaria':             [10.5020, -66.9180],
  'petare':                    [10.4800, -66.8100],
  'san felipe':                [10.3400, -68.7400],
  'yaracuy':                   [10.3400, -68.7400],
  'valencia':                  [10.1800, -68.0000],
  'puerto cabello':            [10.4700, -68.0100],
  'barquisimeto':              [10.0700, -69.3200],
  'maracay':                   [10.2500, -67.6000],
  'maiquetía':                 [10.5950, -66.9550],
  'hospital domingo lucianni': [10.4900, -66.8800],
  'hospital domingo luciani':  [10.4900, -66.8800],
  'hosp. domingo luciani':     [10.4900, -66.8800],
  'hospital perez leon':       [10.4950, -66.9200],
  'playa grande':              [10.5900, -66.9400],
  'caribe los cocos':          [10.6050, -66.9200],
  'residencia caribe':         [10.6050, -66.8900],
  'mare':                      [10.6100, -66.8500],
  'caribe la guaira':          [10.6050, -66.9200],
  'catia la mar la soublette': [10.5950, -66.9380],
  'la guitarra':               [10.6000, -66.9300],
  'macuto edificio':           [10.6060, -66.8960],
  'av. la costanera':          [10.6080, -66.8650],
  'tunitas catia la mar':      [10.5900, -66.9500],
  'guatire':                   [10.4700, -66.5400],
  'los teques':                [10.3400, -67.0400],
  'el hatillo':                [10.4300, -66.8200],
};

function lookupLocation(text) {
  if (!text) return null;
  const clean = text.toLowerCase().trim()
    .replace(/[.,#!?]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  // Búsqueda exacta primero
  if (LOCATIONS[clean]) return LOCATIONS[clean];

  // Búsqueda parcial
  for (const [key, coords] of Object.entries(LOCATIONS)) {
    if (clean.includes(key) || key.includes(clean)) return coords;
  }

  return null;
}

async function nominatimGeocode(query) {
  const cached = geoCache.get(query);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query + ', Venezuela',
    format: 'json',
    limit: '1',
  });

  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    https.get(url, {
      headers: { 'User-Agent': 'TerremotoVenezuelaApp/1.0' },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results[0]) {
            const coords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
            geoCache.set(query, coords);
            resolve(coords);
          } else { resolve(null); }
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

async function geocode(text) {
  // Solo lookup local — instantáneo, sin llamadas de red
  return lookupLocation(text) || null;
}

module.exports = { geocode, lookupLocation };
