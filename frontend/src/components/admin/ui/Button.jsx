import { Button as MuiButton, IconButton as MuiIconButton, CircularProgress, Tooltip } from '@mui/material';

const VARIANT_MAP = {
  primary:   { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined',  color: 'inherit' },
  outline:   { variant: 'outlined',  color: 'primary' },
  ghost:     { variant: 'text',      color: 'inherit' },
  danger:    { variant: 'contained', color: 'error' },
  success:   { variant: 'contained', color: 'success' },
  warning:   { variant: 'contained', color: 'warning' },
};

const SIZE_MAP = {
  xs: 'small',
  sm: 'small',
  md: 'medium',
  lg: 'medium',
  xl: 'large',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  sx = {},
  ...props
}) {
  const v = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const muiSize = SIZE_MAP[size] || 'medium';

  return (
    <MuiButton
      variant={v.variant}
      color={v.color}
      size={muiSize}
      disabled={disabled || loading}
      className={className}
      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : Icon ? <Icon size={14} strokeWidth={2} /> : undefined}
      endIcon={IconRight && !loading ? <IconRight size={14} strokeWidth={2} /> : undefined}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: '10px',
        fontSize: size === 'xs' || size === 'sm' ? '0.75rem' : '0.8125rem',
        ...(size === 'xs' && { height: 28, px: 1.5, py: 0 }),
        ...(size === 'sm' && { height: 32, px: 1.75 }),
        ...(v.variant === 'text' && v.color === 'inherit' && {
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
        }),
        ...(v.variant === 'outlined' && v.color === 'inherit' && {
          color: 'text.secondary',
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover', borderColor: 'action.hover' },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}

export function IconBtn({ icon: Icon, label, variant = 'ghost', size = 'md', className = '', sx = {}, ...props }) {
  const SIZE_PX = { xs: 24, sm: 28, md: 32, lg: 36 };
  const px = SIZE_PX[size] || 32;
  const iconSize = size === 'xs' ? 13 : size === 'sm' ? 14 : 15;

  const colorMap = {
    primary:   { color: 'white', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } },
    secondary: { color: 'text.secondary', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } },
    ghost:     { color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } },
    danger:    { color: 'white', bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } },
  };

  const btn = (
    <MuiIconButton
      aria-label={label}
      className={className}
      size="small"
      sx={{
        width: px, height: px, borderRadius: 1.5,
        ...colorMap[variant] || colorMap.ghost,
        ...sx,
      }}
      {...props}
    >
      {Icon && <Icon size={iconSize} strokeWidth={1.75} />}
    </MuiIconButton>
  );

  return label ? <Tooltip title={label}>{btn}</Tooltip> : btn;
}
