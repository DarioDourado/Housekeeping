import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useSyncWithOpera = () => {
  const run = useHousekeepingCommand('syncWithOpera');
  return useCallback((roomId?: string) => run({ roomId }), [run]);
};
