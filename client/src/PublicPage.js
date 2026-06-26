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
import { createReport, fetchReports, fetchCriticalZones, updateReport, searchReports } from './api';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

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

  const doSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setIsSearching(true);
    try { setSearchResults(await searchReports(searchQuery.trim())); } catch {}
    finally { setIsSearching(false); }
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => searchQuery.trim() ? doSearch() : setSearchResults(null), 400);
    return () => clearTimeout(t);
  }, [searchQuery, doSearch]);

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
      <div className="topbar">
        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
          <Logo size={20} />
          <h1 style={{ margin: 0 }}>Hallados Venezuela</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="theme-toggle" onClick={toggle} style={{ width: 32, height: 32, fontSize: '0.85rem' }}>{dark ? 'LUZ' : 'NOC'}</button>
          <button className="btn btn-sm" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff',background:'transparent', padding: '4px 8px', minHeight: 32, minWidth: 32, fontSize: '0.7rem'}}
                  onClick={() => setShowLogin(true)}>Admin</button>
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
            {/* Search Bar - Floating */}
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Buscar nombre, CI/DNI, teléfono..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', padding: '10px 40px 10px 14px', borderRadius: 24, 
                    border: 'none', background: 'var(--card)', 
                    color: 'var(--text)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    fontSize: '0.9rem'
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>✕</button>
                )}
              </div>
            </div>

            <div className="map-half">
              {loading && reports.length === 0 ? (
                <div className="empty-state"><div className="spinner" style={{margin:'20px auto'}}/></div>
              ) : (
                <HeatmapView reports={reports} criticalZones={zones} filter="all" onFilterChange={() => {}} onReportClick={setSelectedReport} selectedReport={selectedReport} compact />
              )}
            </div>

            {/* Bottom sheet toggle + panel */}
            {showPanel ? (
              <div className="list-half">
                {/* Handle bar + close */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
                  <div style={{ width: 36, height: 4, background: '#cbd5e1', borderRadius: 2 }}></div>
                  <button onClick={() => setShowPanel(false)} style={{ position: 'absolute', right: 0, top: -2, background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer', padding: '2px 6px' }}>▼ Ocultar</button>
                </div>

                {searchQuery.trim() ? (
                  <>
                    <h3 className="fs-sm fw-700 text-gray mb-2">Resultados de Búsqueda {isSearching && <span className="spinner" style={{width:12,height:12,marginLeft:6,borderWidth:2,display:'inline-block'}}/>}</h3>
                    {searchResults && searchResults.length === 0 ? (
                      <p className="fs-xs text-muted">No se encontraron resultados.</p>
                    ) : (
                      (searchResults || []).map(r => (
                        <div key={r._id} className="recent-card" 
                             onClick={() => setSelectedReport(r)}
                             style={{ borderLeft: `4px solid ${r.tipo === 'desaparecido' ? 'var(--blue)' : r.tipo === 'mascota' ? 'var(--yellow)' : 'var(--red)'}`, cursor: 'pointer' }}>
                          <div style={{ flex: 1 }}>
                            <div className="fw-700 fs-sm">{r.tipo === 'desaparecido' ? (r.nombre || 'Desaparecido') : r.tipo === 'mascota' ? (r.nombre || 'Mascota') : 'Sobrevivientes atrapados'}</div>
                            <div className="fs-xs text-gray mt-1">
                              {r.identificacion && <span style={{display:'block',color:'#666'}}>CI/DNI: {r.identificacion}</span>}
                              {r.ultimaUbicacion || 'Ubicación marcada'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="fs-sm fw-700 text-gray mb-2">Últimos reportes</h3>
                    {recentReports.length === 0 ? (
                      <p className="fs-xs text-muted">No hay reportes recientes.</p>
                    ) : (
                       recentReports.map(r => {
                        const timeAgo = r.reportedAt ? (() => {
                          const mins = Math.round((new Date() - new Date(r.reportedAt)) / 60000);
                          if (mins < 60) return `hace ${mins}m`;
                          const hrs = Math.round(mins / 60);
                          if (hrs < 24) return `hace ${hrs}h`;
                          return `hace ${Math.round(hrs / 24)}d`;
                        })() : '';
                        const typeColor = r.tipo === 'desaparecido' ? 'var(--blue)' : r.tipo === 'mascota' ? 'var(--yellow)' : 'var(--red)';
                        return (
                        <div key={r._id} className="recent-card" 
                             onClick={() => setSelectedReport(r)}
                             style={{ borderLeft: `4px solid ${typeColor}`, cursor: 'pointer' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="fw-700" style={{ fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.tipo === 'desaparecido' ? (r.nombre || 'Desaparecido') : r.tipo === 'mascota' ? (r.nombre || 'Mascota') : 'Atrapados'}
                              </span>
                              {r.encontrado && <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>Encontrado</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.ultimaUbicacion || 'Ubicación marcada'}
                            </div>
                          </div>
                          {timeAgo && <span style={{ fontSize: '0.65rem', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo}</span>}
                        </div>
                      );}
                      ))
                    }
                  </>
                )}
              </div>
            ) : (
              /* Floating button to bring the panel back */
              <button 
                onClick={() => setShowPanel(true)}
                style={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 200, background: 'var(--card)', border: 'none',
                  borderRadius: 24, padding: '8px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6
                }}>
              {`Reportes (${reports.length})`}
              </button>
            )}
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

      <nav className="bottom-nav">
        {[
          { id: 'inicio', label: 'Mapa' },
          { id: 'reportar', label: 'Reportar' },
          { id: 'directorio', label: 'Directorio' },
          { id: 'guia', label: 'Guía' },
          { id: 'emergencia', label: '911' },
        ].map(n => (
          <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
            <span>{n.label}</span>
          </button>
        ))}
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
        <div className="modal-overlay" onClick={() => setSelectedReport(null)} style={{ zIndex: 3000, padding: 15 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, width: '100%', padding: '24px 20px', borderRadius: 20 }}>
            {/* Banner superior */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ background: selectedReport.encontrado ? '#dcfce7' : '#fee2e2', color: selectedReport.encontrado ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700 }}>
                  {selectedReport.status || (selectedReport.encontrado ? 'Encontrado' : 'Sin contacto')}
                </span>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '1.6rem', color: 'var(--text)', fontWeight: 800 }}>
                  {selectedReport.tipo === 'sobreviviente' ? 'Personas Atrapadas' : selectedReport.nombre || 'Desconocido'}
                </h2>
                {selectedReport.tipo === 'desaparecido' && selectedReport.edad && (
                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text2)' }}>{selectedReport.edad} años</p>
                )}
                {selectedReport.tipo === 'desaparecido' && selectedReport.identificacion && (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text3)' }}>CI/DNI: {selectedReport.identificacion}</p>
                )}
              </div>
              <button onClick={() => setSelectedReport(null)} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Foto si existe */}
            {selectedReport.foto && (
              <div style={{ marginBottom: 20 }}>
                <img src={selectedReport.foto} alt="Foto" style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 16 }} />
              </div>
            )}

            {/* Bloques de Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Última ubicación</div>
                <div style={{ fontSize: '1rem', color: 'var(--text)' }}>{selectedReport.ultimaUbicacion || `${selectedReport.lat.toFixed(4)}, ${selectedReport.lng.toFixed(4)}`}</div>
              </div>

              {selectedReport.reportedAt && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{selectedReport.tipo === 'sobreviviente' ? 'Reportado el' : 'Sin contacto desde'}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text)' }}>
                    {new Date(selectedReport.reportedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}

              {selectedReport.description && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Descripción y señas</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text)', background: 'var(--bg)', padding: 12, borderRadius: 8 }}>{selectedReport.description}</div>
                </div>
              )}

              {(selectedReport.contactoReportante || selectedReport.telefonoReportante) && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Reporta</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text)' }}>{selectedReport.contactoReportante || 'Anónimo'} {selectedReport.telefonoReportante}</div>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px 0' }} />

            {/* Acciones */}
            <div style={{ marginBottom: 24 }}>
              {(selectedReport.tipo === 'desaparecido' || selectedReport.tipo === 'mascota') && !selectedReport.encontrado && (
                <>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text2)', margin: '0 0 10px 0' }}>Si tienes información de esta persona, actualiza su estado.</p>
                  <button className="btn btn-block" style={{ background: 'var(--green)', color: '#fff', padding: '14px', borderRadius: 12, fontSize: '1rem' }}
                          onClick={() => handleUpdateStatus('localizado', true)}>
                    Marcar como localizada
                  </button>
                </>
              )}
              {selectedReport.tipo === 'sobreviviente' && (
                <>
                  <button className="btn btn-block" style={{ background: 'var(--yellow)', color: '#000', padding: '14px', borderRadius: 12, fontSize: '1rem', marginBottom: 8 }}
                          onClick={() => handleUpdateStatus('en_proceso', false)}>
                    En proceso de rescate
                  </button>
                  <button className="btn btn-block" style={{ background: 'var(--green)', color: '#fff', padding: '14px', borderRadius: 12, fontSize: '1rem' }}
                          onClick={() => handleUpdateStatus('rescatado', true)}>
                    Rescatados
                  </button>
                </>
              )}
            </div>

            {/* Compartir */}
            {(() => {
              const SITE = 'https://hallados.org';
              const nombre = selectedReport.nombre || 'una persona';
              const ubicacion = selectedReport.ultimaUbicacion || '';
              const shareText = selectedReport.tipo === 'sobreviviente'
                ? `Personas atrapadas reportadas en ${ubicacion}. Necesitan ayuda urgente. Más info en ${SITE}`
                : `Buscamos a ${nombre}${ubicacion ? ', vista por última vez en ' + ubicacion : ''}. Cualquier información ayuda. ${SITE}`;
              const shareUrl = SITE;

              return (
                <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12 }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', color: 'var(--text2)' }}>Compartir este reporte</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <button className="btn btn-sm" style={{ borderRadius: 10, padding: '8px 14px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 600 }}
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`)}>WhatsApp</button>
                    <button className="btn btn-sm" style={{ borderRadius: 10, padding: '8px 14px', background: '#1877F2', color: '#fff', border: 'none', fontWeight: 600 }}
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`)}>Facebook</button>
                    <button className="btn btn-sm" style={{ borderRadius: 10, padding: '8px 14px', background: '#14171a', color: '#fff', border: 'none', fontWeight: 600 }}
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`)}>X</button>
                    {navigator.share && (
                      <button className="btn btn-sm" style={{ borderRadius: 10, padding: '8px 14px', background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}
                        onClick={() => navigator.share({ title: `Hallados - ${nombre}`, text: shareText, url: shareUrl }).catch(() => {})}>Compartir</button>
                    )}
                    <button className="btn btn-sm" style={{ borderRadius: 10, padding: '8px 14px', background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600 }}
                      onClick={() => { navigator.clipboard.writeText(shareText); window.alert('Texto copiado'); }}>Copiar</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer' }} onClick={() => handleUpdateStatus('falsa_alarma', false)}>
                      Reportar error
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer' }} onClick={() => { window.alert('Reporte enviado para revisión.'); setSelectedReport(null); }}>
                      Contenido inapropiado
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}

