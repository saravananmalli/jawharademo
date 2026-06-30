import React, { useState, useRef } from 'react';
import {
  TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem,
  Switch, FormControlLabel, Box, Typography, InputAdornment,
} from '@mui/material';
import { Search } from 'lucide-react';

const SEARCH_THRESHOLD = 6;

export function Input({ label, error, helper, icon: Icon, className = '', required, ...props }) {
  return (
    <TextField
      label={label}
      error={Boolean(error)}
      helperText={error || helper}
      required={required}
      fullWidth
      size="small"
      className={className}
      InputProps={Icon ? {
        startAdornment: (
          <Box sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
            <Icon size={14} />
          </Box>
        ),
      } : undefined}
      {...props}
    />
  );
}

export function Textarea({ label, error, helper, className = '', required, rows = 3, ...props }) {
  return (
    <TextField
      label={label}
      error={Boolean(error)}
      helperText={error || helper}
      required={required}
      fullWidth
      multiline
      rows={rows}
      size="small"
      className={className}
      {...props}
    />
  );
}

export function Select({ label, error, helper, className = '', required, children, value, onChange, sx, ...props }) {
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  const allItems = React.Children.toArray(children);
  const showSearch = allItems.length > SEARCH_THRESHOLD;

  const filtered = showSearch && search.trim()
    ? allItems.filter(child => {
        if (!React.isValidElement(child)) return true;
        if (child.props.value === value) return true;
        const text = typeof child.props.children === 'string' ? child.props.children : '';
        return text.toLowerCase().includes(search.toLowerCase());
      })
    : allItems;

  const menuProps = {
    disableScrollLock: true,
    PaperProps: {
      elevation: 3,
      sx: {
        maxHeight: 320,
        mt: 0.5,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
      },
    },
    ...(showSearch && {
      TransitionProps: {
        onEntered: () => searchRef.current?.focus(),
      },
    }),
    onClose: () => setSearch(''),
  };

  const searchBox = (
    <Box
      key="__search__"
      sx={{
        px: 1.25, pt: 1.25, pb: 1,
        position: 'sticky', top: 0,
        bgcolor: 'background.paper',
        zIndex: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
      onKeyDown={e => e.stopPropagation()}
    >
      <TextField
        size="small"
        fullWidth
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        inputRef={searchRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={13} />
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiInputBase-root': { fontSize: 13 } }}
      />
    </Box>
  );

  const selectChildren = showSearch ? [
    searchBox,
    ...(filtered.length > 0
      ? filtered
      : [<MenuItem key="__empty__" disabled sx={{ fontSize: 13, color: 'text.disabled' }}>No results</MenuItem>]
    ),
  ] : children;

  const commonProps = {
    value,
    onChange,
    displayEmpty: !label,
    MenuProps: menuProps,
    ...props,
  };

  if (label) {
    return (
      <FormControl fullWidth size="small" error={Boolean(error)} className={className} required={required} sx={sx}>
        <InputLabel>{label}</InputLabel>
        <MuiSelect {...commonProps} label={label}>
          {selectChildren}
        </MuiSelect>
        {(error || helper) && (
          <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.75 }}>
            {error || helper}
          </Typography>
        )}
      </FormControl>
    );
  }

  return (
    <FormControl size="small" error={Boolean(error)} className={className} sx={{ width: '100%', ...sx }}>
      <MuiSelect {...commonProps}>
        {selectChildren}
      </MuiSelect>
      {(error || helper) && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.75 }}>
          {error || helper}
        </Typography>
      )}
    </FormControl>
  );
}

export function Toggle({ label, helper, checked, onChange, disabled = false }) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            size="small"
            color="primary"
          />
        }
        label={
          <Box>
            {label && (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
            )}
            {helper && (
              <Typography variant="caption" color="text.secondary">{helper}</Typography>
            )}
          </Box>
        }
      />
    </Box>
  );
}
