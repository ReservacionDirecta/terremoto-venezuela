const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }  // [lng, lat] — GeoJSON order
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  survivorsCount: {
    type: Number,
    required: true,
    min: 1,
    max: 999
  },
  severity: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'alta'
  },
  contactInfo: {
    type: String,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'atendido'],
    default: 'pendiente'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice geoespacial 2dsphere para consultas de proximidad
alertSchema.index({ location: '2dsphere' });
// Índice por fecha para consultas temporales
alertSchema.index({ reportedAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
