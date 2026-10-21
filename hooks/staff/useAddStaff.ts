import { staffTransporter } from '@/services/transporters/staff';
import { useStaffMutation } from './useStaffMutation';

export const useAddStaff = () => useStaffMutation(staffTransporter.add);
