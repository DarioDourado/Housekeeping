import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useUpdateSheet = () => {
  const run = useHousekeepingCommand('updateSheet');
  return useCallback((sheetId: string, title: string, block: string) => run({ sheetId, title, block }), [run]);
};
