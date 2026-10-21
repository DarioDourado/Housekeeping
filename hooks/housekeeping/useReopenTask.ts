import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useReopenTask = () => {
  const run = useHousekeepingCommand('reopenTask');
  return useCallback((taskId: string) => run({ taskId }), [run]);
};
