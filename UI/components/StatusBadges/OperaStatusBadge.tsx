import { useTranslation } from 'react-i18next';
import { RoomStatus } from '@/types/housekeeping.types';

const STYLES: Record<RoomStatus, string> = {
  [RoomStatus.DIRTY]: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
  [RoomStatus.CLEAN]: 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60',
  [RoomStatus.INSPECTED]: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
};

// - Estado do quarto NO OPERA (Dirty/Clean/Inspected). Não é o estado da tarefa (ver TaskStatusChip).
export const OperaStatusBadge = ({ status }: { status: RoomStatus }) => {
  const { t } = useTranslation();
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STYLES[status]}`}>
      {t(`status.${status.toLowerCase()}`)}
    </span>
  );
};
