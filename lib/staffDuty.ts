import type { User } from '@/types/auth.types';

// - Fonte única de "está de serviço hoje?": sem o campo, conta como de serviço (só `false` é folga/ausência).
//   Usar sempre isto em vez de olhar para `isOnDuty` diretamente.
export const isOnDuty = (user: Pick<User, 'isOnDuty'>): boolean => user.isOnDuty !== false;
