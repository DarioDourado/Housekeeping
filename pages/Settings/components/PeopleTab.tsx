import { useTranslation } from 'react-i18next';
import { Users, UserCog } from 'lucide-react';
import { useOverlayStore } from '@/store/overlayStore';

// - Equipas e pessoal já têm o seu gestor próprio; aqui ficam só os atalhos (uma fonte de verdade por tarefa)
export const PeopleTab = () => {
  const { t } = useTranslation();
  const openPanel = useOverlayStore(state => state.openPanel);
  const cards = [
    { panel: 'team', icon: Users, title: 'settings.people.teamTitle', hint: 'settings.people.teamHint' },
    { panel: 'staff', icon: UserCog, title: 'settings.people.staffTitle', hint: 'settings.people.staffHint' }
  ] as const;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cards.map(({ panel, icon: Icon, title, hint }) => (
        <button
          key={panel}
          onClick={() => openPanel(panel)}
          className="text-left rounded-[16px] border border-line bg-surface p-6 space-y-2 transition-all duration-300 hover:border-primary active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/20"
        >
          <Icon className="w-5 h-5 text-primary" />
          <span className="block text-base font-semibold text-content">{t(title)}</span>
          <span className="block text-sm text-muted">{t(hint)}</span>
        </button>
      ))}
    </div>
  );
};
