import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useAddSheet = () => {
  const run = useHousekeepingCommand('addSheet');
  return useCallback((planId: string, title: string, block: string, leadId?: string) => run({ planId, title, block, leadId }), [run]);
};
