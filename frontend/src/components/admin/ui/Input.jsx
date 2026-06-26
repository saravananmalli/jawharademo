const BASE_INPUT = 'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

export function Input({ label, error, helper, icon: Icon, className = '', required, ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={15} />
          </div>
        )}
        <input
          className={`${BASE_INPUT} ${Icon ? 'pl-9' : ''} ${error ? 'border-red-400 focus:ring-red-500' : ''}`}
          {...props}
        />
      </div>
      {error  && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

export function Textarea({ label, error, helper, className = '', required, rows = 3, ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`${BASE_INPUT} resize-y min-h-[80px] ${error ? 'border-red-400 focus:ring-red-500' : ''}`}
        {...props}
      />
      {error  && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

export function Select({ label, error, helper, className = '', required, children, ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`${BASE_INPUT} appearance-none cursor-pointer ${error ? 'border-red-400 focus:ring-red-500' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error  && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

export function Toggle({ label, helper, checked, onChange, disabled = false }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200 peer-disabled:opacity-50" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
      </div>
      {label && (
        <span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {helper && <span className="block text-xs text-gray-500 dark:text-gray-400">{helper}</span>}
        </span>
      )}
    </label>
  );
}
