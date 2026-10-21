import type { Permission } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { hasPermission } from '@/lib/permissions';

export const usePermission = (permission: Permission): boolean => {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
};
