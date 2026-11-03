import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Layers, Sparkles } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useDropStaffOnSheet, useMoveTask } from '@/hooks/housekeeping';
import { calculateCounters } from '@/lib/counters';
import type { SheetColumn, TaskView } from '@/lib/taskViews';
import { useUiStore } from '@/store/uiStore';
import { RoomCard } from '@/UI/components/RoomCard/RoomCard';
import { SheetAssignees } from '@/UI/components/SheetAssignees';
import { SheetEditor } from '@/UI/components/SheetEditor';
import { getTeamColorPalette } from '@/UI/components/TeamManager/teamColorUtils';

export type ColumnLayout = 'GRID' | 'FULL_FIT';

interface TaskSheetColumnProps {
  column: SheetColumn;
  layout: ColumnLayout;
  // - cartões a mostrar quando há filtros ativos; os contadores usam sempre todos os da sheet
  cards?: TaskView[] | undefined;
}

const COUNTERS = [
  ['stayovers', 'stayoverCount', 'text-blue-600 dark:text-blue-400'],
  ['departureArrival', 'departureArrivalCount', 'text-rose-600 dark:text-rose-400'],
  ['departureOnly', 'departureOnlyCount', 'text-stone-500'],
  ['refreshes', 'refreshCount', 'text-purple-600 dark:text-purple-400']
] as const;

// - Uma task sheet do dia: pessoas atribuídas, contadores automáticos (§6.6) e os cartões das suas tarefas
export const TaskSheetColumn = ({ column, layout, cards }: TaskSheetColumnProps) => {
  const { t } = useTranslation();
  const { sheet, views, assignees } = column;
  const canDistribute = usePermission('sheets.distribute');
  const canAssign = usePermission('staff.assign');
  const moveTask = useMoveTask();
  const dropStaff = useDropStaffOnSheet();
  const draggingTaskId = useUiStore(state => state.draggingTaskId);
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const [isDragOver, setIsDragOver] = useState(false);

  const counters = calculateCounters(views);
  const palette = getTeamColorPalette(sheet.block);
  const isSource = !!draggingTaskId && views.some(view => view.task.id === draggingTaskId);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const staffId = event.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      if (canAssign) void dropStaff(staffId, sheet.id, event.dataTransfer.getData('application/from-sheet') || undefined);
      return;
    }
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId && canDistribute) void moveTask(taskId, sheet.id);
  };

  const width = layout === 'GRID' ? 'w-full' : 'flex-1 min-w-[275px] max-w-none';

  return (
    <div
      data-sheet-drop
      onDragOver={event => { if (canDistribute || canAssign) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsDragOver(true); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragOver(false); }}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border transition-all duration-150 ${width} ${
        isDragOver
          ? 'border-blue-500 ring-4 ring-blue-500/40 bg-blue-50/90 dark:bg-blue-950/50 shadow-xl scale-[1.01]'
          : draggingTaskId && !isSource
            ? 'border-blue-300 dark:border-blue-700/80 bg-blue-50/30 dark:bg-blue-950/20'
            : sheet.isReserve
              ? 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs'
      }`}
    >
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${sheet.isReserve ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                {t('sheet.number', { number: sheet.number })}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${palette.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
                <span>{sheet.block}</span>
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{sheet.title}</h4>
          </div>
          {canDistribute && <SheetEditor sheet={sheet} />}
        </div>

        <SheetAssignees sheetId={sheet.id} assignments={sheet.assignments} assignees={assignees} canEdit={canAssign} />

        <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-center">
          {COUNTERS.map(([key, field, tone]) => (
            <div key={key} className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">{t(`sheet.counters.${key}`)}</span>
              <span className={`text-xs font-bold tabular-nums ${tone}`}>{counters[field]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
          <span><Trans i18nKey="sheet.total" count={counters.totalTasks} components={{ strong: <strong className="text-slate-800 dark:text-slate-200 tabular-nums" /> }} /></span>
          <span><Trans i18nKey="sheet.effort" values={{ value: counters.estimatedCredits }} components={{ strong: <strong className="text-slate-800 dark:text-slate-200 tabular-nums" /> }} /></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{t('sheet.okRatio', { done: counters.completedCount, total: counters.totalTasks })}</span>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 space-y-2.5 min-h-[170px]">
        {isDragOver && (
          <div className="p-3 rounded-xl border-2 border-dashed border-blue-500 bg-blue-100/90 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>{draggingStaffId ? t('sheet.dropStaff', { number: sheet.number }) : t('sheet.dropRoom', { number: sheet.number, block: sheet.block })}</span>
          </div>
        )}

        {(cards ?? views).length > 0 ? (
          (cards ?? views).map((view, index) => <RoomCard key={view.task.id} view={view} index={index} />)
        ) : (
          <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-slate-50/50 dark:bg-slate-900/40">
            <Layers className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{sheet.isReserve ? t('sheet.emptyParking') : t('sheet.empty')}</span>
            {canDistribute && <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">{t('sheet.emptyHint')}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
