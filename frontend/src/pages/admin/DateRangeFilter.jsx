import { useState, useEffect } from 'react';
import {
  Box, Select, MenuItem, TextField, Button,
  FormControl, InputAdornment, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DateRangeIcon from '@mui/icons-material/DateRange';

const PRESETS = [
  { label: 'Today',        value: 'today' },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 Days',  value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'This Month',   value: 'thisMonth' },
  { label: 'Last Month',   value: 'lastMonth' },
  { label: 'Custom Range', value: 'custom' },
];

export function computeDateRange(preset, customStart = '', customEnd = '') {
  const now = new Date();
  const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const eod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { startDate: sod(now).toISOString(), endDate: eod(now).toISOString(), label: 'Today', preset: 'today' };
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { startDate: sod(y).toISOString(), endDate: eod(y).toISOString(), label: 'Yesterday', preset: 'yesterday' };
    }
    case 'last7': {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { startDate: sod(d).toISOString(), endDate: eod(now).toISOString(), label: 'Last 7 days', preset: 'last7' };
    }
    case 'last30': {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { startDate: sod(d).toISOString(), endDate: eod(now).toISOString(), label: 'Last 30 days', preset: 'last30' };
    }
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate:   eod(now).toISOString(),
        label:     'This month',
        preset:    'thisMonth',
      };
    case 'lastMonth': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: first.toISOString(), endDate: last.toISOString(), label: 'Last month', preset: 'lastMonth' };
    }
    case 'custom':
      return {
        startDate: customStart ? sod(new Date(customStart + 'T00:00:00')).toISOString() : null,
        endDate:   customEnd   ? eod(new Date(customEnd   + 'T00:00:00')).toISOString() : null,
        label:     'Custom range',
        preset:    'custom',
      };
    default:
      return { startDate: null, endDate: null, label: '', preset: 'today' };
  }
}

// currentPreset: controlled prop so parent can restore the displayed preset after remount
export default function DateRangeFilter({ onChange, currentPreset = 'today' }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [preset,      setPreset] = useState(currentPreset);
  const [customStart, setCStart] = useState('');
  const [customEnd,   setCEnd]   = useState('');

  // Sync displayed preset when parent value changes (e.g. filter remounts or resets)
  useEffect(() => {
    if (currentPreset !== preset) setPreset(currentPreset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPreset]);

  const handlePresetChange = (e) => {
    const next = e.target.value;
    setPreset(next);
    if (next !== 'custom') onChange(computeDateRange(next));
  };

  const handleApply = () => {
    if (customStart && customEnd) onChange(computeDateRange('custom', customStart, customEnd));
  };

  const inputSx = {
    '& .MuiInputBase-root': { borderRadius: '8px', fontSize: '0.83rem' },
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 160 }}>
        <Select
          value={preset}
          onChange={handlePresetChange}
          startAdornment={
            <InputAdornment position="start">
              <DateRangeIcon sx={{ fontSize: '1rem', color: 'text.secondary', mr: -0.5 }} />
            </InputAdornment>
          }
          sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
        >
          {PRESETS.map((p) => (
            <MenuItem key={p.value} value={p.value} sx={{ fontSize: '0.85rem' }}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {preset === 'custom' && (
        <>
          <TextField
            type="date"
            size="small"
            value={customStart}
            onChange={(e) => setCStart(e.target.value)}
            inputProps={{ max: customEnd || undefined }}
            sx={{ width: isMobile ? '100%' : 148, ...inputSx }}
          />
          <TextField
            type="date"
            size="small"
            value={customEnd}
            onChange={(e) => setCEnd(e.target.value)}
            inputProps={{ min: customStart || undefined }}
            sx={{ width: isMobile ? '100%' : 148, ...inputSx }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            disabled={!customStart || !customEnd}
            sx={{
              borderRadius: '8px', height: 36,
              bgcolor: '#967123', '&:hover': { bgcolor: '#7a5b1c' },
              fontSize: '0.8rem', fontWeight: 700,
            }}
          >
            Apply
          </Button>
        </>
      )}
    </Box>
  );
}
