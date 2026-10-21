import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useStays = () =>
  useQuery({ queryKey: queryKeys.housekeeping.stays(), queryFn: housekeepingTransporter.getStays });
