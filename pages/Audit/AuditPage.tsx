import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Search } from 'lucide-react';
import { useEvents } from '@/hooks/housekeeping';
import { useStaff } from '@/hooks/staff';
import { EVENT_LABEL_KEY } from '@/lib/eventLabels';
import { PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { EventsTable } from './components/EventsTable';

const FILTERABLE = ['ROOM_STARTED', 'ROOM_FINISHED', 'INSPECTION_APPROVED', 'INSPECTION_REPROVED', 'CORRECTION_DONE', 'REFRESH_RECORDED', 'DND_RECORDED', 'SERVICE_REFUSED', 'ROOM_REOPENED', 'TURNDOWN_UPDATED', 'OPERA_CONFLICT_DETECTED', 'NIGHT_AUDIT_TRIGGERED'] as const;

// - Auditoria de tempos e histórico imutável de eventos (§14)
export const AuditPage = () => {
  const { t } = useTranslation();
  const events = useEvents();
  const staff = useStaff();
  const [room, setRoom] = useState('');
  const [type, setType] = useState('ALL');

  if (events.isLoading || staff.isLoading) return <PageLoading />;
  if (events.isError || staff.isError) return <PageError onRetry={() => { void events.refetch(); void staff.refetch(); }} />;

  const names = new Map((staff.data ?? []).map(user => [user.id, user.name]));
  const filtered = (events.data ?? []).filter(event =>
    (!room || event.roomNumber.toLowerCase().includes(room.toLowerCase())) && (type === 'ALL' || event.type === type)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" />{t('audit.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={room}
              onChange={event => setRoom(event.target.value)}
              placeholder={t('audit.filterRoom')}
              aria-label={t('audit.filterRoom')}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <select value={type} onChange={event => setType(event.target.value)} aria-label={t('audit.filterType')} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <option value="ALL">{t('audit.filters.all')}</option>
            {FILTERABLE.map(value => <option key={value} value={value}>{t(`audit.events.${EVENT_LABEL_KEY[value]}`)}</option>)}
          </select>
        </div>
      </div>
      <EventsTable events={filtered} staffNames={names} />
    </div>
  );
};
