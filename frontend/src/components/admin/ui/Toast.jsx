import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let _addToast = null;

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: '#10b981',
    bg: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.15)' },
    border: { light: 'rgba(16,185,129,0.3)', dark: 'rgba(16,185,129,0.28)' },
  },
  error: {
    icon: XCircle,
    color: '#ef4444',
    bg: { light: 'rgba(239,68,68,0.08)', dark: 'rgba(239,68,68,0.14)' },
    border: { light: 'rgba(239,68,68,0.28)', dark: 'rgba(239,68,68,0.26)' },
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: { light: 'rgba(245,158,11,0.09)', dark: 'rgba(245,158,11,0.14)' },
    border: { light: 'rgba(245,158,11,0.3)', dark: 'rgba(245,158,11,0.28)' },
  },
  info: {
    icon: Info,
    color: '#0ea5e9',
    bg: { light: 'rgba(14,165,233,0.09)', dark: 'rgba(14,165,233,0.14)' },
    border: { light: 'rgba(14,165,233,0.28)', dark: 'rgba(14,165,233,0.26)' },
  },
};

export function Toast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  _addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-4), { ...toast, id }]);
  }, []);

  return (
    <Box sx={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      display: 'flex', flexDirection: 'column', gap: 1.25,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </Box>
  );
}

function ToastItem({ id, type = 'info', message, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(id), 200);
    }, 4200);
    return () => clearTimeout(dismissTimer);
  }, [id, onDismiss]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 200);
  };

  return (
    <Box
      sx={{
        pointerEvents: 'auto',
        minWidth: 300, maxWidth: 360,
        animation: exiting
          ? 'toastOut 0.2s ease-in both'
          : 'slideInRight 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        '@keyframes toastOut': {
          from: { opacity: 1, transform: 'translateX(0)' },
          to:   { opacity: 0, transform: 'translateX(16px)' },
        },
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1.25,
        px: 1.75, py: 1.5,
        borderRadius: 2.5,
        bgcolor: cfg.bg.light,
        border: `1px solid ${cfg.border.light}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        '.dark &': {
          bgcolor: cfg.bg.dark,
          borderColor: cfg.border.dark,
        },
      }}>
        <Box sx={{ mt: 0.125, flexShrink: 0 }}>
          <Icon size={16} color={cfg.color} strokeWidth={2} />
        </Box>
        <Typography sx={{
          flex: 1, fontSize: '13px', fontWeight: 500, lineHeight: 1.45,
          color: 'text.primary',
        }}>
          {message}
        </Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            mt: -0.25, mr: -0.5, flexShrink: 0,
            color: 'text.disabled', width: 24, height: 24,
            '&:hover': { color: 'text.secondary', bgcolor: 'action.hover' },
          }}
        >
          <X size={13} />
        </IconButton>
      </Box>
    </Box>
  );
}

export function useToast() {
  return {
    success: (message) => _addToast?.({ type: 'success', message }),
    error:   (message) => _addToast?.({ type: 'error',   message }),
    warning: (message) => _addToast?.({ type: 'warning', message }),
    info:    (message) => _addToast?.({ type: 'info',    message }),
    danger:  (message) => _addToast?.({ type: 'error',   message }),
  };
}
