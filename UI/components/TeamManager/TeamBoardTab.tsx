import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Search } from 'lucide-react';
import { useBlockTeams, useBoard } from '@/hooks/housekeeping';
import { useBlockLoad } from '@/hooks/housekeeping/useBlockLoad';
import { useStaff } from '@/hooks/staff';
import { getStaffBlock } from '@/lib/staffBlock';
import { UserRole } from '@/types/auth.types';
import { PlanKind } from '@/types/housekeeping.types';
import { TeamColumn } from './TeamColumn';
import { getTeamColorPalette } from './teamColorUtils';

interface TeamBoardTabProps {
  onAdd: (block: string) => void;
  onSwitchUser: (userId: string) => void;
}

const FILTERS = ['ALL', 'HOUSEKEEPER', 'EXTRA', 'SUPERVISOR', 'ADMIN'] as const;
const FILTER_KEY: Record<(typeof FILTERS)[number], string> = {
  ALL: 'all', HOUSEKEEPER: 'housekeepers', EXTRA: 'extras', SUPERVISOR: 'supervisors', ADMIN: 'management'
};

export const TeamBoardTab = ({ onAdd, onSwitchUser }: TeamBoardTabProps) => {
  const { t } = useTranslation();
  const { data: users = [] } = useStaff();
  const { data: blockTeams = [] } = useBlockTeams();
  const { columns } = useBoard(PlanKind.DAY);
  const { byBlock, totalCredits } = useBlockLoad();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<(typeof FILTERS)[number]>('ALL');

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(query)
        || (user.phoneDeviceId ?? '').toLowerCase().includes(query)
        || (user.assignedArea ?? '').toLowerCase().includes(query);
      const matchesRole = roleFilter === 'ALL'
        || (roleFilter === 'EXTRA' && user.isExtra)
        || (roleFilter === 'SUPERVISOR' && user.role === UserRole.SUPERVISOR)
        || (roleFilter === 'HOUSEKEEPER' && user.role === UserRole.HOUSEKEEPER && !user.isExtra)
        || (roleFilter === 'ADMIN' && user.role === UserRole.ADMIN);
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const activeStaff = users.filter(user => user.role === UserRole.HOUSEKEEPER || user.isExtra).length;
  const supervisors = users.filter(user => user.role === UserRole.SUPERVISOR).length;
  const average = activeStaff > 0 ? (totalCredits / activeStaff).toFixed(1) : '0.0';
  const sheetNumberOf = (userId: string) => columns.find(column => column.assignees.some(a => a.user.id === userId))?.sheet.number;

  const metric = (label: string, value: string | number, tone = 'text-slate-900 dark:text-slate-100') => (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${tone}`}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {metric(t('team.activeStaff'), activeStaff)}
          {metric(t('team.supervisors'), supervisors, 'text-purple-600 dark:text-purple-400')}
          {metric(t('team.totalCredits'), t('team.cr', { value: totalCredits.toFixed(1) }))}
          {metric(t('team.avgPerPerson'), t('team.cr', { value: average }), 'text-emerald-600 dark:text-emerald-400')}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('team.searchPlaceholder')}
              aria-label={t('team.searchPlaceholder')}
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            value={roleFilter}
            aria-label={t('team.filters.all')}
            onChange={event => setRoleFilter(event.target.value as (typeof FILTERS)[number])}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {FILTERS.map(filter => <option key={filter} value={filter}>{t(`team.filters.${FILTER_KEY[filter]}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"><Palette className="w-3.5 h-3.5" /></div>
          <span className="font-bold text-slate-800 dark:text-slate-200">{t('team.colorsTitle')}</span>
          <span className="text-[11px] text-slate-400 hidden md:inline">{t('team.colorsHint')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {blockTeams.map(team => {
            const palette = getTeamColorPalette(team.color || team.block);
            const count = users.filter(user => getStaffBlock(user) === team.block).length;
            return (
              <div
                key={team.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${palette.badge}`}
                title={t('team.chipTitle', { block: team.block, color: t(`teamColors.${palette.id}.name`), count, supervisor: team.supervisorName || t('team.notAvailable') })}
              >
                <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                <span>{team.block}</span>
                <span className="opacity-75 font-normal text-[10px]">({t(`teamColors.${palette.id}.short`)})</span>
                <span className="ml-0.5 px-1 rounded-full bg-white/60 dark:bg-slate-900/40 text-[9px]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 bg-slate-100/60 dark:bg-slate-950/40">
        <div className="flex gap-4 min-h-full items-stretch">
          {blockTeams.map(team => (
            <TeamColumn
              key={team.id}
              team={team}
              members={filtered.filter(user => getStaffBlock(user) === team.block)}
              load={byBlock.get(team.block) ?? { tasks: 0, credits: 0, departureArrivals: 0 }}
              blockTeams={blockTeams}
              sheetNumberOf={sheetNumberOf}
              onAdd={onAdd}
              onSwitchUser={onSwitchUser}
            />
          ))}
        </div>
      </div>
    </>
  );
};
