import { Skeleton as MuiSkeleton, Box, Paper } from '@mui/material';

export function Skeleton({ className = '', width, height, sx = {} }) {
  return (
    <MuiSkeleton
      variant="rectangular"
      className={className}
      width={width}
      height={height || 16}
      sx={{ borderRadius: 1, ...sx }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <MuiSkeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? '65%' : '100%'}
          height={14}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <Paper
      elevation={0}
      className={className}
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <MuiSkeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 2.5 }} />
        <Box sx={{ flex: 1 }}>
          <MuiSkeleton variant="text" width={120} height={16} sx={{ mb: 0.75 }} />
          <MuiSkeleton variant="text" width={80} height={12} />
        </Box>
      </Box>
      <MuiSkeleton variant="rectangular" height={80} sx={{ borderRadius: 1.5, mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <MuiSkeleton variant="rectangular" height={32} sx={{ flex: 1, borderRadius: 1.5 }} />
        <MuiSkeleton variant="rectangular" width={72} height={32} sx={{ borderRadius: 1.5 }} />
      </Box>
    </Paper>
  );
}
