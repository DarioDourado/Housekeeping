import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

const TOAST_MS = 4000;

export const ToastHost = () => {
  const { t } = useTranslation();
  const toast = useUiStore(state => state.toast);
  const dismissToast = useUiStore(state => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl flex items-center gap-3 border border-slate-700 dark:border-slate-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
        <span className="text-xs font-semibold">{t(toast.message.key, toast.message.params)}</span>
        <button onClick={dismissToast} className="text-slate-400 hover:text-white dark:hover:text-slate-900 ml-2 p-1" aria-label={t('planning.dismissToast')}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
