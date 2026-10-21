import type { Room } from '../housekeeping.types';

export interface MobileViewProps {
  onOpenDetail: (room: Room) => void;
  onOpenReproval: (room: Room) => void;
  onOpenChat: () => void;
}
