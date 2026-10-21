import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useAcknowledgeAlert = () => {
  const run = useHousekeepingCommand('acknowledgeAlert');
  return useCallback((alertId: string) => run({ alertId }), [run]);
};
