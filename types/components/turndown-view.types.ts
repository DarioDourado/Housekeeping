import type { Room } from '../housekeeping.types';

export interface TurndownViewProps {
  onOpenDetail: (room: Room) => void;
}
