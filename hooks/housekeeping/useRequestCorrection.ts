import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRequestCorrection = () => {
  const run = useHousekeepingCommand('requestCorrection');
  return useCallback((taskId: string, note: string) => run({ taskId, note }), [run]);
};
