import { staffTransporter } from '@/services/transporters/staff';
import { useStaffMutation } from './useStaffMutation';

export const useUpdateStaff = () => useStaffMutation(staffTransporter.update);
