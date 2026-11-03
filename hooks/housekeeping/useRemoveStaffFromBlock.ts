import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRemoveStaffFromBlock = () => {
  const run = useHousekeepingCommand('removeStaffFromBlock');
  return useCallback((staffId: string) => run({ staffId }), [run]);
};
