import { useTranslation } from 'react-i18next';
import { useEvents } from '@/hooks/housekeeping';
import { useStaff } from '@/hooks/staff';
import { formatTimeWithSeconds } from '@/lib/datetime';
import { EVENT_LABEL_KEY } from '@/lib/eventLabels';
import type { TaskView } from '@/lib/taskViews';

// - Histórico do quarto: quem registou, quem executou e em nome de quem (§14.5)
export const TaskHistory = ({ view }: { view: TaskView }) => {
  const { t } = useTranslation();
  const { data: events = [] } = useEvents();
  const { data: staff = [] } = useStaff();
  const names = new Map(staff.map(user => [user.id, user.name]));
  const history = events.filter(event => event.roomId === view.room.id).slice(0, 8);

  if (history.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('room.detail.history')}</span>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
        {history.map(event => {
          const executors = event.executorIds.map(id => names.get(id) ?? id).join(', ');
          return (
            <li key={event.id} className="px-3 py-2 flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t(`audit.events.${EVENT_LABEL_KEY[event.type]}`)}</span>
                <span className="text-slate-500"> · {event.registeredByName}</span>
                {executors && <span className="text-slate-500"> · {t('audit.executor', { names: executors })}</span>}
                {event.onBehalfOfTeam && <span className="text-amber-600 dark:text-amber-400"> · {t('audit.onBehalf')}</span>}
              </div>
              <span className="text-slate-400 tabular-nums shrink-0">{formatTimeWithSeconds(event.occurredAt)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
