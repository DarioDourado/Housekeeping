import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useInspectTask = () => {
  const run = useHousekeepingCommand('inspectTask');
  return useCallback((taskId: string) => run({ taskId }), [run]);
};
