import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography } from '@mui/material';
import { X } from 'lucide-react';

const SIZE_MAP = {
  sm:    'sm',
  md:    'sm',
  lg:    'md',
  xl:    'lg',
  '2xl': 'xl',
  full:  false,
};

export function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={SIZE_MAP[size] || 'sm'}
      fullWidth
      className={className}
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            pb: 1.5, pr: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent dividers sx={{ py: 2.5 }} className="admin-scroll">
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
}
