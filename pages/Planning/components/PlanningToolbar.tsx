import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Columns, Filter, Layers, LayoutGrid, Search } from 'lucide-react';
import { BLOCK } from '@/config/constants';
import type { MovementFilter, StateFilter } from '@/lib/boardFilter';
import { Movement, NotPerformedReason, TaskStatus } from '@/types/housekeeping.types';

export type LayoutMode = 'EXPANDED' | 'AUTO_FIT' | 'COMPACT' | 'SCROLL';

export const LAYOUT_GRID: Record<LayoutMode, string> = {
  AUTO_FIT: 'flex flex-wrap lg:flex-nowrap gap-3',
  COMPACT: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5',
  EXPANDED: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5',
  // - todas numa só linha, 6 visíveis de cada vez e scroll horizontal para as restantes
  SCROLL: 'flex gap-3'
};
// - ocupa a altura que o AppLayout dá ao <main> (responsivo, sem alturas fixas); min-h evita colapsar em janelas baixas
export const BOARD_PAGE = 'flex flex-col gap-4 w-full h-full min-h-[32rem]';
// - 6 colunas visíveis = (100% - 5 intervalos de gap-3) / 6; min-w evita colunas ilegíveis em ecrãs pequenos
export const SCROLL_ITEM = 'shrink-0 w-[calc((100%-5*0.75rem)/6)] min-w-[220px]';

interface PlanningToolbarProps {
  // - ação extra no fim da primeira linha (ex.: nova sheet)
  trailing?: ReactNode;
  blockFilter: string;
  onBlockFilter: (value: string) => void;
  sheetCount: number;
  parkingRange: string;
  layout: LayoutMode;
  onLayout: (value: LayoutMode) => void;
  movementFilter?: MovementFilter;
  onMovementFilter?: (value: MovementFilter) => void;
  query: string;
  onQuery: (value: string) => void;
  // - serviço da noite: sem estacionamento e, em vez do tipo de movimento, filtra pelo estado do turndown
  stateFilter?: StateFilter;
  onStateFilter?: (value: StateFilter) => void;
}

// - filtros por tipo de movimento; clicar no ativo volta a mostrar todos
const MOVEMENT_FILTERS = [
  [Movement.DEPARTURE_ARRIVAL, 'typeDepartureArrival'],
  [Movement.VACANT, 'typeArrivalOnly'],
  [Movement.DEPARTURE_ONLY, 'typeDepartureOnly'],
  [Movement.STAYOVER, 'typeStayover']
] as const;

// - filtros do turndown, pela ordem do fluxo: a decorrer, concluído e os impedimentos
const STATE_FILTERS = [
  [TaskStatus.IN_PROGRESS, 'filterStarted'],
  [TaskStatus.COMPLETED, 'filterFinished'],
  [NotPerformedReason.DND, 'filterDND'],
  [NotPerformedReason.REFUSE_SERVICE, 'filterNQ'],
  [NotPerformedReason.ALREADY_DONE, 'filterAC']
] as const;

const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 ${
    active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
  }`;

const LAYOUTS = [
  ['EXPANDED', 'layoutFull', LayoutGrid],
  ['AUTO_FIT', 'layoutAutoFit', Columns],
  ['COMPACT', 'layoutCompact', Layers],
  ['SCROLL', 'layoutScroll', ArrowLeftRight]
] as const;

export const PlanningToolbar = ({ trailing, blockFilter, onBlockFilter, sheetCount, parkingRange, layout, onLayout, movementFilter, onMovementFilter, query, onQuery, stateFilter, onStateFilter }: PlanningToolbarProps) => {
  const { t } = useTranslation();
  const night = !!onStateFilter;
  const filters = [
    { id: 'ALL', label: t('planning.filterAll', { count: sheetCount }) },
    { id: BLOCK.A, label: BLOCK.A },
    { id: BLOCK.B, label: BLOCK.B },
    { id: BLOCK.C, label: BLOCK.C },
    { id: BLOCK.D, label: BLOCK.D },
    { id: 'Oasis', label: BLOCK.OASIS },
    { id: 'Villas', label: BLOCK.VILLAS },
    ...(night ? [] : [{ id: 'PARKING', label: t('planning.filterParking', { numbers: parkingRange }) }])
  ];

  return (
    <div className="space-y-2.5 text-xs w-full bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-line">
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0"><Filter className="w-3.5 h-3.5" />{t('planning.areaLabel')}</span>
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => onBlockFilter(filter.id)}
            aria-pressed={blockFilter === filter.id}
            className={chipClass(blockFilter === filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider hidden md:inline">{t('planning.screenExtension')}</span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {LAYOUTS.map(([mode, key, Icon]) => (
            <button
              key={mode}
              onClick={() => onLayout(mode)}
              aria-pressed={layout === mode}
              title={t(`planning.${key}Title`)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                layout === mode ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(`planning.${key}`)}</span>
            </button>
          ))}
        </div>
        {trailing}
      </div>
    </div>

    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
        <span className="text-slate-400 font-medium mr-1 shrink-0">{t(night ? 'turndown.filterLabel' : 'planning.typeLabel')}</span>
        {night
          ? STATE_FILTERS.map(([state, key]) => (
              <button key={state} onClick={() => onStateFilter(stateFilter === state ? 'ALL' : state)} aria-pressed={stateFilter === state} className={chipClass(stateFilter === state)}>
                {t(`turndown.${key}`)}
              </button>
            ))
          : MOVEMENT_FILTERS.map(([movement, key]) => (
              <button key={movement} onClick={() => onMovementFilter?.(movementFilter === movement ? 'ALL' : movement)} aria-pressed={movementFilter === movement} className={chipClass(movementFilter === movement)}>
                {t(`planning.${key}`)}
              </button>
            ))}
      </div>

      <label className="relative w-full lg:max-w-sm lg:ml-auto">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={event => onQuery(event.target.value)}
          placeholder={t('planning.searchPlaceholder')}
          aria-label={t('planning.searchLabel')}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
        />
      </label>
    </div>
    </div>
  );
};
