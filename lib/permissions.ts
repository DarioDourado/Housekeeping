import { ROLE_PERMISSIONS, type Permission } from '@/config/constants';
import type { UserRole } from '@/types/auth.types';

// - Só UX: o servidor é quem autoriza (08-auth, 34-backend-fastapi)
export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean =>
  role !== undefined && (ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
