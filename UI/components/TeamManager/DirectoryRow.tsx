import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Clock, Edit2, LogIn, Smartphone, Trash2 } from 'lucide-react';
import { SHIFT } from '@/config/constants';
import { getDefaultBlock, getDisplayBlock } from '@/lib/staffBlock';
import { UserRole, type User } from '@/types/auth.types';
import type { BlockTeam } from '@/types/housekeeping.types';
import { getTeamColorPalette } from './teamColorUtils';

const SHIFT_KEYS: Record<string, string> = {
  [SHIFT.MORNING]: 'morning',
  [SHIFT.AFTERNOON]: 'afternoon',
  [SHIFT.TURNDOWN]: 'turndown',
  [SHIFT.GENERAL]: 'general'
};

interface DirectoryRowProps {
  user: User;
  blockTeams: BlockTeam[];
  sheetNumber?: number | undefined;
  canManage: boolean;
  onToggleDuty: (user: User) => void;
  onChangeDefaultBlock: (user: User, block: string) => void;
  onRestoreDefault: (user: User) => void;
  onSwitchUser: (userId: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const ACTION = 'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

export const DirectoryRow = ({ user, blockTeams, sheetNumber, canManage, onToggleDuty, onChangeDefaultBlock, onRestoreDefault, onSwitchUser, onEdit, onDelete }: DirectoryRowProps) => {
  const { t } = useTranslation();
  const defaultBlock = getDefaultBlock(user);
  const currentBlock = getDisplayBlock(user);
  const defaultPalette = getTeamColorPalette(defaultBlock);
  const currentPalette = getTeamColorPalette(currentBlock);
  const onDuty = user.isOnDuty !== false;
  const shiftKey = SHIFT_KEYS[user.shift || SHIFT.MORNING];

  const avatar = user.isExtra
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
    : user.role === UserRole.SUPERVISOR
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300'
      : `${defaultPalette.avatar} border-white/20`;

  return (
    <tr className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${onDuty ? '' : 'opacity-65 bg-slate-50/40 dark:bg-slate-900/40'}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${avatar}`}>{user.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
              {user.isExtra && <span className="text-[10px] font-bold px-1.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{t('team.extraBadge')}</span>}
              {user.role === UserRole.SUPERVISOR && <span className="text-[10px] font-bold px-1.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">{t('directory.badgeSupervisor')}</span>}
              {user.role === UserRole.ADMIN && <span className="text-[10px] font-bold px-1.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">{t('directory.badgeAdmin')}</span>}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[200px]">{user.email}</span>
            {user.notes && <span className="text-[10px] text-slate-500 italic block mt-0.5">{t('directory.note', { note: user.notes })}</span>}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        <button
          onClick={() => canManage && onToggleDuty(user)}
          disabled={!canManage}
          aria-pressed={onDuty}
          title={onDuty ? t('directory.toggleToOff') : t('directory.toggleToOn')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            onDuty ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${onDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>{onDuty ? t('directory.dutyOn') : t('directory.dutyOff')}</span>
        </button>
      </td>

      <td className="py-3 px-3">
        <select
          value={defaultBlock}
          disabled={!canManage}
          onChange={event => onChangeDefaultBlock(user, event.target.value)}
          aria-label={t('directory.changeDefaultTitle')}
          title={t('directory.changeDefaultTitle')}
          className={`px-2 py-1 rounded-md text-[11px] font-bold border ${defaultPalette.badge}`}
        >
          {blockTeams.map(team => <option key={team.id} value={team.block}>{team.block}</option>)}
        </select>
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${currentPalette.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentPalette.dot}`} />
            <span>{currentBlock}</span>
          </span>
          {currentBlock !== defaultBlock && canManage && (
            <button onClick={() => onRestoreDefault(user)} className="p-1 rounded text-amber-600 hover:bg-amber-100/60" title={t('directory.movedTitle', { block: defaultBlock })} aria-label={t('directory.movedTitle', { block: defaultBlock })}>
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-3 px-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{shiftKey ? t(`directory.shiftShort.${shiftKey}`) : user.shift}</span>
        </span>
      </td>

      <td className="py-3 px-3">
        {user.phoneDeviceId ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            <Smartphone className="w-3 h-3 text-slate-400" />
            <span>{user.phoneDeviceId}</span>
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">{t('directory.noDevice')}</span>
        )}
      </td>

      <td className="py-3 px-3">
        {sheetNumber !== undefined ? (
          <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px]">{t('sheet.number', { number: sheetNumber })}</span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">{t('directory.noSheet')}</span>
        )}
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onSwitchUser(user.id)} className={`${ACTION} hover:text-blue-600`} title={t('directory.loginAs')} aria-label={t('directory.loginAs')}><LogIn className="w-3.5 h-3.5" /></button>
          {canManage && (
            <>
              <button onClick={() => onEdit(user)} className={`${ACTION} hover:text-emerald-600`} title={t('directory.edit')} aria-label={t('directory.edit')}><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(user)} className={`${ACTION} hover:text-rose-600`} title={t('directory.delete')} aria-label={t('directory.delete')}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
