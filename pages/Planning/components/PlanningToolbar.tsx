import { useTranslation } from 'react-i18next';
import { Columns, Filter, Layers, LayoutGrid } from 'lucide-react';
import { BLOCK } from '@/config/constants';

export type LayoutMode = 'EXPANDED' | 'AUTO_FIT' | 'COMPACT';

interface PlanningToolbarProps {
  blockFilter: string;
  onBlockFilter: (value: string) => void;
  sheetCount: number;
  parkingRange: string;
  layout: LayoutMode;
  onLayout: (value: LayoutMode) => void;
}

const LAYOUTS = [
  ['EXPANDED', 'layoutFull', LayoutGrid],
  ['AUTO_FIT', 'layoutAutoFit', Columns],
  ['COMPACT', 'layoutCompact', Layers]
] as const;

export const PlanningToolbar = ({ blockFilter, onBlockFilter, sheetCount, parkingRange, layout, onLayout }: PlanningToolbarProps) => {
  const { t } = useTranslation();
  const filters = [
    { id: 'ALL', label: t('planning.filterAll', { count: sheetCount }) },
    { id: BLOCK.A, label: BLOCK.A },
    { id: BLOCK.B, label: BLOCK.B },
    { id: BLOCK.C, label: BLOCK.C },
    { id: 'Oasis', label: BLOCK.OASIS },
    { id: 'Villas', label: BLOCK.VILLAS },
    { id: 'PARKING', label: t('planning.filterParking', { numbers: parkingRange }) }
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs w-full bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0"><Filter className="w-3.5 h-3.5" />{t('planning.areaLabel')}</span>
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => onBlockFilter(filter.id)}
            aria-pressed={blockFilter === filter.id}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 ${
              blockFilter === filter.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
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
      </div>
    </div>
  );
};
