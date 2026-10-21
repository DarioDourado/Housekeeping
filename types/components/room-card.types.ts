import type { Room } from '../housekeeping.types';

export interface RoomCardProps {
  room: Room;
  onOpenDetail: (room: Room) => void;
  onOpenReproval: (room: Room) => void;
  onMoveRoom?: (room: Room) => void;
  compact?: boolean;
}
