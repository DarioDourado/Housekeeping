import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useDropStaffOnSheet, useMoveTask } from '@/hooks/housekeeping';
import type { SheetColumn, TaskView } from '@/lib/taskViews';
import { useUiStore } from '@/store/uiStore';
import { TaskStatus } from '@/types/housekeeping.types';
import { SheetAssignees } from '@/UI/components/SheetAssignees';
import { SheetEditor } from '@/UI/components/SheetEditor';
import { TurndownCard } from './TurndownCard';

interface TurndownColumnProps {
  column: SheetColumn;
  // - cartões a mostrar quando há filtros ativos; o progresso usa sempre todos os da zona
  cards?: TaskView[] | undefined;
}

// - Uma zona do turndown: mesmas interações da task sheet da manhã (largar quartos e pessoas, juntar zonas), em versão simples
export const TurndownColumn = ({ column, cards }: TurndownColumnProps) => {
  const { t } = useTranslation();
  const { sheet, views, assignees } = column;
  const canDistribute = usePermission('sheets.distribute');
  const canAssign = usePermission('staff.assign');
  const moveTask = useMoveTask();
  const dropStaff = useDropStaffOnSheet();
  const draggingTaskId = useUiStore(state => state.draggingTaskId);
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const [isOver, setIsOver] = useState(false);
  const completed = views.filter(view => view.task.status === TaskStatus.COMPLETED).length;
  const shown = cards ?? views;
  const isSource = !!draggingTaskId && views.some(view => view.task.id === draggingTaskId);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);
    const staffId = event.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      if (canAssign) void dropStaff(staffId, sheet.id, event.dataTransfer.getData('application/from-sheet') || undefined);
      return;
    }
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId && canDistribute) void moveTask(taskId, sheet.id);
  };

  return (
    <div
      data-sheet-drop
      onDragOver={event => { if (canDistribute || canAssign) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsOver(true); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOver(false); }}
      onDrop={handleDrop}
      className={`bg-surface border rounded-2xl shadow-xs flex flex-col transition-all duration-150 ${
        isOver
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]'
          : draggingTaskId && !isSource
            ? 'border-indigo-300 dark:border-indigo-700/80 bg-indigo-50/30 dark:bg-indigo-950/20'
            : 'border-line'
      }`}
    >
      <div className="p-4 border-b border-line bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">{t('turndown.group', { number: sheet.number })}</span>
            <span className="text-xs font-medium text-slate-400 line-clamp-1">{sheet.block}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-content tabular-nums">{t('turndown.done', { done: completed, total: views.length })}</span>
            {canDistribute && <SheetEditor sheet={sheet} />}
          </div>
        </div>
        <h3 className="text-sm font-bold text-content line-clamp-1">{sheet.title}</h3>
        <SheetAssignees sheetId={sheet.id} assignments={sheet.assignments} assignees={assignees} canEdit={canAssign} />
      </div>

      <div className="p-3 space-y-2.5 min-h-[170px]">
        {isOver && (
          <div className="p-2.5 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold text-center animate-pulse flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{draggingStaffId ? t('sheet.dropStaff', { number: sheet.number }) : t('turndown.dropHere', { number: sheet.number })}</span>
          </div>
        )}
        {shown.map((view, index) => <TurndownCard key={view.task.id} view={view} index={index} />)}
        {shown.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('sheet.empty')}</span>
            {canDistribute && <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{t('sheet.emptyHint')}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
