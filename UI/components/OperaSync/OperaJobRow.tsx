import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { ALL_ROOMS } from '@/config/constants';
import { formatTimeWithSeconds } from '@/lib/datetime';
import { SyncState, type OperaSyncJob } from '@/types/housekeeping.types';
import { localized } from '@/lib/localized';

const STATE_STYLE: Record<SyncState, string> = {
  [SyncState.CONFIRMED]: 'text-emerald-600 dark:text-emerald-400',
  [SyncState.PENDING]: 'text-amber-600 dark:text-amber-400',
  [SyncState.FAILED]: 'text-red-600 dark:text-red-400',
  [SyncState.CONFLICT]: 'text-orange-600 dark:text-orange-400'
};

interface OperaJobRowProps {
  job: OperaSyncJob;
  roomNumber: string | undefined;
  canRetry: boolean;
  onRetry: (jobId: string) => void;
}

// - Um job de sincronização com o Opera: confirmado, pendente, falhado ou em conflito (estado mais recente do Opera vence)
export const OperaJobRow = ({ job, roomNumber, canRetry, onRetry }: OperaJobRowProps) => {
  const { t } = useTranslation();
  const outbound = job.direction === 'APP_TO_OPERA';
  const needsDecision = job.state === SyncState.CONFLICT || job.state === SyncState.FAILED;

  return (
    <div className={`p-3 rounded-xl border bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs ${needsDecision ? 'border-orange-300 dark:border-orange-800' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${outbound ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'}`}>
          {outbound ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {job.roomId === null || roomNumber === ALL_ROOMS ? t('opera.allRooms') : t('opera.room', { number: roomNumber ?? job.roomId })}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {job.previousStatus ?? '—'} → <strong className="text-blue-600 dark:text-blue-400">{job.targetStatus}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">{localized(t, job.source)}</span>
          {job.lastError && <span className="block text-[11px] text-orange-600 dark:text-orange-400">{localized(t, job.lastError)}</span>}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`font-semibold ${STATE_STYLE[job.state]}`}>
          {t(`opera.state.${job.state}`)}
          {job.attempts > 1 && <span className="text-slate-400 font-normal"> · {t('opera.attempts', { count: job.attempts })}</span>}
        </span>
        <span className="text-[11px] text-slate-400 block tabular-nums">{formatTimeWithSeconds(job.createdAt)}</span>
        {needsDecision && canRetry && (
          <button onClick={() => onRetry(job.id)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
            <RefreshCw className="w-3 h-3" />
            {t('opera.retry')}
          </button>
        )}
      </div>
    </div>
  );
};
