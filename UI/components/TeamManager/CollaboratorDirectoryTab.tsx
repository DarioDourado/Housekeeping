import { isGovernanta } from '@/lib/jobTitles';
import { isOnDuty } from '@/lib/staffDuty';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useAuth } from '@/hooks/auth/useAuth';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useAssignStaffToSheet, useBlockTeams, useBoard, useMoveStaffToBlock } from '@/hooks/housekeeping';
import { useAddStaff, useDeleteStaff, useEnsureOnDuty, useStaff, useUpdateStaff } from '@/hooks/staff';
import { areaOf, defaultOf, getDefaultBlock, withArea, withDefault } from '@/lib/staffBlock';
import type { User } from '@/types/auth.types';
import { PlanKind, SheetRole } from '@/types/housekeeping.types';
import { DirectoryFilters, type DirectoryFilterState } from './DirectoryFilters';
import { DirectoryRow } from './DirectoryRow';
import { DirectoryStats } from './DirectoryStats';
import { StaffFormModal } from './StaffFormModal';

const NO_FILTERS: DirectoryFilterState = { search: '', block: 'ALL', duty: 'ALL', role: 'ALL' };

// - Pessoal e escalas: quem está de serviço, bloco por defeito vs. bloco de hoje, dispositivo e task sheet do dia
export const CollaboratorDirectoryTab = ({ kind }: { kind: PlanKind }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { switchUser } = useAuth();
  const { data: users = [] } = useStaff();
  const { data: blockTeams = [] } = useBlockTeams(kind);
  const { columns } = useBoard(kind);
  const addUser = useAddStaff();
  const updateUser = useUpdateStaff();
  const deleteUser = useDeleteStaff();
  const ensureOnDuty = useEnsureOnDuty();
  const moveStaffToBlock = useMoveStaffToBlock(kind);
  const assignStaff = useAssignStaffToSheet();
  const canManage = usePermission('staff.assign');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editor, setEditor] = useState<{ user?: User | undefined } | null>(null);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return users.filter(user => {
      if (query && ![user.name, user.email, user.phoneDeviceId ?? '', user.notes ?? ''].some(text => text.toLowerCase().includes(query))) return false;
      if (filters.block !== 'ALL' && getDefaultBlock(user, kind) !== filters.block) return false;
      if (filters.duty === 'ON_DUTY' && !isOnDuty(user)) return false;
      if (filters.duty === 'OFF_DUTY' && isOnDuty(user)) return false;
      if (filters.role === 'EXTRA') return !!user.isExtra;
      if (filters.role === 'GOVERNANTA') return isGovernanta(user);
      return filters.role === 'ALL' || user.role === filters.role;
    });
  }, [users, filters, kind]);

  const sheetIdOf = (userId: string) => columns.find(column => column.assignees.some(a => a.user.id === userId))?.sheet.id;
  const sheets = columns.map(({ sheet }) => ({ id: sheet.id, number: sheet.number }));
  const devices = Array.from(new Set(users.flatMap(user => (user.phoneDeviceId ? [user.phoneDeviceId] : [])))).sort();

  // - um PDA só está com uma pessoa: escolher o de outra pessoa troca os dois
  const changeDevice = async (user: User, device: string) => {
    const holder = device ? users.find(other => other.id !== user.id && other.phoneDeviceId === device) : undefined;
    await updateUser({ ...user, phoneDeviceId: device || undefined });
    if (holder) await updateUser({ ...holder, phoneDeviceId: user.phoneDeviceId });
  };

  // - uma pessoa está numa task sheet do dia: escolher outra move-a (sai das restantes); vazio tira-a de todas
  const changeSheet = async (user: User, sheetId: string) => {
    if (sheetId && !(await ensureOnDuty(user))) return;
    for (const { sheet } of columns) {
      const isMember = sheet.assignments.some(a => a.staffId === user.id);
      if (isMember && sheet.id !== sheetId) await assignStaff(sheet.id, sheet.assignments.filter(a => a.staffId !== user.id));
    }
    const target = columns.find(column => column.sheet.id === sheetId)?.sheet;
    if (target && !target.assignments.some(a => a.staffId === user.id)) {
      await assignStaff(target.id, [...target.assignments, { staffId: user.id, role: SheetRole.MEMBER }]);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      title: t('directory.confirmDelete.title'),
      message: t('directory.confirmDelete.message', { name: user.name }),
      confirmLabel: t('directory.confirmDelete.confirm'),
      cancelLabel: t('actions.cancel')
    });
    if (confirmed) await deleteUser(user.id);
  };

  const save = async ({ id, ...rest }: Omit<User, 'id'> & { id?: string }) => {
    if (id) await updateUser({ ...rest, id });
    else await addUser(rest);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-3">
        <DirectoryStats users={users} />
        <DirectoryFilters value={filters} blockTeams={blockTeams} canAdd={canManage} onChange={setFilters} onAdd={() => setEditor({})} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold">
                {(['name', 'status', 'defaultBlock', 'currentBlock', 'shift', 'device', 'sheet', 'actions'] as const).map(column => (
                  <th key={column} className={`py-3 ${column === 'name' ? 'px-4' : 'px-3'} ${column === 'actions' ? 'text-right' : ''}`}>{t(`directory.columns.${column}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">{t('directory.empty')}</p>
                    <button onClick={() => setFilters(NO_FILTERS)} className="mt-2 text-blue-600 hover:underline text-xs">{t('directory.clearFilters')}</button>
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <DirectoryRow
                    key={user.id}
                    user={user}
                    kind={kind}
                    blockTeams={blockTeams}
                    sheetId={sheetIdOf(user.id)}
                    sheets={sheets}
                    devices={devices}
                    canManage={canManage}
                    onToggleDuty={target => updateUser({ ...target, isOnDuty: !isOnDuty(target) })}
                    onChangeDefaultBlock={(target, block) =>
                      updateUser(areaOf(target, kind) === defaultOf(target, kind) ? withArea(withDefault(target, kind, block), kind, block) : withDefault(target, kind, block))
                    }
                    onChangeCurrentBlock={(target, block) => moveStaffToBlock(target.id, block)}
                    onChangeShift={(target, shift) => updateUser({ ...target, shift })}
                    onChangeDevice={changeDevice}
                    onChangeSheet={changeSheet}
                    onRestoreDefault={target => updateUser(withArea(target, kind, getDefaultBlock(target, kind)))}
                    onSwitchUser={switchUser}
                    onEdit={target => setEditor({ user: target })}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editor && <StaffFormModal kind={kind} user={editor.user} blockTeams={blockTeams} onSave={save} onClose={() => setEditor(null)} />}
    </div>
  );
};
