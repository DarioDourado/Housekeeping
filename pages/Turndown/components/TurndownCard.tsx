import { useTranslation } from 'react-i18next';
import { BellOff, Check, GripVertical, Info, UserX } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useFinishTask, useRecordNotPerformed, useReopenTask } from '@/hooks/housekeeping';
import { useTaskDrag } from '@/hooks/housekeeping/useTaskDrag';
import type { TaskView } from '@/lib/taskViews';
import { useOverlayStore } from '@/store/overlayStore';
import { NotPerformedReason, TaskStatus } from '@/types/housekeeping.types';
import { TaskStatusChip } from '@/UI/components/StatusBadges';

// - Tarefa de turndown de um quarto: tem estado e histórico próprios e nunca toca no Opera (§10.4, §10.6)
export const TurndownCard = ({ view, index }: { view: TaskView; index: number }) => {
  const { t } = useTranslation();
  const { task, room, stay } = view;
  const canDistribute = usePermission('sheets.distribute');
  const canExecute = usePermission('task.startFinish');
  const finishTask = useFinishTask();
  const reopenTask = useReopenTask();
  const recordNotPerformed = useRecordNotPerformed();
  const openDetail = useOverlayStore(state => state.openDetail);
  const { isDragging, dropPosition, draggableProps } = useTaskDrag(task.id, task.sheetId, index, canDistribute);

  const done = task.status === TaskStatus.COMPLETED;
  const open = task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS;

  return (
    <div
      {...draggableProps}
      className={`relative p-3 rounded-xl border select-none ${canDistribute ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging
          ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-500'
          : done
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
      }`}
    >
      {dropPosition && <div className={`absolute ${dropPosition === 'top' ? '-top-1.5' : '-bottom-1.5'} left-2 right-2 h-1 bg-indigo-600 rounded-full z-20`} />}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          {canDistribute && <GripVertical className="w-3.5 h-3.5 mt-1 text-slate-400" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{room.number}</span>
              <span className="text-xs text-slate-500">{room.block}</span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">{stay?.guestName ?? '—'}</p>
          </div>
        </div>
        <TaskStatusChip task={task} />
      </div>

      {stay?.vipType && <div className="mt-2 text-xs text-amber-600 font-semibold">{stay.vipType}</div>}

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {canExecute && open && (
            <button onClick={() => finishTask(task.id)} className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{t('turndown.markDone')}</span>
            </button>
          )}
          {canExecute && done && (
            <button onClick={() => reopenTask(task.id)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">{t('turndown.reopen')}</button>
          )}
          {canExecute && open && (
            <>
              <button onClick={() => recordNotPerformed(task.id, NotPerformedReason.DND)} className="p-1 text-slate-400 hover:text-purple-600 rounded" title={t('turndown.recordDnd')} aria-label={t('turndown.recordDnd')}>
                <BellOff className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => recordNotPerformed(task.id, NotPerformedReason.REFUSE_SERVICE)} className="p-1 text-slate-400 hover:text-stone-600 rounded" title={t('turndown.recordRefused')} aria-label={t('turndown.recordRefused')}>
                <UserX className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <button onClick={() => openDetail(task.id)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title={t('turndown.viewDetail')} aria-label={t('turndown.viewDetail')}>
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
