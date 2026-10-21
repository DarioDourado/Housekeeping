import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useReopenRoom = () => {
  const run = useHousekeepingCommand('reopenRoom');
  return useCallback((roomId: string, reason?: string) => run({ roomId, reason }), [run]);
};
