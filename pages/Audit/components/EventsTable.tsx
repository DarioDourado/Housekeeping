import { useTranslation } from 'react-i18next';
import { ALL_ROOMS } from '@/config/constants';
import { formatTimeWithSeconds } from '@/lib/datetime';
import { EVENT_LABEL_KEY } from '@/lib/eventLabels';
import type { TaskEvent } from '@/types/housekeeping.types';
import { eventStyle } from './eventStyles';

interface EventsTableProps {
  events: TaskEvent[];
  staffNames: Map<string, string>;
}

const COLUMNS = ['time', 'room', 'event', 'operator', 'duration', 'details'] as const;

// - Histórico append-only: quem registou, quem executou (se conhecido) e se foi em nome da equipa
export const EventsTable = ({ events, staffNames }: EventsTableProps) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
          <tr>{COLUMNS.map(column => <th key={column} className="py-3 px-4">{t(`audit.columns.${column}`)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          {events.length === 0 ? (
            <tr><td colSpan={COLUMNS.length} className="py-8 text-center text-slate-400 italic">{t('audit.empty')}</td></tr>
          ) : (
            events.map(event => {
              const { icon: Icon, color } = eventStyle(event.type);
              const executors = event.executorIds.map(id => staffNames.get(id) ?? id).join(', ');
              return (
                <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">{formatTimeWithSeconds(event.occurredAt)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 tabular-nums">{event.roomNumber === ALL_ROOMS ? t('audit.allRooms') : event.roomNumber}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{t(`audit.events.${EVENT_LABEL_KEY[event.type]}`)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {event.registeredByName} <span className="text-slate-400 text-[11px]">({event.registeredByRole})</span>
                    {executors && <span className="block text-[11px] text-slate-500">{t('audit.executor', { names: executors })}</span>}
                    {event.onBehalfOfTeam && <span className="block text-[11px] text-amber-600 dark:text-amber-400">{t('audit.onBehalf')}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {event.durationSeconds !== undefined ? t('audit.duration', { minutes: Math.round(event.durationSeconds / 60), seconds: event.durationSeconds }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">{event.detail ? t(event.detail.key, event.detail.params) : '—'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
