import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRightLeft, Check, CheckCheck, Info, Play, Sparkles } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import {
  useCompleteCorrection,
  useFinishTask,
  useInspectTask,
  useRecordRefresh,
  useStartTask,
  useTogglePriority
} from '@/hooks/housekeeping';
import type { TaskView } from '@/lib/taskViews';
import { useOverlayStore } from '@/store/overlayStore';
import { InspectionStatus, RoomStatus, TaskKind, TaskStatus } from '@/types/housekeeping.types';

const BUTTON = 'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shadow-xs';
const ICON_BUTTON = 'p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md';

// - Ações de um cartão do dia. Cada botão só aparece a quem tem a permissão (matriz §11) e quando o estado da tarefa o permite.
export const RoomCardActions = ({ view }: { view: TaskView }) => {
  const { t } = useTranslation();
  const { task, room } = view;
  const canExecute = usePermission('task.startFinish');
  const canInspect = usePermission('room.markInspected');
  const canRequestCorrection = usePermission('correction.request');
  const canReopen = usePermission('room.markDirty');
  const canPrioritize = usePermission('priority.reorder');
  const canDistribute = usePermission('sheets.distribute');

  const startTask = useStartTask();
  const finishTask = useFinishTask();
  const inspectTask = useInspectTask();
  const completeCorrection = useCompleteCorrection();
  const recordRefresh = useRecordRefresh();
  const togglePriority = useTogglePriority();
  const { openDetail, openCorrection, openMove } = useOverlayStore();

  const isCleaning = task.kind === TaskKind.CLEANING;
  const waiting = task.status === TaskStatus.PENDING || task.status === TaskStatus.NOT_PERFORMED;
  const awaitingInspection = task.status === TaskStatus.COMPLETED && task.inspectionStatus === InspectionStatus.PENDING;

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {canExecute && isCleaning && waiting && (
          <button onClick={() => startTask(task.id)} className={`${BUTTON} font-medium text-white bg-blue-600 hover:bg-blue-700`}>
            <Play className="w-3 h-3 fill-current" />
            <span>{t('room.start')}</span>
          </button>
        )}

        {canExecute && isCleaning && task.status === TaskStatus.IN_PROGRESS && (
          <button onClick={() => finishTask(task.id)} className={`${BUTTON} text-white bg-emerald-600 hover:bg-emerald-700`}>
            <Check className="w-3.5 h-3.5" />
            <span>{t('room.finish')}</span>
          </button>
        )}

        {canExecute && task.kind === TaskKind.REFRESH && task.status !== TaskStatus.COMPLETED && (
          <button onClick={() => recordRefresh(room.id)} className={`${BUTTON} text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800`}>
            <Sparkles className="w-3 h-3" />
            <span>{t('room.refreshDone')}</span>
          </button>
        )}

        {canExecute && task.inspectionStatus === InspectionStatus.CORRECTION_REQUESTED && (
          <button onClick={() => completeCorrection(task.id)} className={`${BUTTON} text-white bg-amber-600 hover:bg-amber-700`} title={t('room.correctionDoneTitle')}>
            <Check className="w-3.5 h-3.5" />
            <span>{t('room.correctionDone')}</span>
          </button>
        )}

        {canInspect && awaitingInspection && (
          <button onClick={() => inspectTask(task.id)} className={`${BUTTON} text-white bg-emerald-600 hover:bg-emerald-700`} title={t('room.approveTitle')}>
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('room.approve')}</span>
          </button>
        )}

        {canRequestCorrection && awaitingInspection && (
          <button
            onClick={() => openCorrection(task.id)}
            className={`${BUTTON} font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800`}
            title={t('room.reproveTitle')}
          >
            <span>{t('room.reprove')}</span>
          </button>
        )}

        {canInspect && isCleaning && task.status === TaskStatus.COMPLETED && room.operaStatus === RoomStatus.CLEAN && (
          <button onClick={() => recordRefresh(room.id)} className={`${BUTTON} font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800`} title={t('room.refreshTitle')}>
            <Sparkles className="w-3 h-3" />
            <span>{t('room.refreshButton')}</span>
          </button>
        )}

        {canReopen && task.inspectionStatus === InspectionStatus.APPROVED && (
          <button onClick={() => openDetail(task.id)} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('room.readyForReception')}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {canPrioritize && (
          <button
            onClick={() => togglePriority(task.id)}
            className={`${ICON_BUTTON} ${task.isPriority ? '!text-rose-600 bg-rose-50 dark:bg-rose-950 dark:!text-rose-400' : ''}`}
            title={task.isPriority ? t('room.priorityRemoveTitle') : t('room.priorityAddTitle')}
            aria-label={t('room.priorityLabel')}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
        )}

        {canDistribute && (
          <button onClick={() => openMove(task.id)} className={ICON_BUTTON} title={t('room.moveTitle')} aria-label={t('room.moveLabel')}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <button onClick={() => openDetail(task.id)} className={ICON_BUTTON} title={t('room.detailTitle')} aria-label={t('room.detailLabel')}>
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
