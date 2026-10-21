import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, UserPlus } from 'lucide-react';
import { BLOCK, SHIFT } from '@/config/constants';
import { getDefaultBlock } from '@/lib/staffBlock';
import { UserRole, type User } from '@/types/auth.types';
import type { BlockTeam } from '@/types/housekeeping.types';
import { Modal } from '@/UI/components/Modal';

const INPUT = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';
const LABEL = 'block font-semibold text-slate-700 dark:text-slate-300 mb-1';
const SHIFTS = [[SHIFT.MORNING, 'morning'], [SHIFT.AFTERNOON, 'afternoon'], [SHIFT.TURNDOWN, 'turndown'], [SHIFT.GENERAL, 'general']] as const;

interface FormState {
  name: string;
  email: string;
  role: UserRole;
  defaultBlock: string;
  assignedArea: string;
  isOnDuty: boolean;
  shift: string;
  phoneDeviceId: string;
  isExtra: boolean;
  notes: string;
}

interface StaffFormModalProps {
  user?: User;
  blockTeams: BlockTeam[];
  onSave: (user: Omit<User, 'id'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

const initialState = (user?: User): FormState => {
  const defaultBlock = user ? getDefaultBlock(user) : BLOCK.A;
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? UserRole.HOUSEKEEPER,
    defaultBlock,
    assignedArea: user?.assignedArea || defaultBlock,
    isOnDuty: user ? user.isOnDuty !== false : true,
    shift: user?.shift || SHIFT.MORNING,
    phoneDeviceId: user?.phoneDeviceId ?? '',
    isExtra: !!user?.isExtra,
    notes: user?.notes ?? ''
  };
};

// - Criar ou editar um colaborador (a mesma ficha serve para os dois)
export const StaffFormModal = ({ user, blockTeams, onSave, onClose }: StaffFormModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() => initialState(user));
  const set = (patch: Partial<FormState>) => setForm(current => ({ ...current, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await onSave({
      ...user,
      name: form.name.trim(),
      email: form.email.trim() || user?.email || `${form.name.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`,
      role: form.role,
      defaultBlock: form.defaultBlock,
      assignedArea: user ? form.assignedArea || form.defaultBlock : form.defaultBlock,
      isOnDuty: form.isOnDuty,
      shift: form.shift,
      phoneDeviceId: form.phoneDeviceId.trim(),
      isExtra: form.isExtra,
      notes: form.notes.trim()
    });
    onClose();
  };

  return (
    <Modal
      title={user ? t('directory.form.editTitle') : t('directory.form.addTitle')}
      subtitle={t('directory.form.subtitle')}
      icon={user ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <form onSubmit={submit} className="p-6 space-y-3.5 text-xs">
        <div>
          <label htmlFor="staff-form-name" className={LABEL}>{t('directory.form.name')}</label>
          <input id="staff-form-name" type="text" required value={form.name} onChange={event => set({ name: event.target.value })} placeholder={t('directory.form.namePlaceholder')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="staff-form-email" className={LABEL}>{t('directory.form.email')}</label>
          <input id="staff-form-email" type="email" value={form.email} onChange={event => set({ email: event.target.value })} placeholder={t('directory.form.emailPlaceholder')} className={INPUT} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="staff-form-role" className={LABEL}>{t('directory.form.role')}</label>
            <select id="staff-form-role" value={form.role} onChange={event => set({ role: event.target.value as UserRole })} className={INPUT}>
              {Object.values(UserRole).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="staff-form-block" className={LABEL}>{t('directory.form.defaultBlock')}</label>
            <select id="staff-form-block" value={form.defaultBlock} onChange={event => set({ defaultBlock: event.target.value, assignedArea: event.target.value })} className={`${INPUT} font-bold`}>
              {blockTeams.map(team => <option key={team.id} value={team.block}>{team.block}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="staff-form-shift" className={LABEL}>{t('directory.form.shift')}</label>
            <select id="staff-form-shift" value={form.shift} onChange={event => set({ shift: event.target.value })} className={INPUT}>
              {SHIFTS.map(([value, key]) => <option key={value} value={value}>{t(`directory.form.shifts.${key}`)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="staff-form-device" className={LABEL}>{t('directory.form.device')}</label>
            <input id="staff-form-device" type="text" value={form.phoneDeviceId} onChange={event => set({ phoneDeviceId: event.target.value })} placeholder={t('directory.form.devicePlaceholder')} className={`${INPUT} font-mono`} />
          </div>
        </div>
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">{t('directory.form.onDutyToday')}</span>
              <span className="text-[11px] text-slate-400 block">{t('directory.form.onDutyHint')}</span>
            </div>
            <input type="checkbox" checked={form.isOnDuty} onChange={event => set({ isOnDuty: event.target.checked })} />
          </label>
          <div className="h-px bg-slate-200 dark:bg-slate-700/60" />
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">{t('directory.form.extra')}</span>
              <span className="text-[11px] text-slate-400 block">{t('directory.form.extraHint')}</span>
            </div>
            <input type="checkbox" checked={form.isExtra} onChange={event => set({ isExtra: event.target.checked })} />
          </label>
        </div>
        <div>
          <label htmlFor="staff-form-notes" className={LABEL}>{t('directory.form.notes')}</label>
          <input id="staff-form-notes" type="text" value={form.notes} onChange={event => set({ notes: event.target.value })} placeholder={t('directory.form.notesPlaceholder')} className={INPUT} />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{t('actions.cancel')}</button>
          <button type="submit" className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
            {user ? t('actions.save') : t('directory.form.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
