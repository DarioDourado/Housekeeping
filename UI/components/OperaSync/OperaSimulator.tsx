import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReceiveOperaStatus, useRooms } from '@/hooks/housekeeping';
import { RoomStatus } from '@/types/housekeeping.types';

// - Só da demonstração: simula uma alteração feita do lado do Opera (receção, outro utilizador) para ver como a app a trata
export const OperaSimulator = () => {
  const { t } = useTranslation();
  const { data: rooms = [] } = useRooms();
  const receiveOperaStatus = useReceiveOperaStatus();
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState<RoomStatus>(RoomStatus.DIRTY);
  const selected = roomId || rooms[0]?.id || '';
  const field = 'px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';

  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/10 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold text-amber-800 dark:text-amber-300">{t('opera.simulate.title')}</span>
      <select aria-label={t('opera.simulate.room')} value={selected} onChange={event => setRoomId(event.target.value)} className={field}>
        {rooms.map(room => <option key={room.id} value={room.id}>{room.number}</option>)}
      </select>
      <select aria-label={t('opera.simulate.status')} value={status} onChange={event => setStatus(event.target.value as RoomStatus)} className={field}>
        {Object.values(RoomStatus).map(value => <option key={value} value={value}>{t(`status.${value.toLowerCase()}`)}</option>)}
      </select>
      <button onClick={() => receiveOperaStatus(selected, status)} className="px-2.5 py-1 font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 rounded-md">
        {t('opera.simulate.send')}
      </button>
    </div>
  );
};
