import React, { useState, useEffect, useCallback } from 'react';
import { searchReports, updateReport, fetchFoto, flagReport } from '../api';

export default function Mascotas({ reports, onUpdate, readOnly }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [fotos, setFotos] = useState({});

  const doSearch = useCallback(async () => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true);
    try { setResults(await searchReports(q.trim())); } catch {}
    finally { setSearching(false); }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => q.trim() ? doSearch() : setResults(null), 400);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  const marcar = async (id, status) => {
    if (!window.confirm(status ? '¿Confirmar que la mascota fue rescatada/encontrada?' : '¿Marcar de nuevo como perdida?')) return;
    try { await updateReport(id, { encontrado: status, status: status ? 'localizado' : 'pendiente' }); onUpdate(); }
    catch (err) { alert(err.message); }
  };

  const displayed = (results || reports).filter(r => r.tipo === 'mascota');
  const allMascotas = reports.filter(r => r.tipo === 'mascota');
  const noEnc = allMascotas.filter(r => !r.encontrado);
  const enc = allMascotas.filter(r => r.encontrado);
  const pct = allMascotas.length ? Math.round((enc.length/allMascotas.length)*100) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-border" style={{background:'var(--color-surface)'}}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold">Mascotas Reportadas</h2>
          <span className="text-xs text-txt3">{allMascotas.length} reportes · <span className="text-orange-500">{noEnc.length} perdidas</span> · <span className="text-green-600">{enc.length} rescatadas</span></span>
        </div>
        <input type="text" placeholder="Buscar por descripción o ubicación..." value={q} onChange={e => setQ(e.target.value)} className="max-w-sm" />
        {allMascotas.length > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-txt3 mb-1"><span>Rescatadas</span><span>{pct}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--color-border)'}}>
              <div className="h-full rounded-full transition-[width] duration-500" style={{width:`${pct}%`,background:'linear-gradient(90deg,#f97316,#16a34a)'}} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {displayed.length === 0 && <div className="py-15 text-center text-muted">{q ? 'Sin resultados' : 'No hay mascotas reportadas'}</div>}
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
          {[...displayed.filter(r => !r.encontrado), ...displayed.filter(r => r.encontrado)].map(r => (
            <MasCard key={r._id} r={r} onMarcar={readOnly ? null : marcar} onFoto={setLightbox} fotos={fotos} setFotos={setFotos} />
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-500 bg-black/95 flex items-center justify-center cursor-pointer" onClick={() => setLightbox(null)}>
          <img src={lightbox.foto} alt={lightbox.nombre} className="max-w-[92vw] max-h-[88vh] rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-5 w-10 h-10 rounded-full bg-red-600 text-white border-none text-lg cursor-pointer font-bold" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

function MasCard({ r, onMarcar, onFoto, fotos, setFotos }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const fotoUrl = fotos[r._id];

  useEffect(() => {
    if (r.hasFoto && !fotoUrl && !loading && !err) {
      setLoading(true);
      fetchFoto(r._id).then(f => setFotos(p => ({...p, [r._id]: f}))).catch(() => setErr(true)).finally(() => setLoading(false));
    }
  }, [r._id, r.hasFoto, fotoUrl, loading, err, setFotos]);

  const isF = r.encontrado;
  const bc = isF ? '#16a34a' : '#f97316';

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-3 relative"
         style={{borderLeft:`4px solid ${bc}`}}>
      <span className={`absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isF ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
        {isF ? 'Rescatada' : 'Perdida'}
      </span>

      <div className="shrink-0">
        {r.hasFoto ? (
          loading ? <div className="w-20 h-20 rounded-xl animate-shimmer" /> :
          fotoUrl ? <img src={fotoUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-border cursor-pointer hover:scale-105 transition-transform" onClick={() => onFoto({foto:fotoUrl,nombre:r.nombre})} /> :
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border2 flex items-center justify-center text-3xl text-muted" />
        ) : <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border2 flex items-center justify-center text-3xl text-muted" />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold m-0 mr-28">{r.nombre || 'Mascota sin nombre'}</h3>
        <p className="text-xs mt-1 text-txt2">{r.description}</p>
        <p className="text-xs mt-1 text-txt2">{r.ultimaUbicacion||`${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <a href={`https://maps.google.com?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" className="text-xs text-orange-500">Maps</a>
          {fotoUrl && <button onClick={() => onFoto({foto:fotoUrl,nombre:r.nombre})} className="text-xs text-orange-500 bg-transparent border-none cursor-pointer">Ver foto</button>}
        </div>
        {onMarcar && (
          <button className={`w-full mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
            isF ? 'bg-white text-red-600 border-red-600' : 'bg-green-50 text-green-600 border-green-600 hover:bg-green-100'
          }`}
                  onClick={() => onMarcar(r._id, !isF)}>
            {isF ? 'Marcar como perdida' : 'Marcar Rescatada'}
          </button>
        )}
        <FlagButton id={r._id} currentFlags={r.flags} />
      </div>
    </div>
  );
}

function FlagButton({ id, currentFlags }) {
  const [flagged, setFlagged] = useState(false);
  const [count, setCount] = useState(currentFlags || 0);
  const handleFlag = async () => {
    if (flagged) return;
    try { const res = await flagReport(id); setCount(res.flags); setFlagged(true); setTimeout(() => setFlagged(false), 10000); } catch {}
  };
  return (
    <button onClick={handleFlag}
            className={`block w-full mt-1.5 p-1 bg-transparent border-none text-right text-xs cursor-pointer ${flagged ? 'text-green-600 cursor-default' : 'text-muted'}`}>
      {flagged ? 'Reportado' : `Reportar error ${count > 0 ? `(${count})` : ''}`}
    </button>
  );
}
