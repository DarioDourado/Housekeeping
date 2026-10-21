import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { BLOCK } from '@/config/constants';
import { UserRole, type User } from '@/types/auth.types';

const INPUT = 'w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';
const LABEL = 'block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1';

interface StaffFormProps {
  onSubmit: (user: Omit<User, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export const StaffForm = ({ onSubmit, onCancel }: StaffFormProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.HOUSEKEEPER);
  const [area, setArea] = useState<string>(BLOCK.A);
  const [isExtra, setIsExtra] = useState(false);
  const [phoneDevice, setPhoneDevice] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`,
      role,
      assignedArea: area,
      isExtra,
      phoneDeviceId: phoneDevice.trim() || undefined
    });
  };

  return (
    <form onSubmit={submit} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
      <h4 className="font-bold text-blue-900 dark:text-blue-300">{t('staff.newRecord')}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="staff-name" className={LABEL}>{t('staff.fullName')}</label>
          <input id="staff-name" type="text" required value={name} onChange={event => setName(event.target.value)} placeholder={t('staff.namePlaceholder')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="staff-role" className={LABEL}>{t('staff.role')}</label>
          <select id="staff-role" value={role} onChange={event => setRole(event.target.value as UserRole)} className={INPUT}>
            {Object.values(UserRole).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="staff-area" className={LABEL}>{t('staff.usualArea')}</label>
          <input id="staff-area" type="text" value={area} onChange={event => setArea(event.target.value)} placeholder={t('staff.areaPlaceholder')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="staff-device" className={LABEL}>{t('staff.device')}</label>
          <input id="staff-device" type="text" value={phoneDevice} onChange={event => setPhoneDevice(event.target.value)} placeholder={t('staff.devicePlaceholder')} className={INPUT} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="staff-extra" checked={isExtra} onChange={event => setIsExtra(event.target.checked)} />
        <label htmlFor="staff-extra" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">{t('staff.isExtra')}</label>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">{t('actions.cancel')}</button>
        <button type="submit" className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">{t('staff.save')}</button>
      </div>
    </form>
  );
};
