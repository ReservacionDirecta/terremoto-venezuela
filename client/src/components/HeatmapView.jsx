import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const EPI = [10.35, -68.62];
const sevColors = { alta:'#dc2626', media:'#eab308', baja:'#2563eb' };

export default function HeatmapView({ reports, criticalZones, filter, onFilterChange, onReportClick, selectedReport }) {
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const markersRef = useRef(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);

  // Initialize Leaflet map
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('map-container', {
      center: EPI, zoom: 8, zoomControl: true, attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
    }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://carto.com/">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright">OSM</a>')
      .addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; markersRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const h = () => setSelectedCluster(null);
    map.on('click', h);
    return () => map.off('click', h);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedReport) return;
    const lat = selectedReport.lat || selectedReport.location?.coordinates?.[1];
    const lng = selectedReport.lng || selectedReport.location?.coordinates?.[0];
    if (lat && lng) map.setView([lat, lng], 14, { animate: true });
  }, [selectedReport]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (markersRef.current) markersRef.current.clearLayers();

    const now = Date.now();
    const filtered = reports.filter(r => {
      if (filter !== 'all' && r.tipo !== filter) return false;
      return r.lat != null && r.lng != null;
    });

    const data = filtered.filter(r => r.tipo !== 'mascota').map(r => {
      let w = 1;
      if (r.tipo === 'sobreviviente') {
        w = (r.severity === 'alta' ? 2 : r.severity === 'media' ? 1 : 0.5) *
            Math.min((r.survivorsCount || 1) / 2, 4);
      } else {
        w = r.encontrado ? 0.1 : 1.2;
      }
      if (r.reportedAt && (now - new Date(r.reportedAt)) < 3600000) w *= 2;
      return [r.lat, r.lng, w];
    });

    if (data.length) {
      heatRef.current = L.heatLayer(data, {
        radius: 40, blur: 28, max: 1.8,
        gradient: {
          0.1: 'rgba(37, 99, 235, 0.4)',
          0.4: 'rgba(234, 179, 8, 0.7)',
          0.7: 'rgba(249, 115, 22, 0.85)',
          1.0: 'rgba(220, 38, 38, 0.95)'
        }
      }).addTo(map);
      const b = L.latLngBounds(filtered.map(r => [r.lat, r.lng]));
      if (b.isValid()) map.fitBounds(b, { padding: [40,40], maxZoom: 14 });
    }

    if (showMarkers && markersRef.current) {
      const clusters = {};
      filtered.forEach(r => {
        const key = `${Math.round(r.lat*100)}_${Math.round(r.lng*100)}`;
        if (!clusters[key]) clusters[key] = { lat: 0, lng: 0, count: 0, reports: [], hasCritical: false };
        clusters[key].lat += r.lat; clusters[key].lng += r.lng;
        clusters[key].count++; clusters[key].reports.push(r);
        if (r.tipo === 'sobreviviente' && r.severity === 'alta') clusters[key].hasCritical = true;
      });

      Object.values(clusters).forEach(cluster => {
        cluster.lat /= cluster.count; cluster.lng /= cluster.count;
        let iconHtml, iconSize, iconAnchor;
        if (cluster.count === 1) {
          const r = cluster.reports[0];
          const c = r.source === 'external' ? '#2563eb' : r.tipo === 'sobreviviente' ? sevColors[r.severity] : r.encontrado ? '#16a34a' : '#2563eb';
          const size = r.tipo === 'sobreviviente' ? 14 : 12;
          iconHtml = `<div style="width:${size}px;height:${size}px;background:${c};border:2px solid rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`;
          iconSize = [size+8, size+8]; iconAnchor = [(size+8)/2, (size+8)/2];
        } else {
          const bg = cluster.hasCritical ? '#dc2626' : '#2563eb';
          iconHtml = `<div style="width:34px;height:34px;background:${bg};border:2.5px solid rgba(255,255,255,0.9);border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:0 3px 12px rgba(0,0,0,0.4);font-family:system-ui;">${cluster.count}</div>`;
          iconSize = [34, 34]; iconAnchor = [17, 17];
        }
        const icon = L.divIcon({ html: iconHtml, iconSize, iconAnchor, className: '' });
        const marker = L.marker([cluster.lat, cluster.lng], { icon }).addTo(markersRef.current);
        marker.on('click', (e) => { L.DomEvent.stopPropagation(e); setSelectedCluster(cluster); });
      });
    }
  }, [reports, showMarkers, filter]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    map.eachLayer(l => { if (l._isCZ) map.removeLayer(l); });
    criticalZones.forEach(z => {
      const c = z.severity==='crítica'?'#dc2626':z.severity==='alta'?'#eab308':'#2563eb';
      const circle = L.circle([z.center.lat, z.center.lng], {
        radius: z.radiusKm*1000, color:c, weight:3, opacity:0.85,
        fillColor:c, fillOpacity:0.1, dashArray:'8 4'
      });
      circle._isCZ = true; circle.addTo(map);
      circle.bindPopup(`<div style="font-family:system-ui;min-width:200px"><h3 style="color:${c};margin-top:0">Severidad ${z.severity.toUpperCase()}</h3><p><b>Score:</b> ${z.score}/100</p><p><b>Reportes:</b> ${z.reportCount}</p><p><b>Sobrevivientes:</b> ${z.totalSurvivors}</p></div>`);
    });
  }, [criticalZones]);

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 300);
  }, []);

  return (
    <div className="map-wrap">
      <div id="map-container" className="absolute inset-0" />

      {/* Filter bar */}
      <div className="absolute top-2.5 right-2.5 z-500 flex items-center gap-1.5 flex-wrap rounded-xl px-3 py-2 text-xs"
           style={{background:'rgba(15,23,42,0.85)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
        <span className="font-bold" style={{color:'rgba(255,255,255,0.6)'}}>FILTRO:</span>
        {[{k:'all',l:'Todos'},{k:'desaparecido',l:'Desap.'},{k:'sobreviviente',l:'Atrap.'}].map(x => (
          <button key={x.k}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              filter===x.k
                ? 'bg-red-600 text-white border-transparent'
                : 'bg-transparent border-white/15 text-white/70 hover:text-white/90'
            }`}
            style={{border: filter!==x.k ? '1px solid rgba(255,255,255,0.15)' : 'none'}}
            onClick={() => onFilterChange && onFilterChange(x.k)}>
            {x.l}
          </button>
        ))}
      </div>

      {/* Cluster panel */}
      {selectedCluster && (
        <div className="absolute top-15 left-2.5 z-[1000] w-70 max-h-[calc(100%-140px)] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
             onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
            <h3 className="text-base font-bold m-0">📍 {selectedCluster.reports.length} {selectedCluster.reports.length===1?'reporte':'reportes'}</h3>
            <button onClick={() => setSelectedCluster(null)}
                    className="bg-transparent border-none text-lg cursor-pointer p-1 text-muted hover:text-txt">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3.5 py-2.5">
            {selectedCluster.reports.map(r => {
              const isS = r.tipo === 'sobreviviente';
              const c = r.source === 'external' ? '#2563eb' : isS ? sevColors[r.severity] : r.encontrado ? '#16a34a' : '#2563eb';
              const title = isS ? `Sobreviviente ${r.severity}` : r.encontrado ? 'Localizado' : 'Desaparecido';
              return (
                <div key={r._id} onClick={() => { if (onReportClick) onReportClick(r); setSelectedCluster(null); }}
                     className="mb-2.5 pl-2.5 pb-2.5 cursor-pointer border-b border-border"
                     style={{borderLeft:`3px solid ${c}`}}>
                  <b className="text-xs uppercase" style={{color:c}}>{title}</b>
                  {r.nombre && <p className="text-sm font-semibold my-0.5">{r.nombre}</p>}
                  {isS && r.survivorsCount && <p className="text-xs text-muted">👥 {r.survivorsCount} persona(s)</p>}
                  <p className="text-xs text-muted">📍 {r.ultimaUbicacion||`${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <div className="font-bold text-xs">Intensidad</div>
        <div className="legend-bar" />
        <div className="legend-labels"><span>Baja</span><span>Alta</span></div>
      </div>

      {/* Counter */}
      <div className="absolute bottom-5 left-2.5 z-500 rounded-lg px-3 py-1.5 text-xs"
           style={{background:'rgba(15,23,42,0.85)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.9)'}}>
        📍 <b>{reports.length.toLocaleString()}</b> · 🎯 <b>{criticalZones.length}</b> zonas
      </div>
    </div>
  );
}
