import { useTranslation } from 'react-i18next';
import { useTaskView } from '@/hooks/housekeeping/useTaskView';
import { Modal } from '@/UI/components/Modal';
import { TaskStatusChip } from '@/UI/components/StatusBadges';
import { DetailActions } from './DetailActions';
import { GuestSection } from './GuestSection';
import { RoomStatusEditor } from './RoomStatusEditor';
import { TaskHistory } from './TaskHistory';
import { TraceForm } from './TraceForm';

interface RoomDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const RoomDetailModal = ({ taskId, onClose }: RoomDetailModalProps) => {
  const { t } = useTranslation();
  const view = useTaskView(taskId);

  if (!view) return null;
  const { room } = view;

  return (
    <Modal
      title={t('room.detail.title', { number: room.number })}
      titleClassName="text-2xl font-black tracking-tight tabular-nums"
      subtitle={t('room.detail.location', { block: room.block, floor: room.floor })}
      headerExtra={<div className="flex items-center gap-3 flex-wrap"><RoomStatusEditor room={room} /><TaskStatusChip task={view.task} /></div>}
      onClose={onClose}
      footer={<DetailActions view={view} onClose={onClose} />}
    >
      <div className="p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <GuestSection view={view} />
        <TraceForm roomId={room.id} roomNumber={room.number} />
        <TaskHistory view={view} />
      </div>
    </Modal>
  );
};
