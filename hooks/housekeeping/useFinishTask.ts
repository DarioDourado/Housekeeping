import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useFinishTask = () => {
  const run = useHousekeepingCommand('finishTask');
  return useCallback((taskId: string, executorIds?: string[]) => run({ taskId, executorIds }), [run]);
};
