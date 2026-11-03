import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useSetSheetLead = () => {
  const run = useHousekeepingCommand('setSheetLead');
  return useCallback((sheetId: string, staffId: string) => run({ sheetId, staffId }), [run]);
};
