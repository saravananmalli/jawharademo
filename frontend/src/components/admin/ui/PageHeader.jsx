export function PageHeader({ title, subtitle, action, breadcrumb, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6 ${className}`}>
      <div>
        {breadcrumb && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{breadcrumb}</p>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
