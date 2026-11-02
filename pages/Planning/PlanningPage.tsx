import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/auth/usePermission';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useBoard, useOpenPlan, useResetToDailyPreset } from '@/hooks/housekeeping';
import { filterColumnViews, type MovementFilter } from '@/lib/boardFilter';
import { PlanKind } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { BlockTeamRosterBar } from '@/UI/components/TeamManager';
import { PlanningToolbar, type LayoutMode } from './components/PlanningToolbar';
import { SummaryStrip } from './components/SummaryStrip';
import { TaskSheetColumn } from './components/TaskSheetColumn';

const GRID: Record<LayoutMode, string> = {
  AUTO_FIT: 'flex flex-wrap lg:flex-nowrap gap-3',
  COMPACT: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5',
  EXPANDED: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5',
  // - todas numa só linha, 6 visíveis de cada vez e scroll horizontal para as restantes
  SCROLL: 'flex gap-3'
};
// - ocupa a altura que o AppLayout dá ao <main> (responsivo, sem alturas fixas); min-h evita colapsar em janelas baixas
const PAGE = 'flex flex-col gap-4 w-full h-full min-h-[32rem]';
// - 6 colunas visíveis = (100% - 5 intervalos de gap-3) / 6; min-w evita colunas ilegíveis em ecrãs pequenos
const SCROLL_ITEM = 'shrink-0 w-[calc((100%-5*0.75rem)/6)] min-w-[220px]';

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
    <div className={PAGE}>
      <div className="space-y-4 shrink-0">
        <SummaryStrip views={board.views} onReset={canDistribute ? handleReset : undefined} />
        {canDistribute && <BlockTeamRosterBar />}
        <PlanningToolbar
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
      <div className={`${GRID[layout]} pb-2`}>
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
              otherSheets={board.columns.filter(other => other.sheet.id !== column.sheet.id).map(other => ({ id: other.sheet.id, title: other.sheet.title }))}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};
