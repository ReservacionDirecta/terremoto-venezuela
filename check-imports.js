require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_PUBLIC_URL).then(async () => {
  const coll = mongoose.connection.db.collection('reports');
  const samples = await coll.find({ source: 'external' }).limit(5).toArray();
  samples.forEach(r => {
    console.log('---');
    console.log('Nombre:', r.nombre);
    console.log('Registrado:', r.reportedAt ? new Date(r.reportedAt).toLocaleString('es-VE') : 'NO');
    console.log('Contacto:', r.contactoReportante || 'NO');
    console.log('Ubicación:', r.ultimaUbicacion);
    console.log('Estado:', r.encontrado ? 'localizado' : 'sin contacto');
  });
  const conFecha = await coll.countDocuments({ source: 'external', reportedAt: { $ne: null } });
  const sinFecha = await coll.countDocuments({ source: 'external', reportedAt: null });
  const conContacto = await coll.countDocuments({ source: 'external', contactoReportante: { $ne: '' } });
  const sinContacto = await coll.countDocuments({ source: 'external', contactoReportante: '' });
  console.log('\n📊 Stats:', conFecha, 'con fecha |', sinFecha, 'sin fecha |', conContacto, 'con contacto |', sinContacto, 'sin contacto');
  mongoose.disconnect();
}).catch(e => console.error(e.message));
