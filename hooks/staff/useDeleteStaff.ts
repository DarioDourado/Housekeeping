import { staffTransporter } from '@/services/transporters/staff';
import { useStaffMutation } from './useStaffMutation';

export const useDeleteStaff = () => useStaffMutation(staffTransporter.remove);
