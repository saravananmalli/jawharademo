import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

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

const SELECT_CLS = 'h-9 pl-8 pr-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none';
const INPUT_CLS  = 'h-9 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36';

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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select value={preset} onChange={handlePresetChange} className={SELECT_CLS}>
          {PRESETS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            max={customEnd || undefined}
            onChange={e => setCStart(e.target.value)}
            className={INPUT_CLS}
          />
          <input
            type="date"
            value={customEnd}
            min={customStart || undefined}
            onChange={e => setCEnd(e.target.value)}
            className={INPUT_CLS}
          />
          <button
            onClick={handleApply}
            disabled={!customStart || !customEnd}
            className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
}
