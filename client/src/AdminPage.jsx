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
    <div className="h-screen flex flex-col" style={{background:'var(--color-bg)'}}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-red-600 text-white shadow-md shrink-0 flex-wrap gap-2 overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1 overflow-hidden">
          <Logo size={24} />
          <h1 className="text-lg font-bold text-white">Hallados</h1>
          {stats && <span className="text-xs opacity-80 max-sm:hidden">
            {stats.total.toLocaleString()} reportes · {stats.sobrevivientes}🆘 · {stats.desaparecidos}🔍
          </span>}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key}
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                panel === t.key
                  ? 'bg-red-600 text-white border border-white/40'
                  : 'bg-transparent text-white/80 border border-white/25 hover:bg-white/10'
              }`}
              onClick={() => setPanel(t.key)}>
              {t.label}
            </button>
          ))}
          <button onClick={toggle} title="Tema"
                  className="w-8 h-8 rounded-lg border border-white/25 bg-transparent text-white cursor-pointer flex items-center justify-center text-sm ml-1 hover:bg-white/15">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-border2 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
            <p className="text-red-600 font-bold">Error al cargar</p>
            <p className="text-sm text-muted mt-2">{error}</p>
            <button className="mt-3 inline-flex items-center px-3 py-1.5 border border-border2 rounded-lg text-xs font-semibold cursor-pointer bg-surface text-txt2 hover:border-txt3"
                    onClick={loadData}>Reintentar</button>
          </div>
        ) : (
          <>
            {panel === 'mapa' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <HeatmapView reports={filteredReports} criticalZones={zones}
                             filter={filter} onFilterChange={setFilter} />
              </div>
            )}
            {panel === 'listas' && (
              <div className="flex-1 overflow-auto flex flex-col">
                <Desaparecidos reports={reports.filter(r => r.tipo === 'desaparecido')} onUpdate={loadData} />
                <Sobrevivientes reports={reports.filter(r => r.tipo === 'sobreviviente')} onUpdate={loadData} />
              </div>
            )}
            {panel === 'zonas' && (
              <div className="flex-1 overflow-auto"><CriticalZones zones={zones} /></div>
            )}
          </>
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2.5">
        <button className="w-12 h-12 rounded-full border-none bg-blue-600 text-white text-lg font-bold cursor-pointer flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                onClick={() => setShowForm('desaparecido')}>+ D</button>
        <button className="w-14 h-14 rounded-full border-none bg-red-600 text-white text-xl font-bold cursor-pointer flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                onClick={() => setShowForm('sobreviviente')}>+ S</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-300 bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm"
             onClick={() => setShowForm(null)}>
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-lg sm:m-5"
               onClick={e => e.stopPropagation()}>
            <ReportForm tipo={showForm} onSubmit={handleSubmit} onCancel={() => setShowForm(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
