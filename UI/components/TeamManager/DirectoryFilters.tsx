import { useTranslation } from 'react-i18next';
import { Search, UserPlus } from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import type { BlockTeam } from '@/types/housekeeping.types';

export type DutyFilter = 'ALL' | 'ON_DUTY' | 'OFF_DUTY';

export interface DirectoryFilterState {
  search: string;
  block: string;
  duty: DutyFilter;
  role: string;
}

interface DirectoryFiltersProps {
  value: DirectoryFilterState;
  blockTeams: BlockTeam[];
  canAdd: boolean;
  onChange: (value: DirectoryFilterState) => void;
  onAdd: () => void;
}

const SELECT = 'px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';

export const DirectoryFilters = ({ value, blockTeams, canAdd, onChange, onAdd }: DirectoryFiltersProps) => {
  const { t } = useTranslation();
  const set = (patch: Partial<DirectoryFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1 sm:w-64 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('directory.searchPlaceholder')}
            aria-label={t('directory.searchPlaceholder')}
            value={value.search}
            onChange={event => set({ search: event.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <select value={value.duty} aria-label={t('directory.allStates')} onChange={event => set({ duty: event.target.value as DutyFilter })} className={SELECT}>
          <option value="ALL">{t('directory.allStates')}</option>
          <option value="ON_DUTY">{t('directory.onDutyOption')}</option>
          <option value="OFF_DUTY">{t('directory.offDutyOption')}</option>
        </select>
        <select value={value.block} aria-label={t('directory.allBlocks')} onChange={event => set({ block: event.target.value })} className={SELECT}>
          <option value="ALL">{t('directory.allBlocks')}</option>
          {blockTeams.map(team => <option key={team.id} value={team.block}>{team.block}</option>)}
        </select>
        <select value={value.role} aria-label={t('team.filters.all')} onChange={event => set({ role: event.target.value })} className={SELECT}>
          <option value="ALL">{t('team.filters.all')}</option>
          <option value={UserRole.HOUSEKEEPER}>{t('team.filters.housekeepers')}</option>
          <option value="EXTRA">{t('team.filters.extras')}</option>
          <option value={UserRole.SUPERVISOR}>{t('team.filters.supervisors')}</option>
          <option value={UserRole.ADMIN}>{t('team.filters.management')}</option>
        </select>
      </div>
      {canAdd && (
        <button onClick={onAdd} className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('directory.add')}</span>
        </button>
      )}
    </div>
  );
};
