import { Box, Paper, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAP = {
  indigo:  { bar: '#6366f1', iconBg: 'rgba(99,102,241,0.12)',  iconColor: '#6366f1',  glow: 'rgba(99,102,241,0.10)'  },
  violet:  { bar: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)', iconColor: '#8b5cf6',  glow: 'rgba(139,92,246,0.10)' },
  emerald: { bar: '#10b981', iconBg: 'rgba(16,185,129,0.12)', iconColor: '#10b981',  glow: 'rgba(16,185,129,0.10)' },
  amber:   { bar: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#d97706',  glow: 'rgba(245,158,11,0.10)' },
  rose:    { bar: '#f43f5e', iconBg: 'rgba(244,63,94,0.12)',  iconColor: '#e11d48',  glow: 'rgba(244,63,94,0.10)'  },
  sky:     { bar: '#0ea5e9', iconBg: 'rgba(14,165,233,0.12)', iconColor: '#0284c7',  glow: 'rgba(14,165,233,0.10)' },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  color = 'indigo',
  loading = false,
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  const isPositive = parseFloat(change) >= 0;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: `${c.bar}35`,
          boxShadow: `0 0 0 1px ${c.bar}18, 0 4px 28px ${c.glow}`,
        },
      }}
    >
      {/* Radial gradient glow */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', top: 0, right: 0,
          width: 160, height: 160,
          background: `radial-gradient(ellipse at top right, ${c.bar}12 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top edge accent bar */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${c.bar}00 0%, ${c.bar}88 40%, ${c.bar}00 100%)`,
          borderRadius: '12px 12px 0 0',
        }}
      />

      {loading ? (
        <>
          <Skeleton variant="text" width="55%" height={14} sx={{ mb: 1.5 }} />
          <Skeleton variant="rectangular" width="70%" height={36} sx={{ borderRadius: 1.5, mb: 1.5 }} />
          <Skeleton variant="text" width="45%" height={13} />
        </>
      ) : (
        <>
          {/* Row 1: Label + Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{
              fontSize: '11.5px', fontWeight: 600, color: 'text.secondary',
              letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.3,
            }}>
              {title}
            </Typography>
            {Icon && (
              <Box sx={{
                width: 34, height: 34, borderRadius: 2.5, flexShrink: 0,
                bgcolor: c.iconBg,
                border: `1px solid ${c.bar}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color={c.iconColor} strokeWidth={1.75} />
              </Box>
            )}
          </Box>

          {/* Row 2: Value */}
          <Typography sx={{
            fontSize: 30, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', mb: 1.75,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </Typography>

          {/* Row 3: Trend badge + period label */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {change !== undefined && (
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                fontSize: '11px', fontWeight: 700,
                px: 1, py: 0.375, borderRadius: 1.5,
                bgcolor: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: isPositive ? '#059669' : '#dc2626',
                letterSpacing: '0.01em',
              }}>
                {isPositive
                  ? <TrendingUp size={11} strokeWidth={2.5} />
                  : <TrendingDown size={11} strokeWidth={2.5} />}
                {isPositive ? '+' : ''}{change}%
              </Box>
            )}
            {changeLabel && (
              <Typography sx={{ fontSize: '11.5px', color: 'text.disabled', lineHeight: 1.4 }}>
                {changeLabel}
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}
