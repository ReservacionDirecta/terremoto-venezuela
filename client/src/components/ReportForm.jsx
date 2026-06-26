import React, { useState, useRef, useCallback } from 'react';

export default function ReportForm({ tipo, onSubmit, onCancel }) {
  const isDes = tipo === 'desaparecido';
  const isMas = tipo === 'mascota';
  const [f, setF] = useState({ lat:'', lng:'', nombre:'', identificacion: '', edad:'', ultimaUbicacion:'', description:'', survivorsCount:'', severity:'alta', contactoReportante:'', telefonoReportante:'', encontrado: false });
  const [submitting, setSubmitting] = useState(false);
  const [gps, setGps] = useState({ active: false, loading: false, error: '' });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoType, setFotoType] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setF(p => ({...p, [k]: v}));

  const getGPS = () => {
    if (!navigator.geolocation) { setGps({active:false,loading:false,error:'No soportado'}); return; }
    setGps({active:true,loading:true,error:''});
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat', pos.coords.latitude.toFixed(6));
        set('lng', pos.coords.longitude.toFixed(6));
        setGps({active:true,loading:false,error:'',accuracy:Math.round(pos.coords.accuracy)});
      },
      err => setGps({active:false,loading:false,error:'GPS denegado o no disponible. Ingresa manualmente.'}),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const compressImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10*1024*1024) { alert('Imagen muy grande (máx 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const MAX = 300;
        if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL('image/jpeg', 0.5);
        setFoto(b64); setFotoPreview(b64); setFotoType('image/jpeg');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onFile = e => { const file = e.target.files[0]; if (file) compressImage(file); };
  const onDrop = e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) compressImage(file); };

  const submit = async e => {
    e.preventDefault();
    if (!f.lat || !f.lng) { alert('Ubicación requerida'); return; }
    if (isDes && !f.nombre) { alert('Nombre requerido'); return; }
    if (isMas && !f.description && !f.nombre) { alert('Nombre o descripción requerida'); return; }
    if (!isDes && !isMas && (!f.description || !f.survivorsCount)) { alert('Completa todos los campos'); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        tipo, lat: parseFloat(f.lat), lng: parseFloat(f.lng),
        nombre: f.nombre, identificacion: f.identificacion, edad: f.edad ? parseInt(f.edad) : undefined,
        ultimaUbicacion: f.ultimaUbicacion, description: f.description,
        survivorsCount: f.survivorsCount ? parseInt(f.survivorsCount) : undefined,
        severity: isDes || isMas ? undefined : f.severity,
        contactoReportante: f.contactoReportante, telefonoReportante: f.telefonoReportante,
        encontrado: isMas ? f.encontrado : undefined,
        foto: foto || undefined, fotoContentType: fotoType || undefined
      });
    } finally { setSubmitting(false); }
  };

  const titulo = isDes ? '🔍 Reportar Desaparecido' : isMas ? '🐾 Reportar Mascota' : '🆘 Reportar Sobrevivientes';

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <h2 className="text-lg font-bold">{titulo}</h2>

      {/* GPS */}
      <div className={`rounded-2xl p-5 text-center border-2 border-dashed transition-colors ${gps.active && f.lat ? 'border-green-600 bg-green-50' : 'border-blue-600 bg-surface'}`}>
        <div className="font-bold mb-2">Ubicación</div>
        {gps.active && f.lat ? (
          <div>
            <div className="font-bold text-green-600">Ubicación detectada</div>
            <div className="text-sm text-txt3 mt-1">{f.lat}, {f.lng}</div>
            {gps.accuracy && <div className="text-xs text-txt3">Precisión: ±{gps.accuracy}m</div>}
            <button type="button" className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-surface text-txt2 border border-border2" onClick={getGPS}>Actualizar</button>
          </div>
        ) : gps.loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-border2 border-t-red-600 rounded-full animate-spin" />
            <span className="text-sm text-txt3">Obteniendo GPS...</span>
          </div>
        ) : (
          <div>
            <button type="button" className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold cursor-pointer transition-all hover:bg-blue-700" onClick={getGPS}>
              Usar GPS del dispositivo
            </button>
            {gps.error && <div className="text-sm text-red-600 mt-2">{gps.error}</div>}
          </div>
        )}
        <div className="mt-3">
          <div className="text-xs text-txt3 mb-1">O ingresa manualmente:</div>
          <div className="grid grid-cols-2 gap-2.5">
            <input type="number" step="any" placeholder="Latitud" value={f.lat} onChange={e => set('lat', e.target.value)} />
            <input type="number" step="any" placeholder="Longitud" value={f.lng} onChange={e => set('lng', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Photo */}
      {(isDes || isMas) && (
        <div>
          <div className="font-bold mb-2">Foto {isMas && '(Recomendada)'}</div>
          {fotoPreview ? (
            <div className="relative inline-block">
              <img src={fotoPreview} alt="" className="w-30 h-30 rounded-xl object-cover border-2 border-border" />
              <button type="button" onClick={() => { setFoto(null); setFotoPreview(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white border-none cursor-pointer font-bold text-sm flex items-center justify-center">✕</button>
            </div>
          ) : (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                 onDragLeave={() => setDragOver(false)}
                 onDrop={onDrop}
                 onClick={() => fileRef.current?.click()}
                 className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-600 bg-blue-50' : 'border-border2 bg-bg'}`}>
              <div className="text-2xl mb-1">Seleccionar</div>
              <div className="text-sm text-txt3">Toca para seleccionar foto</div>
              <div className="text-xs text-txt3 mt-1">Se comprime automáticamente</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </div>
      )}

      {/* Data fields */}
      {isDes ? (
        <>
          <input placeholder="Nombre completo *" value={f.nombre} onChange={e => set('nombre', e.target.value)} required />
          <input placeholder="Documento de Identidad (CI/DNI)" value={f.identificacion} onChange={e => set('identificacion', e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="number" min="0" max="120" placeholder="Edad" value={f.edad} onChange={e => set('edad', e.target.value)} />
            <input placeholder="Última ubicación" value={f.ultimaUbicacion} onChange={e => set('ultimaUbicacion', e.target.value)} />
          </div>
        </>
      ) : isMas ? (
        <>
          <select value={f.encontrado ? 'true' : 'false'} onChange={e => set('encontrado', e.target.value === 'true')}>
            <option value="false">Atrapada / Perdida</option>
            <option value="true">Encontrada / Rescatada</option>
          </select>
          <input placeholder="Nombre (si lo sabes)" value={f.nombre} onChange={e => set('nombre', e.target.value)} />
          <textarea rows={2} placeholder="Descripción (raza, color, etc) *" value={f.description} onChange={e => set('description', e.target.value)} required />
        </>
      ) : (
        <>
          <textarea rows={3} placeholder="Describe la situación... *" value={f.description} onChange={e => set('description', e.target.value)} required />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="number" min="1" max="999" placeholder="N° personas *" value={f.survivorsCount} onChange={e => set('survivorsCount', e.target.value)} required />
            <select value={f.severity} onChange={e => set('severity', e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </>
      )}

      {/* Contact */}
      <div className="grid grid-cols-2 gap-2.5">
        <input placeholder="Tu nombre" value={f.contactoReportante} onChange={e => set('contactoReportante', e.target.value)} />
        <input placeholder="Teléfono" value={f.telefonoReportante} onChange={e => set('telefonoReportante', e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-surface text-txt2 border border-border2 hover:border-txt3"
                onClick={onCancel}>Cancelar</button>
        <button type="submit"
                className="inline-flex items-center px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}>
          {submitting ? 'Enviando...' : 'Reportar'}
        </button>
      </div>
    </form>
  );
}
