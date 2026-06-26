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

export default function HeatmapView({ reports, criticalZones, filter, onFilterChange, compact }) {
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const markersRef = useRef(null);
  const [showMarkers, setShowMarkers] = useState(true);

  // ... (keep useEffects the same but adjust rendering below)

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

    const data = reports.filter(r => r.tipo !== 'mascota').map(r => {
      let i;
      if (r.tipo === 'sobreviviente') i = (r.severity==='alta'?1:r.severity==='media'?0.6:0.3)*Math.min((r.survivorsCount||1)/5,2);
      else i = r.encontrado ? 0.15 : 0.8;
      return [r.lat, r.lng, i];
    });

    if (data.length) {
      heatRef.current = L.heatLayer(data, { radius: 28, blur: 18, max: 1.2,
        gradient: { 0:'#00c853', 0.3:'#64dd17', 0.5:'#ffd600', 0.7:'#ff6d00', 0.9:'#dd2c00', 1:'#d50000' }
      }).addTo(map);
      const b = L.latLngBounds(reports.map(r => [r.lat, r.lng]));
      if (b.isValid()) map.fitBounds(b, { padding: [40,40], maxZoom: 13 });
    }

    if (showMarkers) {
      reports.forEach(r => {
        const isS = r.tipo === 'sobreviviente';
        const isExt = r.source === 'external';
        const isM = r.tipo === 'mascota';
        const c = isExt ? '#2563eb' : isS ? sevColors[r.severity] : r.encontrado ? '#16a34a' : '#2563eb';
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:${c};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14,14], iconAnchor: [7,7]
        });
        
        let title = isS ? 'Sobreviviente '+r.severity : isM ? (r.encontrado ? 'Mascota Encontrada' : 'Mascota Atrapada/Perdida') : (r.encontrado ? 'Localizado' : 'Desaparecido');
        if (isExt) title += ' (Cotejado)';
        const marker = L.marker([r.lat, r.lng], { icon }).addTo(markersRef.current);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:200px">
            <b style="color:${c}">${title}</b>
            ${(!isS && r.nombre) ? `<p style="margin:4px 0"><b>${r.nombre}</b>${r.edad?' ('+r.edad+')':''}</p>` : ''}
            ${(isS || isM) ? `<p>${r.description || ''}</p>` : ''}
            ${isS ? `<p><strong>Personas:</strong> ${r.survivorsCount}</p>` : ''}
            <p style="color:#666;font-size:0.7rem">Ubicación: ${r.ultimaUbicacion||r.lat.toFixed(4)+', '+r.lng.toFixed(4)}</p>
          </div>`);
      });
    }
  }, [reports, showMarkers]);

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

  const filters = [
    {k:'all',l:'Todos'},
    {k:'desaparecido',l:'Desaparecidos'},
    {k:'sobreviviente',l:'Atrapados'}
  ];

  const extCount = reports.filter(r => r.source === 'external').length;
  const localCount = reports.filter(r => r.source !== 'external').length;

  return (
    <div className="map-wrap">
      <div id="map-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}/>
      {/* Filtro visible tipo topbar */}
      {!compact && (
        <div style={{
          position:'absolute',top:0,left:0,right:0,zIndex:160,
          background:'rgba(255,255,255,0.96)',padding:'8px 12px',
          borderBottom:'2px solid #eee',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'
        }}>
          <span className="fs-xs fw-700 text-gray" style={{whiteSpace:'nowrap'}}>Mostrar en mapa:</span>
          {filters.map(x => (
            <button key={x.k}
                    className={`btn btn-sm ${filter===x.k?'btn-outline active':'btn-outline'}`}
                    onClick={()=>onFilterChange(x.k)}>
              {x.l} <span style={{opacity:0.6}}>({x.k === 'all' ? reports.length : reports.filter(r => r.tipo === x.k).length})</span>
            </button>
          ))}
          {extCount > 0 && <span className="fs-xs" style={{color:'#2563eb'}}>🌐 {extCount} externos</span>}
          <label className="flex items-center gap-1 fs-xs" style={{cursor:'pointer',marginLeft:'auto'}}>
            <input type="checkbox" checked={showMarkers} onChange={e=>setShowMarkers(e.target.checked)}/> Puntos
          </label>
        </div>
      )}
      <div className="legend">
        <div className="fw-700 fs-xs">🔴 Intensidad</div>
        <div className="legend-bar"/><div className="legend-labels"><span>Baja</span><span>Alta</span><span>Crítica</span></div>
      </div>
      <div style={{position:'absolute',bottom:60,left:10,zIndex:150,background:'rgba(255,255,255,0.95)',padding:'6px 12px',borderRadius:8,border:'2px solid #eee',fontSize:'0.78rem'}}>
        📍 <b>{reports.length}</b> · 🎯 <b>{criticalZones.length}</b>
      </div>
    </div>
  );
}
