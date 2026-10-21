import { useCallback } from 'react';
import type { PlanKind } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useOpenPlan = () => {
  const run = useHousekeepingCommand('openPlan');
  return useCallback((kind: PlanKind, date?: string) => run({ kind, date }), [run]);
};
