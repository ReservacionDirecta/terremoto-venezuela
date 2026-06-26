import React, { useState, useEffect, useCallback } from 'react';
import { isLoggedIn, verifyToken, logout } from './api';
import { ThemeProvider } from './ThemeContext';
import PublicPage from './PublicPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import './App.css';

function AppInner() {
  const [auth, setAuth] = useState(null);

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
    return <div className="page text-center mt-4"><div className="spinner" style={{margin:'40px auto'}}/></div>;
  }

  return auth ? (
    <AdminPage onLogout={handleLogout} />
  ) : (
    <PublicPage onLoginClick={handleLogin} />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
