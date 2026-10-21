import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/auth/usePermission';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useBoard, useOpenPlan, useResetToDailyPreset } from '@/hooks/housekeeping';
import { PlanKind } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { BlockTeamRosterBar } from '@/UI/components/TeamManager';
import { PlanningToolbar, type LayoutMode } from './components/PlanningToolbar';
import { SummaryStrip } from './components/SummaryStrip';
import { TaskSheetColumn } from './components/TaskSheetColumn';

const GRID: Record<LayoutMode, string> = {
  AUTO_FIT: 'flex flex-wrap lg:flex-nowrap gap-3',
  COMPACT: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5',
  EXPANDED: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5'
};

// - Distribuição do dia: totais, equipas por bloco e as task sheets lado a lado, onde se redistribui o trabalho
export const PlanningPage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const board = useBoard(PlanKind.DAY);
  const openPlan = useOpenPlan();
  const resetPreset = useResetToDailyPreset();
  const canDistribute = usePermission('sheets.distribute');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [layout, setLayout] = useState<LayoutMode>('EXPANDED');

  if (board.isLoading) return <PageLoading label={t('planning.loading')} />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;
  if (!board.plan) {
    return (
      <PageEmpty
        title={t('planning.noPlanTitle')}
        description={t('planning.noPlanHint')}
        action={canDistribute ? (
          <button onClick={() => openPlan(PlanKind.DAY)} className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium">
            {t('planning.openPlan')}
          </button>
        ) : undefined}
      />
    );
  }

  const handleReset = async () => {
    const confirmed = await confirm({
      title: t('planning.resetConfirm.title'),
      message: t('planning.resetConfirm.message'),
      confirmLabel: t('planning.resetConfirm.confirm'),
      cancelLabel: t('actions.cancel')
    });
    if (confirmed) await resetPreset();
  };

  const parking = board.columns.filter(column => column.sheet.isReserve).map(column => column.sheet.number);
  const visible = board.columns.filter(({ sheet }) => {
    if (blockFilter === 'ALL') return true;
    if (blockFilter === 'PARKING') return sheet.isReserve;
    return sheet.block.toLowerCase().includes(blockFilter.toLowerCase());
  });

  return (
    <div className="space-y-4 w-full">
      <SummaryStrip views={board.views} onReset={canDistribute ? handleReset : undefined} />
      {canDistribute && <BlockTeamRosterBar />}
      <PlanningToolbar
        blockFilter={blockFilter}
        onBlockFilter={setBlockFilter}
        sheetCount={board.columns.length}
        parkingRange={parking.length > 0 ? `${Math.min(...parking)}-${Math.max(...parking)}` : ''}
        layout={layout}
        onLayout={setLayout}
      />
      <div className={`${GRID[layout]} pb-8`}>
        {visible.map(column => (
          <TaskSheetColumn
            key={column.sheet.id}
            column={column}
            layout={layout === 'AUTO_FIT' ? 'FULL_FIT' : 'GRID'}
            otherSheets={board.columns.filter(other => other.sheet.id !== column.sheet.id).map(other => ({ id: other.sheet.id, title: other.sheet.title }))}
          />
        ))}
      </div>
    </div>
  );
};
