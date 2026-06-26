import React from 'react';

export default function Stats({ stats, zones, loading }) {
  if (!stats && loading) {
    return <div className="flex items-center justify-center flex-col p-10"><div className="w-7 h-7 border-2 border-border2 border-t-red-600 rounded-full animate-spin" /><p className="text-muted mt-3">Cargando...</p></div>;
  }
  if (!stats) {
    return <div className="p-10 text-center text-muted">No hay estadísticas disponibles.</div>;
  }

  const pctEncontrados = stats.desaparecidos > 0 ? Math.round((stats.encontrados / stats.desaparecidos) * 100) : 0;
  const totalSurvivors = stats.severidad?.reduce((s, x) => s + x.totalSurvivors, 0) || 0;

  return (
    <div className="overflow-y-auto h-full p-6" style={{background:'var(--color-bg)'}}>
      <div className="max-w-5xl mx-auto">
        <h2 className="font-bold mb-1.5">📊 Panel de Emergencia</h2>
        <p className="text-sm text-txt3 mb-7">Datos en tiempo real del terremoto del 24 de junio de 2026 en Venezuela.</p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3.5 mb-8">
          <KPI label="Total Reportes" value={stats.total} color="#c53030" />
          <KPI label="Sobrevivientes Atrapados" value={stats.sobrevivientes} color="#dc2626" sub={`${totalSurvivors} personas`} />
          <KPI label="Desaparecidos" value={stats.desaparecidos} color="#f97316" />
          <KPI label="Localizados" value={stats.encontrados} color="#16a34a" sub={`${pctEncontrados}%`} />
          <KPI label="Sin Localizar" value={stats.noEncontrados} color="#eab308" />
          <KPI label="Zonas Críticas" value={zones.length} color="#dc2626" />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          {stats.severidad?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-txt2 mb-2.5">🔴 Sobrevivientes por Severidad</h3>
              <div className="flex gap-2.5 flex-wrap">
                {stats.severidad.map(s => {
                  const colors = { alta: '#dc2626', media: '#f59e0b', baja: '#16a34a' };
                  return (
                    <div key={s._id} className="flex-1 min-w-28 text-center bg-surface border border-border rounded-2xl p-4 shadow-sm"
                         style={{borderTop:`3px solid ${colors[s._id] || '#c53030'}`}}>
                      <div className="text-3xl font-extrabold" style={{color:colors[s._id]}}>{s.count}</div>
                      <div className="text-xs text-txt3 uppercase">{s._id}</div>
                      <div className="text-xs text-muted">{s.totalSurvivors} personas</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {zones.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-txt2 mb-2.5">🎯 Zonas Más Críticas</h3>
              <div className="flex flex-col gap-2">
                {zones.slice(0, 5).map((z, i) => (
                  <div key={i} className="bg-surface border border-border rounded-2xl p-3 shadow-sm flex items-center gap-3.5 border-l-4 border-l-red-600">
                    <span className="text-xl font-extrabold text-red-700 min-w-8">#{i+1}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{z.center.lat.toFixed(3)}, {z.center.lng.toFixed(3)}</div>
                      <div className="text-xs text-txt3">{z.reportCount} rep · 🆘{z.sobrevivientes} 🔍{z.desaparecidos} · {z.radiusKm}km</div>
                    </div>
                    <span className="text-white font-bold text-sm px-2.5 py-1 rounded-lg min-w-9 text-center"
                          style={{background:z.severity === 'crítica' ? '#dc2626' : z.severity === 'alta' ? '#f97316' : '#eab308'}}>{z.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.porUbicacion?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-txt2 mb-2.5">📍 Reportes por Zona</h3>
              <table className="w-full border-collapse text-sm">
                <thead><tr><th className="text-left p-2.5 border-b border-border">Zona</th><th className="text-right p-2.5 border-b border-border">Reportes</th></tr></thead>
                <tbody>
                  {stats.porUbicacion.map(e => (
                    <tr key={e._id}><td className="p-2.5 border-b border-border">{e._id}</td><td className="p-2.5 border-b border-border text-right font-bold">{e.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-txt2 mb-2.5">⏱️ Datos del Sismo</h3>
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm text-sm leading-loose">
              <p>📅 <b>24 Jun 2026, 18:04</b> UTC-4</p>
              <p>🌍 <b>Epicentro:</b> Yaracuy/Carabobo</p>
              <p>📏 <b>Magnitud:</b> 7.2 + 7.5 Mw (39s dif.)</p>
              <p>📐 <b>Profundidad:</b> 22 / 10 km</p>
              <p className="text-red-600">💔 <b>+188</b> fallecidos · <b>+1,500</b> heridos · <b>+41,000</b> desaparecidos</p>
              <p>🏚️ <b>Afectados:</b> La Guaira, Caracas, Falcón, Miranda, Yaracuy, Carabobo, Aragua</p>
              <p className="mt-2 text-xs text-muted">
                Ref: <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer" className="text-red-600 underline">desaparecidosterremotovenezuela.com</a>
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
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm text-center">
      <div className="text-3xl font-extrabold leading-none" style={{color}}>{value}</div>
      <div className="text-xs text-txt3 mt-1">{label}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
