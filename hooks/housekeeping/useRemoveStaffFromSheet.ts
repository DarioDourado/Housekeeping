import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRemoveStaffFromSheet = () => {
  const run = useHousekeepingCommand('removeStaffFromSheet');
  return useCallback((staffId: string, sheetId: string) => run({ staffId, sheetId }), [run]);
};
