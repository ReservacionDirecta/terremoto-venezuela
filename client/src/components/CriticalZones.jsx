import React from 'react';

const sevStyle = {
  crítica: { border:'border-l-red-600', color:'text-red-600', bg:'bg-red-50' },
  alta:   { border:'border-l-yellow-500', color:'text-yellow-700', bg:'bg-yellow-50' },
  media:  { border:'border-l-blue-600', color:'text-blue-600', bg:'bg-blue-50' }
};

export default function CriticalZones({ zones }) {
  if (!zones.length) return <div className="py-15 text-center text-muted"><h2>🎯 Zonas Críticas</h2><p>Aún no hay zonas detectadas.</p></div>;

  return (
    <div className="overflow-y-auto h-full p-4">
      <h2 className="font-bold mb-2">🎯 Zonas Críticas ({zones.length})</h2>
      <p className="text-sm text-txt3 mb-3">Algoritmo de densidad geográfica. Score basado en cantidad de reportes, sobrevivientes y severidad.</p>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
        {zones.map((z, i) => {
          const s = sevStyle[z.severity] || sevStyle.media;
          const borderColor = z.severity==='crítica'?'#dc2626':z.severity==='alta'?'#eab308':'#2563eb';
          const textColor = z.severity==='crítica'?'#dc2626':z.severity==='alta'?'#ca8a04':'#2563eb';
          return (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative"
                 style={{borderLeft:`4px solid ${borderColor}`}}>
              <span className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
                #{i+1} {z.severity}
              </span>

              <div className="mb-3">
                <span className="text-3xl font-extrabold leading-none" style={{color:textColor}}>{z.score}</span>
                <span className="text-sm text-txt3">/100</span>
                <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{background:'var(--color-border)'}}>
                  <div className="h-full rounded-full" style={{width:`${z.score}%`,background:textColor}} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                  <div className="text-2xl font-bold">{z.reportCount}</div>
                  <div className="text-xs text-txt3 uppercase tracking-wide mt-1">Reportes</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{z.sobrevivientes}</div>
                  <div className="text-xs text-txt3 uppercase tracking-wide mt-1">🆘 Atrapados</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{z.desaparecidos}</div>
                  <div className="text-xs text-txt3 uppercase tracking-wide mt-1">🔍 Desap.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-2 text-sm">
                <div><span className="text-txt3">Sobrevivientes:</span> <b>{z.totalSurvivors}</b></div>
                <div><span className="text-txt3">Radio:</span> <b>{z.radiusKm} km</b></div>
              </div>

              <div className="text-xs text-txt3 mb-2">{z.center.lat.toFixed(4)}, {z.center.lng.toFixed(4)}</div>

              <a href={`https://maps.google.com?q=${z.center.lat},${z.center.lng}`} target="_blank" rel="noreferrer"
                 className="text-blue-600 text-xs font-medium">📍 Google Maps</a>

              {z.reports?.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm text-txt3 cursor-pointer">📋 {z.reports.length} reportes</summary>
                  <div className="max-h-45 overflow-y-auto mt-1.5">
                    {z.reports.map(r => (
                      <div key={r._id} className="flex justify-between text-xs py-1 border-b border-border">
                        <span>{r.tipo==='desaparecido'?`🔍 ${r.nombre||''}`:`🆘 ${r.description?.slice(0,40)}`}</span>
                        <span className="font-bold">{r.tipo==='sobreviviente'?`👥${r.survivorsCount}`:r.encontrado?'✅':'⚠️'}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
