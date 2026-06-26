import React, { useState } from 'react';

export default function AlertForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    lat: '',
    lng: '',
    description: '',
    survivorsCount: '',
    severity: 'alta',
    contactInfo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador');
      return;
    }
    setUseCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
        setUseCurrentLocation(false);
      },
      err => {
        alert('Error obteniendo ubicación: ' + err.message);
        setUseCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.lat || !form.lng || !form.description || !form.survivorsCount) {
      alert('Completa todos los campos requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        description: form.description,
        survivorsCount: parseInt(form.survivorsCount),
        severity: form.severity,
        contactInfo: form.contactInfo
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ margin: 0, color: '#f8fafc' }}>🚨 Reportar Nueva Alerta</h2>

      {/* Ubicación */}
      <div>
        <label style={labelStyle}>📍 Ubicación (lat, lng) *</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input name="lat" type="number" step="any" placeholder="Latitud"
                 value={form.lat} onChange={handleChange}
                 style={inputStyle} required />
          <input name="lng" type="number" step="any" placeholder="Longitud"
                 value={form.lng} onChange={handleChange}
                 style={inputStyle} required />
        </div>
        <button type="button" onClick={handleGetLocation}
                disabled={useCurrentLocation}
                style={{
                  marginTop: 6, padding: '6px 12px', border: '1px solid #475569',
                  borderRadius: 6, background: 'transparent', color: '#60a5fa',
                  cursor: 'pointer', fontSize: '0.8rem'
                }}>
          {useCurrentLocation ? '⏳ Obteniendo...' : '📱 Usar mi ubicación actual'}
        </button>
      </div>

      {/* Descripción */}
      <div>
        <label style={labelStyle}>📝 Descripción *</label>
        <textarea name="description" rows={3} maxLength={500}
                  value={form.description} onChange={handleChange}
                  placeholder="Ej: Familia de 4 atrapada en edificio colapsado, esquina Av. Principal..."
                  style={{ ...inputStyle, resize: 'vertical' }} required />
        <small style={{ color: '#64748b' }}>{form.description.length}/500</small>
      </div>

      {/* Número de sobrevivientes */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>👥 N° Sobrevivientes *</label>
          <input name="survivorsCount" type="number" min="1" max="999"
                 value={form.survivorsCount} onChange={handleChange}
                 style={inputStyle} required />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>⚠️ Severidad</label>
          <select name="severity" value={form.severity} onChange={handleChange}
                  style={inputStyle}>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <label style={labelStyle}>📞 Contacto (opcional)</label>
        <input name="contactInfo" type="text"
               value={form.contactInfo} onChange={handleChange}
               placeholder="Teléfono o referencia de contacto"
               style={inputStyle} />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" onClick={onCancel}
                style={{ ...btnStyle, background: '#334155', color: '#cbd5e1' }}>
          Cancelar
        </button>
        <button type="submit" disabled={submitting}
                style={{ ...btnStyle, background: '#dc2626', color: '#fff' }}>
          {submitting ? '⏳ Enviando...' : '🚨 Reportar Alerta'}
        </button>
      </div>
    </form>
  );
}

const labelStyle = {
  display: 'block', marginBottom: 4, color: '#94a3b8',
  fontSize: '0.8rem', fontWeight: 600
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0',
  fontSize: '0.9rem'
};

const btnStyle = {
  padding: '10px 20px', border: 'none', borderRadius: 8,
  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
};
