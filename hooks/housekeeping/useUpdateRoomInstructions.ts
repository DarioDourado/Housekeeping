import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useUpdateRoomInstructions = () => {
  const run = useHousekeepingCommand('updateRoomInstructions');
  return useCallback((roomId: string, instructions: string) => run({ roomId, instructions }), [run]);
};
