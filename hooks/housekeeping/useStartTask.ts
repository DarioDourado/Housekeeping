import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useStartTask = () => {
  const run = useHousekeepingCommand('startTask');
  return useCallback((taskId: string, executorIds?: string[]) => run({ taskId, executorIds }), [run]);
};
