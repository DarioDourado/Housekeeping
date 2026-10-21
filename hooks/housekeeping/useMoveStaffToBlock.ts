import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useMoveStaffToBlock = () => {
  const run = useHousekeepingCommand('moveStaffToBlock');
  return useCallback((staffId: string, targetBlock: string) => run({ staffId, targetBlock }), [run]);
};
