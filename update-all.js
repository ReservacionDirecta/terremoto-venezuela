/**
 * Actualización masiva de registros existentes
 * Busca datos nuevos: fotos, estado, contacto, etc.
 * node update-all.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const Report = require('./models/Report');

const MONGO_URI=process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/terremoto-venezuela';
const API = 'https://desaparecidos-terremoto-api.theempire.tech';

const SPAM = [/infinityhotel/i,/TRUSTED/i,/SIMONE/i,/BURATTI/i,/\.it\b/i,/https?:\/\//i,/crypto/i,/bitcoin/i,/\.com\b/i,/\.net\b/i,/\.org\b/i];
function isSpam(p){return SPAM.some(r=>r.test((p.nombre||'')+' '+(p.descripcion||'')+' '+(p.contacto||'')));}

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    https.get(`${API}/api/personas?page=${page}&pageSize=50`, {timeout:15000}, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(e)}});
    }).on('error',reject);
  });
}

async function update() {
  await mongoose.connect(MONGO_URI, {serverSelectionTimeoutMS:15000});
  console.log('✅ Conectado\n');

  // Obtener total de páginas
  const first = await fetchPage(1);
  const totalPages = first.totalPages;
  console.log(`📊 API: ${first.total.toLocaleString()} registros, ${totalPages} páginas\n`);

  let updated = 0, inserted = 0, skipped = 0, spam = 0;
  const startTime = Date.now();

  for (let page = 1; page <= totalPages; page++) {
    if (page % 50 === 0) {
      const pct = Math.round((page/totalPages)*100);
      const elapsed = Math.round((Date.now()-startTime)/1000);
      process.stdout.write(`\n📄 ${page}/${totalPages} (${pct}%) · ${elapsed}s · upd:${updated} ins:${inserted}\n`);
    }

    let data;
    try { data = await fetchPage(page); }
    catch(e) { console.log(`❌ P${page}: ${e.message}`); await new Promise(r=>setTimeout(r,2000)); continue; }

    if (!data?.items?.length) break;

    for (const p of data.items) {
      if (isSpam(p)) { spam++; continue; }

      const existing = await Report.findOne({ externalId: p.id });
      
      if (existing) {
        // Actualizar campos faltantes o cambiados
        const updates = {};
        
        // Foto externa (si no la tiene)
        if (!existing.fotoExterna && p.foto && p.foto.startsWith('http')) {
          updates.fotoExterna = p.foto;
        }
        
        // Estado (si cambió de sin-contacto a localizado)
        if (p.estado === 'localizado' && !existing.encontrado) {
          updates.encontrado = true;
          updates.status = 'localizado';
          updates.fechaEncontrado = new Date(p.updatedAt);
        }
        
        // Contacto (si no lo tiene)
        if (!existing.contactoReportante && p.contacto) {
          updates.contactoReportante = (p.contacto || '').trim().slice(0, 200);
        }
        
        // Fecha de registro (si es diferente)
        if (!existing.reportedAt && p.createdAt) {
          updates.reportedAt = new Date(p.createdAt);
        }
        
        // Edad (si no la tiene)
        if (existing.edad == null && p.edad) {
          updates.edad = p.edad;
        }

        if (Object.keys(updates).length > 0) {
          await Report.updateOne({ _id: existing._id }, { $set: updates });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Nuevo registro — insertar
        const { lookupLocation } = require('./utils/geocode');
        const coords = lookupLocation(p.ubicacion);
        if (!coords) { skipped++; continue; }

        try {
          await Report.create({
            tipo:'desaparecido', source:'external', externalId:p.id,
            location:{type:'Point',coordinates:[coords[1],coords[0]]},
            nombre:(p.nombre||'').trim().slice(0,200),
            edad:p.edad||undefined,
            ultimaUbicacion:(p.ubicacion||'').trim().slice(0,500),
            description:(p.descripcion||'').trim().slice(0,500),
            contactoReportante:(p.contacto||'').trim().slice(0,200),
            fotoExterna:(p.foto&&p.foto.startsWith('http'))?p.foto:undefined,
            status:p.estado==='localizado'?'localizado':'pendiente',
            encontrado:p.estado==='localizado',
            fechaEncontrado:p.estado==='localizado'?new Date(p.updatedAt):null,
            reportedAt:new Date(p.createdAt),
            flags:0,
          });
          inserted++;
        } catch(e) { skipped++; }
      }
    }

    process.stdout.write('.');
    if (page < totalPages) await new Promise(r=>setTimeout(r,300));
  }

  const elapsed = Math.round((Date.now()-startTime)/60);
  const total = await Report.countDocuments({source:'external'});
  const fotos = await Report.countDocuments({source:'external', fotoExterna:{$ne:null}});
  const loc = await Report.countDocuments({source:'external', encontrado:true});
  
  console.log(`\n\n✅ Completo en ${elapsed} min`);
  console.log(`   MongoDB: ${total.toLocaleString()} externos`);
  console.log(`   Con fotos: ${fotos.toLocaleString()}`);
  console.log(`   Localizados: ${loc.toLocaleString()}`);
  console.log(`   Actualizados: ${updated.toLocaleString()} | Nuevos: ${inserted.toLocaleString()} | Saltados: ${skipped.toLocaleString()} | Spam: ${spam.toLocaleString()}`);
  await mongoose.disconnect();
}

update().catch(e=>{console.error('❌',e.message);process.exit(1);});
