import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, LogOut, MessageSquare, Moon, Server, Settings, Smartphone, Sun, Users } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePermission } from '@/hooks/auth/usePermission';
import { useTheme } from '@/hooks/theme/useTheme';
import { useOverlayStore } from '@/store/overlayStore';

const LINKS = [
  { to: ROUTES.PLANNING, label: 'nav.morningDistribution', end: true },
  { to: ROUTES.TURNDOWN, label: 'nav.turndownDistribution', end: false },
  { to: ROUTES.LIVE, label: 'nav.realtimeOverview', end: false },
  { to: ROUTES.AUDIT, label: 'nav.timeAudit', end: false }
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 dark:hover:text-white ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600' : ''}`;

const ghostButton = 'px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap';
const iconButton = 'p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const openPanel = useOverlayStore(state => state.openPanel);
  const canConfigure = usePermission('config.zones');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-5 py-2.5 w-full">
        <NavLink to={ROUTES.PLANNING} className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          <span>{t('app.hotelName')}</span>
          <span className="text-slate-400 font-normal">/</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">{t('app.productName')}</span>
        </NavLink>

        <nav aria-label={t('nav.main')} className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>{t(link.label)}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={() => openPanel('opera')} className={ghostButton} title={t('navbar.operaSyncTitle')} aria-label={t('navbar.operaSync')}>
              <Server className="w-3.5 h-3.5 text-blue-600" /><span className="hidden 2xl:inline">{t('navbar.operaSync')}</span>
            </button>
            <button onClick={() => openPanel('credits')} className={ghostButton} title={t('navbar.creditsTitle')} aria-label={t('navbar.credits')}>
              <Award className="w-3.5 h-3.5 text-purple-600" /><span className="hidden 2xl:inline">{t('navbar.credits')}</span>
            </button>
            <button onClick={() => openPanel('team')} className={ghostButton} title={t('navbar.teamManagerTitle')} aria-label={t('navbar.teamManager')}>
              <Users className="w-3.5 h-3.5 text-emerald-600" /><span className="hidden 2xl:inline">{t('navbar.teamManager')}</span>
            </button>
            <button onClick={() => openPanel('chat')} className={iconButton} title={t('navbar.chatTitle')} aria-label={t('navbar.chat')}>
              <MessageSquare className="w-4 h-4" />
            </button>
            {canConfigure && (
              <NavLink to={ROUTES.SETTINGS} className={iconButton} title={t('nav.settings')} aria-label={t('nav.settings')}>
                <Settings className="w-4 h-4" />
              </NavLink>
            )}
            <button onClick={toggleTheme} className={iconButton} title={t('navbar.themeTitle')} aria-label={t('navbar.theme')}>
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          <NavLink to={ROUTES.MOBILE} aria-label={t('mobile.servicePhone')} className={({ isActive }) => `px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'}`}>
            <Smartphone className="w-3.5 h-3.5" /><span className="hidden xl:inline">{t('mobile.servicePhone')}</span>
          </NavLink>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden xl:block text-right leading-tight">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">{user?.name}</span>
              <span className="block text-[11px] text-slate-500">{user && t(`roles.${user.role}`)}</span>
            </div>
            <button onClick={() => void logout()} className={iconButton} title={t('navbar.logout')} aria-label={t('navbar.logout')}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
