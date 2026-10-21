import { useTranslation } from 'react-i18next';
import { BellOff, Check, CheckCheck, Play, RotateCcw, Sparkles, UserX } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import {
  useFinishTask,
  useInspectTask,
  useRecordNotPerformed,
  useRecordRefresh,
  useReopenRoom,
  useStartTask
} from '@/hooks/housekeeping';
import type { TaskView } from '@/lib/taskViews';
import { useOverlayStore } from '@/store/overlayStore';
import { InspectionStatus, NotPerformedReason, RoomStatus, TaskKind, TaskStatus } from '@/types/housekeeping.types';

const OUTLINE = 'px-2.5 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1';
const PRIMARY = 'px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs flex items-center gap-1.5';

export const DetailActions = ({ view, onClose }: { view: TaskView; onClose: () => void }) => {
  const { t } = useTranslation();
  const { task, room } = view;
  const canExecute = usePermission('task.startFinish');
  const canInspect = usePermission('room.markInspected');
  const canRequestCorrection = usePermission('correction.request');
  const canReopen = usePermission('room.markDirty');
  const openCorrection = useOverlayStore(state => state.openCorrection);

  const startTask = useStartTask();
  const finishTask = useFinishTask();
  const inspectTask = useInspectTask();
  const recordNotPerformed = useRecordNotPerformed();
  const recordRefresh = useRecordRefresh();
  const reopenRoom = useReopenRoom();

  const open = task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS;
  const isTurndown = task.kind === TaskKind.TURNDOWN;
  const awaitingInspection = task.status === TaskStatus.COMPLETED && task.inspectionStatus === InspectionStatus.PENDING;
  const blocked = (reason: NotPerformedReason) => task.notPerformedReason === reason;

  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {canExecute && open && (
          <>
            <button
              onClick={() => recordNotPerformed(task.id, NotPerformedReason.DND)}
              className={`${OUTLINE} ${blocked(NotPerformedReason.DND) ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>{t('room.dnd')}</span>
            </button>
            <button
              onClick={() => recordNotPerformed(task.id, NotPerformedReason.REFUSE_SERVICE)}
              className={`${OUTLINE} border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>{t('room.refused')}</span>
            </button>
          </>
        )}

        {canInspect && task.kind === TaskKind.CLEANING && task.status === TaskStatus.COMPLETED && room.operaStatus === RoomStatus.CLEAN && (
          <button onClick={() => recordRefresh(room.id)} className={`${OUTLINE} text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('room.detail.addRefresh', { count: view.refreshCount })}</span>
          </button>
        )}

        {canReopen && task.kind === TaskKind.CLEANING && (
          <button onClick={() => reopenRoom(room.id)} className={`${OUTLINE} text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800`} title={t('room.detail.markDirtyTitle')}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('room.detail.markDirty')}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canExecute && (task.status === TaskStatus.PENDING || task.status === TaskStatus.NOT_PERFORMED) && !isTurndown && (
          <button onClick={() => { void startTask(task.id); onClose(); }} className={`${PRIMARY} bg-blue-600 hover:bg-blue-700`}>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('room.detail.startCleaning')}</span>
          </button>
        )}

        {canExecute && open && (task.status === TaskStatus.IN_PROGRESS || isTurndown) && (
          <button onClick={() => { void finishTask(task.id); onClose(); }} className={`${PRIMARY} bg-emerald-600 hover:bg-emerald-700`}>
            <Check className="w-4 h-4" />
            <span>{isTurndown ? t('turndown.markDone') : t('room.detail.finishCleaning')}</span>
          </button>
        )}

        {canInspect && awaitingInspection && (
          <button onClick={() => { void inspectTask(task.id); onClose(); }} className={`${PRIMARY} bg-emerald-600 hover:bg-emerald-700`}>
            <CheckCheck className="w-4 h-4" />
            <span>{t('room.detail.approveInspection')}</span>
          </button>
        )}

        {canRequestCorrection && awaitingInspection && (
          <button onClick={() => openCorrection(task.id)} className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-lg">
            {t('actions.reproveInspection')}
          </button>
        )}

        <button onClick={onClose} className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
          {t('actions.close')}
        </button>
      </div>
    </div>
  );
};
