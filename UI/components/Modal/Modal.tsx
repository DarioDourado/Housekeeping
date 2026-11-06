import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';

interface ModalProps {
  title: string;
  titleClassName?: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  maxWidth?: string;
  tall?: boolean;
  fullscreen?: boolean;
  // - false quando há trabalho por gravar: o clique fora não pode deitá-lo fora (Esc e o botão fechar continuam a fechar)
  dismissOnBackdrop?: boolean;
  headerExtra?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

const TONE = {
  default: { header: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40', icon: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
  danger: { header: 'border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30', icon: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300' }
} as const;

// - Casca comum dos modais: diálogo acessível (foco preso, Esc/clique fora fecham) com cabeçalho e rodapé opcional
export const Modal = ({ title, titleClassName = 'text-base font-bold', subtitle, icon, tone = 'default', maxWidth = 'max-w-2xl', tall = false, fullscreen = false, dismissOnBackdrop = true, headerExtra, onClose, footer, children }: ModalProps) => {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const titleId = useId();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs ${fullscreen ? '' : 'p-4'}`}
      onClick={dismissOnBackdrop ? onClose : undefined}
      onKeyDown={event => event.key === 'Escape' && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={event => event.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full ${fullscreen ? 'h-full rounded-none' : `rounded-2xl ${maxWidth} ${tall ? 'h-[92vh] max-h-[92vh]' : 'max-h-[85vh]'}`} flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150`}
      >
        <div className={`flex items-center justify-between gap-3 px-6 py-4 border-b ${TONE[tone].header}`}>
          <div className="flex items-center gap-3">
            {icon && <div className={`p-2 rounded-xl ${TONE[tone].icon}`}>{icon}</div>}
            <div>
              <h2 id={titleId} className={`${titleClassName} text-slate-900 dark:text-slate-100`}>{title}</h2>
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
