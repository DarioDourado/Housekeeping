import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRetryOperaJob = () => {
  const run = useHousekeepingCommand('retryOperaJob');
  return useCallback((jobId: string) => run({ jobId }), [run]);
};
