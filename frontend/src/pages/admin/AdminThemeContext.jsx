import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAdminTheme } from './theme';

// Import admin SCSS system (themes + global base styles)
import '../../styles/admin/index.scss';

const AdminThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

const STORAGE_KEY = 'jawhara_admin_theme';

export function AdminThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  // Sync [data-admin-theme] on <html> so CSS custom properties in _themes.scss activate
  useEffect(() => {
    document.documentElement.setAttribute('data-admin-theme', mode);
    return () => document.documentElement.removeAttribute('data-admin-theme');
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  };

  const theme = useMemo(() => createAdminTheme(mode), [mode]);

  return (
    <AdminThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
