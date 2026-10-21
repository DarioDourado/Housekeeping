import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { useBlockTeams } from '@/hooks/housekeeping';
import { useAddStaff } from '@/hooks/staff';
import { UserRole } from '@/types/auth.types';
import { Modal } from '@/UI/components/Modal';

const INPUT = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';
const LABEL = 'block font-semibold text-slate-700 dark:text-slate-300 mb-1';

interface AddMemberModalProps {
  defaultBlock: string;
  onClose: () => void;
}

export const AddMemberModal = ({ defaultBlock, onClose }: AddMemberModalProps) => {
  const { t } = useTranslation();
  const { data: blockTeams = [] } = useBlockTeams();
  const addUser = useAddStaff();
  const [name, setName] = useState('');
  const [block, setBlock] = useState(defaultBlock);
  const [role, setRole] = useState<UserRole>(UserRole.HOUSEKEEPER);
  const [phoneDevice, setPhoneDevice] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await addUser({
      name: name.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`,
      role,
      assignedArea: block,
      defaultBlock: block,
      isOnDuty,
      isExtra,
      phoneDeviceId: phoneDevice.trim() || undefined
    });
    onClose();
  };

  return (
    <Modal title={t('team.addTitle', { block })} icon={<UserPlus className="w-4 h-4" />} maxWidth="max-w-md" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-3.5 text-xs">
        <div>
          <label htmlFor="member-name" className={LABEL}>{t('team.nameLabel')}</label>
          <input id="member-name" type="text" required value={name} onChange={event => setName(event.target.value)} placeholder={t('team.namePlaceholder')} className={INPUT} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="member-block" className={LABEL}>{t('team.blockTeam')}</label>
            <select id="member-block" value={block} onChange={event => setBlock(event.target.value)} className={INPUT}>
              {blockTeams.map(team => <option key={team.id} value={team.block}>{team.block}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="member-role" className={LABEL}>{t('team.roleLabel')}</label>
            <select id="member-role" value={role} onChange={event => setRole(event.target.value as UserRole)} className={INPUT}>
              {[UserRole.HOUSEKEEPER, UserRole.SUPERVISOR, UserRole.ADMIN].map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="member-device" className={LABEL}>{t('team.deviceLabel')}</label>
          <input id="member-device" type="text" value={phoneDevice} onChange={event => setPhoneDevice(event.target.value)} placeholder={t('team.devicePlaceholder')} className={INPUT} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="member-extra" checked={isExtra} onChange={event => setIsExtra(event.target.checked)} />
          <label htmlFor="member-extra" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">{t('team.isExtra')}</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="member-duty" checked={isOnDuty} onChange={event => setIsOnDuty(event.target.checked)} />
          <label htmlFor="member-duty" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">{t('team.onDuty')}</label>
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">{t('actions.cancel')}</button>
          <button type="submit" className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs">{t('team.register')}</button>
        </div>
      </form>
    </Modal>
  );
};
