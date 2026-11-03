import { useTranslation } from 'react-i18next';
import type { User } from '@/types/auth.types';

// - Funções de quem é admin: governanta (sheets) e responsável de andares (blocos)
export const JobTitleBadges = ({ user, className }: { user: Pick<User, 'jobTitles'>; className: string }) => {
  const { t } = useTranslation();
  return (
    <>
      {(user.jobTitles ?? []).map(title => (
        <span key={title} className={`${className} bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300`}>{t(`jobTitles.${title}`)}</span>
      ))}
    </>
  );
};
