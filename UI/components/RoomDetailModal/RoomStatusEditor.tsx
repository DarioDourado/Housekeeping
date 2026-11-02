import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useConfirmStatusChange, useSetRoomStatus } from '@/hooks/housekeeping';
import { RoomStatus, type Room } from '@/types/housekeeping.types';
import { OperaStatusBadge } from '@/UI/components/StatusBadges';

// - Estado do quarto no Opera; a governanta e o admin podem editá-lo (ex.: reverter um Inspected), sempre com confirmação
export const RoomStatusEditor = ({ room }: { room: Room }) => {
  const { t } = useTranslation();
  const canEdit = usePermission('room.editDetails');
  const confirmChange = useConfirmStatusChange();
  const setRoomStatus = useSetRoomStatus();
  const [open, setOpen] = useState(false);

  const change = async (status: RoomStatus) => {
    setOpen(false);
    if (await confirmChange(room.number, room.operaStatus, status)) await setRoomStatus(room.id, status);
  };

  return (
    <div className="relative flex items-center gap-1">
      <OperaStatusBadge status={room.operaStatus} />
      {canEdit && (
        <>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            title={t('room.detail.editStatusTitle')}
            aria-label={t('room.detail.editStatus')}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-1.5 text-xs">
              {Object.values(RoomStatus).filter(status => status !== room.operaStatus).map(status => (
                <button key={status} onClick={() => void change(status)} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200">
                  {t('room.detail.changeStatusTo', { status: t(`status.${status.toLowerCase()}`) })}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
