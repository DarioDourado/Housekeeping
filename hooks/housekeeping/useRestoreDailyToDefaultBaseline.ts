import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRestoreDailyToDefaultBaseline = () => {
  const run = useHousekeepingCommand('restoreDailyToDefaultBaseline');
  return useCallback(() => run(undefined), [run]);
};
