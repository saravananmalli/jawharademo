export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = '', sortable = false, onClick }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] whitespace-nowrap first:pl-5 last:pr-5 ${sortable ? 'cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none' : ''} ${className}`}
      onClick={sortable ? onClick : undefined}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-[#21262d] first:pl-5 last:pr-5 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = '', onClick }) {
  return (
    <tr
      className={`bg-white dark:bg-[#1c2128] hover:bg-gray-50/80 dark:hover:bg-[#22272e] transition-colors duration-100 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
