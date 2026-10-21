import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useBlockTeams = () =>
  useQuery({ queryKey: queryKeys.housekeeping.blockTeams(), queryFn: housekeepingTransporter.getBlockTeams });
