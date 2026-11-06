import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, ListTodo } from 'lucide-react';
import type { TaskView } from '@/lib/taskViews';
import { RoomCard } from '@/UI/components/RoomCard/RoomCard';

interface MobileTaskListProps {
  views: TaskView[];
  pendingAlerts: number;
  onOpenAlerts: () => void;
}

export const MobileTaskList = ({ views, pendingAlerts, onOpenAlerts }: MobileTaskListProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {pendingAlerts > 0 && (
        <button onClick={onOpenAlerts} className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-left flex items-center justify-between gap-2 shadow-xs hover:bg-red-100">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{t('mobile.alertBanner', { count: pendingAlerts })}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-600 shrink-0" />
        </button>
      )}

      {views.length > 0 ? (
        views.map((view, index) => <RoomCard key={view.task.id} view={view} index={index} />)
      ) : (
        <div className="py-16 text-center text-slate-400">
          <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('mobile.emptyTitle')}</p>
          <p className="text-xs mt-1">{t('mobile.emptyHint')}</p>
        </div>
      )}
    </div>
  );
};
