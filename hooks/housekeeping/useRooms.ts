import { useQuery } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useRooms = () =>
  useQuery({ queryKey: queryKeys.housekeeping.rooms(), queryFn: housekeepingTransporter.getRooms });
