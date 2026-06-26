import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './ThemeContext';
import AdminPage from './AdminPage';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <AdminPage />
    </ThemeProvider>
  );
}
