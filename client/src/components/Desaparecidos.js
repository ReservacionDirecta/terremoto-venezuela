import React, { useState, useEffect, useCallback } from 'react';
import { searchReports, updateReport, fetchFoto, flagReport } from '../api';

export default function Desaparecidos({ reports, onUpdate, readOnly }) {
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

  const marcar = async (id) => {
    if (!window.confirm('¿Confirmar localización?')) return;
    try { await updateReport(id, { encontrado: true, status: 'localizado' }); onUpdate(); }
    catch (err) { alert(err.message); }
  };

  const displayed = results || reports;
  const noEnc = displayed.filter(r => !r.encontrado);
  const enc = displayed.filter(r => r.encontrado);
  const pct = reports.length ? Math.round((enc.length/reports.length)*100) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-toolbar" style={{padding:'12px 16px'}}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h2 className="fw-700" style={{fontSize:'1.05rem'}}>Personas Desaparecidas</h2>
          <span className="fs-sm text-gray">{reports.length} personas · <span style={{color:'#2563eb'}}>{noEnc.length} sin localizar</span> · <span style={{color:'#16a34a'}}>{enc.length} localizados</span></span>
        </div>
        <input type="text" placeholder="Buscar por nombre o lugar..." value={q} onChange={e => setQ(e.target.value)}
               style={{maxWidth:400}} />
        {reports.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-between fs-xs text-gray mb-1"><span>Localización</span><span>{pct}%</span></div>
            <div className="progress"><div className="progress-fill" style={{width:`${pct}%`,background:'linear-gradient(90deg,#eab308,#2563eb,#16a34a)'}}/></div>
          </div>
        )}
      </div>

      <div className="overflow-auto" style={{flex:1,padding:'12px 16px'}}>
        {displayed.length === 0 && <div className="empty-state">{q ? 'Sin resultados' : 'No hay desaparecidos reportados'}</div>}
        <div className="grid-cards">
          {[...noEnc, ...enc].map(r => (
            <DesCard key={r._id} r={r} onMarcar={readOnly ? null : marcar} onFoto={setLightbox} fotos={fotos} setFotos={setFotos} />
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.foto} alt={lightbox.nombre} />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

function DesCard({ r, onMarcar, onFoto, fotos, setFotos }) {
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
  const bc = isF ? '#16a34a' : '#2563eb';

  return (
    <div className="card" style={{borderLeft:`4px solid ${bc}`,display:'flex',gap:12,position:'relative'}}>
      <span className="badge" style={{position:'absolute',top:10,right:10,background:isF?'#f0fdf4':'#eff6ff',color:bc}}>
        {isF ? 'Localizado' : 'Sin localizar'}
      </span>

      <div style={{flexShrink:0}}>
        {r.hasFoto ? (
          loading ? <div className="foto-skeleton"/> :
          fotoUrl ? <img src={fotoUrl} alt="" className="foto-thumb" onClick={() => onFoto({foto:fotoUrl,nombre:r.nombre})} /> :
          <div className="foto-placeholder">{err ? '⚠️' : ''}</div>
        ) : <div className="foto-placeholder"></div>}
      </div>

      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontSize:'0.95rem',fontWeight:700,margin:'0 70px 2px 0'}}>{r.nombre||'Sin nombre'}</h3>
        {r.edad != null && <span className="fs-sm text-gray">{r.edad} años</span>}
        <p className="fs-sm mt-1"> {r.ultimaUbicacion||`${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <a href={`https://maps.google.com?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" className="fs-xs" style={{color:'#2563eb'}}>Maps</a>
          {fotoUrl && <button onClick={() => onFoto({foto:fotoUrl,nombre:r.nombre})} className="fs-xs" style={{background:'none',border:'none',color:'#2563eb',cursor:'pointer'}}>Ver foto</button>}
        </div>
        {onMarcar && !isF && (
          <button className="btn btn-sm" style={{background:'var(--green-bg)',color:'var(--green)',border:'1px solid var(--green)',width:'100%',marginTop:8}}
                  onClick={() => onMarcar(r._id)}>Marcar Localizado</button>
        )}
        {/* Flag comunitario (siempre visible) */}
        <FlagButton id={r._id} currentFlags={r.flags} />
      </div>
    </div>
  );
}

// ─── Flag comunitario ──────────────────────────
function FlagButton({ id, currentFlags }) {
  const [flagged, setFlagged] = useState(false);
  const [count, setCount] = useState(currentFlags || 0);

  const handleFlag = async () => {
    if (flagged) return;
    try {
      const res = await flagReport(id);
      setCount(res.flags);
      setFlagged(true);
      setTimeout(() => setFlagged(false), 10000);
    } catch {}
  };

  return (
    <button onClick={handleFlag}
            className="fs-xs"
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: '4px',
              background: 'none', border: 'none', cursor: flagged ? 'default' : 'pointer',
              color: flagged ? '#16a34a' : '#999', textAlign: 'right'
            }}>
      {flagged ? 'Reportado' : `Reportar error ${count > 0 ? `(${count})` : ''}`}
    </button>
  );
}
