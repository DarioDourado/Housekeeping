import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useSections = () =>
  useQuery({ queryKey: queryKeys.housekeeping.sections(), queryFn: housekeepingTransporter.getSections });
