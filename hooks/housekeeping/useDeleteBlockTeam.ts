import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useDeleteBlockTeam = () => {
  const run = useHousekeepingCommand('deleteBlockTeam');
  return useCallback((teamId: string) => run({ teamId }), [run]);
};
