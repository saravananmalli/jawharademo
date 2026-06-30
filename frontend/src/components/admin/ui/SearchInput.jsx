import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, X } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  size = 'small',
  sx = {},
}) {
  return (
    <TextField
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      size={size}
      fullWidth
      className={className}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2.5,
          transition: 'all 0.15s ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(99,102,241,0.14)',
          },
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ color: 'text.disabled' }}>
            <Search size={14} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onChange('')}
              edge="end"
              sx={{ mr: -0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
            >
              <X size={13} />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
