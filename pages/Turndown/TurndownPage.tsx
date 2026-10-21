import { useTranslation } from 'react-i18next';
import { Moon } from 'lucide-react';
import { TURNDOWN_SCHEDULE } from '@/config/constants';
import { usePermission } from '@/hooks/auth/usePermission';
import { useBoard, useOpenPlan } from '@/hooks/housekeeping';
import { PlanKind, TaskStatus } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { TurndownColumn } from './components/TurndownColumn';

// - Serviço da noite: distribuição própria, independente da diurna (pode preparar-se com o dia ainda a decorrer)
export const TurndownPage = () => {
  const { t } = useTranslation();
  const board = useBoard(PlanKind.NIGHT);
  const openPlan = useOpenPlan();
  const canDistribute = usePermission('sheets.distribute');

  if (board.isLoading) return <PageLoading />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;
  if (!board.plan) {
    return (
      <PageEmpty
        title={t('turndown.noPlanTitle')}
        description={t('turndown.noPlanHint')}
        action={canDistribute ? (
          <button onClick={() => openPlan(PlanKind.NIGHT)} className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium">{t('turndown.openPlan')}</button>
        ) : undefined}
      />
    );
  }

  const total = board.views.length;
  const completed = board.views.filter(view => view.task.status === TaskStatus.COMPLETED).length;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"><Moon className="w-6 h-6" /></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight">{t('turndown.title')}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-medium">
                {t('turndown.window', { start: TURNDOWN_SCHEDULE.start, end: TURNDOWN_SCHEDULE.end })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{t('turndown.isolated')}</span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">{t('turndown.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl shrink-0">
          <div>
            <span className="text-[11px] text-indigo-200 block">{t('turndown.progress')}</span>
            <span className="text-xl font-bold tabular-nums">{completed} / {total}</span>
          </div>
          <div className="w-16 h-2 bg-indigo-950 rounded-full overflow-hidden border border-indigo-700" role="progressbar" aria-valuenow={completed} aria-valuemax={total}>
            <div className="h-full bg-emerald-400" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {board.columns.map(column => <TurndownColumn key={column.sheet.id} column={column} />)}
      </div>
    </div>
  );
};
