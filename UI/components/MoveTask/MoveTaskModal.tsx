import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ArrowRightLeft, Check } from 'lucide-react';
import { useMoveTask, useTaskSheets } from '@/hooks/housekeeping';
import { useTaskView } from '@/hooks/housekeeping/useTaskView';
import { useStaff } from '@/hooks/staff';
import { Modal } from '@/UI/components/Modal';

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
    <Modal
      title={t('moveRoom.title', { number: room.number })}
      icon={<ArrowRightLeft className="w-4 h-4" />}
      maxWidth="max-w-md"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{t('actions.cancel')}</button>
          <button type="button" onClick={confirm} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs">
            {t('moveRoom.confirm')}
          </button>
        </div>
      }
    >
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
      </div>
    </Modal>
  );
};
