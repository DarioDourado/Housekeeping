import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useTaskSheets = () =>
  useQuery({ queryKey: queryKeys.housekeeping.sheets(), queryFn: housekeepingTransporter.getSheets });
