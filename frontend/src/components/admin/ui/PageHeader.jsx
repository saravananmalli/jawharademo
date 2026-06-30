import { Box, Typography, Divider } from '@mui/material';

export function PageHeader({ title, subtitle, action, breadcrumb, divider = false, className = '' }) {
  return (
    <Box className={className} sx={{ mb: 3.5 }}>
      <Box sx={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
      }}>
        <Box sx={{ minWidth: 0 }}>
          {breadcrumb && (
            <Typography sx={{
              fontSize: 10, fontWeight: 700, color: 'text.disabled', mb: 0.75,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {breadcrumb}
            </Typography>
          )}
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.025em' }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ mt: 0.75, fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0, mt: 0.25 }}>
            {action}
          </Box>
        )}
      </Box>
      {divider && <Divider sx={{ mt: 2.5 }} />}
    </Box>
  );
}
