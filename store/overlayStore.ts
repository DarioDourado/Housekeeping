import { create } from 'zustand';

export type OverlayPanel = 'opera' | 'credits' | 'staff' | 'team' | 'chat';

// - Modais e painéis abertos a partir de qualquer ecrã (cartões, navbar). Guardam só ids: os dados vêm das consultas.
interface OverlayState {
  detailTaskId: string | null;
  correctionTaskId: string | null;
  moveTaskId: string | null;
  panel: OverlayPanel | null;
  openDetail: (taskId: string) => void;
  openCorrection: (taskId: string) => void;
  openMove: (taskId: string) => void;
  openPanel: (panel: OverlayPanel) => void;
  closeDetail: () => void;
  closeCorrection: () => void;
  closeMove: () => void;
  closePanel: () => void;
}

export const useOverlayStore = create<OverlayState>(set => ({
  detailTaskId: null,
  correctionTaskId: null,
  moveTaskId: null,
  panel: null,
  openDetail: taskId => set({ detailTaskId: taskId }),
  openCorrection: taskId => set({ correctionTaskId: taskId, detailTaskId: null }),
  openMove: taskId => set({ moveTaskId: taskId }),
  openPanel: panel => set({ panel }),
  closeDetail: () => set({ detailTaskId: null }),
  closeCorrection: () => set({ correctionTaskId: null }),
  closeMove: () => set({ moveTaskId: null }),
  closePanel: () => set({ panel: null })
}));
