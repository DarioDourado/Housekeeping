import type { Room } from '../housekeeping.types';

export interface RoomDetailModalProps {
  room: Room;
  onClose: () => void;
  onOpenReproval: (room: Room) => void;
}
