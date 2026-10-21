import { useCallback } from 'react';
import type { BlockTeam } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useAddBlockTeam = () => {
  const run = useHousekeepingCommand('addBlockTeam');
  return useCallback((team: Omit<BlockTeam, 'id'>) => run({ team }), [run]);
};
