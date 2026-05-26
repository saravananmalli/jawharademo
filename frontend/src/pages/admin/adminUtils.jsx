import { Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_DEF = {
  // Order statuses
  pending:    { light: { bg: '#fff7ed', color: '#c2410c' }, dark: { bg: alpha('#c2410c', 0.18), color: '#fb923c' } },
  processing: { light: { bg: '#eff6ff', color: '#1d4ed8' }, dark: { bg: alpha('#1d4ed8', 0.18), color: '#60a5fa' } },
  shipped:    { light: { bg: '#e0f2fe', color: '#0369a1' }, dark: { bg: alpha('#0369a1', 0.18), color: '#38bdf8' } },
  delivered:  { light: { bg: '#f0fdf4', color: '#15803d' }, dark: { bg: alpha('#15803d', 0.18), color: '#4ade80' } },
  cancelled:  { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
  // Payment
  paid:       { light: { bg: '#f0fdf4', color: '#15803d' }, dark: { bg: alpha('#15803d', 0.18), color: '#4ade80' } },
  failed:     { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
  unpaid:     { light: { bg: '#fff7ed', color: '#c2410c' }, dark: { bg: alpha('#c2410c', 0.18), color: '#fb923c' } },
  // Users
  active:     { light: { bg: '#f0fdf4', color: '#15803d' }, dark: { bg: alpha('#15803d', 0.18), color: '#4ade80' } },
  blocked:    { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
  // Roles
  admin:      { light: { bg: 'rgba(150,113,35,0.1)', color: '#967123' }, dark: { bg: 'rgba(150,113,35,0.22)', color: '#d4a839' } },
  customer:   { light: { bg: '#f3f4f6', color: '#4b5563' }, dark: { bg: 'rgba(255,255,255,0.08)', color: '#9ca3af' } },
  // Review
  approved:   { light: { bg: '#f0fdf4', color: '#15803d' }, dark: { bg: alpha('#15803d', 0.18), color: '#4ade80' } },
  rejected:   { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
  // Stock
  inStock:    { light: { bg: '#f0fdf4', color: '#15803d' }, dark: { bg: alpha('#15803d', 0.18), color: '#4ade80' } },
  outOfStock: { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
  // Badge
  'Best Seller': { light: { bg: '#fff7ed', color: '#c2410c' }, dark: { bg: alpha('#c2410c', 0.18), color: '#fb923c' } },
  new:           { light: { bg: '#eff6ff', color: '#1d4ed8' }, dark: { bg: alpha('#1d4ed8', 0.18), color: '#60a5fa' } },
  sale:          { light: { bg: '#fef2f2', color: '#dc2626' }, dark: { bg: alpha('#dc2626', 0.18), color: '#f87171' } },
};

const FALLBACK = {
  light: { bg: '#f3f4f6', color: '#374151' },
  dark:  { bg: 'rgba(255,255,255,0.08)', color: '#9ca3af' },
};

/**
 * Theme-aware status chip. Works in both light and dark mode.
 * Usage: <StatusChip status="pending" />  or  <StatusChip status={inStock ? 'inStock' : 'outOfStock'} label="In Stock" />
 */
export function StatusChip({ status, label, size = 'small', clickable = false, onClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const def = STATUS_DEF[status] || FALLBACK;
  const colors = isDark ? def.dark : def.light;

  return (
    <Chip
      label={label ?? status}
      size={size}
      clickable={clickable}
      onClick={onClick}
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 700,
        textTransform: 'capitalize',
        fontSize: '0.72rem',
        border: 'none',
        '&:hover': clickable ? { bgcolor: colors.bg, opacity: 0.85 } : undefined,
      }}
    />
  );
}

/**
 * KPI card icon backgrounds — theme-aware.
 */
export function getKpiColors(variant, isDark) {
  const map = {
    gold:   { bg: isDark ? 'rgba(150,113,35,0.2)'  : 'rgba(150,113,35,0.12)',  color: '#967123' },
    maroon: { bg: isDark ? 'rgba(139,21,56,0.2)'   : 'rgba(139,21,56,0.1)',    color: '#8B1538' },
    green:  { bg: isDark ? 'rgba(22,163,74,0.2)'   : 'rgba(52,199,89,0.12)',   color: isDark ? '#4ade80' : '#15803d' },
    blue:   { bg: isDark ? 'rgba(37,99,235,0.2)'   : 'rgba(0,122,255,0.1)',    color: isDark ? '#60a5fa' : '#1d4ed8' },
  };
  return map[variant] || map.gold;
}
