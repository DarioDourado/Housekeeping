import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useTogglePriority = () => {
  const run = useHousekeepingCommand('togglePriority');
  return useCallback((taskId: string, reason?: string) => run({ taskId, reason }), [run]);
};
