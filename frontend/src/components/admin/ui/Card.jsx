import { Paper, Box, Typography } from '@mui/material';

export function Card({ children, className = '', hover = false, padding = false, sx = {}, ...props }) {
  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...(hover && {
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'rgba(99,102,241,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          },
        }),
        ...(padding && { p: 3 }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}

export function CardHeader({ title, subtitle, action, className = '', border = true }) {
  return (
    <Box
      className={className}
      sx={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        px: 3, pt: 2.5, pb: 2,
        ...(border && { borderBottom: '1px solid', borderColor: 'divider' }),
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{
          fontSize: '14.5px', fontWeight: 700, lineHeight: 1.3,
          letterSpacing: '-0.015em',
        }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 0.5, fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, flexShrink: 0 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

export function CardBody({ children, className = '', sx = {} }) {
  return (
    <Box className={className} sx={{ px: 3, pt: 2.5, pb: 3, ...sx }}>
      {children}
    </Box>
  );
}

export function CardFooter({ children, className = '', sx = {} }) {
  return (
    <Box
      className={className}
      sx={{
        px: 2.5, py: 2,
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'action.hover',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
