import React, { useState, useEffect, useCallback } from 'react';
import { fetchReports, createReport, fetchCriticalZones, fetchStats, logout } from './api';
import HeatmapView from './components/HeatmapView';
import ReportForm from './components/ReportForm';
import CriticalZones from './components/CriticalZones';
import Desaparecidos from './components/Desaparecidos';
import Sobrevivientes from './components/Sobrevivientes';
import StatsPanel from './components/StatsPanel';

import { useTheme } from './ThemeContext';
import Logo from './components/Logo';

export default function AdminPage({ onLogout }) {
  const { dark, toggle } = useTheme();
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState('mapa');
  const [filter, setFilter] = useState('all'); // 'all' | 'sobreviviente' | 'desaparecido'
  const [showForm, setShowForm] = useState(null); // null | 'desaparecido' | 'sobreviviente'

  const loadData = useCallback(async () => {
    try {
      const [r, z, s] = await Promise.all([
        fetchReports(), fetchCriticalZones(2, 3, 'all'), fetchStats()
      ]);
      setReports(r); setZones(z.zones || []); setStats(s); setError(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Refrescar cada 60s
  useEffect(() => {
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, [loadData]);

  const handleSubmit = async (data) => {
    await createReport(data);
    setShowForm(null);
    await loadData();
  };

  const handleLogout = () => { logout(); onLogout(); };

  // Filtrar reportes según tipo seleccionado
  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.tipo === filter);

  const tabs = [
    { key: 'mapa',            label: '🔥 Mapa',             color: '#dc2626' },
    { key: 'desaparecidos',   label: '🔍 Desaparecidos',    color: '#2563eb' },
    { key: 'sobrevivientes',  label: '🆘 Sobrevivientes',   color: '#dc2626' },
    { key: 'zonas',           label: '🎯 Zonas Críticas',   color: '#eab308' },
    { key: 'stats',           label: '📊 Estadísticas',     color: '#111' },
  ];

  // Etiqueta del filtro activo
  const filterLabel = filter === 'all' ? 'Todos los reportes' : filter === 'sobreviviente' ? 'Solo atrapados' : 'Solo desaparecidos';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-2 flex-wrap">
          <Logo size={28} />
          <h1>🇻🇪 Dashboard</h1>
          {stats && <span className="fs-xs" style={{opacity:0.85}}>
            {stats.total} reportes · {stats.sobrevivientes}🆘 · {stats.desaparecidos}🔍
          </span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-sm" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff',background:'transparent'}}
                  onClick={handleLogout}>🚪 Salir</button>
        </div>
      </div>

      {/* Filtro global + Tabs */}
      <div className="panel-toolbar">
        {/* Filtro */}
        <div className="flex items-center gap-2 flex-wrap" style={{padding:'6px 12px'}}>
          <span className="fs-xs text-gray fw-700">Filtrar:</span>
          {[
            {k:'all',l:'👥 Todos'},
            {k:'desaparecido',l:'🔍 Desaparecidos'},
            {k:'sobreviviente',l:'🆘 Atrapados'},
          ].map(f => (
            <button key={f.k}
                    className={`btn btn-sm ${filter === f.k ? 'btn-outline active' : 'btn-outline'}`}
                    onClick={() => setFilter(f.k)}>
              {f.l}
            </button>
          ))}
          <span className="fs-xs text-gray" style={{marginLeft:'auto'}}>
            {filteredReports.length} resultados
          </span>
        </div>
        {/* Tabs */}
        <div className="flex gap-1" style={{padding:'0 12px 8px',overflowX:'auto'}}>
          {tabs.map(t => {
            const isActive = panel === t.key;
            return (
              <button key={t.key}
                      className={`btn btn-sm ${isActive ? 'btn-outline active' : 'btn-outline'}`}
                      style={isActive ? {} : {}}
                      onClick={() => setPanel(t.key)}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/></div>
        ) : error ? (
          <div className="empty-state">
            <p className="text-red fw-700">Error al cargar</p>
            <p className="fs-sm text-gray mt-2">{error}</p>
            <button className="btn btn-sm btn-outline mt-3" onClick={loadData}>🔄 Reintentar</button>
          </div>
        ) : (
          <>
            {panel === 'mapa' && (
              <HeatmapView reports={filteredReports} criticalZones={zones}
                           filter={filter} onFilterChange={setFilter} />
            )}
            {panel === 'desaparecidos' && (
              <Desaparecidos reports={reports.filter(r => r.tipo === 'desaparecido')}
                             onUpdate={loadData} />
            )}
            {panel === 'sobrevivientes' && (
              <Sobrevivientes reports={reports.filter(r => r.tipo === 'sobreviviente')}
                              onUpdate={loadData} />
            )}
            {panel === 'zonas' && <CriticalZones zones={zones} />}
            {panel === 'stats' && <StatsPanel stats={stats} zones={zones} />}
          </>
        )}
      </div>

      {/* FABs */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="fab" style={{background:'#2563eb',width:48,height:48,fontSize:18}}
                onClick={() => setShowForm('desaparecido')}>🔍</button>
        <button className="fab" onClick={() => setShowForm('sobreviviente')}>🆘</button>
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
