import React, { useState } from 'react';
import { updateReport, flagReport } from '../api';

const sevBadge = { alta:{bg:'#fef2f2',color:'#dc2626',dot:'🔴'}, media:{bg:'#fefce8',color:'#ca8a04',dot:'🟡'}, baja:{bg:'#eff6ff',color:'#2563eb',dot:'🔵'} };
const stBadge = { pendiente:{bg:'#fefce8',color:'#ca8a04',label:'Pendiente'}, en_proceso:{bg:'#eff6ff',color:'#2563eb',label:'En proceso'}, atendido:{bg:'#f0fdf4',color:'#16a34a',label:'Atendido'}, localizado:{bg:'#f0fdf4',color:'#16a34a',label:'Atendido'} };

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
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="panel-toolbar" style={{padding:'12px 16px',flexDirection:'column',alignItems:'stretch',gap:8}}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="fw-bold" style={{fontSize:'var(--text-md)'}}>🆘 Sobrevivientes Atrapados</h2>
          <span className="text-sm text-muted">{reports.length} reportes · 🔴{attn} · 🔵{prog} · 🟢{done}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(f => (
            <button key={f.k} className={`btn btn-sm ${filter===f.k?'btn-outline active':'btn-outline'}`}
                    onClick={() => setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
      </div>
      <div className="overflow-auto" style={{flex:1,padding:'12px 16px'}}>
        {filtered.length === 0 && <div className="empty-state">No hay reportes con ese estado.</div>}
        <div className="grid-cards">
          {filtered.map(r => {
            const sv = sevBadge[r.severity] || sevBadge.alta;
            const st = stBadge[r.status] || stBadge.pendiente;
            return (
              <div key={r._id} className="card card-accent-red" style={{position:'relative'}}>
                <span className="badge" style={{position:'absolute',top:12,right:12,background:sv.bg,color:sv.color}}>{sv.dot} {r.severity?.toUpperCase()}</span>
                <div style={{marginRight:70,marginBottom:10}}>
                  <p style={{fontSize:'0.9rem',lineHeight:1.4}}>{r.description}</p>
                </div>
                <div className="grid-3 mb-3">
                  <div className="kpi"><div className="kpi-value" style={{color:'#dc2626'}}>{r.survivorsCount}</div><div className="kpi-label">Personas</div></div>
                  <div className="kpi"><div className="kpi-value" style={{color:sv.color}}>{sv.dot}</div><div className="kpi-label">{r.severity}</div></div>
                  <div className="kpi"><span className="badge" style={{background:st.bg,color:st.color,fontSize:'0.75rem',padding:'4px 10px'}}>{st.label}</span><div className="kpi-label">Estado</div></div>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm text-muted">📍 {r.ultimaUbicacion || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</span>
                  <a href={`https://maps.google.com?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" className="text-xs text-blue">Maps</a>
                </div>
                {r.contactoReportante && <div className="text-xs text-muted mb-2">📞 {r.contactoReportante}{r.telefonoReportante?` — ${r.telefonoReportante}`:''}</div>}
                <div className="text-xs text-muted mb-3">{fmt(r.reportedAt)}</div>
                <div className="flex gap-2">
                  {r.status==='pendiente' && <button className="btn btn-sm flex-1" style={{background:'var(--blue-light)',color:'var(--blue)',border:'1px solid var(--blue)'}} onClick={()=>handleStatus(r._id,'en_proceso')}>🔵 En Proceso</button>}
                  {(r.status==='pendiente'||r.status==='en_proceso') && <button className="btn btn-sm flex-1" style={{background:'var(--green-light)',color:'var(--green)',border:'1px solid var(--green)'}} onClick={()=>handleStatus(r._id,'atendido')}>🟢 Atendido</button>}
                  {r.status==='atendido' && <button className="btn btn-sm flex-1" style={{background:'var(--red-light)',color:'var(--red)',border:'1px solid var(--red)'}} onClick={()=>handleStatus(r._id,'pendiente')}>🔴 Reabrir</button>}
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
  return <button onClick={h} className="text-xs" style={{display:'block',width:'100%',marginTop:6,padding:4,background:'none',border:'none',cursor:flagged?'default':'pointer',color:flagged?'#16a34a':'#999',textAlign:'right'}}>{flagged?'✅ Reportado':`🚩 ${c>0?`Reportar error (${c})`:'Reportar error'}`}</button>;
}

function fmt(iso){if(!iso)return'—';try{return new Date(iso).toLocaleString('es-VE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return iso}}
