import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon } from 'lucide-react';
import { TURNDOWN_SCHEDULE } from '@/config/constants';
import { usePermission } from '@/hooks/auth/usePermission';
import { useBoard, useOpenPlan } from '@/hooks/housekeeping';
import { filterColumnViews, type StateFilter } from '@/lib/boardFilter';
import { buildReport } from '@/lib/report';
import { PlanKind } from '@/types/housekeeping.types';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { SheetRemoveZone } from '@/UI/components/SheetAssignees';
import { NewSheet } from '@/UI/components/SheetEditor';
import { BlockTeamRosterBar } from '@/UI/components/TeamManager';
import { BOARD_PAGE, LAYOUT_GRID, PlanningToolbar, SCROLL_ITEM, type LayoutMode } from '@/pages/Planning/components/PlanningToolbar';
import { TurndownColumn } from './components/TurndownColumn';

// - Serviço da noite: distribuição própria, independente da diurna (pode preparar-se com o dia ainda a decorrer).
//   É a task sheet da manhã em versão simples: mesma barra de equipas, filtros, pesquisa e layouts.
// - extensão total: 8 zonas por linha nos ecrãs largos (as restantes disposições são as da manhã)
const GRID = { ...LAYOUT_GRID, EXPANDED: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3.5' };

export const TurndownPage = () => {
  const { t } = useTranslation();
  const board = useBoard(PlanKind.NIGHT);
  const openPlan = useOpenPlan();
  const canDistribute = usePermission('sheets.distribute');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LayoutMode>('EXPANDED');

  if (board.isLoading) return <PageLoading />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;
  if (!board.plan) {
    return (
      <PageEmpty
        title={t('turndown.noPlanTitle')}
        description={t('turndown.noPlanHint')}
        action={canDistribute ? (
          <button onClick={() => openPlan(PlanKind.NIGHT)} className="rounded-lg bg-action hover:bg-action-hover text-primary-foreground px-6 py-3 text-sm font-medium">{t('turndown.openPlan')}</button>
        ) : undefined}
      />
    );
  }

  const report = buildReport(board.columns);
  const stats = [
    [t('report.pending'), report.pending], [t('report.inProgress'), report.inProgress], [t('report.dnd'), report.dnd], [t('report.nq'), report.nq], [t('report.ac'), report.ac],
    [t('report.avgTime'), report.avgMinutes === undefined ? '—' : t('report.minutes', { count: report.avgMinutes })], [t('report.people'), report.people], [t('report.perPerson'), report.perPerson]
  ];
  const filtering = stateFilter !== 'ALL' || query.trim() !== '';
  const visible = board.columns
    .filter(({ sheet }) => blockFilter === 'ALL' || sheet.block.toLowerCase().includes(blockFilter.toLowerCase()))
    .map(column => ({ column, cards: filterColumnViews(column, 'ALL', query, stateFilter) }))
    .filter(({ cards }) => !filtering || cards.length > 0);

  return (
    <SheetRemoveZone kind={PlanKind.NIGHT} className={BOARD_PAGE}>
      <div className="space-y-4 shrink-0">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"><Moon className="w-6 h-6" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight">{t('turndown.title')}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-medium">
                  {t('turndown.window', { start: TURNDOWN_SCHEDULE.start, end: TURNDOWN_SCHEDULE.end })}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{t('turndown.isolated')}</span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">{t('turndown.description')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <div className="min-w-28" title={t('report.progress', { done: report.completed, total: report.total })}>
              <span className="text-[11px] text-indigo-200 block">{t('turndown.progress')}</span>
              <span className="text-xl font-bold tabular-nums">{report.completed} / {report.total}</span>
              <div className="mt-0.5 h-1.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-700" role="progressbar" aria-valuenow={report.progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-emerald-400" style={{ width: `${report.progress}%` }} />
              </div>
            </div>
            {stats.map(([label, value]) => (
              <div key={label}>
                <span className="text-[11px] text-indigo-200 block">{label}</span>
                <span className="text-xl font-bold tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {canDistribute && <BlockTeamRosterBar kind={PlanKind.NIGHT} />}
        <PlanningToolbar
          trailing={canDistribute ? <NewSheet planId={board.plan.id} /> : undefined}
          blockFilter={blockFilter}
          onBlockFilter={setBlockFilter}
          sheetCount={board.columns.length}
          parkingRange=""
          layout={layout}
          onLayout={setLayout}
          stateFilter={stateFilter}
          onStateFilter={setStateFilter}
          query={query}
          onQuery={setQuery}
        />
      </div>

      {/* - wrapper das zonas: é aqui (e só aqui) que há scroll; o resto da página fica fixo */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl">
        <div className={`${GRID[layout]} pb-2`}>
          {(filtering || blockFilter !== 'ALL') && visible.length === 0 && (
            <p className="col-span-full w-full py-10 text-center text-sm text-slate-500">{t('planning.noResults')}</p>
          )}
          {visible.map(({ column, cards }) => (
            // - 'contents' mantém o wrapper invisível ao flex/grid fora do modo scroll
            <div key={column.sheet.id} className={layout === 'SCROLL' ? SCROLL_ITEM : layout === 'AUTO_FIT' ? 'flex-1 min-w-[275px]' : 'contents'}>
              <TurndownColumn
                column={column}
                cards={filtering ? cards : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </SheetRemoveZone>
  );
};
