import { useTranslation } from 'react-i18next';

interface ErrorFallbackProps {
  onReset: () => void;
}

export const ErrorFallback = ({ onReset }: ErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-content">{t('errors.title')}</h1>
      <p className="text-sm text-muted">{t('errors.generic')}</p>
      <button
        onClick={onReset}
        className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium"
      >
        {t('errors.retry')}
      </button>
    </div>
  );
};
