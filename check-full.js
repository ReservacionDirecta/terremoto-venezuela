require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_PUBLIC_URL).then(async () => {
  const coll = mongoose.connection.db.collection('reports');
  const total = await coll.countDocuments();
  const ext = await coll.countDocuments({ source: 'external' });
  const app = await coll.countDocuments({ source: 'app' });
  const fotos = await coll.countDocuments({ fotoExterna: { $ne: null } });
  const spam = await coll.countDocuments({ nombre: /SIMONE|BURATTI|TRUSTED|infinityhotel/i });
  console.log('📊 Railway MongoDB:');
  console.log('   Total:', total);
  console.log('   Externos:', ext, '| Locales:', app);
  console.log('   Con fotos:', fotos);
  console.log('   Spam:', spam);
  
  // Último registro importado
  const last = await coll.findOne({ source: 'external' }, { sort: { reportedAt: -1 } });
  if (last) console.log('\n📅 Último:', last.nombre, '|', new Date(last.reportedAt).toLocaleString('es-VE'));
  
  // Primero
  const first = await coll.findOne({ source: 'external' }, { sort: { reportedAt: 1 } });
  if (first) console.log('📅 Primero:', first.nombre, '|', new Date(first.reportedAt).toLocaleString('es-VE'));
  
  mongoose.disconnect();
}).catch(e => console.error(e.message));
