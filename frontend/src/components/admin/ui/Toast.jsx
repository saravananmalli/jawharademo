import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: 'border-l-4 border-emerald-500 bg-white dark:bg-gray-900',
  error:   'border-l-4 border-red-500 bg-white dark:bg-gray-900',
  warning: 'border-l-4 border-amber-500 bg-white dark:bg-gray-900',
  info:    'border-l-4 border-indigo-500 bg-white dark:bg-gray-900',
};

const ICON_COLORS = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-indigo-500',
};

function ToastItem({ id, type = 'info', message, onDismiss }) {
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 max-w-sm w-full ${STYLES[type]}`}
      style={{ animation: 'slideInRight 0.25s ease-out both' }}
    >
      <Icon size={17} className={`shrink-0 mt-0.5 ${ICON_COLORS[type]}`} />
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-snug">{message}</p>
      <button onClick={() => onDismiss(id)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

let _addToast = null;

export function Toast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  _addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts(p => [...p, { ...toast, id }]);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  return {
    success: (message) => _addToast?.({ type: 'success', message }),
    error:   (message) => _addToast?.({ type: 'error',   message }),
    warning: (message) => _addToast?.({ type: 'warning', message }),
    info:    (message) => _addToast?.({ type: 'info',    message }),
  };
}
