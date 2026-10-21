import type { Room } from '../housekeeping.types';

export interface InspectionReprovalModalProps {
  room: Room;
  onClose: () => void;
}
