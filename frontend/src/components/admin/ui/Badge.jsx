const VARIANTS = {
  default:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  success:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning:  'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger:   'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  info:     'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  purple:   'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const DOT_COLORS = {
  default: 'bg-gray-400',
  primary: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-sky-500',
  purple:  'bg-purple-500',
};

export function Badge({ children, variant = 'default', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[variant]}`} />}
      {children}
    </span>
  );
}

const STATUS_MAP = {
  active:     { variant: 'success', label: 'Active' },
  inactive:   { variant: 'default', label: 'Inactive' },
  pending:    { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info',    label: 'Processing' },
  shipped:    { variant: 'primary', label: 'Shipped' },
  delivered:  { variant: 'success', label: 'Delivered' },
  cancelled:  { variant: 'danger',  label: 'Cancelled' },
  refunded:   { variant: 'purple',  label: 'Refunded' },
  draft:      { variant: 'default', label: 'Draft' },
  published:  { variant: 'success', label: 'Published' },
  true:       { variant: 'success', label: 'Active' },
  false:      { variant: 'default', label: 'Inactive' },
};

export function StatusBadge({ status }) {
  const key = String(status).toLowerCase();
  const cfg = STATUS_MAP[key] || { variant: 'default', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
