import { useCallback } from 'react';
import { useEnsureOnDuty, useStaff } from '@/hooks/staff';
import { PlanKind } from '@/types/housekeeping.types';
import { useHousekeepingCommand } from './useHousekeepingCommand';

// - Pôr alguém num bloco (do serviço indicado, manhã por defeito): quem está fora de serviço só entra depois de confirmar que passa a estar de serviço
export const useMoveStaffToBlock = (kind: PlanKind = PlanKind.DAY) => {
  const run = useHousekeepingCommand('moveStaffToBlock');
  const { data: staff = [] } = useStaff();
  const ensureOnDuty = useEnsureOnDuty();

  return useCallback(async (staffId: string, targetBlock: string) => {
    const user = staff.find(person => person.id === staffId);
    if (user && !(await ensureOnDuty(user))) return;
    await run({ staffId, targetBlock, kind });
  }, [run, staff, ensureOnDuty, kind]);
};
