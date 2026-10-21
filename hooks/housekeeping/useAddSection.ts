import { useCallback } from 'react';
import type { Section } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useAddSection = () => {
  const run = useHousekeepingCommand('addSection');
  return useCallback((section: Omit<Section, 'id'>) => run({ section }), [run]);
};
