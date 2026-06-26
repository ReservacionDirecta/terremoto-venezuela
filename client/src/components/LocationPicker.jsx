import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Epicenter coordinates (Yaracuy/Carabobo, Venezuela)
const EPI_CENTER = [10.35, -68.62];
const DEFAULT_ZOOM = 13;

export default function LocationPicker({ 
  lat, 
  lng, 
  onLocationChange, 
  required = false 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [geocodeSuccess, setGeocodeSuccess] = useState(false);
  const [manualLat, setManualLat] = useState(lat || '');
  const [manualLng, setManualLng] = useState(lng || '');
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    
    const map = L.map(mapRef.current, {
      center: EPI_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      // Remove marker if no coordinates
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const latlng = [latNum, lngNum];
    
    // Create or update marker
    if (!markerRef.current) {
      const marker = L.marker(latlng, { 
        draggable: true,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background: #dc2626;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: grab;
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }).addTo(mapInstanceRef.current);
      
      // Handle marker drag
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
        setManualLat(pos.lat.toFixed(6));
        setManualLng(pos.lng.toFixed(6));
        setGeocodeSuccess(false);
      });
      
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(latlng);
    }
    
    // Center map on marker
    mapInstanceRef.current.setView(latlng, Math.max(mapInstanceRef.current.getZoom(), 15));
  }, [lat, lng, onLocationChange]);

  // Geocode address using Nominatim
  const geocodeAddress = useCallback(async () => {
    if (!address.trim()) {
      setGeocodeError('Ingresa una dirección');
      return;
    }

    setGeocoding(true);
    setGeocodeError('');
    setGeocodeSuccess(false);

    try {
      // Add "Venezuela" to improve results
      const searchQuery = address.includes('Venezuela') 
        ? address 
        : `${address}, Venezuela`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=ve`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'HalladosApp/1.0',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error en el servicio de geocodificación');
      }

      const data = await response.json();

      if (data.length === 0) {
        setGeocodeError('No se encontró la dirección. Intenta ser más específico.');
        return;
      }

      const result = data[0];
      const newLat = parseFloat(result.lat).toFixed(6);
      const newLng = parseFloat(result.lon).toFixed(6);
      
      onLocationChange(newLat, newLng);
      setManualLat(newLat);
      setManualLng(newLng);
      setGeocodeSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setGeocodeSuccess(false), 3000);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Error al buscar la dirección. Intenta de nuevo.');
    } finally {
      setGeocoding(false);
    }
  }, [address, onLocationChange]);

  // Handle manual coordinate input
  const handleManualCoordinates = useCallback(() => {
    const latNum = parseFloat(manualLat);
    const lngNum = parseFloat(manualLng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      setGeocodeError('Coordenadas inválidas');
      return;
    }
    
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setGeocodeError('Coordenadas fuera de rango');
      return;
    }
    
    onLocationChange(manualLat, manualLng);
    setGeocodeError('');
    setGeocodeSuccess(false);
  }, [manualLat, manualLng, onLocationChange]);

  // Handle Enter key in address input
  const handleAddressKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-txt">
        Ubicación {required && <span className="text-red-600">*</span>}
      </label>

      {/* Address input with geocoding */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: Av. Principal, Edificio 5, Piso 3, Caracas"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={geocodeAddress}
            disabled={geocoding || !address.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {geocoding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </>
            )}
          </button>
        </div>

        {/* Status messages */}
        {geocodeError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {geocodeError}
          </p>
        )}
        
        {geocodeSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Ubicación encontrada. Arrastra el marcador para ajustar.
          </p>
        )}
      </div>

      {/* Mini map */}
      <div 
        ref={mapRef} 
        className="w-full h-48 rounded-lg border border-border overflow-hidden relative"
        style={{ zIndex: 0 }}
      />

      {/* Manual coordinates input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-txt3">O ingresa coordenadas manualmente:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-txt3 mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              placeholder="10.4806"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={handleManualCoordinates}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-txt3 mb-1">Longitud</label>
            <input
              type="number"
              step="any"
              placeholder="-66.9036"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              onBlur={handleManualCoordinates}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualCoordinates}
          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 border border-border"
        >
          Actualizar ubicación en el mapa
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs text-txt3 space-y-1">
        <p>• Escribe una dirección y haz clic en "Buscar" para geocodificar</p>
        <p>• Arrastra el marcador rojo en el mapa para ajustar la ubicación</p>
        <p>• O ingresa coordenadas manualmente y haz clic en "Actualizar"</p>
      </div>
    </div>
  );
}
