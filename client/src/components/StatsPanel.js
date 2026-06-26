import React, { useState } from 'react';
import { syncExternal, fetchExternalCounts } from '../api';

export default function StatsPanel({ stats, zones }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [extCounts, setExtCounts] = useState(null);
  if (!stats) return <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/></div>;
  const pct = stats.desaparecidos > 0 ? Math.round((stats.encontrados / stats.desaparecidos) * 100) : 0;
  const totalSurv = stats.severidad?.reduce((s, x) => s + x.totalSurvivors, 0) || 0;

  return (
    <div className="overflow-auto h-full" style={{padding:16}}>
      <h2 className="fw-700 mb-3">📊 Panel de Emergencia</h2>

      {/* KPI */}
      <div className="grid-3 mb-4">
        <KPI v={stats.total} l="Reportes" c="#111" />
        <KPI v={stats.sobrevivientes} l="Atrapados" c="#dc2626" sub={`${totalSurv} pers.`} />
        <KPI v={stats.desaparecidos} l="Desaparecidos" c="#2563eb" />
        <KPI v={stats.encontrados} l="Localizados" c="#16a34a" sub={`${pct}%`} />
        <KPI v={stats.mascotasTotal || 0} l="Mascotas" c="#f97316" />
        <KPI v={stats.mascotasEncontradas || 0} l="Rescatadas" c="#16a34a" />
      </div>

      {/* Severidad */}
      {stats.severidad?.length > 0 && (
        <div className="mb-4">
          <h3 className="fw-700 fs-sm mb-2">Sobrevivientes por Severidad</h3>
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
        <h3 className="fw-700 fs-sm mb-2">Reportes por Zona</h3>
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
        <h3 className="fw-700 fs-sm mb-2">Datos del Sismo</h3>
        <div className="fs-sm" style={{lineHeight:1.8}}>
          <p><strong>Fecha:</strong> 24 Jun 2026, 18:04 UTC-4</p>
          <p><strong>Epicentro:</strong> Yaracuy/Carabobo</p>
          <p><strong>Magnitud:</strong> 7.2 + 7.5 Mw</p>
          <p className="text-red fw-700">+188 fallecidos · +1,500 heridos · +41,000 desaparecidos</p>
          <p className="fs-xs text-gray mt-2">
            Ref: <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer">desaparecidosterremotovenezuela.com</a>
          </p>
        </div>
      </div>

      {/* Sincronización externa */}
      <div className="card card-blue mt-4">
        <h3 className="fw-700 fs-sm mb-2">Datos Externos: desaparecidosterremotovenezuela.com</h3>
        <p className="fs-xs text-gray mb-3" style={{lineHeight:1.5}}>
          Importa datos reales de la API pública (56,852+ personas reportadas).
          Se filtran spam y duplicados automáticamente.
        </p>

        {extCounts && (
          <div className="grid-3 mb-3">
            <div className="kpi"><div className="kpi-value">{extCounts.total}</div><div className="kpi-label">Total API</div></div>
            <div className="kpi"><div className="kpi-value" style={{color:'#2563eb'}}>{extCounts.sinContacto}</div><div className="kpi-label">Sin contacto</div></div>
            <div className="kpi"><div className="kpi-value" style={{color:'#16a34a'}}>{extCounts.localizado}</div><div className="kpi-label">Localizados</div></div>
          </div>
        )}

        <button className="btn btn-sm btn-secondary btn-block mb-2"
                onClick={async () => { try { setExtCounts(await fetchExternalCounts()); } catch {} }}>
          <span>Ver totales</span>
        </button>

        <button className="btn btn-sm btn-outline mt-2 btn-block" 
                onClick={async () => {
                  setSyncing(true); setSyncResult(null);
                  try { setSyncResult(await syncExternal(5)); }
                  catch (err) { setSyncResult({ error: err.message }); }
                  finally { setSyncing(false); }
                }} disabled={syncing}>
          {syncing ? 'Sincronizando...' : 'Sincronizar (5 págs)'}
        </button>
        
        <div className="mt-2 text-center text-gray fs-xs">Ó</div>

        <button className="btn btn-sm btn-outline mt-2 btn-block" 
                onClick={async () => {
                  setSyncing(true); setSyncResult(null);
                  try { setSyncResult(await syncExternal(20)); }
                  catch (err) { setSyncResult({ error: err.message }); }
                  finally { setSyncing(false); }
                }} disabled={syncing}>
          {syncing ? '...' : '20 págs'}
        </button>

        {syncResult && !syncResult.error && (
          <div className="fs-xs mt-3 p-2" style={{background:'var(--green-bg)',color:'var(--green)',borderRadius:6}}>
            Importados: {syncResult.imported} · Saltados: {syncResult.skipped} · Spam: {syncResult.spam} · Sin geo: {syncResult.noGeo}
          </div>
        )}
        {syncResult?.error && (
          <div className="fs-xs mt-2 text-red">Error: {syncResult.error}</div>
        )}
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
