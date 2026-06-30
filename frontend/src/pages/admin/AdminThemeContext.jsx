import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const AdminThemeContext = createContext({ mode: 'light', toggleMode: () => {} });
const STORAGE_KEY = 'jawhara_admin_theme';

/* ── Shadow scales ──────────────────────────────────────────────────── */
function buildShadows(isDark) {
  const factor = isDark ? 3.5 : 1;
  const s = (a, b, c, d) =>
    `0 ${a}px ${b}px rgba(0,0,0,${(parseFloat(c) * factor).toFixed(2)}), 0 ${d || 1}px ${a || 2}px rgba(0,0,0,${(parseFloat(c) * factor * 0.5).toFixed(2)})`;

  return [
    'none',
    s(1, 3, 0.04),
    s(1, 4, 0.06),
    s(2, 8, 0.07),
    s(4, 12, 0.08),
    s(8, 20, 0.09),
    s(12, 28, 0.10),
    s(16, 40, 0.12),
    s(20, 48, 0.13),
    s(24, 56, 0.14),
    s(28, 64, 0.14),
    s(32, 72, 0.15),
    s(36, 80, 0.16),
    s(40, 88, 0.16),
    s(44, 96, 0.17),
    s(48, 104, 0.18),
    s(52, 112, 0.18),
    s(56, 120, 0.19),
    s(60, 128, 0.20),
    s(64, 136, 0.20),
    s(68, 144, 0.21),
    s(72, 152, 0.22),
    s(76, 160, 0.22),
    s(80, 168, 0.23),
    s(84, 176, 0.24),
  ];
}

/* ── Theme builder ──────────────────────────────────────────────────── */
function buildTheme(mode) {
  const isDark = mode === 'dark';

  const divider   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const hoverBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
  const tableBg   = isDark ? '#161b28' : '#f8fafc';
  const menuShadow = isDark
    ? '0 16px 48px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)'
    : '0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)';
  const menuBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';

  return createTheme({
    palette: {
      mode,
      primary:   { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#fff' },
      secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', contrastText: '#fff' },
      success:   { main: '#10b981', light: '#34d399', dark: '#059669', contrastText: '#fff' },
      warning:   { main: '#f59e0b', light: '#fbbf24', dark: '#d97706', contrastText: '#fff' },
      error:     { main: '#ef4444', light: '#f87171', dark: '#dc2626', contrastText: '#fff' },
      info:      { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7', contrastText: '#fff' },

      background: isDark
        ? { default: '#0c0e16', paper: '#141721' }
        : { default: '#f5f6fa', paper: '#ffffff' },

      text: isDark
        ? { primary: '#e2e8f0', secondary: '#94a3b8', disabled: '#475569' }
        : { primary: '#0f172a', secondary: '#64748b',  disabled: '#94a3b8' },

      divider,

      action: isDark
        ? { hover: hoverBg, selected: 'rgba(99,102,241,0.14)', focus: 'rgba(99,102,241,0.10)', disabledBackground: 'rgba(255,255,255,0.06)', disabled: '#475569' }
        : { hover: hoverBg, selected: 'rgba(99,102,241,0.08)', focus: 'rgba(99,102,241,0.06)', disabledBackground: 'rgba(0,0,0,0.05)',         disabled: '#94a3b8' },
    },

    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
      h5: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.25 },
      h6: { fontWeight: 600, letterSpacing: '-0.015em' },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '-0.005em' },
      body1: { fontSize: '0.875rem',   lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem',  lineHeight: 1.5 },
      caption: { fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.01em' },
      overline: { fontSize: '0.625rem',  fontWeight: 700, letterSpacing: '0.10em' },
    },

    shape: { borderRadius: 12 },

    shadows: buildShadows(isDark),

    transitions: {
      duration: { shortest: 120, shorter: 170, short: 220, standard: 280, complex: 360, enteringScreen: 220, leavingScreen: 170 },
    },

    components: {
      /* ── Paper / Card ──────────────────────────────────────────── */
      MuiPaper: {
        defaultProps:  { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },

      /* ── AppBar ─────────────────────────────────────────────────── */
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },

      /* ── Button ─────────────────────────────────────────────────── */
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            fontSize: '0.8125rem',
            letterSpacing: '-0.01em',
            transition: 'all 0.15s ease',
          },
          contained: {
            '&:hover': { filter: 'brightness(1.06)' },
          },
          outlined: {
            borderWidth: '1px',
            '&:hover': { borderWidth: '1px' },
          },
          sizeSmall: {
            fontSize: '0.75rem',
            padding: '5px 12px',
            borderRadius: 8,
          },
          sizeMedium: { padding: '7px 16px' },
          sizeLarge:  { padding: '9px 20px', fontSize: '0.875rem' },
        },
      },

      /* ── IconButton ─────────────────────────────────────────────── */
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 10, transition: 'all 0.15s ease' },
          sizeSmall: { borderRadius: 8 },
        },
      },

      /* ── Chip ───────────────────────────────────────────────────── */
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            height: 22,
            letterSpacing: '0.01em',
            borderRadius: 6,
          },
          label: { padding: '0 8px' },
          sizeSmall: { height: 20, '& .MuiChip-label': { padding: '0 7px' } },
        },
      },

      /* ── OutlinedInput ──────────────────────────────────────────── */
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontSize: '0.8125rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            transition: 'all 0.15s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
              borderWidth: '1.5px',
            },
          },
          notchedOutline: {
            borderColor: isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.14)',
            transition: 'border-color 0.15s ease',
          },
          input: {
            '&::placeholder': { opacity: isDark ? 0.4 : 0.45 },
          },
          sizeSmall: { borderRadius: 9 },
        },
      },

      /* ── InputBase ──────────────────────────────────────────────── */
      MuiInputBase: {
        styleOverrides: { root: { fontSize: '0.8125rem' } },
      },

      /* ── InputLabel ─────────────────────────────────────────────── */
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            '&.Mui-focused': { color: '#6366f1' },
          },
        },
      },

      /* ── Select ─────────────────────────────────────────────────── */
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 10, fontSize: '0.8125rem' },
          select: { paddingTop: 7, paddingBottom: 7 },
        },
      },

      /* ── MenuItem ───────────────────────────────────────────────── */
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            borderRadius: 8,
            minHeight: 36,
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.12)',
            },
          },
        },
      },

      /* ── Menu ───────────────────────────────────────────────────── */
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            border: `1px solid ${menuBorder}`,
            boxShadow: menuShadow,
          },
          list: {
            padding: '6px',
            '& .MuiMenuItem-root': { borderRadius: 8 },
          },
        },
      },

      /* ── Table ──────────────────────────────────────────────────── */
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            padding: '11px 20px',
            fontSize: '0.8125rem',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: isDark ? '#64748b' : '#94a3b8',
            backgroundColor: tableBg,
            whiteSpace: 'nowrap',
            borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.1s ease',
            '&:last-child td, &:last-child th': { border: 0 },
            '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.018)' },
          },
        },
      },

      /* ── Dialog ─────────────────────────────────────────────────── */
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: `1px solid ${menuBorder}`,
            boxShadow: isDark
              ? '0 24px 64px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.4)'
              : '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontWeight: 600, fontSize: '1rem', padding: '20px 24px 12px' } },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: '16px 24px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } },
      },

      /* ── Backdrop ───────────────────────────────────────────────── */
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.52)',
            backdropFilter: 'blur(4px)',
          },
        },
      },

      /* ── ListItemButton ─────────────────────────────────────────── */
      MuiListItemButton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },

      /* ── Pagination ─────────────────────────────────────────────── */
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 8,
            fontSize: '0.8125rem',
            transition: 'all 0.15s ease',
            '&.Mui-selected': {
              backgroundColor: '#6366f1',
              color: '#fff',
              '&:hover': { backgroundColor: '#4f46e5' },
            },
          },
        },
      },

      /* ── Skeleton ───────────────────────────────────────────────── */
      MuiSkeleton: {
        defaultProps: { animation: 'wave' },
        styleOverrides: {
          root: {
            borderRadius: 8,
            transform: 'none',
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          },
          wave: {
            '&::after': {
              background: isDark
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
            },
          },
        },
      },

      /* ── Tooltip ────────────────────────────────────────────────── */
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            fontSize: '0.6875rem',
            fontWeight: 500,
            borderRadius: 8,
            backgroundColor: isDark ? '#1e293b' : '#0f172a',
            padding: '5px 10px',
            letterSpacing: '0.01em',
          },
          arrow: { color: isDark ? '#1e293b' : '#0f172a' },
        },
      },

      /* ── Divider ────────────────────────────────────────────────── */
      MuiDivider: {
        styleOverrides: { root: { borderColor: divider } },
      },

      /* ── Switch ─────────────────────────────────────────────────── */
      MuiSwitch: {
        styleOverrides: {
          root: { padding: 6 },
          thumb: { boxShadow: '0 1px 3px rgba(0,0,0,0.25)' },
          track: { borderRadius: 99 },
          switchBase: {
            '&.Mui-checked': {
              '& + .MuiSwitch-track': { backgroundColor: '#6366f1', opacity: 1 },
            },
          },
        },
      },

      /* ── Checkbox ───────────────────────────────────────────────── */
      MuiCheckbox: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            '&.Mui-checked': { color: '#6366f1' },
            '&.MuiCheckbox-indeterminate': { color: '#6366f1' },
          },
        },
      },

      /* ── Radio ──────────────────────────────────────────────────── */
      MuiRadio: {
        styleOverrides: {
          root: { '&.Mui-checked': { color: '#6366f1' } },
        },
      },

      /* ── Alert ──────────────────────────────────────────────────── */
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, fontSize: '0.8125rem', alignItems: 'flex-start' },
          message: { paddingTop: 1, paddingBottom: 1 },
          icon: { paddingTop: 2 },
          filledSuccess: { backgroundColor: '#059669' },
          filledError:   { backgroundColor: '#dc2626' },
          filledWarning: { backgroundColor: '#d97706' },
          filledInfo:    { backgroundColor: '#0284c7' },
        },
      },

      /* ── LinearProgress ─────────────────────────────────────────── */
      MuiLinearProgress: {
        styleOverrides: {
          root:   { borderRadius: 99, height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          bar:    { borderRadius: 99 },
        },
      },

      /* ── FormHelperText ─────────────────────────────────────────── */
      MuiFormHelperText: {
        styleOverrides: { root: { fontSize: '0.6875rem', marginLeft: 2 } },
      },

      /* ── Autocomplete ───────────────────────────────────────────── */
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${menuBorder}`,
            boxShadow: menuShadow,
          },
          listbox: { padding: '6px' },
          option: { borderRadius: 8, margin: '1px 0', fontSize: '0.8125rem' },
        },
      },

      /* ── Tabs ───────────────────────────────────────────────────── */
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            letterSpacing: '-0.01em',
            minHeight: 44,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 2, borderRadius: '2px 2px 0 0' },
        },
      },

      /* ── Badge ──────────────────────────────────────────────────── */
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700, fontSize: '0.6rem', height: 16, minWidth: 16, padding: '0 3px' },
        },
      },

      /* ── CircularProgress ───────────────────────────────────────── */
      MuiCircularProgress: {
        styleOverrides: { root: { color: '#6366f1' } },
      },
    },
  });
}

/* ── Provider ───────────────────────────────────────────────────────── */
export function AdminThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
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
      <ThemeProvider theme={buildTheme(mode)}>
        {children}
      </ThemeProvider>
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
