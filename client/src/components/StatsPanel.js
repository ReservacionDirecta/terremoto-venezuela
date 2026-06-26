import React from 'react';

export default function StatsPanel({ stats, zones }) {
  if (!stats) return <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/></div>;
  const pct = stats.desaparecidos > 0 ? Math.round((stats.encontrados / stats.desaparecidos) * 100) : 0;
  const totalSurv = stats.severidad?.reduce((s, x) => s + x.totalSurvivors, 0) || 0;

  return (
    <div className="overflow-auto h-full" style={{padding:16}}>
      <h2 className="fw-700 mb-3">📊 Panel de Emergencia</h2>

      {/* KPI */}
      <div className="grid-3 mb-4">
        <KPI v={stats.total} l="Reportes" c="#111" />
        <KPI v={stats.sobrevivientes} l="🆘 Atrapados" c="#dc2626" sub={`${totalSurv} pers.`} />
        <KPI v={stats.desaparecidos} l="🔍 Desap." c="#2563eb" />
        <KPI v={stats.encontrados} l="Localizados" c="#16a34a" sub={`${pct}%`} />
        <KPI v={stats.noEncontrados} l="Sin localizar" c="#eab308" />
        <KPI v={zones.length} l="Zonas críticas" c="#dc2626" />
      </div>

      {/* Severidad */}
      {stats.severidad?.length > 0 && (
        <div className="mb-4">
          <h3 className="fw-700 fs-sm mb-2">🔴 Sobrevivientes por Severidad</h3>
          <div className="flex gap-2 flex-wrap">
            {stats.severidad.map(s => {
              const cs = { alta: '#dc2626', media: '#eab308', baja: '#2563eb' };
              return (
                <div key={s._id} className="card" style={{flex:1,minWidth:100,textAlign:'center',borderTop:`3px solid ${cs[s._id]}`}}>
                  <div className="kpi-value" style={{color:cs[s._id]}}>{s.count}</div>
                  <div className="kpi-label">{s._id}</div>
                  <div className="fs-xs text-gray">{s.totalSurvivors} personas</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top zonas */}
      <div className="mb-4">
        <h3 className="fw-700 fs-sm mb-2">📍 Reportes por Zona</h3>
        {stats.porUbicacion?.length > 0 ? (
          <table className="tbl">
            <thead><tr><th>Zona</th><th style={{textAlign:'right'}}>Reportes</th></tr></thead>
            <tbody>
              {stats.porUbicacion.map(e => (
                <tr key={e._id}><td>{e._id}</td><td style={{textAlign:'right',fontWeight:700}}>{e.count}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="fs-sm text-gray">Sin datos</p>}
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="fw-700 fs-sm mb-2">⏱️ Datos del Sismo</h3>
        <div className="fs-sm" style={{lineHeight:1.8}}>
          <p>📅 <b>24 Jun 2026, 18:04</b> UTC-4</p>
          <p>🌍 <b>Epicentro:</b> Yaracuy/Carabobo</p>
          <p>📏 <b>Magnitud:</b> 7.2 + 7.5 Mw</p>
          <p className="text-red fw-700">💔 +188 fallecidos · +1,500 heridos · +41,000 desaparecidos</p>
          <p className="fs-xs text-gray mt-2">
            Ref: <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer">desaparecidosterremotovenezuela.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function KPI({ v, l, c, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-value" style={{color:c}}>{v}</div>
      <div className="kpi-label">{l}</div>
      {sub && <div className="fs-xs text-gray">{sub}</div>}
    </div>
  );
}
