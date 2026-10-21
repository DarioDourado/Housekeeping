import type { Room, TaskSheet } from '../housekeeping.types';
import type { User } from '../auth.types';

export type TaskSheetLayoutMode = 'PANORAMIC' | 'GRID' | 'FULL_FIT';

export interface TaskSheetColumnProps {
  sheet: TaskSheet;
  allSheets: TaskSheet[];
  roomsInSheet: Room[];
  allStaff: User[];
  onOpenDetail: (room: Room) => void;
  onOpenReproval: (room: Room) => void;
  onMoveRoomPrompt: (room: Room) => void;
  layoutMode?: TaskSheetLayoutMode;
}
