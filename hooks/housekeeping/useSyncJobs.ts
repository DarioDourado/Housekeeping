import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useSyncJobs = () =>
  useQuery({ queryKey: queryKeys.housekeeping.syncJobs(), queryFn: housekeepingTransporter.getSyncJobs });
