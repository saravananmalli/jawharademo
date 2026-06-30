import { Box, Chip } from '@mui/material';

const VARIANT_MAP = {
  default:  { bg: 'rgba(100,116,139,0.1)',  color: '#64748b',  border: 'rgba(100,116,139,0.18)' },
  primary:  { bg: 'rgba(99,102,241,0.1)',   color: '#4f46e5',  border: 'rgba(99,102,241,0.2)'   },
  success:  { bg: 'rgba(16,185,129,0.1)',   color: '#059669',  border: 'rgba(16,185,129,0.2)'   },
  warning:  { bg: 'rgba(245,158,11,0.1)',   color: '#d97706',  border: 'rgba(245,158,11,0.2)'   },
  danger:   { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626',  border: 'rgba(239,68,68,0.2)'    },
  info:     { bg: 'rgba(14,165,233,0.1)',   color: '#0284c7',  border: 'rgba(14,165,233,0.2)'   },
  purple:   { bg: 'rgba(168,85,247,0.1)',   color: '#7c3aed',  border: 'rgba(168,85,247,0.2)'   },
  orange:   { bg: 'rgba(249,115,22,0.1)',   color: '#ea580c',  border: 'rgba(249,115,22,0.2)'   },
};

const DOT_COLORS = {
  default: '#94a3b8',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#0ea5e9',
  purple:  '#a855f7',
  orange:  '#f97316',
};

export function Badge({ children, variant = 'default', dot = false, className = '' }) {
  const v = VARIANT_MAP[variant] || VARIANT_MAP.default;
  return (
    <Chip
      className={className}
      label={
        dot ? (
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              component="span"
              sx={{
                width: 5.5, height: 5.5, borderRadius: '50%',
                bgcolor: DOT_COLORS[variant] || DOT_COLORS.default,
                flexShrink: 0, display: 'inline-block',
              }}
            />
            {children}
          </Box>
        ) : children
      }
      size="small"
      sx={{
        bgcolor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        fontWeight: 600,
        fontSize: '11px',
        height: 22,
        borderRadius: 1.5,
        '& .MuiChip-label': { px: 1.25 },
      }}
    />
  );
}

const STATUS_MAP = {
  active:     { variant: 'success', label: 'Active' },
  inactive:   { variant: 'default', label: 'Inactive' },
  pending:    { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info',    label: 'Processing' },
  shipped:    { variant: 'primary', label: 'Shipped' },
  delivered:  { variant: 'success', label: 'Delivered' },
  cancelled:  { variant: 'danger',  label: 'Cancelled' },
  refunded:   { variant: 'purple',  label: 'Refunded' },
  draft:      { variant: 'default', label: 'Draft' },
  published:  { variant: 'success', label: 'Published' },
  true:       { variant: 'success', label: 'Active' },
  false:      { variant: 'default', label: 'Inactive' },
};

export function StatusBadge({ status }) {
  const key = String(status).toLowerCase();
  const cfg = STATUS_MAP[key] || { variant: 'default', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
