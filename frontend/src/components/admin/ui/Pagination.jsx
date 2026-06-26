import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPage, totalItems, perPage, className = '' }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, totalItems);

  const pages = [];
  const delta = 2;
  const left  = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (i === left - 1 || i === right + 1) {
      pages.push('...');
    }
  }

  const btnBase = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors';

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Showing <strong>{from}–{to}</strong> of <strong>{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`${btnBase} ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
