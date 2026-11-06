import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Menu, MessageSquare, Moon, Server, Settings, Sun, Users, X } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { usePermission } from '@/hooks/auth/usePermission';
import { useTheme } from '@/hooks/theme/useTheme';
import { useOverlayStore, type OverlayPanel } from '@/store/overlayStore';

export const NAV_LINKS = [
  { to: ROUTES.PLANNING, label: 'nav.morningDistribution', end: true },
  { to: ROUTES.TURNDOWN, label: 'nav.turndownDistribution', end: false },
  { to: ROUTES.LIVE, label: 'nav.realtimeOverview', end: false },
  { to: ROUTES.AUDIT, label: 'nav.timeAudit', end: false }
] as const;

const ITEM = 'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
const linkClass = ({ isActive }: { isActive: boolean }) => `${ITEM} ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`;

const PANELS: { panel: OverlayPanel; label: string; icon: typeof Server }[] = [
  { panel: 'opera', label: 'navbar.operaSync', icon: Server },
  { panel: 'credits', label: 'navbar.credits', icon: Award },
  { panel: 'team', label: 'navbar.teamManager', icon: Users },
  { panel: 'chat', label: 'navbar.chat', icon: MessageSquare }
];

// - Navegação abaixo de lg: as ligações principais e, abaixo de sm, também as ações que a barra esconde (padrão disclosure, não modal)
export const NavMenu = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const openPanel = useOverlayStore(state => state.openPanel);
  const canConfigure = usePermission('config.zones');
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  const close = () => setOpen(false);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    close();
    toggleRef.current?.focus();
  };

  return (
    <div className="lg:hidden" onKeyDown={onKeyDown}>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls="nav-menu"
        aria-label={t('nav.menu')}
        className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && (
        <nav id="nav-menu" aria-label={t('nav.main')} className="absolute inset-x-0 top-full z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={close} className={linkClass}>{t(link.label)}</NavLink>
          ))}
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800">
            {PANELS.map(({ panel, label, icon: Icon }) => (
              <button key={panel} type="button" onClick={() => { openPanel(panel); close(); }} className={ITEM}><Icon className="w-4 h-4" />{t(label)}</button>
            ))}
            {canConfigure && <NavLink to={ROUTES.SETTINGS} onClick={close} className={linkClass}><Settings className="w-4 h-4" />{t('nav.settings')}</NavLink>}
            <button type="button" onClick={toggleTheme} className={ITEM}>
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{t('navbar.theme')}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
