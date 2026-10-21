import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useStaff } from '@/hooks/staff';

// - Telemóvel partilhado: a responsável escolhe quem está a operar o dispositivo hoje (§5.4)
export const MobilePhoneLogin = ({ onDone }: { onDone: () => void }) => {
  const { t } = useTranslation();
  const { user, switchUser } = useAuth();
  const { data: users = [] } = useStaff();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
        <span className="font-bold block mb-1">{t('mobile.loginTitle')}</span>
        <p>{t('mobile.loginHint')}</p>
      </div>
      <div className="space-y-1.5">
        {users.map(person => (
          <button
            key={person.id}
            onClick={async () => { await switchUser(person.id); onDone(); }}
            aria-pressed={user?.id === person.id}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between min-h-[48px] ${
              user?.id === person.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="font-bold text-sm block">{person.name}</span>
              <span className={`text-xs ${user?.id === person.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {person.assignedArea || t('mobile.generalArea')} · {t(`roles.${person.role}`)}
              </span>
            </div>
            {user?.id === person.id && <CheckCircle2 className="w-5 h-5 text-white" />}
          </button>
        ))}
      </div>
    </div>
  );
};
