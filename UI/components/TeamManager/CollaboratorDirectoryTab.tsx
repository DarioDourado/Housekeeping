import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useAuth } from '@/hooks/auth/useAuth';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useBlockTeams, useBoard } from '@/hooks/housekeeping';
import { useAddStaff, useDeleteStaff, useStaff, useUpdateStaff } from '@/hooks/staff';
import { getDefaultBlock } from '@/lib/staffBlock';
import type { User } from '@/types/auth.types';
import { PlanKind } from '@/types/housekeeping.types';
import { DirectoryFilters, type DirectoryFilterState } from './DirectoryFilters';
import { DirectoryRow } from './DirectoryRow';
import { DirectoryStats } from './DirectoryStats';
import { StaffFormModal } from './StaffFormModal';

const NO_FILTERS: DirectoryFilterState = { search: '', block: 'ALL', duty: 'ALL', role: 'ALL' };

// - Pessoal e escalas: quem está de serviço, bloco por defeito vs. bloco de hoje, dispositivo e task sheet do dia
export const CollaboratorDirectoryTab = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { switchUser } = useAuth();
  const { data: users = [] } = useStaff();
  const { data: blockTeams = [] } = useBlockTeams();
  const { columns } = useBoard(PlanKind.DAY);
  const addUser = useAddStaff();
  const updateUser = useUpdateStaff();
  const deleteUser = useDeleteStaff();
  const canManage = usePermission('staff.assign');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editor, setEditor] = useState<{ user?: User | undefined } | null>(null);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return users.filter(user => {
      if (query && ![user.name, user.email, user.phoneDeviceId ?? '', user.notes ?? ''].some(text => text.toLowerCase().includes(query))) return false;
      if (filters.block !== 'ALL' && getDefaultBlock(user) !== filters.block) return false;
      if (filters.duty === 'ON_DUTY' && user.isOnDuty === false) return false;
      if (filters.duty === 'OFF_DUTY' && user.isOnDuty !== false) return false;
      if (filters.role === 'EXTRA') return !!user.isExtra;
      return filters.role === 'ALL' || user.role === filters.role;
    });
  }, [users, filters]);

  const sheetNumberOf = (userId: string) => columns.find(column => column.assignees.some(a => a.user.id === userId))?.sheet.number;

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
                    blockTeams={blockTeams}
                    sheetNumber={sheetNumberOf(user.id)}
                    canManage={canManage}
                    onToggleDuty={target => updateUser({ ...target, isOnDuty: target.isOnDuty === false })}
                    onChangeDefaultBlock={(target, block) =>
                      updateUser({ ...target, defaultBlock: block, assignedArea: target.assignedArea === target.defaultBlock ? block : target.assignedArea })
                    }
                    onRestoreDefault={target => updateUser({ ...target, assignedArea: getDefaultBlock(target) })}
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

      {editor && <StaffFormModal user={editor.user} blockTeams={blockTeams} onSave={save} onClose={() => setEditor(null)} />}
    </div>
  );
};
