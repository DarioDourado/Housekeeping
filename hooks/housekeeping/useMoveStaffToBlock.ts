import { useCallback } from 'react';
import { useEnsureOnDuty, useStaff } from '@/hooks/staff';
import { useHousekeepingCommand } from './useHousekeepingCommand';

// - Pôr alguém num bloco: quem está fora de serviço só entra depois de confirmar que passa a estar de serviço
export const useMoveStaffToBlock = () => {
  const run = useHousekeepingCommand('moveStaffToBlock');
  const { data: staff = [] } = useStaff();
  const ensureOnDuty = useEnsureOnDuty();

  return useCallback(async (staffId: string, targetBlock: string) => {
    const user = staff.find(person => person.id === staffId);
    if (user && !(await ensureOnDuty(user))) return;
    await run({ staffId, targetBlock });
  }, [run, staff, ensureOnDuty]);
};
