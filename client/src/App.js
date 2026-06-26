import React, { useState, useEffect, useCallback } from 'react';
import { isLoggedIn, verifyToken, logout } from './api';
import { ThemeProvider } from './ThemeContext';
import PublicPage from './PublicPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import './App.css';

function AppInner() {
  const [auth, setAuth] = useState(null);       // null=loading, false=no, true=sí
  const [showAdmin, setShowAdmin] = useState(false); // si el usuario pidió #admin

  // Detectar hash para ruta admin
  useEffect(() => {
    const check = () => setShowAdmin(window.location.hash === '#admin');
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      verifyToken().then(() => setAuth(true)).catch(() => { logout(); setAuth(false); });
    } else {
      setAuth(false);
    }
  }, []);

  const handleLogin = useCallback(() => setAuth(true), []);
  const handleLogout = useCallback(() => { logout(); setAuth(false); }, []);

  if (auth === null) {
    return <div className="empty-state"><div className="spinner" style={{margin:'40px auto'}}/><p className="mt-2">Cargando...</p></div>;
  }

  // Admin route
  if (showAdmin) {
    return auth ? <AdminPage onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />;
  }

  // Público
  return <PublicPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
