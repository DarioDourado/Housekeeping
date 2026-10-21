import { useCallback } from 'react';
import type { Section } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useUpdateSection = () => {
  const run = useHousekeepingCommand('updateSection');
  return useCallback((section: Section) => run({ section }), [run]);
};
