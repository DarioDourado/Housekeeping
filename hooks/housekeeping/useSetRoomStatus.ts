import { useCallback } from 'react';
import type { RoomStatus } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useSetRoomStatus = () => {
  const run = useHousekeepingCommand('setRoomStatus');
  return useCallback((roomId: string, status: RoomStatus) => run({ roomId, status }), [run]);
};
