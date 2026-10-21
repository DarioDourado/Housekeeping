import type { User } from '../auth.types';

export type ActiveNavTab = 'MORNING' | 'TURNDOWN' | 'LIVE' | 'AUDIT';

export interface NavbarProps {
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

export interface NavbarUserSelectorState {
  userId: string;
  users: User[];
}
