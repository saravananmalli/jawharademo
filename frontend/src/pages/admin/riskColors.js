// Risk / status pill Tailwind class maps for the admin panel.
// Import whichever map you need; all values include light + dark variants.

export const RISK_STYLES = {
  stale:      'bg-amber-50   text-amber-700   dark:bg-amber-950/40   dark:text-amber-400',
  stuck:      'bg-orange-50  text-orange-700  dark:bg-orange-950/40  dark:text-orange-400',
  blocked:    'bg-red-50     text-red-700     dark:bg-red-950/40     dark:text-red-400',
  unassigned: 'bg-slate-100  text-slate-500   dark:bg-slate-800      dark:text-slate-400',
  incomplete: 'bg-purple-50  text-purple-700  dark:bg-purple-950/40  dark:text-purple-400',
};

export const SPRINT_STATUS_STYLES = {
  active:    'bg-brand-50  text-brand-700  dark:bg-brand-900/40  dark:text-brand-400',
  planned:   'bg-slate-100 text-slate-600  dark:bg-slate-800     dark:text-slate-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled: 'bg-red-50    text-red-600    dark:bg-red-950/40    dark:text-red-400',
};

export const STATUS_STYLES = {
  published:  'bg-emerald-50  text-emerald-700  dark:bg-emerald-950/50  dark:text-emerald-400',
  active:     'bg-emerald-50  text-emerald-700  dark:bg-emerald-950/50  dark:text-emerald-400',
  delivered:  'bg-emerald-50  text-emerald-700  dark:bg-emerald-950/50  dark:text-emerald-400',
  pending:    'bg-amber-50    text-amber-700    dark:bg-amber-950/50    dark:text-amber-400',
  processing: 'bg-blue-50     text-blue-700     dark:bg-blue-950/50     dark:text-blue-400',
  shipped:    'bg-indigo-50   text-indigo-700   dark:bg-indigo-950/50   dark:text-indigo-400',
  cancelled:  'bg-red-50      text-red-700      dark:bg-red-950/50      dark:text-red-400',
  refunded:   'bg-orange-50   text-orange-700   dark:bg-orange-950/50   dark:text-orange-400',
  hidden:     'bg-slate-100   text-slate-500    dark:bg-slate-800       dark:text-slate-400',
  blocked:    'bg-red-50      text-red-700      dark:bg-red-950/50      dark:text-red-400',
  draft:      'bg-slate-100   text-slate-500    dark:bg-slate-800       dark:text-slate-400',
};

export const TREND_STYLES = {
  up:      'text-emerald-600 dark:text-emerald-400',
  down:    'text-red-600     dark:text-red-400',
  neutral: 'text-slate-500   dark:text-slate-400',
};
