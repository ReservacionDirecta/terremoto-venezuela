import React, { useState, useEffect, useCallback } from 'react';
import { fetchReports, createReport, fetchCriticalZones, fetchStats } from './api';
import HeatmapView from './components/HeatmapView';
import ReportForm from './components/ReportForm';
import CriticalZones from './components/CriticalZones';
import Desaparecidos from './components/Desaparecidos';
import Sobrevivientes from './components/Sobrevivientes';
import StatsPanel from './components/StatsPanel';
import { useTheme } from './ThemeContext';
import Logo from './components/Logo';

export default function AdminPage() {
  const { dark, toggle } = useTheme();
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState('mapa');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [r, z, s] = await Promise.all([
        fetchReports(), fetchCriticalZones(2, 3, 'all'), fetchStats()
      ]);
      setReports(r && r.data ? r.data : (Array.isArray(r) ? r : []));
      setZones(z.zones || []);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, [loadData]);

  const handleSubmit = async (data) => {
    await createReport(data);
    setShowForm(null);
    await loadData();
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.tipo === filter);

  const tabs = [
    { key: 'mapa', label: 'Mapa' },
    { key: 'listas', label: 'Listas' },
    { key: 'zonas', label: 'Zonas' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div className="topbar" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2 flex-wrap" style={{minWidth:0,flex:1,overflow:'hidden'}}>
          <Logo size={24} />
          <h1>Hallados</h1>
          {stats && <span className="text-xs hide-mobile" style={{opacity:0.8}}>
            {stats.total.toLocaleString()} reportes · {stats.sobrevivientes}🆘 · {stats.desaparecidos}🔍
          </span>}
        </div>
        <div className="topbar-nav flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.key}
                    className={`btn ${panel === t.key ? 'btn-primary' : 'btn-outline'}`}
                    style={panel === t.key ? {color:'#fff'} : {color:'rgba(255,255,255,0.8)'}}
                    onClick={() => setPanel(t.key)}>
              {t.label}
            </button>
          ))}
          <button className="theme-toggle" onClick={toggle} title="Tema" style={{width:32,height:32,fontSize:'0.85rem',marginLeft:4}}>{dark ? '☀️' : '🌙'}</button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className="empty-state" style={{flex:1}}><div className="spinner" style={{margin:'40px auto'}}/></div>
        ) : error ? (
          <div className="empty-state" style={{flex:1}}>
            <p className="text-red fw-bold">Error al cargar</p>
            <p className="text-sm text-muted mt-2">{error}</p>
            <button className="btn btn-sm btn-outline mt-3" onClick={loadData}>Reintentar</button>
          </div>
        ) : (
          <>
            {panel === 'mapa' && (
              <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                <HeatmapView reports={filteredReports} criticalZones={zones}
                             filter={filter} onFilterChange={setFilter} />
              </div>
            )}
            {panel === 'listas' && (
              <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
                <Desaparecidos reports={reports.filter(r => r.tipo === 'desaparecido')} onUpdate={loadData} />
                <Sobrevivientes reports={reports.filter(r => r.tipo === 'sobreviviente')} onUpdate={loadData} />
              </div>
            )}
            {panel === 'zonas' && (
              <div style={{flex:1,overflow:'auto'}}><CriticalZones zones={zones} /></div>
            )}
          </>
        )}
      </div>

      {/* FABs */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="fab" style={{background:'var(--blue)',width:48,height:48,fontSize:18,fontWeight:'bold',boxShadow:'0 4px 14px rgba(37,99,235,0.3)'}}
                onClick={() => setShowForm('desaparecido')}>+ D</button>
        <button className="fab" style={{fontWeight:'bold'}} onClick={() => setShowForm('sobreviviente')}>+ S</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <ReportForm tipo={showForm} onSubmit={handleSubmit} onCancel={() => setShowForm(null)} />
          </div>
        </div>
      )}
    </div>
  );
}