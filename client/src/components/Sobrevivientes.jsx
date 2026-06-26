import React, { useState } from 'react';
import { updateReport, flagReport } from '../api';

const sevBadge = { alta:{bg:'bg-red-50',color:'text-red-600',dot:'🔴'}, media:{bg:'bg-yellow-50',color:'text-yellow-700',dot:'🟡'}, baja:{bg:'bg-blue-50',color:'text-blue-600',dot:'🔵'} };
const stBadge = { pendiente:{bg:'bg-yellow-50',color:'text-yellow-700',label:'Pendiente'}, en_proceso:{bg:'bg-blue-50',color:'text-blue-600',label:'En proceso'}, atendido:{bg:'bg-green-50',color:'text-green-600',label:'Atendido'}, localizado:{bg:'bg-green-50',color:'text-green-600',label:'Atendido'} };

export default function Sobrevivientes({ reports, onUpdate, readOnly }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const attn = reports.filter(r => r.status === 'pendiente').length;
  const prog = reports.filter(r => r.status === 'en_proceso').length;
  const done = reports.filter(r => r.status === 'atendido' || r.status === 'localizado').length;

  const handleStatus = async (id, newStatus) => {
    try { await updateReport(id, { status: newStatus }); onUpdate(); }
    catch (err) { alert(err.message); }
  };

  const STATUSES = [
    {k:'all',l:'Todos'},{k:'pendiente',l:'🔴 Pendientes'},
    {k:'en_proceso',l:'🔵 En proceso'},{k:'atendido',l:'🟢 Atendidos'},
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-border" style={{background:'var(--color-surface)'}}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold">🆘 Sobrevivientes Atrapados</h2>
          <span className="text-xs text-muted">{reports.length} reportes · 🔴{attn} · 🔵{prog} · 🟢{done}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(f => (
            <button key={f.k}
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                filter===f.k ? 'bg-red-600 text-white border-red-600' : 'bg-surface text-txt2 border-border2 hover:border-txt3'
              }`}
              onClick={() => setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 && <div className="py-15 text-center text-muted">No hay reportes con ese estado.</div>}
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
          {filtered.map(r => {
            const sv = sevBadge[r.severity] || sevBadge.alta;
            const st = stBadge[r.status] || stBadge.pendiente;
            return (
              <div key={r._id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative border-l-4 border-l-red-600">
                <span className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${sv.bg} ${sv.color}`}>
                  {sv.dot} {r.severity?.toUpperCase()}
                </span>
                <div className="mr-18 mb-2.5">
                  <p className="text-sm leading-snug">{r.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{r.survivorsCount}</div>
                    <div className="text-xs text-txt3 uppercase tracking-wide mt-1">Personas</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                    <div className={`text-2xl font-bold ${sv.color}`}>{sv.dot}</div>
                    <div className="text-xs text-txt3 uppercase tracking-wide mt-1">{r.severity}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface border border-border shadow-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.color}`}>{st.label}</span>
                    <div className="text-xs text-txt3 uppercase tracking-wide mt-1">Estado</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm text-muted">📍 {r.ultimaUbicacion || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</span>
                  <a href={`https://maps.google.com?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Maps</a>
                </div>
                {r.contactoReportante && <div className="text-xs text-muted mb-2">📞 {r.contactoReportante}{r.telefonoReportante?` — ${r.telefonoReportante}`:''}</div>}
                <div className="text-xs text-muted mb-3">{fmt(r.reportedAt)}</div>
                <div className="flex gap-2">
                  {r.status==='pendiente' && <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-blue-50 text-blue-600 border border-blue-600 transition-colors" onClick={()=>handleStatus(r._id,'en_proceso')}>🔵 En Proceso</button>}
                  {(r.status==='pendiente'||r.status==='en_proceso') && <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-green-50 text-green-600 border border-green-600 transition-colors" onClick={()=>handleStatus(r._id,'atendido')}>🟢 Atendido</button>}
                  {r.status==='atendido' && <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-red-50 text-red-600 border border-red-600 transition-colors" onClick={()=>handleStatus(r._id,'pendiente')}>🔴 Reabrir</button>}
                </div>
                <FlagBtn id={r._id} flags={r.flags} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlagBtn({id,flags}) {
  const [flagged,setFlagged]=useState(false);const [c,setC]=useState(flags||0);
  const h=async()=>{if(flagged)return;try{const r=await flagReport(id);setC(r.flags);setFlagged(true);setTimeout(()=>setFlagged(false),10000)}catch{}}
  return <button onClick={h} className={`block w-full mt-1.5 p-1 bg-transparent border-none text-right text-xs cursor-pointer ${flagged?'text-green-600 cursor-default':'text-muted'}`}>{flagged?'✅ Reportado':`🚩 ${c>0?`Reportar error (${c})`:'Reportar error'}`}</button>;
}

function fmt(iso){if(!iso)return'—';try{return new Date(iso).toLocaleString('es-VE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return iso}}
