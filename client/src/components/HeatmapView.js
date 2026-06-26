import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const EPI = [10.35, -68.62];
const sevColors = { alta:'#dc2626', media:'#eab308', baja:'#2563eb' };

export default function HeatmapView({ reports, criticalZones, filter, onFilterChange, onReportClick, selectedReport, compact }) {
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const markersRef = useRef(null);
  const [showMarkers, setShowMarkers] = useState(true);
  
  const [tactical, setTactical] = useState({
    tipo: filter || 'all',
    time: 'all',
    severity: 'all',
    status: 'all'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showChipBar, setShowChipBar] = useState(false); // By default hide to save space

  useEffect(() => {
    if (selectedReport && mapRef.current) {
      const lat = selectedReport.lat || selectedReport.location?.coordinates?.[1];
      const lng = selectedReport.lng || selectedReport.location?.coordinates?.[0];
      if (lat && lng) {
        mapRef.current.flyTo([lat, lng], 18, { duration: 1.5 });
      }
    }
  }, [selectedReport]);

  // ... useEffects keep the same

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('map-container', { center: EPI, zoom: 8 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'CARTO', maxZoom: 19
    }).addTo(map);

    const epicIcon = L.divIcon({
      html: '<div style="width:22px;height:22px;background:#dc2626;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px #dc2626;animation:pulse 2s infinite;"></div>',
      iconSize: [22, 22], iconAnchor: [11, 11]
    });
    L.marker(EPI, { icon: epicIcon }).addTo(map)
      .bindPopup('<b>⚠️ Epicentro</b><br>7.2 + 7.5 Mw<br>24 Jun 2026');

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    markersRef.current?.clearLayers();

    const now = new Date();
    const filteredReports = reports.filter(r => {
      if (tactical.tipo !== 'all') {
        if (r.tipo !== tactical.tipo) return false;
      }
      if (tactical.time !== 'all' && r.reportedAt) {
        const hoursDiff = (now - new Date(r.reportedAt)) / (1000 * 60 * 60);
        if (tactical.time === '1h' && hoursDiff > 1) return false;
        if (tactical.time === '6h' && hoursDiff > 6) return false;
        if (tactical.time === '24h' && hoursDiff > 24) return false;
      }
      if (tactical.severity !== 'all') {
        if (r.tipo !== 'sobreviviente') return false;
        if (r.severity !== tactical.severity) return false;
      }
      if (tactical.status !== 'all') {
        if (r.status && r.status !== tactical.status) return false;
      }
      return true;
    });

    const data = filteredReports.filter(r => r.tipo !== 'mascota').map(r => {
      let recencyBoost = 1;
      if (r.reportedAt) {
        const hoursDiff = (now - new Date(r.reportedAt)) / (1000 * 60 * 60);
        if (hoursDiff <= 1) recencyBoost = 1.5;
        else if (hoursDiff <= 6) recencyBoost = 1.2;
      }
      let i;
      if (r.tipo === 'sobreviviente') {
        let sevWeight = r.severity === 'alta' ? 1.5 : r.severity === 'media' ? 0.8 : 0.4;
        let countWeight = Math.min((r.survivorsCount || 1) / 2, 3);
        i = sevWeight * countWeight * recencyBoost;
      }
      else i = r.encontrado ? 0.2 : 1.0 * recencyBoost;
      return [r.lat, r.lng, i];
    });

    if (data.length) {
      // Heatmap mucho más evidente: radio y blur aumentados
      heatRef.current = L.heatLayer(data, { radius: 38, blur: 25, max: 1.5,
        gradient: { 0:'#00c853', 0.2:'#64dd17', 0.4:'#ffd600', 0.6:'#ff6d00', 0.8:'#dd2c00', 1:'#b91c1c' }
      }).addTo(map);
      const b = L.latLngBounds(filteredReports.map(r => [r.lat, r.lng]));
      if (b.isValid()) map.fitBounds(b, { padding: [40,40], maxZoom: 13 });
    }

    if (showMarkers) {
      // Clustering manual (aprox 20-30 metros de radio)
      const clusters = [];
      const clusterDist = 0.0003; 

      filteredReports.forEach(r => {
        let found = false;
        for (let c of clusters) {
          if (Math.abs(c.lat - r.lat) < clusterDist && Math.abs(c.lng - r.lng) < clusterDist) {
            c.reports.push(r);
            found = true;
            break;
          }
        }
        if (!found) clusters.push({ lat: r.lat, lng: r.lng, reports: [r] });
      });

      clusters.forEach(cluster => {
        const count = cluster.reports.length;
        const hasCritical = cluster.reports.some(r => r.tipo === 'sobreviviente' && r.severity === 'alta');
        const isRecent = cluster.reports.some(r => r.reportedAt && ((now - new Date(r.reportedAt)) / (1000 * 60 * 60)) <= 1);
        
        let iconHtml, iconSize, iconAnchor;
        
        if (count === 1) {
          // Single marker
          const r = cluster.reports[0];
          const isS = r.tipo === 'sobreviviente';
          const isExt = r.source === 'external';
          const c = isExt ? '#2563eb' : isS ? sevColors[r.severity] : r.encontrado ? '#16a34a' : '#2563eb';
          const bs = (hasCritical || isRecent) ? '3px solid #fff' : '1.5px solid #fff';
          const size = (hasCritical || isRecent) ? 18 : 14;
          iconHtml = `<div style="width:${size}px;height:${size}px;background:${c};border:${bs};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`;
          iconSize = [size, size];
          iconAnchor = [size/2, size/2];
        } else {
          // Cluster marker
          const bg = hasCritical ? '#dc2626' : isRecent ? '#f97316' : '#2563eb';
          iconHtml = `<div style="width:28px;height:28px;background:${bg};border:3px solid #fff;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,0.5);">${count}</div>`;
          iconSize = [28, 28];
          iconAnchor = [14, 14];
        }

        const icon = L.divIcon({ html: iconHtml, iconSize, iconAnchor });
        const marker = L.marker([cluster.lat, cluster.lng], { icon }).addTo(markersRef.current);
        
        marker.on('click', () => {
          setSelectedCluster(cluster);
        });
      });
    }
  }, [reports, showMarkers, tactical]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    map.eachLayer(l => { if (l._isCZ) map.removeLayer(l); });
    criticalZones.forEach(z => {
      const c = z.severity==='crítica'?'#dc2626':z.severity==='alta'?'#eab308':'#2563eb';
      const circle = L.circle([z.center.lat, z.center.lng], { radius: z.radiusKm*1000, color:c, weight:3, opacity:0.85, fillColor:c, fillOpacity:0.1, dashArray:'8 4' });
      circle._isCZ = true; circle.addTo(map);
      circle.bindPopup(`<div style="font-family:system-ui;min-width:200px"><h3 style="color:${c};margin-top:0;font-size:1.1rem;font-weight:700;">Severidad ${z.severity.toUpperCase()}</h3><p style="margin:4px 0;"><strong>Score:</strong> ${z.score}/100</p><p style="margin:4px 0;"><strong>Reportes:</strong> ${z.reportCount}</p><p style="margin:4px 0;font-weight:700;">Sobrevivientes: ${z.totalSurvivors}</p></div>`);
    });
  }, [criticalZones]);

  // Refresca el tamaño del mapa cuando cambia el estado de fullscreen
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 300);
    }
  }, [isFullscreen]);

  const filters = [
    {k:'all',l:'Todos'},
    {k:'desaparecido',l:'Desaparecidos'},
    {k:'sobreviviente',l:'Atrapados'}
  ];

  const extCount = reports.filter(r => r.source === 'external').length;
  const localCount = reports.filter(r => r.source !== 'external').length;

  return (
    <div className={`map-wrap ${isFullscreen ? 'fullscreen-map' : ''}`} style={isFullscreen ? {position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999} : {}}>
      <div id="map-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}/>
      
      {/* React Modal para el Cluster seleccionado */}
      {selectedCluster && (
        <div style={{
          position: 'absolute', top: 70, left: 10, zIndex: 2000, 
          background: 'var(--card)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          width: 300, maxHeight: 'calc(100% - 150px)', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--border)'
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
              📍 {selectedCluster.reports.length} {selectedCluster.reports.length === 1 ? 'Reporte' : 'Reportes'}
            </h3>
            <button onClick={() => setSelectedCluster(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: 0, color: 'var(--text3)' }}>✕</button>
          </div>
          <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }} className="scroll-dark">
            {selectedCluster.reports.map(r => {
              const isS = r.tipo === 'sobreviviente';
              const isM = r.tipo === 'mascota';
              const isExt = r.source === 'external';
              const c = isExt ? 'var(--blue)' : isS ? sevColors[r.severity] : r.encontrado ? 'var(--green)' : 'var(--blue)';
              let title = isS ? 'Sobreviviente '+r.severity : isM ? (r.encontrado ? 'Mascota Encontrada' : 'Mascota Atrapada') : (r.encontrado ? 'Localizado' : 'Desaparecido');
              
              return (
                <div key={r._id} 
                     onClick={() => { if (onReportClick) onReportClick(r); }}
                     style={{
                       marginBottom: 12, borderLeft: `4px solid ${c}`, paddingLeft: 12, 
                       cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)',
                       background: 'var(--bg2)', transition: 'background 0.2s', borderRadius: '0 8px 8px 0',
                       paddingTop: 8
                     }}>
                  <b style={{ color: c, display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</b>
                  {(!isS && r.nombre) && <p style={{ margin: '4px 0 2px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>{r.nombre}</p>}
                  {(isS && r.survivorsCount) && <p style={{ margin: '4px 0 2px', fontSize: '0.85rem', color: 'var(--text2)' }}><strong>Personas:</strong> {r.survivorsCount}</p>}
                  <p style={{ color: 'var(--text3)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>Estado: <b style={{color: 'var(--text2)'}}>{r.status||'N/A'}</b></p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel de Filtros Tácticos Flotante (Chips) */}
      <div style={{
        position:'absolute', top: 70, right: 10, left: showChipBar ? 10 : 'auto', zIndex: 900,
        display:'flex', flexDirection:'column', gap: 8, alignItems: showChipBar ? 'stretch' : 'flex-end'
      }}>
        {!showChipBar ? (
          <button className="btn btn-outline" onClick={() => setShowChipBar(true)} style={{ background: 'var(--card)', borderRadius: 20, padding: '8px 12px', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
            <span>Filtros</span>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 4, scrollbarWidth: 'none', width: '100%' }} className="chips-container">
              <button className="btn btn-sm btn-outline" onClick={() => { setShowChipBar(false); setShowFilters(false); }} style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '6px 12px', background: 'var(--card)', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                ✕ Cerrar
              </button>
              {filters.map(x => (
                <button key={x.k}
                        className={`btn btn-sm ${tactical.tipo===x.k?'btn-primary':'btn-outline'}`}
                        onClick={() => {
                          setTactical({...tactical, tipo: x.k});
                          if (onFilterChange) onFilterChange(x.k);
                        }} style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '6px 12px', background: tactical.tipo===x.k?'var(--red)':'var(--card)', color: tactical.tipo===x.k?'#fff':'var(--text)', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  {x.l}
                </button>
              ))}
              <button className="btn btn-sm btn-outline" 
                      onClick={() => setShowFilters(!showFilters)} 
                      style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '6px 12px', background: showFilters?'#e2e8f0':'var(--card)', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                Filtros +
              </button>
            </div>
            
            {showFilters && (
          <div style={{ background: 'var(--card)', padding: 12, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="flex items-center gap-1 fs-xs" style={{cursor:'pointer', width: '100%', marginBottom: 4, fontWeight: 'bold'}}>
              <input type="checkbox" checked={showMarkers} onChange={e=>setShowMarkers(e.target.checked)}/> Mostrar puntos individuales
            </label>
            <select className="btn btn-sm btn-outline" style={{padding:'4px 8px',flex:1, borderRadius: 8}} value={tactical.time} onChange={e => setTactical({...tactical, time: e.target.value})}>
              <option value="all">Tiempo: Todo</option>
              <option value="1h">Última 1h</option>
              <option value="6h">Últimas 6h</option>
              <option value="24h">Últimas 24h</option>
            </select>

            <select className="btn btn-sm btn-outline" style={{padding:'4px 8px',flex:1, borderRadius: 8}} value={tactical.severity} onChange={e => setTactical({...tactical, severity: e.target.value})}>
              <option value="all">Gravedad: Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>

            <select className="btn btn-sm btn-outline" style={{padding:'4px 8px',flex:1, borderRadius: 8}} value={tactical.status} onChange={e => setTactical({...tactical, status: e.target.value})}>
              <option value="all">Estado: Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
            </select>
          </div>
        )}
          </>
        )}
      </div>
      <div className="legend">
        <div className="fw-700 fs-xs">Intensidad</div>
        <div className="legend-bar"/><div className="legend-labels"><span>Baja</span><span>Alta</span><span>Crítica</span></div>
      </div>
      <div style={{position:'absolute',bottom:20,left:10,zIndex:150,background:'rgba(255,255,255,0.95)',padding:'6px 12px',borderRadius:20,border:'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontSize:'0.78rem'}}>
        <b>{reports.length}</b> reportes · <b>{criticalZones.length}</b> zonas
      </div>
    </div>
  );
}
