import { createTheme, alpha } from '@mui/material/styles';

const GOLD   = '#967123';
const MAROON = '#8B1538';

// Exact palette from reference screenshots
const DARK_BG        = '#23242B';   // main background + sidebar
const DARK_PAPER     = '#2D2E38';   // cards / elevated surfaces
const DARK_ELEVATED  = '#34353F';   // modals, menus
const DARK_BORDER    = 'rgba(255,255,255,0.06)';
const DARK_DIVIDER   = 'rgba(255,255,255,0.07)';

const LIGHT_BG       = '#F6F7FA';   // page background
const LIGHT_PAPER    = '#ffffff';   // cards
const LIGHT_BORDER   = 'rgba(0,0,0,0.06)';
const LIGHT_DIVIDER  = 'rgba(0,0,0,0.07)';

const sharedTypography = {
  fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 },
  h5: { fontWeight: 700 },
  h6: { fontWeight: 700 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
};

const sharedComponents = (mode) => {
  const isDark = mode === 'dark';

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          whiteSpace: 'nowrap',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundImage: 'none',
          boxShadow: isDark
            ? '0 2px 12px rgba(0,0,0,0.35)'
            : '0 1px 8px rgba(0,0,0,0.06)',
          border: `1px solid ${isDark ? DARK_BORDER : LIGHT_BORDER}`,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: isDark
            ? '0 2px 12px rgba(0,0,0,0.35)'
            : '0 1px 8px rgba(0,0,0,0.06)',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f5f8',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280',
            whiteSpace: 'nowrap',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: isDark ? DARK_BORDER : '#f0f0f0',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover .MuiTableCell-root': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafbfc',
          },
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.72rem',
        },
      },
    },

    // Sidebar always stays dark in both themes (matches reference)
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: DARK_BG,
          color: '#ffffff',
          borderRight: 'none',
          boxShadow: isDark ? 'none' : '2px 0 12px rgba(0,0,0,0.12)',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? DARK_BG : LIGHT_PAPER,
          color: isDark ? '#f9fafb' : '#23242B',
          boxShadow: 'none',
          borderBottom: `1px solid ${isDark ? DARK_DIVIDER : '#e9eaec'}`,
          backdropFilter: 'none',
        },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small' },
    },

    MuiSelect: {
      defaultProps: { size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f1f5',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: GOLD,
          },
        },
        notchedOutline: {
          borderColor: isDark ? DARK_BORDER : 'rgba(0,0,0,0.1)',
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isDark ? DARK_DIVIDER : LIGHT_DIVIDER,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: isDark ? DARK_ELEVATED : LIGHT_PAPER,
          boxShadow: isDark
            ? '0 8px 40px rgba(0,0,0,0.6)'
            : '0 8px 40px rgba(0,0,0,0.12)',
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          backgroundImage: 'none',
          backgroundColor: isDark ? DARK_ELEVATED : LIGHT_PAPER,
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5)'
            : '0 4px 24px rgba(0,0,0,0.1)',
          border: `1px solid ${isDark ? DARK_BORDER : LIGHT_BORDER}`,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '0.75rem' },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${isDark ? DARK_BORDER : '#f0f0f0'}`,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f5f8',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${isDark ? DARK_BORDER : '#f0f0f0'}`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${isDark ? DARK_BORDER : '#f0f0f0'}`,
          },
        },
      },
    },
  };
};

export function createAdminTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: GOLD,
        light: '#b8902e',
        dark: '#7a5a1a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: MAROON,
        light: '#a81c44',
        dark: '#6d102c',
        contrastText: '#ffffff',
      },
      background: isDark
        ? { default: DARK_BG, paper: DARK_PAPER }
        : { default: LIGHT_BG, paper: LIGHT_PAPER },
      text: isDark
        ? { primary: '#f0f1f5', secondary: '#8b8fa8' }
        : { primary: '#23242B', secondary: '#6b7280' },
      divider: isDark ? DARK_DIVIDER : LIGHT_DIVIDER,
      success: {
        main: '#16a34a',
        light: isDark ? alpha('#16a34a', 0.15) : '#f0fdf4',
        contrastText: '#fff',
      },
      error: {
        main: '#dc2626',
        light: isDark ? alpha('#dc2626', 0.15) : '#fef2f2',
        contrastText: '#fff',
      },
      warning: {
        main: '#d97706',
        light: isDark ? alpha('#d97706', 0.15) : '#fffbeb',
        contrastText: '#fff',
      },
      info: {
        main: '#2563eb',
        light: isDark ? alpha('#2563eb', 0.15) : '#eff6ff',
        contrastText: '#fff',
      },
      action: {
        hover:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        selected: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        disabled: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
      },
    },
    typography: sharedTypography,
    shape: { borderRadius: 10 },
    components: sharedComponents(mode),
  });
}

export default createAdminTheme('light');
