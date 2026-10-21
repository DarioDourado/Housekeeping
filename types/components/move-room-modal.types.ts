import type { Room, TaskSheet } from '../housekeeping.types';

export interface MoveRoomModalProps {
  room: Room;
  sheets: TaskSheet[];
  onClose: () => void;
}
