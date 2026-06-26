/**
 * Seed Railway MongoDB con datos reales de desaparecidosterremotovenezuela.com
 * 
 * Uso:
 *   1. Copia MONGO_URL desde Railway Dashboard → Variables
 *   2. Ejecuta: set MONGO_URL=mongodb://... && node seed-railway.js
 * 
 * O si ya está en .env:
 *   node seed-railway.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const Report = require('./models/Report');
const { geocode } = require('./utils/geocode');

const MONGO_URI=proces...NGO_URL;
if (!MONGO_URI) {
  console.error('❌ MONGO_URL no definido. Cópialo de Railway Dashboard → Variables.');
  console.error('   set MONGO_URL=mongodb://mongo:password@host:port/db');
  process.exit(1);
}

const API = 'https://desaparecidos-terremoto-api.theempire.tech';
const MAX_PAGES = parseInt(process.argv[2]) || 15;

const SPAM = [
  /infinityhotel/i, /TRUSTED/i, /\.it\b/i, /https?:\/\//i,
  /crypto/i, /bitcoin/i, /\.com\b/i, /\.net\b/i, /\.org\b/i,
];

function isSpam(p) {
  const t = `${p.nombre||''} ${p.descripcion||''} ${p.contacto||''}`;
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

async function seed() {
  console.log('🔌 Conectando a Railway MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Conectado\n');

  const existing = await Report.countDocuments({ source: 'external' });
  console.log(`📊 Existentes: ${existing} externos`);

  let imported = 0, skipped = 0, spam = 0, noGeo = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    process.stdout.write(`📥 Página ${page}/${MAX_PAGES}... `);

    let data;
    try { data = await fetchPage(page); }
    catch (err) { console.log(`❌ ${err.message}`); break; }
    if (!data?.items?.length) { console.log('vacía'); break; }

    let pg = 0;
    for (const p of data.items) {
      if (isSpam(p)) { spam++; continue; }

      const exists = await Report.findOne({ externalId: p.id });
      if (exists) { skipped++; continue; }

      const coords = await geocode(p.ubicacion);
      if (!coords) { noGeo++; continue; }

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
        imported++; pg++;
      } catch {}
    }

    console.log(`+${pg}`);
    if (page < MAX_PAGES) await new Promise(r => setTimeout(r, 800));
  }

  const total = await Report.countDocuments({ source: 'external' });
  console.log(`\n✅ Listo. MongoDB: ${total} externos`);
  console.log(`   Importados: ${imported} | Saltados: ${skipped} | Spam: ${spam} | Sin geo: ${noGeo}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
