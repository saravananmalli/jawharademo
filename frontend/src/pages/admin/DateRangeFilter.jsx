import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Box, Select, MenuItem } from '@mui/material';

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

const inputSx = {
  height: 36, px: 1.5, fontSize: 13, fontFamily: 'Inter, sans-serif',
  border: '1px solid', borderColor: 'divider', borderRadius: 2,
  bgcolor: 'background.paper', color: 'text.primary',
  outline: 'none', cursor: 'pointer', appearance: 'none',
  '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
};

export default function DateRangeFilter({ onChange, currentPreset = 'today' }) {
  const [preset,      setPreset] = useState(currentPreset);
  const [customStart, setCStart] = useState('');
  const [customEnd,   setCEnd]   = useState('');

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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Select
        value={preset}
        onChange={handlePresetChange}
        size="small"
        startAdornment={<Calendar size={13} style={{ marginRight: 6, color: '#9ca3af', flexShrink: 0 }} />}
        sx={{ minWidth: 160, height: 36, fontSize: 13 }}
        MenuProps={{ disableScrollLock: true, PaperProps: { elevation: 3, sx: { mt: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' } } }}
      >
        {PRESETS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
      </Select>

      {preset === 'custom' && (
        <>
          <Box component="input" type="date" value={customStart} max={customEnd || undefined} onChange={e => setCStart(e.target.value)} sx={{ ...inputSx, width: 144, px: 1.5 }} />
          <Box component="input" type="date" value={customEnd} min={customStart || undefined} onChange={e => setCEnd(e.target.value)} sx={{ ...inputSx, width: 144, px: 1.5 }} />
          <Box
            component="button"
            onClick={handleApply}
            disabled={!customStart || !customEnd}
            sx={{
              height: 36, px: 2, borderRadius: 2, bgcolor: 'primary.main', color: '#fff',
              fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
              transition: 'background-color 0.15s',
            }}
          >
            Apply
          </Box>
        </>
      )}
    </Box>
  );
}
