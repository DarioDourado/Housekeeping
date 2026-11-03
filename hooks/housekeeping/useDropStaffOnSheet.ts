import { useCallback } from 'react';
import { useEnsureOnDuty, useStaff } from '@/hooks/staff';
import { useMoveStaffToSheet } from './useMoveStaffToSheet';

// - Largar uma pessoa numa task sheet (vinda da barra de equipas ou de outra sheet): confirma o serviço e move
export const useDropStaffOnSheet = () => {
  const { data: staff = [] } = useStaff();
  const ensureOnDuty = useEnsureOnDuty();
  const moveStaff = useMoveStaffToSheet();

  return useCallback(async (staffId: string, toSheetId: string, fromSheetId?: string) => {
    const user = staff.find(person => person.id === staffId);
    if (user && !(await ensureOnDuty(user))) return;
    await moveStaff(staffId, toSheetId, fromSheetId);
  }, [staff, ensureOnDuty, moveStaff]);
};
