import { useCallback } from 'react';
import { PlanKind } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useRemoveStaffFromBlock = (kind: PlanKind = PlanKind.DAY) => {
  const run = useHousekeepingCommand('removeStaffFromBlock');
  return useCallback((staffId: string) => run({ staffId, kind }), [run, kind]);
};
