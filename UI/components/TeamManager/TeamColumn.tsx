import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AlertTriangle, Palette, Plus, UserCheck, Users } from 'lucide-react';
import { BLOCK } from '@/config/constants';
import { useMoveStaffToBlock, useUpdateBlockTeam } from '@/hooks/housekeeping';
import type { BlockLoad } from '@/hooks/housekeeping/useBlockLoad';
import { useUiStore } from '@/store/uiStore';
import type { User } from '@/types/auth.types';
import type { BlockTeam } from '@/types/housekeeping.types';
import { TeamMemberCard } from './TeamMemberCard';
import { AVAILABLE_TEAM_COLORS, getTeamColorPalette } from './teamColorUtils';

interface TeamColumnProps {
  team: BlockTeam;
  members: User[];
  load: BlockLoad;
  blockTeams: BlockTeam[];
  sheetNumberOf: (userId: string) => number | undefined;
  onAdd: (block: string) => void;
  onSwitchUser: (userId: string) => void;
}

// - Pessoas acima desta carga estimada (créditos) por dia ficam assinaladas como sobrecarregadas
const OVERLOAD_THRESHOLD = 14;

export const TeamColumn = ({ team, members, load, blockTeams, sheetNumberOf, onAdd, onSwitchUser }: TeamColumnProps) => {
  const { t } = useTranslation();
  const palette = getTeamColorPalette(team.color || team.block);
  const moveStaffToBlock = useMoveStaffToBlock();
  const updateBlockTeam = useUpdateBlockTeam();
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const setDraggingStaffId = useUiStore(state => state.setDraggingStaffId);
  const [isOver, setIsOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isPool = team.block === BLOCK.SUPPORT;
  const perPerson = members.length > 0 ? +(load.credits / members.length).toFixed(1) : load.credits;

  return (
    <div
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsOver(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOver(false); }}
      onDrop={event => {
        event.preventDefault();
        setIsOver(false);
        const staffId = event.dataTransfer.getData('application/staff-id') || draggingStaffId;
        if (staffId) { void moveStaffToBlock(staffId, team.block); setDraggingStaffId(null); }
      }}
      className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl border-t-4 border transition-all duration-150 ${palette.topBorder} ${
        isOver
          ? `${palette.borderFocused} ${palette.bgLight} shadow-xl scale-[1.01]`
          : isPool
            ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
            : `${palette.borderLight} bg-white dark:bg-slate-900 shadow-xs`
      }`}
    >
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${palette.dot} ring-2 ring-white dark:ring-slate-800 shrink-0`} />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{team.name}</h4>
              <div className="relative shrink-0">
                <button
                  onClick={() => setPickerOpen(open => !open)}
                  className={`p-1 rounded-md text-[10px] font-semibold flex items-center gap-1 border ${palette.badge}`}
                  title={t('team.currentColor', { color: t(`teamColors.${palette.id}.name`) })}
                  aria-expanded={pickerOpen}
                >
                  <Palette className="w-3 h-3" />
                  <span className="hidden sm:inline">{t(`teamColors.${palette.id}.short`)}</span>
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-40 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block px-1">{t('team.pickColor', { block: team.block })}</span>
                    <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {Object.values(AVAILABLE_TEAM_COLORS).map(color => (
                        <button
                          key={color.id}
                          onClick={() => { void updateBlockTeam({ ...team, color: color.id }); setPickerOpen(false); }}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium border text-left ${
                            (team.color || '').toLowerCase() === color.id ? `${color.badge} ring-2 ${color.ring} font-bold` : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                          <span className="truncate">{t(`teamColors.${color.id}.name`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {team.description} {team.supervisorName ? t('team.supervisorShort', { name: team.supervisorName }) : ''}
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${palette.badge}`}>{t('team.people', { count: members.length })}</span>
        </div>

        {!isPool && (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-500">
              <span><Trans i18nKey="team.rooms" values={{ rooms: load.tasks, departures: load.departureArrivals }} components={{ b: <b className="text-slate-800 dark:text-slate-200" /> }} /></span>
              <span><Trans i18nKey="team.credits" values={{ value: load.credits }} components={{ b: <b className="text-blue-600 dark:text-blue-400" /> }} /></span>
            </div>
            <div className="flex items-center justify-between font-semibold pt-0.5">
              <span className="text-slate-500">{t('team.loadPerPerson')}</span>
              {members.length === 0 ? (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold"><AlertTriangle className="w-3 h-3" />{t('team.noStaffAlert')}</span>
              ) : (
                <span className={perPerson > OVERLOAD_THRESHOLD ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>{t('team.perPerson', { value: perPerson })}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {isOver && (
        <div className={`mx-3 mt-2 p-3 border-2 border-dashed rounded-xl ${palette.badge} text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2`}>
          <UserCheck className="w-4 h-4" />
          <span>{t('team.dropTransfer', { block: team.block })}</span>
        </div>
      )}

      <div className="p-3 flex-1 overflow-y-auto space-y-2.5 min-h-[160px]">
        {members.length === 0 && !isOver && (
          <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
            <Users className="w-6 h-6 mb-1 opacity-40" />
            <span>{t('team.noneAllocated')}</span>
            <span className="text-[10px] mt-0.5">{t('team.dragHere')}</span>
          </div>
        )}
        {members.map(member => (
          <TeamMemberCard key={member.id} member={member} team={team} palette={palette} sheetNumber={sheetNumberOf(member.id)} blockTeams={blockTeams} onSwitchUser={onSwitchUser} />
        ))}
      </div>

      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => onAdd(team.block)}
          className="w-full py-1.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('team.addTo', { block: team.block })}</span>
        </button>
      </div>
    </div>
  );
};
