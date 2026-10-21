import { useCallback } from 'react';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useDeleteSection = () => {
  const run = useHousekeepingCommand('deleteSection');
  return useCallback((sectionId: string) => run({ sectionId }), [run]);
};
