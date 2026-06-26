import React, { useState } from 'react';
import { login } from './api';

export default function LoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <h1>Acceso Super Admin</h1>
        {onBack && <button className="btn btn-sm" style={{borderColor:'rgba(255,255,255,0.4)',color:'#fff',background:'transparent'}}
                         onClick={onBack}>← Volver</button>}
      </div>

      <div className="page" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <h2 className="fw-700 mb-3">Iniciar Sesión</h2>
          <p className="fs-sm text-gray mb-4">Solo personal autorizado.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="fs-sm fw-700" style={{ display: 'block', marginBottom: 4 }}>Usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                     placeholder="admin" autoFocus required />
            </div>
            <div>
              <label className="fs-sm fw-700" style={{ display: 'block', marginBottom: 4 }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
