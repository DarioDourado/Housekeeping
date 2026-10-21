import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useMoveTask } from '@/hooks/housekeeping';
import type { SheetColumn } from '@/lib/taskViews';
import { useUiStore } from '@/store/uiStore';
import { TaskStatus } from '@/types/housekeeping.types';
import { SheetAssignees } from '@/UI/components/SheetAssignees';
import { TurndownCard } from './TurndownCard';

export const TurndownColumn = ({ column }: { column: SheetColumn }) => {
  const { t } = useTranslation();
  const { sheet, views, assignees } = column;
  const canDistribute = usePermission('sheets.distribute');
  const canAssign = usePermission('staff.assign');
  const moveTask = useMoveTask();
  const draggingTaskId = useUiStore(state => state.draggingTaskId);
  const [isOver, setIsOver] = useState(false);
  const completed = views.filter(view => view.task.status === TaskStatus.COMPLETED).length;

  return (
    <div
      onDragOver={event => { if (canDistribute) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsOver(true); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOver(false); }}
      onDrop={event => {
        event.preventDefault();
        setIsOver(false);
        const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
        if (taskId && canDistribute) void moveTask(taskId, sheet.id);
      }}
      className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all duration-150 ${
        isOver ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">{t('turndown.group', { number: sheet.number })}</span>
            <span className="text-xs font-medium text-slate-400">{sheet.block}</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">{t('turndown.done', { done: completed, total: views.length })}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{sheet.title}</h3>
        <SheetAssignees sheetId={sheet.id} assignments={sheet.assignments} assignees={assignees} canEdit={canAssign} />
      </div>

      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
        {isOver && (
          <div className="p-2.5 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold text-center animate-pulse flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{t('turndown.dropHere', { number: sheet.number })}</span>
          </div>
        )}
        {views.map((view, index) => <TurndownCard key={view.task.id} view={view} index={index} />)}
      </div>
    </div>
  );
};
