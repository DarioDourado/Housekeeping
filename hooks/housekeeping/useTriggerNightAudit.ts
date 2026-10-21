import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useTriggerNightAudit = () => {
  const run = useHousekeepingCommand('triggerNightAudit');
  return useCallback(() => run(undefined), [run]);
};
