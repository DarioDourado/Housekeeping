import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useSendTraceAlert = () => {
  const run = useHousekeepingCommand('sendTraceAlert');
  return useCallback((roomId: string, message: string) => run({ roomId, message }), [run]);
};
