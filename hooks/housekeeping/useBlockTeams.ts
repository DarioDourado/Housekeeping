import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';
import type { PlanKind } from '@/types/housekeeping.types';

// - Equipas de bloco de um serviço (manhã ou turndown); sem `kind` devolve as de todos
export const useBlockTeams = (kind?: PlanKind) =>
  useQuery({
    queryKey: queryKeys.housekeeping.blockTeams(),
    queryFn: housekeepingTransporter.getBlockTeams,
    select: teams => (kind ? teams.filter(team => team.kind === kind) : teams)
  });
