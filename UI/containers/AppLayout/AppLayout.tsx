import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Overlays } from '@/UI/containers/Overlays';
import { ToastHost } from '@/UI/containers/ToastHost';
import { Navbar } from './Navbar';

export const AppLayout = () => {
  const { t } = useTranslation();
  return (
    <div className="h-dvh flex flex-col bg-canvas text-content">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-5 py-4">
        <Outlet />
      </main>
      <Overlays />
      <ToastHost />
    </div>
  );
};
