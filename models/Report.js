const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Tipo de reporte
  tipo: {
    type: String,
    enum: ['sobreviviente', 'desaparecido'],
    required: true
  },
  // Campos para desaparecidos
  nombre: {
    type: String,
    trim: true,
    maxlength: 200
    // requerido solo si tipo='desaparecido' (validado en ruta)
  },
  edad: {
    type: Number,
    min: 0,
    max: 120
  },
  // Ubicación GeoJSON — [lng, lat]
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  // Dirección / referencia de ubicación en texto
  ultimaUbicacion: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Descripción (para sobrevivientes atrapados)
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Campos para sobrevivientes
  survivorsCount: {
    type: Number,
    min: 1,
    max: 999
  },
  severity: {
    type: String,
    enum: ['alta', 'media', 'baja']
  },
  // Contacto del reportante
  contactoReportante: {
    type: String,
    trim: true,
    maxlength: 200
  },
  telefonoReportante: {
    type: String,
    trim: true,
    maxlength: 50
  },
  // Estado del reporte
  status: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'atendido', 'localizado'],
    default: 'pendiente'
  },
  // Para desaparecidos: si ya fue localizado
  encontrado: {
    type: Boolean,
    default: false
  },
  fechaEncontrado: {
    type: Date
  },
  // Foto del desaparecido (base64, máx ~500KB después de compresión)
  foto: {
    type: String,
    maxlength: 700000 // ~500KB en base64
  },
  fotoContentType: {
    type: String,
    maxlength: 50
  },
  // Flags de la comunidad (reportes de error/abuso)
  flags: {
    type: Number,
    default: 0,
    min: 0
  },
  // Metadata
  fuente: {
    type: String,
    enum: ['app', 'web', 'telegram', 'whatsapp'],
    default: 'web'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ tipo: 1, reportedAt: -1 });
reportSchema.index({ tipo: 1, encontrado: 1 });
reportSchema.index({ nombre: 'text', ultimaUbicacion: 'text', description: 'text' });

module.exports = mongoose.model('Report', reportSchema);
