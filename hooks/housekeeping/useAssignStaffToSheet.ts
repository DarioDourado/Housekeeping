import { useCallback } from 'react';
import type { SheetAssignment } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

export const useAssignStaffToSheet = () => {
  const run = useHousekeepingCommand('assignStaffToSheet');
  return useCallback((sheetId: string, assignments: SheetAssignment[]) => run({ sheetId, assignments }), [run]);
};
