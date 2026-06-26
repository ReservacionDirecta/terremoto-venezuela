import React from 'react';
import { ThemeProvider } from './ThemeContext';
import AdminPage from './AdminPage';

export default function App() {
  return (
    <ThemeProvider>
      <AdminPage />
    </ThemeProvider>
  );
}
