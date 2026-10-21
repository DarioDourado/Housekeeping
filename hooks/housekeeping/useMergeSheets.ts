import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useMergeSheets = () => {
  const run = useHousekeepingCommand('mergeSheets');
  return useCallback((sourceSheetId: string, targetSheetId: string) => run({ sourceSheetId, targetSheetId }), [run]);
};
