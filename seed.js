/**
 * Seed data — Terremotos Venezuela 2026
 * Epicentro: Yaracuy/Carabobo (10.35°N, -68.62°W)
 * node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terremoto-venezuela';

// Datos realistas basados en reportes del 24-25 Jun 2026
const reports = [
  // ═══ LA GUAIRA — Zona de Desastre ═══
  { tipo: 'sobreviviente', lat: 10.5990, lng: -66.9340, survivorsCount: 18, severity: 'alta',
    description: '18 personas atrapadas en edificio colapsado, Hotel Eduard\'s totalmente destruido',
    ultimaUbicacion: 'Hotel Eduard\'s, Catia La Mar' },
  { tipo: 'sobreviviente', lat: 10.5970, lng: -66.9320, survivorsCount: 8, severity: 'alta',
    description: 'Familiares atrapados en edificio residencial, calle principal de Catia La Mar',
    ultimaUbicacion: 'Catia La Mar, frente al malecón' },
  { tipo: 'desaparecido', lat: 10.6000, lng: -66.9370, nombre: 'Alazne Solabarrieta', edad: 65,
    ultimaUbicacion: 'La Guaira, zona del puerto' },
  { tipo: 'desaparecido', lat: 10.5980, lng: -66.9300, nombre: 'Carlos Eduardo Medina', edad: 42,
    ultimaUbicacion: 'Catia La Mar, sector Playa Grande' },
  { tipo: 'desaparecido', lat: 10.5950, lng: -66.9350, nombre: 'María Fernanda López', edad: 28,
    ultimaUbicacion: 'Edificio Las Palmeras, La Guaira' },
  { tipo: 'desaparecido', lat: 10.6010, lng: -66.9280, nombre: 'José Gregorio Hernández', edad: 55,
    ultimaUbicacion: 'Zona portuaria, La Guaira' },
  { tipo: 'sobreviviente', lat: 10.5940, lng: -66.9400, survivorsCount: 5, severity: 'alta',
    description: 'Niños y adultos atrapados en escuela colapsada',
    ultimaUbicacion: 'Escuela Bolivariana, sector El Cardonal' },

  // ═══ CARACAS — Edificios Colapsados ═══
  { tipo: 'sobreviviente', lat: 10.4960, lng: -66.8480, survivorsCount: 14, severity: 'alta',
    description: '14+ personas atrapadas en edificio de 14 pisos derrumbado en Chacao',
    ultimaUbicacion: 'Chacao, Av. Francisco de Miranda' },
  { tipo: 'sobreviviente', lat: 10.5080, lng: -66.8520, survivorsCount: 6, severity: 'alta',
    description: 'Familia atrapada en edificio colapsado en Altamira',
    ultimaUbicacion: 'Altamira, calle 3 con Av. San Juan Bosco' },
  { tipo: 'sobreviviente', lat: 10.5020, lng: -66.9180, survivorsCount: 4, severity: 'media',
    description: 'Personas atrapadas en estructura colapsada en La Candelaria',
    ultimaUbicacion: 'La Candelaria, cerca Plaza Bolívar' },
  { tipo: 'desaparecido', lat: 10.4950, lng: -66.8500, nombre: 'Andrés Escobar', edad: 60,
    ultimaUbicacion: 'Chacao, centro comercial' },
  { tipo: 'desaparecido', lat: 10.5070, lng: -66.8550, nombre: 'Luisa Martínez', edad: 34,
    ultimaUbicacion: 'Palos Grandes, Edificio Santa Ana' },
  { tipo: 'desaparecido', lat: 10.5000, lng: -66.9200, nombre: 'Rafael Antonio González', edad: 47,
    ultimaUbicacion: 'La Candelaria, bajando de El Silencio' },
  { tipo: 'desaparecido', lat: 10.5100, lng: -66.8480, nombre: 'Valentina Rojas', edad: 19,
    ultimaUbicacion: 'Altamira, cerca del Country Club' },

  // ═══ SAN FELIPE (Yaracuy) — EPICENTRO ═══
  { tipo: 'sobreviviente', lat: 10.3400, lng: -68.7400, survivorsCount: 12, severity: 'alta',
    description: 'Personas atrapadas en estructuras colapsadas en el centro de San Felipe',
    ultimaUbicacion: 'San Felipe, casco central' },
  { tipo: 'sobreviviente', lat: 10.3450, lng: -68.7350, survivorsCount: 3, severity: 'alta',
    description: 'Heridos en derrumbe de vivienda, zona rural cercana al epicentro',
    ultimaUbicacion: 'Zona rural, 23 km de San Felipe' },
  { tipo: 'desaparecido', lat: 10.3300, lng: -68.7500, nombre: 'Pedro José Castillo', edad: 38,
    ultimaUbicacion: 'San Felipe, Av. Libertador' },
  { tipo: 'desaparecido', lat: 10.3500, lng: -68.7200, nombre: 'Ana Cecilia Rodríguez', edad: 52,
    ultimaUbicacion: 'Municipio San Felipe, sector El Fuerte' },
  { tipo: 'desaparecido', lat: 10.3420, lng: -68.7450, nombre: 'Javier Alejandro Páez', edad: 25,
    ultimaUbicacion: 'Cerca del hospital central de San Felipe' },

  // ═══ PUERTO CABELLO (Carabobo) ═══
  { tipo: 'sobreviviente', lat: 10.4700, lng: -68.0100, survivorsCount: 7, severity: 'alta',
    description: 'Trabajadores atrapados en instalaciones portuarias colapsadas',
    ultimaUbicacion: 'Puerto Cabello, muelle principal' },
  { tipo: 'desaparecido', lat: 10.4750, lng: -68.0050, nombre: 'Miguel Ángel Colmenares', edad: 44,
    ultimaUbicacion: 'Puerto Cabello, zona naval' },

  // ═══ VALENCIA (Carabobo) ═══
  { tipo: 'sobreviviente', lat: 10.1800, lng: -68.0000, survivorsCount: 5, severity: 'media',
    description: 'Personas atrapadas en centro comercial con daños estructurales',
    ultimaUbicacion: 'Valencia, Av. Bolívar Norte' },
  { tipo: 'desaparecido', lat: 10.1850, lng: -67.9950, nombre: 'Gabriela Torres', edad: 31,
    ultimaUbicacion: 'Valencia, Urbanización El Viñedo' },
  { tipo: 'desaparecido', lat: 10.1750, lng: -68.0100, nombre: 'Luis Alberto Ramírez', edad: 27,
    ultimaUbicacion: 'Naguanagua, centro comercial' },

  // ═══ BARQUISIMETO (Lara) ═══
  { tipo: 'sobreviviente', lat: 10.0700, lng: -69.3200, survivorsCount: 9, severity: 'alta',
    description: 'Familias atrapadas en urbanización con múltiples viviendas colapsadas',
    ultimaUbicacion: 'Barquisimeto, Urb. El Obelisco' },
  { tipo: 'desaparecido', lat: 10.0750, lng: -69.3150, nombre: 'Carmen Elena Pérez', edad: 58,
    ultimaUbicacion: 'Barquisimeto, cerca Catedral' },
  { tipo: 'desaparecido', lat: 10.0650, lng: -69.3300, nombre: 'Daniel José Jiménez', edad: 22,
    ultimaUbicacion: 'Barquisimeto, zona industrial' },

  // ═══ MARACAY (Aragua) ═══
  { tipo: 'sobreviviente', lat: 10.2500, lng: -67.6000, survivorsCount: 4, severity: 'media',
    description: 'Personas en edificio agrietado en Urb. Andrés Bello',
    ultimaUbicacion: 'Maracay, Urbanización Andrés Bello' },
  { tipo: 'desaparecido', lat: 10.2480, lng: -67.5950, nombre: 'Rosa Amelia Figueroa', edad: 63,
    ultimaUbicacion: 'Maracay, cerca Base Sucre' },

  // ═══ FALCÓN — Estado afectado ═══
  { tipo: 'sobreviviente', lat: 10.9700, lng: -68.3000, survivorsCount: 15, severity: 'alta',
    description: '32 hospitalizados y 15 atrapados en zona rural del estado Falcón',
    ultimaUbicacion: 'Carretera Morón-Coro, estado Falcón' },
  { tipo: 'desaparecido', lat: 10.9600, lng: -68.3100, nombre: 'Oscar David Romero', edad: 49,
    ultimaUbicacion: 'Tucacas, Falcón' },
  { tipo: 'desaparecido', lat: 10.9800, lng: -68.2800, nombre: 'Beatriz Elena Sánchez', edad: 36,
    ultimaUbicacion: 'Vía a Chichiriviche, Falcón' },

  // ═══ MIRANDA ═══
  { tipo: 'desaparecido', lat: 10.4800, lng: -66.5400, nombre: 'Familia González (4 personas)', edad: undefined,
    ultimaUbicacion: 'Guatire, sector Valle Arriba' },
  { tipo: 'sobreviviente', lat: 10.5200, lng: -66.8000, survivorsCount: 3, severity: 'baja',
    description: 'Personas aisladas por deslizamiento en carretera',
    ultimaUbicacion: 'Petare, sector El Hatillo' },

  // ═══ Puertos/Aeropuerto ═══
  { tipo: 'sobreviviente', lat: 10.6030, lng: -66.9900, survivorsCount: 22, severity: 'alta',
    description: 'Pasajeros y personal atrapados en Aeropuerto de Maiquetía con techo colapsado',
    ultimaUbicacion: 'Aeropuerto Internacional Simón Bolívar, Maiquetía' },

  // ═══ Puntos aislados ═══
  { tipo: 'desaparecido', lat: 10.2000, lng: -67.5500, nombre: 'Marcos Tulio Díaz', edad: 71,
    ultimaUbicacion: 'Carretera Maracay-Valencia' },
  { tipo: 'desaparecido', lat: 10.5500, lng: -66.9500, nombre: 'Inés Margarita Castro', edad: 45,
    ultimaUbicacion: 'Carretera vieja Caracas-La Guaira' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB conectado');

  await Report.deleteMany({});
  console.log('🧹 Colección limpiada');

  const inserted = [];
  for (const r of reports) {
    const doc = await Report.create({
      tipo: r.tipo,
      location: { type: 'Point', coordinates: [r.lng, r.lat] },
      nombre: r.nombre || undefined,
      edad: r.edad || undefined,
      ultimaUbicacion: r.ultimaUbicacion || '',
      description: r.description || undefined,
      survivorsCount: r.survivorsCount || undefined,
      severity: r.severity || undefined,
      contactoReportante: '',
      telefonoReportante: '',
      status: 'pendiente',
      encontrado: false,
      reportedAt: new Date(Date.now() - Math.random() * 86400000) // últimas 24h
    });
    inserted.push(doc);
  }

  // Marcar algunos como localizados
  const localizados = inserted.filter((_, i) => i % 5 === 0); // cada 5to
  for (const r of localizados) {
    if (r.tipo === 'desaparecido') {
      await Report.findByIdAndUpdate(r._id, { encontrado: true, status: 'localizado', fechaEncontrado: new Date() });
    }
  }

  console.log(`🌱 ${inserted.length} reportes insertados`);
  console.log(`   ✅ ${localizados.length} marcados como localizados`);

  // Stats
  const surv = inserted.filter(r => r.tipo === 'sobreviviente').length;
  const desp = inserted.filter(r => r.tipo === 'desaparecido').length;
  console.log(`   🆘 ${surv} sobrevivientes atrapados`);
  console.log(`   🔍 ${desp} personas desaparecidas`);

  console.log('\n📍 Zonas de alta densidad creadas:');
  console.log('   🔴 La Guaira (7 reportes) — zona de desastre');
  console.log('   🔴 Caracas (7 reportes) — Chacao, Altamira, La Candelaria');
  console.log('   🔴 San Felipe / Yaracuy (5 reportes) — epicentro');
  console.log('   🟠 Barquisimeto (3 reportes) — daños estructurales');
  console.log('   🟡 Valencia / Puerto Cabello (4 reportes)');

  await mongoose.disconnect();
  console.log('\n✅ Listo! Inicia con: node server.js');
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
