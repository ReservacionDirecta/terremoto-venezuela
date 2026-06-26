import React, { useState } from 'react';
import { syncExternal, fetchExternalCounts } from '../api';

export default function StatsPanel({ stats, zones }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [extCounts, setExtCounts] = useState(null);
  if (!stats) return <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-border2 border-t-red-600 rounded-full animate-spin" /></div>;
  const pct = stats.desaparecidos > 0 ? Math.round((stats.encontrados / stats.desaparecidos) * 100) : 0;
  const totalSurv = stats.severidad?.reduce((s, x) => s + x.totalSurvivors, 0) || 0;

  return (
    <div className="overflow-y-auto h-full p-4">
      <h2 className="font-bold mb-3">📊 Panel de Emergencia</h2>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <KPI v={stats.total} l="Reportes" c="#111" />
        <KPI v={stats.sobrevivientes} l="Atrapados" c="#dc2626" sub={`${totalSurv} pers.`} />
        <KPI v={stats.desaparecidos} l="Desaparecidos" c="#2563eb" />
        <KPI v={stats.encontrados} l="Localizados" c="#16a34a" sub={`${pct}%`} />
        <KPI v={stats.mascotasTotal || 0} l="Mascotas" c="#f97316" />
        <KPI v={stats.mascotasEncontradas || 0} l="Rescatadas" c="#16a34a" />
      </div>

      {stats.severidad?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2">Sobrevivientes por Severidad</h3>
          <div className="flex gap-2 flex-wrap">
            {stats.severidad.map(s => {
              const cs = { alta: '#dc2626', media: '#eab308', baja: '#2563eb' };
              return (
                <div key={s._id} className="flex-1 min-w-25 text-center bg-surface border border-border rounded-xl p-3 shadow-sm"
                     style={{borderTop:`3px solid ${cs[s._id]}`}}>
                  <div className="text-2xl font-bold" style={{color:cs[s._id]}}>{s.count}</div>
                  <div className="text-xs text-txt3 uppercase tracking-wide">{s._id}</div>
                  <div className="text-xs text-txt3">{s.totalSurvivors} personas</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-bold mb-2">Reportes por Zona</h3>
        {stats.porUbicacion?.length > 0 ? (
          <table className="w-full border-collapse text-sm">
            <thead><tr><th className="text-left p-2.5 border-b border-border text-xs text-txt3 uppercase tracking-wide font-semibold" style={{background:'var(--color-bg)'}}>Zona</th><th className="text-right p-2.5 border-b border-border text-xs text-txt3 uppercase tracking-wide font-semibold" style={{background:'var(--color-bg)'}}>Reportes</th></tr></thead>
            <tbody>
              {stats.porUbicacion.map(e => (
                <tr key={e._id}><td className="p-2.5 border-b border-border text-txt2">{e._id}</td><td className="p-2.5 border-b border-border text-right font-bold">{e.count}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-txt3">Sin datos</p>}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-2">Datos del Sismo</h3>
        <div className="text-sm leading-relaxed">
          <p><strong>Fecha:</strong> 24 Jun 2026, 18:04 UTC-4</p>
          <p><strong>Epicentro:</strong> Yaracuy/Carabobo</p>
          <p><strong>Magnitud:</strong> 7.2 + 7.5 Mw</p>
          <p className="text-red-600 font-bold">+188 fallecidos · +1,500 heridos · +41,000 desaparecidos</p>
          <p className="text-xs text-txt3 mt-2">
            Ref: <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer">desaparecidosterremotovenezuela.com</a>
          </p>
        </div>
      </div>

      {/* External sync */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm mt-4">
        <h3 className="text-sm font-bold mb-2">Datos Externos: desaparecidosterremotovenezuela.com</h3>
        <p className="text-xs text-txt3 mb-3 leading-relaxed">
          Importa datos reales de la API pública (56,852+ personas reportadas). Se filtran spam y duplicados automáticamente.
        </p>

        {extCounts && (
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <KPI v={extCounts.total} l="Total API" />
            <KPI v={extCounts.sinContacto} l="Sin contacto" c="#2563eb" />
            <KPI v={extCounts.localizado} l="Localizados" c="#16a34a" />
          </div>
        )}

        <button className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-2"
                onClick={async () => { try { setExtCounts(await fetchExternalCounts()); } catch {} }}>
          Ver totales
        </button>

        <button className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-surface text-txt2 border border-border2 hover:border-txt3 transition-colors mt-2"
                onClick={async () => { setSyncing(true); setSyncResult(null); try { setSyncResult(await syncExternal(5)); } catch (err) { setSyncResult({ error: err.message }); } finally { setSyncing(false); } }} disabled={syncing}>
          {syncing ? 'Sincronizando...' : 'Sincronizar (5 págs)'}
        </button>

        <div className="mt-2 text-center text-txt3 text-xs">Ó</div>

        <button className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-surface text-txt2 border border-border2 hover:border-txt3 transition-colors mt-2"
                onClick={async () => { setSyncing(true); setSyncResult(null); try { setSyncResult(await syncExternal(20)); } catch (err) { setSyncResult({ error: err.message }); } finally { setSyncing(false); } }} disabled={syncing}>
          {syncing ? '...' : '20 págs'}
        </button>

        {syncResult && !syncResult.error && (
          <div className="text-xs mt-3 p-2 bg-green-50 text-green-600 rounded-md">
            Importados: {syncResult.imported} · Saltados: {syncResult.skipped} · Spam: {syncResult.spam} · Sin geo: {syncResult.noGeo}
          </div>
        )}
        {syncResult?.error && (
          <div className="text-xs mt-2 text-red-600">Error: {syncResult.error}</div>
        )}
      </div>
    </div>
  );
}

function KPI({ v, l, c, sub }) {
  return (
    <div className="text-center p-4 rounded-xl bg-surface border border-border shadow-sm">
      <div className="text-2xl font-bold leading-none" style={{color:c}}>{v}</div>
      <div className="text-xs text-txt3 uppercase tracking-wide mt-1">{l}</div>
      {sub && <div className="text-xs text-txt3">{sub}</div>}
    </div>
  );
}
