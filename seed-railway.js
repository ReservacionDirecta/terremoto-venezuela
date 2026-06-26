/**
 * Seed Railway MongoDB con datos reales de desaparecidosterremotovenezuela.com
 * Uso: node seed-railway.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const { geocode } = require('./utils/geocode');
const Report = require('./models/Report');

const MONGO_URI=process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terremoto-venezuela';
if (!MONGO_URI) { console.error('❌ Configura MONGO_URL'); process.exit(1); }

const SPAM = [/infinityhotel/i,/TRUSTED/i,/SIMONE/i,/BURATTI/i,/\.it\b/i,/https?:\/\//i,/crypto/i,/bitcoin/i,/\.com\b/i,/\.net\b/i,/\.org\b/i];
function isSpam(p){return SPAM.some(r=>r.test(p.nombre+' '+p.descripcion+' '+(p.contacto||'')));}
function fetchPage(page){return new Promise((resolve,reject)=>{https.get(`https://desaparecidos-terremoto-api.theempire.tech/api/personas?page=${page}&pageSize=50`,{timeout:15000},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(e)}})}).on('error',reject)});}

async function seed(){
  await mongoose.connect(MONGO_URI,{serverSelectionTimeoutMS:15000});
  console.log('✅ Conectado');
  const existing = await Report.countDocuments({source:'external'});
  console.log('📊 Existentes:',existing);
  let imp=0,skip=0,spam=0,ng=0;
  
  // Obtener total de páginas
  const first = await fetchPage(1);
  const totalPages = Math.min(first.totalPages, parseInt(process.argv[2]) || 1169);
  console.log(`📥 ${totalPages} páginas\n`);
  
  for(let p=1;p<=totalPages;p++){
    if(p%50===0) process.stdout.write(`\n📄 ${p}/${totalPages} · +${imp}\n`);
    let d;try{d=await fetchPage(p);}catch(e){console.log('❌',e.message);break;}
    if(!d?.items?.length) break;
    let pg=0;
    for(const i of d.items){
      if(isSpam(i)){spam++;continue;}
      if(await Report.findOne({externalId:i.id})){skip++;continue;}
      const c=await geocode(i.ubicacion);if(!c){ng++;continue;}
      try{await Report.create({tipo:'desaparecido',source:'external',externalId:i.id,location:{type:'Point',coordinates:[c[1],c[0]]},nombre:(i.nombre||'').trim().slice(0,200),edad:i.edad||undefined,ultimaUbicacion:(i.ubicacion||'').trim().slice(0,500),description:(i.descripcion||'').trim().slice(0,500),contactoReportante:(i.contacto||'').trim().slice(0,200),fotoExterna:(i.foto&&i.foto.startsWith('http'))?i.foto:undefined,status:i.estado==='localizado'?'localizado':'pendiente',encontrado:i.estado==='localizado',fechaEncontrado:i.estado==='localizado'?new Date(i.updatedAt):null,reportedAt:new Date(i.createdAt),flags:0});imp++;pg++;}catch(e){}
    }
    process.stdout.write('.');pg&&process.stdout.write(`+${pg}`);
    if(p<totalPages) await new Promise(r=>setTimeout(r,500));
  }
  console.log(`\n\n✅ Importados:${imp} | Saltados:${skip} | Spam:${spam} | Sin geo:${ng}`);
  await mongoose.disconnect();
}
seed().catch(e=>{console.error('❌',e.message);process.exit(1);});
