import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useAlerts = () =>
  useQuery({ queryKey: queryKeys.housekeeping.alerts(), queryFn: housekeepingTransporter.getAlerts });
