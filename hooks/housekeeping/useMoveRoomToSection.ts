import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useMoveRoomToSection = () => {
  const run = useHousekeepingCommand('moveRoomToSection');
  return useCallback((roomId: string, targetSectionId: string) => run({ roomId, targetSectionId }), [run]);
};
