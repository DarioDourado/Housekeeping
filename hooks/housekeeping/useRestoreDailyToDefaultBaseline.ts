import { useCallback } from 'react';
import { PlanKind } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRestoreDailyToDefaultBaseline = (kind: PlanKind = PlanKind.DAY) => {
  const run = useHousekeepingCommand('restoreDailyToDefaultBaseline');
  return useCallback(() => run({ kind }), [run, kind]);
};
