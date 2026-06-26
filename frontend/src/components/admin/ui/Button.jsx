import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30',
  secondary: 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700',
  outline:   'bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-200 dark:hover:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm shadow-red-200 dark:shadow-red-900/30',
  success:   'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
  xl: 'h-11 px-6 text-base gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  return (
    <button
      className={`${base} ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={15} />
      ) : Icon ? (
        <Icon size={15} />
      ) : null}
      {children}
      {iconRight && !loading && <iconRight size={15} />}
    </button>
  );
}

export function IconBtn({ icon: Icon, label, variant = 'ghost', size = 'md', className = '', ...props }) {
  const ICON_SIZES = { xs: 'w-6 h-6', sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-9 h-9' };
  const base = 'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <button
      title={label}
      aria-label={label}
      className={`${base} ${VARIANTS[variant] || VARIANTS.ghost} ${ICON_SIZES[size] || ICON_SIZES.md} ${className}`}
      {...props}
    >
      {Icon && <Icon size={15} />}
    </button>
  );
}
