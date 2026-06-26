import React from 'react';

const sevStyle = {
  crítica: { border:'#dc2626', color:'#dc2626', bg:'#fef2f2' },
  alta:   { border:'#eab308', color:'#ca8a04', bg:'#fefce8' },
  media:  { border:'#2563eb', color:'#2563eb', bg:'#eff6ff' }
};

export default function CriticalZones({ zones }) {
  if (!zones.length) return <div className="empty-state"><h2>🎯 Zonas Críticas</h2><p>Aún no hay zonas detectadas.</p></div>;

  return (
    <div className="overflow-auto h-full" style={{padding:'16px'}}>
      <h2 className="fw-700 mb-2">🎯 Zonas Críticas ({zones.length})</h2>
      <p className="fs-sm text-gray mb-3">Algoritmo de densidad geográfica. Score basado en cantidad de reportes, sobrevivientes y severidad.</p>

      <div className="grid-cards">
        {zones.map((z, i) => {
          const s = sevStyle[z.severity];
          return (
            <div key={i} className="card" style={{borderLeft:`4px solid ${s.border}`,position:'relative'}}>
              <span className="badge" style={{position:'absolute',top:12,right:12,background:s.bg,color:s.color}}>#{i+1} {z.severity}</span>

              <div className="mb-3">
                <span style={{fontSize:'2.2rem',fontWeight:800,color:s.color,lineHeight:1}}>{z.score}</span>
                <span className="fs-sm text-gray">/100</span>
                <div className="progress mt-1"><div className="progress-fill" style={{width:`${z.score}%`,background:s.color}}/></div>
              </div>

              <div className="grid-3 mb-3">
                <div className="kpi"><div className="kpi-value">{z.reportCount}</div><div className="kpi-label">Reportes</div></div>
                <div className="kpi"><div className="kpi-value" style={{color:'#dc2626'}}>{z.sobrevivientes}</div><div className="kpi-label">🆘 Atrapados</div></div>
                <div className="kpi"><div className="kpi-value" style={{color:'#2563eb'}}>{z.desaparecidos}</div><div className="kpi-label">🔍 Desap.</div></div>
              </div>

              <div className="grid-2 mb-2">
                <div className="fs-sm"><span className="text-gray">Sobrevivientes:</span> <b>{z.totalSurvivors}</b></div>
                <div className="fs-sm"><span className="text-gray">Radio:</span> <b>{z.radiusKm} km</b></div>
              </div>

              <div className="fs-xs text-gray mb-2">{z.center.lat.toFixed(4)}, {z.center.lng.toFixed(4)}</div>

              <a href={`https://maps.google.com?q=${z.center.lat},${z.center.lng}`} target="_blank" rel="noreferrer"
                 style={{color:'#2563eb',fontSize:'0.8rem',fontWeight:500}}>📍 Google Maps</a>

              {z.reports?.length > 0 && (
                <details className="mt-2">
                  <summary className="fs-sm text-gray" style={{cursor:'pointer'}}>📋 {z.reports.length} reportes</summary>
                  <div style={{maxHeight:180,overflowY:'auto',marginTop:6}}>
                    {z.reports.map(r => (
                      <div key={r._id} className="flex justify-between fs-xs" style={{padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>
                        <span>{r.tipo==='desaparecido'?`🔍 ${r.nombre||''}`:`🆘 ${r.description?.slice(0,40)}`}</span>
                        <span className="fw-700">{r.tipo==='sobreviviente'?`👥${r.survivorsCount}`:r.encontrado?'✅':'⚠️'}</span>
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
