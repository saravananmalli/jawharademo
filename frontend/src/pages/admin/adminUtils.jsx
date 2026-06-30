import { Box } from '@mui/material';

const STATUS_DEF = {
  pending:      { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c',  dot: '#f97316' },
  processing:   { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb',  dot: '#3b82f6' },
  shipped:      { bg: 'rgba(14,165,233,0.1)',  color: '#0284c7',  dot: '#0ea5e9' },
  delivered:    { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  cancelled:    { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  paid:         { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  failed:       { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  unpaid:       { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c',  dot: '#f97316' },
  active:       { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  blocked:      { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  admin:        { bg: 'rgba(245,158,11,0.1)',  color: '#d97706',  dot: '#f59e0b' },
  customer:     { bg: 'rgba(107,114,128,0.1)', color: '#6b7280',  dot: '#9ca3af' },
  approved:     { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  rejected:     { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  inStock:      { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  outOfStock:   { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  'Best Seller':{ bg: 'rgba(249,115,22,0.1)',  color: '#ea580c',  dot: '#f97316' },
  new:          { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb',  dot: '#3b82f6' },
  sale:         { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  dot: '#ef4444' },
  published:    { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  dot: '#10b981' },
  hidden:       { bg: 'rgba(107,114,128,0.1)', color: '#6b7280',  dot: '#9ca3af' },
};

const FALLBACK = { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', dot: '#9ca3af' };

export function StatusChip({ status, label }) {
  const def = STATUS_DEF[status] || FALLBACK;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75,
        px: 1.25, py: '3.5px', borderRadius: 5,
        fontSize: '11.5px', fontWeight: 700, textTransform: 'capitalize',
        bgcolor: def.bg, color: def.color,
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: def.dot, flexShrink: 0 }} />
      {label ?? status}
    </Box>
  );
}

export function getKpiColors(variant) {
  const map = {
    gold:   { bg: 'rgba(245,158,11,0.12)',  text: '#d97706' },
    maroon: { bg: 'rgba(244,63,94,0.12)',   text: '#e11d48' },
    green:  { bg: 'rgba(16,185,129,0.12)',  text: '#059669' },
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#2563eb' },
  };
  return map[variant] || map.gold;
}
