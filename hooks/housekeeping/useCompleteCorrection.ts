import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useCompleteCorrection = () => {
  const run = useHousekeepingCommand('completeCorrection');
  return useCallback((taskId: string, executorIds?: string[]) => run({ taskId, executorIds }), [run]);
};
