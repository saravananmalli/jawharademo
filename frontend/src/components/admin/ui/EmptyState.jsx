import { Box, Typography } from '@mui/material';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data found',
  description,
  action,
  className = '',
}) {
  return (
    <Box
      className={className}
      sx={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        py: 9, px: 4, textAlign: 'center',
      }}
    >
      <Box sx={{
        width: 56, height: 56, borderRadius: 3,
        bgcolor: 'action.hover',
        border: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 2.5,
        transition: 'border-color 0.2s ease',
      }}>
        <Icon size={24} strokeWidth={1.4} style={{ opacity: 0.35 }} />
      </Box>

      <Typography sx={{ fontSize: '14.5px', fontWeight: 700, mb: 0.75, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>

      {description && (
        <Typography sx={{
          fontSize: '13px', color: 'text.secondary',
          maxWidth: 320, lineHeight: 1.6,
          mb: action ? 2.5 : 0,
        }}>
          {description}
        </Typography>
      )}

      {action && (
        <Box sx={{ mt: description ? 0 : 2 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
