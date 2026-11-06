import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/auth/usePermission';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useBoard, useOpenPlan, useResetToDailyPreset } from '@/hooks/housekeeping';
import { filterColumnViews, type MovementFilter } from '@/lib/boardFilter';
import { PlanKind } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { SheetRemoveZone } from '@/UI/components/SheetAssignees';
import { NewSheet } from '@/UI/components/SheetEditor';
import { BlockTeamRosterBar } from '@/UI/components/TeamManager';
import { BOARD_PAGE, LAYOUT_GRID, PlanningToolbar, SCROLL_ITEM, type LayoutMode } from './components/PlanningToolbar';
import { SummaryStrip } from './components/SummaryStrip';
import { TaskSheetColumn } from './components/TaskSheetColumn';


// - Distribuição do dia: totais, equipas por bloco e as task sheets lado a lado, onde se redistribui o trabalho
export const PlanningPage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const board = useBoard(PlanKind.DAY);
  const openPlan = useOpenPlan();
  const resetPreset = useResetToDailyPreset();
  const canDistribute = usePermission('sheets.distribute');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('ALL');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LayoutMode>('EXPANDED');

  if (board.isLoading) return <PageLoading label={t('planning.loading')} />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;
  if (!board.plan) {
    return (
      <PageEmpty
        title={t('planning.noPlanTitle')}
        description={t('planning.noPlanHint')}
        action={canDistribute ? (
          <button onClick={() => openPlan(PlanKind.DAY)} className="rounded-lg bg-action hover:bg-action-hover text-primary-foreground px-6 py-3 text-sm font-medium">
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
  const byBlock = board.columns.filter(({ sheet }) => {
    if (blockFilter === 'ALL') return true;
    if (blockFilter === 'PARKING') return sheet.isReserve;
    return sheet.block.toLowerCase().includes(blockFilter.toLowerCase());
  });
  // - com filtro de tipo ou pesquisa só ficam as sheets com cartões que passam; os contadores de cada sheet não mudam
  const filtering = movementFilter !== 'ALL' || query.trim() !== '';
  const visible = byBlock
    .map(column => ({ column, cards: filterColumnViews(column, movementFilter, query) }))
    .filter(({ cards }) => !filtering || cards.length > 0);

  return (
    <SheetRemoveZone kind={PlanKind.DAY} className={BOARD_PAGE}>
      <div className="space-y-4 shrink-0">
        <SummaryStrip columns={board.columns} onReset={canDistribute ? handleReset : undefined} />
        {canDistribute && <BlockTeamRosterBar kind={PlanKind.DAY} />}
        <PlanningToolbar
          trailing={canDistribute ? <NewSheet planId={board.plan.id} /> : undefined}
          blockFilter={blockFilter}
          onBlockFilter={setBlockFilter}
          sheetCount={board.columns.length}
          parkingRange={parking.length > 0 ? `${Math.min(...parking)}-${Math.max(...parking)}` : ''}
          layout={layout}
          onLayout={setLayout}
          movementFilter={movementFilter}
          onMovementFilter={setMovementFilter}
          query={query}
          onQuery={setQuery}
        />
      </div>
      {/* - wrapper das sheets: é aqui (e só aqui) que há scroll; o resto da página fica fixo */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl">
      <div className={`${LAYOUT_GRID[layout]} pb-2`}>
        {filtering && visible.length === 0 && (
          <p className="col-span-full w-full py-10 text-center text-sm text-slate-500">{t('planning.noResults')}</p>
        )}
        {visible.map(({ column, cards }) => (
          // - 'contents' mantém o wrapper invisível ao flex/grid fora do modo scroll
          <div key={column.sheet.id} className={layout === 'SCROLL' ? SCROLL_ITEM : 'contents'}>
            <TaskSheetColumn
              column={column}
              cards={filtering ? cards : undefined}
              layout={layout === 'AUTO_FIT' ? 'FULL_FIT' : 'GRID'}
            />
          </div>
        ))}
      </div>
      </div>
    </SheetRemoveZone>
  );
};
