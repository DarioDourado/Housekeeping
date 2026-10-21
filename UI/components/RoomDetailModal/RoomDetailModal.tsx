import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTaskView } from '@/hooks/housekeeping/useTaskView';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';
import { OperaStatusBadge, TaskStatusChip } from '@/UI/components/StatusBadges';
import { DetailActions } from './DetailActions';
import { GuestSection } from './GuestSection';
import { TaskHistory } from './TaskHistory';
import { TraceForm } from './TraceForm';

interface RoomDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const RoomDetailModal = ({ taskId, onClose }: RoomDetailModalProps) => {
  const { t } = useTranslation();
  const view = useTaskView(taskId);
  const dialogRef = useFocusTrap<HTMLDivElement>(!!view);

  if (!view) return null;
  const { room } = view;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('room.detail.title', { number: room.number })}
        onClick={event => event.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {t('room.detail.title', { number: room.number })}
            </span>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              {t('room.detail.location', { block: room.block, floor: room.floor })}
            </span>
            <OperaStatusBadge status={room.operaStatus} />
            <TaskStatusChip task={view.task} />
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('actions.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          <GuestSection view={view} />
          <TraceForm roomId={room.id} roomNumber={room.number} />
          <TaskHistory view={view} />
        </div>

        <DetailActions view={view} onClose={onClose} />
      </div>
    </div>
  );
};
