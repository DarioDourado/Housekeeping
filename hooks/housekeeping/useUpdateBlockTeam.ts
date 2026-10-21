import { useCallback } from 'react';
import type { BlockTeam } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useUpdateBlockTeam = () => {
  const run = useHousekeepingCommand('updateBlockTeam');
  return useCallback((team: BlockTeam) => run({ team }), [run]);
};
