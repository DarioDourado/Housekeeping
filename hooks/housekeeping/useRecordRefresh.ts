import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRecordRefresh = () => {
  const run = useHousekeepingCommand('recordRefresh');
  return useCallback((roomId: string) => run({ roomId }), [run]);
};
