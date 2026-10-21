import { useQuery } from '@tanstack/react-query';
import { staffTransporter } from '@/services/transporters/staff';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useStaff = () => useQuery({ queryKey: queryKeys.staff.list(), queryFn: staffTransporter.getStaff });
