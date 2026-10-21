import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Inbox } from 'lucide-react';

// - Os 4 estados obrigatórios de uma página (12-loading-states): loading, erro, vazio e sucesso (o conteúdo normal)

export const PageLoading = ({ label }: { label?: string }) => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-muted">{label ?? t('states.loading')}</p>
      </div>
    </div>
  );
};

export const PageError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-danger" />
      </div>
      <h2 className="text-lg font-semibold text-content">{t('states.errorTitle')}</h2>
      <p className="text-sm text-muted max-w-sm">{t('states.errorHint')}</p>
      <button onClick={onRetry} className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium">
        {t('errors.retry')}
      </button>
    </div>
  );
};

interface PageEmptyProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageEmpty = ({ title, description, action }: PageEmptyProps) => (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
    <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
      <Inbox className="h-7 w-7 text-muted" />
    </div>
    <h2 className="text-lg font-semibold text-content">{title}</h2>
    {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
    {action}
  </div>
);
