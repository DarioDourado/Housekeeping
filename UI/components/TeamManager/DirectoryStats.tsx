import { useTranslation } from 'react-i18next';
import { Sparkles, UserCheck, UserX, Users } from 'lucide-react';
import type { User } from '@/types/auth.types';

const CARD = 'p-3 rounded-xl border flex items-center justify-between shadow-2xs';

export const DirectoryStats = ({ users }: { users: User[] }) => {
  const { t } = useTranslation();
  const onDuty = users.filter(user => user.isOnDuty !== false).length;
  const offDuty = users.length - onDuty;
  const extras = users.filter(user => user.isExtra).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className={`${CARD} border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">{t('directory.metrics.total')}</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{users.length}</span>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"><Users className="w-5 h-5" /></div>
      </div>
      <div className={`${CARD} border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20`}>
        <div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">{t('directory.metrics.onDuty')}</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{onDuty}</span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"><UserCheck className="w-5 h-5" /></div>
      </div>
      <div className={`${CARD} border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40`}>
        <div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">{t('directory.metrics.offDuty')}</span>
          <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{offDuty}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"><UserX className="w-5 h-5" /></div>
      </div>
      <div className={`${CARD} border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20`}>
        <div>
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">{t('directory.metrics.extras')}</span>
          <span className="text-xl font-bold text-amber-800 dark:text-amber-300">{extras}</span>
        </div>
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"><Sparkles className="w-5 h-5" /></div>
      </div>
    </div>
  );
};
