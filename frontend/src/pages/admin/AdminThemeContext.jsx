import { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  };

  return (
    <AdminThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
