import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  maxWidth?: string;
  tall?: boolean;
  fullscreen?: boolean;
  headerExtra?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

// - Casca comum dos modais: diálogo acessível (foco preso, Esc/clique fora fecham) com cabeçalho e rodapé opcional
export const Modal = ({ title, subtitle, icon, maxWidth = 'max-w-2xl', tall = false, fullscreen = false, headerExtra, onClose, footer, children }: ModalProps) => {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs ${fullscreen ? '' : 'p-4'}`}
      onClick={onClose}
      onKeyDown={event => event.key === 'Escape' && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full ${fullscreen ? 'h-full rounded-none' : `rounded-2xl ${maxWidth} ${tall ? 'h-[92vh] max-h-[92vh]' : 'max-h-[85vh]'}`} flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">{icon}</div>}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {headerExtra}
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('actions.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">{footer}</div>}
      </div>
    </div>
  );
};
