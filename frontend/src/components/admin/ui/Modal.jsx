import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
      document.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handler);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${SIZES[size] || SIZES.md} bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] ${className}`}
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 admin-scroll">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
