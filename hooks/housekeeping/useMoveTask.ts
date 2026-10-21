import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useMoveTask = () => {
  const run = useHousekeepingCommand('moveTask');
  return useCallback((taskId: string, targetSheetId: string, targetIndex?: number) => run({ taskId, targetSheetId, targetIndex }), [run]);
};
