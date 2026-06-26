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
import { createReport, fetchReports, fetchCriticalZones, searchReports, fetchFoto, updateReport } from './api';

export default function PublicPage() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState('inicio');
  const [dirTab, setDirTab] = useState('des');
  const [showForm, setShowForm] = useState(null);
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const loadPublicData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [r, z] = await Promise.all([fetchReports(), fetchCriticalZones(2, 3, 'all')]);
      setReports(r && r.data ? r.data : (Array.isArray(r) ? r : []));
      setZones(z && z.zones ? z.zones : []);
    } catch (err) {
      console.error('Error cargando datos públicos:', err);
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (reports.length === 0 && !loading) loadPublicData(); }, []); // eslint-disable-line

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
      setSuccess(data.tipo === 'desaparecido' ? 'Persona desaparecida reportada. Gracias.'
        : data.tipo === 'mascota' ? 'Mascota reportada. Gracias.'
        : 'Sobrevivientes atrapados reportados.');
      setTimeout(() => setSuccess(''), 5000);
      loadPublicData();
    } catch (err) { alert('Error al enviar: ' + err.message); }
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
    } catch (err) { alert('Error al actualizar: ' + err.message); }
  };

  useEffect(() => {
    if (!selectedReport) { setActivePhoto(null); return; }
    if (selectedReport.foto) { setActivePhoto(selectedReport.foto); return; }
    setLoadingPhoto(true);
    fetchFoto(selectedReport._id)
      .then(fotoData => { if (fotoData) setActivePhoto(fotoData); })
      .catch(err => console.warn('No se pudo recuperar la foto:', err))
      .finally(() => setLoadingPhoto(false));
  }, [selectedReport]);

  const renderFooter = () => (
    <div className="mt-6 py-8 px-5 border-t border-border text-sm leading-relaxed" style={{background:'var(--color-bg2)', color:'var(--color-txt3)'}}>
      <div className="max-w-lg mx-auto text-left">
        <p className="mb-5 text-txt3">
          Esta plataforma ha sido creada de manera voluntaria por venezolanos dentro y fuera del país para apoyar la búsqueda de personas desaparecidas tras el terremoto en Venezuela. No solicitamos ni gestionamos dinero, donaciones ni ayudas de ningún tipo. Nuestro único objetivo es facilitar la recopilación y organización de información que pueda contribuir a su localización.
        </p>

        <h4 className="text-base font-extrabold mb-3 pb-1.5 border-b-2 border-border">
          Teléfonos de emergencia · Caracas
        </h4>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5 text-xs">
          <div><strong>171 / 911</strong></div>
          <div className="text-right text-txt3">Emergencias principal</div>
          <div><strong>*1 / 112</strong></div>
          <div className="text-right text-txt3">Movilnet / Digitel / Movistar</div>
          <div><strong>Aeroambulancias</strong></div>
          <div className="text-right text-txt3">(0212) 993.25.41 / 992.89.80</div>
          <div><strong>Rescarven</strong></div>
          <div className="text-right text-txt3">(0212) 993.69.11 / 993.13.10</div>
          <div><strong>Ambulancia Metropolitano</strong></div>
          <div className="text-right text-txt3">(0212) 545.45.45 / 577.92.09</div>
        </div>

        <div className="text-xs text-txt3 border-t border-border pt-4">
          <p className="mb-3">
            <strong>Desaparecidos Terremoto Venezuela</strong> — Esta es una herramienta ciudadana y no partidista. Ante una emergencia médica, llama a los organismos de rescate. Verifica siempre la información antes de difundirla.
          </p>
          <p className="italic">
            ¿Encontraste un problema en el sitio? Escríbenos a <a href="mailto:soporte@hallados.org" className="text-blue-600 underline">soporte@hallados.org</a>
          </p>
        </div>

        <div className="text-center mt-6 text-[0.7rem] text-muted">
          hecho con amor por{' '}
          <a href="https://chamba.digital" target="_blank" rel="noopener noreferrer"
             className="font-bold no-underline" style={{color:'var(--color-txt3)'}}>
            chamba.digital
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-red-600 text-white shadow-md flex-wrap gap-2 overflow-hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Logo size={20} />
          <h1 className="text-lg font-bold text-white m-0">Hallados</h1>
          <span className="text-sm opacity-75 font-normal max-sm:hidden">Venezuela</span>
        </div>
        <div className="flex items-center gap-1">
          <a href="#admin" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold no-underline bg-transparent text-white/80 cursor-pointer"
             style={{border:'1px solid rgba(255,255,255,0.25)'}}>
            Colaborar
          </a>
          <button onClick={toggle}
                  className="w-8 h-8 rounded-lg border border-white/25 bg-transparent text-white cursor-pointer flex items-center justify-center text-sm hover:bg-white/15">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {success && (
        <div className="text-sm font-bold text-center py-2 bg-green-50 text-green-600">{success}</div>
      )}
      {error && (
        <div className="text-sm text-center py-2 bg-red-50 text-red-600">
          {error} <button className="ml-2 text-red-600 underline text-sm font-semibold bg-transparent border-none cursor-pointer" onClick={loadPublicData}>Reintentar</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {tab === 'inicio' && (
          <div className="split-home">
            <div className="floating-search-bar">
              <div className="relative">
                <input type="text" placeholder="Buscar por nombre, CI/DNI o número..."
                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                       className="!w-full !rounded-3xl !border-none !py-3 !px-4 !pr-10 !text-base"
                       style={{background:'var(--color-surface)',color:'var(--color-txt)',boxShadow:'0 4px 16px rgba(0,0,0,0.18)'}} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-xl cursor-pointer text-muted p-1">✕</button>
                )}
              </div>
            </div>
            <div className="map-half">
              {loading && reports.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-7 h-7 border-2 border-border2 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : (
                <HeatmapView reports={searchResults || reports} criticalZones={zones} filter="all"
                             onFilterChange={() => {}} onReportClick={setSelectedReport} selectedReport={selectedReport} compact />
              )}
            </div>
          </div>
        )}

        {tab === 'reportar' && (
          <div className="overflow-y-auto h-full px-5 py-5">
            <div className="text-center py-5 px-2.5 rounded-xl" style={{background:'var(--color-bg2)'}}>
              <h2 className="text-xl font-bold mb-2.5">Registro de Reportes</h2>
              <p className="text-sm text-txt2 max-w-md mx-auto leading-relaxed">
                Seleccione el tipo de incidente para crear un nuevo reporte en el sistema.
              </p>
              <div className="max-w-sm mx-auto mt-5 flex flex-col gap-3">
                <button className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base cursor-pointer transition-all hover:bg-blue-700"
                        onClick={() => setShowForm('desaparecido')}>Reportar Desaparecido</button>
                <button className="w-full py-4 px-4 bg-yellow-500 text-slate-900 rounded-xl font-semibold text-base cursor-pointer transition-all hover:bg-yellow-400 border-none"
                        onClick={() => setShowForm('mascota')}>Reportar Mascota</button>
                <button className="w-full py-4 px-4 bg-red-600 text-white rounded-xl font-semibold text-base cursor-pointer transition-all hover:bg-red-700"
                        onClick={() => setShowForm('sobreviviente')}>Reportar Atrapados</button>
              </div>
            </div>
            {renderFooter()}
          </div>
        )}

        {tab === 'directorio' && (
          <div className="h-full flex flex-col">
            <div className="flex sticky top-0 z-10 border-b-2 border-border" style={{background:'var(--color-surface)'}}>
              {[
                {k:'des', l:'Desaparecidos', c:'#2563eb'},
                {k:'mas', l:'Mascotas', c:'#eab308'},
                {k:'sob', l:'Sobrevivientes', c:'#dc2626'}
              ].map(t => (
                <button key={t.k}
                  className={`flex-1 py-3 text-xs font-bold bg-transparent border-none cursor-pointer transition-colors ${
                    dirTab===t.k ? 'border-b-2' : ''
                  }`}
                  style={{
                    color: dirTab===t.k ? t.c : 'var(--color-txt3)',
                    borderBottomColor: dirTab===t.k ? t.c : 'transparent',
                  }}
                  onClick={() => setDirTab(t.k)}>{t.l}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading && reports.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-border2 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : dirTab === 'des' ? (
                <Desaparecidos reports={reports.filter(r => r.tipo === 'desaparecido')} onUpdate={loadPublicData} readOnly />
              ) : dirTab === 'mas' ? (
                <Mascotas reports={reports.filter(r => r.tipo === 'mascota')} onUpdate={loadPublicData} readOnly />
              ) : (
                <Sobrevivientes reports={reports.filter(r => r.tipo === 'sobreviviente')} readOnly />
              )}
              {renderFooter()}
            </div>
          </div>
        )}

        {tab === 'guia' && (
          <div className="overflow-y-auto h-full">
            <GuiaUso />
            {renderFooter()}
          </div>
        )}

        {tab === 'emergencia' && (
          <div className="overflow-y-auto h-full">
            <LeyendaEmergencia />
            {renderFooter()}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-border py-1.5 px-2 gap-0.5 overflow-x-auto shrink-0" style={{background:'var(--color-surface)'}}>
        {[
          { id: 'inicio',     icon: '🗺️', label: 'Mapa' },
          { id: 'reportar',   icon: '📝', label: 'Reportar' },
          { id: 'directorio', icon: '📋', label: 'Directorio' },
          { id: 'guia',       icon: '📖', label: 'Guía' },
          { id: 'emergencia', icon: '📞', label: '911' },
        ].map(n => (
          <button key={n.id}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 border-none bg-transparent cursor-pointer rounded-lg transition-all min-h-14 text-xs font-medium ${
              tab === n.id ? 'text-red-600 font-semibold' : 'text-txt3 hover:text-txt2 hover:bg-black/3'
            }`}
            onClick={() => setTab(n.id)}>
            <span className={`text-xl leading-none ${tab === n.id ? 'scale-110' : ''} transition-transform`}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm"
             onClick={() => setShowForm(null)}>
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-lg sm:m-5"
               onClick={e => e.stopPropagation()}>
            <ReportForm tipo={showForm} onSubmit={handleSubmit} onCancel={() => setShowForm(null)} />
          </div>
        </div>
      )}

      {/* Report detail modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm p-4"
             onClick={() => setSelectedReport(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
               onClick={e => e.stopPropagation()}>

            {/* Photo */}
            <div className="relative overflow-hidden rounded-t-2xl">
              {loadingPhoto ? (
                <div className="w-full h-70 flex items-center justify-center" style={{background:'var(--color-bg2)'}}>
                  <div className="w-6 h-6 border-2 border-border2 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : activePhoto ? (
                <img src={activePhoto} alt="Foto del registro" className="w-full h-70 object-cover block" />
              ) : (
                <div className="w-full h-45 flex flex-col items-center justify-center gap-2" style={{background:'var(--color-bg2)', color:'var(--color-txt3)'}}>
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-semibold">Sin foto disponible</span>
                </div>
              )}
              <button onClick={() => setSelectedReport(null)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border-none text-xl cursor-pointer text-slate-900 flex items-center justify-center shadow-md z-10">✕</button>
            </div>

            <div className="p-5 pt-5">
              {/* Status & Name */}
              <div className="mb-5">
                <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                  selectedReport.encontrado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedReport.status || (selectedReport.encontrado ? 'localizado' : 'pendiente')}
                </span>
                <h2 className="mt-2.5 text-2xl font-extrabold">
                  {selectedReport.tipo === 'sobreviviente' ? 'Personas Atrapadas' : selectedReport.nombre || 'Desconocido'}
                </h2>
                {selectedReport.tipo === 'desaparecido' && selectedReport.edad && (
                  <p className="text-base text-txt2 m-0">{selectedReport.edad} años</p>
                )}
                {selectedReport.tipo === 'desaparecido' && selectedReport.identificacion && (
                  <p className="text-sm text-txt3 m-0">CI/DNI: {selectedReport.identificacion}</p>
                )}
              </div>

              {/* Info blocks */}
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <div className="text-xs text-txt3 uppercase tracking-wider font-bold">Última ubicación</div>
                  <div className="text-base">{selectedReport.ultimaUbicacion || `${selectedReport.lat.toFixed(4)}, ${selectedReport.lng.toFixed(4)}`}</div>
                </div>
                {selectedReport.reportedAt && (
                  <div>
                    <div className="text-xs text-txt3 uppercase tracking-wider font-bold">
                      {selectedReport.tipo === 'sobreviviente' ? 'Reportado el' : 'Sin contacto desde'}
                    </div>
                    <div className="text-base">
                      {new Date(selectedReport.reportedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
                {selectedReport.description && (
                  <div>
                    <div className="text-xs text-txt3 uppercase tracking-wider font-bold">Descripción y señas</div>
                    <div className="text-base p-3 rounded-lg" style={{background:'var(--color-bg)'}}>{selectedReport.description}</div>
                  </div>
                )}
                {(selectedReport.contactoReportante || selectedReport.telefonoReportante) && (
                  <div>
                    <div className="text-xs text-txt3 uppercase tracking-wider font-bold">Reporta</div>
                    <div className="text-base">{selectedReport.contactoReportante || 'Anónimo'} {selectedReport.telefonoReportante}</div>
                  </div>
                )}
              </div>

              <hr className="border-none border-t border-border mb-5" />

              {/* Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">¿Ya lograste comunicarte?</h3>
                <p className="text-sm text-txt2 mb-3">Márcala como localizada y su familia podrá respirar tranquila.</p>
                <div className="flex flex-col gap-2.5">
                  <button className="w-full py-3.5 px-4 bg-green-600 text-white rounded-xl font-semibold text-base cursor-pointer transition-all hover:bg-green-700"
                          onClick={() => handleUpdateStatus('localizado', true)}>
                    Marcar como localizada
                  </button>
                  <button className="w-full py-3.5 px-4 rounded-xl font-semibold text-base cursor-pointer transition-all border border-border"
                          style={{background:'var(--color-bg3)', color:'var(--color-txt)'}}
                          onClick={() => handleUpdateStatus('falsa_alarma', false)}>
                    Reporte Falso / Error
                  </button>
                </div>
              </div>

              {/* Share */}
              {(() => {
                const SITE = 'https://hallados.org';
                const nombre = selectedReport.nombre || 'una persona';
                const ubicacion = selectedReport.ultimaUbicacion || '';
                const shareText = selectedReport.tipo === 'sobreviviente'
                  ? `Personas atrapadas reportadas en ${ubicacion}. Necesitan ayuda urgente. Más info en ${SITE}`
                  : `Buscamos a ${nombre}${ubicacion ? ', vista por última vez en ' + ubicacion : ''}. Cualquier información ayuda. ${SITE}`;
                const shareUrl = SITE;
                return (
                  <div className="p-4 rounded-2xl" style={{background:'var(--color-bg)'}}>
                    <h4 className="text-base font-bold text-center mb-3">Ayuda a difundir</h4>
                    <div className="flex justify-center gap-3 flex-wrap mb-4">
                      <button className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer bg-black text-white border-none"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`)}>X</button>
                      <button className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer bg-[#1877F2] text-white border-none"
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`)}>Facebook</button>
                      <button className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer text-white border-none"
                        style={{background:'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}
                        onClick={() => {
                          if (navigator.share) { navigator.share({ title: `Hallados - ${nombre}`, text: shareText, url: shareUrl }).catch(() => {}); }
                          else { window.open('https://instagram.com'); }
                        }}>Instagram</button>
                      <button className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer bg-white text-black border border-border"
                        onClick={() => { navigator.clipboard.writeText(shareText); window.alert('Texto copiado'); }}>Copiar</button>
                    </div>
                    <div className="text-center">
                      <button className="bg-transparent border-none text-red-600 text-xs underline cursor-pointer"
                              onClick={() => { window.alert('Reporte enviado para revisión.'); setSelectedReport(null); }}>
                        Reportar contenido obsceno
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
