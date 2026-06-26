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
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-red-600 text-white shadow-md">
        <h1 className="text-lg font-bold text-white">Acceso Super Admin</h1>
        {onBack && <button className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-transparent cursor-pointer"
                           style={{border:'1px solid rgba(255,255,255,0.4)'}}
                           onClick={onBack}>← Volver</button>}
      </div>

      <div className="flex-1 flex flex-col justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm max-w-sm mx-auto w-full">
          <h2 className="font-bold mb-3">Iniciar Sesión</h2>
          <p className="text-sm text-txt3 mb-4">Solo personal autorizado.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                     placeholder="admin" autoFocus required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••" required />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
