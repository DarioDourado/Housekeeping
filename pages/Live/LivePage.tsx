import { useTranslation } from 'react-i18next';
import { useBoard } from '@/hooks/housekeeping';
import { PlanKind } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { RoomCard } from '@/UI/components/RoomCard/RoomCard';

// - Monitorização em tempo real de todas as tarefas do dia, sem a estrutura das task sheets
export const LivePage = () => {
  const { t } = useTranslation();
  const board = useBoard(PlanKind.DAY);

  if (board.isLoading) return <PageLoading />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;
  if (board.views.length === 0) return <PageEmpty title={t('planning.liveEmpty')} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('planning.liveTitle')}</h2>
        <p className="text-xs text-slate-500">{t('planning.liveSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {board.views.map((view, index) => <RoomCard key={view.task.id} view={view} index={index} />)}
      </div>
    </div>
  );
};
