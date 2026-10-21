import { useTranslation } from 'react-i18next';
import { GripVertical, Smartphone } from 'lucide-react';
import { useMoveStaffToBlock } from '@/hooks/housekeeping';
import { getStaffBlock } from '@/lib/staffBlock';
import { useUiStore } from '@/store/uiStore';
import { UserRole, type User } from '@/types/auth.types';
import type { BlockTeam } from '@/types/housekeeping.types';
import type { TeamColorPalette } from './teamColorUtils';

interface TeamMemberCardProps {
  member: User;
  team: BlockTeam;
  palette: TeamColorPalette;
  sheetNumber?: number | undefined;
  blockTeams: BlockTeam[];
  onSwitchUser: (userId: string) => void;
}

const BADGE = 'text-[10px] font-semibold px-1.5 py-0.5 rounded';

// - Cartão arrastável de uma pessoa dentro da coluna do seu bloco
export const TeamMemberCard = ({ member, team, palette, sheetNumber, blockTeams, onSwitchUser }: TeamMemberCardProps) => {
  const { t } = useTranslation();
  const moveStaffToBlock = useMoveStaffToBlock();
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const setDraggingStaffId = useUiStore(state => state.setDraggingStaffId);
  const isBeingDragged = draggingStaffId === member.id;

  const avatar = member.isExtra
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
    : member.role === UserRole.SUPERVISOR
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300'
      : `${palette.avatar} border border-white/20`;

  return (
    <div
      draggable
      onDragStart={event => {
        event.dataTransfer.setData('application/staff-id', member.id);
        event.dataTransfer.setData('text/plain', member.id);
        event.dataTransfer.effectAllowed = 'move';
        setDraggingStaffId(member.id);
      }}
      onDragEnd={() => setDraggingStaffId(null)}
      className={`p-3 rounded-xl border border-l-4 ${palette.bar} ${palette.borderLight} bg-white dark:bg-slate-800 select-none cursor-grab active:cursor-grabbing group shadow-2xs hover:shadow-md ${
        isBeingDragged ? 'opacity-40 scale-95 border-blue-500 ring-2 ring-blue-500' : 'hover:border-slate-400'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatar}`}>
            {member.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{member.name}</span>
              {member.isOnDuty === false && <span className={`${BADGE} bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300`}>{t('team.offBadge')}</span>}
              {member.isExtra && <span className={`${BADGE} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`}>{t('team.extraBadge')}</span>}
              {member.role === UserRole.SUPERVISOR && <span className={`${BADGE} bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300`}>{t('team.supervisorBadge')}</span>}
              {member.defaultBlock && member.defaultBlock !== team.block && (
                <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded" title={t('team.defaultBlockTitle', { block: member.defaultBlock })}>
                  {t('team.defaultBlockShort', { block: member.defaultBlock })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              {member.phoneDeviceId ? (
                <span className="flex items-center gap-0.5"><Smartphone className="w-3 h-3" />{member.phoneDeviceId}</span>
              ) : (
                <span>{t(`roles.${member.role}`)}</span>
              )}
              {sheetNumber !== undefined && <span className="font-medium text-blue-600 dark:text-blue-400">{t('team.sheetRef', { number: sheetNumber })}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSwitchUser(member.id)}
          className="text-[10px] font-semibold px-2 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          title={t('team.enterTitle')}
        >
          {t('team.enter')}
        </button>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
        <label htmlFor={`move-${member.id}`} className="text-slate-400">{t('team.moveTo')}</label>
        <select
          id={`move-${member.id}`}
          value={getStaffBlock(member)}
          onChange={event => moveStaffToBlock(member.id, event.target.value)}
          className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium"
        >
          {blockTeams.map(option => <option key={option.id} value={option.block}>{option.block}</option>)}
        </select>
      </div>
    </div>
  );
};
