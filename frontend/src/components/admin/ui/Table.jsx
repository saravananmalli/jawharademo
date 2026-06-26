export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = '', sortable = false, onClick }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap first:pl-6 last:pr-6 ${sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''} ${className}`}
      onClick={sortable ? onClick : undefined}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800/60 first:pl-6 last:pr-6 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = '', onClick }) {
  return (
    <tr
      className={`bg-white dark:bg-gray-900 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
