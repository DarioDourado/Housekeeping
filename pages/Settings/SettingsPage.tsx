import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/auth/usePermission';
import { PageEmpty } from '@/UI/components/feedback/PageStates';
import { PeopleTab } from './components/PeopleTab';
import { RoomsTab } from './components/RoomsTab';
import { SectionsTab } from './components/SectionsTab';

const TABS = ['sections', 'rooms', 'people'] as const;
type Tab = (typeof TABS)[number];

// - Configuração base (permanente). Alterações aqui não mexem em planos já abertos (§6.1).
export const SettingsPage = () => {
  const { t } = useTranslation();
  const allowed = usePermission('config.zones');
  const [tab, setTab] = useState<Tab>('sections');

  if (!allowed) return <PageEmpty title={t('settings.forbiddenTitle')} description={t('settings.forbiddenHint')} />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.subtitle')}</p>
      </header>

      <div role="tablist" aria-label={t('settings.title')} className="flex gap-1 border-b border-line">
        {TABS.map(id => (
          <button
            key={id}
            role="tab"
            id={`settings-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`settings-panel-${id}`}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-content'}`}
          >
            {t(`settings.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`settings-panel-${tab}`} aria-labelledby={`settings-tab-${tab}`}>
        {tab === 'sections' && <SectionsTab />}
        {tab === 'rooms' && <RoomsTab />}
        {tab === 'people' && <PeopleTab />}
      </div>
    </div>
  );
};
