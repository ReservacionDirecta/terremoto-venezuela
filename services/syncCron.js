/**
 * Sincronizador automático — fetch + filter + geocode + insert
 * Usado por el cron job y el endpoint manual
 */
const https = require('https');
const Report = require('../models/Report');
const { lookupLocation } = require('../utils/geocode');

const API = 'https://desaparecidos-terremoto-api.theempire.tech';
const SPAM = [
  /infinityhotel/i, /TRUSTED/i, /SIMONE/i, /BURATTI/i,
  /\.it\b/i, /https?:\/\//i, /crypto/i, /bitcoin/i,
  /\.com\b/i, /\.net\b/i, /\.org\b/i, /viagra/i, /cialis/i,
];

function isSpam(p) {
  const t = (p.nombre || '') + ' ' + (p.descripcion || '') + ' ' + (p.contacto || '');
  return SPAM.some(r => r.test(t));
}

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    https.get(`${API}/api/personas?page=${page}&pageSize=50`, { timeout: 15000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function syncExternal(options = {}) {
  const maxPages = options.maxPages || 10;
  const log = options.log || console.log;
  const startTime = Date.now();

  log(`🔄 Sincronización iniciada (${new Date().toLocaleString('es-VE')})`);

  // Cargar IDs existentes para saltar rápido
  const existingIds = new Set();
  const existingDocs = await Report.find({ source: 'external' }, 'externalId').lean();
  existingDocs.forEach(d => existingIds.add(d.externalId));
  log(`📋 ${existingIds.size} IDs existentes cacheados`);

  let imported = 0, skipped = 0, spam = 0, noGeo = 0;

  for (let page = 1; page <= maxPages; page++) {
    let data;
    try { data = await fetchPage(page); }
    catch (e) { log(`❌ P${page}: ${e.message}`); break; }

    if (!data?.items?.length) break;

    const batch = [];

    for (const p of data.items) {
      if (isSpam(p)) { spam++; continue; }
      if (existingIds.has(p.id)) { skipped++; continue; }

      const coords = lookupLocation(p.ubicacion);
      if (!coords) { noGeo++; continue; }

      batch.push({
        tipo: 'desaparecido',
        source: 'external',
        externalId: p.id,
        location: { type: 'Point', coordinates: [coords[1], coords[0]] },
        nombre: (p.nombre || '').trim().slice(0, 200),
        edad: p.edad || undefined,
        ultimaUbicacion: (p.ubicacion || '').trim().slice(0, 500),
        description: (p.descripcion || '').trim().slice(0, 500),
        contactoReportante: (p.contacto || '').trim().slice(0, 200),
        fotoExterna: (p.foto && p.foto.startsWith('http')) ? p.foto : undefined,
        status: p.estado === 'localizado' ? 'localizado' : 'pendiente',
        encontrado: p.estado === 'localizado',
        fechaEncontrado: p.estado === 'localizado' ? new Date(p.updatedAt) : null,
        reportedAt: new Date(p.createdAt),
        flags: 0,
      });
      existingIds.add(p.id);
    }

    if (batch.length > 0) {
      try {
        await Report.insertMany(batch, { ordered: false });
        imported += batch.length;
      } catch (e) {
        imported += e.insertedDocs?.length || 0;
      }
    }

    if (page < maxPages) await new Promise(r => setTimeout(r, 600));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const result = { imported, skipped, spam, noGeo, elapsed };
  log(`✅ Sync: +${imported} nuevos, ${skipped} dup, ${spam} spam, ${noGeo} sin geo (${elapsed}s)`);

  return result;
}

module.exports = { syncExternal };
