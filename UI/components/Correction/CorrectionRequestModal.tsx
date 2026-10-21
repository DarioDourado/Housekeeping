import { useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AlertTriangle, Check, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';
import { useRequestCorrection } from '@/hooks/housekeeping';
import { useTaskView } from '@/hooks/housekeeping/useTaskView';

const PRESET_KEYS = ['vacuum', 'towels', 'mirror', 'coffee', 'water', 'curtains'] as const;

interface CorrectionRequestModalProps {
  taskId: string;
  onClose: () => void;
}

// - Pedido de correção: o quarto continua Clean no Opera e a empregada recebe o alerta com o que corrigir (§8.2)
export const CorrectionRequestModal = ({ taskId, onClose }: CorrectionRequestModalProps) => {
  const { t } = useTranslation();
  const view = useTaskView(taskId);
  const requestCorrection = useRequestCorrection();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(!!view);

  if (!view) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    await requestCorrection(taskId, note.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('inspection.title', { number: view.room.number })}
        onClick={event => event.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('inspection.title', { number: view.room.number })}</h3>
              <p className="text-xs text-slate-500">
                <Trans i18nKey="inspection.subtitle" components={{ status: <span className="font-semibold text-sky-700 dark:text-sky-400" /> }} />
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" aria-label={t('actions.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label htmlFor="correction-note" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('inspection.noteLabel')}</label>
            <textarea
              id="correction-note"
              required
              rows={3}
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder={t('inspection.notePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">{t('inspection.presetsLabel')}</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_KEYS.map(key => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setNote(previous => (previous ? `${previous}. ${t(`inspection.presets.${key}`)}` : t(`inspection.presets.${key}`)))}
                  className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-left"
                >
                  + {t(`inspection.presets.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !note.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t('inspection.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
