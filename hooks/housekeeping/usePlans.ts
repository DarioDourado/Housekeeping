import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const usePlans = () =>
  useQuery({ queryKey: queryKeys.housekeeping.plans(), queryFn: housekeepingTransporter.getPlans });
