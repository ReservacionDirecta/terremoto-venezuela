require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

const URI=process.env.MONGO_PUBLIC_URL;
if (!URI) { console.error('No MONGO_URL'); process.exit(1); }

const reports = [
  { tipo:'sobreviviente',lat:10.5990,lng:-66.9340,survivorsCount:18,severity:'alta',description:'18 personas atrapadas en edificio colapsado, Hotel Eduards totalmente destruido',ultimaUbicacion:'Hotel Eduards, Catia La Mar'},
  { tipo:'sobreviviente',lat:10.5970,lng:-66.9320,survivorsCount:8,severity:'alta',description:'Familiares atrapados en edificio residencial, calle principal de Catia La Mar',ultimaUbicacion:'Catia La Mar, frente al malecon'},
  { tipo:'desaparecido',lat:10.6000,lng:-66.9370,nombre:'Alazne Solabarrieta',edad:65,ultimaUbicacion:'La Guaira, zona del puerto'},
  { tipo:'sobreviviente',lat:10.4960,lng:-66.8480,survivorsCount:14,severity:'alta',description:'14+ personas atrapadas en edificio de 14 pisos derrumbado en Chacao',ultimaUbicacion:'Chacao, Av. Francisco de Miranda'},
  { tipo:'sobreviviente',lat:10.5080,lng:-66.8520,survivorsCount:6,severity:'alta',description:'Familia atrapada en edificio colapsado en Altamira',ultimaUbicacion:'Altamira, calle 3 con Av. San Juan Bosco'},
  { tipo:'desaparecido',lat:10.4950,lng:-66.8500,nombre:'Andres Escobar',edad:60,ultimaUbicacion:'Chacao, centro comercial'},
  { tipo:'desaparecido',lat:10.5070,lng:-66.8550,nombre:'Luisa Martinez',edad:34,ultimaUbicacion:'Palos Grandes, Edificio Santa Ana'},
  { tipo:'sobreviviente',lat:10.3400,lng:-68.7400,survivorsCount:12,severity:'alta',description:'Personas atrapadas en estructuras colapsadas en el centro de San Felipe',ultimaUbicacion:'San Felipe, casco central'},
  { tipo:'desaparecido',lat:10.3300,lng:-68.7500,nombre:'Pedro Jose Castillo',edad:38,ultimaUbicacion:'San Felipe, Av. Libertador'},
  { tipo:'sobreviviente',lat:10.4700,lng:-68.0100,survivorsCount:7,severity:'alta',description:'Trabajadores atrapados en instalaciones portuarias colapsadas',ultimaUbicacion:'Puerto Cabello, muelle principal'},
  { tipo:'desaparecido',lat:10.4750,lng:-68.0050,nombre:'Miguel Angel Colmenares',edad:44,ultimaUbicacion:'Puerto Cabello, zona naval'},
  { tipo:'sobreviviente',lat:10.1800,lng:-68.0000,survivorsCount:5,severity:'media',description:'Personas atrapadas en centro comercial con danos estructurales',ultimaUbicacion:'Valencia, Av. Bolivar Norte'},
  { tipo:'sobreviviente',lat:10.0700,lng:-69.3200,survivorsCount:9,severity:'alta',description:'Familias atrapadas en urbanizacion con multiples viviendas colapsadas',ultimaUbicacion:'Barquisimeto, Urb. El Obelisco'},
  { tipo:'desaparecido',lat:10.0750,lng:-69.3150,nombre:'Carmen Elena Perez',edad:58,ultimaUbicacion:'Barquisimeto, cerca Catedral'},
  { tipo:'sobreviviente',lat:10.9700,lng:-68.3000,survivorsCount:15,severity:'alta',description:'32 hospitalizados y 15 atrapados en zona rural del estado Falcon',ultimaUbicacion:'Carretera Moron-Coro, estado Falcon'},
  { tipo:'sobreviviente',lat:10.6030,lng:-66.9900,survivorsCount:22,severity:'alta',description:'Pasajeros y personal atrapados en Aeropuerto de Maiquetia con techo colapsado',ultimaUbicacion:'Aeropuerto Internacional Simon Bolivar, Maiquetia'},
];

async function seed() {
  await mongoose.connect(URI);
  console.log('✅ Conectado');
  
  // Solo insertar si no hay locales
  const existing = await Report.countDocuments({ source: 'app' });
  if (existing > 0) { console.log('Ya hay', existing, 'locales. Saltando.'); mongoose.disconnect(); return; }
  
  let n = 0;
  for (const r of reports) {
    await Report.create({
      tipo: r.tipo, source: 'app',
      location: { type: 'Point', coordinates: [r.lng, r.lat] },
      nombre: r.nombre || undefined, edad: r.edad || undefined,
      ultimaUbicacion: r.ultimaUbicacion || '',
      description: r.description || undefined,
      survivorsCount: r.survivorsCount || undefined,
      severity: r.severity || undefined,
      status: 'pendiente', encontrado: false, flags: 0,
      reportedAt: new Date('2026-06-24T22:04:00-04:00'),
    });
    n++;
  }
  console.log('✅', n, 'reportes locales insertados');
  mongoose.disconnect();
}
seed().catch(e => { console.error(e.message); process.exit(1); });
