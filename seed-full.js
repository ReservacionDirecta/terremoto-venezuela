/**
 * Seed completo — importa TODOS los registros de desaparecidosterremotovenezuela.com
 * Uso: node seed-full.js [desdePagina] [hastaPagina]
 * Ej:  node seed-full.js         → todo (1-1169)
 *      node seed-full.js 1 100   → solo páginas 1-100
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const { lookupLocation } = require('./utils/geocode');
const Report = require('./models/Report');

const MONGO_URI=process.env.MONGO_PUBLIC_URL || 'mongodb://mongo:***@reseau.proxy.rlwy.net:41464/terremoto-venezuela';
const API = 'https://desaparecidos-terremoto-api.theempire.tech';

const FROM_PAGE = parseInt(process.argv[2]) || 1;
const TO_PAGE = parseInt(process.argv[3]) || 9999;

const SPAM = [
  /infinityhotel/i, /TRUSTED/i, /SIMONE/i, /BURATTI/i,
  /\.it\b/i, /https?:\/\//i, /crypto/i, /bitcoin/i,
  /\.com\b/i, /\.net\b/i, /\.org\b/i,
];

function isSpam(p) {
  const t = (p.nombre||'') + ' ' + (p.descripcion||'') + ' ' + (p.contacto||'');
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

function buildDocs(items) {
  const docs = [];
  for (const p of items) {
    if (isSpam(p)) continue;
    const coords = lookupLocation(p.ubicacion);
    if (!coords) continue;
    docs.push({
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
  }
  return docs;
}

async function seed() {
  console.log('🔌 Conectando...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Conectado');

  // Obtener total de páginas
  const first = await fetchPage(1);
  const totalPages = Math.min(first.totalPages, TO_PAGE);
  const startPage = Math.max(FROM_PAGE, 1);

  console.log(`📊 API: ${first.total.toLocaleString()} registros, ${totalPages} páginas`);
  console.log(`📥 Importando páginas ${startPage} → ${totalPages}\n`);

  let imported = 0, skipped = 0, spam = 0, noGeo = 0;
  const startTime = Date.now();
  const BATCH_SIZE = 200;

  // Obtener IDs existentes para saltar rápido
  const existingIds = new Set();
  const existingDocs = await Report.find({ source: 'external' }, 'externalId').lean();
  existingDocs.forEach(d => existingIds.add(d.externalId));
  console.log(`📋 ${existingIds.size} IDs ya existentes (se saltarán)\n`);

  let batch = [];

  for (let page = startPage; page <= totalPages; page++) {
    if (page % 10 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = Math.round(((page - startPage) / (totalPages - startPage)) * 100);
      process.stdout.write(`\n📄 ${page}/${totalPages} (${pct}%) · ${elapsed}s · +${imported} importados\n`);
    }

    let data;
    try { data = await fetchPage(page); }
    catch (e) { console.log(`❌ P${page}: ${e.message}`); await new Promise(r => setTimeout(r, 2000)); continue; }

    if (!data?.items?.length) { console.log(`P${page}: vacía`); break; }

    for (const p of data.items) {
      if (isSpam(p)) { spam++; continue; }
      if (existingIds.has(p.id)) { skipped++; continue; }

      const coords = lookupLocation(p.ubicacion);
      if (!coords) { noGeo++; continue; }

      batch.push({
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
        reportedAt: new Date(p.createdAt),
        flags: 0,
      });
      existingIds.add(p.id);

      if (batch.length >= BATCH_SIZE) {
        try {
          await Report.insertMany(batch, { ordered: false });
          imported += batch.length;
        } catch (e) {
          imported += e.insertedDocs?.length || 0;
        }
        batch = [];
      }
    }

    process.stdout.write('.');
    if (page < totalPages) await new Promise(r => setTimeout(r, 500));
  }

  // Insertar lote final
  if (batch.length > 0) {
    try {
      await Report.insertMany(batch, { ordered: false });
      imported += batch.length;
    } catch (e) {
      imported += e.insertedDocs?.length || 0;
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 60);
  const total = await Report.countDocuments({ source: 'external' });
  console.log(`\n\n✅ Completo en ${elapsed} min`);
  console.log(`   MongoDB: ${total.toLocaleString()} externos`);
  console.log(`   Importados: ${imported.toLocaleString()} | Saltados: ${skipped.toLocaleString()} | Spam: ${spam.toLocaleString()} | Sin geo: ${noGeo.toLocaleString()}`);
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
