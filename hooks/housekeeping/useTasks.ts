import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useTasks = () =>
  useQuery({ queryKey: queryKeys.housekeeping.tasks(), queryFn: housekeepingTransporter.getTasks });
