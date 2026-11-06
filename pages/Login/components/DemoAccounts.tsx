import { useTranslation } from 'react-i18next';
import type { User } from '@/types/auth.types';

interface DemoAccountsProps {
  users: User[];
  onPick: (user: User) => void;
}

// - Só em demonstração (dados locais): atalhos para entrar com cada perfil. Desaparece quando o login for contra o BE.
export const DemoAccounts = ({ users, onPick }: DemoAccountsProps) => {
  const { t } = useTranslation();
  if (users.length === 0) return null;

  return (
    <section aria-label={t('login.demoTitle')} className="space-y-2 pt-4 border-t border-line">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t('login.demoTitle')}</h3>
      <ul className="flex flex-wrap gap-2">
        {users.map(user => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => onPick(user)}
              className="rounded-[12px] border border-line bg-surface px-3 py-1.5 text-xs text-content transition-all duration-300 hover:border-primary active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              {user.name} · {t(`roles.${user.role}`)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
