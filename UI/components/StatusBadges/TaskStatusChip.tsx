import { useTranslation } from 'react-i18next';
import { InspectionStatus, TaskStatus, type ServiceTask } from '@/types/housekeeping.types';

const STYLES: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  [TaskStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  [TaskStatus.NOT_PERFORMED]: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
};

// - Estado de EXECUÇÃO da tarefa (por iniciar, em curso, concluída, não realizada com motivo) e, se concluída, da inspeção
export const TaskStatusChip = ({ task }: { task: Pick<ServiceTask, 'status' | 'notPerformedReason' | 'inspectionStatus'> }) => {
  const { t } = useTranslation();
  const label =
    task.status === TaskStatus.NOT_PERFORMED && task.notPerformedReason
      ? t(`task.notPerformed.${task.notPerformedReason}`)
      : t(`task.status.${task.status}`);

  const showInspection = task.status === TaskStatus.COMPLETED && task.inspectionStatus !== InspectionStatus.NOT_REQUIRED;

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STYLES[task.status]}`}>{label}</span>
      {showInspection && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">· {t(`task.inspection.${task.inspectionStatus}`)}</span>
      )}
    </span>
  );
};
