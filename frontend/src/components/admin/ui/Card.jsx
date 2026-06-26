export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm ${hover ? 'card-hover hover:shadow-md' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 ml-4 shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}
