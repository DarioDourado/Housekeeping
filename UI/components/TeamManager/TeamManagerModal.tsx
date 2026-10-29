import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Scale, UserPlus, Users } from 'lucide-react';
import { BLOCK } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePermission } from '@/hooks/auth/usePermission';
import { useAutoBalance } from '@/hooks/housekeeping/useAutoBalance';
import { useStaff } from '@/hooks/staff';
import { Modal } from '@/UI/components/Modal';
import { AddMemberModal } from './AddMemberModal';
import { CollaboratorDirectoryTab } from './CollaboratorDirectoryTab';
import { TeamBoardTab } from './TeamBoardTab';

type Tab = 'BOARD' | 'DIRECTORY';

export const TeamManagerModal = ({ onClose, initialTab = 'BOARD' }: { onClose: () => void; initialTab?: Tab }) => {
  const { t } = useTranslation();
  const { switchUser } = useAuth();
  const { data: users = [] } = useStaff();
  const autoBalance = useAutoBalance();
  const canManage = usePermission('staff.assign');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [addBlock, setAddBlock] = useState<string | null>(null);

  const tabClass = (active: boolean) =>
    `px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${active ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`;

  const header = (
    <div className="flex items-center gap-3">
      <div role="tablist" className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
        <button role="tab" aria-selected={tab === 'BOARD'} onClick={() => setTab('BOARD')} className={tabClass(tab === 'BOARD')}>
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{t('team.tabBoard')}</span>
        </button>
        <button role="tab" aria-selected={tab === 'DIRECTORY'} onClick={() => setTab('DIRECTORY')} className={tabClass(tab === 'DIRECTORY')}>
          <Users className="w-3.5 h-3.5" />
          <span>{t('team.tabDirectory')}</span>
          <span className="px-1.5 rounded-full text-[10px] font-bold bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{users.length}</span>
        </button>
      </div>
      {canManage && tab === 'BOARD' && (
        <button onClick={autoBalance} className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 flex items-center gap-1.5" title={t('team.balanceTitle')}>
          <Scale className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('team.balance')}</span>
        </button>
      )}
      {canManage && (
        <button onClick={() => setAddBlock(BLOCK.A)} className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('team.newMember')}</span>
        </button>
      )}
    </div>
  );

  return (
    <Modal
      title={t('team.title')}
      subtitle={tab === 'BOARD' ? t('team.subtitleBoard') : t('team.subtitleDirectory')}
      icon={<Users className="w-6 h-6" />}
      fullscreen
      headerExtra={header}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('team.syncNote')}</span>
          </div>
          <button onClick={onClose} className="px-5 py-2 font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl shadow-xs">{t('team.finish')}</button>
        </div>
      }
    >
      {tab === 'BOARD' ? <TeamBoardTab onAdd={setAddBlock} onSwitchUser={switchUser} /> : <CollaboratorDirectoryTab />}
      {addBlock && <AddMemberModal defaultBlock={addBlock} onClose={() => setAddBlock(null)} />}
    </Modal>
  );
};
