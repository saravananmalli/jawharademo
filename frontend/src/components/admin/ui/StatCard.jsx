import { TrendingUp, TrendingDown } from 'lucide-react';

const GRADIENTS = {
  indigo:  'from-indigo-500 to-indigo-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber:   'from-amber-400 to-amber-500',
  rose:    'from-rose-500 to-rose-600',
  violet:  'from-violet-500 to-violet-600',
  sky:     'from-sky-500 to-sky-600',
};

const ICON_BG = {
  indigo:  'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  amber:   'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  rose:    'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  violet:  'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  sky:     'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
};

export function StatCard({ title, value, change, changeLabel = 'vs last month', icon: Icon, color = 'indigo', gradient = false }) {
  const isPositive = parseFloat(change) >= 0;

  if (gradient) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${GRADIENTS[color] || GRADIENTS.indigo} text-white shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? <TrendingUp size={13} className="text-white/80" /> : <TrendingDown size={13} className="text-white/80" />}
                <span className="text-xs font-medium text-white/80">
                  {isPositive ? '+' : ''}{change}% {changeLabel}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon size={22} className="text-white" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm card-hover hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={`p-2.5 rounded-xl ${ICON_BG[color] || ICON_BG.indigo}`}>
            <Icon size={20} />
          </div>
        )}
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      {changeLabel && change !== undefined && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{changeLabel}</p>
      )}
    </div>
  );
}
