import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';
import { useMoveTask, useTaskSheets } from '@/hooks/housekeeping';
import { useTaskView } from '@/hooks/housekeeping/useTaskView';
import { useStaff } from '@/hooks/staff';

interface MoveTaskModalProps {
  taskId: string;
  onClose: () => void;
}

// - Mover uma tarefa para outra task sheet do MESMO plano (o diurno e o noturno são distribuições independentes)
export const MoveTaskModal = ({ taskId, onClose }: MoveTaskModalProps) => {
  const { t } = useTranslation();
  const view = useTaskView(taskId);
  const { data: sheets = [] } = useTaskSheets();
  const { data: staff = [] } = useStaff();
  const moveTask = useMoveTask();
  const [target, setTarget] = useState<string | null>(null);
  const dialogRef = useFocusTrap<HTMLDivElement>(!!view);

  if (!view) return null;
  const { task, room } = view;
  const targetId = target ?? task.sheetId;
  const names = new Map(staff.map(user => [user.id, user.name]));
  const options = sheets.filter(sheet => sheet.planId === task.planId).sort((a, b) => a.number - b.number);

  const confirm = async () => {
    if (targetId !== task.sheetId) await moveTask(task.id, targetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('moveRoom.title', { number: room.number })}
        onClick={event => event.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"><ArrowRightLeft className="w-4 h-4" /></div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('moveRoom.title', { number: room.number })}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" aria-label={t('actions.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            <Trans i18nKey="moveRoom.prompt" values={{ number: room.number, block: room.block }} components={{ strong: <strong /> }} />
          </p>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {options.map(sheet => {
              const isCurrent = sheet.id === task.sheetId;
              const isSelected = sheet.id === targetId;
              const people = sheet.assignments.map(assignment => names.get(assignment.staffId)).filter(Boolean).join(', ');
              return (
                <button
                  key={sheet.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTarget(sheet.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{sheet.title}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{people || t('moveRoom.noPeople')}</span>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{t('moveRoom.current')}</span>
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-blue-600" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100">{t('actions.cancel')}</button>
            <button type="button" onClick={confirm} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs">
              {t('moveRoom.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
