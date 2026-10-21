'use client';

import Link from 'next/link';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import { useTheme } from '../../../services/hooks/theme/useTheme';
import { UserRole } from '../../../types/auth.types';
import {
  Smartphone,
  Server,
  Award,
  Users,
  MessageSquare,
  Sun,
  Moon,
  RotateCcw,
  UserCheck
} from 'lucide-react';

export type ActiveNavTab = 'MORNING' | 'TURNDOWN' | 'LIVE' | 'AUDIT';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  isMobileSimulator: boolean;
  onToggleMobileSimulator: () => void;
  onOpenOperaModal: () => void;
  onOpenCreditsModal: () => void;
  onOpenStaffModal: () => void;
  onOpenTeamManager?: () => void;
  onOpenChat: () => void;
  onResetPreset: () => void;
}

export const Navbar = ({
  activeTab,
  onSelectTab,
  isMobileSimulator,
  onToggleMobileSimulator,
  onOpenOperaModal,
  onOpenCreditsModal,
  onOpenStaffModal,
  onOpenTeamManager,
  onOpenChat,
  onResetPreset
}: NavbarProps) => {
  const { user, users, switchUser } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-5 py-2.5 w-full max-w-none">
        
        {/* Zone 1: Single text element brand wordmark (Top Bar Contract Zone 1) */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Vila Vita Parc</span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Housekeeping OS</span>
          </Link>
        </div>

        {/* Zone 2: 4 clean single-line nav links (Top Bar Contract Zone 2) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onSelectTab('MORNING')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 ${
              activeTab === 'MORNING' && !isMobileSimulator
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600'
                : ''
            }`}
          >
            Distribuição Manhã
          </button>

          <button
            onClick={() => onSelectTab('TURNDOWN')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 ${
              activeTab === 'TURNDOWN' && !isMobileSimulator
                ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600'
                : ''
            }`}
          >
            Turndown (Noite)
          </button>

          <button
            onClick={() => onSelectTab('LIVE')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 ${
              activeTab === 'LIVE' && !isMobileSimulator
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600'
                : ''
            }`}
          >
            Quartos em Direto
          </button>

          <button
            onClick={() => onSelectTab('AUDIT')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white py-1 ${
              activeTab === 'AUDIT' && !isMobileSimulator
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600'
                : ''
            }`}
          >
            Auditoria de Tempos
          </button>
        </nav>

        {/* Zone 3: 1 primary action area (Top Bar Contract Zone 3) */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Quick utility icons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={onOpenOperaModal}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Sincronização bidirecional Opera Cloud OHIP & Night Audit"
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Opera OHIP</span>
            </button>

            <button
              onClick={onOpenCreditsModal}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Sistema de Créditos & Produtividade"
            >
              <Award className="w-3.5 h-3.5 text-purple-600" />
              <span>Créditos</span>
            </button>

            <button
              onClick={onOpenTeamManager || onOpenStaffModal}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Gestor de Equipas por Bloco com Drag & Drop"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Gestor de Equipas</span>
            </button>

            <button
              onClick={onOpenChat}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Abrir Chat & Fotos"
              aria-label="Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Alternar Tema Claro / Escuro"
              aria-label="Tema"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Quick role selector */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={user?.id || ''}
              onChange={e => switchUser(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate"
              title="Mudar Utilizador Atual"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Primary Action Button: Mobile Simulator Toggle */}
          <button
            onClick={onToggleMobileSimulator}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs ${
              isMobileSimulator
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMobileSimulator ? 'Voltar ao Escritório' : 'Telemóvel de Serviço'}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
