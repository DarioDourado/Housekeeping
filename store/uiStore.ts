import { create } from 'zustand';
import type { LocalizedText } from '@/types/housekeeping.types';

// - Estado de CLIENTE partilhado entre componentes distantes (arrastar e toast). Dados do servidor ficam no React Query.
interface UiToast {
  message: LocalizedText;
  timestamp: number;
}

interface UiState {
  draggingTaskId: string | null;
  draggingStaffId: string | null;
  toast: UiToast | null;
  setDraggingTaskId: (id: string | null) => void;
  setDraggingStaffId: (id: string | null) => void;
  showToast: (message: LocalizedText) => void;
  dismissToast: () => void;
}

export const useUiStore = create<UiState>(set => ({
  draggingTaskId: null,
  draggingStaffId: null,
  toast: null,
  setDraggingTaskId: id => set({ draggingTaskId: id }),
  setDraggingStaffId: id => set({ draggingStaffId: id }),
  showToast: message => set({ toast: { message, timestamp: Date.now() } }),
  dismissToast: () => set({ toast: null })
}));
