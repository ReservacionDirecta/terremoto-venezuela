import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './ThemeContext';
import Logo from './components/Logo';
import ReportForm from './components/ReportForm';
import HeatmapView from './components/HeatmapView';
import Desaparecidos from './components/Desaparecidos';
import Sobrevivientes from './components/Sobrevivientes';
import LoginPage from './LoginPage';
import { createReport, fetchReports, fetchCriticalZones } from './api';

const TABS = [
  { key: 'reportar',       label: '📝 Reportar' },
  { key: 'mapa',           label: '🔥 Mapa' },
  { key: 'desaparecidos',  label: '🔍 Desaparecidos' },
  { key: 'sobrevivientes', label: '🆘 Atrapados' },
];

export default function PublicPage() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState('reportar');
  const [showForm, setShowForm] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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

  // Cargar datos al hacer clic en mapa/listas
  useEffect(() => {
    if (tab !== 'reportar' && reports.length === 0 && !loading) {
      loadPublicData();
    }
  }, [tab]); // eslint-disable-line

  const handleSubmit = async (data) => {
    try {
      await createReport(data);
      setShowForm(null);
      setSuccess(data.tipo === 'desaparecido'
        ? 'Persona desaparecida reportada. Gracias.'
        : 'Sobrevivientes atrapados reportados.');
      setTimeout(() => setSuccess(''), 5000);
      loadPublicData();
    } catch (err) {
      alert('Error al enviar: ' + err.message);
    }
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.tipo === filter);
  const desp = reports.filter(r => r.tipo === 'desaparecido');
  const sobr = reports.filter(r => r.tipo === 'sobreviviente');

  if (showLogin) return <LoginPage onLogin={() => window.location.reload()} onBack={() => setShowLogin(false)} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <h1>🇻🇪 Terremoto Venezuela</h1>
          <div className="fs-xs" style={{opacity:0.85}}>
            {reports.length > 0 ? `${reports.length} reportes · ${desp.length}🔍 · ${sobr.length}🆘` : 'Registro de desaparecidos y sobrevivientes'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="theme-toggle" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
          <button className="btn btn-sm" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff',background:'transparent'}}
                  onClick={() => setShowLogin(true)}>🔒 Admin</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-toolbar" style={{display:'flex',gap:4,overflowX:'auto',alignItems:'center'}}>
        {TABS.map(t => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-outline active' : 'btn-outline'}`}
                  onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
        <span style={{marginLeft:'auto'}} className="fs-xs">
          {tab === 'reportar' ? (
            <span className="flex items-center gap-1">
              <button className="btn btn-sm btn-secondary" onClick={() => setShowForm('desaparecido')}>🔍 Reportar</button>
              <button className="btn btn-sm btn-primary" onClick={() => setShowForm('sobreviviente')}>🆘 Reportar</button>
            </span>
          ) : (
            <span className="text-gray">{filteredReports.length} resultados</span>
          )}
        </span>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="fs-sm fw-700" style={{padding:'10px 14px',textAlign:'center',background:'#f0fdf4',color:'#16a34a',borderBottom:'2px solid #bbf7d0'}}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="fs-sm" style={{padding:'10px 14px',textAlign:'center',background:'#fef2f2',color:'#dc2626',borderBottom:'2px solid #fecaca'}}>
          ⚠️ {error}
          <button className="btn btn-sm" style={{marginLeft:10,background:'#dc2626',color:'#fff',border:'none'}}
                  onClick={loadPublicData}>Reintentar</button>
        </div>
      )}

      {/* Contenido */}
      <div style={{flex:1,overflow:'hidden'}}>
        {/* --- Reportar --- */}
        {tab === 'reportar' && (
          <div className="hero-public">
            <h2 style={{fontSize:'1.3rem',fontWeight:700,color:'#dc2626',marginBottom:8}}>Reconectemos a cada familia.</h2>
            <p style={{color:'#666',fontSize:'0.9rem',maxWidth:420,margin:'0 auto',lineHeight:1.5}}>
              Si no logras contactar a alguien tras el terremoto, repórtalo. Es gratis y menos de un minuto.
            </p>
            <div style={{maxWidth:380,margin:'14px auto 0',display:'flex',flexDirection:'column',gap:10}}>
              <button className="btn btn-secondary btn-block" onClick={() => setShowForm('desaparecido')}>
                🔍 Reportar Persona Desaparecida
              </button>
              <button className="btn btn-primary btn-block" onClick={() => setShowForm('sobreviviente')}>
                🆘 Reportar Sobrevivientes Atrapados
              </button>
            </div>
            <div className="flex gap-2 mt-3 fs-xs" style={{justifyContent:'center',flexWrap:'wrap',color:'#999'}}>
              <span>🔍 <b>Desaparecido:</b> no logras comunicarte</span>
              <span>·</span>
              <span>🆘 <b>Atrapado:</b> necesita rescate urgente</span>
            </div>
          </div>
        )}

        {/* --- Mapa --- */}
        {tab === 'mapa' && (
          loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/><p className="text-gray mt-2">Cargando mapa...</p></div>
          ) : (
            <HeatmapView reports={filteredReports} criticalZones={zones} filter={filter} onFilterChange={setFilter} />
          )
        )}

        {/* --- Desaparecidos --- */}
        {tab === 'desaparecidos' && (
          loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/><p className="text-gray mt-2">Cargando lista...</p></div>
          ) : (
            <Desaparecidos reports={desp} readOnly />
          )
        )}

        {/* --- Sobrevivientes --- */}
        {tab === 'sobrevivientes' && (
          loading ? (
            <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/><p className="text-gray mt-2">Cargando lista...</p></div>
          ) : (
            <Sobrevivientes reports={sobr} readOnly />
          )
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <ReportForm tipo={showForm} onSubmit={handleSubmit} onCancel={() => setShowForm(null)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{padding:'14px 16px',textAlign:'center',borderTop:'2px solid #eee',background:'#f8f8f8'}}>
        <p className="fs-xs" style={{color:'#999'}}>
          24 Jun 2026 · 7.2 + 7.5 Mw · Yaracuy/Carabobo ·{' '}
          <a href="https://desaparecidosterremotovenezuela.com/" target="_blank" rel="noreferrer">desaparecidosterremotovenezuela.com</a>
        </p>
      </div>
    </div>
  );
}
