import React from 'react';

export default function Stats({ stats, zones, loading }) {
  if (!stats && loading) {
    return <div className="loader-container"><div className="spinner" /><p style={{ color: '#9ca3af', marginTop: 12 }}>Cargando...</p></div>;
  }
  if (!stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No hay estadísticas disponibles.</div>;
  }

  const pctEncontrados = stats.desaparecidos > 0
    ? Math.round((stats.encontrados / stats.desaparecidos) * 100) : 0;
  const totalSurvivors = stats.severidad?.reduce((s, x) => s + x.totalSurvivors, 0) || 0;

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#fafafa' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 6, fontWeight: 700, color: '#1a1a2e' }}>
          📊 Panel de Emergencia
        </h2>
        <p style={{ color: '#6b7280', marginBottom: 28, fontSize: '0.88rem' }}>
          Datos en tiempo real del terremoto del 24 de junio de 2026 en Venezuela.
        </p>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 32 }}>
          <KPI label="Total Reportes" value={stats.total} color="#c53030" />
          <KPI label="Sobrevivientes Atrapados" value={stats.sobrevivientes} color="#dc2626" sub={`${totalSurvivors} personas`} />
          <KPI label="Desaparecidos" value={stats.desaparecidos} color="#f97316" />
          <KPI label="Localizados" value={stats.encontrados} color="#16a34a" sub={`${pctEncontrados}%`} />
          <KPI label="Sin Localizar" value={stats.noEncontrados} color="#eab308" />
          <KPI label="Zonas Críticas" value={zones.length} color="#dc2626" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Severidad */}
          {stats.severidad?.length > 0 && (
            <div>
              <SectionTitle>🔴 Sobrevivientes por Severidad</SectionTitle>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {stats.severidad.map(s => {
                  const colors = { alta: '#dc2626', media: '#f59e0b', baja: '#16a34a' };
                  return (
                    <div key={s._id} className="card-white" style={{
                      flex: 1, minWidth: 110, textAlign: 'center',
                      borderTop: `3px solid ${colors[s._id] || '#c53030'}`
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: colors[s._id] }}>{s.count}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' }}>{s._id}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{s.totalSurvivors} personas</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top 5 zonas críticas */}
          {zones.length > 0 && (
            <div>
              <SectionTitle>🎯 Zonas Más Críticas</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {zones.slice(0, 5).map((z, i) => (
                  <div key={i} className="card-white card-red" style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c53030', minWidth: 30 }}>#{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {z.center.lat.toFixed(3)}, {z.center.lng.toFixed(3)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                        {z.reportCount} rep · 🆘{z.sobrevivientes} 🔍{z.desaparecidos} · {z.radiusKm}km
                      </div>
                    </div>
                    <KPIBadge value={z.score} color={z.severity === 'crítica' ? '#dc2626' : z.severity === 'alta' ? '#f97316' : '#eab308'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top ubicaciones */}
          {stats.porUbicacion?.length > 0 && (
            <div>
              <SectionTitle>📍 Reportes por Zona</SectionTitle>
              <table>
                <thead><tr><th>Zona</th><th style={{ textAlign: 'right' }}>Reportes</th></tr></thead>
                <tbody>
                  {stats.porUbicacion.map(e => (
                    <tr key={e._id}>
                      <td>{e._id}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{e.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Datos del evento */}
          <div>
            <SectionTitle>⏱️ Datos del Sismo</SectionTitle>
            <div className="card-white" style={{ fontSize: '0.84rem', lineHeight: 1.9 }}>
              <p>📅 <b>24 Jun 2026, 18:04</b> UTC-4</p>
              <p>🌍 <b>Epicentro:</b> Yaracuy/Carabobo</p>
              <p>📏 <b>Magnitud:</b> 7.2 + 7.5 Mw (39s dif.)</p>
              <p>📐 <b>Profundidad:</b> 22 / 10 km</p>
              <p style={{ color: '#c53030' }}>💔 <b>+188</b> fallecidos · <b>+1,500</b> heridos · <b>+41,000</b> desaparecidos</p>
              <p>🏚️ <b>Afectados:</b> La Guaira, Caracas, Falcón, Miranda, Yaracuy, Carabobo, Aragua</p>
              <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#9ca3af' }}>
                Ref:{' '}
                <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer"
                   style={{ color: '#c53030', textDecoration: 'underline' }}>
                  desaparecidosterremotovenezuela.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, color, sub }) {
  return (
    <div className="card-white" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function KPIBadge({ value, color }) {
  return (
    <span style={{
      background: color, color: '#fff', fontWeight: 700, fontSize: '0.85rem',
      padding: '4px 10px', borderRadius: 8, minWidth: 36, textAlign: 'center'
    }}>{value}</span>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 10 }}>{children}</h3>;
}
