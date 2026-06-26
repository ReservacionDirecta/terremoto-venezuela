/**
 * Seed externo — importa datos de desaparecidosterremotovenezuela.com
 * Filtra spam, geocodifica, evita duplicados.
 * Uso: node seed-external.js [páginas]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const Report = require('./models/Report');
const { geocode } = require('./utils/geocode');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terremoto-venezuela';
const API_BASE = 'https://desaparecidos-terremoto-api.theempire.tech';
const MAX_PAGES = parseInt(process.argv[2]) || 15; // 15 páginas = 750 registros

// ─── Anti-spam ──────────────────────────────────
const SPAM = [
  /infinityhotel/i, /TRUSTED/i, /SIMONE/i, /BURATTI/i,
  /\.it\b/i, /https?:\/\//i,
  /crypto/i, /bitcoin/i, /\.com\b/i, /\.net\b/i, /\.org\b/i,
];

function isSpam(p) {
  const txt = `${p.nombre||''} ${p.descripcion||''} ${p.contacto||''} ${p.ubicacion||''}`;
  return SPAM.some(r => r.test(txt));
}

// ─── Fetch ──────────────────────────────────────
function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/personas?page=${page}&pageSize=50`;
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ─── Main ───────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB conectado\n');

  const existing = await Report.countDocuments({ source: 'external' });
  console.log(`📊 Reportes externos existentes: ${existing}`);

  let total = 0, imported = 0, skipped = 0, spam = 0, noGeo = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    process.stdout.write(`📥 Página ${page}/${MAX_PAGES}... `);

    let data;
    try { data = await fetchPage(page); }
    catch (err) { console.log(`❌ ${err.message}`); break; }

    if (!data?.items?.length) { console.log('vacía'); break; }

    let pageImported = 0;
    for (const p of data.items) {
      total++;

      // Spam
      if (isSpam(p)) { spam++; continue; }

      // Duplicado
      const exists = await Report.findOne({ externalId: p.id });
      if (exists) { skipped++; continue; }

      // Geocodificar
      const coords = await geocode(p.ubicacion);
      if (!coords) { noGeo++; continue; }

      // Insertar
      try {
        await Report.create({
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
        imported++; pageImported++;
      } catch (err) {
        // skip duplicates silently
      }
    }

    console.log(`+${pageImported}`);
    if (page < MAX_PAGES) await new Promise(r => setTimeout(r, 800));
  }

  const totalDB = await Report.countDocuments({ source: 'external' });
  console.log(`\n✅ Listo. MongoDB: ${totalDB} externos`);
  console.log(`   Procesados: ${total} | Importados: ${imported} | Saltados: ${skipped} | Spam: ${spam} | Sin geo: ${noGeo}`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
