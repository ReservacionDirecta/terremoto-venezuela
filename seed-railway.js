/**
 * Seed Railway MongoDB con datos reales de desaparecidosterremotovenezuela.com
 * Uso: Copia MONGO_URL de Railway Dashboard y ejecuta:
 *   set MONGO_URL=mongodb://... && node seed-railway.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const { geocode } = require('./utils/geocode');
const Report = require('./models/Report');

const MONGO_URI = process.env.MONGO_URL;
if (!MONGO_URI || MONGO_URI === '') {
  console.error('❌ Configura MONGO_URL en .env o variable de entorno');
  process.exit(1);
}

const API = 'https://desaparecidos-terremoto-api.theempire.tech';
const MAX_PAGES = parseInt(process.argv[2]) || 20;

const SPAM = [
  /infinityhotel/i, /TRUSTED/i, /\.it/i, /https?:\/\//i,
  /crypto/i, /bitcoin/i, /\.com/i, /\.net/i, /\.org/i,
];

function isSpam(p) {
  const t = p.nombre + ' ' + p.descripcion + ' ' + (p.contacto || '');
  return SPAM.some(r => r.test(t));
}

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    https.get(API + '/api/personas?page=' + page + '&pageSize=50', { timeout: 15000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function seed() {
  console.log('🔌 Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Conectado\n');

  const existing = await Report.countDocuments({ source: 'external' });
  console.log('📊 Existentes:', existing, 'externos');

  let imported = 0, skipped = 0, spam = 0, noGeo = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    process.stdout.write('📥 P' + page + '/' + MAX_PAGES + '... ');
    let data;
    try { data = await fetchPage(page); }
    catch (e) { console.log('❌', e.message); break; }
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
          tipo: 'desaparecido', source: 'external', externalId: p.id,
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
          reportedAt: new Date(p.createdAt), flags: 0,
        });
        imported++; pg++;
      } catch (e) {}
    }
    console.log('+' + pg);
    if (page < MAX_PAGES) await new Promise(r => setTimeout(r, 800));
  }

  const total = await Report.countDocuments({ source: 'external' });
  console.log('\n✅ MongoDB:', total, 'externos');
  console.log('   Importados:', imported, '| Saltados:', skipped, '| Spam:', spam, '| Sin geo:', noGeo);
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
