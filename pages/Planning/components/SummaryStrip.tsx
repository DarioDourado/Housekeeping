import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { calculateCounters } from '@/lib/counters';
import { buildReport } from '@/lib/report';
import type { SheetColumn } from '@/lib/taskViews';
import { RoomStatus } from '@/types/housekeeping.types';

interface SummaryStripProps {
  columns: SheetColumn[];
  onReset?: (() => void) | undefined;
}

// - Totais do dia: composição do trabalho por tipo e estado dos quartos no Opera
export const SummaryStrip = ({ columns, onReset }: SummaryStripProps) => {
  const views = columns.flatMap(column => column.views);
  const report = buildReport(columns);
  const { t } = useTranslation();
  const counters = calculateCounters(views);
  const rooms = new Map(views.map(view => [view.room.id, view.room]));
  const opera = (status: RoomStatus) => Array.from(rooms.values()).filter(room => room.operaStatus === status).length;

  const stat = (label: string, value: number | string, tone = 'text-slate-900 dark:text-slate-100') => (
    <>
      <div>
        <span className="text-slate-400 block font-medium">{label}</span>
        <span className={`text-lg font-bold tabular-nums ${tone}`}>{value}</span>
      </div>
      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block last:hidden" />
    </>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">{t('planning.totalHotel')}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{t('planning.roomsCount', { count: rooms.size })}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          {stat(t('planning.departureArrival'), counters.departureArrivalCount, 'text-rose-600 dark:text-rose-400')}
          {stat(t('counters.stayovers'), counters.stayoverCount, 'text-blue-600 dark:text-blue-400')}
          {stat(t('counters.departuresOnly'), counters.departureOnlyCount, 'text-stone-500')}
          {stat(t('counters.refreshes'), counters.refreshCount, 'text-purple-600 dark:text-purple-400')}
          {/* - métricas de relatório: continuam os totais acima, na mesma linha */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="min-w-28" title={t('report.progress', { done: report.completed, total: report.total })}>
            <span className="text-slate-400 block font-medium">{t('report.completed')}</span>
            <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{report.progress}%</span>
            <div className="mt-0.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={report.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-emerald-500" style={{ width: `${report.progress}%` }} />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          {stat(t('report.pending'), report.pending)}
          {stat(t('report.inProgress'), report.inProgress, 'text-blue-600 dark:text-blue-400')}
          {stat(t('report.priority'), report.priority, 'text-rose-600 dark:text-rose-400')}
          {stat(t('report.avgTime'), report.avgMinutes === undefined ? '—' : t('report.minutes', { count: report.avgMinutes }))}
          {stat(t('report.people'), report.people)}
          {stat(t('report.perPerson'), report.perPerson)}
          {stat(t('report.credits'), report.credits)}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{t('planning.dirtyCount', { count: opera(RoomStatus.DIRTY) })}</span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800">{t('planning.cleanCount', { count: opera(RoomStatus.CLEAN) })}</span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{t('planning.inspectedCount', { count: opera(RoomStatus.INSPECTED) })}</span>
          </div>
          {onReset && (
            <button onClick={onReset} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5" title={t('planning.resetTitle')}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('planning.resetButton')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
