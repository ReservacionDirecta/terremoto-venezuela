import React, { useState, useRef, useCallback } from 'react';

export default function ReportForm({ tipo, onSubmit, onCancel }) {
  const isDes = tipo === 'desaparecido';
  const isMas = tipo === 'mascota';
  const [f, setF] = useState({ lat:'', lng:'', nombre:'', edad:'', ultimaUbicacion:'', description:'', survivorsCount:'', severity:'alta', contactoReportante:'', telefonoReportante:'', encontrado: false });
  const [submitting, setSubmitting] = useState(false);
  const [gps, setGps] = useState({ active: false, loading: false, error: '' });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoType, setFotoType] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setF(p => ({...p, [k]: v}));

  // ─── GPS ──────────────────────────────────────
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

  // ─── Compresor de imagen agresivo ─────────────
  const compressImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10*1024*1024) { alert('Imagen muy grande (máx 10MB)'); return; }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const MAX = 300; // más pequeño para móviles
        if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        // calidad 0.5 para reducción agresiva
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
        nombre: f.nombre, edad: f.edad ? parseInt(f.edad) : undefined,
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
  const emoji = isDes ? '🔍' : isMas ? '🐾' : '🆘';

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
      <h2 style={{fontWeight:700,fontSize:'1.15rem'}}>{titulo}</h2>

      {/* ─── GPS ─── */}
      <div className={`gps-section ${gps.active && f.lat ? 'active' : ''}`}>
        <div className="fw-700 mb-2">Ubicación</div>

        {gps.active && f.lat ? (
          <div>
            <div className="fw-700" style={{color:'#16a34a'}}>Ubicación detectada</div>
            <div className="fs-sm text-gray mt-1">{f.lat}, {f.lng}</div>
            {gps.accuracy && <div className="fs-xs text-gray">Precisión: ±{gps.accuracy}m</div>}
            <button type="button" className="btn btn-sm btn-outline mt-2" onClick={getGPS}>Actualizar</button>
          </div>
        ) : gps.loading ? (
          <div className="flex items-center gap-2" style={{justifyContent:'center'}}>
            <div className="spinner" style={{width:20,height:20,borderWidth:2}}/><span className="fs-sm text-gray">Obteniendo GPS...</span>
          </div>
        ) : (
          <div>
            <button type="button" className="btn btn-secondary btn-block" onClick={getGPS}>
              Usar GPS del dispositivo
            </button>
            {gps.error && <div className="fs-sm text-red mt-2">{gps.error}</div>}
          </div>
        )}

        <div className="mt-3">
          <div className="fs-xs text-gray mb-1">O ingresa manualmente:</div>
          <div className="grid-2">
            <input type="number" step="any" placeholder="Latitud" value={f.lat} onChange={e => set('lat', e.target.value)} />
            <input type="number" step="any" placeholder="Longitud" value={f.lng} onChange={e => set('lng', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ─── Foto (solo desaparecidos y mascotas) ─── */}
      {(isDes || isMas) && (
        <div>
          <div className="fw-700 mb-2">Foto {isMas && '(Recomendada)'}</div>
          {fotoPreview ? (
            <div style={{position:'relative',display:'inline-block'}}>
              <img src={fotoPreview} alt="" style={{width:120,height:120,borderRadius:10,objectFit:'cover',border:'2px solid #eee'}} />
              <button type="button" onClick={() => { setFoto(null); setFotoPreview(null); }}
                      style={{position:'absolute',top:-8,right:-8,width:24,height:24,borderRadius:'50%',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{border:`2px dashed ${dragOver?'#2563eb':'#ddd'}`,borderRadius:12,padding:'20px',textAlign:'center',cursor:'pointer',background:dragOver?'#eff6ff':'#fafafa'}}>
              <div style={{fontSize:'1.8rem',marginBottom:4}}>Seleccionar</div>
              <div className="fs-sm text-gray">Toca para seleccionar foto</div>
              <div className="fs-xs text-gray mt-1">Se comprime automáticamente</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:'none'}} />
        </div>
      )}

      {/* ─── Datos ─── */}
      {isDes ? (
        <>
          <input placeholder="Nombre completo *" value={f.nombre} onChange={e => set('nombre', e.target.value)} required />
          <div className="grid-2">
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
          <textarea rows={2} placeholder="Descripción (raza, color, etc) *" value={f.description} onChange={e => set('description', e.target.value)} required style={{resize:'vertical'}} />
        </>
      ) : (
        <>
          <textarea rows={3} placeholder="Describe la situación... *" value={f.description} onChange={e => set('description', e.target.value)} required style={{resize:'vertical'}} />
          <div className="grid-2">
            <input type="number" min="1" max="999" placeholder="N° personas *" value={f.survivorsCount} onChange={e => set('survivorsCount', e.target.value)} required />
            <select value={f.severity} onChange={e => set('severity', e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </>
      )}

      {/* ─── Contacto ─── */}
      <div className="grid-2">
        <input placeholder="Tu nombre" value={f.contactoReportante} onChange={e => set('contactoReportante', e.target.value)} />
        <input placeholder="Teléfono" value={f.telefonoReportante} onChange={e => set('telefonoReportante', e.target.value)} />
      </div>

      <div className="flex gap-2" style={{justifyContent:'flex-end'}}>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enviando...' : `Reportar`}
        </button>
      </div>
    </form>
  );
}
