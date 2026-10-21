import { useCallback } from 'react';
import type { NotPerformedReason } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRecordNotPerformed = () => {
  const run = useHousekeepingCommand('recordNotPerformed');
  return useCallback((taskId: string, reason: NotPerformedReason) => run({ taskId, reason }), [run]);
};
