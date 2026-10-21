import type { ActiveNavTab } from '../../UI/components/Header/Navbar';

export type HousekeepingLayoutMode = 'EXPANDED' | 'AUTO_FIT' | 'COMPACT';

export interface HousekeepingPageFilterState {
  block: string;
  layoutMode: HousekeepingLayoutMode;
  isMobileSimulator: boolean;
}

export interface HousekeepingPageUiState {
  activeTab: ActiveNavTab;
  isMobileSimulator: boolean;
  selectedBlockFilter: string;
  layoutMode: HousekeepingLayoutMode;
}

export interface HousekeepingPageModalState {
  detailRoomId: string | null;
  reprovalRoomId: string | null;
  movingRoomId: string | null;
  showOperaModal: boolean;
  showCreditsModal: boolean;
  showStaffModal: boolean;
  showTeamManagerModal: boolean;
  showChatDrawer: boolean;
}

export interface HousekeepingPageSummary {
  totalRooms: number;
  stayovers: number;
  departuresWithArrival: number;
  departuresOnly: number;
  refreshes: number;
  dirtyCount: number;
  cleanCount: number;
  inspectedCount: number;
}
