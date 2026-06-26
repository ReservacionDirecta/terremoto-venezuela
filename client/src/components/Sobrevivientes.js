import React, { useState } from 'react';
import { updateReport, flagReport } from '../api';

const sevBadge = {
  alta:  { bg:'#fef2f2', color:'#dc2626', dot:'' },
  media: { bg:'#fefce8', color:'#ca8a04', dot:'' },
  baja:  { bg:'#eff6ff', color:'#2563eb', dot:'' }
};

const statusBadge = {
  pendiente:   { bg:'#fefce8', color:'#ca8a04', label:'Pendiente' },
  en_proceso:  { bg:'#eff6ff', color:'#2563eb', label:'En proceso' },
  atendido:    { bg:'#f0fdf4', color:'#16a34a', label:'Atendido' },
  localizado:  { bg:'#f0fdf4', color:'#16a34a', label:'Atendido' }
};

export default function Sobrevivientes({ reports, onUpdate, readOnly }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter);

  const attn = reports.filter(r => r.status === 'pendiente').length;
  const inProgress = reports.filter(r => r.status === 'en_proceso').length;
  const done = reports.filter(r => r.status === 'atendido' || r.status === 'localizado').length;

  const handleStatus = !readOnly ? async (id, newStatus) => {
    try {
      await updateReport(id, { status: newStatus });
      onUpdate();
    } catch (err) { alert(err.message); }
  } : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-toolbar" style={{padding:'12px 16px'}}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h2 className="fw-700" style={{ fontSize: '1.05rem' }}>Sobrevivientes Atrapados</h2>
          <span className="fs-sm text-gray">
            {reports.length} reportes · {attn} pendientes · {inProgress} en proceso · {done} atendidos
          </span>
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-1 flex-wrap">
          {[
            { k: 'all', l: 'Todos' },
            { k: 'pendiente', l: 'Pendientes' },
            { k: 'en_proceso', l: 'En proceso' },
            { k: 'atendido', l: 'Atendidos' },
          ].map(f => (
            <button key={f.k}
                    className={`btn btn-sm ${statusFilter === f.k ? 'btn-outline active' : 'btn-outline'}`}
                    onClick={() => setStatusFilter(f.k)}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-auto" style={{ flex: 1, padding: '12px 16px' }}>
        {filtered.length === 0 && (
          <div className="empty-state">
            {statusFilter === 'all' ? 'No hay reportes de sobrevivientes aún.' : 'No hay reportes con ese estado.'}
          </div>
        )}

        <div className="grid-cards">
          {filtered.map(r => {
            const sv = sevBadge[r.severity] || sevBadge.alta;
            const st = statusBadge[r.status] || statusBadge.pendiente;
            const mapsUrl = `https://maps.google.com?q=${r.lat},${r.lng}`;

            return (
              <div key={r._id} className="card card-red" style={{ position: 'relative' }}>
                {/* Severity badge */}
                <span className="badge" style={{
                  position: 'absolute', top: 12, right: 12,
                  background: sv.bg, color: sv.color
                }}>
                  {r.severity.toUpperCase()}
                </span>

                {/* Info principal */}
                <div style={{ marginRight: 80, marginBottom: 10 }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#111' }}>{r.description}</p>
                </div>

                {/* Stats */}
                <div className="grid-3 mb-3">
                  <div className="kpi">
                    <div className="kpi-value" style={{ color: '#dc2626' }}>{r.survivorsCount}</div>
                    <div className="kpi-label">Personas</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-value" style={{ color: sv.color, fontSize: '1.2rem', marginTop: '6px' }}>{r.severity.toUpperCase()}</div>
                    <div className="kpi-label">{r.severity}</div>
                  </div>
                  <div className="kpi">
                    <span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.75rem', padding: '4px 10px' }}>
                      {st.label}
                    </span>
                    <div className="kpi-label">Estado</div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="fs-sm text-gray">
                    {r.ultimaUbicacion || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}
                  </span>
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="fs-xs" style={{ color: '#2563eb' }}>
                    Google Maps
                  </a>
                </div>

                {/* Contacto */}
                {r.contactoReportante && (
                  <div className="fs-xs text-gray mb-2">
                    Reportado por: {r.contactoReportante}
                    {r.telefonoReportante ? ` — ${r.telefonoReportante}` : ''}
                  </div>
                )}

                <div className="fs-xs text-gray mb-3">
                  {formatFecha(r.reportedAt)}
                </div>

                {/* Botones de acción — solo admin */}
                {handleStatus && (
                <div className="flex gap-2">
                  {r.status === 'pendiente' && (
                    <button className="btn btn-sm flex-1"
                            style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue)' }}
                            onClick={() => handleStatus(r._id, 'en_proceso')}>
                      En Proceso
                    </button>
                  )}
                  {(r.status === 'pendiente' || r.status === 'en_proceso') && (
                    <button className="btn btn-sm flex-1"
                            style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green)' }}
                            onClick={() => handleStatus(r._id, 'atendido')}>
                      Atendido
                    </button>
                  )}
                  {r.status === 'atendido' && (
                    <button className="btn btn-sm flex-1"
                            style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)' }}
                            onClick={() => handleStatus(r._id, 'pendiente')}>
                      Reabrir
                    </button>
                  )}
                </div>
                )}
                <FlagBtn id={r._id} currentFlags={r.flags} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function FlagBtn({ id, currentFlags }) {
  const [flagged, setFlagged] = useState(false);
  const [count, setCount] = useState(currentFlags || 0);
  const handleFlag = async () => {
    if (flagged) return;
    try { const res = await flagReport(id); setCount(res.flags); setFlagged(true); setTimeout(() => setFlagged(false), 10000); } catch {}
  };
  return (
    <button onClick={handleFlag} className="fs-xs"
            style={{display:'block',width:'100%',marginTop:6,padding:'4px',background:'none',border:'none',cursor:flagged?'default':'pointer',color:flagged?'#16a34a':'#999',textAlign:'right'}}>
      {flagged ? 'Reportado' : `${count > 0 ? `Reportar error (${count})` : 'Reportar error'}`}
    </button>
  );
}
