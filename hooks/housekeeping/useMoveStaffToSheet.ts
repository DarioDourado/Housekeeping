import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useMoveStaffToSheet = () => {
  const run = useHousekeepingCommand('moveStaffToSheet');
  return useCallback((staffId: string, toSheetId: string, fromSheetId?: string) => run({ staffId, toSheetId, fromSheetId }), [run]);
};
