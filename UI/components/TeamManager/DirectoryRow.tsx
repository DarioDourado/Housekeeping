import { isGovernanta } from '@/lib/jobTitles';
import { isOnDuty } from '@/lib/staffDuty';
import { JobTitleBadges } from './JobTitleBadges';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Edit2, LogIn, Trash2 } from 'lucide-react';
import { SHIFT } from '@/config/constants';
import { getDefaultBlock, getDisplayBlock } from '@/lib/staffBlock';
import { UserRole, type User } from '@/types/auth.types';
import type { BlockTeam, PlanKind } from '@/types/housekeeping.types';
import { getTeamColorPalette } from './teamColorUtils';

const SHIFT_KEYS: Record<string, string> = {
  [SHIFT.MORNING]: 'morning',
  [SHIFT.AFTERNOON]: 'afternoon',
  [SHIFT.TURNDOWN]: 'turndown',
  [SHIFT.GENERAL]: 'general'
};

interface DirectoryRowProps {
  user: User;
  kind: PlanKind;
  blockTeams: BlockTeam[];
  sheetId?: string | undefined;
  sheets: { id: string; number: number }[];
  devices: string[];
  canManage: boolean;
  onToggleDuty: (user: User) => void;
  onChangeDefaultBlock: (user: User, block: string) => void;
  onChangeCurrentBlock: (user: User, block: string) => void;
  onChangeShift: (user: User, shift: string) => void;
  onChangeDevice: (user: User, device: string) => void;
  onChangeSheet: (user: User, sheetId: string) => void;
  onRestoreDefault: (user: User) => void;
  onSwitchUser: (userId: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// - edição rápida na tabela: o <select> nativo guarda logo ao escolher
const FAST = 'px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-70 max-w-[9.5rem]';
const SHIFTS = Object.entries(SHIFT_KEYS);
const ACTION = 'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

export const DirectoryRow = ({ user, kind, blockTeams, sheetId, sheets, devices, canManage, onToggleDuty, onChangeDefaultBlock, onChangeCurrentBlock, onChangeShift, onChangeDevice, onChangeSheet, onRestoreDefault, onSwitchUser, onEdit, onDelete }: DirectoryRowProps) => {
  const { t } = useTranslation();
  const defaultBlock = getDefaultBlock(user, kind);
  const currentBlock = getDisplayBlock(user, kind);
  const defaultPalette = getTeamColorPalette(defaultBlock);
  const currentPalette = getTeamColorPalette(currentBlock);
  const onDuty = isOnDuty(user);
  const shift = user.shift || SHIFT.MORNING;

  const avatar = user.isExtra
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
    : isGovernanta(user)
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
              <JobTitleBadges user={user} className="text-[10px] font-bold px-1.5 rounded" />
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
          <select
            value={currentBlock}
            disabled={!canManage}
            onChange={event => onChangeCurrentBlock(user, event.target.value)}
            aria-label={t('directory.fastEdit.currentBlock')}
            title={t('directory.fastEdit.currentBlock')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${currentPalette.badge}`}
          >
            {blockTeams.map(team => <option key={team.id} value={team.block}>{team.block}</option>)}
          </select>
          {currentBlock !== defaultBlock && canManage && (
            <button onClick={() => onRestoreDefault(user)} className="p-1 rounded text-amber-600 hover:bg-amber-100/60" title={t('directory.movedTitle', { block: defaultBlock })} aria-label={t('directory.movedTitle', { block: defaultBlock })}>
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-3 px-3">
        <select value={shift} disabled={!canManage} onChange={event => onChangeShift(user, event.target.value)} aria-label={t('directory.fastEdit.shift')} title={t('directory.fastEdit.shift')} className={FAST}>
          {SHIFTS.map(([value, key]) => <option key={value} value={value}>{t(`directory.shiftShort.${key}`)}</option>)}
          {!SHIFT_KEYS[shift] && <option value={shift}>{shift}</option>}
        </select>
      </td>

      <td className="py-3 px-3">
        <select value={user.phoneDeviceId ?? ''} disabled={!canManage} onChange={event => onChangeDevice(user, event.target.value)} aria-label={t('directory.fastEdit.device')} title={t('directory.fastEdit.device')} className={`${FAST} font-mono`}>
          <option value="">{t('directory.noDevice')}</option>
          {devices.map(device => <option key={device} value={device}>{device}</option>)}
        </select>
      </td>

      <td className="py-3 px-3">
        {/* - a governanta responde por várias sheets: a sheet atribui-se na própria sheet (★) */}
        <select value={sheetId ?? ''} disabled={!canManage || isGovernanta(user)} title={isGovernanta(user) ? t('directory.governantaSheets') : undefined} onChange={event => onChangeSheet(user, event.target.value)} aria-label={t('directory.fastEdit.sheet')} className={`${FAST} text-blue-600 dark:text-blue-400`}>
          <option value="">{t('directory.noSheet')}</option>
          {sheets.map(sheet => <option key={sheet.id} value={sheet.id}>{t('sheet.number', { number: sheet.number })}</option>)}
        </select>
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
