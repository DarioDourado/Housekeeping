import { useTranslation } from 'react-i18next';
import { Moon, RefreshCw, Server } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useRetryOperaJob, useRooms, useSyncJobs, useSyncWithOpera, useTriggerNightAudit } from '@/hooks/housekeeping';
import { Modal } from '@/UI/components/Modal';
import { OperaJobRow } from './OperaJobRow';
import { OperaSimulator } from './OperaSimulator';

export const OperaSyncModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { data: jobs = [] } = useSyncJobs();
  const { data: rooms = [] } = useRooms();
  const syncWithOpera = useSyncWithOpera();
  const triggerNightAudit = useTriggerNightAudit();
  const retryOperaJob = useRetryOperaJob();
  const canRetry = usePermission('room.markInspected');
  const numbers = new Map(rooms.map(room => [room.id, room.number]));

  return (
    <Modal title={t('opera.title')} subtitle={t('opera.subtitle')} icon={<Server className="w-5 h-5" />} maxWidth="max-w-3xl" onClose={onClose}>
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => syncWithOpera()}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('opera.forceSync')}</span>
        </button>
        <button
          onClick={() => triggerNightAudit()}
          className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
          title={t('opera.nightAuditTitle')}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{t('opera.nightAudit')}</span>
        </button>
      </div>

      <OperaSimulator />

      <div className="p-6 space-y-2">
        <span className="text-xs font-semibold text-slate-400 block mb-2">{t('opera.recentTransactions')}</span>
        {jobs.length > 0 ? (
          jobs.map(job => (
            <OperaJobRow key={job.id} job={job} roomNumber={job.roomId ? numbers.get(job.roomId) : undefined} canRetry={canRetry} onRetry={retryOperaJob} />
          ))
        ) : (
          <p className="text-xs text-slate-400 italic">{t('opera.empty')}</p>
        )}
      </div>
    </Modal>
  );
};
