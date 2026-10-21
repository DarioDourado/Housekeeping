import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useEvents = () =>
  useQuery({ queryKey: queryKeys.housekeeping.events(), queryFn: housekeepingTransporter.getEvents });
