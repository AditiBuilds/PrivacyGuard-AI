import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        let Icon = CheckCircle2;
        let borderClass = 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400';
        if (t.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400';
        } else if (t.type === 'info') {
          Icon = Info;
          borderClass = 'border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-white dark:bg-navy-800 border rounded-xl p-3.5 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${borderClass}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                {t.title}
              </h5>
              {t.message && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
