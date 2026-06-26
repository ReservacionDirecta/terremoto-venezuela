import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import Logo from './components/Logo';
import ReportForm from './components/ReportForm';
import HeatmapView from './components/HeatmapView';
import Desaparecidos from './components/Desaparecidos';
import Sobrevivientes from './components/Sobrevivientes';
import Mascotas from './components/Mascotas';
import LeyendaEmergencia from './components/LeyendaEmergencia';
import GuiaUso from './components/GuiaUso';
import LoginPage from './LoginPage';
import { createReport, fetchReports, fetchCriticalZones, updateReport } from './api';

export default function PublicPage() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState('inicio');
  const [dirTab, setDirTab] = useState('des');
  const [showForm, setShowForm] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const loadPublicData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, z] = await Promise.all([
        fetchReports(), fetchCriticalZones(2, 3, 'all')
      ]);
      setReports(Array.isArray(r) ? r : []);
      setZones(z && z.zones ? z.zones : []);
    } catch (err) {
      console.error('Error cargando datos públicos:', err);
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reports.length === 0 && !loading) {
      loadPublicData();
    }
  }, []); // eslint-disable-line

  const handleSubmit = async (data) => {
    try {
      await createReport(data);
      setShowForm(null);
      setSuccess(data.tipo === 'desaparecido'
        ? 'Persona desaparecida reportada. Gracias.'
        : data.tipo === 'mascota'
        ? 'Mascota reportada. Gracias.'
        : 'Sobrevivientes atrapados reportados.');
      setTimeout(() => setSuccess(''), 5000);
      loadPublicData();
    } catch (err) {
      alert('Error al enviar: ' + err.message);
    }
  };

  const handleUpdateStatus = async (status, encontrado) => {
    if (!selectedReport) return;
    if (!window.confirm(`¿Confirmar cambio de estado a "${status}"?`)) return;
    try {
      await updateReport(selectedReport._id, { status, encontrado });
      setSelectedReport(null);
      setSuccess('Estado actualizado correctamente.');
      setTimeout(() => setSuccess(''), 5000);
      loadPublicData();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const recentReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)).slice(0, 15);
  }, [reports]);

  if (showLogin) return <LoginPage onLogin={() => window.location.reload()} onBack={() => setShowLogin(false)} />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar" style={{ padding: '8px 12px' }}>
        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
          <Logo size={24} />
          <h1 style={{ fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Hallados | Mapa de desaparecidos y atrapados | Terremoto Venezuela
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="theme-toggle" onClick={toggle} style={{ padding: 4 }}>{dark ? '☀️' : '🌙'}</button>
          <button className="btn btn-sm" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff',background:'transparent', padding: '4px 8px'}}
                  onClick={() => setShowLogin(true)}>🔒</button>
        </div>
      </div>

      {success && (
        <div className="fs-sm fw-700" style={{padding:'8px',textAlign:'center',background:'#f0fdf4',color:'#16a34a'}}>
          {success}
        </div>
      )}
      {error && (
        <div className="fs-sm" style={{padding:'8px',textAlign:'center',background:'#fef2f2',color:'#dc2626'}}>
          {error} <button className="btn btn-sm text-red ml-2" onClick={loadPublicData}>Reintentar</button>
        </div>
      )}

      <div className="pb-nav" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {tab === 'inicio' && (
          <div className="split-home">
            <div className="map-half">
              {loading && reports.length === 0 ? (
                <div className="empty-state"><div className="spinner" style={{margin:'20px auto'}}/></div>
              ) : (
                <HeatmapView reports={reports} criticalZones={zones} filter="all" onFilterChange={() => {}} onReportClick={setSelectedReport} compact />
              )}
            </div>
            <div className="list-half">
              <h3 className="fs-sm fw-700 text-gray mb-2">Últimos reportes</h3>
              {recentReports.length === 0 ? (
                <p className="fs-xs text-muted">No hay reportes recientes.</p>
              ) : (
                recentReports.map(r => (
                  <div key={r._id} className="recent-card" 
                       onClick={() => setSelectedReport(r)}
                       style={{ borderLeft: `4px solid ${r.tipo === 'desaparecido' ? 'var(--blue)' : r.tipo === 'mascota' ? 'var(--yellow)' : 'var(--red)'}`, cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div className="fw-700 fs-sm">{r.tipo === 'desaparecido' ? (r.nombre || 'Desaparecido') : r.tipo === 'mascota' ? (r.nombre || 'Mascota') : 'Sobrevivientes atrapados'}</div>
                      <div className="fs-xs text-gray mt-1">
                        {r.ultimaUbicacion || 'Ubicación marcada'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'reportar' && (
          <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
            <div className="hero-public" style={{ padding: '20px 10px', borderRadius: 12 }}>
              <h2 style={{fontSize:'1.3rem',fontWeight:700,color:'var(--text)',marginBottom:10}}>Registro de Reportes</h2>
              <p style={{color:'var(--text2)',fontSize:'0.9rem',maxWidth:420,margin:'0 auto',lineHeight:1.5}}>
                Seleccione el tipo de incidente para crear un nuevo reporte en el sistema.
              </p>
              <div style={{maxWidth:380,margin:'20px auto 0',display:'flex',flexDirection:'column',gap:12}}>
                <button className="btn btn-secondary btn-block" style={{ padding: '16px' }} onClick={() => setShowForm('desaparecido')}>
                  Reportar Desaparecido
                </button>
                <button className="btn btn-warning btn-block" style={{ padding: '16px', background: 'var(--yellow)', color: 'var(--text)', border: 'none' }} onClick={() => setShowForm('mascota')}>
                  Reportar Mascota
                </button>
                <button className="btn btn-primary btn-block" style={{ padding: '16px' }} onClick={() => setShowForm('sobreviviente')}>
                  Reportar Atrapados
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'directorio' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="flex" style={{position:'sticky',top:0,zIndex:10,background:'var(--card)',borderBottom:'2px solid var(--border)'}}>
              <button className="flex-1 fw-700 fs-sm" 
                      style={{padding:'12px',background:'transparent',border:'none',cursor:'pointer',borderBottom:dirTab==='des'?'2px solid var(--blue)':'none',color:dirTab==='des'?'var(--blue)':'var(--text3)'}} 
                      onClick={()=>setDirTab('des')}>Desaparecidos</button>
              <button className="flex-1 fw-700 fs-sm" 
                      style={{padding:'12px',background:'transparent',border:'none',cursor:'pointer',borderBottom:dirTab==='mas'?'2px solid var(--yellow)':'none',color:dirTab==='mas'?'var(--yellow)':'var(--text3)'}} 
                      onClick={()=>setDirTab('mas')}>Mascotas</button>
              <button className="flex-1 fw-700 fs-sm" 
                      style={{padding:'12px',background:'transparent',border:'none',cursor:'pointer',borderBottom:dirTab==='sob'?'2px solid var(--red)':'none',color:dirTab==='sob'?'var(--red)':'var(--text3)'}} 
                      onClick={()=>setDirTab('sob')}>Sobrevivientes</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {loading && reports.length === 0 ? (
                <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/></div>
              ) : dirTab === 'des' ? (
                <Desaparecidos reports={reports.filter(r => r.tipo === 'desaparecido')} onUpdate={loadPublicData} readOnly />
              ) : dirTab === 'mas' ? (
                <Mascotas reports={reports.filter(r => r.tipo === 'mascota')} onUpdate={loadPublicData} readOnly />
              ) : (
                <Sobrevivientes reports={reports.filter(r => r.tipo === 'sobreviviente')} readOnly />
              )}
            </div>
          </div>
        )}

        {tab === 'guia' && (
          <div className="overflow-auto h-full">
            <GuiaUso />
          </div>
        )}

        {tab === 'emergencia' && (
          <div className="overflow-auto h-full">
            <LeyendaEmergencia />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'inicio' ? 'active' : ''}`} onClick={() => setTab('inicio')}>
          🏠 Inicio
        </button>
        <button className={`nav-item ${tab === 'reportar' ? 'active' : ''}`} onClick={() => setTab('reportar')}>
          📝 Reportar
        </button>
        <button className={`nav-item ${tab === 'directorio' ? 'active' : ''}`} onClick={() => setTab('directorio')}>
          📋 Directorio
        </button>
        <button className={`nav-item ${tab === 'guia' ? 'active' : ''}`} onClick={() => setTab('guia')}>
          📖 Guía
        </button>
        <button className={`nav-item ${tab === 'emergencia' ? 'active' : ''}`} onClick={() => setTab('emergencia')}>
          📞 Emergencia
        </button>
      </nav>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(null)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <ReportForm tipo={showForm} onSubmit={handleSubmit} onCancel={() => setShowForm(null)} />
          </div>
        </div>
      )}

      {/* Ficha Detallada (ReportDetailModal) */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)} style={{ zIndex: 3000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>
                Ficha de {selectedReport.tipo.charAt(0).toUpperCase() + selectedReport.tipo.slice(1)}
              </h2>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text)' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              {(selectedReport.tipo === 'desaparecido' || selectedReport.tipo === 'mascota') && (
                <p style={{ margin: '4px 0', fontSize: '1.05rem' }}><strong>Nombre:</strong> {selectedReport.nombre || 'Desconocido'}</p>
              )}
              {(selectedReport.tipo === 'desaparecido') && (
                <p style={{ margin: '4px 0' }}><strong>Edad:</strong> {selectedReport.edad || 'N/A'}</p>
              )}
              {(selectedReport.tipo === 'sobreviviente') && (
                <p style={{ margin: '4px 0' }}><strong>Personas Atrapadas:</strong> {selectedReport.survivorsCount || 1}</p>
              )}
              <p style={{ margin: '4px 0' }}><strong>Estado Actual:</strong> <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, fontWeight: 'bold' }}>{selectedReport.status || (selectedReport.encontrado ? 'Localizado' : 'Sin localizar')}</span></p>
              <p style={{ margin: '4px 0' }}><strong>Ubicación:</strong> {selectedReport.ultimaUbicacion || `${selectedReport.lat.toFixed(4)}, ${selectedReport.lng.toFixed(4)}`}</p>
              <p style={{ margin: '4px 0' }}><strong>Reportado hace:</strong> {selectedReport.reportedAt ? Math.round((new Date() - new Date(selectedReport.reportedAt))/(1000*60*60))+' horas' : 'N/A'}</p>
              
              {selectedReport.description && (
                <div style={{ marginTop: 10, padding: 10, background: 'var(--bg)', borderRadius: 6, fontSize: '0.9rem', color: 'var(--text2)' }}>
                  {selectedReport.description}
                </div>
              )}
            </div>

            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: 5 }}>Actualizar Estado</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(selectedReport.tipo === 'desaparecido' || selectedReport.tipo === 'mascota') && !selectedReport.encontrado && (
                <button className="btn" style={{ background: 'var(--green)', color: '#fff', padding: '10px' }}
                        onClick={() => handleUpdateStatus('localizado', true)}>
                  ✅ Marcar como Localizado
                </button>
              )}
              {selectedReport.tipo === 'sobreviviente' && (
                <>
                  <button className="btn" style={{ background: 'var(--yellow)', color: '#000', padding: '10px' }}
                          onClick={() => handleUpdateStatus('en_proceso', false)}>
                    🚧 Marcar En Proceso de Rescate
                  </button>
                  <button className="btn" style={{ background: 'var(--green)', color: '#fff', padding: '10px' }}
                          onClick={() => handleUpdateStatus('rescatado', true)}>
                    ✅ Marcar Rescatados
                  </button>
                </>
              )}
              <button className="btn btn-secondary" style={{ padding: '10px' }}
                      onClick={() => handleUpdateStatus('falsa_alarma', false)}>
                ❌ Marcar Falsa Alarma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

