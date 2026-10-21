import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, Trash2, UserPlus, Users } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useAuth } from '@/hooks/auth/useAuth';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useAddStaff, useDeleteStaff, useStaff } from '@/hooks/staff';
import type { User } from '@/types/auth.types';
import { Modal } from '@/UI/components/Modal';
import { StaffForm } from './StaffForm';

export const StaffManagerModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { switchUser } = useAuth();
  const { data: users = [] } = useStaff();
  const addUser = useAddStaff();
  const deleteUser = useDeleteStaff();
  const canManage = usePermission('staff.assign');
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (person: User) => {
    const confirmed = await confirm({
      title: t('staff.confirmDelete.title'),
      message: t('staff.confirmDelete.message', { name: person.name }),
      confirmLabel: t('staff.confirmDelete.confirm'),
      cancelLabel: t('actions.cancel')
    });
    if (confirmed) await deleteUser(person.id);
  };

  return (
    <Modal
      title={t('staff.title')}
      subtitle={t('staff.subtitle')}
      icon={<Users className="w-5 h-5" />}
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-lg hover:bg-slate-800">{t('staff.done')}</button>
        </div>
      }
    >
      <div className="p-6 space-y-4 text-xs">
        {canManage && (showForm ? (
          <StaffForm onCancel={() => setShowForm(false)} onSubmit={async user => { await addUser(user); setShowForm(false); }} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 px-3 border border-dashed border-blue-300 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('staff.add')}</span>
          </button>
        ))}

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {users.map(person => (
            <div key={person.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                  {person.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{person.name}</span>
                    {person.isExtra && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">{t('staff.extraBadge')}</span>}
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t(`roles.${person.role}`)}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                    <span>{t('staff.area', { area: person.assignedArea || t('staff.generalArea') })}</span>
                    {person.phoneDeviceId && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Smartphone className="w-3 h-3" />{person.phoneDeviceId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => switchUser(person.id)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 border border-blue-200 dark:border-blue-900"
                  title={t('staff.takeProfileTitle')}
                >
                  {t('staff.takeProfile')}
                </button>
                {canManage && (
                  <button onClick={() => handleDelete(person)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded" title={t('staff.remove')} aria-label={t('staff.remove')}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
